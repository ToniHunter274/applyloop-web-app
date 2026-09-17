import fs from 'fs/promises';
import path from 'path';
import formidable from 'formidable';

import {
  ApiError,
  requireAdmin,
} from '../../../../../lib/auth/requireAdmin';

const DOCUMENT_BUCKET =
  'staff-documents';

const MAX_FILE_SIZE =
  10 * 1024 * 1024;

const ALLOWED_TYPES =
  new Set([
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  ]);

const ALLOWED_EXTENSIONS =
  new Set([
    '.pdf',
    '.doc',
    '.docx',
  ]);

export const config = {
  api: {
    bodyParser: false,
  },
};

function getApplicantId(req) {
  const applicantId =
    Array.isArray(req.query.id)
      ? req.query.id[0]
      : req.query.id;

  if (!applicantId) {
    throw new ApiError(
      400,
      'An Applicant ID is required.'
    );
  }

  return applicantId;
}

async function requireTargetApplicant(
  supabase,
  applicantId
) {
  const {
    data: applicant,
    error: applicantError,
  } = await supabase
    .from('applicants')
    .select(`
      id,
      user_id
    `)
    .eq('id', applicantId)
    .maybeSingle();

  if (
    applicantError ||
    !applicant
  ) {
    throw new ApiError(
      404,
      'The Applicant could not be found.'
    );
  }

  const {
    data: profile,
    error: profileError,
  } = await supabase
    .from('profiles')
    .select(`
      id,
      full_name,
      email,
      role
    `)
    .eq(
      'id',
      applicant.user_id
    )
    .maybeSingle();

  if (
    profileError ||
    !profile ||
    profile.role !== 'applicant'
  ) {
    throw new ApiError(
      404,
      'The Applicant profile could not be found.'
    );
  }

  return {
    ...applicant,
    profile,
  };
}

async function getActiveDocument(
  supabase,
  userId
) {
  const {
    data,
    error,
  } = await supabase
    .from('staff_documents')
    .select(`
      id,
      file_name,
      file_path,
      mime_type,
      file_size,
      uploaded_at
    `)
    .eq('user_id', userId)
    .eq('document_type', 'nda')
    .eq('is_active', true)
    .maybeSingle();

  if (error) {
    console.error(
      'Unable to load Applicant employee document:',
      error
    );

    throw new ApiError(
      500,
      'The employee agreement could not be loaded.'
    );
  }

  return data || null;
}

function formatDocument(document) {
  if (!document) {
    return null;
  }

  return {
    id: document.id,
    fileName:
      document.file_name,
    mimeType:
      document.mime_type || '',
    fileSize:
      Number(
        document.file_size || 0
      ),
    uploadedAt:
      document.uploaded_at,
  };
}

async function handleGet(
  req,
  res,
  supabase,
  applicant
) {
  const document =
    await getActiveDocument(
      supabase,
      applicant.user_id
    );

  res.setHeader(
    'Cache-Control',
    'no-store'
  );

  if (!document) {
    if (
      String(
        req.query?.download || ''
      ) === '1'
    ) {
      throw new ApiError(
        404,
        'No employee agreement has been uploaded yet.'
      );
    }

    return res
      .status(200)
      .json({
        document: null,
      });
  }

  if (
    String(
      req.query?.download || ''
    ) !== '1'
  ) {
    return res
      .status(200)
      .json({
        document:
          formatDocument(
            document
          ),
      });
  }

  const {
    data: signedData,
    error: signedError,
  } = await supabase.storage
    .from(DOCUMENT_BUCKET)
    .createSignedUrl(
      document.file_path,
      60,
      {
        download:
          document.file_name,
      }
    );

  if (
    signedError ||
    !signedData?.signedUrl
  ) {
    console.error(
      'Unable to sign Applicant employee document:',
      signedError
    );

    throw new ApiError(
      500,
      'The employee agreement could not be downloaded.'
    );
  }

  return res
    .status(200)
    .json({
      document:
        formatDocument(
          document
        ),
      filename:
        document.file_name,
      url:
        signedData.signedUrl,
    });
}

