import {
  PortalApiError,
} from '../../../../lib/auth/requirePortalProfile';
import {
  cleanDraftValue,
  requireApplicantDraftContext,
  serializeApplicationDraft,
} from '../../../../lib/applicants/applicationDrafts';

function getDraftId(req) {
  const id =
    Array.isArray(
      req.query.id
    )
      ? req.query.id[0]
      : req.query.id;

  if (!id) {
    throw new PortalApiError(
      400,
      'An Application Draft ID is required.'
    );
  }

  return id;
}

async function loadDraft({
  supabase,
  applicantId,
  draftId,
}) {
  const {
    data,
    error,
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
      applicantId
    )
    .maybeSingle();

  if (error) {
    throw new PortalApiError(
      500,
      'The application could not be loaded.'
    );
  }

  if (!data) {
    throw new PortalApiError(
      404,
      'The application could not be found.'
    );
  }

  return data;
}

async function getDraft(
  req,
  res
) {
  const {
    applicant,
    supabase,
  } =
    await requireApplicantDraftContext(
      req
    );

  const draft =
    await loadDraft({
      supabase,
      applicantId:
        applicant.id,
      draftId:
        getDraftId(req),
    });

  return res
    .status(200)
    .json({
      draft:
        serializeApplicationDraft(
          draft
        ),
    });
}

async function updateDraft(
  req,
  res
) {
  const {
    applicant,
    supabase,
  } =
    await requireApplicantDraftContext(
      req
    );

  const draftId =
    getDraftId(req);

  const current =
    await loadDraft({
      supabase,
      applicantId:
        applicant.id,
      draftId,
    });

  if (
    current.status ===
      'applied' ||
    current.status ===
      'cancelled'
  ) {
    throw new PortalApiError(
      409,
      'This application is no longer editable.'
    );
  }

  const body =
    req.body || {};

  const updates = {};

  const fieldMap = [
    [
      'company',
      'company',
      300,
    ],
    [
      'position',
      'position',
      300,
    ],
    [
      'location',
      'location',
      300,
    ],
    [
      'jobUrl',
      'job_url',
      2000,
    ],
    [
      'jobDescription',
      'job_description',
      30000,
    ],
  ];

  let jobDetailsChanged =
    false;

  fieldMap.forEach(
    ([
      requestKey,
      databaseKey,
      maxLength,
    ]) => {
      if (
        Object.prototype
          .hasOwnProperty.call(
            body,
            requestKey
          )
      ) {
        const nextValue =
          cleanDraftValue(
            body[requestKey],
            maxLength
          );

        updates[
          databaseKey
        ] = nextValue;

        if (
          nextValue !==
          String(
            current[
              databaseKey
            ] || ''
          )
        ) {
          jobDetailsChanged =
            true;
        }
      }
    }
  );

  if (
    body.cancel === true
  ) {
    updates.status =
      'cancelled';
  }

  /*
   * Any change to the opportunity
   * invalidates previous AI work.
   *
   * This prevents a score, tailored
   * resume or ATS audit from being
   * displayed for an older JD.
   */
  if (jobDetailsChanged) {
    Object.assign(
      updates,
      {
        status:
          'active',

        fit_status:
          'not_started',

        applicability_score:
          null,

        applicability_directive:
          null,

        preference_alignment:
          [],

        fit_analysis:
          {},

        resume_status:
          'not_started',

        tailored_resume_text:
          null,

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
      }
    );
  }

  if (
    Object.keys(
      updates
    ).length === 0
  ) {
    return res
      .status(200)
      .json({
        draft:
          serializeApplicationDraft(
            current
          ),
      });
  }

  const {
    data: updated,
    error,
  } = await supabase
    .from(
      'application_drafts'
    )
    .update(
      updates
    )
    .eq(
      'id',
      draftId
    )
    .eq(
      'applicant_id',
      applicant.id
    )
    .select('*')
    .single();

  if (
    error ||
    !updated
  ) {
    console.error(
      'Unable to update Application Draft:',
      error
    );

    throw new PortalApiError(
      500,
      'The application could not be saved.'
    );
  }

  return res
    .status(200)
    .json({
      draft:
        serializeApplicationDraft(
          updated
        ),
    });
}

export default async function handler(
  req,
  res
) {
  if (
    ![
      'GET',
      'PATCH',
    ].includes(
      req.method
    )
  ) {
    res.setHeader(
      'Allow',
      'GET, PATCH'
    );

    return res
      .status(405)
      .json({
        error:
          'Method not allowed.',
      });
  }

  try {
    if (
      req.method === 'GET'
    ) {
      return await getDraft(
        req,
        res
      );
    }

    return await updateDraft(
      req,
      res
    );
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
        'Application Draft detail API error:',
        error
      );
    }

    return res
      .status(statusCode)
      .json({
        error:
          statusCode >= 500
            ? 'The application could not be saved right now.'
            : error.message,
      });
  }
}
