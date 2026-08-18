import {
  ApiError,
  requireAdmin,
} from '../../../../../lib/auth/requireAdmin';

function getApplicantId(req) {
  const applicantId = Array.isArray(req.query.id)
    ? req.query.id[0]
    : req.query.id;

  if (!applicantId) {
    throw new ApiError(
      400,
      'An applicant ID is required.'
    );
  }

  return applicantId;
}

function validateMessage(value) {
  const message = String(value || '').trim();

  if (!message) {
    throw new ApiError(
      400,
      'Enter a message.'
    );
  }

  if (message.length > 4000) {
    throw new ApiError(
      400,
      'Messages must not exceed 4000 characters.'
    );
  }

  return message;
}

async function requireApplicant(
  supabase,
  applicantId
) {
  const {
    data: applicant,
    error,
  } = await supabase
    .from('applicants')
    .select('id, user_id')
    .eq('id', applicantId)
    .single();

  if (error || !applicant) {
    throw new ApiError(
      404,
      'The applicant could not be found.'
    );
  }

  return applicant;
}

async function loadMessages(
  supabase,
  applicantId
) {
  const {
    data: messageRows,
    error: messagesError,
  } = await supabase
    .from('applicant_messages')
    .select(`
      id,
      sender_profile_id,
      message,
      read_at,
      created_at
    `)
    .eq('applicant_id', applicantId)
    .order('created_at', {
      ascending: true,
    });

  if (messagesError) {
    console.error(
      'Unable to load applicant messages:',
      messagesError
    );

    throw new ApiError(
      500,
      'The conversation could not be loaded.'
    );
  }

  const senderIds = [
    ...new Set(
      (messageRows || []).map(
        (message) =>
          message.sender_profile_id
      )
    ),
  ];

  let profiles = [];

  if (senderIds.length > 0) {
    const {
      data: profileRows,
      error: profilesError,
    } = await supabase
      .from('profiles')
      .select(`
        id,
        full_name,
        role
      `)
      .in('id', senderIds);

    if (profilesError) {
      console.error(
        'Unable to load message senders:',
        profilesError
      );

      throw new ApiError(
        500,
        'The conversation senders could not be loaded.'
      );
    }

    profiles = profileRows || [];
  }

  const profilesById = new Map(
    profiles.map((profile) => [
      profile.id,
      profile,
    ])
  );

  return (messageRows || []).map(
    (message) => {
      const sender = profilesById.get(
        message.sender_profile_id
      );

      return {
        id: message.id,
        senderProfileId:
          message.sender_profile_id,
        senderName:
          sender?.full_name ||
          'ApplyLoop User',
        senderRole:
          sender?.role || '',
        message: message.message,
        readAt: message.read_at,
        createdAt: message.created_at,
      };
    }
  );
}

async function getMessages(req, res) {
  const {
    profile,
    supabase,
  } = await requireAdmin(req);

  const applicantId =
    getApplicantId(req);

  const applicant =
    await requireApplicant(
      supabase,
      applicantId
    );

  const {
    error: seenError,
  } = await supabase
    .from('applicant_messages')
    .update({
      read_at:
        new Date().toISOString(),
    })
    .eq(
      'applicant_id',
      applicantId
    )
    .eq(
      'sender_profile_id',
      applicant.user_id
    )
    .is('read_at', null);

  if (seenError) {
    console.error(
      'Unable to mark Applicant messages as seen:',
      seenError
    );
  }

  const messages =
    await loadMessages(
      supabase,
      applicantId
    );

  return res.status(200).json({
    applicant: {
      id: applicant.id,
      userId: applicant.user_id,
    },
    currentProfileId: profile.id,
    messages,
  });
}

async function sendMessage(req, res) {
  const {
    profile,
    supabase,
  } = await requireAdmin(req);

  const applicantId =
    getApplicantId(req);

  await requireApplicant(
    supabase,
    applicantId
  );

  const message =
    validateMessage(
      req.body?.message
    );

  const {
    data: createdMessage,
    error: messageError,
  } = await supabase
    .from('applicant_messages')
    .insert({
      applicant_id: applicantId,
      sender_profile_id: profile.id,
      message,
    })
    .select(`
      id,
      sender_profile_id,
      message,
      read_at,
      created_at
    `)
    .single();

  if (
    messageError ||
    !createdMessage
  ) {
    console.error(
      'Unable to send applicant message:',
      messageError
    );

    throw new ApiError(
      500,
      'The message could not be sent.'
    );
  }

  return res.status(201).json({
    message: {
      id: createdMessage.id,
      senderProfileId:
        createdMessage.sender_profile_id,
      senderName:
        profile.full_name ||
        'ApplyLoop',
      senderRole:
        profile.role,
      message:
        createdMessage.message,
      readAt:
        createdMessage.read_at,
      createdAt:
        createdMessage.created_at,
    },
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
    if (req.method === 'GET') {
      return await getMessages(
        req,
        res
      );
    }

    return await sendMessage(
      req,
      res
    );
  } catch (error) {
    const statusCode =
      error instanceof ApiError
        ? error.statusCode
        : 500;

    if (statusCode >= 500) {
      console.error(
        `${req.method} applicant messages API error:`,
        error
      );
    }

    return res
      .status(statusCode)
      .json({
        error:
          statusCode >= 500
            ? 'Unable to manage this conversation right now.'
            : error.message,
      });
  }
}
