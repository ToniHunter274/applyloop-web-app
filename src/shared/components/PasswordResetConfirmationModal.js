import { useEffect } from 'react';
import {
  FiAlertTriangle,
  FiKey,
  FiX,
} from 'react-icons/fi';

export default function PasswordResetConfirmationModal({
  open,
  name,
  email,
  error = '',
  isSubmitting = false,
  onClose,
  onConfirm,
}) {
  useEffect(() => {
    if (!open) {
      return undefined;
    }

    const previousOverflow =
      document.body.style.overflow;

    const handleKeyDown = (event) => {
      if (
        event.key === 'Escape' &&
        !isSubmitting
      ) {
        onClose();
      }
    };

    document.body.style.overflow =
      'hidden';

    window.addEventListener(
      'keydown',
      handleKeyDown
    );

    return () => {
      document.body.style.overflow =
        previousOverflow;

      window.removeEventListener(
        'keydown',
        handleKeyDown
      );
    };
  }, [
    open,
    isSubmitting,
    onClose,
  ]);

  if (!open) {
    return null;
  }

  return (
    <div
      role="presentation"
      onMouseDown={(event) => {
        if (
          event.target ===
            event.currentTarget &&
          !isSubmitting
        ) {
          onClose();
        }
      }}
      className="fixed inset-0 z-[70] flex items-center justify-center overflow-y-auto bg-slate-950/55 px-4 py-8 backdrop-blur-sm"
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="password-reset-confirmation-title"
        className="my-auto w-full max-w-xl overflow-hidden rounded-3xl bg-white shadow-2xl"
      >
        <div className="flex items-start justify-between border-b border-slate-200 px-6 py-5 sm:px-8">
          <div>
            <h2
              id="password-reset-confirmation-title"
              className="text-2xl font-bold text-slate-950"
            >
              Reset Temporary Password
            </h2>

            <p className="mt-2 text-sm text-slate-600">
              Confirm this action before changing the
              account password.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            aria-label="Close"
            className="rounded-xl p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-800 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <FiX className="h-5 w-5" />
          </button>
        </div>

        <div className="px-6 py-6 sm:px-8">
          <div className="flex items-start gap-4 rounded-2xl border border-amber-200 bg-amber-50 p-5">
            <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full bg-amber-100 text-amber-700">
              <FiAlertTriangle className="h-5 w-5" />
            </div>

            <div>
              <h3 className="font-bold text-slate-950">
                Generate a new temporary password?
              </h3>

              <p className="mt-2 text-sm leading-6 text-slate-700">
                Generating a new temporary password will
                immediately replace the current password.
                The existing password will stop working.
              </p>
            </div>
          </div>

          <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-5">
            <p className="font-semibold text-slate-950">
              {name}
            </p>

            <p className="mt-1 break-all text-sm text-slate-500">
              {email}
            </p>
          </div>

          {error && (
            <div
              role="alert"
              className="mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700"
            >
              {error}
            </div>
          )}
        </div>

        <div className="flex flex-col-reverse gap-3 border-t border-slate-200 px-6 py-5 sm:flex-row sm:justify-end sm:px-8">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="rounded-[14px] border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={onConfirm}
            disabled={isSubmitting}
            className="inline-flex items-center justify-center gap-2 rounded-[14px] bg-red-600 px-5 py-3 text-sm font-semibold text-white shadow-lg transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <FiKey />

            {isSubmitting
              ? 'Generating...'
              : 'Generate New Temporary Password'}
          </button>
        </div>
      </section>
    </div>
  );
}
