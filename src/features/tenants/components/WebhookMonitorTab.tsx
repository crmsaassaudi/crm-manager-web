import { useState, useEffect, useTransition } from 'react';
import { useTranslation } from 'react-i18next';
import { Webhook, ChevronDown, ChevronRight, RefreshCw, CheckCircle, XCircle, Clock, ExternalLink } from 'lucide-react';
import * as api from '../../../api';
import type { WebhookStat, WebhookDelivery } from '../../../api';
import { useToast } from '../../../shared/context/ToastContext';

interface Props {
  tenantId: string;
}

const SuccessRateBar = ({ rate }: { rate: number }) => {
  const color = rate >= 90 ? 'bg-emerald-500' : rate >= 70 ? 'bg-amber-500' : 'bg-rose-500';
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${color} transition-all`} style={{ width: `${rate}%` }} />
      </div>
      <span className={`text-[12px] font-bold tabular-nums ${
        rate >= 90 ? 'text-emerald-600 dark:text-emerald-400' :
        rate >= 70 ? 'text-amber-600 dark:text-amber-400' : 'text-rose-600 dark:text-rose-400'
      }`}>{rate}%</span>
    </div>
  );
};

const DELIVERY_STATUS_ICON = {
  SUCCESS: CheckCircle,
  FAILED: XCircle,
  PENDING: Clock,
};

const DELIVERY_STATUS_COLOR = {
  SUCCESS: 'text-emerald-600 dark:text-emerald-400',
  FAILED: 'text-rose-600 dark:text-rose-400',
  PENDING: 'text-blue-600 dark:text-blue-400',
};

const WebhookMonitorTab = ({ tenantId }: Props) => {
  const { t } = useTranslation();
  const { showToast } = useToast();
  const [isPending, startTransition] = useTransition();
  const [stats, setStats] = useState<WebhookStat[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [deliveries, setDeliveries] = useState<Record<string, WebhookDelivery[]>>({});
  const [loadingDeliveries, setLoadingDeliveries] = useState<string | null>(null);

  const loadStats = () => {
    api.fetchWebhookStats(tenantId)
      .then((data) => setStats(data.webhooks))
      .catch(() => showToast(t('webhookMonitor.loadError'), 'error'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadStats();
  }, [tenantId]);

  const toggleExpand = async (webhookId: string) => {
    if (expanded === webhookId) {
      setExpanded(null);
      return;
    }
    setExpanded(webhookId);
    if (!deliveries[webhookId]) {
      setLoadingDeliveries(webhookId);
      try {
        const data = await api.fetchWebhookDeliveries(tenantId, webhookId);
        setDeliveries((prev) => ({ ...prev, [webhookId]: data }));
      } catch {
        showToast(t('webhookMonitor.deliveriesError'), 'error');
      } finally {
        setLoadingDeliveries(null);
      }
    }
  };

  const handleResend = (deliveryId: string, webhookId: string) => {
    startTransition(async () => {
      try {
        const result = await api.resendWebhookDelivery(tenantId, deliveryId);
        showToast(
          result.delivered
            ? t('webhookMonitor.resendDelivered', { defaultValue: 'Delivery sent successfully.' })
            : t('webhookMonitor.resendSuccess'),
          'success',
        );
        const data = await api.fetchWebhookDeliveries(tenantId, webhookId);
        setDeliveries((prev) => ({ ...prev, [webhookId]: data }));
      } catch (err: any) {
        showToast(err.response?.data?.message || t('webhookMonitor.resendError'), 'error');
      }
    });
  };

  if (loading) return (
    <div className="flex items-center justify-center h-40">
      <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (stats.length === 0) return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-3">
        <Webhook size={20} className="text-slate-400" />
      </div>
      <p className="text-[13px] font-semibold text-slate-500">{t('webhookMonitor.noWebhooks')}</p>
      <p className="text-[12px] text-slate-400 mt-1">{t('webhookMonitor.noWebhooksDesc')}</p>
    </div>
  );

  return (
    <div className="space-y-3">
      {stats.map((webhook) => {
        const isExpanded = expanded === webhook.webhookId;
        const wDeliveries = deliveries[webhook.webhookId] ?? [];
        const isLoadingDeliveries = loadingDeliveries === webhook.webhookId;

        return (
          <div key={webhook.webhookId} className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden">
            {/* Webhook Row */}
            <button
              onClick={() => toggleExpand(webhook.webhookId)}
              className="w-full flex items-center gap-4 px-4 py-3.5 hover:bg-slate-50/80 dark:hover:bg-slate-800/30 transition-colors text-left"
            >
              <div className="flex-1 min-w-0 space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-[13px] font-semibold text-slate-800 dark:text-white truncate">{webhook.name}</span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                    webhook.status === 'ACTIVE'
                      ? 'bg-emerald-50 text-emerald-600 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20'
                      : 'bg-slate-100 text-slate-500 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700'
                  }`}>{webhook.status}</span>
                </div>
                <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
                  <ExternalLink size={11} />
                  <span className="font-mono truncate max-w-[280px]">{webhook.url}</span>
                </div>
              </div>

              <div className="w-40 shrink-0">
                <p className="text-[11px] text-slate-400 mb-1">{t('webhookMonitor.successRate')}</p>
                <SuccessRateBar rate={webhook.successRate} />
              </div>

              <div className="text-right text-[12px] shrink-0">
                <p className="text-slate-500">
                  <span className="font-semibold text-slate-700 dark:text-slate-300">{webhook.totalDeliveries}</span>{' '}
                  {t('webhookMonitor.total')}
                </p>
                {webhook.failedDeliveries > 0 && (
                  <p className="text-rose-500 font-semibold">{webhook.failedDeliveries} {t('webhookMonitor.failed')}</p>
                )}
              </div>

              <div className="text-slate-400 shrink-0">
                {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
              </div>
            </button>

            {/* Delivery Logs */}
            {isExpanded && (
              <div className="border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30">
                {isLoadingDeliveries ? (
                  <div className="flex items-center justify-center py-6">
                    <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                  </div>
                ) : wDeliveries.length === 0 ? (
                  <p className="text-center text-[12px] text-slate-400 py-6">{t('webhookMonitor.noDeliveries')}</p>
                ) : (
                  <table className="w-full text-[12px]">
                    <thead>
                      <tr className="text-[10px] uppercase tracking-wider border-b border-slate-100 dark:border-slate-800">
                        <th className="text-left px-4 py-2.5 font-semibold text-slate-400">{t('webhookMonitor.col.event')}</th>
                        <th className="text-left px-4 py-2.5 font-semibold text-slate-400">{t('webhookMonitor.col.status')}</th>
                        <th className="text-left px-4 py-2.5 font-semibold text-slate-400">{t('webhookMonitor.col.response')}</th>
                        <th className="text-left px-4 py-2.5 font-semibold text-slate-400">{t('webhookMonitor.col.duration')}</th>
                        <th className="text-left px-4 py-2.5 font-semibold text-slate-400">{t('webhookMonitor.col.time')}</th>
                        <th className="w-20" />
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
                      {wDeliveries.map((d) => {
                        const DIcon = DELIVERY_STATUS_ICON[d.status];
                        const dColor = DELIVERY_STATUS_COLOR[d.status];
                        return (
                          <tr key={d.id} className="hover:bg-white/60 dark:hover:bg-slate-800/30">
                            <td className="px-4 py-2.5 font-mono text-slate-600 dark:text-slate-300">{d.eventType}</td>
                            <td className="px-4 py-2.5">
                              <span className={`flex items-center gap-1 ${dColor}`}>
                                <DIcon size={12} />
                                {t(`webhookMonitor.deliveryStatus.${d.status}`)}
                              </span>
                            </td>
                            <td className="px-4 py-2.5 text-slate-500">
                              {d.responseCode ? (
                                <span className={d.responseCode >= 400 ? 'text-rose-500 font-bold' : 'text-emerald-600 dark:text-emerald-400'}>
                                  {d.responseCode}
                                </span>
                              ) : '—'}
                            </td>
                            <td className="px-4 py-2.5 text-slate-500">
                              {d.durationMs != null ? `${d.durationMs}ms` : '—'}
                            </td>
                            <td className="px-4 py-2.5 text-slate-400 whitespace-nowrap">
                              {new Date(d.createdAt).toLocaleString()}
                            </td>
                            <td className="px-4 py-2.5 text-right">
                              {d.status === 'FAILED' && (
                                <button
                                  onClick={() => handleResend(d.id, webhook.webhookId)}
                                  disabled={isPending}
                                  className="flex items-center gap-1 text-[11px] font-semibold text-primary hover:text-primary/80 transition-colors disabled:opacity-50 ml-auto"
                                >
                                  <RefreshCw size={11} />
                                  {t('webhookMonitor.resend')}
                                </button>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default WebhookMonitorTab;
