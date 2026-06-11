import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import {
  Users,
  Building2,
  HardDrive,
  Activity,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
} from 'lucide-react';
import * as api from '../api';
import type { DashboardStats } from '../api';
import { motion } from 'framer-motion';
import { formatDistanceToNow } from 'date-fns';
import { vi, enUS } from 'date-fns/locale';

const DashboardPage = () => {
  const { t, i18n } = useTranslation();
  const dateFnsLocale = i18n.language === 'vi' ? vi : enUS;

  const { data: stats, isLoading } = useQuery<DashboardStats>({
    queryKey: ['dashboardStats'],
    queryFn: api.fetchDashboardStats,
    staleTime: 1000 * 60 * 5,
  });

  const formatTrend = (value: number | null | undefined) => {
    if (value == null) return null;
    const sign = value > 0 ? '+' : '';
    return `${sign}${value}%`;
  };

  const metrics = [
    {
      label: t('dashboard.totalTenants'),
      value: stats?.totalTenants ?? 0,
      icon: Building2,
      trend: formatTrend(stats?.trends?.tenantsTrend),
      isUp: (stats?.trends?.tenantsTrend ?? 0) >= 0,
      color: 'text-blue-600 dark:text-blue-400',
      bg: 'bg-blue-50 dark:bg-blue-900/20',
    },
    {
      label: t('dashboard.activeUsers'),
      value: stats?.activeUsers ?? 0,
      icon: Users,
      trend: formatTrend(stats?.trends?.usersTrend),
      isUp: (stats?.trends?.usersTrend ?? 0) >= 0,
      color: 'text-emerald-600 dark:text-emerald-400',
      bg: 'bg-emerald-50 dark:bg-emerald-900/20',
    },
    {
      label: t('dashboard.storageUsage'),
      value: `${(((stats?.totalStorageUsedMB) ?? 0) / 1024).toFixed(1)} GB`,
      icon: HardDrive,
      trend: formatTrend(stats?.trends?.storageTrend),
      isUp: (stats?.trends?.storageTrend ?? 0) <= 0, // lower storage growth is good
      color: 'text-amber-600 dark:text-amber-400',
      bg: 'bg-amber-50 dark:bg-amber-900/20',
    },
    {
      label: t('dashboard.systemHealth'),
      value: stats?.systemHealth === 'HEALTHY' ? t('dashboard.trendOptimal') : (stats?.systemHealth ?? '—'),
      icon: Activity,
      trend: null,
      isUp: true,
      color: 'text-indigo-600 dark:text-indigo-400',
      bg: 'bg-indigo-50 dark:bg-indigo-900/20',
    },
  ];

  if (isLoading) return (
    <div className="h-64 flex items-center justify-center">
      <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
    </div>
  );

  const consumers = stats?.topStorageConsumers ?? [];
  const activities = stats?.recentActivity ?? [];

  const getProgressColor = (usedMB: number, limitMB: number) => {
    const ratio = limitMB > 0 ? usedMB / limitMB : 0;
    if (ratio >= 0.9) return 'bg-rose-500';
    if (ratio >= 0.7) return 'bg-amber-500';
    return 'bg-primary';
  };

  const getActivityColor = (action: string) => {
    if (action.includes('CREATED') || action.includes('GRANTED'))
      return 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400';
    if (action.includes('SUSPEND') || action.includes('REVOKED') || action.includes('DELETED'))
      return 'bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400';
    return 'bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400';
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-page-title">{t('dashboard.title')}</h1>
        <p className="text-page-subtitle">{t('dashboard.subtitle')}</p>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {metrics.map((m, i) => (
          <motion.div
            key={m.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="bg-white dark:bg-[#0F172A] p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-shadow"
          >
            <div className="flex items-center justify-between mb-4">
              <div className={`p-2.5 rounded-lg ${m.bg} ${m.color}`}>
                <m.icon size={20} />
              </div>
              {m.trend != null && (
                <div className={`flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full ${m.isUp ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400' : 'bg-rose-50 text-rose-600 dark:bg-rose-500/10 dark:text-rose-400'}`}>
                  {m.isUp ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
                  {m.trend}
                </div>
              )}
              {m.trend == null && (
                <div className="flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-slate-50 text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                  <Minus size={12} />
                </div>
              )}
            </div>
            <div>
              <p className="text-[12px] font-semibold text-slate-500 uppercase tracking-wider mb-1">{m.label}</p>
              <h3 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">{m.value}</h3>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Storage Monitor */}
        <div className="lg:col-span-2 bg-white dark:bg-[#0F172A] rounded-xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2 uppercase tracking-wide">
              <HardDrive size={18} className="text-primary" />
              {t('dashboard.topConsumers')}
            </h3>
            <Link
              to="/tenants"
              className="text-[12px] font-bold text-primary hover:bg-primary/5 px-3 py-1.5 rounded-lg transition-colors uppercase"
            >
              {t('dashboard.viewAll')}
            </Link>
          </div>
          {consumers.length === 0 ? (
            <div className="text-center py-8 text-sm text-muted-foreground">
              {t('dashboard.noStorageData')}
            </div>
          ) : (
            <div className="space-y-5">
              {consumers.map((tenant) => (
                <div key={tenant.tenantId} className="space-y-2">
                  <div className="flex justify-between text-[13px] font-semibold">
                    <span className="text-slate-700 dark:text-slate-300">{tenant.name}</span>
                    <span className="text-slate-500 font-medium">
                      {(tenant.usedMB / 1024).toFixed(1)} GB / {(tenant.limitMB / 1024).toFixed(1)} GB
                    </span>
                  </div>
                  <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{
                        width: `${Math.min((tenant.usedMB / Math.max(tenant.limitMB, 1)) * 100, 100)}%`,
                      }}
                      transition={{ duration: 1, ease: 'easeOut' }}
                      className={`h-full ${getProgressColor(tenant.usedMB, tenant.limitMB)} shadow-sm`}
                    ></motion.div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Activity */}
        <div className="bg-white dark:bg-[#0F172A] rounded-xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2 uppercase tracking-wide">
              <Activity size={18} className="text-primary" />
              {t('dashboard.recentActivity')}
            </h3>
          </div>
          {activities.length === 0 ? (
            <div className="text-center py-8 text-sm text-muted-foreground">
              {t('dashboard.noActivity')}
            </div>
          ) : (
            <div className="space-y-5">
              {activities.map((item, i) => (
                <div key={i} className="flex gap-4">
                  <div
                    className={`w-6 h-6 rounded-lg shrink-0 flex items-center justify-center ${getActivityColor(item.action)}`}
                  >
                    <div className="w-1.5 h-1.5 rounded-full bg-current"></div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] leading-relaxed text-slate-600 dark:text-slate-400">
                      <span className="font-bold text-slate-900 dark:text-slate-200">
                        {item.actorEmail?.split('@')[0] ?? '—'}
                      </span>{' '}
                      {t(`audit.actions.${item.action}`, { defaultValue: item.action })}{' '}
                      <span className="font-bold text-slate-900 dark:text-slate-200">
                        {item.targetName}
                      </span>
                    </p>
                    <p className="text-[11px] text-slate-400 font-medium mt-0.5">
                      {item.createdAt
                        ? formatDistanceToNow(new Date(item.createdAt), {
                            addSuffix: true,
                            locale: dateFnsLocale,
                          })
                        : '—'}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
