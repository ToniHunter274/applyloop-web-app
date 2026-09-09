import {
  useEffect,
  useState,
} from 'react';
import { FiStar } from 'react-icons/fi';

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

export default function ClientApplicantRating() {
  const [
    applicants,
    setApplicants,
  ] = useState([]);

  const [
    isLoading,
    setIsLoading,
  ] = useState(true);

  const [
    error,
    setError,
  ] = useState('');

  const [
    message,
    setMessage,
  ] = useState('');

  const [
    savingApplicantId,
    setSavingApplicantId,
  ] = useState('');

  const [
    refreshKey,
    setRefreshKey,
  ] = useState(0);

  useEffect(() => {
    let cancelled = false;
    let controller =
      new AbortController();

    const loadRatings =
      async () => {
        controller.abort();
        controller =
          new AbortController();

        setIsLoading(true);
        setError('');

        try {
          const accessToken =
            await getAccessToken();

          const response =
            await fetch(
              '/api/client/applicant-ratings',
              {
                cache: 'no-store',
                signal:
                  controller.signal,
                headers: {
                  Authorization:
                    'Bearer ' +
                    accessToken,
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
                'Applicant ratings could not be loaded.'
            );
          }

          if (
            !Array.isArray(
              result.applicants
            )
          ) {
            throw new Error(
              'The Applicant rating response was invalid.'
            );
          }

          if (
            !cancelled &&
            !controller.signal.aborted
          ) {
            setApplicants(
              result.applicants
            );
          }
        } catch (loadError) {
          if (
            !cancelled &&
            loadError?.name !==
              'AbortError'
          ) {
            setApplicants([]);
            setError(
              loadError?.message ||
                'Applicant ratings could not be loaded.'
            );
          }
        } finally {
          if (
            !cancelled &&
            !controller.signal.aborted
          ) {
            setIsLoading(false);
          }
        }
      };

    loadRatings();

    const handleFocus = () => {
      loadRatings();
    };

    window.addEventListener(
      'focus',
      handleFocus
    );

    return () => {
      cancelled = true;
      controller.abort();

      window.removeEventListener(
        'focus',
        handleFocus
      );
    };
  }, [refreshKey]);

  const saveRating =
    async (
      applicantId,
      rating
    ) => {
      if (savingApplicantId) {
        return;
      }

      setSavingApplicantId(
        applicantId
      );
      setError('');
      setMessage('');

      try {
        const accessToken =
          await getAccessToken();

        const response =
          await fetch(
            '/api/client/applicant-ratings',
            {
              method: 'PUT',
              headers: {
                Authorization:
                  'Bearer ' +
                  accessToken,
                'Content-Type':
                  'application/json',
              },
              body:
                JSON.stringify({
                  applicantId,
                  rating,
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
              'Your rating could not be saved.'
          );
        }

        setApplicants(
          (current) =>
            current.map(
              (applicant) =>
                applicant.id ===
                applicantId
                  ? {
                      ...applicant,
                      rating:
                        result.rating
                          ?.rating ||
                        rating,
                      ratingUpdatedAt:
                        result.rating
                          ?.updatedAt ||
                        new Date()
                          .toISOString(),
                    }
                  : applicant
            )
        );

        setMessage(
          'Rating saved.'
        );
      } catch (saveError) {
        setError(
          saveError?.message ||
            'Your rating could not be saved.'
        );
      } finally {
        setSavingApplicantId('');
      }
    };

  return (
    <section
      aria-label="Rate your applicant"
      className="mb-3 max-h-[38vh] overflow-y-auto border-b border-slate-100 pb-3"
    >
      {isLoading ? (
        <p className="px-3 py-2 text-xs text-slate-500">
          Loading assigned Applicant...
        </p>
      ) : error ? (
        <div className="px-3 py-2">
          <p
            role="alert"
            className="text-xs font-medium text-rose-600"
          >
            {error}
          </p>

          <button
            type="button"
            onClick={() =>
              setRefreshKey(
                (value) =>
                  value + 1
              )
            }
            className="mt-1 text-xs font-semibold text-blue-600 hover:text-blue-800"
          >
            Retry
          </button>
        </div>
      ) : applicants.length === 0 ? (
        <p className="px-3 py-2 text-xs text-slate-500">
          No Applicant is currently assigned.
        </p>
      ) : (
        <div className="space-y-2">
          {applicants.map(
            (applicant) => (
              <div
                key={applicant.id}
                className="rounded-xl bg-slate-50 px-3 py-3"
              >
                <p
                  className="truncate text-xs font-semibold text-slate-800"
                  title={
                    applicant.fullName
                  }
                >
                  {applicant.fullName}
                </p>

                <p className="mt-1 text-[11px] text-slate-500">
                  {applicant.rating
                    ? `Your rating: ${applicant.rating}/5`
                    : 'Not rated yet'}
                </p>

                <div
                  className="mt-1 flex items-center gap-0.5"
                  aria-label={
                    `Rate ${applicant.fullName}`
                  }
                >
                  {[1, 2, 3, 4, 5].map(
                    (star) => {
                      const selected =
                        star <=
                        Number(
                          applicant.rating ||
                            0
                        );

                      return (
                        <button
                          key={star}
                          type="button"
                          disabled={Boolean(
                            savingApplicantId
                          )}
                          aria-label={
                            `${star} star${star === 1 ? '' : 's'} for ${applicant.fullName}`
                          }
                          title={
                            `Rate ${star} star${star === 1 ? '' : 's'}`
                          }
                          onClick={() =>
                            saveRating(
                              applicant.id,
                              star
                            )
                          }
                          className="rounded p-0.5 text-amber-400 transition hover:scale-110 hover:text-amber-500 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          <FiStar
                            className="h-5 w-5"
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

                {savingApplicantId ===
                  applicant.id && (
                  <p className="mt-1 text-[11px] font-medium text-blue-600">
                    Saving...
                  </p>
                )}
              </div>
            )
          )}

          {message && (
            <p
              role="status"
              className="px-3 text-[11px] font-medium text-emerald-600"
            >
              {message}
            </p>
          )}
        </div>
      )}
    </section>
  );
}
