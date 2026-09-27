import {
  useEffect,
  useState,
} from 'react';
import {
  FiAlertTriangle,
  FiCheckCircle,
  FiInfo,
  FiX,
  FiZap,
} from 'react-icons/fi';
import {
  createClient,
} from '../../lib/supabase/client';

const TONES = {
  info: {
    icon: FiInfo,
    label: 'Platform Update',
    wrap:
      'border-blue-200 bg-blue-50 text-blue-950',
    iconWrap:
      'bg-blue-100 text-blue-700',
    meta:
      'text-blue-600',
  },
  success: {
    icon: FiCheckCircle,
    label: 'Update',
    wrap:
      'border-emerald-200 bg-emerald-50 text-emerald-950',
    iconWrap:
      'bg-emerald-100 text-emerald-700',
    meta:
      'text-emerald-600',
  },
  warning: {
    icon: FiAlertTriangle,
    label: 'Important Update',
    wrap:
      'border-amber-200 bg-amber-50 text-amber-950',
    iconWrap:
      'bg-amber-100 text-amber-700',
    meta:
      'text-amber-700',
  },
  critical: {
    icon: FiZap,
    label: 'Urgent Update',
    wrap:
      'border-red-200 bg-red-50 text-red-950',
    iconWrap:
      'bg-red-100 text-red-700',
    meta:
      'text-red-600',
  },
};

function formatPublishedAt(
  value
) {
  if (!value) {
    return '';
  }

  const date =
    new Date(value);

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return '';
  }

  return date.toLocaleDateString(
    'en-US',
    {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }
  );
}

export default function WorkspaceAnnouncements() {
  const [
    announcements,
    setAnnouncements,
  ] = useState([]);

  const [
    collapsed,
    setCollapsed,
  ] = useState([]);

  useEffect(() => {
    let cancelled = false;

    const loadAnnouncements =
      async () => {
        try {
          const supabase =
            createClient();

          if (!supabase) {
            return;
          }

          const {
            data: {
              session,
            },
          } =
            await supabase.auth
              .getSession();

          if (
            !session
              ?.access_token
          ) {
            return;
          }

          const response =
            await fetch(
              '/api/announcements',
              {
                headers: {
                  Authorization:
                    `Bearer ${session.access_token}`,
                },
              }
            );

          const body =
            await response
              .json()
              .catch(
                () => ({})
              );

          if (!response.ok) {
            return;
          }

          if (!cancelled) {
            setAnnouncements(
              Array.isArray(
                body.announcements
              )
                ? body.announcements
                : []
            );
          }
        } catch {
          // Announcements must never block
          // the workspace itself.
        }
      };

    loadAnnouncements();

    const handleRefresh =
      () => {
        loadAnnouncements();
      };

    window.addEventListener(
      'applyloop:announcements-refresh',
      handleRefresh
    );

    return () => {
      cancelled = true;

      window.removeEventListener(
        'applyloop:announcements-refresh',
        handleRefresh
      );
    };
  }, []);

  if (
    announcements.length ===
    0
  ) {
    return null;
  }

  const expanded =
    announcements.filter(
      (announcement) =>
        !collapsed.includes(
          announcement.id
        )
    );

  const collapsedItems =
    announcements.filter(
      (announcement) =>
        collapsed.includes(
          announcement.id
        )
    );

  const ticker =
    collapsedItems[0] || null;

  return (
    <div className="mb-7 space-y-3">
      {expanded
        .slice(0, 3)
        .map(
          (announcement) => {
            const tone =
              TONES[
                announcement.tone
              ] ||
              TONES.info;

            const Icon =
              tone.icon;

            return (
              <section
                key={
                  announcement.id
                }
                className={`relative rounded-2xl border px-5 py-4 shadow-sm ${tone.wrap}`}
              >
                <div className="flex items-start gap-4 pr-8">
                  <div
                    className={`mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${tone.iconWrap}`}
                  >
                    <Icon className="h-5 w-5" />
                  </div>

                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                      <p
                        className={`text-[10px] font-bold uppercase tracking-[0.14em] ${tone.meta}`}
                      >
                        {
                          tone.label
                        }
                      </p>

                      <span className="text-[10px] text-slate-400">
                        {formatPublishedAt(
                          announcement
                            .published_at
                        )}
                      </span>
                    </div>

                    <h2 className="mt-1 text-sm font-bold sm:text-base">
                      {
                        announcement.title
                      }
                    </h2>

                    <p className="mt-1.5 whitespace-pre-line text-sm leading-6 opacity-80">
                      {
                        announcement.message
                      }
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  data-no-glance
                  aria-label="Collapse announcement"
                  title="Collapse to ticker"
                  onClick={() =>
                    setCollapsed(
                      (current) =>
                        current.includes(
                          announcement.id
                        )
                          ? current
                          : [
                              ...current,
                              announcement.id,
                            ]
                    )
                  }
                  className="absolute right-3 top-3 rounded-lg p-1.5 opacity-50 transition hover:bg-white/60 hover:opacity-100"
                >
                  <FiX className="h-4 w-4" />
                </button>
              </section>
            );
          }
        )}

      {ticker && (
        <button
          type="button"
          data-no-glance
          title="Click to expand update"
          onClick={() =>
            setCollapsed(
              (current) =>
                current.filter(
                  (id) =>
                    id !==
                    ticker.id
                )
            )
          }
          className="block w-full overflow-hidden rounded-xl border border-slate-200 bg-white px-3 py-2 text-left shadow-sm"
        >
          <div className="flex items-center gap-3">
            <span className="shrink-0 rounded-full bg-blue-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-blue-700">
              Update
            </span>

            <div className="min-w-0 flex-1 overflow-hidden">
              <span
                className="inline-block min-w-max whitespace-nowrap text-xs font-medium text-slate-600"
                style={{
                  animation:
                    'applyloopAnnouncementTicker 24s linear infinite',
                }}
              >
                {ticker.title}
                {'  —  '}
                {ticker.message}
                {'     •     '}
                Click to expand
              </span>
            </div>
          </div>
        </button>
      )}
    </div>
  );
}
