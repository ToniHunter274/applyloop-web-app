import { basename } from 'node:path';
import { ApiError } from '../../../../lib/auth/requireAdmin';
import { requireApplicant } from '../../../../lib/auth/requireApplicant';
import { getClientPlan } from '../../../../shared/config/clientPlans';

async function listClients(req, res) {
  const { profile: applicantProfile, supabase } =
    await requireApplicant(req);

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
        assigned_applicant_id,
        gender,
        portfolio_url,
        linkedin_url,
        resume_path,
        status,
        priority,
        created_at,
        updated_at
      `)
      .eq('assigned_applicant_id', applicantProfile.id)
      .order('created_at', { ascending: false });

  if (clientsError) {
    console.error('Unable to load assigned clients:', clientsError);
    throw new ApiError(
      500,
      'Your assigned clients could not be loaded.'
    );
  }

  const userIds = [
    ...new Set(
      (clientRows || []).map((client) => client.user_id)
    ),
  ];

  let profiles = [];

  if (userIds.length > 0) {
    const { data: profileRows, error: profilesError } =
      await supabase
        .from('profiles')
        .select('id, email, full_name, phone, country, timezone')
        .in('id', userIds);

    if (profilesError) {
      console.error(
        'Unable to load assigned client profiles:',
        profilesError
      );

      throw new ApiError(
        500,
        'Your assigned client profiles could not be loaded.'
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
    const { data, error } = await supabase
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
        updated_at
      `)
      .in('client_id', clientIds)
      .order('step_order', { ascending: true });

    if (error) {
      console.error(
        'Unable to load assigned client onboarding:',
        error
      );

      throw new ApiError(
        500,
        'Client onboarding progress could not be loaded.'
      );
    }

    onboardingRows = data || [];
  }

  const onboardingByClientId = new Map();

  onboardingRows.forEach((step) => {
    const steps =
      onboardingByClientId.get(step.client_id) || [];

    steps.push({
      id: step.id,
      stepKey: step.step_key,
      stepOrder: step.step_order,
      label: step.label,
      status: step.status,
      completedAt: step.completed_at,
      updateSource: step.update_source,
      updatedAt: step.updated_at,
    });

    onboardingByClientId.set(step.client_id, steps);
  });

  const clients = (clientRows || []).map((client) => {
    const profile = profilesById.get(client.user_id);
    const plan = getClientPlan(client.plan);
    const onboardingSteps =
      onboardingByClientId.get(client.id) || [];

    const completedCount = onboardingSteps.filter(
      (step) =>
        ['completed', 'skipped'].includes(step.status)
    ).length;

    const progressPercent =
      onboardingSteps.length > 0
        ? Math.round(
            (completedCount / onboardingSteps.length) * 100
          )
        : 0;

    const storedResumeName = client.resume_path
      ? basename(client.resume_path)
      : null;

    return {
      id: client.id,
      userId: client.user_id,
      fullName: profile?.full_name || 'Unnamed Client',
      email: profile?.email || '',
      phone: profile?.phone || '',
      country: profile?.country || '',
      timezone: profile?.timezone || '',
      plan: client.plan,
      planLabel: plan?.label || client.plan,
      planPrice: plan?.price || 0,
      applicationLimit: client.application_limit,
      applicationsCompleted: client.applications_completed,
      interviews: client.interviews,
      assignedTeam: client.assigned_team || '',
      gender: client.gender || '',
      portfolioUrl: client.portfolio_url || '',
      linkedinUrl: client.linkedin_url || '',
      resumeFilename: storedResumeName
        ? storedResumeName.replace(/^\d+-/, '')
        : null,
      hasResume: Boolean(client.resume_path),
      status: client.status,
      priority: client.priority || 'high',
      onboarding: {
        steps: onboardingSteps,
        completedCount,
        totalCount: onboardingSteps.length,
        progressPercent,
      },
      createdAt: client.created_at,
      updatedAt: client.updated_at,
    };
  });

  return res.status(200).json({ clients });
}

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({
      error: 'Method not allowed.',
    });
  }

  try {
    return await listClients(req, res);
  } catch (error) {
    const statusCode =
      error instanceof ApiError
        ? error.statusCode
        : 500;

    if (statusCode >= 500) {
      console.error('GET applicant clients API error:', error);
    }

    return res.status(statusCode).json({
      error:
        statusCode >= 500
          ? 'Unable to load your assigned clients right now.'
          : error.message,
    });
  }
}
