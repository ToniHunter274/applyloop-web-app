import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';
import {
  FiAlertTriangle,
  FiCheck,
  FiCheckCircle,
  FiCopy,
  FiDownload,
  FiEdit2,
  FiExternalLink,
  FiEye,
  FiFileText,
  FiKey,
  FiPauseCircle,
  FiPlayCircle,
  FiPlus,
  FiSearch,
  FiTrendingUp,
  FiUploadCloud,
  FiX,
} from 'react-icons/fi';
import { HiOutlineUserGroup } from 'react-icons/hi';
import { createClient } from '../../lib/supabase/client';
import {
  CLIENT_PLAN_OPTIONS,
} from '../config/clientPlans';
import CustomSelect from './CustomSelect';

const MAX_RESUME_SIZE = 10 * 1024 * 1024;

const inputClassName =
  'mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3.5 text-sm text-slate-800 outline-none transition-all duration-200 placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100';

const planFilterOptions = [
  {
    value: 'all',
    label: 'All Plans',
  },
  ...CLIENT_PLAN_OPTIONS.map((plan) => ({
    value: plan.value,
    label: plan.label,
  })),
];

const statusFilterOptions = [
  {
    value: 'all',
    label: 'All Statuses',
  },
  {
    value: 'active',
    label: 'Active',
  },
  {
    value: 'paused',
    label: 'Paused',
  },
  {
    value: 'completed',
    label: 'Completed',
  },
];

const onboardingStatusOptions = [
  {
    value: 'not_started',
    label: 'Not Started',
    description: 'This step has not begun.',
  },
  {
    value: 'in_progress',
    label: 'In Progress',
    description: 'The client is currently at this stage.',
  },
  {
    value: 'completed',
    label: 'Completed',
    description: 'This step has been completed.',
  },
  {
    value: 'skipped',
    label: 'Skipped',
    description: 'This step does not apply to this client.',
  },
];

const genderOptions = [
  {
    value: 'female',
    label: 'Female',
  },
  {
    value: 'male',
    label: 'Male',
  },
  {
    value: 'other',
    label: 'Other',
  },
  {
    value: 'prefer-not-to-say',
    label: 'Prefer not to say',
  },
];

const priorityOptions = [
  {
    value: 'high',
    label: 'High',
    description: 'Elevated attention and normal escalation.',
  },
  {
    value: 'urgent',
    label: 'Urgent',
    description: 'Requires prompt attention from the team.',
  },
  {
    value: 'critical',
    label: 'Critical',
    description: 'Requires immediate operational attention.',
  },
];

const cn = (...values) => values.filter(Boolean).join(' ');

async function getAccessToken() {
  const supabase = createClient();

  if (!supabase) {
    throw new Error(
      'The Supabase connection is unavailable.'
    );
  }

  const {
    data: { session },
    error,
  } = await supabase.auth.getSession();

  if (error || !session?.access_token) {
    throw new Error(
      'Your session has expired. Please sign in again.'
    );
  }

  return session.access_token;
}

function formatValue(value) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(value || 0);
}

function formatLabel(value) {
  return value
    ? value.charAt(0).toUpperCase() + value.slice(1)
    : 'Unknown';
}

function statusClassName(status) {
  if (status === 'active') {
    return 'bg-emerald-100 text-emerald-700';
  }

  if (status === 'paused') {
    return 'bg-amber-100 text-amber-700';
  }

  if (status === 'completed') {
    return 'bg-purple-100 text-purple-700';
  }

  return 'bg-slate-100 text-slate-700';
}

function priorityClassName(priority) {
  if (priority === 'critical') {
    return 'bg-red-100 text-red-700';
  }

  if (priority === 'urgent') {
    return 'bg-orange-100 text-orange-700';
  }

  return 'bg-blue-100 text-blue-700';
}

function calculateSuccessRate(client) {
  if (!client?.applicationsCompleted) {
    return '0%';
  }

  return `${Math.round(
    (client.interviews /
      client.applicationsCompleted) *
      100
  )}%`;
}

function summarizeOnboarding(steps = []) {
  const orderedSteps = [...steps].sort(
    (firstStep, secondStep) =>
      firstStep.stepOrder - secondStep.stepOrder
  );

  const completedCount = orderedSteps.filter(
    (step) =>
      step.status === 'completed' ||
      step.status === 'skipped'
  ).length;

  const currentStep =
    orderedSteps.find(
      (step) => step.status === 'in_progress'
    ) ||
    orderedSteps.find(
      (step) => step.status === 'not_started'
    ) ||
    orderedSteps[orderedSteps.length - 1] ||
    null;

  const progressPercent =
    orderedSteps.length > 0
      ? Math.round(
          (completedCount / orderedSteps.length) * 100
        )
      : 0;

  return {
    steps: orderedSteps,
    completedCount,
    totalCount: orderedSteps.length,
    progressPercent,
    currentStep,
  };
}

function formatOnboardingStatus(status) {
  const labels = {
    not_started: 'Not Started',
    in_progress: 'In Progress',
    completed: 'Completed',
    skipped: 'Skipped',
  };

  return labels[status] || 'Not Started';
}

function onboardingStatusClassName(
  status,
  isCurrent = false
) {
  if (status === 'completed') {
    return {
      circle:
        'border-emerald-500 bg-emerald-500 text-white',
      badge:
        'bg-emerald-100 text-emerald-700',
      line: 'bg-emerald-400',
    };
  }

  if (status === 'skipped') {
    return {
      circle:
        'border-amber-400 bg-amber-50 text-amber-600',
      badge: 'bg-amber-100 text-amber-700',
      line: 'bg-amber-300',
    };
  }

  if (status === 'in_progress' || isCurrent) {
    return {
      circle:
        'border-blue-500 bg-blue-50 text-blue-700 ring-4 ring-blue-100',
      badge: 'bg-blue-100 text-blue-700',
      line: 'bg-blue-300',
    };
  }

  return {
    circle:
      'border-slate-200 bg-slate-100 text-slate-500',
    badge: 'bg-slate-100 text-slate-600',
    line: 'bg-slate-200',
  };
}

function ShineText({ children, dark = false }) {
  return (
    <span
      className={cn(
        'shine-text relative z-10',
        dark && 'shine-text-dark'
      )}
    >
      {children}
    </span>
  );
}

function ActionIconButton({
  label,
  onClick,
  children,
  tone = 'neutral',
  disabled = false,
}) {
  const toneClasses = {
    neutral:
      'border-slate-200 bg-white text-slate-500 hover:border-blue-200 hover:bg-blue-50 hover:text-blue-600',
    warning:
      'border-slate-200 bg-white text-slate-500 hover:border-amber-200 hover:bg-amber-50 hover:text-amber-600',
    danger:
      'border-slate-200 bg-white text-slate-500 hover:border-red-200 hover:bg-red-50 hover:text-red-600',
  };

  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'inline-flex h-9 w-9 items-center justify-center rounded-lg border transition-all duration-200 hover:-translate-y-0.5 hover:shadow-sm disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0',
        toneClasses[tone]
      )}
    >
      {children}
    </button>
  );
}

function ModalShell({
  title,
  subtitle,
  onClose,
  children,
  wide = false,
  disableClose = false,
}) {
  return (
    <div
      role="presentation"
      onMouseDown={(event) => {
        if (
          event.target === event.currentTarget &&
          !disableClose
        ) {
          onClose();
        }
      }}
      className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-950/55 px-4 py-8 backdrop-blur-sm"
    >
      <section
        role="dialog"
        aria-modal="true"
        className={cn(
          'my-auto w-full overflow-hidden rounded-3xl bg-white shadow-2xl',
          wide ? 'max-w-5xl' : 'max-w-3xl'
        )}
      >
        <div className="flex items-start justify-between border-b border-slate-200 px-6 py-5 sm:px-8">
          <div>
            <h2 className="text-2xl font-bold text-slate-950">
              {title}
            </h2>

            {subtitle && (
              <p className="mt-2 text-sm text-slate-600">
                {subtitle}
              </p>
            )}
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={disableClose}
            aria-label="Close"
            className="rounded-xl p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <FiX className="h-5 w-5" />
          </button>
        </div>

        {children}
      </section>
    </div>
  );
}

