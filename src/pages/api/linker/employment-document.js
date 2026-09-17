import {
  ApiError,
} from '../../../lib/auth/requireAdmin';

import {
  requireLinker,
} from '../../../lib/auth/requireLinker';

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
      error: 'Method not allowed.',
    });
  }

  try {
    const {
      profile,
      supabase,
    } = await requireLinker(req);

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
        profile.id
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
        'Your employee contract could not be loaded.'
      );
    }

    if (!document) {
      throw new ApiError(
        404,
        'No employee contract has been uploaded yet.'
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
        'Your employee contract could not be downloaded.'
      );
    }

    return res
      .status(200)
      .json({
        url:
          signed.signedUrl,
        filename:
          document.file_name,
      });
  } catch (error) {
    const statusCode =
      error instanceof ApiError
        ? error.statusCode
        : 500;

    if (statusCode >= 500) {
      console.error(
        'Linker contract download API error:',
        error
      );
    }

    return res
      .status(statusCode)
      .json({
        error:
          error?.message ||
          'The employee contract could not be downloaded.',
      });
  }
}
