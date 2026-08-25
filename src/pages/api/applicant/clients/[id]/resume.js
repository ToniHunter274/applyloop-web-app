import { basename } from 'node:path';
import {
  PortalApiError,
  requirePortalProfile,
} from '../../../../../lib/auth/requirePortalProfile';

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
    } = await requirePortalProfile(
      req
    );

    if (
      profile.role !== 'applicant'
    ) {
      throw new PortalApiError(
        403,
        'Only Applicants can access client resumes from this workspace.'
      );
    }

    const clientId =
      Array.isArray(req.query.id)
        ? req.query.id[0]
        : String(
            req.query.id || ''
          ).trim();

    if (!clientId) {
      throw new PortalApiError(
        400,
        'A client ID is required.'
      );
    }

    const {
      data: applicant,
      error: applicantError,
    } = await supabase
      .from('applicants')
      .select('id')
      .eq(
        'user_id',
        profile.id
      )
      .single();

    if (
      applicantError ||
      !applicant
    ) {
      throw new PortalApiError(
        404,
        'Your Applicant record could not be found.'
      );
    }

    const {
      data: assignment,
      error: assignmentError,
    } = await supabase
      .from(
        'client_applicant_assignments'
      )
      .select(
        'client_id'
      )
      .eq(
        'applicant_id',
        applicant.id
      )
      .eq(
        'client_id',
        clientId
      )
      .maybeSingle();

    if (assignmentError) {
      console.error(
        'Unable to verify client assignment:',
        assignmentError
      );

      throw new PortalApiError(
        500,
        'The client assignment could not be verified.'
      );
    }

    if (!assignment) {
      throw new PortalApiError(
        403,
        'This Client is not assigned to you.'
      );
    }

    const {
      data: client,
      error: clientError,
    } = await supabase
      .from('clients')
      .select(
        'id, resume_path'
      )
      .eq(
        'id',
        clientId
      )
      .single();

    if (
      clientError ||
      !client
    ) {
      throw new PortalApiError(
        404,
        'The Client could not be found.'
      );
    }

    if (!client.resume_path) {
      throw new PortalApiError(
        404,
        'This Client does not have a resume.'
      );
    }

    const {
      data: signedUrlData,
      error: signedUrlError,
    } = await supabase.storage
      .from('client-resumes')
      .createSignedUrl(
        client.resume_path,
        60
      );

    if (
      signedUrlError ||
      !signedUrlData?.signedUrl
    ) {
      console.error(
        'Unable to create Applicant resume URL:',
        signedUrlError
      );

      throw new PortalApiError(
        500,
        'The client resume could not be opened.'
      );
    }

    const storedFilename =
      basename(
        client.resume_path
      );

    return res.status(200).json({
      url:
        signedUrlData.signedUrl,
      filename:
        storedFilename.replace(
          /^\d+-/,
          ''
        ),
    });
  } catch (error) {
    const statusCode =
      error instanceof
      PortalApiError
        ? error.statusCode
        : 500;

    if (statusCode >= 500) {
      console.error(
        'Applicant resume API error:',
        error
      );
    }

    return res
      .status(statusCode)
      .json({
        error:
          statusCode >= 500
            ? 'Unable to open the client resume right now.'
            : error.message,
      });
  }
}
