import { ApiError } from '../../../lib/auth/requireAdmin';
import { requireClient } from '../../../lib/auth/requireClient';

function optionalText(value, field, maxLength = 500) {
  if (value === undefined) return undefined;

  if (typeof value !== 'string') {
    throw new ApiError(400, `${field} must be text.`);
  }

  const trimmed = value.trim();

  if (trimmed.length > maxLength) {
    throw new ApiError(400, `${field} is too long.`);
  }

  return trimmed || null;
}

async function getSettings(supabase, profile) {
  const { data: client, error: clientError } = await supabase
    .from('clients')
    .select('gender, portfolio_url, linkedin_url, address, state_province, disability, veteran')
    .eq('user_id', profile.id)
    .single();

  if (clientError || !client) {
    throw new ApiError(404, 'Your client record could not be found.');
  }

  const { data: currentProfile, error: profileError } = await supabase
    .from('profiles')
    .select('id, email, full_name, phone, country, timezone')
    .eq('id', profile.id)
    .single();

  if (profileError || !currentProfile) {
    throw new ApiError(404, 'Your profile could not be found.');
  }

  return {
    fullName: currentProfile.full_name || '',
    email: currentProfile.email || '',
    phone: currentProfile.phone || '',
    country: currentProfile.country || '',
    timezone: currentProfile.timezone || '',
    gender: client.gender || '',
    address: client.address || '',
    state: client.state_province || '',
    disability: client.disability || '',
    veteran: client.veteran || '',
    portfolioLink: client.portfolio_url || '',
    linkedinUrl: client.linkedin_url || '',
  };
}

export default async function handler(req, res) {
  if (!['GET', 'PATCH'].includes(req.method)) {
    res.setHeader('Allow', 'GET, PATCH');

    return res.status(405).json({
      error: 'Method not allowed.',
    });
  }

  try {
    const { profile, supabase } = await requireClient(req);

    if (req.method === 'GET') {
      const settings = await getSettings(supabase, profile);

      return res.status(200).json(settings);
    }

    const profileChanges = {};
    const clientChanges = {};

    const fullName = optionalText(req.body?.fullName, 'Full name', 150);
    const phone = optionalText(req.body?.phone, 'Phone number', 50);
    const country = optionalText(req.body?.country, 'Country', 100);
    const timezone = optionalText(req.body?.timezone, 'Time zone', 100);
    const gender = optionalText(req.body?.gender, 'Gender', 50);
    const address = optionalText(req.body?.address, 'Physical address', 500);
    const state = optionalText(req.body?.state, 'State or province', 100);
    const disability = optionalText(req.body?.disability, 'Disability', 100);
    const veteran = optionalText(req.body?.veteran, 'Veteran', 100);
    const portfolioLink = optionalText(req.body?.portfolioLink, 'Portfolio link', 500);
    const linkedinUrl = optionalText(req.body?.linkedinUrl, 'LinkedIn URL', 500);

    if (fullName !== undefined) profileChanges.full_name = fullName;
    if (phone !== undefined) profileChanges.phone = phone;
    if (country !== undefined) profileChanges.country = country;
    if (timezone !== undefined) profileChanges.timezone = timezone;

    if (gender !== undefined) clientChanges.gender = gender;
    if (address !== undefined) clientChanges.address = address;
    if (state !== undefined) clientChanges.state_province = state;
    if (disability !== undefined) clientChanges.disability = disability;
    if (veteran !== undefined) clientChanges.veteran = veteran;
    if (portfolioLink !== undefined) clientChanges.portfolio_url = portfolioLink;
    if (linkedinUrl !== undefined) clientChanges.linkedin_url = linkedinUrl;

    if (Object.keys(profileChanges).length > 0) {
      const { error } = await supabase
        .from('profiles')
        .update(profileChanges)
        .eq('id', profile.id);

      if (error) {
        throw new ApiError(500, 'Your profile could not be updated.');
      }
    }

    if (Object.keys(clientChanges).length > 0) {
      const { error } = await supabase
        .from('clients')
        .update(clientChanges)
        .eq('user_id', profile.id);

      if (error) {
        throw new ApiError(500, 'Your client settings could not be updated.');
      }
    }

    const settings = await getSettings(supabase, profile);

    return res.status(200).json({
      message: 'Settings updated successfully.',
      ...settings,
    });
  } catch (error) {
    const statusCode =
      error instanceof ApiError
        ? error.statusCode
        : 500;

    return res.status(statusCode).json({
      error:
        statusCode >= 500
          ? 'Unable to update your settings right now.'
          : error.message,
    });
  }
}
