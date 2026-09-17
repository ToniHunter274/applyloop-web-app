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

const inputClassName =
  'mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100';

export default function LinkerEmploymentModal({
  linker,
  onClose,
  onChanged,
}) {
  const [isLoading, setIsLoading] =
    useState(true);

  const [error, setError] =
    useState('');

  const [message, setMessage] =
    useState('');

  const [
    employment,
    setEmployment,
  ] = useState({
    lineManager: null,
    nda: null,
  });

  const [
    chiefApplicants,
    setChiefApplicants,
  ] = useState([]);

  const [
    selectedChiefId,
    setSelectedChiefId,
  ] = useState('');

  const [
    selectedDocument,
    setSelectedDocument,
  ] = useState(null);

  const [
    isSavingManager,
    setIsSavingManager,
  ] = useState(false);

  const [
    isUploading,
    setIsUploading,
  ] = useState(false);

  const [
    isDownloading,
    setIsDownloading,
  ] = useState(false);

  const loadEmployment =
    useCallback(async () => {
      setIsLoading(true);
      setError('');

      try {
        const accessToken =
          await getAccessToken();

        const response =
          await fetch(
            `/api/admin/linkers/${linker.id}/employment`,
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

        if (!response.ok) {
          throw new Error(
            result.error ||
              'Linker employment information could not be loaded.'
          );
        }

        const nextEmployment =
          result.employment || {
            lineManager: null,
            nda: null,
          };

        setEmployment(
          nextEmployment
        );

        setChiefApplicants(
          result.chiefApplicants ||
            []
        );

        setSelectedChiefId(
          nextEmployment
            .lineManager?.id ||
            ''
        );
      } catch (loadError) {
        setError(
          loadError?.message ||
            'Linker employment information could not be loaded.'
        );
      } finally {
        setIsLoading(false);
      }
    }, [linker.id]);

  useEffect(() => {
    loadEmployment();
  }, [loadEmployment]);

  const saveLineManager =
    async () => {
      setIsSavingManager(true);
      setError('');
      setMessage('');

      try {
        const accessToken =
          await getAccessToken();

        const current =
          employment.lineManager;

        if (
          current?.id ===
          selectedChiefId
        ) {
          setMessage(
            'The Line Manager is already up to date.'
          );
          return;
        }

        if (current) {
          const response =
            await fetch(
              `/api/admin/linkers/${linker.id}/employment`,
              {
                method: 'DELETE',
                headers: {
                  Authorization:
                    `Bearer ${accessToken}`,
                  'Content-Type':
                    'application/json',
                },
                body: JSON.stringify({
                  assignmentId:
                    current.assignmentId,
                  chiefUserId:
                    current.id,
                }),
              }
            );

          const result =
            await response
              .json()
              .catch(() => ({}));

          if (!response.ok) {
            throw new Error(
              result.error ||
                'The current Line Manager could not be removed.'
            );
          }
        }

        if (selectedChiefId) {
          const response =
            await fetch(
              `/api/admin/linkers/${linker.id}/employment`,
              {
                method: 'POST',
                headers: {
                  Authorization:
                    `Bearer ${accessToken}`,
                  'Content-Type':
                    'application/json',
                },
                body: JSON.stringify({
                  chiefUserId:
                    selectedChiefId,
                }),
              }
            );

          const result =
            await response
              .json()
              .catch(() => ({}));

          if (!response.ok) {
            throw new Error(
              result.error ||
                'The Line Manager could not be assigned.'
            );
          }
        }

        await loadEmployment();

        setMessage(
          selectedChiefId
            ? 'Line Manager updated successfully.'
            : 'Line Manager removed successfully.'
        );

        onChanged?.();
      } catch (saveError) {
        setError(
          saveError?.message ||
            'The Line Manager could not be updated.'
        );
      } finally {
        setIsSavingManager(false);
      }
    };

  const uploadDocument =
    async () => {
      if (!selectedDocument) {
        setError(
          'Choose a PDF, DOC, or DOCX employee contract first.'
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
            `/api/admin/linkers/${linker.id}/employment-document`,
            {
              method: 'POST',
              headers: {
                Authorization:
                  `Bearer ${accessToken}`,
              },
              body: formData,
            }
          );

        const result =
          await response
            .json()
            .catch(() => ({}));

        if (!response.ok) {
          throw new Error(
            result.error ||
              'The employee contract could not be uploaded.'
          );
        }

        setSelectedDocument(
          null
        );

        await loadEmployment();

        setMessage(
          'Employee contract uploaded successfully.'
        );

        onChanged?.();
      } catch (uploadError) {
        setError(
          uploadError?.message ||
            'The employee contract could not be uploaded.'
        );
      } finally {
        setIsUploading(false);
      }
    };

  const downloadDocument =
    async () => {
      setIsDownloading(true);
      setError('');

      try {
        const accessToken =
          await getAccessToken();

        const response =
          await fetch(
            `/api/admin/linkers/${linker.id}/employment-document`,
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

        if (!response.ok) {
          throw new Error(
            result.error ||
              'The employee contract could not be downloaded.'
          );
        }

        const link =
          document.createElement('a');

        link.href = result.url;

        link.rel =
          'noreferrer';

        link.download =
          result.filename ||
          employment.nda?.fileName ||
          'ApplyLoop-employee-contract';

        document.body.appendChild(
          link
        );

        link.click();
        link.remove();
      } catch (downloadError) {
        setError(
          downloadError?.message ||
            'The employee contract could not be downloaded.'
        );
      } finally {
        setIsDownloading(false);
      }
    };

  const busy =
    isSavingManager ||
    isUploading ||
    isDownloading;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-950/55 px-4 py-8 backdrop-blur-sm"
      onMouseDown={(event) => {
        if (
          event.target ===
            event.currentTarget &&
          !busy
        ) {
          onClose();
        }
      }}
    >
      <section className="my-auto w-full max-w-4xl overflow-hidden rounded-3xl bg-white shadow-2xl">
        <header className="flex items-start justify-between border-b border-slate-200 px-6 py-5 sm:px-8">
          <div>
            <h2 className="text-2xl font-bold text-slate-950">
              Employment &amp; NDA —{' '}
              {linker.fullName}
            </h2>

            <p className="mt-2 text-sm leading-6 text-slate-600">
              Manage Line Manager and employee agreement.
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

        <div className="p-6 sm:p-8">
          {error && (
            <div className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
              {error}
            </div>
          )}

          {message && (
            <div className="mb-5 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
              {message}
            </div>
          )}

          {isLoading ? (
            <div className="py-14 text-center text-sm text-slate-500">
              Loading employment information...
            </div>
          ) : (
            <div className="space-y-6">
              <section className="rounded-2xl border border-slate-200 p-5 sm:p-6">
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-700">
                    <FiUserCheck />
                  </div>

                  <div>
                    <h3 className="font-bold text-slate-950">
                      Line Manager
                    </h3>

                    <p className="mt-1 text-sm text-slate-500">
                      Chief Applicant responsible for this Linker.
                    </p>
                  </div>
                </div>

                <div className="mt-5 rounded-xl bg-slate-50 p-4">
                  <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
                    Current
                  </p>

                  <p className="mt-2 font-bold text-slate-900">
                    {employment
                      .lineManager
                      ?.fullName ||
                      'Not assigned yet'}
                  </p>

                  {employment
                    .lineManager
                    ?.email && (
                    <p className="mt-1 text-sm text-slate-500">
                      {
                        employment
                          .lineManager
                          .email
                      }
                    </p>
                  )}
                </div>

                <label className="mt-5 block">
                  <span className="text-sm font-bold text-slate-700">
                    Chief Applicant
                  </span>

                  <select
                    value={
                      selectedChiefId
                    }
                    onChange={(event) =>
                      setSelectedChiefId(
                        event.target.value
                      )
                    }
                    disabled={
                      isSavingManager
                    }
                    className={
                      inputClassName
                    }
                  >
                    <option value="">
                      No Line Manager
                    </option>

                    {chiefApplicants.map(
                      (chief) => (
                        <option
                          key={chief.id}
                          value={chief.id}
                        >
                          {chief.fullName}
                          {chief.email
                            ? ` — ${chief.email}`
                            : ''}
                        </option>
                      )
                    )}
                  </select>
                </label>

                <div className="mt-5 flex justify-end">
                  <button
                    type="button"
                    onClick={
                      saveLineManager
                    }
                    disabled={
                      isSavingManager
                    }
                    className="rounded-xl bg-blue-600 px-5 py-3 text-sm font-bold text-white hover:bg-blue-700 disabled:opacity-50"
                  >
                    {isSavingManager
                      ? 'Saving...'
                      : 'Save Line Manager'}
                  </button>
                </div>
              </section>

              <section className="rounded-2xl border border-slate-200 p-5 sm:p-6">
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-50 text-violet-700">
                    <FiFileText />
                  </div>

                  <div>
                    <h3 className="font-bold text-slate-950">
                      Non-Disclosure Agreement
                    </h3>

                    <p className="mt-1 text-sm text-slate-500">
                      Employee contract / NDA.
                    </p>
                  </div>
                </div>

                {employment.nda ? (
                  <div className="mt-5 flex flex-col gap-4 rounded-xl border border-emerald-200 bg-emerald-50 p-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-xs font-bold uppercase tracking-wide text-emerald-700">
                        Current document
                      </p>

                      <p className="mt-2 break-all font-bold text-emerald-950">
                        {
                          employment.nda
                            .fileName
                        }
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={
                        downloadDocument
                      }
                      disabled={
                        isDownloading
                      }
                      className="inline-flex items-center gap-2 rounded-xl border border-emerald-300 bg-white px-4 py-2.5 text-sm font-bold text-emerald-700"
                    >
                      <FiDownload />

                      {isDownloading
                        ? 'Preparing...'
                        : 'Download'}
                    </button>
                  </div>
                ) : (
                  <div className="mt-5 rounded-xl border border-dashed border-slate-300 bg-slate-50 p-4 text-sm text-slate-500">
                    No employee contract has been uploaded yet.
                  </div>
                )}

                <label className="mt-5 block">
                  <span className="text-sm font-bold text-slate-700">
                    Upload agreement
                  </span>

                  <input
                    type="file"
                    accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                    onChange={(event) =>
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
                      uploadDocument
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
                      : employment.nda
                        ? 'Replace Agreement'
                        : 'Upload Agreement'}
                  </button>
                </div>
              </section>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
