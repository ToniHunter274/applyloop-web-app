import {
  PortalApiError,
  requirePortalProfile,
} from '../../../lib/auth/requirePortalProfile';

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

function extractResponseText(payload) {
  if (
    typeof payload?.output_text ===
      'string' &&
    payload.output_text.trim()
  ) {
    return payload.output_text.trim();
  }

  return (payload?.output || [])
    .flatMap(
      (item) =>
        item?.content || []
    )
    .filter(
      (part) =>
        part?.type ===
        'output_text'
    )
    .map(
      (part) =>
        part?.text || ''
    )
    .join('\n')
    .trim();
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

    if (
      !process.env.OPENAI_API_KEY
    ) {
      throw new PortalApiError(
        503,
        'Tailored resume generation is not configured yet.'
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

    const instructions = `
You are ApplyLoop's professional resume tailoring engine.

Your task is to create an ATS-friendly resume tailored specifically to the supplied job description.

The attached Client resume is the factual source of truth for employment history, job titles, dates, education, qualifications, credentials, skills, achievements and professional experience.

STRICT FACTUAL INTEGRITY RULES:

- Never invent employment history.
- Never invent employers.
- Never invent job titles.
- Never invent employment dates.
- Never invent education, degrees, qualifications or certifications.
- Never invent tools, technologies or technical skills.
- Never invent metrics or quantified achievements.
- Never invent responsibilities or accomplishments.
- Never claim that the Client has experience simply because the job description requests it.
- Do not transform a preference into a qualification.
- Client career preferences may guide emphasis, but they are not factual evidence of experience.
- You may reorganize, shorten and professionally rewrite facts that are genuinely supported by the source resume.
- Prioritize truthful experience relevant to the target job.
- Preserve accurate identity and contact information found in the source resume.
- Do not include gender, disability, veteran status, age, race, religion, marital status, health information or other protected personal characteristics.
- Do not mention that AI generated the resume.
- Do not explain what you changed.
- Return only the completed resume.
- Use clean plain text.
- Use ATS-friendly section headings.
- Do not use markdown code fences.
`.trim();

    const jobContext = `
TARGET OPPORTUNITY

Company:
${company}

Position:
${position}

Location:
${location || 'Not provided'}

Job posting URL:
${jobUrl || 'Not provided'}

JOB DESCRIPTION

${jobDescription}

CLIENT CAREER CONTEXT

${JSON.stringify(
  clientContext,
  null,
  2
)}

Create the strongest truthful tailored resume for this opportunity while following every factual-integrity rule above.
`.trim();

    const model =
      process.env
        .OPENAI_RESUME_MODEL ||
      'gpt-5.6-terra';

    const openAiResponse =
      await fetch(
        'https://api.openai.com/v1/responses',
        {
          method: 'POST',

          headers: {
            Authorization:
              `Bearer ${process.env.OPENAI_API_KEY}`,

            'Content-Type':
              'application/json',
          },

          body: JSON.stringify({
            model,

            store: false,

            instructions,

            max_output_tokens:
              7000,

            input: [
              {
                role: 'user',

                content: [
                  {
                    type:
                      'input_text',

                    text:
                      jobContext,
                  },

                  {
                    type:
                      'input_file',

                    file_url:
                      signedUrlData
                        .signedUrl,
                  },
                ],
              },
            ],
          }),
        }
      );

    const payload =
      await openAiResponse
        .json()
        .catch(() => ({}));

    if (
      !openAiResponse.ok
    ) {
      console.error(
        'Tailored resume OpenAI request failed:',
        openAiResponse.status,
        payload?.error
          ?.type ||
          'openai_error'
      );

      throw new PortalApiError(
        502,
        payload?.error
          ?.message ||
          'The tailored resume could not be generated right now.'
      );
    }

    const resumeText =
      extractResponseText(
        payload
      );

    if (!resumeText) {
      throw new PortalApiError(
        502,
        'The AI service returned an empty resume. Please try again.'
      );
    }

    return res
      .status(200)
      .json({
        resumeText,

        model,

        generatedAt:
          new Date()
            .toISOString(),
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
