import { useEffect, useMemo, useRef, useState, useTransition } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ArrowRight,
  Building2,
  CheckCircle2,
  Loader2,
  Mail,
  Rocket,
  Send,
  User,
  RefreshCw,
  AlertCircle,
} from 'lucide-react';
import * as api from '../api';
import { useToast } from '../shared/context/ToastContext';
import { useProvisioningStatus } from '../hooks/useProvisioningStatus';

const CustomerOnboardingPage = () => {
  const { t } = useTranslation();
  const { showToast } = useToast();
  const [isPending, startTransition] = useTransition();

  const [form, setForm] = useState({
    companyName: '',
    adminEmail: '',
    adminFullName: '',
    plan: 'PRO' as 'FREE' | 'PRO' | 'ENTERPRISE',
    autoInvite: true,
  });
  const [provisioningId, setProvisioningId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [retrying, setRetrying] = useState(false);
  const [inviteSending, setInviteSending] = useState(false);
  const [inviteSent, setInviteSent] = useState(false);

  const logContainerRef = useRef<HTMLDivElement>(null);

  // WebSocket-first with HTTP polling fallback
  const status = useProvisioningStatus(provisioningId);

  const progress = useMemo(() => {
    if (!status) return 0;
    if (status.status === 'READY') return 100;
    if (status.status === 'FAILED') return 0;
    return Math.round((status.currentStep / status.totalSteps) * 100);
  }, [status]);

  // Auto-scroll terminal to bottom on new log entries
  useEffect(() => {
    if (logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  }, [status?.subStepLogs?.length]);

  useEffect(() => {
    if (
      status?.status === 'READY' &&
      status.tenantId &&
      form.autoInvite &&
      !inviteSent &&
      !inviteSending
    ) {
      void sendInvite(status.tenantId);
    }
  }, [form.autoInvite, inviteSending, inviteSent, status]);

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    setMessage(null);
    setInviteSent(false);
    startTransition(async () => {
      try {
        const result = await api.provisionCustomer({
          companyName: form.companyName,
          adminEmail: form.adminEmail,
          adminFullName: form.adminFullName,
          plan: form.plan,
        });
        setProvisioningId(result.provisioningId);
        setMessage(t('onboarding.provisioningQueued', { id: result.provisioningId, defaultValue: `Provisioning enqueued: ${result.provisioningId}` }));
        showToast(t('onboarding.provisioningQueuedToast', { defaultValue: 'Tenant provisioning enqueued successfully.' }), 'success');
      } catch (error: any) {
        setMessage(error.response?.data?.message || t('onboarding.onboardingError', { defaultValue: 'Onboarding error occurred.' }));
        showToast(error.response?.data?.message || t('onboarding.onboardingError', { defaultValue: 'Onboarding error occurred.' }), 'error');
      }
    });
  };

  const handleRetry = async () => {
    if (!provisioningId) return;
    setRetrying(true);
    setMessage(null);
    try {
      await api.retryProvisioning(provisioningId);
      setMessage(t('onboarding.retryQueued', { defaultValue: 'Safe idempotency retry successfully enqueued.' }));
      showToast(t('onboarding.retryQueuedToast', { defaultValue: 'Idempotent retry successfully triggered!' }), 'success');
    } catch (error: any) {
      showToast(error.response?.data?.message || t('onboarding.retryError', { defaultValue: 'Could not trigger retry.' }), 'error');
    } finally {
      setRetrying(false);
    }
  };

  const sendInvite = async (tenantId: string) => {
    setInviteSending(true);
    setMessage(null);
    try {
      await api.inviteCustomerUser(tenantId, {
        email: form.adminEmail,
        role: 'OWNER',
      });
      setInviteSent(true);
      setMessage(t('onboarding.inviteSentSuccess', { defaultValue: 'Invitation sent successfully.' }));
      showToast(t('onboarding.inviteSentSuccess', { defaultValue: 'Invitation sent successfully.' }), 'success');
    } catch (error: any) {
      setMessage(error.response?.data?.message || t('onboarding.inviteError', { defaultValue: 'Could not send invitation.' }));
      showToast(error.response?.data?.message || t('onboarding.inviteError', { defaultValue: 'Could not send invitation.' }), 'error');
    } finally {
      setInviteSending(false);
    }
  };

  const isReady = status?.status === 'READY' && status.tenantId;
  const isRunning = status?.status === 'QUEUED' || status?.status === 'PROVISIONING';

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            {t('onboarding.title', { defaultValue: 'Customer Onboarding' })}
          </h1>
          <p className="text-[13px] text-slate-500 font-medium mt-1">
            {t('onboarding.subtitle', { defaultValue: 'Provision workspaces and channels for onboarding customers.' })}
          </p>
        </div>
        {message && (
          <div className="max-w-xl rounded-lg border border-slate-200 bg-white px-3 py-2 text-[12px] font-semibold text-slate-600 shadow-sm dark:border-slate-800 dark:bg-[#0F172A] dark:text-slate-300">
            {message}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[460px_minmax(0,1fr)] gap-6">
        {/* ── Left: Provisioning Form ── */}
        <section className="bg-white dark:bg-[#0F172A] rounded-xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
              <Rocket size={19} />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                {t('onboarding.newCustomer', { defaultValue: 'New Customer' })}
              </h2>
              <p className="text-[12px] text-slate-500">
                {t('onboarding.provisioningFlow', { defaultValue: 'Trigger provisioning sagas' })}
              </p>
            </div>
          </div>

          <form onSubmit={(event) => void submit(event)} className="mt-5 space-y-3">
            <div className="relative">
              <Building2 size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                value={form.companyName}
                onChange={(event) => setForm((c) => ({ ...c, companyName: event.target.value }))}
                required
                placeholder={t('onboarding.companyName', { defaultValue: 'Company Name' })}
                className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-9 pr-3 text-[13px] outline-none focus:ring-1 focus:ring-primary/30 dark:border-slate-800 dark:bg-slate-900 text-slate-900 dark:text-white"
              />
            </div>
            <div className="relative">
              <User size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                value={form.adminFullName}
                onChange={(event) => setForm((c) => ({ ...c, adminFullName: event.target.value }))}
                required
                placeholder={t('onboarding.ownerName', { defaultValue: 'Owner Name' })}
                className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-9 pr-3 text-[13px] outline-none focus:ring-1 focus:ring-primary/30 dark:border-slate-800 dark:bg-slate-900 text-slate-900 dark:text-white"
              />
            </div>
            <div className="relative">
              <Mail size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                value={form.adminEmail}
                onChange={(event) => setForm((c) => ({ ...c, adminEmail: event.target.value }))}
                type="email"
                required
                placeholder={t('onboarding.ownerEmail', { defaultValue: 'Owner Email' })}
                className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-9 pr-3 text-[13px] outline-none focus:ring-1 focus:ring-primary/30 dark:border-slate-800 dark:bg-slate-900 text-slate-900 dark:text-white"
              />
            </div>
            <select
              value={form.plan}
              onChange={(event) => setForm((c) => ({ ...c, plan: event.target.value as 'FREE' | 'PRO' | 'ENTERPRISE' }))}
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-[13px] outline-none focus:ring-1 focus:ring-primary/30 dark:border-slate-800 dark:bg-slate-900 text-slate-900 dark:text-white cursor-pointer"
            >
              <option value="FREE">Free</option>
              <option value="PRO">Pro</option>
              <option value="ENTERPRISE">Enterprise</option>
            </select>
            <label className="flex items-center gap-3 rounded-lg border border-slate-200 px-3 py-2 text-[12px] font-semibold text-slate-600 dark:border-slate-800 dark:text-slate-300 cursor-pointer">
              <input
                type="checkbox"
                checked={form.autoInvite}
                onChange={(event) => setForm((c) => ({ ...c, autoInvite: event.target.checked }))}
                className="cursor-pointer"
              />
              {t('onboarding.autoInvite', { defaultValue: 'Auto-invite user once ready' })}
            </label>
            <button
              type="submit"
              disabled={isPending || isRunning}
              className="w-full h-10 rounded-lg bg-primary hover:bg-primary/95 text-white text-[13px] font-bold disabled:opacity-50 flex items-center justify-center gap-2 transition-all active:scale-[0.98] cursor-pointer shadow-lg shadow-primary/20"
            >
              {isPending ? <Loader2 size={15} className="animate-spin" /> : <ArrowRight size={15} />}
              {t('onboarding.startButton', { defaultValue: 'Start Onboarding' })}
            </button>
          </form>
        </section>

        {/* ── Right: Status + Terminal ── */}
        <section className="bg-white dark:bg-[#0F172A] rounded-xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm min-h-90 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 className="text-base font-bold text-slate-900 dark:text-white">
                  {t('onboarding.provisioningStatus', { defaultValue: 'Provisioning Status' })}
                </h2>
                <p className="text-[12px] text-slate-500 mt-1 font-mono">
                  {provisioningId || t('onboarding.noJobRunning', { defaultValue: 'No active job running' })}
                </p>
              </div>
              <div className={`rounded-lg px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider ${
                status?.status === 'READY'
                  ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10'
                  : status?.status === 'FAILED'
                    ? 'bg-rose-50 text-rose-600 dark:bg-rose-500/10'
                    : 'bg-slate-100 text-slate-500 dark:bg-slate-800'
              }`}>
                {status?.status || t('onboarding.idle', { defaultValue: 'Idle' })}
              </div>
            </div>

            <div className="mt-8 flex items-center gap-5">
              <div className="w-16 h-16 rounded-2xl bg-primary/5 text-primary flex items-center justify-center shrink-0">
                {status?.status === 'READY' ? (
                  <CheckCircle2 size={32} className="text-emerald-500" />
                ) : status?.status === 'FAILED' ? (
                  <AlertCircle size={32} className="text-rose-500" />
                ) : (
                  <Loader2 size={32} className={isRunning ? 'animate-spin' : 'text-slate-300'} />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white truncate">
                  {status?.stepLabel || t('onboarding.readyDesc', { defaultValue: 'Ready to provision' })}
                </h3>
                <p className="mt-1 text-[13px] text-slate-500">
                  {status
                    ? t('onboarding.stepLabel', { current: status.currentStep, total: status.totalSteps, defaultValue: `Step ${status.currentStep} of ${status.totalSteps}` })
                    : t('onboarding.submitFormDesc', { defaultValue: 'Submit form to start creation' })}
                </p>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="mt-8">
              <div className="h-2 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden shadow-inner">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    status?.status === 'FAILED' ? 'bg-rose-500' : 'bg-primary'
                  }`}
                  style={{ width: `${progress}%` }}
                />
              </div>
              <div className="mt-2.5 flex justify-between text-[11px] font-semibold text-slate-400">
                <span>{progress}%</span>
                {status?.redirectUrl && (
                  <a
                    href={status.redirectUrl}
                    className="text-primary hover:underline flex items-center gap-1"
                    target="_blank"
                    rel="noreferrer"
                  >
                    {t('onboarding.openLogin', { defaultValue: 'Launch Workspace' })}
                    <ArrowRight size={12} />
                  </a>
                )}
              </div>
            </div>

            {/* Terminal Console Log */}
            <div
              ref={logContainerRef}
              className="mt-4 bg-slate-950 text-slate-200 font-mono text-[11px] p-4 rounded-xl h-40 overflow-y-auto border border-slate-800 shadow-inner"
            >
              <p className="text-primary font-bold mb-1">// SYSTEM PROVISIONING LOGS</p>
              {status?.subStepLogs && status.subStepLogs.length > 0 ? (
                status.subStepLogs.map((log, index) => (
                  <div key={index} className="leading-relaxed text-emerald-400/90">{log}</div>
                ))
              ) : (
                <p className="text-slate-500 italic">Chờ khởi tạo tiến trình để xuất log hạ tầng...</p>
              )}
            </div>
          </div>

          <div>
            {/* Success Panel */}
            {isReady && (
              <div className="mt-6 rounded-xl border border-emerald-200 bg-emerald-50 p-4 dark:border-emerald-900/60 dark:bg-emerald-500/10">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h3 className="text-[14px] font-bold text-emerald-700 dark:text-emerald-300">
                      {t('onboarding.readyTitle', { defaultValue: 'Workspace Ready!' })}
                    </h3>
                    <p className="text-[12px] text-emerald-700/80 dark:text-emerald-300/80">
                      Tenant id: {status.tenantId}
                    </p>
                  </div>
                  <button
                    onClick={() => void sendInvite(status.tenantId!)}
                    disabled={inviteSending || inviteSent}
                    className="h-9 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-[12px] font-bold text-white disabled:opacity-60 flex items-center gap-2 px-4 shadow-sm cursor-pointer"
                  >
                    {inviteSending ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                    {inviteSent ? t('onboarding.inviteSent', { defaultValue: 'Invite Sent' }) : t('onboarding.sendInvite', { defaultValue: 'Send Invite' })}
                  </button>
                </div>
              </div>
            )}

            {/* Idempotent Retry Panel */}
            {status?.status === 'FAILED' && (
              <div className="mt-6 rounded-xl border border-rose-200 bg-rose-50 p-4 dark:border-rose-900/60 dark:bg-rose-500/10">
                <h3 className="text-[14px] font-bold text-rose-700 dark:text-rose-300">
                  {t('onboarding.failedTitle', { defaultValue: 'Setup Failed' })}
                </h3>
                <p className="text-[12px] text-rose-700/80 dark:text-rose-300/80 mt-1">
                  {status.error || 'Workspace setup failed. Our team has been notified.'}
                </p>
                {status.retryable && (
                  <button
                    type="button"
                    onClick={handleRetry}
                    disabled={retrying}
                    className="mt-4 w-full h-9 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-[12px] font-bold flex items-center justify-center gap-2 transition-all active:scale-[0.98] cursor-pointer shadow-md shadow-rose-600/10"
                  >
                    {retrying ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} className="shrink-0" />}
                    {t('onboarding.safeRetry', { defaultValue: 'Safe Idempotency Retry' })}
                  </button>
                )}
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
};

export default CustomerOnboardingPage;
