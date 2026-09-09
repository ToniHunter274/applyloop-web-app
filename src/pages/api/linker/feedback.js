import { ApiError } from '../../../lib/auth/requireAdmin';
import { requireLinker } from '../../../lib/auth/requireLinker';

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function unique(values) {
  return [
    ...new Set(
      values.filter(Boolean)
    ),
  ];
}

function validateApplicationId(value) {
  if (
    typeof value !== 'string' ||
    !UUID_PATTERN.test(value)
  ) {
    throw new ApiError(
      400,
      'The application ID is invalid.'
    );
  }

  return value;
}

function validateMessage(value) {
  if (
    typeof value !== 'string' ||
    !value.trim()
  ) {
    throw new ApiError(
      400,
      'A response is required.'
    );
  }

  const message = value.trim();

  if (message.length > 5000) {
    throw new ApiError(
      400,
      'The response cannot exceed 5000 characters.'
    );
  }

  return message;
}

async function getAuthorizedContext(
  profile,
  supabase
) {
  const {
    data: linkerAssignments,
    error: linkerError,
  } = await supabase
    .from(
      'linker_applicant_assignments'
    )
    .select('applicant_id')
    .eq('linker_user_id', profile.id)
    .eq('is_active', true);

  if (linkerError) {
    throw new ApiError(
      500,
      'Your Linker assignments could not be verified.'
    );
  }

  const applicantIds = unique(
    (linkerAssignments || []).map(
      (assignment) =>
        assignment.applicant_id
    )
  );

  if (applicantIds.length === 0) {
    return {
      applications: [],
      clients: [],
      profiles: [],
    };
  }

  const {
    data: applicants,
    error: applicantsError,
  } = await supabase
    .from('applicants')
    .select('id, user_id')
    .in('id', applicantIds);

  if (applicantsError) {
    throw new ApiError(
      500,
      'Assigned Applicants could not be verified.'
    );
  }

  const applicantUserIds = unique(
    (applicants || []).map(
      (applicant) =>
        applicant.user_id
    )
  );

  const {
    data: clientAssignments,
    error: clientAssignmentsError,
  } = await supabase
    .from(
      'client_applicant_assignments'
    )
    .select('client_id, applicant_id')
    .in('applicant_id', applicantIds);

  if (clientAssignmentsError) {
    throw new ApiError(
      500,
      'Assigned Client relationships could not be verified.'
    );
  }

  const clientIds = unique(
    (clientAssignments || []).map(
      (assignment) =>
        assignment.client_id
    )
  );

  if (
    clientIds.length === 0 ||
    applicantUserIds.length === 0
  ) {
    return {
      applications: [],
      clients: [],
      profiles: [],
    };
  }

  const applicantUserById =
    new Map(
      (applicants || []).map(
        (applicant) => [
          applicant.id,
          applicant.user_id,
        ]
      )
    );

  const allowedPairs =
    new Set(
      (clientAssignments || []).map(
        (assignment) =>
          assignment.client_id +
          ':' +
          applicantUserById.get(
            assignment.applicant_id
          )
      )
    );

  const {
    data: applicationRows,
    error: applicationsError,
  } = await supabase
    .from('applications')
    .select(
      [
        'id',
        'client_id',
        'created_by',
        'company',
        'position',
        'status',
        'applied_at',
      ].join(', ')
    )
    .in('client_id', clientIds)
    .in('created_by', applicantUserIds)
    .order('applied_at', {
      ascending: false,
    });

  if (applicationsError) {
    throw new ApiError(
      500,
      'Assigned applications could not be loaded.'
    );
  }

  const applications =
    (applicationRows || []).filter(
      (application) =>
        allowedPairs.has(
          application.client_id +
          ':' +
          application.created_by
        )
    );

  const authorizedClientIds =
    unique(
      applications.map(
        (application) =>
          application.client_id
      )
    );

  let clients = [];

  if (authorizedClientIds.length > 0) {
    const {
      data: clientRows,
      error: clientsError,
    } = await supabase
      .from('clients')
      .select('id, user_id')
      .in('id', authorizedClientIds);

    if (clientsError) {
      throw new ApiError(
        500,
        'Client identities could not be loaded.'
      );
    }

    clients = clientRows || [];
  }

  const profileIds = unique([
    ...applicantUserIds,
    ...clients.map(
      (client) => client.user_id
    ),
    profile.id,
  ]);

  let profiles = [];

  if (profileIds.length > 0) {
    const {
      data: profileRows,
      error: profilesError,
    } = await supabase
      .from('profiles')
      .select(
        'id, full_name, email, role'
      )
      .in('id', profileIds);

    if (profilesError) {
      throw new ApiError(
        500,
        'Feedback participants could not be loaded.'
      );
    }

    profiles = profileRows || [];
  }

  return {
    applications,
    clients,
    profiles,
  };
}

