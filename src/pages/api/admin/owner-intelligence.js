import {
  ApiError,
  requireAdmin,
} from '../../../lib/auth/requireAdmin';

const SOURCE_META = {
  linker: {
    label: 'Linker Sourced',
  },
  client: {
    label: 'Client Added',
  },
  applicant: {
    label: 'Applicant Sourced',
  },
  shared: {
    label: 'Shared Opportunity',
  },
};

function getRequestSource(request) {
  if (
    request?.request_source ===
    'linker'
  ) {
    return 'linker';
  }

  if (
    request?.request_source ===
    'client'
  ) {
    return 'client';
  }

  return 'shared';
}

function getApplicationSource(
  application,
  requestsById
) {
  if (!application.job_request_id) {
    return 'applicant';
  }

  const request =
    requestsById.get(
      application.job_request_id
    );

  if (
    !request ||
    request.client_id !==
      application.client_id
  ) {
    return 'shared';
  }

  return getRequestSource(request);
}

function getAgeHours(value) {
  if (!value) {
    return null;
  }

  const timestamp =
    new Date(value).getTime();

  if (Number.isNaN(timestamp)) {
    return null;
  }

  return Math.max(
    0,
    Math.floor(
      (
        Date.now() -
        timestamp
      ) /
        (1000 * 60 * 60)
    )
  );
}

function needsAttention(request) {
  if (request.status === 'new') {
    const ageHours =
      getAgeHours(
        request.created_at
      );

    return (
      ageHours !== null &&
      ageHours >= 24
    );
  }

  if (
    request.status ===
    'in_review'
  ) {
    const ageHours =
      getAgeHours(
        request.reviewed_at ||
        request.updated_at ||
        request.created_at
      );

    return (
      ageHours !== null &&
      ageHours >= 48
    );
  }

  return false;
}

function percentage(
  numerator,
  denominator
) {
  if (!denominator) {
    return 0;
  }

  return Math.min(
    100,
    Math.round(
      (
        numerator /
        denominator
      ) * 100
    )
  );
}

