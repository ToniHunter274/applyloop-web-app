import {
  createHash,
} from 'crypto';

import {
  PortalApiError,
} from '../../../../../lib/auth/requirePortalProfile';

import {
  requireApplicantDraftContext,
  serializeApplicationDraft,
  verifyAssignedClient,
} from '../../../../../lib/applicants/applicationDrafts';

import {
  extractResumeTextFromUrl,
} from '../../../../../lib/ai/extractResumeText';

import {
  generateTailoredResumeText,
} from '../../../../../lib/ai/generateTailoredResume';


const MIN_JOB_DESCRIPTION_LENGTH =
  80;


function parseList(value) {
  if (
    Array.isArray(value)
  ) {
    return value
      .map(
        (item) =>
          String(
            item || ''
          ).trim()
      )
      .filter(Boolean);
  }

  if (!value) {
    return [];
  }

  return String(value)
    .split(/[\n,]/)
    .map(
      (item) =>
        item.trim()
    )
    .filter(Boolean);
}


function getTargetRoles(
  answers = {}
) {
  if (
    Array.isArray(
      answers.settingsJobs
    ) &&
    answers.settingsJobs.length >
      0
  ) {
    return answers.settingsJobs
      .map(
        (job) =>
          typeof job ===
            'string'
            ? job
            : job?.title
      )
      .filter(Boolean);
  }

  return parseList(
    answers.targetRoles
  );
}


function getDraftId(req) {
  const value =
    Array.isArray(
      req.query.id
    )
      ? req.query.id[0]
      : req.query.id;

  if (!value) {
    throw new PortalApiError(
      400,
      'An Application Draft ID is required.'
    );
  }

  return value;
}


