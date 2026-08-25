import { readFile, unlink } from 'node:fs/promises';
import { basename, extname } from 'node:path';
import {
  ApiError,
  requireAdmin,
} from '../../../../lib/auth/requireAdmin';
import {
  generateTemporaryPassword,
} from '../../../../lib/auth/generateTemporaryPassword';
import {
  ALLOWED_RESUME_TYPES,
  getField,
  getFile,
  parseClientForm,
} from '../../../../lib/uploads/parseClientForm';
import {
  getClientPlan,
} from '../../../../shared/config/clientPlans';

export const config = {
  api: {
    bodyParser: false,
  },
};

const ALLOWED_RESUME_EXTENSIONS = new Set([
  '.pdf',
  '.doc',
  '.docx',
]);

function validateRequired(value, label, maximumLength) {
  if (!value) {
    throw new ApiError(400, `${label} is required.`);
  }

  if (value.length > maximumLength) {
    throw new ApiError(
      400,
      `${label} must not exceed ${maximumLength} characters.`
    );
  }

  return value;
}

function validateOptional(value, label, maximumLength) {
  if (!value) {
    return null;
  }

  if (value.length > maximumLength) {
    throw new ApiError(
      400,
      `${label} must not exceed ${maximumLength} characters.`
    );
  }

  return value;
}

function validateEmail(value) {
  const email = validateRequired(
    value.toLowerCase(),
    'Email address',
    254
  );

  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!emailPattern.test(email)) {
    throw new ApiError(400, 'Enter a valid email address.');
  }

  return email;
}

function validateOptionalUrl(value, label) {
  if (!value) {
    return null;
  }

  let parsedUrl;

  try {
    parsedUrl = new URL(value);
  } catch {
    throw new ApiError(400, `${label} must be a valid URL.`);
  }

  if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
    throw new ApiError(
      400,
      `${label} must use http or https.`
    );
  }

  return parsedUrl.toString();
}

