import {
  PortalApiError,
  requirePortalProfile,
} from '../../../lib/auth/requirePortalProfile';

function unique(values) {
  return [
    ...new Set(
      (values || []).filter(Boolean)
    ),
  ];
}

export default async function handler(
  req,
  res
) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');

    return res.status(405).json({
      error: 'Method not allowed.',
    });
  }

  try {
    const {
      profile,
      supabase,
    } = await requirePortalProfile(
      req
    );

    if (
      profile.role !==
      'chief_applicant'
    ) {
      throw new PortalApiError(
        403,
        'Only Chief Applicants can view this supervision workspace.'
      );
    }

    const {
      data: applicantAssignmentRows,
      error: applicantAssignmentsError,
    } = await supabase
      .from(
        'chief_applicant_assignments'
      )
      .select(`
        applicant_id,
        assigned_at
      `)
      .eq(
        'chief_user_id',
        profile.id
      )
      .eq(
        'is_active',
        true
      );

    if (applicantAssignmentsError) {
      console.error(
        'Unable to load Chief Applicant Applicant assignments:',
        applicantAssignmentsError
      );

      throw new PortalApiError(
        500,
        'Your Applicant supervision assignments could not be loaded.'
      );
    }

    const {
      data: linkerAssignmentRows,
      error: linkerAssignmentsError,
    } = await supabase
      .from(
        'chief_linker_assignments'
      )
      .select(`
        linker_user_id,
        assigned_at
      `)
      .eq(
        'chief_user_id',
        profile.id
      )
      .eq(
        'is_active',
        true
      );

    if (linkerAssignmentsError) {
      console.error(
        'Unable to load Chief Applicant Linker assignments:',
        linkerAssignmentsError
      );

      throw new PortalApiError(
        500,
        'Your Linker supervision assignments could not be loaded.'
      );
    }

    const applicantAssignments =
      applicantAssignmentRows || [];

    const linkerAssignments =
      linkerAssignmentRows || [];

    const applicantIds =
      unique(
        applicantAssignments.map(
          (assignment) =>
            assignment.applicant_id
        )
      );

    const linkerUserIds =
      unique(
        linkerAssignments.map(
          (assignment) =>
            assignment.linker_user_id
        )
      );

    let applicantRows = [];

    if (applicantIds.length > 0) {
      const {
        data,
        error,
      } = await supabase
        .from('applicants')
        .select(`
          id,
          user_id,
          work_email,
          availability,
          active_tasks
        `)
        .in(
          'id',
          applicantIds
        );

      if (error) {
        console.error(
          'Unable to load supervised Applicants:',
          error
        );

        throw new PortalApiError(
          500,
          'Your supervised Applicants could not be loaded.'
        );
      }

      applicantRows =
        data || [];
    }

    const applicantUserIds =
      unique(
        applicantRows.map(
          (applicant) =>
            applicant.user_id
        )
      );

    const personnelUserIds =
      unique([
        ...applicantUserIds,
        ...linkerUserIds,
      ]);

    let profileRows = [];

    if (
      personnelUserIds.length > 0
    ) {
      const {
        data,
        error,
      } = await supabase
        .from('profiles')
        .select(`
          id,
          full_name,
          email,
          role,
          account_status
        `)
        .in(
          'id',
          personnelUserIds
        );

      if (error) {
        console.error(
          'Unable to load supervised personnel profiles:',
          error
        );

        throw new PortalApiError(
          500,
          'Your supervised personnel profiles could not be loaded.'
        );
      }

      profileRows =
        data || [];
    }

    const profilesById =
      new Map(
        profileRows.map(
          (person) => [
            person.id,
            person,
          ]
        )
      );

    const {
      data: applicantPerformanceRows,
      error: applicantPerformanceError,
    } = await supabase.rpc(
      'get_applicant_performance'
    );

    if (
      applicantPerformanceError
    ) {
      console.error(
        'Unable to load supervised Applicant performance:',
        applicantPerformanceError
      );

      throw new PortalApiError(
        500,
        'Applicant performance could not be loaded.'
      );
    }

    const applicantPerformanceById =
      new Map(
        (
          applicantPerformanceRows ||
          []
        ).map(
          (performance) => [
            performance.applicant_id,
            performance,
          ]
        )
      );

    const {
      data: linkerPerformanceRows,
      error: linkerPerformanceError,
    } = await supabase.rpc(
      'get_linker_performance'
    );

    if (
      linkerPerformanceError
    ) {
      console.error(
        'Unable to load supervised Linker performance:',
        linkerPerformanceError
      );

      throw new PortalApiError(
        500,
        'Linker performance could not be loaded.'
      );
    }

    const linkerPerformanceById =
      new Map(
        (
          linkerPerformanceRows ||
          []
        ).map(
          (performance) => [
            performance.linker_user_id,
            performance,
          ]
        )
      );

    let linkerRequestRows = [];

    if (linkerUserIds.length > 0) {
      const {
        data,
        error,
      } = await supabase
        .from(
          'client_job_requests'
        )
        .select(`
          submitted_by,
          status
        `)
        .eq(
          'request_source',
          'linker'
        )
        .in(
          'submitted_by',
          linkerUserIds
        );

      if (error) {
        console.error(
          'Unable to load supervised Linker activity:',
          error
        );

        throw new PortalApiError(
          500,
          'Linker activity could not be loaded.'
        );
      }

      linkerRequestRows =
        data || [];
    }

    const applicantAssignedAtById =
      new Map(
        applicantAssignments.map(
          (assignment) => [
            assignment.applicant_id,
            assignment.assigned_at,
          ]
        )
      );

    const linkerAssignedAtById =
      new Map(
        linkerAssignments.map(
          (assignment) => [
            assignment.linker_user_id,
            assignment.assigned_at,
          ]
        )
      );

    const applicants =
      applicantRows.map(
        (applicant) => {
          const person =
            profilesById.get(
              applicant.user_id
            ) || {};

          const performance =
            applicantPerformanceById.get(
              applicant.id
            ) || {};

          return {
            id:
              `applicant:${applicant.id}`,
            personnelId:
              applicant.user_id,
            applicantId:
              applicant.id,
            roleType:
              'Applicant',
            fullName:
              person.full_name ||
              'Unnamed Applicant',
            email:
              person.email ||
              applicant.work_email ||
              '',
            status:
              applicant.availability ||
              'unknown',
            accountStatus:
              person.account_status ||
              'unknown',
            activeWork:
              Number(
                applicant.active_tasks ||
                0
              ),
            completedWork:
              Number(
                performance
                  .completed_tasks ||
                0
              ),
            qualityRating:
              Number(
                performance
                  .quality_rating ||
                0
              ),
            ratingCount:
              Number(
                performance
                  .rating_count ||
                0
              ),
            completionRate:
              Number(
                performance
                  .completion_rate ||
                0
              ),
            assignedAt:
              applicantAssignedAtById.get(
                applicant.id
              ) || null,
          };
        }
      );

    const linkers =
      linkerUserIds.map(
        (linkerUserId) => {
          const person =
            profilesById.get(
              linkerUserId
            ) || {};

          const performance =
            linkerPerformanceById.get(
              linkerUserId
            ) || {};

          const requests =
            linkerRequestRows.filter(
              (request) =>
                request.submitted_by ===
                linkerUserId
            );

          const openRequests =
            requests.filter(
              (request) =>
                [
                  'new',
                  'in_review',
                ].includes(
                  request.status
                )
            ).length;

          return {
            id:
              `linker:${linkerUserId}`,
            personnelId:
              linkerUserId,
            applicantId:
              null,
            roleType:
              'Linker',
            fullName:
              person.full_name ||
              'Unnamed Linker',
            email:
              person.email || '',
            status:
              person.account_status ||
              'unknown',
            accountStatus:
              person.account_status ||
              'unknown',
            activeWork:
              openRequests,
            completedWork:
              requests.length,
            qualityRating:
              Number(
                performance
                  .quality_rating ||
                0
              ),
            ratingCount:
              Number(
                performance
                  .rating_count ||
                0
              ),
            completionRate:
              null,
            assignedAt:
              linkerAssignedAtById.get(
                linkerUserId
              ) || null,
          };
        }
      );

    const members = [
      ...applicants,
      ...linkers,
    ].sort(
      (a, b) =>
        a.fullName.localeCompare(
          b.fullName
        )
    );

    const ratedWorkItems =
      members.reduce(
        (total, member) =>
          total +
          Number(
            member.ratingCount || 0
          ),
        0
      );

    return res.status(200).json({
      members,
      summary: {
        teamMembers:
          members.length,
        applicants:
          applicants.length,
        linkers:
          linkers.length,
        ratedMembers:
          members.filter(
            (member) =>
              Number(
                member.ratingCount ||
                0
              ) > 0
          ).length,
        ratedWorkItems,
      },
    });
  } catch (error) {
    const statusCode =
      error instanceof
      PortalApiError
        ? error.statusCode
        : 500;

    if (statusCode >= 500) {
      console.error(
        'Chief Applicant team API error:',
        error
      );
    }

    return res
      .status(statusCode)
      .json({
        error:
          statusCode >= 500
            ? 'Unable to load your supervision team right now.'
            : error.message,
      });
  }
}
