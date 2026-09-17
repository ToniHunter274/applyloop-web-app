import {
  useCallback,
  useEffect,
  useState,
} from 'react';

import {
  FiDownload,
  FiFileText,
  FiUpload,
  FiUserCheck,
  FiX,
} from 'react-icons/fi';

import {
  createClient,
} from '../../lib/supabase/client';

async function getAccessToken() {
  const supabase =
    createClient();

  if (!supabase) {
    throw new Error(
      'The Supabase connection is unavailable.'
    );
  }

  const {
    data: { session },
    error,
  } =
    await supabase.auth.getSession();

  if (
    error ||
    !session?.access_token
  ) {
    throw new Error(
      'Your session has expired. Please sign in again.'
    );
  }

  return session.access_token;
}

export default function ApplicantEmploymentModal({
  applicant,
  onClose,
}) {
  const [
    lineManager,
    setLineManager,
  ] = useState(null);

  const [
    document,
    setDocument,
  ] = useState(null);

  const [
    selectedDocument,
    setSelectedDocument,
  ] = useState(null);

  const [
    isLoading,
    setIsLoading,
  ] = useState(false);

  const [
    isUploading,
    setIsUploading,
  ] = useState(false);

  const [
    isDownloading,
    setIsDownloading,
  ] = useState(false);

  const [
    error,
    setError,
  ] = useState('');

  const [
    message,
    setMessage,
  ] = useState('');

  const loadEmployment =
    useCallback(
      async () => {
        if (!applicant?.id) {
          return;
        }

        setIsLoading(true);
        setError('');

        try {
          const accessToken =
            await getAccessToken();

          const [
            assignmentResponse,
            documentResponse,
          ] =
            await Promise.all([
              fetch(
                `/api/admin/applicants/${applicant.id}/assignments`,
                {
                  cache:
                    'no-store',
                  headers: {
                    Authorization:
                      `Bearer ${accessToken}`,
                  },
                }
              ),
              fetch(
                `/api/admin/applicants/${applicant.id}/employment-document`,
                {
                  cache:
                    'no-store',
                  headers: {
                    Authorization:
                      `Bearer ${accessToken}`,
                  },
                }
              ),
            ]);

          const [
            assignmentResult,
            documentResult,
          ] =
            await Promise.all([
              assignmentResponse
                .json()
                .catch(
                  () => ({})
                ),
              documentResponse
                .json()
                .catch(
                  () => ({})
                ),
            ]);

          if (
            !assignmentResponse.ok
          ) {
            throw new Error(
              assignmentResult.error ||
                'Employment information could not be loaded.'
            );
          }

          if (
            !documentResponse.ok
          ) {
            throw new Error(
              documentResult.error ||
                'The employee agreement could not be loaded.'
            );
          }

          setLineManager(
            assignmentResult
              .lineManager ||
            null
          );

          setDocument(
            documentResult.document ||
            null
          );
        } catch (loadError) {
          setError(
            loadError?.message ||
              'Employment information could not be loaded.'
          );
        } finally {
          setIsLoading(
            false
          );
        }
      },
      [applicant?.id]
    );

  useEffect(() => {
    if (!applicant) {
      return;
    }

    setSelectedDocument(
      null
    );
    setMessage('');
    setError('');

    loadEmployment();
  }, [
    applicant,
    loadEmployment,
  ]);

  if (!applicant) {
    return null;
  }

  const downloadAgreement =
    async () => {
      setIsDownloading(
        true
      );
      setError('');

      try {
        const accessToken =
          await getAccessToken();

        const response =
          await fetch(
            `/api/admin/applicants/${applicant.id}/employment-document?download=1`,
            {
              cache: 'no-store',
              headers: {
                Authorization:
                  `Bearer ${accessToken}`,
              },
            }
          );

        const result =
          await response
            .json()
            .catch(() => ({}));

        if (
          !response.ok ||
          !result.url
        ) {
          throw new Error(
            result.error ||
              'The employee agreement could not be downloaded.'
          );
        }

        const link =
          window.document
            .createElement(
              'a'
            );

        link.href =
          result.url;

        link.rel =
          'noreferrer';

        link.download =
          result.filename ||
          document?.fileName ||
          'ApplyLoop-employee-agreement';

        window.document.body
          .appendChild(link);

        link.click();
        link.remove();
      } catch (
        downloadError
      ) {
        setError(
          downloadError
            ?.message ||
            'The employee agreement could not be downloaded.'
        );
      } finally {
        setIsDownloading(
          false
        );
      }
    };

  const uploadAgreement =
    async () => {
      if (!selectedDocument) {
        setError(
          'Choose a PDF, DOC, or DOCX agreement first.'
        );
        return;
      }

      setIsUploading(true);
      setError('');
      setMessage('');

      try {
        const accessToken =
          await getAccessToken();

        const formData =
          new FormData();

        formData.append(
          'document',
          selectedDocument
        );

        const response =
          await fetch(
            `/api/admin/applicants/${applicant.id}/employment-document`,
            {
              method: 'POST',
              headers: {
                Authorization:
                  `Bearer ${accessToken}`,
              },
              body:
                formData,
            }
          );

        const result =
          await response
            .json()
            .catch(() => ({}));

        if (!response.ok) {
          throw new Error(
            result.error ||
              'The employee agreement could not be uploaded.'
          );
        }

        setDocument(
          result.document ||
          null
        );

        setSelectedDocument(
          null
        );

        setMessage(
          'Employee agreement uploaded successfully.'
        );

        await loadEmployment();
      } catch (
        uploadError
      ) {
        setError(
          uploadError
            ?.message ||
            'The employee agreement could not be uploaded.'
        );
      } finally {
        setIsUploading(
          false
        );
      }
    };

  const busy =
    isUploading ||
    isDownloading;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-950/55 px-4 py-8 backdrop-blur-sm"
      onMouseDown={(
        event
      ) => {
        if (
          event.target ===
            event.currentTarget &&
          !busy
        ) {
          onClose();
        }
      }}
    >
      <section className="my-auto w-full max-w-3xl overflow-hidden rounded-3xl bg-white shadow-2xl">
        <header className="flex items-start justify-between border-b border-slate-200 px-6 py-5 sm:px-8">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-blue-600">
              Employment
            </p>

            <h2 className="mt-1 text-2xl font-bold text-slate-950">
              Employment &amp; NDA —{' '}
              {
                applicant.fullName
              }
            </h2>

            <p className="mt-2 text-sm leading-6 text-slate-600">
              Review the Applicant&apos;s Line Manager and manage their employee agreement.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={busy}
            className="rounded-xl p-2 text-slate-500 hover:bg-slate-100 disabled:opacity-50"
            aria-label="Close"
          >
            <FiX className="h-5 w-5" />
          </button>
        </header>

        <div className="space-y-6 p-6 sm:p-8">
          {error && (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
              {error}
            </div>
          )}

          {message && (
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
              {message}
            </div>
          )}

          {isLoading ? (
            <div className="py-12 text-center text-sm text-slate-500">
              Loading employment information...
            </div>
          ) : (
            <>
              <section className="rounded-2xl border border-slate-200 p-5">
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-700">
                    <FiUserCheck />
                  </div>

                  <div>
                    <h3 className="font-bold text-slate-950">
                      Line Manager
                    </h3>

                    <p className="mt-1 text-sm text-slate-500">
                      Chief Applicant responsible for this Applicant.
                    </p>
                  </div>
                </div>

                <div className="mt-5 rounded-xl bg-slate-50 p-4">
                  <p className="font-bold text-slate-900">
                    {lineManager
                      ?.fullName ||
                      'Not assigned yet'}
                  </p>

                  {lineManager
                    ?.email && (
                    <p className="mt-1 text-sm text-slate-500">
                      {
                        lineManager.email
                      }
                    </p>
                  )}

                  <p className="mt-3 text-xs leading-5 text-slate-500">
                    Line Manager assignments are controlled from Chief Applicants management.
                  </p>
                </div>
              </section>

              <section className="rounded-2xl border border-slate-200 p-5">
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-50 text-violet-700">
                    <FiFileText />
                  </div>

                  <div>
                    <h3 className="font-bold text-slate-950">
                      Non-Disclosure Agreement
                    </h3>

                    <p className="mt-1 text-sm text-slate-500">
                      Employee contract / NDA stored privately for this Applicant.
                    </p>
                  </div>
                </div>

                {document ? (
                  <div className="mt-5 flex flex-col gap-4 rounded-xl border border-emerald-200 bg-emerald-50 p-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-xs font-bold uppercase tracking-wide text-emerald-700">
                        Current agreement
                      </p>

                      <p className="mt-2 break-all font-bold text-emerald-950">
                        {
                          document.fileName
                        }
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={
                        downloadAgreement
                      }
                      disabled={
                        isDownloading
                      }
                      className="inline-flex items-center justify-center gap-2 rounded-xl border border-emerald-300 bg-white px-4 py-2.5 text-sm font-bold text-emerald-700 disabled:opacity-50"
                    >
                      <FiDownload />

                      {isDownloading
                        ? 'Preparing...'
                        : 'Download'}
                    </button>
                  </div>
                ) : (
                  <div className="mt-5 rounded-xl border border-dashed border-slate-300 bg-slate-50 p-4 text-sm text-slate-500">
                    No employee agreement has been uploaded yet.
                  </div>
                )}

                <label className="mt-5 block">
                  <span className="text-sm font-bold text-slate-700">
                    Upload agreement
                  </span>

                  <input
                    type="file"
                    accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                    onChange={(
                      event
                    ) =>
                      setSelectedDocument(
                        event.target
                          .files?.[0] ||
                        null
                      )
                    }
                    className="mt-2 block w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm"
                  />
                </label>

                <p className="mt-2 text-xs text-slate-500">
                  PDF, DOC or DOCX. Maximum 10 MB.
                </p>

                <div className="mt-5 flex justify-end">
                  <button
                    type="button"
                    onClick={
                      uploadAgreement
                    }
                    disabled={
                      isUploading ||
                      !selectedDocument
                    }
                    className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-5 py-3 text-sm font-bold text-white disabled:opacity-40"
                  >
                    <FiUpload />

                    {isUploading
                      ? 'Uploading...'
                      : document
                        ? 'Replace Agreement'
                        : 'Upload Agreement'}
                  </button>
                </div>
              </section>
            </>
          )}
        </div>
      </section>
    </div>
  );
}
