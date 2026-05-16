import { useEffect, useMemo, useState } from 'react';
import {
  ArrowRight,
  Building2,
  CheckCircle2,
  Loader2,
  Mail,
  Rocket,
  Send,
  User,
} from 'lucide-react';
import * as api from '../api';

const CustomerOnboardingPage = () => {
  const [form, setForm] = useState({
    companyName: '',
    adminEmail: '',
    adminFullName: '',
    plan: 'PRO' as 'FREE' | 'PRO' | 'ENTERPRISE',
    autoInvite: true,
  });
  const [provisioningId, setProvisioningId] = useState<string | null>(null);
  const [status, setStatus] = useState<api.ProvisioningStatus | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [inviteSending, setInviteSending] = useState(false);
  const [inviteSent, setInviteSent] = useState(false);

  const progress = useMemo(() => {
    if (!status) return 0;
    if (status.status === 'READY') return 100;
    return Math.round((status.currentStep / status.totalSteps) * 100);
  }, [status]);

  useEffect(() => {
    if (!provisioningId) return undefined;

    const timer = window.setInterval(async () => {
      try {
        const next = await api.fetchProvisioningStatus(provisioningId);
        setStatus(next);
      } catch {
        setMessage('Waiting for provisioning status from crm-api.');
      }
    }, 2000);

    return () => window.clearInterval(timer);
  }, [provisioningId]);

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

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSubmitting(true);
    setMessage(null);
    setInviteSent(false);
    setStatus(null);
    try {
      const result = await api.provisionCustomer({
        companyName: form.companyName,
        adminEmail: form.adminEmail,
        adminFullName: form.adminFullName,
        plan: form.plan,
      });
      setProvisioningId(result.provisioningId);
      setStatus({
        status: result.status,
        currentStep: 0,
        totalSteps: 9,
        stepLabel: 'Queued in crm-api.',
      });
      setMessage(`Provisioning queued with id ${result.provisioningId}.`);
    } catch (error: any) {
      setMessage(error.response?.data?.message || 'Could not start onboarding.');
    } finally {
      setSubmitting(false);
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
      setMessage('Owner invite sent. The customer can set a password and log in.');
    } catch (error: any) {
      setMessage(error.response?.data?.message || 'Could not send invite.');
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
            Customer Onboarding
          </h1>
          <p className="text-[13px] text-slate-500 font-medium mt-1">
            Provision a new tenant through crm-api and send the owner account setup email.
          </p>
        </div>
        {message && (
          <div className="max-w-xl rounded-lg border border-slate-200 bg-white px-3 py-2 text-[12px] font-semibold text-slate-600 shadow-sm dark:border-slate-800 dark:bg-[#0F172A] dark:text-slate-300">
            {message}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[460px_minmax(0,1fr)] gap-6">
        <section className="bg-white dark:bg-[#0F172A] rounded-xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
              <Rocket size={19} />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                New Customer
              </h2>
              <p className="text-[12px] text-slate-500">
                Uses the internal tenant provisioning flow in crm-api.
              </p>
            </div>
          </div>

          <form onSubmit={(event) => void submit(event)} className="mt-5 space-y-3">
            <div className="relative">
              <Building2
                size={15}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                value={form.companyName}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    companyName: event.target.value,
                  }))
                }
                required
                placeholder="Company name"
                className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-9 pr-3 text-[13px] outline-none focus:ring-1 focus:ring-primary/30 dark:border-slate-800 dark:bg-slate-900"
              />
            </div>
            <div className="relative">
              <User
                size={15}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                value={form.adminFullName}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    adminFullName: event.target.value,
                  }))
                }
                required
                placeholder="Owner full name"
                className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-9 pr-3 text-[13px] outline-none focus:ring-1 focus:ring-primary/30 dark:border-slate-800 dark:bg-slate-900"
              />
            </div>
            <div className="relative">
              <Mail
                size={15}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                value={form.adminEmail}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    adminEmail: event.target.value,
                  }))
                }
                type="email"
                required
                placeholder="owner@customer.com"
                className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-9 pr-3 text-[13px] outline-none focus:ring-1 focus:ring-primary/30 dark:border-slate-800 dark:bg-slate-900"
              />
            </div>
            <select
              value={form.plan}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  plan: event.target.value as 'FREE' | 'PRO' | 'ENTERPRISE',
                }))
              }
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-[13px] outline-none focus:ring-1 focus:ring-primary/30 dark:border-slate-800 dark:bg-slate-900"
            >
              <option value="FREE">Free</option>
              <option value="PRO">Pro</option>
              <option value="ENTERPRISE">Enterprise</option>
            </select>
            <label className="flex items-center gap-3 rounded-lg border border-slate-200 px-3 py-2 text-[12px] font-semibold text-slate-600 dark:border-slate-800 dark:text-slate-300">
              <input
                type="checkbox"
                checked={form.autoInvite}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    autoInvite: event.target.checked,
                  }))
                }
              />
              Send password setup invite when provisioning is ready
            </label>
            <button
              type="submit"
              disabled={submitting || isRunning}
              className="w-full h-10 rounded-lg bg-primary text-white text-[13px] font-bold disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {submitting ? (
                <Loader2 size={15} className="animate-spin" />
              ) : (
                <ArrowRight size={15} />
              )}
              Start onboarding
            </button>
          </form>
        </section>

        <section className="bg-white dark:bg-[#0F172A] rounded-xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm min-h-[360px]">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Provisioning Status
              </h2>
              <p className="text-[12px] text-slate-500 mt-1">
                {provisioningId || 'No provisioning job running.'}
              </p>
            </div>
            <div
              className={`rounded-lg px-3 py-1.5 text-[11px] font-bold uppercase ${
                status?.status === 'READY'
                  ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10'
                  : status?.status === 'FAILED'
                    ? 'bg-rose-50 text-rose-600 dark:bg-rose-500/10'
                    : 'bg-slate-100 text-slate-500 dark:bg-slate-800'
              }`}
            >
              {status?.status || 'Idle'}
            </div>
          </div>

          <div className="mt-8 flex items-center gap-5">
            <div className="w-16 h-16 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
              {status?.status === 'READY' ? (
                <CheckCircle2 size={32} />
              ) : (
                <Loader2
                  size={32}
                  className={isRunning ? 'animate-spin' : undefined}
                />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                {status?.stepLabel || 'Ready for the next customer.'}
              </h3>
              <p className="mt-1 text-[13px] text-slate-500">
                {status
                  ? `Step ${status.currentStep} of ${status.totalSteps}`
                  : 'Submit the form to start the crm-api SLG onboarding flow.'}
              </p>
            </div>
          </div>

          <div className="mt-8">
            <div className="h-2 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
              <div
                className="h-full rounded-full bg-primary transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
            <div className="mt-2 flex justify-between text-[11px] font-semibold text-slate-400">
              <span>{progress}%</span>
              {status?.redirectUrl && (
                <a
                  href={status.redirectUrl}
                  className="text-primary hover:underline"
                  target="_blank"
                  rel="noreferrer"
                >
                  Open tenant login
                </a>
              )}
            </div>
          </div>

          {isReady && (
            <div className="mt-8 rounded-xl border border-emerald-200 bg-emerald-50 p-4 dark:border-emerald-900/60 dark:bg-emerald-500/10">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h3 className="text-[14px] font-bold text-emerald-700 dark:text-emerald-300">
                    Tenant is ready
                  </h3>
                  <p className="text-[12px] text-emerald-700/80 dark:text-emerald-300/80">
                    Tenant id: {status.tenantId}
                  </p>
                </div>
                <button
                  onClick={() => void sendInvite(status.tenantId!)}
                  disabled={inviteSending || inviteSent}
                  className="h-9 rounded-lg bg-emerald-600 px-3 text-[12px] font-bold text-white disabled:opacity-60 flex items-center gap-2"
                >
                  {inviteSending ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : (
                    <Send size={14} />
                  )}
                  {inviteSent ? 'Invite sent' : 'Send owner invite'}
                </button>
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

export default CustomerOnboardingPage;
