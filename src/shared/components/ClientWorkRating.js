import {
  useEffect,
  useState,
} from 'react';
import {
  FiMessageSquare,
  FiStar,
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
    data: {
      session,
    },
    error,
  } =
    await supabase.auth
      .getSession();

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

export default function ClientWorkRating({
  endpoint,
  title,
  description,
  initialRating = 0,
  initialNote = '',
  compact = false,
  onSaved,
}) {
  const [
    rating,
    setRating,
  ] = useState(
    Number(initialRating) || 0
  );

  const [
    note,
    setNote,
  ] = useState(
    initialNote || ''
  );

  const [
    hoverRating,
    setHoverRating,
  ] = useState(0);

  const [
    showFeedback,
    setShowFeedback,
  ] = useState(
    Boolean(initialNote) ||
      !compact
  );

  const [
    isSaving,
    setIsSaving,
  ] = useState(false);

  const [
    error,
    setError,
  ] = useState('');

  const [
    success,
    setSuccess,
  ] = useState('');

  useEffect(() => {
    setRating(
      Number(initialRating) || 0
    );

    setNote(
      initialNote || ''
    );

    if (
      initialNote ||
      !compact
    ) {
      setShowFeedback(true);
    }
  }, [
    compact,
    initialNote,
    initialRating,
  ]);

  const saveRating =
    async () => {
      if (
        isSaving ||
        rating < 1 ||
        rating > 5
      ) {
        return;
      }

      setIsSaving(true);
      setError('');
      setSuccess('');

      try {
        const accessToken =
          await getAccessToken();

        const response =
          await fetch(
            endpoint,
            {
              method: 'PUT',
              headers: {
                Authorization:
                  `Bearer ${accessToken}`,
                'Content-Type':
                  'application/json',
              },
              body:
                JSON.stringify({
                  rating,
                  note,
                }),
            }
          );

        const result =
          await response
            .json()
            .catch(
              () => ({})
            );

        if (
          !response.ok
        ) {
          throw new Error(
            result.error ||
              'Your rating could not be saved.'
          );
        }

        const savedRating =
          result.rating || {
            value:
              rating,
            note,
            updatedAt:
              new Date()
                .toISOString(),
          };

        setRating(
          Number(
            savedRating.value
          ) || rating
        );

        setNote(
          savedRating.note ||
            ''
        );

        setSuccess(
          'Rating saved.'
        );

        if (
          typeof onSaved ===
          'function'
        ) {
          onSaved(
            savedRating
          );
        }
      } catch (saveError) {
        setError(
          saveError?.message ||
            'Your rating could not be saved.'
        );
      } finally {
        setIsSaving(false);
      }
    };

  const displayedRating =
    hoverRating || rating;

  return (
    <section
      className={
        compact
          ? 'mt-4 rounded-xl border border-amber-100 bg-amber-50/60 p-4'
          : 'mt-6 rounded-2xl border border-amber-100 bg-amber-50/50 p-5 sm:p-6'
      }
    >
      <div
        className={
          compact
            ? 'space-y-3'
            : 'flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between'
        }
      >
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <FiStar
              className="h-4 w-4 text-amber-500"
              fill="currentColor"
            />

            <h3
              className={
                compact
                  ? 'text-sm font-bold text-slate-900'
                  : 'text-base font-bold text-slate-950'
              }
            >
              {title}
            </h3>
          </div>

          {description && (
            <p className="mt-1.5 text-xs leading-5 text-slate-500">
              {description}
            </p>
          )}
        </div>

        <div>
          <div
            className="flex items-center gap-1"
            onMouseLeave={() =>
              setHoverRating(0)
            }
            aria-label={title}
          >
            {[1, 2, 3, 4, 5].map(
              (star) => {
                const selected =
                  star <=
                  displayedRating;

                return (
                  <button
                    key={star}
                    type="button"
                    disabled={isSaving}
                    onMouseEnter={() =>
                      setHoverRating(
                        star
                      )
                    }
                    onFocus={() =>
                      setHoverRating(
                        star
                      )
                    }
                    onBlur={() =>
                      setHoverRating(
                        0
                      )
                    }
                    onClick={() => {
                      setRating(
                        star
                      );
                      setSuccess('');
                      setError('');
                    }}
                    aria-label={`${star} star${star === 1 ? '' : 's'}`}
                    title={`${star} star${star === 1 ? '' : 's'}`}
                    className="rounded-md p-1 text-amber-400 transition hover:scale-110 hover:text-amber-500 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <FiStar
                      className={
                        compact
                          ? 'h-5 w-5'
                          : 'h-6 w-6'
                      }
                      fill={
                        selected
                          ? 'currentColor'
                          : 'none'
                      }
                    />
                  </button>
                );
              }
            )}
          </div>

          <p className="mt-1 text-xs font-medium text-slate-500">
            {rating > 0
              ? `${rating}/5 selected`
              : 'Choose 1–5 stars'}
          </p>
        </div>
      </div>

      {compact && (
        <button
          type="button"
          onClick={() =>
            setShowFeedback(
              (current) =>
                !current
            )
          }
          className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-amber-700 hover:text-amber-900"
        >
          <FiMessageSquare />

          {showFeedback
            ? 'Hide feedback'
            : note
              ? 'Edit feedback'
              : 'Add optional feedback'}
        </button>
      )}

      {showFeedback && (
        <label className="mt-4 block">
          <span className="text-xs font-semibold text-slate-700">
            Optional feedback
          </span>

          <textarea
            value={note}
            onChange={(
              event
            ) => {
              setNote(
                event.target.value
              );
              setSuccess('');
              setError('');
            }}
            maxLength={1000}
            rows={
              compact
                ? 3
                : 4
            }
            placeholder="What was good, poor, or could be improved?"
            disabled={isSaving}
            className="mt-2 w-full resize-y rounded-xl border border-amber-200 bg-white px-3.5 py-3 text-sm leading-5 text-slate-800 outline-none transition focus:border-amber-400 focus:ring-4 focus:ring-amber-100 disabled:opacity-60"
          />

          <span className="mt-1 block text-right text-[10px] text-slate-400">
            {note.length}/1000
          </span>
        </label>
      )}

      {(error ||
        success) && (
        <p
          role={
            error
              ? 'alert'
              : 'status'
          }
          className={`mt-3 text-xs font-semibold ${
            error
              ? 'text-red-600'
              : 'text-emerald-700'
          }`}
        >
          {error || success}
        </p>
      )}

      <div className="mt-4 flex justify-end">
        <button
          type="button"
          disabled={
            isSaving ||
            rating < 1
          }
          onClick={
            saveRating
          }
          className="inline-flex min-h-10 items-center justify-center rounded-xl bg-amber-500 px-4 text-sm font-bold text-white transition hover:bg-amber-600 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isSaving
            ? 'Saving...'
            : rating > 0
              ? 'Save Rating'
              : 'Select a Rating'}
        </button>
      </div>
    </section>
  );
}
