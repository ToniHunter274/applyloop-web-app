import {
  PortalApiError,
  requirePortalProfile,
} from '../../../lib/auth/requirePortalProfile';
import {
  extractResumeTextFromUrl,
} from '../../../lib/ai/extractResumeText';
import {
  generateTailoredResumeText,
} from '../../../lib/ai/generateTailoredResume';

const MIN_JOB_DESCRIPTION_LENGTH = 80;

function clean(value, maxLength = 30000) {
  return String(value || '')
    .trim()
    .slice(0, maxLength);
}

function parseList(value) {
  if (Array.isArray(value)) {
    return value
      .map((item) =>
        clean(item, 200)
      )
      .filter(Boolean);
  }

  if (!value) {
    return [];
  }

  return String(value)
    .split(/[\n,]/)
    .map((item) =>
      item.trim()
    )
    .filter(Boolean);
}

function getTargetRoles(answers = {}) {
  if (
    Array.isArray(
      answers.settingsJobs
    ) &&
    answers.settingsJobs.length > 0
  ) {
    return answers.settingsJobs
      .map((job) =>
        typeof job === 'string'
          ? job
          : job?.title
      )
      .filter(Boolean);
  }

  return parseList(
    answers.targetRoles
  );
}

export default async function handler(
  req,
  res
) {
  if (req.method !== 'POST') {
    res.setHeader(
      'Allow',
      'POST'
    );

    return res.status(405).json({
      error: 'Method not allowed.',
    });
  }

  try {
    const {
      profile,
      supabase,
    } =
      await requirePortalProfile(
        req
      );

    if (
      profile.role !==
      'applicant'
    ) {
      throw new PortalApiError(
        403,
        'Only Applicants can generate tailored resumes.'
      );
    }

    const clientId =
      clean(
        req.body?.clientId,
        100
      );

    const company =
      clean(
        req.body?.company,
        300
      );

    const position =
      clean(
        req.body?.position,
        300
      );

    const location =
      clean(
        req.body?.location,
        300
      );

    const jobUrl =
      clean(
        req.body?.jobUrl,
        2000
      );

    const jobDescription =
      clean(
        req.body?.jobDescription,
        30000
      );

    if (!clientId) {
      throw new PortalApiError(
        400,
        'Select a Client first.'
      );
    }

    if (
      !company ||
      !position
    ) {
      throw new PortalApiError(
        400,
        'Company name and position are required.'
      );
    }

    if (
      jobDescription.length <
      MIN_JOB_DESCRIPTION_LENGTH
    ) {
      throw new PortalApiError(
        400,
        'Paste a fuller job description before generating the tailored resume.'
      );
    }

    const {
      data: applicant,
      error: applicantError,
    } = await supabase
      .from('applicants')
      .select('id')
      .eq(
        'user_id',
        profile.id
      )
      .single();

    if (
      applicantError ||
      !applicant
    ) {
      throw new PortalApiError(
        404,
        'Your Applicant record could not be found.'
      );
    }

    const {
      data: assignment,
      error: assignmentError,
    } = await supabase
      .from(
        'client_applicant_assignments'
      )
      .select('client_id')
      .eq(
        'applicant_id',
        applicant.id
      )
      .eq(
        'client_id',
        clientId
      )
      .maybeSingle();

    if (assignmentError) {
      throw new PortalApiError(
        500,
        'The Client assignment could not be verified.'
      );
    }

    if (!assignment) {
      throw new PortalApiError(
        403,
        'This Client is not assigned to you.'
      );
    }

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
        linkedin_url,
        portfolio_url,
        address
      `)
      .eq(
        'id',
        clientId
      )
      .single();

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
    ] = await Promise.all([
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

    const answers =
      onboardingResult.data
        ?.answers || {};

    /*
     * This context intentionally excludes
     * protected/sensitive characteristics.
     *
     * The uploaded resume remains the
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
        answers.employmentType ||
        'Not provided',

      yearsExperience:
        answers.yearsExperience ||
        'Not provided',

      linkedinUrl:
        client.linkedin_url ||
        answers.linkedinUrl ||
        '',

      portfolioUrl:
        client.portfolio_url ||
        answers.portfolioUrl ||
        '',

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

    if (!process.env.HF_TOKEN) {
      return res.status(200).json({
        mode: 'placeholder',
        resumeUrl:
          signedUrlData.signedUrl,
        message:
          'Showing the Client submitted resume as a temporary preview until AI tailoring is configured.',
      });
    }

    let sourceResumeText;

    try {
      sourceResumeText =
        await extractResumeTextFromUrl({
          url:
            signedUrlData.signedUrl,
          path:
            client.resume_path,
        });
    } catch (resumeError) {
      throw new PortalApiError(
        422,
        resumeError?.message ||
          'The Client resume could not be read for tailoring.'
      );
    }

    const generated =
      await generateTailoredResumeText({
        sourceResumeText,

        company,

        position,

        location,

        jobUrl,

        jobDescription,

        clientContext,
      });

    return res
      .status(200)
      .json({
        resumeText:
          generated.resumeText,

        model:
          generated.model,

        provider:
          generated.provider,

        generatedAt:
          generated.generatedAt,
      });
  } catch (error) {
    const statusCode =
      error instanceof
      PortalApiError
        ? error.statusCode
        : 500;

    if (
      statusCode >= 500
    ) {
      console.error(
        'Applicant tailored resume API error:',
        error?.message ||
          error
      );
    }

    return res
      .status(statusCode)
      .json({
        error:
          error?.message ||
          'Unable to generate the tailored resume right now.',
      });
  }
}