export default async function handler(
  req,
  res
) {
  if (req.method !== 'GET') {
    res.setHeader(
      'Allow',
      'GET'
    );

    return res.status(405).json({
      error:
        'Method not allowed.',
    });
  }

  try {
    const {
      profile,
      supabase,
    } = await requireAdmin(req);

    if (
      !['admin', 'owner'].includes(
        profile.role
      )
    ) {
      throw new ApiError(
        403,
        'You do not have access to Owner intelligence.'
      );
    }

    const [
      clientsResult,
      requestsResult,
      applicationsResult,
    ] = await Promise.all([
      supabase
        .from('clients')
        .select('id, status'),

      supabase
        .from(
          'client_job_requests'
        )
        .select(`
          id,
          client_id,
          status,
          request_source,
          reviewed_at,
          created_at,
          updated_at
        `),

      supabase
        .from('applications')
        .select(`
          id,
          client_id,
          job_request_id,
          status,
          applied_at,
          created_at
        `),
    ]);

    if (clientsResult.error) {
      throw new ApiError(
        500,
        'Client intelligence could not be loaded.'
      );
    }

    if (requestsResult.error) {
      throw new ApiError(
        500,
        'Opportunity intelligence could not be loaded.'
      );
    }

    if (
      applicationsResult.error
    ) {
      throw new ApiError(
        500,
        'Application intelligence could not be loaded.'
      );
    }

    const clients =
      clientsResult.data || [];

    const opportunities =
      requestsResult.data || [];

    const applications =
      applicationsResult.data || [];

    const requestsById =
      new Map(
        opportunities.map(
          (request) => [
            request.id,
            request,
          ]
        )
      );

    const sourceStats = {
      linker: {
        opportunities: 0,
        applications: 0,
        interviews: 0,
        offers: 0,
        rejected: 0,
      },
      client: {
        opportunities: 0,
        applications: 0,
        interviews: 0,
        offers: 0,
        rejected: 0,
      },
      applicant: {
        opportunities: null,
        applications: 0,
        interviews: 0,
        offers: 0,
        rejected: 0,
      },
      shared: {
        opportunities: 0,
        applications: 0,
        interviews: 0,
        offers: 0,
        rejected: 0,
      },
    };

    opportunities.forEach(
      (request) => {
        const source =
          getRequestSource(
            request
          );

        sourceStats[source]
          .opportunities += 1;
      }
    );

    applications.forEach(
      (application) => {
        const source =
          getApplicationSource(
            application,
            requestsById
          );

        const stats =
          sourceStats[source];

        stats.applications += 1;

        if (
          application.status ===
          'Interview Scheduled'
        ) {
          stats.interviews += 1;
        }

        if (
          application.status ===
          'Offer Received'
        ) {
          stats.offers += 1;
        }

        if (
          application.status ===
          'Rejected'
        ) {
          stats.rejected += 1;
        }
      }
    );

    const linkedOpportunityIds =
      new Set(
        applications
          .filter(
            (application) => {
              if (
                !application
                  .job_request_id
              ) {
                return false;
              }

              const request =
                requestsById.get(
                  application
                    .job_request_id
                );

              return (
                request &&
                request.client_id ===
                  application.client_id
              );
            }
          )
          .map(
            (application) =>
              application
                .job_request_id
          )
      );

    const totalApplications =
      applications.length;

    const interviews =
      applications.filter(
        (application) =>
          application.status ===
          'Interview Scheduled'
      ).length;

    const offers =
      applications.filter(
        (application) =>
          application.status ===
          'Offer Received'
      ).length;

    const rejected =
      applications.filter(
        (application) =>
          application.status ===
          'Rejected'
      ).length;

    const submitted =
      applications.filter(
        (application) =>
          application.status ===
          'Submitted'
      ).length;

    const waiting =
      applications.filter(
        (application) =>
          application.status ===
          'Waiting'
      ).length;

    const openOpportunities =
      opportunities.filter(
        (request) =>
          [
            'new',
            'in_review',
          ].includes(
            request.status
          )
      ).length;

    const attentionCount =
      opportunities.filter(
        needsAttention
      ).length;

    const totalOpportunities =
      opportunities.length;

    const convertedOpportunities =
      linkedOpportunityIds.size;

    const sources =
      Object.entries(
        sourceStats
      )
        .map(
          ([source, stats]) => {
            const opportunitiesCount =
              stats.opportunities;

            const hasOpportunityBase =
              source === 'linker' ||
              source === 'client';

            return {
              source,
              label:
                SOURCE_META[source]
                  .label,
              opportunities:
                opportunitiesCount,
              applications:
                stats.applications,
              interviews:
                stats.interviews,
              offers:
                stats.offers,
              rejected:
                stats.rejected,
              conversionRate:
                hasOpportunityBase
                  ? percentage(
                      stats.applications,
                      opportunitiesCount
                    )
                  : null,
            };
          }
        );

    res.setHeader(
      'Cache-Control',
      'no-store'
    );

    return res.status(200).json({
      summary: {
        totalClients:
          clients.length,
        activeClients:
          clients.filter(
            (client) =>
              client.status ===
              'active'
          ).length,
        totalOpportunities,
        convertedOpportunities,
        openOpportunities,
        needsAttention:
          attentionCount,
        opportunityConversionRate:
          percentage(
            convertedOpportunities,
            totalOpportunities
          ),
        totalApplications,
        submitted,
        waiting,
        interviews,
        offers,
        rejected,
        interviewRate:
          percentage(
            interviews,
            totalApplications
          ),
        offerRate:
          percentage(
            offers,
            totalApplications
          ),
      },
      sources,
    });
  } catch (error) {
    const statusCode =
      error instanceof ApiError
        ? error.statusCode
        : 500;

    if (statusCode >= 500) {
      console.error(
        'Owner intelligence API error:',
        error
      );
    }

    return res
      .status(statusCode)
      .json({
        error:
          statusCode >= 500
            ? 'Owner intelligence could not be loaded right now.'
            : error.message,
      });
  }
}
