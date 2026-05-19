import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Activity,
  ChevronDown,
  ChevronRight,
  FilterX,
  Loader2,
  Monitor,
  Search,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import * as api from '../api';

// ─── Constants ───────────────────────────────────────────────

const ALL_ACTIONS = [
  'TENANT_CREATED',
  'TENANT_STATUS_CHANGED',
  'TENANT_SUBSCRIPTION_CHANGED',
  'TENANT_PERMISSIONS_GRANTED',
  'TENANT_PERMISSIONS_REVOKED',
  'TENANT_CORE_PERMISSIONS_CHANGED',
  'MANAGER_USER_CREATED',
  'MANAGER_USER_STATUS_CHANGED',
  'PERMISSION_GROUP_CREATED',
  'PERMISSION_GROUP_UPDATED',
  'PERMISSION_GROUP_DELETED',
  'PERMISSION_GROUP_APPLIED',
] as const;

const ALL_TARGET_TYPES = ['TENANT', 'MANAGER_USER', 'PERMISSION_GROUP'] as const;

const ACTION_META: Record<
  string,
  { label: string; color: string }
> = {
  TENANT_CREATED:                { label: 'Tenant Created',            color: 'bg-primary/10 text-primary' },
  TENANT_STATUS_CHANGED:         { label: 'Status Changed',            color: 'bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400' },
  TENANT_SUBSCRIPTION_CHANGED:   { label: 'Subscription Changed',      color: 'bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400' },
  TENANT_PERMISSIONS_GRANTED:    { label: 'Permissions Granted',       color: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400' },
  TENANT_PERMISSIONS_REVOKED:    { label: 'Permissions Revoked',       color: 'bg-rose-50 text-rose-600 dark:bg-rose-500/10 dark:text-rose-400' },
  TENANT_CORE_PERMISSIONS_CHANGED:{ label: 'Core Perms Changed',       color: 'bg-orange-50 text-orange-600 dark:bg-orange-500/10 dark:text-orange-400' },
  MANAGER_USER_CREATED:          { label: 'Manager Created',           color: 'bg-primary/10 text-primary' },
  MANAGER_USER_STATUS_CHANGED:   { label: 'Manager Status Changed',    color: 'bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400' },
  PERMISSION_GROUP_CREATED:      { label: 'Group Created',             color: 'bg-primary/10 text-primary' },
  PERMISSION_GROUP_UPDATED:      { label: 'Group Updated',             color: 'bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400' },
  PERMISSION_GROUP_DELETED:      { label: 'Group Deleted',             color: 'bg-rose-50 text-rose-600 dark:bg-rose-500/10 dark:text-rose-400' },
  PERMISSION_GROUP_APPLIED:      { label: 'Group Applied',             color: 'bg-violet-50 text-violet-600 dark:bg-violet-500/10 dark:text-violet-400' },
};

// ─── Delta Display ────────────────────────────────────────────

const DeltaDisplay = ({
  before,
  after,
}: {
  before: Record<string, unknown>;
  after: Record<string, unknown>;
}) => {
  const { t } = useTranslation();
  const safeBefore = before || {};
  const safeAfter = after || {};

  const allKeys = Array.from(
    new Set([...Object.keys(safeBefore), ...Object.keys(safeAfter)]),
  );

  if (allKeys.length === 0) {
    return (
      <p className="text-[12px] text-slate-400 italic px-2">{t('audit.noDelta')}</p>
    );
  }

  const fmt = (v: unknown) => {
    if (v === undefined || v === null) return '—';
    if (Array.isArray(v)) return `[${(v as unknown[]).length} items]`;
    return String(JSON.stringify(v)).replace(/^"|"$/g, '');
  };

  return (
    <div className="grid grid-cols-2 gap-3">
      {/* Before */}
      <div>
        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
          {t('audit.before')}
        </p>
        <div className="space-y-0.5">
          {allKeys.map((key) => {
            const changed =
              JSON.stringify(safeBefore[key]) !== JSON.stringify(safeAfter[key]);
            return (
              <div
                key={key}
                className={`font-mono text-[11px] rounded px-2 py-1 flex gap-1.5 ${
                  changed
                    ? 'bg-rose-50 dark:bg-rose-500/10'
                    : 'bg-slate-50 dark:bg-slate-800/40'
                }`}
              >
                <span className="text-slate-400 shrink-0">{key}:</span>
                <span
                  className={`truncate ${changed ? 'text-rose-600 dark:text-rose-400 font-semibold' : 'text-slate-500'}`}
                >
                  {fmt(safeBefore[key])}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* After */}
      <div>
        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
          {t('audit.after')}
        </p>
        <div className="space-y-0.5">
          {allKeys.map((key) => {
            const changed =
              JSON.stringify(safeBefore[key]) !== JSON.stringify(safeAfter[key]);
            return (
              <div
                key={key}
                className={`font-mono text-[11px] rounded px-2 py-1 flex gap-1.5 ${
                  changed
                    ? 'bg-emerald-50 dark:bg-emerald-500/10'
                    : 'bg-slate-50 dark:bg-slate-800/40'
                }`}
              >
                <span className="text-slate-400 shrink-0">{key}:</span>
                <span
                  className={`truncate ${changed ? 'text-emerald-600 dark:text-emerald-400 font-semibold' : 'text-slate-500'}`}
                >
                  {fmt(safeAfter[key])}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

// ─── Audit Row ────────────────────────────────────────────────

const AuditRow = ({ entry }: { entry: api.AuditLog }) => {
  const { t } = useTranslation();
  const [expanded, setExpanded] = useState(false);
  const meta = ACTION_META[entry.action] ?? {
    label: entry.action,
    color: 'bg-slate-100 text-slate-500',
  };

  const formattedTime = new Date(entry.createdAt).toLocaleString('en-GB', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });

  const hasDelta =
    Object.keys(entry.before || {}).length > 0 ||
    Object.keys(entry.after || {}).length > 0;

  return (
    <>
      <tr
        className={`border-b border-slate-100 dark:border-slate-800 transition-colors ${
          hasDelta
            ? 'cursor-pointer hover:bg-slate-50/70 dark:hover:bg-slate-800/30'
            : ''
        }`}
        onClick={() => hasDelta && setExpanded((v) => !v)}
      >
        {/* Time */}
        <td className="px-4 py-3 whitespace-nowrap">
          <span className="text-[12px] font-mono text-slate-500">
            {formattedTime}
          </span>
        </td>

        {/* Actor */}
        <td className="px-4 py-3">
          <p className="text-[14px] font-bold text-slate-900 dark:text-slate-100">
            {entry.actorEmail}
          </p>
          <p className="text-[12px] font-mono text-slate-400">{entry.actorIp || '—'}</p>
        </td>

        {/* Action */}
        <td className="px-4 py-3">
          <span
            className={`inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-bold ${meta.color}`}
          >
            {t(`audit.actions.${entry.action}`, meta.label)}
          </span>
        </td>

        {/* Target */}
        <td className="px-4 py-3">
          <p className="text-[14px] font-bold text-slate-900 dark:text-slate-100 truncate max-w-[160px]">
            {entry.targetName || entry.targetId}
          </p>
          <p className="text-[12px] text-slate-400">{entry.targetType}</p>
        </td>

        {/* Expand toggle */}
        <td className="px-4 py-3 text-right w-10">
          {hasDelta && (
            <span className="text-slate-400">
              {expanded ? (
                <ChevronDown size={15} />
              ) : (
                <ChevronRight size={15} />
              )}
            </span>
          )}
        </td>
      </tr>

      {/* Expanded delta */}
      <AnimatePresence>
        {expanded && (
          <tr>
            <td
              colSpan={5}
              className="px-4 pb-3 pt-0 bg-slate-50/50 dark:bg-slate-800/20 border-b border-slate-100 dark:border-slate-800"
            >
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden"
              >
                <div className="pt-3">
                  <DeltaDisplay before={entry.before} after={entry.after} />
                  {entry.actorUserAgent && (
                    <p className="mt-2 text-[10px] text-slate-400 font-mono flex items-center gap-1">
                      <Monitor size={11} />
                      {entry.actorUserAgent}
                    </p>
                  )}
                </div>
              </motion.div>
            </td>
          </tr>
        )}
      </AnimatePresence>
    </>
  );
};

// ─── Main Page ────────────────────────────────────────────────

const AuditLogPage = () => {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();

  const [data, setData] = useState<api.AuditLogListResponse | null>(null);
  const [loading, setLoading] = useState(true);

  // Server-side filters
  const [action, setAction] = useState('');
  const [targetType, setTargetType] = useState(searchParams.get('targetType') || '');
  const [targetId, setTargetId] = useState(searchParams.get('targetId') || '');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [page, setPage] = useState(1);

  // Client-side text search (actor email + target name)
  const [search, setSearch] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const result = await api.fetchAuditLogs({
        action: action || undefined,
        targetType: targetType || undefined,
        targetId: targetId || undefined,
        from: from || undefined,
        to: to || undefined,
        page,
        limit: 50,
      });
      setData(result);
    } finally {
      setLoading(false);
    }
  }, [action, targetType, targetId, from, to, page]);

  useEffect(() => {
    void load();
  }, [load]);

  const clearFilters = () => {
    setAction('');
    setTargetType('');
    setTargetId('');
    setFrom('');
    setTo('');
    setSearch('');
    setPage(1);
  };

  const hasActiveFilters = !!(action || targetType || targetId || from || to || search);

  const displayedItems = useMemo(() => {
    if (!data) return [];
    if (!search.trim()) return data.items;
    const q = search.trim().toLowerCase();
    return data.items.filter(
      (e) =>
        e.actorEmail.toLowerCase().includes(q) ||
        e.targetName.toLowerCase().includes(q) ||
        e.targetId.toLowerCase().includes(q),
    );
  }, [data, search]);

  const selectClass =
    'rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-1.5 text-[13px] text-slate-700 dark:text-slate-200 outline-none focus:ring-1 focus:ring-primary/30';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            {t('audit.title')}
          </h1>
          <p className="text-[13px] text-slate-500 font-medium mt-1">
            {t('audit.subtitle')}
          </p>
        </div>

        {data && (
          <div className="flex items-center gap-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0F172A] px-4 py-2 shadow-sm">
            <Activity size={15} className="text-primary" />
            <span className="text-[13px] font-bold text-slate-700 dark:text-slate-200">
              {data.total.toLocaleString()}
            </span>
            <span className="text-[12px] text-slate-400">{t('audit.entries')}</span>
          </div>
        )}
      </div>

      {/* Filter bar */}
      <div className="flex flex-wrap gap-3 items-center bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-sm">
        {/* Text search */}
        <div className="relative">
          <Search
            size={14}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
          />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t('audit.searchPlaceholder')}
            className="pl-8 pr-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-[13px] outline-none focus:ring-1 focus:ring-primary/30 w-52 dark:text-slate-200"
          />
        </div>

        {/* Action type */}
        <select
          value={action}
          onChange={(e) => { setAction(e.target.value); setPage(1); }}
          className={selectClass}
        >
          <option value="">{t('audit.allActions')}</option>
          {ALL_ACTIONS.map((a) => (
            <option key={a} value={a}>
              {t(`audit.actions.${a}`, ACTION_META[a]?.label ?? a)}
            </option>
          ))}
        </select>

        {/* Target type */}
        <select
          value={targetType}
          onChange={(e) => { setTargetType(e.target.value); setPage(1); }}
          className={selectClass}
        >
          <option value="">{t('audit.allTypes')}</option>
          {ALL_TARGET_TYPES.map((tt) => (
            <option key={tt} value={tt}>{tt}</option>
          ))}
        </select>

        {/* Date range */}
        <div className="flex items-center gap-2">
          <input
            type="date"
            value={from}
            onChange={(e) => { setFrom(e.target.value); setPage(1); }}
            className={selectClass}
          />
          <span className="text-[12px] text-slate-400">→</span>
          <input
            type="date"
            value={to}
            onChange={(e) => { setTo(e.target.value); setPage(1); }}
            className={selectClass}
          />
        </div>

        {hasActiveFilters && (
          <button
            onClick={clearFilters}
            className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[12px] font-semibold text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors border border-slate-200 dark:border-slate-700"
          >
            <FilterX size={13} />
            {t('audit.clear')}
          </button>
        )}
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-[#0F172A] rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        {loading ? (
          <div className="h-64 flex items-center justify-center">
            <Loader2 size={22} className="animate-spin text-primary" />
          </div>
        ) : displayedItems.length === 0 ? (
          <div className="h-64 flex flex-col items-center justify-center gap-2 text-slate-400">
            <Activity size={28} className="opacity-30" />
            <p className="text-[13px] font-semibold">{t('audit.noEntries')}</p>
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="text-[12px] text-primary hover:underline"
              >
                {t('audit.clearFilters')}
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-50/70 dark:bg-slate-800/30 border-b border-slate-100 dark:border-slate-800">
                <tr>
                  <th className="px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-slate-500 whitespace-nowrap">
                    {t('audit.time')}
                  </th>
                  <th className="px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                    {t('audit.actorIp')}
                  </th>
                  <th className="px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                    {t('audit.action')}
                  </th>
                  <th className="px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                    {t('audit.target')}
                  </th>
                  <th className="px-4 py-3 w-8" />
                </tr>
              </thead>
              <tbody>
                {displayedItems.map((entry) => (
                  <AuditRow key={entry.id} entry={entry} />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {data && data.totalPages > 1 && (
        <div className="flex items-center justify-between text-[13px]">
          <span className="text-slate-500">
            {t('audit.showingEntries', {
              from: (page - 1) * 50 + 1,
              to: Math.min(page * 50, data.total),
              total: data.total.toLocaleString(),
            })}
          </span>
          <div className="flex items-center gap-1">
            <button
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
              className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors font-medium"
            >
              {t('audit.prev')}
            </button>

            {Array.from({ length: Math.min(data.totalPages, 7) }, (_, i) => {
              const p = i + 1;
              return (
                <button
                  key={p}
                  onClick={() => setPage(p)}
                  className={`w-8 h-8 rounded-lg text-[13px] font-semibold transition-colors ${
                    p === page
                      ? 'bg-primary text-white'
                      : 'border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                  }`}
                >
                  {p}
                </button>
              );
            })}

            {data.totalPages > 7 && (
              <span className="text-slate-400 px-1">…</span>
            )}

            <button
              disabled={page >= data.totalPages}
              onClick={() => setPage((p) => p + 1)}
              className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors font-medium"
            >
              {t('audit.next')}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AuditLogPage;
