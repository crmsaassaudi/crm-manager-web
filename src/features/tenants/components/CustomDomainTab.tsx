import { useState, useEffect, useTransition } from 'react';
import { useTranslation } from 'react-i18next';
import { Globe, Trash2, RefreshCw, CheckCircle, Clock, AlertTriangle, Copy } from 'lucide-react';
import * as api from '../../../api';
import type { CustomDomainConfig } from '../../../api';
import { useToast } from '../../../shared/context/ToastContext';
import ConfirmationModal from '../../../shared/components/ConfirmationModal';

interface Props {
  tenantId: string;
  tenantAlias: string;
}

const STATUS_ICON = {
  NONE: Globe,
  DNS_PENDING: Clock,
  SSL_ISSUING: RefreshCw,
  ACTIVE: CheckCircle,
};

const STATUS_COLOR = {
  NONE: { text: 'text-slate-500', bg: 'bg-slate-100 dark:bg-slate-800' },
  DNS_PENDING: { text: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-500/10' },
  SSL_ISSUING: { text: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-50 dark:bg-blue-500/10' },
  ACTIVE: { text: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-500/10' },
};

const CustomDomainTab = ({ tenantId, tenantAlias }: Props) => {
  const { t } = useTranslation();
  const { showToast } = useToast();
  const [isPending, startTransition] = useTransition();
  const [config, setConfig] = useState<CustomDomainConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [domainInput, setDomainInput] = useState('');
  const [verifyResult, setVerifyResult] = useState<{ verified: boolean; message: string } | null>(null);
  const [removeModal, setRemoveModal] = useState(false);

  useEffect(() => {
    api.fetchCustomDomain(tenantId)
      .then((data) => {
        setConfig(data);
        setDomainInput(data.customDomain ?? '');
      })
      .catch(() => showToast(t('customDomain.loadError'), 'error'))
      .finally(() => setLoading(false));
  }, [tenantId, t, showToast]);

  const handleSave = () => {
    if (!domainInput.trim()) return;
    startTransition(async () => {
      try {
        await api.setCustomDomain(tenantId, domainInput.trim());
        const updated = await api.fetchCustomDomain(tenantId);
        setConfig(updated);
        setVerifyResult(null);
        showToast(t('customDomain.saveSuccess'), 'success');
      } catch (err: any) {
        showToast(err.response?.data?.message || t('customDomain.saveError'), 'error');
      }
    });
  };

  const handleVerify = () => {
    startTransition(async () => {
      try {
        const result = await api.verifyCustomDomain(tenantId);
        setVerifyResult({ verified: result.verified, message: result.message });
        if (result.verified) {
          const updated = await api.fetchCustomDomain(tenantId);
          setConfig(updated);
          showToast(result.message, 'success');
        } else {
          showToast(result.message, 'warning');
        }
      } catch (err: any) {
        showToast(err.response?.data?.message || t('customDomain.verifyError'), 'error');
      }
    });
  };

  const handleRemove = () => {
    startTransition(async () => {
      try {
        await api.removeCustomDomain(tenantId);
        const updated = await api.fetchCustomDomain(tenantId);
        setConfig(updated);
        setDomainInput('');
        setVerifyResult(null);
        setRemoveModal(false);
        showToast(t('customDomain.removeSuccess'), 'success');
      } catch (err: any) {
        showToast(err.response?.data?.message || t('customDomain.removeError'), 'error');
      }
    });
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(() => showToast(t('customDomain.copied'), 'success'));
  };

  if (loading) return (
    <div className="flex items-center justify-center h-40">
      <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  );

  const statusKey = (config?.customDomainStatus ?? 'NONE') as keyof typeof STATUS_ICON;
  const StatusIcon = STATUS_ICON[statusKey];
  const statusStyle = STATUS_COLOR[statusKey];

  return (
    <div className="space-y-6">
      {/* Status Banner */}
      <div className={`flex items-center gap-3 px-4 py-3 rounded-xl border ${statusStyle.bg} border-current/10`}>
        <StatusIcon size={16} className={statusStyle.text} />
        <div>
          <span className={`text-[13px] font-semibold ${statusStyle.text}`}>
            {t(`customDomain.statusLabel.${statusKey}`)}
          </span>
          {config?.customDomain && (
            <span className="ml-2 text-[13px] text-slate-500 font-mono">{config.customDomain}</span>
          )}
        </div>
      </div>

      {/* Domain Input */}
      <div className="space-y-3">
        <label className="block text-[13px] font-semibold text-slate-700 dark:text-slate-300">
          {t('customDomain.domainLabel')}
        </label>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Globe size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={domainInput}
              onChange={(e) => setDomainInput(e.target.value)}
              placeholder={t('customDomain.domainPlaceholder')}
              className="w-full pl-9 pr-4 py-2 text-[13px] bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none font-mono"
            />
          </div>
          <button
            onClick={handleSave}
            disabled={isPending || !domainInput.trim()}
            className="px-4 py-2 bg-primary text-white text-[13px] font-semibold rounded-lg hover:bg-primary/90 disabled:opacity-50 transition-colors"
          >
            {isPending ? t('customDomain.saving') : t('customDomain.save')}
          </button>
          {config?.customDomain && (
            <button
              onClick={() => setRemoveModal(true)}
              disabled={isPending}
              className="px-3 py-2 bg-rose-50 text-rose-600 dark:bg-rose-500/10 dark:text-rose-400 rounded-lg hover:bg-rose-100 dark:hover:bg-rose-500/20 transition-colors disabled:opacity-50"
            >
              <Trash2 size={14} />
            </button>
          )}
        </div>
        <p className="text-[11px] text-slate-400">
          {t('customDomain.domainHint')}
        </p>
      </div>

      {/* DNS Records Table */}
      {config?.dnsRecords && config.dnsRecords.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-[13px] font-semibold text-slate-700 dark:text-slate-300">
              {t('customDomain.dnsRecordsTitle')}
            </h3>
            <button
              onClick={handleVerify}
              disabled={isPending}
              className="flex items-center gap-1.5 text-[12px] font-semibold text-primary hover:text-primary/80 disabled:opacity-50 transition-colors"
            >
              <RefreshCw size={12} className={isPending ? 'animate-spin' : ''} />
              {t('customDomain.verify')}
            </button>
          </div>

          <div className="rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
            <table className="w-full text-[12px]">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/50">
                  <th className="text-left px-4 py-2.5 font-semibold text-slate-600 dark:text-slate-400">{t('customDomain.dnsType')}</th>
                  <th className="text-left px-4 py-2.5 font-semibold text-slate-600 dark:text-slate-400">{t('customDomain.dnsName')}</th>
                  <th className="text-left px-4 py-2.5 font-semibold text-slate-600 dark:text-slate-400">{t('customDomain.dnsValue')}</th>
                  <th className="text-left px-4 py-2.5 font-semibold text-slate-600 dark:text-slate-400">{t('customDomain.dnsTtl')}</th>
                  <th className="w-8" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {config.dnsRecords.map((record, i) => (
                  <tr key={i} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20">
                    <td className="px-4 py-2.5">
                      <span className="px-2 py-0.5 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 rounded text-[11px] font-bold font-mono">
                        {record.type}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 font-mono text-slate-600 dark:text-slate-300 max-w-[160px] truncate">{record.name}</td>
                    <td className="px-4 py-2.5 font-mono text-slate-600 dark:text-slate-300 max-w-[160px] truncate">{record.value}</td>
                    <td className="px-4 py-2.5 text-slate-500">{record.ttl}s</td>
                    <td className="px-4 py-2.5">
                      <button
                        onClick={() => copyToClipboard(record.value)}
                        className="text-slate-400 hover:text-primary transition-colors"
                        title={t('customDomain.copied')}
                      >
                        <Copy size={12} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {verifyResult && (
            <div className={`flex items-start gap-2 px-3 py-2 rounded-lg text-[12px] ${
              verifyResult.verified
                ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400'
                : 'bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400'
            }`}>
              {verifyResult.verified
                ? <CheckCircle size={14} className="mt-0.5 shrink-0" />
                : <AlertTriangle size={14} className="mt-0.5 shrink-0" />}
              <span>{verifyResult.message}</span>
            </div>
          )}
        </div>
      )}

      <ConfirmationModal
        isOpen={removeModal}
        onClose={() => setRemoveModal(false)}
        onConfirm={handleRemove}
        title={t('customDomain.removeDomain')}
        message={t('customDomain.removeMessage', { alias: tenantAlias })}
        confirmText={t('customDomain.removeConfirm')}
        type="danger"
        isConfirming={isPending}
      />
    </div>
  );
};

export default CustomDomainTab;