function OnboardingTimeline({
  onboarding,
  onEditStep,
}) {
  const steps = onboarding?.steps || [];
  const currentStepKey =
    onboarding?.currentStep?.stepKey || null;

  if (steps.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-6 py-10 text-center">
        <p className="text-sm font-semibold text-slate-700">
          Onboarding progress is not available.
        </p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h3 className="text-xl font-bold text-slate-950">
            Current Onboarding Process
          </h3>

          <p className="mt-1 text-sm leading-6 text-slate-600">
            Select any stage to update its status or add
            internal notes.
          </p>
        </div>

        <div className="sm:text-right">
          <p className="text-sm font-bold text-slate-900">
            {onboarding.completedCount} of{' '}
            {onboarding.totalCount} steps
          </p>

          <p className="mt-1 text-xs text-slate-500">
            {onboarding.progressPercent}% complete
          </p>
        </div>
      </div>

      <div className="mt-5 h-2.5 overflow-hidden rounded-full bg-slate-100">
        <div
          className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-blue-500 transition-all duration-500"
          style={{
            width: `${onboarding.progressPercent}%`,
          }}
        />
      </div>

      <div className="mt-9 hidden grid-cols-7 gap-y-12 xl:grid">
        {steps.map((step, index) => {
          const isCurrent =
            currentStepKey === step.stepKey;

          const tones = onboardingStatusClassName(
            step.status,
            isCurrent
          );

          const endsDesktopRow =
            index % 7 === 6 ||
            index === steps.length - 1;

          return (
            <div
              key={step.id || step.stepKey}
              className="relative px-2 text-center"
            >
              {!endsDesktopRow && (
                <span
                  className={cn(
                    'absolute left-1/2 top-6 h-0.5 w-full',
                    tones.line
                  )}
                />
              )}

              <button
                type="button"
                onClick={() => onEditStep(step)}
                className="group relative z-10 flex w-full flex-col items-center rounded-2xl px-1 py-2 transition hover:bg-slate-50"
              >
                <span
                  className={cn(
                    'flex h-12 w-12 items-center justify-center rounded-full border-2 text-sm font-bold shadow-sm transition-all duration-200 group-hover:scale-105',
                    tones.circle
                  )}
                >
                  {step.status === 'completed' ? (
                    <FiCheck className="h-5 w-5" />
                  ) : (
                    step.stepOrder
                  )}
                </span>

                <span className="mt-3 min-h-[40px] text-xs font-semibold leading-5 text-slate-800">
                  {step.label}
                </span>

                <span
                  className={cn(
                    'mt-2 rounded-full px-2.5 py-1 text-[10px] font-bold',
                    tones.badge
                  )}
                >
                  {formatOnboardingStatus(step.status)}
                </span>
              </button>
            </div>
          );
        })}
      </div>

      <div className="mt-7 xl:hidden">
        {steps.map((step, index) => {
          const isCurrent =
            currentStepKey === step.stepKey;

          const tones = onboardingStatusClassName(
            step.status,
            isCurrent
          );

          return (
            <button
              key={step.id || step.stepKey}
              type="button"
              onClick={() => onEditStep(step)}
              className="group relative flex w-full gap-4 pb-7 text-left last:pb-0"
            >
              {index < steps.length - 1 && (
                <span
                  className={cn(
                    'absolute left-[23px] top-12 h-[calc(100%-2rem)] w-0.5',
                    tones.line
                  )}
                />
              )}

              <span
                className={cn(
                  'relative z-10 flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full border-2 text-sm font-bold shadow-sm transition group-hover:scale-105',
                  tones.circle
                )}
              >
                {step.status === 'completed' ? (
                  <FiCheck className="h-5 w-5" />
                ) : (
                  step.stepOrder
                )}
              </span>

              <span className="min-w-0 flex-1 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition group-hover:border-blue-200 group-hover:bg-blue-50/40">
                <span className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <span className="font-semibold text-slate-900">
                    {step.label}
                  </span>

                  <span
                    className={cn(
                      'w-fit rounded-full px-2.5 py-1 text-[10px] font-bold',
                      tones.badge
                    )}
                  >
                    {formatOnboardingStatus(step.status)}
                  </span>
                </span>

                {step.notes && (
                  <span className="mt-2 block text-xs leading-5 text-slate-500">
                    {step.notes}
                  </span>
                )}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function DetailItem({ label, children }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
      <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
        {label}
      </p>

      <div className="mt-2 break-words text-sm font-semibold text-slate-900">
        {children || 'Not provided'}
      </div>
    </div>
  );
}

function MetricCard({ label, value, tone }) {
  const toneClassNames = {
    blue: 'border-blue-200 bg-blue-50 text-blue-700',
    green:
      'border-emerald-200 bg-emerald-50 text-emerald-700',
    purple:
      'border-purple-200 bg-purple-50 text-purple-700',
  };

  return (
    <div
      className={cn(
        'rounded-2xl border p-6',
        toneClassNames[tone]
      )}
    >
      <p className="text-sm font-medium opacity-80">
        {label}
      </p>

      <p className="mt-3 text-3xl font-bold">
        {value}
      </p>
    </div>
  );
}

export default function ClientManagementWorkspace({
  mode = 'admin',
}) {
  const [clients, setClients] = useState([]);
  const [isLoadingClients, setIsLoadingClients] =
    useState(true);
  const [listError, setListError] = useState('');

  const [search, setSearch] = useState('');
  const [planFilter, setPlanFilter] = useState('all');
  const [statusFilter, setStatusFilter] =
    useState('all');

  const [activeModal, setActiveModal] = useState(null);
  const [selectedClient, setSelectedClient] =
    useState(null);
  const [priorityChoice, setPriorityChoice] =
    useState('high');

  const [isSubmitting, setIsSubmitting] =
    useState(false);
  const [isSavingClient, setIsSavingClient] =
    useState(false);
  const [formError, setFormError] = useState('');
  const [credentials, setCredentials] =
    useState(null);
  const [
    credentialContext,
    setCredentialContext,
  ] = useState('created');
  const [
    credentialsSaved,
    setCredentialsSaved,
  ] = useState(false);
  const [selectedFileName, setSelectedFileName] =
    useState('');
  const [copied, setCopied] = useState(false);
  const [copiedClientId, setCopiedClientId] =
    useState(null);
  const [formKey, setFormKey] = useState(0);

  const [downloadingClientId, setDownloadingClientId] =
    useState(null);
  const [resettingClientId, setResettingClientId] =
    useState(null);

  const [onboardingStep, setOnboardingStep] =
    useState(null);
  const [onboardingStatus, setOnboardingStatus] =
    useState('not_started');
  const [onboardingNotes, setOnboardingNotes] =
    useState('');
  const [
    isSavingOnboarding,
    setIsSavingOnboarding,
  ] = useState(false);

  const loadClients = useCallback(async () => {
    setIsLoadingClients(true);
    setListError('');

    try {
      const accessToken = await getAccessToken();

      const response = await fetch('/api/admin/clients', {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      const result = await response
        .json()
        .catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          result.error ||
            'The client list could not be loaded.'
        );
      }

      setClients(result.clients || []);
    } catch (error) {
      setListError(
        error?.message ||
          'The client list could not be loaded.'
      );
    } finally {
      setIsLoadingClients(false);
    }
  }, []);

  useEffect(() => {
    loadClients();
  }, [loadClients]);

  useEffect(() => {
    if (!activeModal) {
      return undefined;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (event) => {
      if (
        event.key === 'Escape' &&
        !isSubmitting &&
        !isSavingClient &&
        !isSavingOnboarding
      ) {
        setActiveModal(null);
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener(
        'keydown',
        handleKeyDown
      );
    };
  }, [
    activeModal,
    isSavingClient,
    isSavingOnboarding,
    isSubmitting,
  ]);

  useEffect(() => {
    if (!credentials || credentialsSaved) {
      return undefined;
    }

    const handleBeforeUnload = (event) => {
      event.preventDefault();
      event.returnValue = '';
    };

    window.addEventListener(
      'beforeunload',
      handleBeforeUnload
    );

    return () => {
      window.removeEventListener(
        'beforeunload',
        handleBeforeUnload
      );
    };
  }, [credentials, credentialsSaved]);

  const visibleClients = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    return clients.filter((client) => {
      const matchesSearch =
        !normalizedSearch ||
        [
          client.fullName,
          client.email,
          client.planLabel,
          client.assignedTeam,
        ].some((value) =>
          String(value || '')
            .toLowerCase()
            .includes(normalizedSearch)
        );

      const matchesPlan =
        planFilter === 'all' ||
        client.plan === planFilter;

      const matchesStatus =
        statusFilter === 'all' ||
        client.status === statusFilter;

      return (
        matchesSearch &&
        matchesPlan &&
        matchesStatus
      );
    });
  }, [
    clients,
    planFilter,
    search,
    statusFilter,
  ]);

  const closeModal = () => {
    if (
      isSubmitting ||
      isSavingClient ||
      isSavingOnboarding ||
      (credentials && !credentialsSaved)
    ) {
      return;
    }

    setActiveModal(null);
    setSelectedClient(null);
    setFormError('');
    setCredentials(null);
    setSelectedFileName('');
    setCopied(false);
    setOnboardingStep(null);
    setOnboardingStatus('not_started');
    setOnboardingNotes('');
  };

  const openCreateModal = () => {
    setSelectedClient(null);
    setFormError('');
    setCredentials(null);
    setSelectedFileName('');
    setCopied(false);
    setCredentialContext('created');
    setCredentialsSaved(false);
    setFormKey((current) => current + 1);
    setActiveModal('create');
  };

  const openClientModal = (modal, client) => {
    setSelectedClient(client);
    setPriorityChoice(client.priority || 'high');
    setFormError('');
    setActiveModal(modal);
  };

  const patchClient = async (clientId, changes) => {
    const accessToken = await getAccessToken();

    const response = await fetch(
      `/api/admin/clients/${clientId}`,
      {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(changes),
      }
    );

    const result = await response
      .json()
      .catch(() => ({}));

    if (!response.ok) {
      throw new Error(
        result.error ||
          'The client could not be updated.'
      );
    }

    setClients((currentClients) =>
      currentClients.map((client) =>
        client.id === clientId
          ? {
              ...client,
              ...result.client,
            }
          : client
      )
    );

    setSelectedClient((currentClient) =>
      currentClient?.id === clientId
        ? {
            ...currentClient,
            ...result.client,
          }
        : currentClient
    );

    return result.client;
  };

  const handleStatusUpdate = async () => {
    if (!selectedClient) {
      return;
    }

    const nextStatus =
      selectedClient.status === 'paused'
        ? 'active'
        : 'paused';

    setIsSavingClient(true);
    setFormError('');

    try {
      await patchClient(selectedClient.id, {
        status: nextStatus,
      });

      setActiveModal(null);
      setSelectedClient(null);
    } catch (error) {
      setFormError(
        error?.message ||
          'The client status could not be updated.'
      );
    } finally {
      setIsSavingClient(false);
    }
  };

  const handlePriorityUpdate = async () => {
    if (!selectedClient) {
      return;
    }

    setIsSavingClient(true);
    setFormError('');

    try {
      await patchClient(selectedClient.id, {
        priority: priorityChoice,
      });

      setActiveModal(null);
      setSelectedClient(null);
    } catch (error) {
      setFormError(
        error?.message ||
          'The client priority could not be updated.'
      );
    } finally {
      setIsSavingClient(false);
    }
  };

  const openOnboardingEditor = (
    client,
    step
  ) => {
    setSelectedClient(client);
    setOnboardingStep(step);
    setOnboardingStatus(step.status);
    setOnboardingNotes(step.notes || '');
    setFormError('');
    setActiveModal('onboarding');
  };

  const handleOnboardingUpdate = async () => {
    if (!selectedClient || !onboardingStep) {
      return;
    }

    setIsSavingOnboarding(true);
    setFormError('');

    try {
      const accessToken = await getAccessToken();

      const response = await fetch(
        `/api/admin/clients/${selectedClient.id}/onboarding`,
        {
          method: 'PATCH',
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            stepKey: onboardingStep.stepKey,
            status: onboardingStatus,
            notes: onboardingNotes,
          }),
        }
      );

      const result = await response
        .json()
        .catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          result.error ||
            'The onboarding step could not be updated.'
        );
      }

      const applyUpdatedStep = (client) => {
        if (client.id !== selectedClient.id) {
          return client;
        }

        const previousSteps =
          client.onboarding?.steps || [];

        const updatedSteps = previousSteps.map(
          (step) =>
            step.stepKey === result.step.stepKey
              ? result.step
              : step
        );

        return {
          ...client,
          onboarding:
            summarizeOnboarding(updatedSteps),
        };
      };

      setClients((currentClients) =>
        currentClients.map(applyUpdatedStep)
      );

      setSelectedClient((currentClient) =>
        currentClient
          ? applyUpdatedStep(currentClient)
          : currentClient
      );

      setOnboardingStep(null);
      setOnboardingNotes('');
      setFormError('');
      setActiveModal('details');
    } catch (error) {
      setFormError(
        error?.message ||
          'The onboarding step could not be updated.'
      );
    } finally {
      setIsSavingOnboarding(false);
    }
  };

  const handleCreateClient = async (event) => {
    event.preventDefault();

    setFormError('');
    setIsSubmitting(true);

    try {
      const formData = new FormData(event.currentTarget);
      const selectedPlan = formData.get('plan');
      const resume = formData.get('resume');

      if (!selectedPlan) {
        throw new Error(
          'Please select a subscription plan.'
        );
      }

      if (!(resume instanceof File) || resume.size === 0) {
        throw new Error(
          'Please attach the client resume.'
        );
      }

      if (resume.size > MAX_RESUME_SIZE) {
        throw new Error(
          'The resume must not exceed 10 MB.'
        );
      }

      const accessToken = await getAccessToken();

      const response = await fetch('/api/admin/clients', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
        body: formData,
      });

      const result = await response
        .json()
        .catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          result.error ||
            'The client could not be created.'
        );
      }

      await loadClients();

      setCredentialContext('created');
      setCredentialsSaved(false);
      setCredentials(result.credentials);
      setSelectedFileName('');
    } catch (error) {
      setFormError(
        error?.message ||
          'The client could not be created.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const copyCredentials = async () => {
    if (!credentials) {
      return;
    }

    try {
      await navigator.clipboard.writeText(
        [
          `Email: ${credentials.email}`,
          `Temporary password: ${credentials.temporaryPassword}`,
        ].join('\n')
      );

      setCopied(true);
      setCredentialsSaved(true);

      window.setTimeout(() => {
        setCopied(false);
      }, 1800);
    } catch {
      setFormError(
        'The credentials could not be copied automatically.'
      );
    }
  };

  const downloadCredentials = () => {
    if (!credentials) {
      return;
    }

    const credentialText = [
      'ApplyLoop Client Login',
      '',
      `Email: ${credentials.email}`,
      `Temporary password: ${credentials.temporaryPassword}`,
      '',
      'Please change this password after signing in.',
    ].join('\n');

    const credentialBlob = new Blob(
      [credentialText],
      {
        type: 'text/plain;charset=utf-8',
      }
    );

    const objectUrl =
      URL.createObjectURL(credentialBlob);

    const downloadLink =
      document.createElement('a');

    const safeEmail = credentials.email.replace(
      /[^a-z0-9]+/gi,
      '-'
    );

    downloadLink.href = objectUrl;
    downloadLink.download =
      `${safeEmail}-applyloop-login.txt`;

    document.body.appendChild(downloadLink);
    downloadLink.click();
    downloadLink.remove();

    URL.revokeObjectURL(objectUrl);
    setCredentialsSaved(true);
  };

  const finishCredentials = () => {
    if (!credentialsSaved) {
      return;
    }

    setActiveModal(null);
    setSelectedClient(null);
    setCredentials(null);
    setCredentialsSaved(false);
    setCredentialContext('created');
    setCopied(false);
    setFormError('');
  };

  const resetClientPassword = async (client) => {
    setResettingClientId(client.id);
    setListError('');

    try {
      const accessToken = await getAccessToken();

      const response = await fetch(
        `/api/admin/clients/${client.id}/reset-password`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      const result = await response
        .json()
        .catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          result.error ||
            'A new password could not be generated.'
        );
      }

      setSelectedClient(client);
      setCredentialContext('reset');
      setCredentialsSaved(false);
      setCopied(false);
      setFormError('');
      setCredentials(result.credentials);
      setActiveModal('create');
    } catch (error) {
      setListError(
        error?.message ||
          'A new password could not be generated.'
      );
    } finally {
      setResettingClientId(null);
    }
  };

  const copyClientEmail = async (client) => {
    try {
      await navigator.clipboard.writeText(client.email);
      setCopiedClientId(client.id);

      window.setTimeout(() => {
        setCopiedClientId((current) =>
          current === client.id ? null : current
        );
      }, 1800);
    } catch {
      setListError(
        'The email address could not be copied.'
      );
    }
  };

  const downloadResume = async (client) => {
    setDownloadingClientId(client.id);
    setListError('');

    try {
      const accessToken = await getAccessToken();

      const response = await fetch(
        `/api/admin/clients/${client.id}/resume`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      const result = await response
        .json()
        .catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          result.error ||
            'The resume could not be downloaded.'
        );
      }

      const fileResponse = await fetch(result.url);

      if (!fileResponse.ok) {
        throw new Error(
          'The resume file could not be downloaded.'
        );
      }

      const fileBlob = await fileResponse.blob();
      const objectUrl = URL.createObjectURL(fileBlob);
      const downloadLink = document.createElement('a');

      downloadLink.href = objectUrl;
      downloadLink.download =
        result.filename ||
        client.resumeFilename ||
        'resume';

      document.body.appendChild(downloadLink);
      downloadLink.click();
      downloadLink.remove();
      URL.revokeObjectURL(objectUrl);
    } catch (error) {
      setListError(
        error?.message ||
          'The resume could not be downloaded.'
      );
    } finally {
      setDownloadingClientId(null);
    }
  };

  return (
    <>
      <section
        className={cn(
          'mx-auto w-full min-w-0 max-w-full',
          mode === 'owner' && 'pt-6 sm:pt-8'
        )}
      >
        <div className="flex flex-col justify-between gap-6 sm:flex-row sm:items-center">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">
              Client Management
            </h1>

            <p className="mt-3 max-w-2xl text-base leading-7 text-slate-600">
              Create client accounts, assign subscription plans,
              upload resumes, and monitor application progress.
            </p>
          </div>

          <button
            type="button"
            onClick={openCreateModal}
            className="shine-button inline-flex items-center justify-center gap-2 rounded-[14px] bg-gradient-to-r from-blue-700 to-blue-500 px-6 py-3 text-sm font-semibold text-white shadow-lg"
          >
            <FiPlus className="h-4 w-4" />

            <ShineText>Add New Client</ShineText>
          </button>
        </div>

        <div className="mt-9 overflow-visible rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="grid gap-4 border-b border-slate-200 p-5 sm:p-6 lg:grid-cols-[minmax(0,1fr)_210px_210px]">
            <label className="relative block">
              <FiSearch className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />

              <input
                type="search"
                value={search}
                onChange={(event) =>
                  setSearch(event.target.value)
                }
                placeholder="Search clients by name, email, plan, or team"
                className="w-full rounded-xl border border-slate-300 bg-slate-50 py-3.5 pl-12 pr-4 text-sm text-slate-700 outline-none transition-all duration-200 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100"
              />
            </label>

            <CustomSelect
              name="planFilter"
              compact
              defaultValue="all"
              options={planFilterOptions}
              onChange={setPlanFilter}
            />

            <CustomSelect
              name="statusFilter"
              compact
              defaultValue="all"
              options={statusFilterOptions}
              onChange={setStatusFilter}
            />
          </div>

          {listError && (
            <div
              role="alert"
              className="m-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700 sm:m-6"
            >
              {listError}
            </div>
          )}

          {isLoadingClients ? (
            <div className="flex min-h-[360px] flex-col items-center justify-center p-8">
              <div className="h-9 w-9 animate-spin rounded-full border-4 border-blue-100 border-t-blue-600" />

              <p className="mt-4 text-sm font-medium text-slate-600">
                Loading clients...
              </p>
            </div>
          ) : visibleClients.length === 0 ? (
            <div className="flex min-h-[390px] flex-col items-center justify-center px-6 py-14 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-50">
                <HiOutlineUserGroup className="h-8 w-8 text-blue-600" />
              </div>

              <h2 className="mt-6 text-xl font-bold text-slate-950">
                {clients.length === 0
                  ? 'No clients have been added yet'
                  : 'No matching clients found'}
              </h2>

              <p className="mt-3 max-w-lg text-base leading-7 text-slate-600">
                {clients.length === 0
                  ? 'Create your first client account and ApplyLoop will generate their secure temporary login credentials.'
                  : 'Try changing your search or filter selections.'}
              </p>

              {clients.length === 0 && (
                <button
                  type="button"
                  onClick={openCreateModal}
                  className="shine-button mt-7 inline-flex items-center gap-2 rounded-[14px] border border-blue-200 bg-blue-50 px-5 py-3 text-sm font-semibold text-blue-700"
                >
                  <FiPlus className="h-4 w-4" />
                  <ShineText dark>
                    Create First Client
                  </ShineText>
                </button>
              )}
            </div>
          ) : (
            <>
              <div className="client-table-scroll overflow-x-auto">
                <table className="client-data-table w-full min-w-[1380px] border-collapse text-left">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50/70">
                      {[
                        'CLIENT NAME',
                        'PLAN TYPE',
                        'APPLICATIONS',
                        'INTERVIEWS',
                        'ASSIGNED TEAM',
                        'STATUS',
                        'PRIORITY',
                        'ONBOARDING',
                        'PLAN VALUE',
                        'RESUME',
                        'ACTIONS',
                      ].map((heading) => (
                        <th
                          key={heading}
                          className="px-5 py-4 text-xs font-bold tracking-wide text-slate-500"
                        >
                          {heading}
                        </th>
                      ))}
                    </tr>
                  </thead>

                  <tbody>
                    {visibleClients.map((client) => {
                      const emailWasCopied =
                        copiedClientId === client.id;

                      return (
                        <tr
                          key={client.id}
                          className="border-b border-slate-100 transition-colors hover:bg-slate-50/80"
                        >
                          <td className="px-5 py-4">
                            <p className="font-semibold text-slate-900">
                              {client.fullName}
                            </p>

                            <p className="mt-1 text-xs text-slate-500">
                              {client.email}
                            </p>
                          </td>

                          <td className="px-5 py-4">
                            <span className="inline-flex rounded-lg bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700">
                              {client.planLabel}
                            </span>
                          </td>

                          <td className="px-5 py-4 text-sm font-medium text-slate-700">
                            {client.applicationsCompleted} /{' '}
                            {client.applicationLimit}
                          </td>

                          <td className="px-5 py-4 text-sm font-medium text-slate-700">
                            {client.interviews}
                          </td>

                          <td className="px-5 py-4 text-sm text-slate-700">
                            {client.assignedTeam ||
                              'Unassigned'}
                          </td>

                          <td className="px-5 py-4">
                            <span
                              className={cn(
                                'inline-flex rounded-lg px-3 py-1.5 text-xs font-semibold',
                                statusClassName(
                                  client.status
                                )
                              )}
                            >
                              {formatLabel(client.status)}
                            </span>
                          </td>

                          <td className="px-5 py-4">
                            <span
                              className={cn(
                                'inline-flex rounded-lg px-3 py-1.5 text-xs font-semibold',
                                priorityClassName(
                                  client.priority
                                )
                              )}
                            >
                              {formatLabel(
                                client.priority || 'high'
                              )}
                            </span>
                          </td>

                          <td className="min-w-[210px] px-5 py-4">
                            <button
                              type="button"
                              onClick={() =>
                                openClientModal(
                                  'details',
                                  client
                                )
                              }
                              className="w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-left transition-all duration-200 hover:border-blue-200 hover:bg-blue-50"
                            >
                              <span className="flex items-center justify-between gap-3">
                                <span className="truncate text-xs font-semibold text-slate-800">
                                  {client.onboarding?.currentStep
                                    ?.label ||
                                    'Onboarding not started'}
                                </span>

                                <span className="flex-shrink-0 text-[10px] font-bold text-slate-500">
                                  {client.onboarding?.completedCount ||
                                    0}
                                  /
                                  {client.onboarding?.totalCount ||
                                    13}
                                </span>
                              </span>

                              <span className="mt-2 block h-1.5 overflow-hidden rounded-full bg-slate-200">
                                <span
                                  className="block h-full rounded-full bg-gradient-to-r from-emerald-500 to-blue-500 transition-all duration-500"
                                  style={{
                                    width: `${
                                      client.onboarding
                                        ?.progressPercent || 0
                                    }%`,
                                  }}
                                />
                              </span>

                              <span className="mt-2 block text-[10px] font-medium text-slate-500">
                                {client.onboarding
                                  ?.progressPercent || 0}
                                % complete
                              </span>
                            </button>
                          </td>

                          <td className="px-5 py-4 text-sm font-bold text-slate-800">
                            {formatValue(client.planPrice)}
                          </td>

                          <td className="max-w-[210px] px-5 py-4">
                            {client.hasResume ? (
                              <div>
                                <p
                                  title={
                                    client.resumeFilename
                                  }
                                  className="truncate text-xs font-medium text-slate-600"
                                >
                                  {client.resumeFilename}
                                </p>

                                <button
                                  type="button"
                                  onClick={() =>
                                    downloadResume(client)
                                  }
                                  disabled={
                                    downloadingClientId ===
                                    client.id
                                  }
                                  className="shine-button mt-2 inline-flex items-center gap-1.5 rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-xs font-semibold text-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                                >
                                  <FiDownload className="h-3.5 w-3.5" />

                                  <ShineText dark>
                                    {downloadingClientId ===
                                    client.id
                                      ? 'Downloading...'
                                      : 'Download'}
                                  </ShineText>
                                </button>
                              </div>
                            ) : (
                              <span className="text-sm text-slate-400">
                                No resume
                              </span>
                            )}
                          </td>

                          <td className="px-5 py-4">
                            <div className="flex items-center gap-2">
                              <ActionIconButton
                                label="View client details"
                                onClick={() =>
                                  openClientModal(
                                    'details',
                                    client
                                  )
                                }
                              >
                                <FiEye className="h-4 w-4" />
                              </ActionIconButton>

                              <ActionIconButton
                                label="View performance"
                                onClick={() =>
                                  openClientModal(
                                    'performance',
                                    client
                                  )
                                }
                              >
                                <FiTrendingUp className="h-4 w-4" />
                              </ActionIconButton>

                              <ActionIconButton
                                label={
                                  client.status === 'paused'
                                    ? 'Reactivate account'
                                    : 'Pause account'
                                }
                                tone="warning"
                                onClick={() =>
                                  openClientModal(
                                    'status',
                                    client
                                  )
                                }
                              >
                                {client.status ===
                                'paused' ? (
                                  <FiPlayCircle className="h-4 w-4" />
                                ) : (
                                  <FiPauseCircle className="h-4 w-4" />
                                )}
                              </ActionIconButton>

                              <ActionIconButton
                                label="Change priority"
                                tone="danger"
                                onClick={() =>
                                  openClientModal(
                                    'priority',
                                    client
                                  )
                                }
                              >
                                <FiAlertTriangle className="h-4 w-4" />
                              </ActionIconButton>

                              <ActionIconButton
                                label="Generate new temporary password"
                                onClick={() =>
                                  resetClientPassword(client)
                                }
                                disabled={
                                  resettingClientId ===
                                  client.id
                                }
                              >
                                <FiKey className="h-4 w-4" />
                              </ActionIconButton>
                            </div>

                            <button
                              type="button"
                              onClick={() =>
                                copyClientEmail(client)
                              }
                              className={cn(
                                'shine-button mt-2 inline-flex items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-semibold shadow-sm transition-colors',
                                emailWasCopied
                                  ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                                  : 'border-slate-300 bg-white text-slate-700'
                              )}
                            >
                              {emailWasCopied ? (
                                <FiCheckCircle className="h-3.5 w-3.5" />
                              ) : (
                                <FiCopy className="h-3.5 w-3.5" />
                              )}

                              <ShineText dark>
                                {emailWasCopied
                                  ? 'Copied'
                                  : 'Copy Email'}
                              </ShineText>
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <div className="flex flex-col gap-2 border-t border-slate-200 px-5 py-4 text-sm text-slate-500 sm:flex-row sm:items-center sm:justify-between">
                <span>
                  Showing {visibleClients.length} of{' '}
                  {clients.length} clients
                </span>

                <span>
                  Search and filters update this table instantly.
                </span>
              </div>
            </>
          )}
        </div>
      </section>

      {activeModal === 'details' && selectedClient && (
        <ModalShell
          title={selectedClient.fullName}
          subtitle="Client Information"
          onClose={closeModal}
          wide
        >
          <div className="grid gap-4 px-6 py-6 sm:grid-cols-2 lg:grid-cols-3 sm:px-8">
            <DetailItem label="Email">
              {selectedClient.email}
            </DetailItem>

            <DetailItem label="Phone">
              {selectedClient.phone}
            </DetailItem>

            <DetailItem label="Plan">
              {selectedClient.planLabel}
            </DetailItem>

            <DetailItem label="Plan Value">
              {formatValue(selectedClient.planPrice)}
            </DetailItem>

            <DetailItem label="Assigned Team">
              {selectedClient.assignedTeam || 'Unassigned'}
            </DetailItem>

            <DetailItem label="Gender">
              {formatLabel(selectedClient.gender)}
            </DetailItem>

            <DetailItem label="Status">
              <span
                className={cn(
                  'inline-flex rounded-lg px-3 py-1.5 text-xs font-semibold',
                  statusClassName(selectedClient.status)
                )}
              >
                {formatLabel(selectedClient.status)}
              </span>
            </DetailItem>

            <DetailItem label="Priority">
              <span
                className={cn(
                  'inline-flex rounded-lg px-3 py-1.5 text-xs font-semibold',
                  priorityClassName(
                    selectedClient.priority
                  )
                )}
              >
                {formatLabel(
                  selectedClient.priority || 'high'
                )}
              </span>
            </DetailItem>

            <DetailItem label="Resume">
              {selectedClient.resumeFilename ||
                'No resume'}
            </DetailItem>

            <DetailItem label="Portfolio">
              {selectedClient.portfolioUrl ? (
                <a
                  href={selectedClient.portfolioUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 text-blue-600 hover:underline"
                >
                  Open Portfolio
                  <FiExternalLink />
                </a>
              ) : (
                'Not provided'
              )}
            </DetailItem>

            <DetailItem label="LinkedIn">
              {selectedClient.linkedinUrl ? (
                <a
                  href={selectedClient.linkedinUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 text-blue-600 hover:underline"
                >
                  Open LinkedIn
                  <FiExternalLink />
                </a>
              ) : (
                'Not provided'
              )}
            </DetailItem>

            <DetailItem label="Notes">
              {selectedClient.notes || 'No notes'}
            </DetailItem>
          </div>

          <div className="mx-6 mb-7 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:mx-8 sm:p-7">
            <OnboardingTimeline
              onboarding={selectedClient.onboarding}
              onEditStep={(step) =>
                openOnboardingEditor(
                  selectedClient,
                  step
                )
              }
            />
          </div>

          <div className="flex flex-col-reverse gap-3 border-t border-slate-200 px-6 py-5 sm:flex-row sm:justify-end sm:px-8">
            <button
              type="button"
              onClick={() =>
                copyClientEmail(selectedClient)
              }
              className="shine-button inline-flex items-center justify-center gap-2 rounded-[14px] border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700"
            >
              <FiCopy />
              <ShineText dark>Copy Email</ShineText>
            </button>

            {selectedClient.hasResume && (
              <button
                type="button"
                onClick={() =>
                  downloadResume(selectedClient)
                }
                className="shine-button inline-flex items-center justify-center gap-2 rounded-[14px] bg-gradient-to-r from-blue-700 to-blue-500 px-5 py-3 text-sm font-semibold text-white shadow-lg"
              >
                <FiDownload />
                <ShineText>Download Resume</ShineText>
              </button>
            )}
          </div>
        </ModalShell>
      )}

      {activeModal === 'performance' &&
        selectedClient && (
          <ModalShell
            title={selectedClient.fullName}
            subtitle="Client Performance Overview"
            onClose={closeModal}
            wide
          >
            <div className="grid gap-5 px-6 py-6 sm:grid-cols-3 sm:px-8">
              <MetricCard
                label="Applications"
                value={`${selectedClient.applicationsCompleted} / ${selectedClient.applicationLimit}`}
                tone="blue"
              />

              <MetricCard
                label="Interviews"
                value={selectedClient.interviews}
                tone="green"
              />

              <MetricCard
                label="Success Rate"
                value={calculateSuccessRate(
                  selectedClient
                )}
                tone="purple"
              />
            </div>

            <div className="mx-6 mb-7 rounded-2xl border border-slate-200 p-6 sm:mx-8">
              <h3 className="text-xl font-bold text-slate-950">
                Client Information
              </h3>

              <div className="mt-5 grid gap-5 sm:grid-cols-2">
                <div>
                  <p className="text-sm text-slate-500">
                    Plan Type
                  </p>
                  <p className="mt-1 font-semibold text-slate-900">
                    {selectedClient.planLabel}
                  </p>
                </div>

                <div>
                  <p className="text-sm text-slate-500">
                    Assigned Team
                  </p>
                  <p className="mt-1 font-semibold text-slate-900">
                    {selectedClient.assignedTeam ||
                      'Unassigned'}
                  </p>
                </div>

                <div>
                  <p className="text-sm text-slate-500">
                    Account Status
                  </p>
                  <span
                    className={cn(
                      'mt-2 inline-flex rounded-lg px-3 py-1.5 text-xs font-semibold',
                      statusClassName(
                        selectedClient.status
                      )
                    )}
                  >
                    {formatLabel(selectedClient.status)}
                  </span>
                </div>

                <div>
                  <p className="text-sm text-slate-500">
                    Plan Value
                  </p>
                  <p className="mt-1 font-semibold text-slate-900">
                    {formatValue(
                      selectedClient.planPrice
                    )}
                  </p>
                </div>
              </div>
            </div>
          </ModalShell>
        )}

      {activeModal === 'status' && selectedClient && (
        <ModalShell
          title={
            selectedClient.status === 'paused'
              ? 'Reactivate Account'
              : 'Pause Account'
          }
          subtitle={selectedClient.fullName}
          onClose={closeModal}
          disableClose={isSavingClient}
        >
          <div className="px-6 py-6 sm:px-8">
            {formError && (
              <div className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
                {formError}
              </div>
            )}

            <div
              className={cn(
                'rounded-2xl border p-6',
                selectedClient.status === 'paused'
                  ? 'border-emerald-200 bg-emerald-50'
                  : 'border-amber-200 bg-amber-50'
              )}
            >
              <h3 className="font-bold text-slate-900">
                {selectedClient.status === 'paused'
                  ? 'Reactivating this account will:'
                  : 'Pausing this account will:'}
              </h3>

              <ul className="mt-4 space-y-2 text-sm leading-6 text-slate-700">
                {selectedClient.status === 'paused' ? (
                  <>
                    <li>• Restore the account to Active.</li>
                    <li>• Allow application work to continue.</li>
                    <li>• Keep all existing client history.</li>
                  </>
                ) : (
                  <>
                    <li>• Change the account status to Paused.</li>
                    <li>• Keep all client data and history.</li>
                    <li>• Display Paused in both workspaces.</li>
                  </>
                )}
              </ul>
            </div>
          </div>

          <div className="flex flex-col-reverse gap-3 border-t border-slate-200 px-6 py-5 sm:flex-row sm:justify-end sm:px-8">
            <button
              type="button"
              onClick={closeModal}
              disabled={isSavingClient}
              className="shine-button rounded-[14px] border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 disabled:opacity-50"
            >
              <ShineText dark>Cancel</ShineText>
            </button>

            <button
              type="button"
              onClick={handleStatusUpdate}
              disabled={isSavingClient}
              className={cn(
                'shine-button inline-flex items-center justify-center gap-2 rounded-[14px] px-5 py-3 text-sm font-semibold text-white shadow-lg disabled:opacity-60',
                selectedClient.status === 'paused'
                  ? 'bg-emerald-600'
                  : 'bg-amber-500'
              )}
            >
              {selectedClient.status === 'paused' ? (
                <FiPlayCircle />
              ) : (
                <FiPauseCircle />
              )}

              <ShineText>
                {isSavingClient
                  ? 'Updating...'
                  : selectedClient.status === 'paused'
                    ? 'Reactivate Account'
                    : 'Pause Account'}
              </ShineText>
            </button>
          </div>
        </ModalShell>
      )}

      {activeModal === 'priority' &&
        selectedClient && (
          <ModalShell
            title="Escalate Priority"
            subtitle={selectedClient.fullName}
            onClose={closeModal}
            disableClose={isSavingClient}
          >
            <div className="px-6 py-6 sm:px-8">
              {formError && (
                <div className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
                  {formError}
                </div>
              )}

              <p className="text-sm font-semibold text-slate-700">
                Priority Level
              </p>

              <div className="mt-4 grid gap-4 sm:grid-cols-3">
                {priorityOptions.map((option) => {
                  const isSelected =
                    priorityChoice === option.value;

                  return (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() =>
                        setPriorityChoice(option.value)
                      }
                      className={cn(
                        'rounded-2xl border p-5 text-left transition-all duration-200',
                        isSelected
                          ? 'border-blue-500 bg-blue-50 ring-4 ring-blue-100'
                          : 'border-slate-200 bg-white hover:border-blue-300'
                      )}
                    >
                      <span className="font-bold text-slate-900">
                        {option.label}
                      </span>

                      <span className="mt-2 block text-xs leading-5 text-slate-500">
                        {option.description}
                      </span>
                    </button>
                  );
                })}
              </div>

              <div className="mt-6 rounded-2xl border border-orange-200 bg-orange-50 p-5">
                <p className="font-bold text-orange-800">
                  Priority changes will:
                </p>

                <ul className="mt-3 space-y-1.5 text-sm text-orange-700">
                  <li>• Update the client table immediately.</li>
                  <li>• Appear in both Admin and Owner views.</li>
                  <li>• Remain saved after refreshing.</li>
                </ul>
              </div>
            </div>

            <div className="flex flex-col-reverse gap-3 border-t border-slate-200 px-6 py-5 sm:flex-row sm:justify-end sm:px-8">
              <button
                type="button"
                onClick={closeModal}
                disabled={isSavingClient}
                className="shine-button rounded-[14px] border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 disabled:opacity-50"
              >
                <ShineText dark>Cancel</ShineText>
              </button>

              <button
                type="button"
                onClick={handlePriorityUpdate}
                disabled={isSavingClient}
                className="shine-button inline-flex items-center justify-center gap-2 rounded-[14px] bg-red-600 px-5 py-3 text-sm font-semibold text-white shadow-lg disabled:opacity-60"
              >
                <FiAlertTriangle />

                <ShineText>
                  {isSavingClient
                    ? 'Updating...'
                    : 'Update Priority'}
                </ShineText>
              </button>
            </div>
          </ModalShell>
        )}

      {activeModal === 'onboarding' &&
        selectedClient &&
        onboardingStep && (
          <ModalShell
            title={onboardingStep.label}
            subtitle={`${selectedClient.fullName} • Onboarding progress`}
            onClose={closeModal}
            disableClose={isSavingOnboarding}
          >
            <div className="px-6 py-6 sm:px-8">
              {formError && (
                <div
                  role="alert"
                  className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700"
                >
                  {formError}
                </div>
              )}

              <div className="rounded-2xl border border-blue-100 bg-blue-50/60 p-5">
                <div className="flex items-start gap-4">
                  <span
                    className={cn(
                      'flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full border-2 text-sm font-bold',
                      onboardingStatusClassName(
                        onboardingStatus,
                        onboardingStatus ===
                          'in_progress'
                      ).circle
                    )}
                  >
                    {onboardingStatus === 'completed' ? (
                      <FiCheck className="h-5 w-5" />
                    ) : (
                      onboardingStep.stepOrder
                    )}
                  </span>

                  <div>
                    <p className="font-bold text-slate-900">
                      Step {onboardingStep.stepOrder} of{' '}
                      {selectedClient.onboarding
                        ?.totalCount || 13}
                    </p>

                    <p className="mt-1 text-sm leading-6 text-slate-600">
                      Update this stage manually now. Future
                      calendar, form, payment, assignment, and
                      application integrations can update the same
                      record automatically.
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-6">
                <CustomSelect
                  key={`${selectedClient.id}-${onboardingStep.stepKey}-${onboardingStep.status}`}
                  label="Step status"
                  name="onboardingStatus"
                  required
                  defaultValue={onboardingStatus}
                  options={onboardingStatusOptions}
                  onChange={setOnboardingStatus}
                />
              </div>

              <label className="mt-6 block text-sm font-semibold text-slate-700">
                Internal notes

                <textarea
                  value={onboardingNotes}
                  onChange={(event) =>
                    setOnboardingNotes(
                      event.target.value
                    )
                  }
                  rows={4}
                  maxLength={1000}
                  placeholder="Add useful context about this onboarding stage."
                  className={`${inputClassName} resize-y`}
                />

                <span className="mt-2 block text-right text-xs text-slate-400">
                  {onboardingNotes.length}/1000
                </span>
              </label>
            </div>

            <div className="flex flex-col-reverse gap-3 border-t border-slate-200 px-6 py-5 sm:flex-row sm:justify-end sm:px-8">
              <button
                type="button"
                onClick={() => {
                  setActiveModal('details');
                  setOnboardingStep(null);
                  setFormError('');
                }}
                disabled={isSavingOnboarding}
                className="shine-button rounded-[14px] border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 disabled:opacity-50"
              >
                <ShineText dark>Cancel</ShineText>
              </button>

              <button
                type="button"
                onClick={handleOnboardingUpdate}
                disabled={isSavingOnboarding}
                className="shine-button inline-flex items-center justify-center gap-2 rounded-[14px] bg-gradient-to-r from-blue-700 to-blue-500 px-5 py-3 text-sm font-semibold text-white shadow-lg disabled:opacity-60"
              >
                <FiEdit2 />

                <ShineText>
                  {isSavingOnboarding
                    ? 'Saving Progress...'
                    : 'Save Progress'}
                </ShineText>
              </button>
            </div>
          </ModalShell>
        )}

      {activeModal === 'create' && (
        <ModalShell
          title={
            credentials
              ? credentialContext === 'reset'
                ? 'Temporary Password Reset'
                : 'Client Created'
              : 'Add New Client'
          }
          subtitle={
            credentials
              ? credentialContext === 'reset'
                ? 'The previous password has been replaced. Save this new temporary password now.'
                : 'Copy or download these credentials before closing. The temporary password is shown only once.'
              : 'Create the client account, select their plan, and attach their resume.'
          }
          onClose={closeModal}
          disableClose={
            isSubmitting ||
            Boolean(
              credentials &&
                !credentialsSaved
            )
          }
        >
          {credentials ? (
            <div className="px-6 py-8 sm:px-8">
              <div className="flex flex-col items-center text-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100">
                  <FiCheckCircle className="h-8 w-8 text-emerald-600" />
                </div>

                <h3 className="mt-5 text-xl font-bold text-slate-950">
                  {credentialContext === 'reset'
                    ? 'A new temporary password is ready'
                    : 'The client account is ready'}
                </h3>

                <p className="mt-2 max-w-lg text-sm leading-6 text-slate-600">
                  {credentialContext === 'reset'
                    ? 'The previous password will no longer work. Send this new password securely to the client.'
                    : 'The new client is now visible in the table.'}
                </p>
              </div>

              <div className="mt-7 rounded-2xl border border-slate-200 bg-slate-50 p-5">
                <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Email address
                </p>

                <p className="mt-2 break-all text-base font-semibold text-slate-950">
                  {credentials.email}
                </p>

                <div className="mt-5 border-t border-slate-200 pt-5">
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    Temporary password
                  </p>

                  <p className="mt-2 break-all font-mono text-base font-bold text-slate-950">
                    {credentials.temporaryPassword}
                  </p>
                </div>
              </div>

              {!credentialsSaved && (
                <div className="mt-5 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-800">
                  The close button, Escape key, and background click
                  are temporarily disabled. Copy or download the
                  credentials before leaving this screen.
                </div>
              )}

              <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:justify-end">
                <button
                  type="button"
                  onClick={downloadCredentials}
                  className="shine-button inline-flex items-center justify-center gap-2 rounded-[14px] border border-blue-200 bg-blue-50 px-5 py-3 text-sm font-semibold text-blue-700"
                >
                  <FiDownload />

                  <ShineText dark>
                    Download Credentials
                  </ShineText>
                </button>

                <button
                  type="button"
                  onClick={copyCredentials}
                  className="shine-button inline-flex items-center justify-center gap-2 rounded-[14px] bg-gradient-to-r from-blue-700 to-blue-500 px-5 py-3 text-sm font-semibold text-white shadow-lg"
                >
                  {copied ? (
                    <FiCheckCircle />
                  ) : (
                    <FiCopy />
                  )}

                  <ShineText>
                    {copied
                      ? 'Credentials Copied'
                      : 'Copy Credentials'}
                  </ShineText>
                </button>

                <button
                  type="button"
                  onClick={finishCredentials}
                  disabled={!credentialsSaved}
                  className="shine-button inline-flex items-center justify-center gap-2 rounded-[14px] bg-emerald-600 px-5 py-3 text-sm font-semibold text-white shadow-lg disabled:cursor-not-allowed disabled:opacity-45"
                >
                  <FiCheckCircle />

                  <ShineText>
                    Done, I Saved Them
                  </ShineText>
                </button>
              </div>

              <p className="mt-4 text-center text-xs leading-5 text-slate-500">
                A lost password can be replaced later using the key
                icon in the client&apos;s Actions column.
              </p>
            </div>
          ) : (
            <form
              key={formKey}
              onSubmit={handleCreateClient}
              className="max-h-[72vh] overflow-y-auto px-6 py-6 sm:px-8"
            >
              {formError && (
                <div
                  role="alert"
                  className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700"
                >
                  {formError}
                </div>
              )}

              <div className="grid gap-5 sm:grid-cols-2">
                <label className="text-sm font-semibold text-slate-700">
                  Client name
                  <span className="ml-1 text-red-500">
                    *
                  </span>

                  <input
                    type="text"
                    name="fullName"
                    required
                    maxLength={120}
                    placeholder="Enter full name"
                    className={inputClassName}
                  />
                </label>

                <label className="text-sm font-semibold text-slate-700">
                  Email address
                  <span className="ml-1 text-red-500">
                    *
                  </span>

                  <input
                    type="email"
                    name="email"
                    required
                    maxLength={254}
                    placeholder="client@example.com"
                    className={inputClassName}
                  />
                </label>

                <label className="text-sm font-semibold text-slate-700">
                  Phone number

                  <input
                    type="tel"
                    name="phone"
                    maxLength={30}
                    placeholder="+1 555 000 0000"
                    className={inputClassName}
                  />
                </label>

                <CustomSelect
                  label="Gender"
                  name="gender"
                  placeholder="Select gender"
                  options={genderOptions}
                />

                <CustomSelect
                  label="Subscription plan"
                  name="plan"
                  required
                  placeholder="Select a plan"
                  options={CLIENT_PLAN_OPTIONS.map(
                    (plan) => ({
                      value: plan.value,
                      label: plan.label,
                      description:
                        `$${plan.price} • ${plan.applicationLimit} applications`,
                    })
                  )}
                />

                <label className="text-sm font-semibold text-slate-700">
                  Assigned team

                  <input
                    type="text"
                    name="assignedTeam"
                    maxLength={100}
                    placeholder="Example: Team Alpha"
                    className={inputClassName}
                  />
                </label>

                <label className="text-sm font-semibold text-slate-700">
                  Portfolio link

                  <input
                    type="url"
                    name="portfolioUrl"
                    placeholder="https://portfolio.com"
                    className={inputClassName}
                  />
                </label>

                <label className="text-sm font-semibold text-slate-700">
                  LinkedIn URL

                  <input
                    type="url"
                    name="linkedinUrl"
                    placeholder="https://linkedin.com/in/..."
                    className={inputClassName}
                  />
                </label>
              </div>

              <div className="mt-5">
                <label className="text-sm font-semibold text-slate-700">
                  Resume
                  <span className="ml-1 text-red-500">
                    *
                  </span>

                  <span className="mt-2 flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50 px-6 py-8 text-center transition-all duration-200 hover:border-blue-400 hover:bg-blue-50">
                    <FiUploadCloud className="h-8 w-8 text-blue-600" />

                    <span className="mt-3 text-sm font-semibold text-slate-800">
                      {selectedFileName ||
                        'Choose the client resume'}
                    </span>

                    <span className="mt-1 text-xs text-slate-500">
                      PDF, DOC, or DOCX up to 10 MB
                    </span>

                    <input
                      type="file"
                      name="resume"
                      required
                      accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                      className="sr-only"
                      onChange={(event) => {
                        setSelectedFileName(
                          event.target.files?.[0]?.name ||
                            ''
                        );
                      }}
                    />
                  </span>
                </label>
              </div>

              <label className="mt-5 block text-sm font-semibold text-slate-700">
                Notes

                <textarea
                  name="notes"
                  rows={4}
                  maxLength={2000}
                  placeholder="Add any onboarding details or instructions."
                  className={`${inputClassName} resize-y`}
                />
              </label>

              <div className="mt-7 flex flex-col-reverse gap-3 border-t border-slate-200 pt-6 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={closeModal}
                  disabled={isSubmitting}
                  className="shine-button rounded-[14px] border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 disabled:opacity-50"
                >
                  <ShineText dark>Cancel</ShineText>
                </button>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="shine-button inline-flex items-center justify-center gap-2 rounded-[14px] bg-gradient-to-r from-blue-700 to-blue-500 px-5 py-3 text-sm font-semibold text-white shadow-lg disabled:opacity-60"
                >
                  <FiFileText />

                  <ShineText>
                    {isSubmitting
                      ? 'Creating Client...'
                      : 'Create Client Account'}
                  </ShineText>
                </button>
              </div>
            </form>
          )}
        </ModalShell>
      )}

      <style jsx global>{`
        .shine-button {
          position: relative;
          transition:
            transform 300ms ease,
            box-shadow 300ms ease,
            background-color 300ms ease,
            border-color 300ms ease,
            color 300ms ease;
        }

        .shine-button:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 10px 25px
            rgba(37, 99, 235, 0.22);
        }

        .shine-button:active:not(:disabled) {
          transform: translateY(0) scale(0.98);
        }

        .shine-text {
          display: inline-block;
          color: inherit;
          background-image: linear-gradient(
            110deg,
            currentColor 0%,
            currentColor 42%,
            #93c5fd 50%,
            currentColor 58%,
            currentColor 100%
          );
          background-position: 150% 0;
          background-size: 250% 100%;
          background-clip: text;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          animation: textShine 2.5s ease-in-out infinite;
        }

        .shine-text-dark {
          background-image: linear-gradient(
            110deg,
            currentColor 0%,
            currentColor 42%,
            #60a5fa 50%,
            currentColor 58%,
            currentColor 100%
          );
        }

        .client-data-table th,
        .client-data-table td {
          padding-left: 0.875rem;
          padding-right: 0.875rem;
        }

        .client-table-scroll {
          scrollbar-width: thin;
          scrollbar-color: #cbd5e1 transparent;
        }

        .client-table-scroll::-webkit-scrollbar {
          height: 7px;
        }

        .client-table-scroll::-webkit-scrollbar-track {
          background: transparent;
        }

        .client-table-scroll::-webkit-scrollbar-thumb {
          border-radius: 999px;
          background: #cbd5e1;
        }

        .client-table-scroll::-webkit-scrollbar-thumb:hover {
          background: #94a3b8;
        }

        @keyframes textShine {
          0% {
            background-position: 150% 0;
          }

          55%,
          100% {
            background-position: -150% 0;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .shine-button {
            transition: none;
          }

          .shine-text {
            animation: none;
            background: none;
            -webkit-text-fill-color: currentColor;
          }
        }
      `}</style>
    </>
  );
}
