import { useState, useEffect, useTransition } from 'react';
import { useTranslation } from 'react-i18next';
import { DatabaseBackup, RotateCcw, CheckCircle, AlertTriangle, Loader2 } from 'lucide-react';
import * as api from '../../../api';
import type { BackupRecord } from '../../../api';
import { useToast } from '../../../shared/context/ToastContext';

interface Props {
  tenantId: string;
  tenantAlias: string;
}

const STATUS_ICON = {
  COMPLETED: CheckCircle,
  IN_PROGRESS: Loader2,
  FAILED: AlertTriangle,
};

const STATUS_COLOR = {
  COMPLETED: 'text-emerald-600 dark:text-emerald-400',
  IN_PROGRESS: 'text-blue-600 dark:text-blue-400',
  FAILED: 'text-rose-600 dark:text-rose-400',
};

const DISASTER_RECOVERY_ENABLED =
  import.meta.env.VITE_DISASTER_RECOVERY_FEATURE_ENABLED === 'true';

const formatBytes = (bytes: number) => {
  if (bytes === 0) return '—';
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const DisasterRecoveryTab = ({ tenantId, tenantAlias }: Props) => {
  const { t } = useTranslation();
  const { showToast } = useToast();
  const [isPending, startTransition] = useTransition();
  const [backups, setBackups] = useState<BackupRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [restoreTarget, setRestoreTarget] = useState<BackupRecord | null>(null);
  const [confirmAlias, setConfirmAlias] = useState('');
  const [restoring, setRestoring] = useState(false);

  const load = () => {
    api.fetchBackups(tenantId)
      .then(setBackups)
      .catch(() => showToast(t('disasterRecovery.loadError'), 'error'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, [tenantId]);

  const handleCreateBackup = () => {
    if (!DISASTER_RECOVERY_ENABLED) {
      showToast('Backup and restore are disabled until production snapshot storage is configured.', 'warning');
      return;
    }

    startTransition(async () => {
      try {
        await api.createBackup(tenantId);
        showToast(t('disasterRecovery.backupStarted'), 'success');
        // Poll once after 3.5s to catch the completed status
        setTimeout(() => {
          api.fetchBackups(tenantId).then(setBackups).catch(() => {});
        }, 3500);
        load();
      } catch (err: any) {
        showToast(err.response?.data?.message || t('disasterRecovery.createError'), 'error');
      }
    });
  };

  const handleRestore = async () => {
    if (!restoreTarget) return;
    if (!DISASTER_RECOVERY_ENABLED) {
      showToast('Backup and restore are disabled until production snapshot storage is configured.', 'warning');
      return;
    }
    if (confirmAlias !== tenantAlias) {
      showToast(t('disasterRecovery.aliasError'), 'error');
      return;
    }
    setRestoring(true);
    try {
      await api.restoreBackup(tenantId, restoreTarget.id, confirmAlias);
      showToast(t('disasterRecovery.restoreSuccess'), 'success');
      setRestoreTarget(null);
      setConfirmAlias('');
    } catch (err: any) {
      showToast(err.response?.data?.message || t('disasterRecovery.restoreError'), 'error');
    } finally {
      setRestoring(false);
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center h-40">
      <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="space-y-5">
      {/* Header Actions */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[13px] text-slate-500 dark:text-slate-400">
            {t('disasterRecovery.subtitle', { alias: tenantAlias })}
          </p>
        </div>
        <button
          onClick={handleCreateBackup}
          disabled={isPending || !DISASTER_RECOVERY_ENABLED}
          title={
            DISASTER_RECOVERY_ENABLED
              ? undefined
              : 'Disabled until production snapshot storage is configured'
          }
          className="flex items-center gap-2 px-4 py-2 bg-primary text-white text-[13px] font-semibold rounded-lg hover:bg-primary/90 disabled:opacity-50 transition-colors shadow-sm shadow-primary/20"
        >
          <DatabaseBackup size={14} />
          {isPending ? t('disasterRecovery.creating') : t('disasterRecovery.triggerBackup')}
        </button>
      </div>

      {!DISASTER_RECOVERY_ENABLED && (
        <div className="flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-amber-800 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-300">
          <AlertTriangle size={16} className="mt-0.5 shrink-0" />
          <div className="space-y-1">
            <p className="text-[13px] font-semibold">Backup and restore are disabled.</p>
            <p className="text-[12px]">
              Production snapshot storage and restore execution are not configured yet.
            </p>
          </div>
        </div>
      )}

      {/* Backups Table */}
      {backups.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-3">
            <DatabaseBackup size={20} className="text-slate-400" />
          </div>
          <p className="text-[13px] font-semibold text-slate-500">{t('disasterRecovery.noBackups')}</p>
          <p className="text-[12px] text-slate-400 mt-1">{t('disasterRecovery.noBackupsDesc')}</p>
        </div>
      ) : (
        <div className="rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
          <table className="w-full text-[13px]">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/50 text-[11px] uppercase tracking-wider">
                <th className="text-left px-4 py-3 font-semibold text-slate-500">{t('disasterRecovery.col.fileName')}</th>
                <th className="text-left px-4 py-3 font-semibold text-slate-500">{t('disasterRecovery.col.size')}</th>
                <th className="text-left px-4 py-3 font-semibold text-slate-500">{t('disasterRecovery.col.status')}</th>
                <th className="text-left px-4 py-3 font-semibold text-slate-500">{t('disasterRecovery.col.initiatedBy')}</th>
                <th className="text-left px-4 py-3 font-semibold text-slate-500">{t('disasterRecovery.col.date')}</th>
                <th className="w-16" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {backups.map((backup) => {
                const Icon = STATUS_ICON[backup.status];
                const color = STATUS_COLOR[backup.status];
                return (
                  <tr key={backup.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors">
                    <td className="px-4 py-3 font-mono text-[12px] text-slate-600 dark:text-slate-300 max-w-50 truncate">
                      {backup.fileName}
                    </td>
                    <td className="px-4 py-3 text-slate-500">{formatBytes(backup.sizeBytes)}</td>
                    <td className="px-4 py-3">
                      <span className={`flex items-center gap-1.5 ${color}`}>
                        <Icon size={13} className={backup.status === 'IN_PROGRESS' ? 'animate-spin' : ''} />
                        {t(`disasterRecovery.statusLabel.${backup.status}`)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-500 text-[12px]">{backup.initiatedBy}</td>
                    <td className="px-4 py-3 text-slate-500 text-[12px] whitespace-nowrap">
                      {new Date(backup.createdAt).toLocaleString()}
                    </td>
                    <td className="px-4 py-3">
                      {backup.status === 'COMPLETED' && (
                        <button
                          onClick={() => { setRestoreTarget(backup); setConfirmAlias(''); }}
                          disabled={!DISASTER_RECOVERY_ENABLED}
                          title={
                            DISASTER_RECOVERY_ENABLED
                              ? undefined
                              : 'Disabled until production restore execution is configured'
                          }
                          className="flex items-center gap-1 text-[12px] font-semibold text-amber-600 dark:text-amber-400 hover:text-amber-700 transition-colors disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          <RotateCcw size={12} />
                          {t('disasterRecovery.restore')}
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Dual-Auth Restore Modal */}
      {restoreTarget && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#0F172A] rounded-2xl border border-slate-200 dark:border-slate-700 shadow-2xl p-6 w-full max-w-md space-y-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-500/10 flex items-center justify-center">
                <RotateCcw size={18} className="text-amber-600 dark:text-amber-400" />
              </div>
              <div>
                <h2 className="text-[15px] font-bold text-slate-900 dark:text-white">{t('disasterRecovery.confirmTitle')}</h2>
                <p className="text-[12px] text-slate-500">{t('disasterRecovery.confirmSubtitle')}</p>
              </div>
            </div>

            <div className="bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 rounded-xl p-3">
              <p className="text-[12px] text-amber-700 dark:text-amber-400 font-medium">
                {t('disasterRecovery.confirmWarning', { fileName: restoreTarget.fileName, alias: tenantAlias })}
              </p>
            </div>

            <div className="space-y-2">
              <label className="text-[12px] font-semibold text-slate-600 dark:text-slate-400">
                {t('disasterRecovery.confirmTypeAlias')} <span className="font-mono text-slate-900 dark:text-white">{tenantAlias}</span>
              </label>
              <input
                type="text"
                value={confirmAlias}
                onChange={(e) => setConfirmAlias(e.target.value)}
                placeholder={tenantAlias}
                className="w-full px-3 py-2 text-[13px] bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-amber-400/30 focus:border-amber-400 outline-none font-mono"
              />
            </div>

            <div className="flex gap-2 pt-1">
              <button
                onClick={() => { setRestoreTarget(null); setConfirmAlias(''); }}
                className="flex-1 px-4 py-2 text-[13px] font-semibold text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors"
              >
                {t('common.cancel')}
              </button>
              <button
                onClick={handleRestore}
                disabled={restoring || confirmAlias !== tenantAlias}
                className="flex-1 px-4 py-2 text-[13px] font-semibold text-white bg-amber-500 hover:bg-amber-600 rounded-lg transition-colors disabled:opacity-50"
              >
                {restoring ? t('disasterRecovery.restoring') : t('disasterRecovery.confirmButton')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DisasterRecoveryTab;
