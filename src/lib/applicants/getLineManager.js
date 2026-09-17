export async function getApplicantLineManager(
  supabase,
  applicantId
) {
  if (!applicantId) {
    return null;
  }

  const {
    data: assignment,
    error: assignmentError,
  } = await supabase
    .from(
      'chief_applicant_assignments'
    )
    .select(`
      chief_user_id,
      assigned_at
    `)
    .eq(
      'applicant_id',
      applicantId
    )
    .eq(
      'is_active',
      true
    )
    .maybeSingle();

  if (assignmentError) {
    throw assignmentError;
  }

  if (!assignment?.chief_user_id) {
    return null;
  }

  const {
    data: chiefProfile,
    error: chiefProfileError,
  } = await supabase
    .from('profiles')
    .select(`
      id,
      full_name,
      email,
      phone,
      role,
      account_status
    `)
    .eq(
      'id',
      assignment.chief_user_id
    )
    .eq(
      'role',
      'chief_applicant'
    )
    .maybeSingle();

  if (chiefProfileError) {
    throw chiefProfileError;
  }

  if (!chiefProfile) {
    return null;
  }

  return {
    id: chiefProfile.id,
    fullName:
      chiefProfile.full_name ||
      'Chief Applicant',
    email:
      chiefProfile.email || '',
    phone:
      chiefProfile.phone || '',
    role: 'Chief Applicant',
    accountStatus:
      chiefProfile.account_status ||
      '',
    assignedAt:
      assignment.assigned_at ||
      null,
  };
}