async function handlePost(
  req,
  res,
  supabase,
  applicant,
  adminProfile
) {
  const form =
    formidable({
      multiples: false,
      maxFileSize:
        MAX_FILE_SIZE,
      maxFiles: 1,
    });

  let files;

  try {
    [, files] =
      await form.parse(req);
  } catch (error) {
    if (
      String(
        error?.message || ''
      )
        .toLowerCase()
        .includes(
          'maxfilesize'
        ) ||
      Number(
        error?.code
      ) === 1009
    ) {
      throw new ApiError(
        413,
        'The document must be 10 MB or smaller.'
      );
    }

    throw new ApiError(
      400,
      'The document upload could not be read.'
    );
  }

  const uploaded =
    Array.isArray(
      files.document
    )
      ? files.document[0]
      : files.document;

  if (!uploaded) {
    throw new ApiError(
      400,
      'Choose a document to upload.'
    );
  }

  const originalName =
    String(
      uploaded.originalFilename ||
      'employee-agreement'
    ).trim();

  const extension =
    path
      .extname(originalName)
      .toLowerCase();

  const mimeType =
    uploaded.mimetype ||
    '';

  if (
    !ALLOWED_TYPES.has(
      mimeType
    ) ||
    !ALLOWED_EXTENSIONS.has(
      extension
    )
  ) {
    throw new ApiError(
      400,
      'Upload a PDF, DOC, or DOCX document.'
    );
  }

  if (
    Number(
      uploaded.size || 0
    ) >
    MAX_FILE_SIZE
  ) {
    throw new ApiError(
      413,
      'The document must be 10 MB or smaller.'
    );
  }

  const safeBaseName =
    path
      .basename(
        originalName,
        extension
      )
      .replace(
        /[^a-zA-Z0-9_-]+/g,
        '-'
      )
      .replace(
        /-+/g,
        '-'
      )
      .replace(
        /^-|-$|^_+|_+$/g,
        ''
      )
      .slice(0, 80) ||
    'employee-agreement';

  const safeFileName =
    `${safeBaseName}${extension}`;

  const storagePath =
    [
      'applicants',
      applicant.id,
      'nda',
      `${Date.now()}-${safeFileName}`,
    ].join('/');

  const fileBuffer =
    await fs.readFile(
      uploaded.filepath
    );

  const {
    error: uploadError,
  } = await supabase.storage
    .from(DOCUMENT_BUCKET)
    .upload(
      storagePath,
      fileBuffer,
      {
        contentType:
          mimeType,
        upsert: false,
      }
    );

  if (uploadError) {
    console.error(
      'Unable to upload Applicant employee document:',
      uploadError
    );

    throw new ApiError(
      500,
      'The employee agreement could not be uploaded.'
    );
  }

  const {
    data: documentRows,
    error: documentError,
  } = await supabase.rpc(
    'set_active_staff_document',
    {
      p_user_id:
        applicant.user_id,
      p_document_type:
        'nda',
      p_file_path:
        storagePath,
      p_file_name:
        safeFileName,
      p_mime_type:
        mimeType,
      p_file_size:
        Number(
          uploaded.size || 0
        ),
      p_uploaded_by:
        adminProfile.id,
    }
  );

  if (documentError) {
    await supabase.storage
      .from(DOCUMENT_BUCKET)
      .remove([
        storagePath,
      ]);

    console.error(
      'Unable to register Applicant employee document:',
      documentError
    );

    throw new ApiError(
      500,
      'The employee agreement could not be saved.'
    );
  }

  const document =
    Array.isArray(
      documentRows
    )
      ? documentRows[0]
      : documentRows;

  return res
    .status(201)
    .json({
      message:
        'Employee agreement uploaded successfully.',
      document:
        formatDocument(
          document
        ),
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

    return res
      .status(405)
      .json({
        error:
          'Method not allowed.',
      });
  }

  try {
    const {
      supabase,
      profile: adminProfile,
    } = await requireAdmin(req);

    const applicantId =
      getApplicantId(req);

    const applicant =
      await requireTargetApplicant(
        supabase,
        applicantId
      );

    if (
      req.method === 'GET'
    ) {
      return await handleGet(
        req,
        res,
        supabase,
        applicant
      );
    }

    return await handlePost(
      req,
      res,
      supabase,
      applicant,
      adminProfile
    );
  } catch (error) {
    const statusCode =
      error instanceof ApiError
        ? error.statusCode
        : 500;

    if (
      statusCode >= 500
    ) {
      console.error(
        'Applicant employee document API error:',
        error
      );
    }

    return res
      .status(statusCode)
      .json({
        error:
          error?.message ||
          'The employee agreement could not be managed.',
      });
  }
}
