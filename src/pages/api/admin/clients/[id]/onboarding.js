import {
  ApiError,
  requireAdmin,
} from '../../../../../lib/auth/requireAdmin';

const ALLOWED_STEP_STATUSES = new Set([
  'not_started',
  'in_progress',
  'completed',
  'skipped',
]);

export default async function handler(req, res) {
  if (req.method !== 'PATCH') {
    res.setHeader('Allow', 'PATCH');

    return res.status(405).json({
      error: 'Method not allowed.',
    });
  }

  try {
    const clientId = Array.isArray(req.query.id)
      ? req.query.id[0]
      : req.query.id;

    if (!clientId) {
      throw new ApiError(
        400,
        'A client ID is required.'
      );
    }

    const stepKey = String(
      req.body?.stepKey || ''
    ).trim();

    const status = String(
      req.body?.status || ''
    )
      .trim()
      .toLowerCase();

    const notes = String(
      req.body?.notes || ''
    ).trim();

    if (!stepKey) {
      throw new ApiError(
        400,
        'An onboarding step is required.'
      );
    }

    if (!ALLOWED_STEP_STATUSES.has(status)) {
      throw new ApiError(
        400,
        'Select a valid onboarding status.'
      );
    }

    if (notes.length > 1000) {
      throw new ApiError(
        400,
        'Onboarding notes must not exceed 1000 characters.'
      );
    }

    const {
      profile: adminProfile,
      supabase,
    } = await requireAdmin(req);

    const {
      data: client,
      error: clientError,
    } = await supabase
      .from('clients')
      .select('id')
      .eq('id', clientId)
      .single();

    if (clientError || !client) {
      throw new ApiError(
        404,
        'The client could not be found.'
      );
    }

    const {
      data: currentStep,
      error: currentStepError,
    } = await supabase
      .from('client_onboarding_steps')
      .select('id, step_key, step_order, label')
      .eq('client_id', clientId)
      .eq('step_key', stepKey)
      .single();

    if (currentStepError || !currentStep) {
      throw new ApiError(
        404,
        'The onboarding step could not be found.'
      );
    }

    const completedAt =
      status === 'completed'
        ? new Date().toISOString()
        : null;

    const {
      data: updatedStep,
      error: updateError,
    } = await supabase
      .from('client_onboarding_steps')
      .update({
        status,
        completed_at: completedAt,
        updated_by: adminProfile.id,
        update_source: 'manual',
        notes: notes || null,
      })
      .eq('id', currentStep.id)
      .select(`
        id,
        client_id,
        step_key,
        step_order,
        label,
        status,
        completed_at,
        update_source,
        notes,
        updated_at
      `)
      .single();

    if (updateError || !updatedStep) {
      console.error(
        'Unable to update onboarding step:',
        updateError
      );

      throw new ApiError(
        500,
        'The onboarding step could not be updated.'
      );
    }

    return res.status(200).json({
      message: 'Onboarding progress updated.',
      step: {
        id: updatedStep.id,
        clientId: updatedStep.client_id,
        stepKey: updatedStep.step_key,
        stepOrder: updatedStep.step_order,
        label: updatedStep.label,
        status: updatedStep.status,
        completedAt: updatedStep.completed_at,
        updateSource: updatedStep.update_source,
        notes: updatedStep.notes || '',
        updatedAt: updatedStep.updated_at,
      },
    });
  } catch (error) {
    const statusCode =
      error instanceof ApiError
        ? error.statusCode
        : 500;

    if (statusCode >= 500) {
      console.error(
        'Update onboarding API error:',
        error
      );
    }

    return res.status(statusCode).json({
      error:
        statusCode >= 500
          ? 'Unable to update onboarding right now.'
          : error.message,
    });
  }
}