async function listFeedback(
  profile,
  supabase,
  res
) {
  const context =
    await getAuthorizedContext(
      profile,
      supabase
    );

  const applicationIds =
    context.applications.map(
      (application) =>
        application.id
    );

  if (applicationIds.length === 0) {
    res.setHeader(
      'Cache-Control',
      'no-store'
    );

    return res.status(200).json({
      conversations: [],
      summary: {
        total: 0,
        pending: 0,
        resolved: 0,
      },
    });
  }

  const {
    data: messageRows,
    error: messagesError,
  } = await supabase
    .from('application_messages')
    .select(
      [
        'id',
        'application_id',
        'sender_user_id',
        'subject',
        'message',
        'created_at',
      ].join(', ')
    )
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
      'Feedback messages could not be loaded.'
    );
  }

  const profilesById =
    new Map(
      context.profiles.map(
        (participant) => [
          participant.id,
          participant,
        ]
      )
    );

  const clientsById =
    new Map(
      context.clients.map(
        (client) => [
          client.id,
          client,
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

  const conversations =
    context.applications
      .map((application) => {
        const client =
          clientsById.get(
            application.client_id
          );

        const messages =
          messagesByApplication.get(
            application.id
          ) || [];

        const clientMessages =
          messages.filter(
            (message) =>
              message.sender_user_id ===
              client?.user_id
          );

        if (
          !client ||
          clientMessages.length === 0
        ) {
          return null;
        }

        const clientProfile =
          profilesById.get(
            client.user_id
          );

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
          clientName:
            clientProfile?.full_name ||
            'Client',
          clientEmail:
            clientProfile?.email || '',
          company:
            application.company,
          position:
            application.position,
          applicationStatus:
            application.status,
          appliedAt:
            application.applied_at,
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

  res.setHeader(
    'Cache-Control',
    'no-store'
  );

  return res.status(200).json({
    conversations,
    summary: {
      total:
        conversations.length,
      pending:
        conversations.filter(
          (conversation) =>
            conversation.status ===
            'pending'
        ).length,
      resolved:
        conversations.filter(
          (conversation) =>
            conversation.status ===
            'resolved'
        ).length,
    },
  });
}

async function createResponse(
  req,
  profile,
  supabase,
  res
) {
  const applicationId =
    validateApplicationId(
      req.body?.applicationId
    );

  const responseMessage =
    validateMessage(
      req.body?.message
    );

  const context =
    await getAuthorizedContext(
      profile,
      supabase
    );

  const application =
    context.applications.find(
      (item) =>
        item.id === applicationId
    );

  if (!application) {
    throw new ApiError(
      403,
      'This application is not assigned to your Linker account.'
    );
  }

  const {
    data: message,
    error: messageError,
  } = await supabase
    .from('application_messages')
    .insert({
      application_id:
        application.id,
      sender_user_id:
        profile.id,
      subject: 'Linker Response',
      message: responseMessage,
      visibility: 'client',
    })
    .select(
      [
        'id',
        'sender_user_id',
        'subject',
        'message',
        'created_at',
      ].join(', ')
    )
    .single();

  if (messageError || !message) {
    throw new ApiError(
      500,
      'Your response could not be sent.'
    );
  }

  return res.status(201).json({
    message: {
      id: message.id,
      subject:
        message.subject || '',
      message:
        message.message,
      createdAt:
        message.created_at,
      sender: {
        id: profile.id,
        name:
          profile.full_name ||
          'Linker',
        role: 'linker',
      },
    },
    status: 'resolved',
  });
}

export default async function handler(
  req,
  res
) {
  if (
    !['GET', 'POST'].includes(
      req.method
    )
  ) {
    res.setHeader(
      'Allow',
      'GET, POST'
    );

    return res.status(405).json({
      error: 'Method not allowed.',
    });
  }

  try {
    const {
      profile,
      supabase,
    } = await requireLinker(req);

    if (req.method === 'GET') {
      return await listFeedback(
        profile,
        supabase,
        res
      );
    }

    return await createResponse(
      req,
      profile,
      supabase,
      res
    );
  } catch (error) {
    const statusCode =
      error instanceof ApiError
        ? error.statusCode
        : 500;

    if (statusCode >= 500) {
      console.error(
        'Linker feedback API error:',
        error
      );
    }

    return res
      .status(statusCode)
      .json({
        error:
          statusCode >= 500
            ? 'Unable to process Linker feedback right now.'
            : error.message,
      });
  }
}
