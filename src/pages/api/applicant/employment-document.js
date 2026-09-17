import {
  ApiError,
} from '../../../lib/auth/requireAdmin';

import {
  requireApplicant,
} from '../../../lib/auth/requireApplicant';

const DOCUMENT_BUCKET =
  'staff-documents';

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
      file_path
    `)
    .eq('user_id', userId)
    .eq('document_type', 'nda')
    .eq('is_active', true)
    .maybeSingle();

  if (error) {
    console.error(
      'Unable to load Applicant employment document:',
      error
    );

    throw new ApiError(
      500,
      'Your employee agreement could not be loaded.'
    );
  }

  return data || null;
}

export default async function handler(
  req,
  res
) {
  if (req.method !== 'GET') {
    res.setHeader(
      'Allow',
      'GET'
    );

    return res.status(405).json({
      error:
        'Method not allowed.',
    });
  }

  try {
    const {
      profile,
      supabase,
    } = await requireApplicant(req);

    const document =
      await getActiveDocument(
        supabase,
        profile.id
      );

    res.setHeader(
      'Cache-Control',
      'no-store'
    );

    if (!document) {
      if (
        String(
          req.query?.download ||
          ''
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

    const documentInfo = {
      id: document.id,
      fileName:
        document.file_name,
    };

    if (
      String(
        req.query?.download ||
        ''
      ) !== '1'
    ) {
      return res
        .status(200)
        .json({
          document:
            documentInfo,
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
        'Unable to create Applicant NDA download URL:',
        signedError
      );

      throw new ApiError(
        500,
        'Your employee agreement could not be downloaded.'
      );
    }

    return res
      .status(200)
      .json({
        document:
          documentInfo,
        filename:
          document.file_name,
        url:
          signedData.signedUrl,
      });
  } catch (error) {
    const statusCode =
      error instanceof ApiError
        ? error.statusCode
        : 500;

    if (statusCode >= 500) {
      console.error(
        'Applicant employment document API error:',
        error
      );
    }

    return res
      .status(statusCode)
      .json({
        error:
          error?.message ||
          'Your employee agreement could not be loaded.',
      });
  }
}