export default async function handler(
  req,
  res
) {
  if (
    req.method !== 'POST'
  ) {
    res.setHeader(
      'Allow',
      'POST'
    );

    return res
      .status(405)
      .json({
        error:
          'Method not allowed.',
      });
  }

  let supabase = null;
  let draftId = null;
  let aiJobId = null;
  let generationStarted =
    false;

  try {
    const context =
      await requireApplicantDraftContext(
        req
      );

    supabase =
      context.supabase;

    draftId =
      getDraftId(req);


    const {
      data: draft,
      error: draftError,
    } = await supabase
      .from(
        'application_drafts'
      )
      .select('*')
      .eq(
        'id',
        draftId
      )
      .eq(
        'applicant_id',
        context
          .applicant
          .id
      )
      .maybeSingle();


    if (
      draftError ||
      !draft
    ) {
      throw new PortalApiError(
        404,
        'The application could not be found.'
      );
    }


    if (
      ![
        'active',
        'ready_to_apply',
      ].includes(
        draft.status
      )
    ) {
      throw new PortalApiError(
        409,
        'This application is no longer editable.'
      );
    }


    if (
      !draft.company?.trim() ||
      !draft.position?.trim() ||
      !draft.location?.trim() ||
      !/^https?:\/\/\S+/i.test(
        draft.job_url || ''
      ) ||
      String(
        draft.job_description ||
          ''
      )
        .trim()
        .length <
        MIN_JOB_DESCRIPTION_LENGTH
    ) {
      throw new PortalApiError(
        400,
        'Complete the job details before generating the tailored resume.'
      );
    }


    if (
      draft.fit_status !==
      'completed'
    ) {
      throw new PortalApiError(
        409,
        'Check Job Fit before generating the tailored resume.'
      );
    }


    if (!process.env.HF_TOKEN) {
      throw new PortalApiError(
        503,
        'AI resume generation is not configured.'
      );
    }


    await verifyAssignedClient({
      supabase,

      applicantId:
        context.applicant.id,

      clientId:
        draft.client_id,
    });


    const {
      data: client,
      error: clientError,
    } = await supabase
      .from('clients')
      .select(`
        id,
        user_id,
        resume_path,
        status,
        address
      `)
      .eq(
        'id',
        draft.client_id
      )
      .maybeSingle();


    if (
      clientError ||
      !client
    ) {
      throw new PortalApiError(
        404,
        'The Client could not be found.'
      );
    }


    if (
      client.status !==
      'active'
    ) {
      throw new PortalApiError(
        400,
        'Tailored resumes can only be generated for active Clients.'
      );
    }


    if (
      !client.resume_path
    ) {
      throw new PortalApiError(
        400,
        'This Client does not have a resume on file.'
      );
    }


    const [
      profileResult,
      onboardingResult,
    ] =
      await Promise.all([
        supabase
          .from('profiles')
          .select(`
            full_name,
            country
          `)
          .eq(
            'id',
            client.user_id
          )
          .single(),

        supabase
          .from(
            'client_onboarding_forms'
          )
          .select(`
            answers,
            status
          `)
          .eq(
            'user_id',
            client.user_id
          )
          .maybeSingle(),
      ]);


    if (
      profileResult.error
    ) {
      throw new PortalApiError(
        500,
        'The Client profile could not be loaded.'
      );
    }


    if (
      onboardingResult.error
    ) {
      throw new PortalApiError(
        500,
        'The Client career preferences could not be loaded.'
      );
    }


    const answers =
      onboardingResult.data
        ?.answers || {};


    /*
     * Search context helps relevance,
     * but it is not factual evidence.
     *
     * The source resume remains the
     * factual source of truth.
     */
    const clientContext = {
      name:
        answers.fullName ||
        profileResult.data
          ?.full_name ||
        'Client',

      currentLocation:
        answers.currentLocation ||
        client.address ||
        'Not provided',

      targetRoles:
        getTargetRoles(
          answers
        ),

      targetMarkets:
        Array.isArray(
          answers.targetMarkets
        )
          ? answers.targetMarkets
          : [],

      preferredLocations:
        parseList(
          answers.settingsLocations ??
          answers.preferredLocations
        ),

      targetIndustries:
        answers.settingsIndustry ??
        answers.targetIndustries ??
        'Not provided',

      specialization:
        answers.settingsSpecialization ??
        answers.specialization ??
        'Not provided',

      workArrangement:
        answers.settingsWorkType ??
        answers.workArrangement ??
        'Not provided',

      employmentType:
        answers.settingsSchedule ??
        answers.employmentType ??
        'Not provided',

      additionalPreferences:
        answers.additionalPreferences ||
        'Not provided',
    };


    const {
      data: signedUrlData,
      error: signedUrlError,
    } =
      await supabase.storage
        .from(
          'client-resumes'
        )
        .createSignedUrl(
          client.resume_path,
          300
        );


    if (
      signedUrlError ||
      !signedUrlData
        ?.signedUrl
    ) {
      throw new PortalApiError(
        500,
        'The Client resume could not be prepared for tailoring.'
      );
    }


    const {
      data: activeJob,
      error: activeJobError,
    } = await supabase
      .from(
        'application_draft_ai_jobs'
      )
      .select(`
        id,
        status
      `)
      .eq(
        'draft_id',
        draft.id
      )
      .eq(
        'job_type',
        'resume_generation'
      )
      .in(
        'status',
        [
          'queued',
          'running',
        ]
      )
      .maybeSingle();


    if (activeJobError) {
      throw new PortalApiError(
        500,
        'The resume-generation queue could not be checked.'
      );
    }


    if (activeJob) {
      throw new PortalApiError(
        409,
        'A tailored resume is already generating for this application.'
      );
    }


    const model =
      process.env.HF_MODEL ||
      'openai/gpt-oss-120b:groq';


    const requestFingerprint =
      createHash(
        'sha256'
      )
        .update(
          JSON.stringify({
            draftId:
              draft.id,

            company:
              draft.company,

            position:
              draft.position,

            location:
              draft.location,

            jobUrl:
              draft.job_url,

            jobDescription:
              draft.job_description,

            resumePath:
              client.resume_path,

            clientContext,
          })
        )
        .digest('hex');


    const {
      data: aiJob,
      error: aiJobError,
    } = await supabase
      .from(
        'application_draft_ai_jobs'
      )
      .insert({
        draft_id:
          draft.id,

        job_type:
          'resume_generation',

        status:
          'running',

        provider:
          'huggingface',

        model,

        request_fingerprint:
          requestFingerprint,

        attempt_count:
          1,

        started_at:
          new Date()
            .toISOString(),
      })
      .select(`
        id
      `)
      .single();


    if (
      aiJobError ||
      !aiJob
    ) {
      if (
        aiJobError?.code ===
        '23505'
      ) {
        throw new PortalApiError(
          409,
          'A tailored resume is already generating for this application.'
        );
      }

      throw new PortalApiError(
        500,
        'Resume generation could not be started.'
      );
    }


    aiJobId =
      aiJob.id;

    generationStarted =
      true;


    await supabase
      .from(
        'application_drafts'
      )
      .update({
        resume_status:
          'generating',

        resume_analysis:
          {},

        resume_reviewed_at:
          null,

        audit_status:
          'not_started',

        ats_score:
          null,

        ats_audit:
          {},

        last_error:
          null,
      })
      .eq(
        'id',
        draft.id
      );


    let sourceResumeText;

    try {
      sourceResumeText =
        await extractResumeTextFromUrl({
          url:
            signedUrlData
              .signedUrl,

          path:
            client.resume_path,
        });
    } catch (error) {
      throw new PortalApiError(
        422,
        error?.message ||
          'The Client resume could not be read for tailoring.'
      );
    }


    const generated =
      await generateTailoredResumeText({
        sourceResumeText,

        company:
          draft.company,

        position:
          draft.position,

        location:
          draft.location,

        jobUrl:
          draft.job_url,

        jobDescription:
          draft.job_description,

        clientContext,
      });


    const {
      data: updatedDraft,
      error: updateError,
    } = await supabase
      .from(
        'application_drafts'
      )
      .update({
        resume_status:
          'completed',

        tailored_resume_text:
          generated
            .resumeText,

        resume_analysis:
          {},

        resume_reviewed_at:
          null,

        audit_status:
          'not_started',

        ats_score:
          null,

        ats_audit:
          {},

        last_error:
          null,
      })
      .eq(
        'id',
        draft.id
      )
      .select('*')
      .single();


    if (
      updateError ||
      !updatedDraft
    ) {
      throw new PortalApiError(
        500,
        'The tailored resume was generated but could not be saved.'
      );
    }


    const jobResult = {
      provider:
        generated.provider,

      model:
        generated.model,

      generatedAt:
        generated.generatedAt,

      characterCount:
        generated
          .resumeText
          .length,
    };


    await supabase
      .from(
        'application_draft_ai_jobs'
      )
      .update({
        status:
          'completed',

        result:
          jobResult,

        error_message:
          null,

        completed_at:
          generated
            .generatedAt,
      })
      .eq(
        'id',
        aiJobId
      );


    return res
      .status(200)
      .json({
        draft:
          serializeApplicationDraft(
            updatedDraft
          ),

        generation:
          jobResult,
      });
  } catch (error) {
    const statusCode =
      error instanceof
        PortalApiError
        ? error.statusCode
        : Number(
            error?.statusCode
          ) || 500;

    const message =
      error?.message ||
      'The tailored resume could not be generated right now.';


    if (
      generationStarted &&
      supabase &&
      draftId
    ) {
      await supabase
        .from(
          'application_drafts'
        )
        .update({
          resume_status:
            'failed',

          last_error:
            message.slice(
              0,
              2000
            ),
        })
        .eq(
          'id',
          draftId
        );
    }


    if (
      generationStarted &&
      supabase &&
      aiJobId
    ) {
      await supabase
        .from(
          'application_draft_ai_jobs'
        )
        .update({
          status:
            'failed',

          error_message:
            message.slice(
              0,
              2000
            ),

          completed_at:
            new Date()
              .toISOString(),
        })
        .eq(
          'id',
          aiJobId
        );
    }


    if (
      statusCode >= 500
    ) {
      console.error(
        'Application Draft resume generation error:',
        error
      );
    }


    return res
      .status(statusCode)
      .json({
        error:
          statusCode >= 500
            ? 'The tailored resume could not be generated right now.'
            : message,
      });
  }
}
