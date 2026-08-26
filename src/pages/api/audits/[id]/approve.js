import {
  PortalApiError,
  requirePortalProfile,
} from '../../../../lib/auth/requirePortalProfile';

const AUDIT_ROLES = new Set([
  'team_auditor',
  'chief_auditor',
]);

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function getDisplayId(id) {
  return `AUD-${String(id)
    .slice(0, 8)
    .toUpperCase()}`;
}

async function approveAudit(
  req,
  res
) {
  const {
    profile,
    supabase,
  } =
    await requirePortalProfile(
      req
    );

  if (
    !AUDIT_ROLES.has(
      profile.role
    )
  ) {
    throw new PortalApiError(
      403,
      'You do not have access to audits.'
    );
  }

  const id =
    Array.isArray(req.query.id)
      ? req.query.id[0]
      : req.query.id;

  if (
    !id ||
    !UUID_PATTERN.test(id)
  ) {
    throw new PortalApiError(
      400,
      'A valid audit ID is required.'
    );
  }

  const qualityScore =
    Number(
      req.body?.qualityScore
    );

  const comments =
    typeof req.body?.comments ===
    'string'
      ? req.body.comments.trim()
      : '';

  if (
    !Number.isInteger(
      qualityScore
    ) ||
    qualityScore < 0 ||
    qualityScore > 100
  ) {
    throw new PortalApiError(
      400,
      'Quality score must be an integer between 0 and 100.'
    );
  }

  if (
    comments.length > 5000
  ) {
    throw new PortalApiError(
      400,
      'Audit comments cannot exceed 5000 characters.'
    );
  }

  const {
    data,
    error,
  } = await supabase.rpc(
    'pass_application_audit',
    {
      p_audit_id: id,
      p_actor_user_id:
        profile.id,
      p_quality_score:
        qualityScore,
      p_comments:
        comments || null,
    }
  );

  if (error) {
    if (
      error.code === '42501'
    ) {
      throw new PortalApiError(
        403,
        error.message
      );
    }

    if (
      error.code === 'P0002'
    ) {
      throw new PortalApiError(
        404,
        'The audit could not be found.'
      );
    }

    if (
      error.code === '22023'
    ) {
      throw new PortalApiError(
        400,
        error.message
      );
    }

    console.error(
      'Pass audit RPC error:',
      error
    );

    throw new PortalApiError(
      500,
      'The audit could not be passed.'
    );
  }

  const audit =
    Array.isArray(data)
      ? data[0]
      : data;

  if (!audit) {
    throw new PortalApiError(
      500,
      'The audit result could not be loaded.'
    );
  }

  return res.status(200).json({
    audit: {
      id: audit.id,
      displayId:
        getDisplayId(
          audit.id
        ),
      status: audit.status,
      priority:
        audit.priority,
      source: audit.source,
      qualityScore:
        audit.quality_score,
      comments:
        audit.comments,
      startedAt:
        audit.started_at,
      completedAt:
        audit.completed_at,
      createdAt:
        audit.created_at,
      updatedAt:
        audit.updated_at,
    },
  });
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
      error:
        'Method not allowed.',
    });
  }

  try {
    return await approveAudit(
      req,
      res
    );
  } catch (error) {
    const statusCode =
      error instanceof
      PortalApiError
        ? error.statusCode
        : 500;

    if (statusCode >= 500) {
      console.error(
        'Pass audit API error:',
        error
      );
    }

    return res
      .status(statusCode)
      .json({
        error:
          statusCode >= 500
            ? 'Unable to pass the audit right now.'
            : error.message,
      });
  }
}