function createResumeFilename(originalFilename) {
  const extension = extname(originalFilename).toLowerCase();

  if (!ALLOWED_RESUME_EXTENSIONS.has(extension)) {
    throw new ApiError(
      400,
      'Resume must be a PDF, DOC, or DOCX file.'
    );
  }

  const originalBaseName = basename(
    originalFilename,
    extension
  );

  const safeBaseName = originalBaseName
    .normalize('NFKD')
    .replace(/[^\w.-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);

  return `${Date.now()}-${safeBaseName || 'resume'}${extension}`;
}

function validateResume(resume) {
  if (!resume) {
    throw new ApiError(
      400,
      'A PDF, DOC, or DOCX resume is required.'
    );
  }

  if (!ALLOWED_RESUME_TYPES.has(resume.mimetype)) {
    throw new ApiError(
      400,
      'Resume must be a PDF, DOC, or DOCX file.'
    );
  }

  return resume;
}

function normalizeAuthError(error) {
  const message = error?.message?.toLowerCase() || '';

  if (
    message.includes('already registered') ||
    message.includes('already been registered') ||
    message.includes('already exists')
  ) {
    return new ApiError(
      409,
      'A client account already exists for this email address.'
    );
  }

  return new ApiError(
    500,
    'The client login account could not be created.'
  );
}

async function cleanUpFailedCreation({
  resumePath,
  supabase,
  userId,
}) {
  if (resumePath) {
    const { error: removeResumeError } = await supabase.storage
      .from('client-resumes')
      .remove([resumePath]);

    if (removeResumeError) {
      console.error(
        'Unable to remove client resume during rollback:',
        removeResumeError
      );
    }
  }

  if (userId) {
    const { error: deleteUserError } =
      await supabase.auth.admin.deleteUser(userId);

    if (deleteUserError) {
      console.error(
        'Unable to remove client user during rollback:',
        deleteUserError
      );
    }
  }
}

async function listClients(req, res) {
  const {
    profile: adminProfile,
    supabase,
  } = await requireAdmin(req);

  const canAccessInternalNotes = [
    'admin',
    'owner',
  ].includes(adminProfile.role);

  const { data: clientRows, error: clientsError } =
    await supabase
      .from('clients')
      .select(`
        id,
        user_id,
        plan,
        application_limit,
        applications_completed,
        interviews,
        assigned_team,
        gender,
        portfolio_url,
        linkedin_url,
        resume_path,
        ${canAccessInternalNotes ? 'notes,' : ''}
        status,
        priority,
        created_at,
        updated_at
      `)
      .order('created_at', { ascending: false });

  if (clientsError) {
    console.error('Unable to load clients:', clientsError);

    throw new ApiError(
      500,
      'The client list could not be loaded.'
    );
  }

  const userIds = [
    ...new Set(
      (clientRows || []).map((client) => client.user_id)
    ),
  ];

  let profiles = [];

  if (userIds.length > 0) {
    const {
      data: profileRows,
      error: profilesError,
    } = await supabase
      .from('profiles')
      .select('id, email, full_name, phone')
      .in('id', userIds);

    if (profilesError) {
      console.error(
        'Unable to load client profiles:',
        profilesError
      );

      throw new ApiError(
        500,
        'The client profiles could not be loaded.'
      );
    }

    profiles = profileRows || [];
  }

  const profilesById = new Map(
    profiles.map((profile) => [profile.id, profile])
  );

  const clientIds = (clientRows || []).map(
    (client) => client.id
  );

  let onboardingRows = [];

  if (clientIds.length > 0) {
    const {
      data: onboardingData,
      error: onboardingError,
    } = await supabase
      .from('client_onboarding_steps')
      .select(`
        id,
        client_id,
        step_key,
        step_order,
        label,
        status,
        completed_at,
        update_source,
        ${canAccessInternalNotes ? 'notes,' : ''}
        updated_at
      `)
      .in('client_id', clientIds)
      .order('step_order', { ascending: true });

    if (onboardingError) {
      console.error(
        'Unable to load client onboarding:',
        onboardingError
      );

      throw new ApiError(
        500,
        'The client onboarding progress could not be loaded.'
      );
    }

    onboardingRows = onboardingData || [];
  }

  let clientAssignmentRows = [];

  if (clientIds.length > 0) {
    const {
      data: assignments,
      error: assignmentsError,
    } = await supabase
      .from(
        'client_applicant_assignments'
      )
      .select(`
        client_id,
        applicant_id
      `)
      .in('client_id', clientIds);

    if (assignmentsError) {
      console.error(
        'Unable to load client applicant assignments:',
        assignmentsError
      );

      throw new ApiError(
        500,
        'The client assignments could not be loaded.'
      );
    }

    clientAssignmentRows =
      assignments || [];
  }

  const assignedApplicantIds = [
    ...new Set(
      clientAssignmentRows.map(
        (assignment) =>
          assignment.applicant_id
      )
    ),
  ];

  let assignedApplicantRows = [];

  if (
    assignedApplicantIds.length > 0
  ) {
    const {
      data: applicants,
      error: applicantsError,
    } = await supabase
      .from('applicants')
      .select(`
        id,
        user_id,
        availability
      `)
      .in(
        'id',
        assignedApplicantIds
      );

    if (applicantsError) {
      console.error(
        'Unable to load assigned applicants:',
        applicantsError
      );

      throw new ApiError(
        500,
        'The assigned applicants could not be loaded.'
      );
    }

    assignedApplicantRows =
      applicants || [];
  }

  const assignedApplicantUserIds = [
    ...new Set(
      assignedApplicantRows.map(
        (applicant) =>
          applicant.user_id
      )
    ),
  ];

  let assignedApplicantProfiles = [];

  if (
    assignedApplicantUserIds.length > 0
  ) {
    const {
      data: applicantProfiles,
      error: applicantProfilesError,
    } = await supabase
      .from('profiles')
      .select(`
        id,
        email,
        full_name,
        account_status
      `)
      .in(
        'id',
        assignedApplicantUserIds
      );

    if (applicantProfilesError) {
      console.error(
        'Unable to load assigned applicant profiles:',
        applicantProfilesError
      );

      throw new ApiError(
        500,
        'The assigned applicant profiles could not be loaded.'
      );
    }

    assignedApplicantProfiles =
      applicantProfiles || [];
  }

  const assignedApplicantRowsById =
    new Map(
      assignedApplicantRows.map(
        (applicant) => [
          applicant.id,
          applicant,
        ]
      )
    );

  const assignedApplicantProfilesById =
    new Map(
      assignedApplicantProfiles.map(
        (profile) => [
          profile.id,
          profile,
        ]
      )
    );

  const assignedApplicantsByClientId =
    new Map();

  clientAssignmentRows.forEach(
    (assignment) => {
      const applicant =
        assignedApplicantRowsById.get(
          assignment.applicant_id
        );

      if (!applicant) {
        return;
      }

      const profile =
        assignedApplicantProfilesById.get(
          applicant.user_id
        );

      const currentApplicants =
        assignedApplicantsByClientId.get(
          assignment.client_id
        ) || [];

      currentApplicants.push({
        id: applicant.id,
        fullName:
          profile?.full_name ||
          'Unnamed Applicant',
        email: profile?.email || '',
        availability:
          applicant.availability,
        accountStatus:
          profile?.account_status ||
          'active',
      });

      assignedApplicantsByClientId.set(
        assignment.client_id,
        currentApplicants
      );
    }
  );

  const onboardingByClientId = new Map();

  onboardingRows.forEach((step) => {
    const currentSteps =
      onboardingByClientId.get(step.client_id) || [];

    currentSteps.push({
      id: step.id,
      stepKey: step.step_key,
      stepOrder: step.step_order,
      label: step.label,
      status: step.status,
      completedAt: step.completed_at,
      updateSource: step.update_source,
      ...(canAccessInternalNotes
        ? {
            notes: step.notes || '',
          }
        : {}),
      updatedAt: step.updated_at,
    });

    onboardingByClientId.set(
      step.client_id,
      currentSteps
    );
  });

  const clients = (clientRows || []).map((client) => {
    const profile = profilesById.get(client.user_id);
    const plan = getClientPlan(client.plan);

    const onboardingSteps =
      onboardingByClientId.get(client.id) || [];

    const completedOnboardingCount =
      onboardingSteps.filter((step) =>
        ['completed', 'skipped'].includes(step.status)
      ).length;

    const currentOnboardingStep =
      onboardingSteps.find(
        (step) => step.status === 'in_progress'
      ) ||
      onboardingSteps.find(
        (step) => step.status === 'not_started'
      ) ||
      onboardingSteps[
        onboardingSteps.length - 1
      ] ||
      null;

    const onboardingProgress =
      onboardingSteps.length > 0
        ? Math.round(
            (completedOnboardingCount /
              onboardingSteps.length) *
              100
          )
        : 0;

    const storedResumeName = client.resume_path
      ? basename(client.resume_path)
      : null;

    const resumeFilename = storedResumeName
      ? storedResumeName.replace(/^\d+-/, '')
      : null;

    return {
      id: client.id,
      userId: client.user_id,
      fullName: profile?.full_name || 'Unnamed Client',
      email: profile?.email || '',
      phone: profile?.phone || '',
      plan: client.plan,
      planLabel: plan?.label || client.plan,
      planPrice: plan?.price || 0,
      applicationLimit: client.application_limit,
      applicationsCompleted:
        client.applications_completed,
      interviews: client.interviews,
      assignedTeam: client.assigned_team || '',
      assignedApplicants:
        assignedApplicantsByClientId.get(
          client.id
        ) || [],
      assignmentCount: (
        assignedApplicantsByClientId.get(
          client.id
        ) || []
      ).length,
      assignmentLimit: 2,
      gender: client.gender || '',
      portfolioUrl: client.portfolio_url || '',
      linkedinUrl: client.linkedin_url || '',
      resumeFilename,
      hasResume: Boolean(client.resume_path),
      ...(canAccessInternalNotes
        ? {
            notes: client.notes || '',
          }
        : {}),
      status: client.status,
      priority: client.priority || 'high',
      onboarding: {
        steps: onboardingSteps,
        completedCount: completedOnboardingCount,
        totalCount: onboardingSteps.length,
        progressPercent: onboardingProgress,
        currentStep: currentOnboardingStep,
      },
      createdAt: client.created_at,
      updatedAt: client.updated_at,
    };
  });

  return res.status(200).json({ clients });
}

async function createClient(req, res) {
  const { profile: adminProfile, supabase } =
    await requireAdmin(req);

  let resume = null;
  let createdUserId = null;
  let resumePath = null;

  try {
    const [fields, files] =
      await parseClientForm(req);

    resume = getFile(files, 'resume');

    const fullName = validateRequired(
      getField(fields, 'fullName'),
      'Client name',
      120
    );

    const email = validateEmail(
      getField(fields, 'email')
    );

    const phone = validateOptional(
      getField(fields, 'phone'),
      'Phone number',
      30
    );

    const gender = validateOptional(
      getField(fields, 'gender'),
      'Gender',
      50
    );

    const assignedTeam = validateOptional(
      getField(fields, 'assignedTeam'),
      'Assigned team',
      100
    );

    const notes = validateOptional(
      getField(fields, 'notes'),
      'Notes',
      2000
    );

    const canAccessInternalNotes = [
      'admin',
      'owner',
    ].includes(adminProfile.role);

    if (
      !canAccessInternalNotes &&
      notes
    ) {
      throw new ApiError(
        403,
        'Operations accounts cannot create internal client notes.'
      );
    }

    const portfolioUrl = validateOptionalUrl(
      getField(fields, 'portfolioUrl'),
      'Portfolio link'
    );

    const linkedinUrl = validateOptionalUrl(
      getField(fields, 'linkedinUrl'),
      'LinkedIn URL'
    );

    const selectedPlan = getClientPlan(
      getField(fields, 'plan').toLowerCase()
    );

    if (!selectedPlan) {
      throw new ApiError(
        400,
        'Select a valid client plan.'
      );
    }

    resume = validateResume(resume);

    const temporaryPassword =
      generateTemporaryPassword();

    const {
      data: authData,
      error: authError,
    } = await supabase.auth.admin.createUser({
      email,
      password: temporaryPassword,
      email_confirm: true,
      user_metadata: {
        full_name: fullName,
        role: 'user_client',
      },
    });

    if (authError || !authData.user) {
      throw normalizeAuthError(authError);
    }

    createdUserId = authData.user.id;

    const { error: profileError } = await supabase
      .from('profiles')
      .insert({
        id: createdUserId,
        email,
        full_name: fullName,
        phone,
        role: 'user_client',
        account_status: 'active',
      });

    if (profileError) {
      console.error('Unable to create client profile:', profileError);

      if (profileError.code === '23505') {
        throw new ApiError(
          409,
          'A client profile already exists for this email address.'
        );
      }

      throw new ApiError(
        500,
        'The client profile could not be created.'
      );
    }

    const originalFilename =
      resume.originalFilename || 'resume.pdf';

    const resumeFilename =
      createResumeFilename(originalFilename);

    resumePath = `${createdUserId}/${resumeFilename}`;

    const resumeBuffer = await readFile(resume.filepath);

    const { error: uploadError } = await supabase.storage
      .from('client-resumes')
      .upload(resumePath, resumeBuffer, {
        cacheControl: '3600',
        contentType: resume.mimetype,
        upsert: false,
      });

    if (uploadError) {
      console.error('Unable to upload client resume:', uploadError);

      throw new ApiError(
        500,
        'The client resume could not be uploaded.'
      );
    }

    const {
      data: client,
      error: clientError,
    } = await supabase
      .from('clients')
      .insert({
        user_id: createdUserId,
        plan: selectedPlan.value,
        application_limit: selectedPlan.applicationLimit,
        applications_completed: 0,
        interviews: 0,
        assigned_team: assignedTeam,
        gender,
        portfolio_url: portfolioUrl,
        linkedin_url: linkedinUrl,
        resume_path: resumePath,
        ...(canAccessInternalNotes
          ? {
              notes,
            }
          : {}),
        status: 'active',
        priority: 'high',
        created_by: adminProfile.id,
      })
      .select(`
        id,
        user_id,
        plan,
        application_limit,
        applications_completed,
        interviews,
        assigned_team,
        status,
        priority,
        created_at
      `)
      .single();

    if (clientError || !client) {
      console.error('Unable to create client record:', clientError);

      throw new ApiError(
        500,
        'The client record could not be created.'
      );
    }

    return res.status(201).json({
      message: 'Client created successfully.',
      client: {
        ...client,
        email,
        fullName,
        phone,
        planLabel: selectedPlan.label,
        planPrice: selectedPlan.price,
      },
      credentials: {
        email,
        temporaryPassword,
      },
    });
  } catch (error) {
    await cleanUpFailedCreation({
      resumePath,
      supabase,
      userId: createdUserId,
    });

    throw error;
  } finally {
    if (resume?.filepath) {
      try {
        await unlink(resume.filepath);
      } catch (temporaryFileError) {
        if (temporaryFileError.code !== 'ENOENT') {
          console.error(
            'Unable to remove temporary resume file:',
            temporaryFileError
          );
        }
      }
    }
  }
}

export default async function handler(req, res) {
  if (!['GET', 'POST'].includes(req.method)) {
    res.setHeader('Allow', 'GET, POST');

    return res.status(405).json({
      error: 'Method not allowed.',
    });
  }

  try {
    if (req.method === 'GET') {
      return await listClients(req, res);
    }

    return await createClient(req, res);
  } catch (error) {
    const statusCode =
      error instanceof ApiError
        ? error.statusCode
        : error.httpCode || 500;

    const serverErrorMessage =
      req.method === 'GET'
        ? 'Unable to load the client list right now.'
        : 'Unable to create the client right now.';

    if (statusCode >= 500) {
      console.error(
        `${req.method} clients API error:`,
        error
      );
    }

    return res.status(statusCode).json({
      error:
        statusCode >= 500
          ? serverErrorMessage
          : error.message,
    });
  }
}
