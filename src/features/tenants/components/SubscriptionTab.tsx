import { useState, useEffect, useTransition, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { HardDrive, Crown, Save, RotateCcw, AlertTriangle } from 'lucide-react';
import * as api from '../../../api';
import type { Tenant } from '../../../api';
import { useToast } from '../../../shared/context/ToastContext';

interface Props {
  tenantId: string;
  tenant: Tenant;
  onTenantUpdated: (tenant: Tenant) => void;
}

const PLANS = ['FREE', 'PRO', 'ENTERPRISE'] as const;

const PLAN_COLORS: Record<string, { bg: string; text: string; border: string; ring: string }> = {
  FREE:       { bg: 'bg-slate-50 dark:bg-slate-800',         text: 'text-slate-600 dark:text-slate-300',   border: 'border-slate-200 dark:border-slate-700', ring: 'ring-slate-300' },
  PRO:        { bg: 'bg-indigo-50 dark:bg-indigo-500/10',    text: 'text-indigo-600 dark:text-indigo-400', border: 'border-indigo-200 dark:border-indigo-500/30', ring: 'ring-indigo-400' },
  ENTERPRISE: { bg: 'bg-amber-50 dark:bg-amber-500/10',      text: 'text-amber-600 dark:text-amber-400',   border: 'border-amber-200 dark:border-amber-500/30', ring: 'ring-amber-400' },
};

const PLAN_DEFAULTS_MB: Record<string, number> = {
  FREE: 1024,
  PRO: 5120,
  ENTERPRISE: 20480,
};

const SubscriptionTab = ({ tenantId, tenant, onTenantUpdated }: Props) => {
  const { t } = useTranslation();
  const { showToast } = useToast();
  const [isPending, startTransition] = useTransition();

  const [plan, setPlan] = useState(tenant.subscriptionPlan ?? 'FREE');
  const [quotaLimitMB, setQuotaLimitMB] = useState(tenant.storageQuota?.limitMB ?? PLAN_DEFAULTS_MB[tenant.subscriptionPlan] ?? 1024);
  const [savedPlan, setSavedPlan] = useState(plan);
  const [savedQuotaMB, setSavedQuotaMB] = useState(quotaLimitMB);

  const usedMB = tenant.storageQuota?.usedMB ?? 0;
  const usagePercent = useMemo(
    () => quotaLimitMB > 0 ? Math.min(100, Math.round((usedMB / quotaLimitMB) * 100)) : 0,
    [usedMB, quotaLimitMB],
  );

  const hasChanges = plan !== savedPlan || quotaLimitMB !== savedQuotaMB;

  // Sync if tenant prop updates externally
  useEffect(() => {
    const p = tenant.subscriptionPlan ?? 'FREE';
    const q = tenant.storageQuota?.limitMB ?? PLAN_DEFAULTS_MB[p] ?? 1024;
    setPlan(p);
    setQuotaLimitMB(q);
    setSavedPlan(p);
    setSavedQuotaMB(q);
  }, [tenant]);

  const handleSave = () => {
    startTransition(async () => {
      try {
        const updated = await api.updateTenantSubscription(tenantId, {
          subscriptionPlan: plan,
          storageQuotaLimitMB: quotaLimitMB,
        });
        setSavedPlan(plan);
        setSavedQuotaMB(quotaLimitMB);
        onTenantUpdated(updated);
        showToast(t('subscription.saveSuccess'), 'success');
      } catch (err: any) {
        showToast(err.response?.data?.message || t('subscription.saveError'), 'error');
      }
    });
  };

  const handleReset = () => {
    setPlan(savedPlan);
    setQuotaLimitMB(savedQuotaMB);
  };

  const handlePlanChange = (newPlan: string) => {
    setPlan(newPlan);
    // Auto-suggest default quota for the plan if quota hasn't been manually edited
    if (quotaLimitMB === PLAN_DEFAULTS_MB[savedPlan]) {
      setQuotaLimitMB(PLAN_DEFAULTS_MB[newPlan] ?? quotaLimitMB);
    }
  };

  const progressColor =
    usagePercent >= 90 ? 'bg-rose-500' :
    usagePercent >= 70 ? 'bg-amber-500' :
    'bg-emerald-500';

  const progressBg =
    usagePercent >= 90 ? 'bg-rose-100 dark:bg-rose-500/10' :
    usagePercent >= 70 ? 'bg-amber-100 dark:bg-amber-500/10' :
    'bg-emerald-100 dark:bg-emerald-500/10';

  return (
    <div className="space-y-8">
      {/* ── Subscription Plan ───────────────────────────────────────── */}
      <section className="space-y-4">
        <div>
          <h3 className="text-[14px] font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Crown size={16} className="text-amber-500" />
            {t('subscription.planTitle')}
          </h3>
          <p className="text-[12px] text-slate-500 mt-0.5">{t('subscription.planDesc')}</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {PLANS.map((p) => {
            const c = PLAN_COLORS[p];
            const isSelected = plan === p;
            return (
              <button
                key={p}
                onClick={() => handlePlanChange(p)}
                className={`relative flex flex-col items-center gap-1.5 px-4 py-4 rounded-xl border-2 transition-all text-center ${
                  isSelected
                    ? `${c.bg} ${c.border} ${c.text} ring-2 ${c.ring} shadow-sm`
                    : 'border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-600'
                }`}
              >
                <Crown size={20} className={isSelected ? c.text : 'text-slate-400'} />
                <span className="text-[13px] font-bold uppercase tracking-wider">{p}</span>
                <span className="text-[11px] text-slate-400 font-medium">
                  {(PLAN_DEFAULTS_MB[p] / 1024).toFixed(0)} GB {t('subscription.defaultStorage')}
                </span>
                {isSelected && (
                  <div className={`absolute top-2 right-2 w-2 h-2 rounded-full ${progressColor.replace('bg-', 'bg-').includes('rose') ? 'bg-indigo-500' : 'bg-emerald-500'}`} />
                )}
              </button>
            );
          })}
        </div>
      </section>

      {/* ── Storage Quota ───────────────────────────────────────────── */}
      <section className="space-y-4">
        <div>
          <h3 className="text-[14px] font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <HardDrive size={16} className="text-primary" />
            {t('subscription.storageTitle')}
          </h3>
          <p className="text-[12px] text-slate-500 mt-0.5">{t('subscription.storageDesc')}</p>
        </div>

        {/* Usage Bar */}
        <div className="bg-white dark:bg-slate-900/50 rounded-xl border border-slate-200 dark:border-slate-700 p-5 space-y-3">
          <div className="flex items-end justify-between">
            <div>
              <span className="text-[24px] font-black text-slate-900 dark:text-white tabular-nums">
                {usedMB < 1024 ? `${usedMB} MB` : `${(usedMB / 1024).toFixed(1)} GB`}
              </span>
              <span className="text-[13px] text-slate-400 ml-1.5">
                / {quotaLimitMB < 1024 ? `${quotaLimitMB} MB` : `${(quotaLimitMB / 1024).toFixed(0)} GB`}
              </span>
            </div>
            <span className={`text-[13px] font-bold tabular-nums ${
              usagePercent >= 90 ? 'text-rose-500' :
              usagePercent >= 70 ? 'text-amber-500' :
              'text-emerald-500'
            }`}>
              {usagePercent}%
            </span>
          </div>

          <div className={`w-full h-3 rounded-full ${progressBg} overflow-hidden`}>
            <div
              className={`h-full rounded-full ${progressColor} transition-all duration-500 ease-out`}
              style={{ width: `${usagePercent}%` }}
            />
          </div>

          {usagePercent >= 80 && (
            <div className="flex items-start gap-2 px-3 py-2 rounded-lg bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 text-[12px]">
              <AlertTriangle size={14} className="mt-0.5 shrink-0" />
              <span>{t('subscription.quotaWarning')}</span>
            </div>
          )}
        </div>

        {/* Quota Input */}
        <div className="flex flex-col sm:flex-row items-start sm:items-end gap-3">
          <div className="flex-1 space-y-1.5 w-full sm:w-auto">
            <label className="block text-[12px] font-semibold text-slate-600 dark:text-slate-400">
              {t('subscription.quotaLabel')}
            </label>
            <div className="relative">
              <HardDrive size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="number"
                min={usedMB || 1}
                step={512}
                value={quotaLimitMB}
                onChange={(e) => setQuotaLimitMB(Math.max(1, parseInt(e.target.value) || 0))}
                className="w-full pl-9 pr-12 py-2 text-[13px] bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none tabular-nums"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[12px] text-slate-400 font-medium">MB</span>
            </div>
          </div>

          {/* Quick presets */}
          <div className="flex gap-1.5 flex-wrap">
            {[1024, 2048, 5120, 10240, 20480].map((mb) => (
              <button
                key={mb}
                onClick={() => setQuotaLimitMB(mb)}
                className={`px-2.5 py-1.5 text-[11px] font-bold rounded-lg border transition-colors ${
                  quotaLimitMB === mb
                    ? 'bg-primary/10 text-primary border-primary/30'
                    : 'bg-slate-50 dark:bg-slate-800 text-slate-500 border-slate-200 dark:border-slate-700 hover:border-slate-300'
                }`}
              >
                {mb >= 1024 ? `${mb / 1024} GB` : `${mb} MB`}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* ── Actions ─────────────────────────────────────────────────── */}
      {hasChanges && (
        <div className="flex items-center justify-between bg-primary/5 border border-primary/20 rounded-xl px-5 py-3 animate-in slide-in-from-bottom-2 duration-200">
          <span className="text-[13px] text-slate-600 dark:text-slate-300 font-medium">
            {t('subscription.unsavedChanges')}
          </span>
          <div className="flex gap-2">
            <button
              onClick={handleReset}
              disabled={isPending}
              className="flex items-center gap-1.5 px-3 py-1.5 text-[13px] font-semibold text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors disabled:opacity-50"
            >
              <RotateCcw size={13} />
              {t('subscription.reset')}
            </button>
            <button
              onClick={handleSave}
              disabled={isPending}
              className="flex items-center gap-1.5 px-4 py-1.5 text-[13px] font-semibold text-white bg-primary rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50"
            >
              <Save size={13} />
              {isPending ? t('subscription.saving') : t('subscription.save')}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default SubscriptionTab;
