import React, { useMemo, useState } from 'react';
import { FiSend } from 'react-icons/fi';

const MAX_JOB_LINKS = 20;

function extractJobLinks(value) {
  const text = String(value || '');

  const starts = [
    ...text.matchAll(
      /https?:\/\//gi
    ),
  ];

  return starts
    .map((match, index) => {
      const start =
        match.index ?? 0;

      const next =
        starts[index + 1];

      const end =
        next?.index ??
        text.length;

      const section =
        text
          .slice(start, end)
          .trim();

      const candidate =
        section
          .split(/\s+/)[0]
          .replace(
            /[),.;\]}"']+$/g,
            ''
          );

      return candidate;
    })
    .filter(Boolean);
}

const AddJobLinkModal = ({
  isOpen,
  onClose,
  onConfirm,
}) => {
  const [
    jobLinksText,
    setJobLinksText,
  ] = useState('');

  const [
    comment,
    setComment,
  ] = useState('');

  const [
    isSubmitting,
    setIsSubmitting,
  ] = useState(false);

  const [
    error,
    setError,
  ] = useState('');

  const jobLinks = useMemo(
    () =>
      extractJobLinks(
        jobLinksText
      ),
    [jobLinksText]
  );

  const tooManyLinks =
    jobLinks.length >
    MAX_JOB_LINKS;

  if (!isOpen) {
    return null;
  }

  const handleSubmit =
    async () => {
      if (
        !jobLinks.length ||
        tooManyLinks ||
        isSubmitting
      ) {
        return;
      }

      setIsSubmitting(true);
      setError('');

      try {
        await onConfirm({
          jobLinks,
          comment,
        });

        setJobLinksText('');
        setComment('');
        onClose();
      } catch (submitError) {
        setError(
          submitError.message ||
            'We could not send these job links.'
        );
      } finally {
        setIsSubmitting(false);
      }
    };

  const sendLabel =
    jobLinks.length
      ? `Send ${jobLinks.length} ${
          jobLinks.length === 1
            ? 'Link'
            : 'Links'
        }`
      : 'Send Links';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm transition-opacity">
      <div className="w-[620px] max-w-[calc(100vw-32px)] overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-2xl transition-all animate-scaleIn dark:border-gray-700 dark:bg-gray-800">
        <div className="px-8 py-6">
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white">
            Send Job Links
          </h2>

          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Paste up to 20 job links below.
          </p>
        </div>

        <div className="space-y-6 px-8 pb-6">
          <div>
            <div className="mb-2 flex items-center justify-between gap-4">
              <label
                htmlFor="job-links"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                Job links
              </label>

              <span
                className={`text-xs font-semibold ${
                  tooManyLinks
                    ? 'text-red-600 dark:text-red-400'
                    : 'text-gray-400'
                }`}
              >
                {jobLinks.length} / {MAX_JOB_LINKS} links
              </span>
            </div>

            <textarea
              id="job-links"
              rows={9}
              value={jobLinksText}
              onChange={(event) =>
                setJobLinksText(
                  event.target.value
                )
              }
              disabled={isSubmitting}
              placeholder="Paste your job links here..."
              className="w-full resize-y rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 outline-none transition-all placeholder-gray-400 focus:border-transparent focus:ring-2 focus:ring-[#1E50C3] disabled:opacity-60 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
            />

            <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
              Paste links together — ApplyLoop will separate them automatically.
            </p>

            {jobLinksText.trim() &&
              !jobLinks.length && (
                <p className="mt-2 text-xs font-medium text-amber-600 dark:text-amber-400">
                  Paste a complete job link to continue.
                </p>
              )}

            {tooManyLinks && (
              <p className="mt-2 text-xs font-medium text-red-600 dark:text-red-400">
                You can send up to 20 links at once. Remove {jobLinks.length - MAX_JOB_LINKS}.
              </p>
            )}
          </div>

          <div>
            <label
              htmlFor="job-comment"
              className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              Note (optional)
            </label>

            <input
              id="job-comment"
              type="text"
              value={comment}
              onChange={(event) =>
                setComment(
                  event.target.value
                )
              }
              disabled={isSubmitting}
              placeholder="Add a note for these jobs..."
              className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-gray-900 outline-none transition-all placeholder-gray-400 focus:border-transparent focus:ring-2 focus:ring-[#1E50C3] disabled:opacity-60 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
            />
          </div>

          {error && (
            <div className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 dark:border-red-900/40 dark:bg-red-900/20">
              <p className="text-sm text-red-600 dark:text-red-400">
                {error}
              </p>
            </div>
          )}
        </div>

        <div className="flex items-center justify-end gap-4 border-t border-gray-100 px-8 py-6 dark:border-gray-700/50">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="rounded-xl border border-gray-200 bg-white px-6 py-2.5 text-sm font-medium text-gray-700 transition-all hover:bg-gray-50 disabled:opacity-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleSubmit}
            disabled={
              !jobLinks.length ||
              tooManyLinks ||
              isSubmitting
            }
            className="flex items-center gap-2 rounded-xl bg-[#1E50C3] px-6 py-2.5 text-sm font-medium text-white transition-all hover:bg-[#1A45A7] hover:shadow-lg hover:shadow-blue-500/10 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
          >
            <span>
              {isSubmitting
                ? 'Sending...'
                : sendLabel}
            </span>

            <FiSend className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddJobLinkModal;
