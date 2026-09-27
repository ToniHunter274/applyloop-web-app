import {
  PortalApiError,
  requirePortalProfile,
} from '../auth/requirePortalProfile';

export function cleanDraftValue(
  value,
  maxLength = 30000
) {
  return String(value || '')
    .trim()
    .slice(0, maxLength);
}

export async function requireApplicantDraftContext(
  req
) {
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
      'Only Applicants can manage application drafts.'
    );
  }

  const {
    data: applicant,
    error,
  } = await supabase
    .from('applicants')
    .select(`
      id,
      user_id
    `)
    .eq(
      'user_id',
      profile.id
    )
    .single();

  if (
    error ||
    !applicant
  ) {
    throw new PortalApiError(
      404,
      'Your Applicant record could not be found.'
    );
  }

  return {
    profile,
    applicant,
    supabase,
  };
}

export async function verifyAssignedClient({
  supabase,
  applicantId,
  clientId,
}) {
  const {
    data: assignment,
    error,
  } = await supabase
    .from(
      'client_applicant_assignments'
    )
    .select(`
      client_id
    `)
    .eq(
      'applicant_id',
      applicantId
    )
    .eq(
      'client_id',
      clientId
    )
    .maybeSingle();

  if (error) {
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
}

export function serializeApplicationDraft(
  draft
) {
  if (!draft) {
    return null;
  }

  return {
    id:
      draft.id,

    applicantId:
      draft.applicant_id,

    clientId:
      draft.client_id,

    jobRequestId:
      draft.job_request_id,

    applicationId:
      draft.application_id,

    origin:
      draft.origin,

    company:
      draft.company || '',

    position:
      draft.position || '',

    location:
      draft.location || '',

    jobUrl:
      draft.job_url || '',

    jobDescription:
      draft.job_description || '',

    status:
      draft.status,

    fitStatus:
      draft.fit_status,

    applicabilityScore:
      draft.applicability_score,

    applicabilityDirective:
      draft.applicability_directive ||
      '',

    preferenceAlignment:
      draft.preference_alignment ||
      [],

    fitAnalysis:
      draft.fit_analysis ||
      {},

    resumeStatus:
      draft.resume_status,

    tailoredResumeText:
      draft.tailored_resume_text ||
      '',

    resumeAnalysis:
      draft.resume_analysis ||
      {},

    resumeReviewedAt:
      draft.resume_reviewed_at,

    auditStatus:
      draft.audit_status,

    atsScore:
      draft.ats_score,

    atsAudit:
      draft.ats_audit ||
      {},

    lastError:
      draft.last_error ||
      '',

    createdAt:
      draft.created_at,

    updatedAt:
      draft.updated_at,
  };
}
