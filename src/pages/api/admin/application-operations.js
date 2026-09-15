import {
  ApiError,
  requireAdmin,
} from '../../../lib/auth/requireAdmin';

function unique(values) {
  return [
    ...new Set(
      values.filter(Boolean)
    ),
  ];
}

function getProfileName(
  profilesById,
  profileId,
  fallback
) {
  return (
    profilesById.get(profileId)
      ?.full_name ||
    fallback
  );
}

function getApplicationOrigin(
  application,
  jobRequestsById
) {
  if (!application.job_request_id) {
    return {
      origin: 'applicant',
      originLabel:
        'Applicant Sourced',
    };
  }

  const request =
    jobRequestsById.get(
      application.job_request_id
    );

  if (
    request?.request_source ===
    'linker'
  ) {
    return {
      origin: 'linker',
      originLabel:
        'Linker Sourced',
    };
  }

  if (
    request?.request_source ===
    'client'
  ) {
    return {
      origin: 'client',
      originLabel:
        'Client Added',
    };
  }

  return {
    origin: 'shared',
    originLabel:
      'Shared Opportunity',
  };
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
      supabase,
    } = await requireAdmin(req);

    const {
      data: applicationRows,
      error: applicationsError,
    } = await supabase
      .from('applications')
      .select(`
        id,
        client_id,
        job_request_id,
        created_by,
        company,
        position,
        status,
        applied_at,
        created_at,
        updated_at
      `)
      .order('applied_at', {
        ascending: false,
      });

    if (applicationsError) {
      throw new ApiError(
        500,
        'Applications could not be loaded.'
      );
    }

    const applications =
      applicationRows || [];

    if (applications.length === 0) {
      res.setHeader(
        'Cache-Control',
        'no-store'
      );

      return res.status(200).json({
        applications: [],
        conversations: [],
        summary: {
          totalApplications: 0,
          submitted: 0,
          waiting: 0,
          interviews: 0,
          offers: 0,
          rejected: 0,
          feedbackConversations: 0,
          feedbackPending: 0,
          feedbackResolved: 0,
        },
      });
    }

    const applicationIds =
      applications.map(
        (application) =>
          application.id
      );

    const clientIds = unique(
      applications.map(
        (application) =>
          application.client_id
      )
    );

    const applicantUserIds =
      unique(
        applications.map(
          (application) =>
            application.created_by
        )
      );

    const jobRequestIds =
      unique(
        applications.map(
          (application) =>
            application.job_request_id
        )
      );

    let jobRequests = [];

    if (jobRequestIds.length > 0) {
      const {
        data,
        error,
      } = await supabase
        .from('client_job_requests')
        .select(`
          id,
          request_source
        `)
        .in(
          'id',
          jobRequestIds
        );

      if (error) {
        throw new ApiError(
          500,
          'Opportunity sources could not be loaded.'
        );
      }

      jobRequests = data || [];
    }

    let clients = [];

    if (clientIds.length > 0) {
      const {
        data,
        error,
      } = await supabase
        .from('clients')
        .select(`
          id,
          user_id
        `)
        .in('id', clientIds);

      if (error) {
        throw new ApiError(
          500,
          'Client identities could not be loaded.'
        );
      }

      clients = data || [];
    }

    const {
      data: messageRows,
      error: messagesError,
    } = await supabase
      .from('application_messages')
      .select(`
        id,
        application_id,
        sender_user_id,
        subject,
        message,
        created_at
      `)
      .in(
        'application_id',
        applicationIds
      )
      .eq('visibility', 'client')
      .order('created_at', {
        ascending: true,
      });

    if (messagesError) {
      throw new ApiError(
        500,
        'Application feedback could not be loaded.'
      );
    }

    const clientUserIds =
      unique(
        clients.map(
          (client) =>
            client.user_id
        )
      );

    const messageSenderIds =
      unique(
        (messageRows || []).map(
          (message) =>
            message.sender_user_id
        )
      );

    const profileIds = unique([
      ...clientUserIds,
      ...applicantUserIds,
      ...messageSenderIds,
    ]);

    let profiles = [];

    if (profileIds.length > 0) {
      const {
        data,
        error,
      } = await supabase
        .from('profiles')
        .select(`
          id,
          full_name,
          email,
          role
        `)
        .in('id', profileIds);

      if (error) {
        throw new ApiError(
          500,
          'Application participants could not be loaded.'
        );
      }

      profiles = data || [];
    }

    const profilesById =
      new Map(
        profiles.map(
          (profile) => [
            profile.id,
            profile,
          ]
        )
      );

    const clientsById =
      new Map(
        clients.map(
          (client) => [
            client.id,
            client,
          ]
        )
      );

    const jobRequestsById =
      new Map(
        jobRequests.map(
          (request) => [
            request.id,
            request,
          ]
        )
      );

    const messagesByApplication =
      new Map();

    (messageRows || []).forEach(
      (message) => {
        const current =
          messagesByApplication.get(
            message.application_id
          ) || [];

        current.push(message);

        messagesByApplication.set(
          message.application_id,
          current
        );
      }
    );

    const formattedApplications =
      applications.map(
        (application) => {
          const client =
            clientsById.get(
              application.client_id
            );

          const {
            origin,
            originLabel,
          } = getApplicationOrigin(
            application,
            jobRequestsById
          );

          const messages =
            messagesByApplication.get(
              application.id
            ) || [];

          const clientFeedback =
            client
              ? messages.filter(
                  (message) =>
                    message.sender_user_id ===
                    client.user_id
                )
              : [];

          return {
            id: application.id,
            clientId:
              application.client_id,
            jobRequestId:
              application.job_request_id ||
              null,
            origin,
            originLabel,
            client:
              client
                ? getProfileName(
                    profilesById,
                    client.user_id,
                    'Client'
                  )
                : 'Client',
            applicant:
              getProfileName(
                profilesById,
                application.created_by,
                'Applicant'
              ),
            company:
              application.company,
            position:
              application.position,
            status:
              application.status,
            appliedAt:
              application.applied_at,
            createdAt:
              application.created_at,
            updatedAt:
              application.updated_at,
            feedbackCount:
              clientFeedback.length,
          };
        }
      );

    const conversations =
      applications
        .map((application) => {
          const client =
            clientsById.get(
              application.client_id
            );

          if (!client) {
            return null;
          }

          const messages =
            messagesByApplication.get(
              application.id
            ) || [];

          const clientMessages =
            messages.filter(
              (message) =>
                message.sender_user_id ===
                client.user_id
            );

          if (
            clientMessages.length === 0
          ) {
            return null;
          }

          const formattedMessages =
            messages.map((message) => {
              const sender =
                profilesById.get(
                  message.sender_user_id
                );

              return {
                id: message.id,
                subject:
                  message.subject || '',
                message:
                  message.message,
                createdAt:
                  message.created_at,
                sender: {
                  id:
                    message.sender_user_id,
                  name:
                    sender?.full_name ||
                    'ApplyLoop User',
                  role:
                    sender?.role ||
                    'unknown',
                },
              };
            });

          const latestMessage =
            messages[
              messages.length - 1
            ];

          const status =
            latestMessage
              ?.sender_user_id ===
            client.user_id
              ? 'pending'
              : 'resolved';

          return {
            id: application.id,
            applicationId:
              application.id,
            clientId:
              application.client_id,
            jobRequestId:
              application.job_request_id ||
              null,
            client:
              getProfileName(
                profilesById,
                client.user_id,
                'Client'
              ),
            applicant:
              getProfileName(
                profilesById,
                application.created_by,
                'Applicant'
              ),
            company:
              application.company,
            position:
              application.position,
            applicationStatus:
              application.status,
            status,
            latestMessage:
              latestMessage?.message ||
              '',
            latestAt:
              latestMessage?.created_at ||
              application.applied_at,
            messages:
              formattedMessages,
          };
        })
        .filter(Boolean)
        .sort(
          (left, right) =>
            new Date(right.latestAt) -
            new Date(left.latestAt)
        );

    const summary = {
      totalApplications:
        formattedApplications.length,
      submitted:
        formattedApplications.filter(
          (application) =>
            application.status ===
            'Submitted'
        ).length,
      waiting:
        formattedApplications.filter(
          (application) =>
            application.status ===
            'Waiting'
        ).length,
      interviews:
        formattedApplications.filter(
          (application) =>
            application.status ===
            'Interview Scheduled'
        ).length,
      offers:
        formattedApplications.filter(
          (application) =>
            application.status ===
            'Offer Received'
        ).length,
      rejected:
        formattedApplications.filter(
          (application) =>
            application.status ===
            'Rejected'
        ).length,
      feedbackConversations:
        conversations.length,
      feedbackPending:
        conversations.filter(
          (conversation) =>
            conversation.status ===
            'pending'
        ).length,
      feedbackResolved:
        conversations.filter(
          (conversation) =>
            conversation.status ===
            'resolved'
        ).length,
    };

    res.setHeader(
      'Cache-Control',
      'no-store'
    );

    return res.status(200).json({
      applications:
        formattedApplications,
      conversations,
      summary,
    });
  } catch (error) {
    const statusCode =
      error instanceof ApiError
        ? error.statusCode
        : 500;

    if (statusCode >= 500) {
      console.error(
        'Application operations API error:',
        error
      );
    }

    return res
      .status(statusCode)
      .json({
        error:
          statusCode >= 500
            ? 'Application operations could not be loaded right now.'
            : error.message,
      });
  }
}
