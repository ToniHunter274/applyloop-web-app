import { basename } from 'node:path';
import {
  ApiError,
  requireAdmin,
} from '../../../../../lib/auth/requireAdmin';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');

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

    const { supabase } = await requireAdmin(req);

    const { data: client, error: clientError } =
      await supabase
        .from('clients')
        .select('id, resume_path')
        .eq('id', clientId)
        .single();

    if (clientError || !client) {
      throw new ApiError(
        404,
        'The client could not be found.'
      );
    }

    if (!client.resume_path) {
      throw new ApiError(
        404,
        'This client does not have a resume.'
      );
    }

    const {
      data: signedUrlData,
      error: signedUrlError,
    } = await supabase.storage
      .from('client-resumes')
      .createSignedUrl(client.resume_path, 60);

    if (signedUrlError || !signedUrlData?.signedUrl) {
      console.error(
        'Unable to create resume download URL:',
        signedUrlError
      );

      throw new ApiError(
        500,
        'The resume could not be downloaded.'
      );
    }

    const storedFilename = basename(client.resume_path);

    return res.status(200).json({
      url: signedUrlData.signedUrl,
      filename: storedFilename.replace(/^\d+-/, ''),
    });
  } catch (error) {
    const statusCode =
      error instanceof ApiError
        ? error.statusCode
        : 500;

    if (statusCode >= 500) {
      console.error('Resume download API error:', error);
    }

    return res.status(statusCode).json({
      error:
        statusCode >= 500
          ? 'Unable to download the resume right now.'
          : error.message,
    });
  }
}
