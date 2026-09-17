import {
  readFile,
} from 'node:fs/promises';

import {
  basename,
} from 'node:path';

import formidable from 'formidable';

import {
  ApiError,
  requireAdmin,
} from '../../../../../lib/auth/requireAdmin';

export const config = {
  api: {
    bodyParser: false,
  },
};

const allowedMimeTypes =
  new Set([
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  ]);

function getLinkerId(req) {
  return Array.isArray(
    req.query.id
  )
    ? req.query.id[0]
    : req.query.id;
}

async function requireLinkerProfile(
  supabase,
  linkerId
) {
  const {
    data: linker,
    error,
  } = await supabase
    .from('profiles')
    .select('id, role')
    .eq('id', linkerId)
    .eq('role', 'linker')
    .maybeSingle();

  if (
    error ||
    !linker
  ) {
    throw new ApiError(
      404,
      'The Linker could not be found.'
    );
  }

  return linker;
}

async function getDocument(
  req,
  res
) {
  const {
    supabase,
  } = await requireAdmin(req);

  const linkerId =
    getLinkerId(req);

  await requireLinkerProfile(
    supabase,
    linkerId
  );

  const {
    data: document,
    error,
  } = await supabase
    .from('staff_documents')
    .select(`
      id,
      file_path,
      file_name
    `)
    .eq(
      'user_id',
      linkerId
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

  if (error) {
    throw new ApiError(
      500,
      'The employee contract could not be loaded.'
    );
  }

  if (!document) {
    throw new ApiError(
      404,
      'No employee contract has been uploaded.'
    );
  }

  const {
    data: signed,
    error: signedError,
  } = await supabase.storage
    .from('staff-documents')
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
    !signed?.signedUrl
  ) {
    throw new ApiError(
      500,
      'The employee contract could not be downloaded.'
    );
  }

  return res.status(200).json({
    url: signed.signedUrl,
    filename:
      document.file_name,
  });
}

async function uploadDocument(
  req,
  res
) {
  const {
    supabase,
    profile: adminProfile,
  } = await requireAdmin(req);

  const linkerId =
    getLinkerId(req);

  await requireLinkerProfile(
    supabase,
    linkerId
  );

  const form = formidable({
    multiples: false,
    maxFileSize:
      10 * 1024 * 1024,
  });

  const [
    ,
    files,
  ] = await form.parse(req);

  const uploaded =
    Array.isArray(
      files.document
    )
      ? files.document[0]
      : files.document;

  if (!uploaded) {
    throw new ApiError(
      400,
      'Choose an NDA or employee contract to upload.'
    );
  }

  const mimeType =
    uploaded.mimetype ||
    'application/octet-stream';

  if (
    !allowedMimeTypes.has(
      mimeType
    )
  ) {
    throw new ApiError(
      400,
      'Upload a PDF, DOC, or DOCX document.'
    );
  }

  const originalName =
    basename(
      uploaded.originalFilename ||
      'employee-contract'
    );

  const safeName =
    originalName
      .replace(
        /[^a-zA-Z0-9._-]+/g,
        '-'
      )
      .replace(
        /-+/g,
        '-'
      );

  const filePath =
    `linkers/${linkerId}/nda/${Date.now()}-${safeName}`;

  const fileBuffer =
    await readFile(
      uploaded.filepath
    );

  const {
    error: uploadError,
  } = await supabase.storage
    .from('staff-documents')
    .upload(
      filePath,
      fileBuffer,
      {
        contentType:
          mimeType,
        upsert: false,
      }
    );

  if (uploadError) {
    console.error(
      'Unable to upload Linker employee contract:',
      uploadError
    );

    throw new ApiError(
      500,
      'The employee contract could not be uploaded.'
    );
  }

  const {
    data: documentRows,
    error: documentError,
  } = await supabase.rpc(
    'set_active_staff_document',
    {
      p_user_id:
        linkerId,
      p_document_type:
        'nda',
      p_file_path:
        filePath,
      p_file_name:
        originalName,
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
      .from('staff-documents')
      .remove([filePath]);

    console.error(
      'Unable to save employee contract metadata:',
      documentError
    );

    throw new ApiError(
      500,
      'The employee contract could not be saved.'
    );
  }

  const document =
    Array.isArray(documentRows)
      ? documentRows[0]
      : documentRows;

  return res.status(201).json({
    message:
      'Employee contract uploaded.',
    document: document
      ? {
          id:
            document.id,
          fileName:
            document.file_name,
          mimeType:
            document.mime_type,
          fileSize:
            Number(
              document.file_size ||
              0
            ),
          uploadedAt:
            document.uploaded_at,
        }
      : null,
  });
}

export default async function handler(
  req,
  res
) {
  try {
    if (req.method === 'GET') {
      return await getDocument(
        req,
        res
      );
    }

    if (req.method === 'POST') {
      return await uploadDocument(
        req,
        res
      );
    }

    res.setHeader(
      'Allow',
      'GET, POST'
    );

    return res.status(405).json({
      error: 'Method not allowed.',
    });
  } catch (error) {
    const statusCode =
      error instanceof ApiError
        ? error.statusCode
        : 500;

    if (statusCode >= 500) {
      console.error(
        'Linker employee document API error:',
        error
      );
    }

    return res
      .status(statusCode)
      .json({
        error:
          error?.message ||
          'The employee contract could not be processed.',
      });
  }
}
