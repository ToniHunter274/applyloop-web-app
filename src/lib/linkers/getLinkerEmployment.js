export async function getLinkerEmployment(
  supabase,
  linkerUserId
) {
  if (!linkerUserId) {
    return {
      lineManager: null,
      nda: null,
    };
  }

  const {
    data: assignment,
    error: assignmentError,
  } = await supabase
    .from('chief_linker_assignments')
    .select(`
      id,
      chief_user_id,
      assigned_at
    `)
    .eq(
      'linker_user_id',
      linkerUserId
    )
    .eq(
      'is_active',
      true
    )
    .maybeSingle();

  if (assignmentError) {
    throw assignmentError;
  }

  let lineManager = null;

  if (assignment?.chief_user_id) {
    const {
      data: chiefProfile,
      error: chiefError,
    } = await supabase
      .from('profiles')
      .select(`
        id,
        full_name,
        email,
        phone,
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

    if (chiefError) {
      throw chiefError;
    }

    if (chiefProfile) {
      lineManager = {
        assignmentId:
          assignment.id,
        id:
          chiefProfile.id,
        fullName:
          chiefProfile.full_name ||
          'Chief Applicant',
        email:
          chiefProfile.email || '',
        phone:
          chiefProfile.phone || '',
        accountStatus:
          chiefProfile.account_status ||
          '',
        assignedAt:
          assignment.assigned_at ||
          null,
      };
    }
  }

  const {
    data: ndaDocument,
    error: ndaError,
  } = await supabase
    .from('staff_documents')
    .select(`
      id,
      file_name,
      mime_type,
      file_size,
      uploaded_at
    `)
    .eq(
      'user_id',
      linkerUserId
    )
    .eq(
      'document_type',
      'nda'
    )
    .eq(
      'is_active',
      true
    )
    .maybeSingle();

  if (ndaError) {
    throw ndaError;
  }

  return {
    lineManager,
    nda:
      ndaDocument
        ? {
            id:
              ndaDocument.id,
            fileName:
              ndaDocument.file_name,
            mimeType:
              ndaDocument.mime_type ||
              '',
            fileSize:
              Number(
                ndaDocument.file_size ||
                0
              ),
            uploadedAt:
              ndaDocument.uploaded_at ||
              null,
          }
        : null,
  };
}
