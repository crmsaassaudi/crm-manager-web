import { useCallback, useEffect, useMemo, useState, useRef } from 'react';
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

// ─── Searchable Tenant Select ─────────────────────────────────

const SearchableTenantSelect = ({
  tenants,
  value,
  onChange,
  placeholder,
}: {
  tenants: api.Tenant[];
  value: string;
  onChange: (val: string) => void;
  placeholder: string;
}) => {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [filterText, setFilterText] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const selectedTenant = tenants.find((t) => t.id === value || t._id === value);
  const filtered = tenants.filter(
    (t) =>
      t.name.toLowerCase().includes(filterText.toLowerCase()) ||
      t.alias.toLowerCase().includes(filterText.toLowerCase()),
  );

  return (
    <div className="relative w-52" ref={containerRef}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-1.5 text-[13px] text-slate-700 dark:text-slate-200 outline-none text-left focus:ring-1 focus:ring-primary/30"
      >
        <span className="truncate">{selectedTenant ? selectedTenant.name : placeholder}</span>
        <ChevronDown size={14} className="text-slate-400 shrink-0 ml-1" />
      </button>

      {open && (
        <div className="absolute left-0 mt-1.5 w-72 bg-white dark:bg-[#1E293B] border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl py-1 z-50">
          <div className="px-2 py-1.5 border-b border-slate-100 dark:border-slate-800">
            <input
              type="text"
              autoFocus
              value={filterText}
              onChange={(e) => setFilterText(e.target.value)}
              placeholder={t('audit.searchTenant')}
              className="w-full bg-slate-50 dark:bg-slate-900 rounded-lg px-2.5 py-1 text-[12px] text-slate-700 dark:text-slate-200 outline-none border border-slate-100 dark:border-slate-800 focus:ring-1 focus:ring-primary/20"
            />
          </div>
          <div className="max-h-48 overflow-y-auto p-1 space-y-0.5">
            <button
              type="button"
              onClick={() => {
                onChange('');
                setOpen(false);
                setFilterText('');
              }}
              className={`w-full text-left px-2.5 py-1.5 rounded-lg text-[12px] transition-colors ${
                !value ? 'text-primary font-semibold bg-primary/5' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/50'
              }`}
            >
              {t('audit.allTenants')}
            </button>
            {filtered.map((t) => {
              const id = t._id || t.id;
              const isSelected = value === id;
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => {
                    onChange(id);
                    setOpen(false);
                    setFilterText('');
                  }}
                  className={`w-full text-left px-2.5 py-1.5 rounded-lg text-[12px] transition-colors flex flex-col ${
                    isSelected ? 'text-primary font-semibold bg-primary/5' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                  }`}
                >
                  <span className="font-semibold truncate">{t.name}</span>
                  <span className="text-[10px] text-slate-400 font-mono tracking-tight truncate">
                    {t.alias}
                  </span>
                </button>
              );
            })}
            {filtered.length === 0 && (
              <p className="text-[11px] text-slate-400 italic text-center py-2">{t('audit.noTenantsFound')}</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

// ─── Searchable User Select ───────────────────────────────────

const SearchableUserSelect = ({
  users,
  value,
  onChange,
  placeholder,
}: {
  users: api.ManagerUser[];
  value: string;
  onChange: (val: string) => void;
  placeholder: string;
}) => {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [filterText, setFilterText] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const selectedUser = users.find((u) => u.id === value);
  const getDisplayName = (u: api.ManagerUser) => {
    return [u.firstName, u.lastName].filter(Boolean).join(' ') || u.email;
  };

  const filtered = users.filter(
    (u) =>
      getDisplayName(u).toLowerCase().includes(filterText.toLowerCase()) ||
      u.email.toLowerCase().includes(filterText.toLowerCase()),
  );

  return (
    <div className="relative w-52" ref={containerRef}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-1.5 text-[13px] text-slate-700 dark:text-slate-200 outline-none text-left focus:ring-1 focus:ring-primary/30"
      >
        <span className="truncate">{selectedUser ? getDisplayName(selectedUser) : placeholder}</span>
        <ChevronDown size={14} className="text-slate-400 shrink-0 ml-1" />
      </button>

      {open && (
        <div className="absolute left-0 mt-1.5 w-72 bg-white dark:bg-[#1E293B] border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl py-1 z-50">
          <div className="px-2 py-1.5 border-b border-slate-100 dark:border-slate-800">
            <input
              type="text"
              autoFocus
              value={filterText}
              onChange={(e) => setFilterText(e.target.value)}
              placeholder={t('audit.searchUser')}
              className="w-full bg-slate-50 dark:bg-slate-900 rounded-lg px-2.5 py-1 text-[12px] text-slate-700 dark:text-slate-200 outline-none border border-slate-100 dark:border-slate-800 focus:ring-1 focus:ring-primary/20"
            />
          </div>
          <div className="max-h-48 overflow-y-auto p-1 space-y-0.5">
            <button
              type="button"
              onClick={() => {
                onChange('');
                setOpen(false);
                setFilterText('');
              }}
              className={`w-full text-left px-2.5 py-1.5 rounded-lg text-[12px] transition-colors ${
                !value ? 'text-primary font-semibold bg-primary/5' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/50'
              }`}
            >
              {t('audit.allActors')}
            </button>
            {filtered.map((u) => {
              const isSelected = value === u.id;
              return (
                <button
                  key={u.id}
                  type="button"
                  onClick={() => {
                    onChange(u.id);
                    setOpen(false);
                    setFilterText('');
                  }}
                  className={`w-full text-left px-2.5 py-1.5 rounded-lg text-[12px] transition-colors flex flex-col ${
                    isSelected ? 'text-primary font-semibold bg-primary/5' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                  }`}
                >
                  <span className="font-semibold truncate">{getDisplayName(u)}</span>
                  <span className="text-[10px] text-slate-400 font-mono tracking-tight truncate">
                    {u.email}
                  </span>
                </button>
              );
            })}
            {filtered.length === 0 && (
              <p className="text-[11px] text-slate-400 italic text-center py-2">{t('audit.noUsersFound')}</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
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
    if (Array.isArray(v)) {
      if (v.length === 0) return '[]';
      return v.map((item) => (typeof item === 'string' ? item : JSON.stringify(item))).join(', ');
    }
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
                  className={`break-all ${changed ? 'text-rose-600 dark:text-rose-400 font-semibold' : 'text-slate-500'}`}
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
                  className={`break-all ${changed ? 'text-emerald-600 dark:text-emerald-400 font-semibold' : 'text-slate-500'}`}
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
          <p className="text-[14px] font-semibold text-slate-900 dark:text-slate-100">
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

        {/* Target Type */}
        <td className="px-4 py-3">
          <span className="inline-flex items-center rounded-md bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800/40 px-2.5 py-0.5 text-[11px] font-bold text-slate-500 dark:text-slate-400">
            {t(`audit.targetTypes.${entry.targetType}`, entry.targetType)}
          </span>
        </td>

        {/* Target */}
        <td className="px-4 py-3">
          <p className="text-[14px] font-semibold text-slate-900 dark:text-slate-100 truncate max-w-[180px]">
            {entry.targetName || '—'}
          </p>
          {entry.targetId && (
            <p className="text-[11px] font-mono text-slate-400 truncate max-w-[180px]" title={entry.targetId}>
              ID: {entry.targetId}
            </p>
          )}
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
              colSpan={6}
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

  // Lists for searchable comboboxes
  const [tenants, setTenants] = useState<api.Tenant[]>([]);
  const [users, setUsers] = useState<api.ManagerUser[]>([]);

  // Local filter states
  const [localAction, setLocalAction] = useState('');
  const [localTargetType, setLocalTargetType] = useState(searchParams.get('targetType') || '');
  const [localTargetId, setLocalTargetId] = useState(searchParams.get('targetId') || '');
  const [localActorId, setLocalActorId] = useState(searchParams.get('actorId') || '');
  const [localFrom, setLocalFrom] = useState('');
  const [localTo, setLocalTo] = useState('');
  const [localSearch, setLocalSearch] = useState('');

  // Active query parameters (passed to API, updated when "Search" is clicked)
  const [activeQuery, setActiveQuery] = useState({
    action: '',
    targetType: searchParams.get('targetType') || '',
    targetId: searchParams.get('targetId') || '',
    actorId: searchParams.get('actorId') || '',
    from: '',
    to: '',
    search: '',
  });

  const [page, setPage] = useState(1);

  // Load selection catalogs
  useEffect(() => {
    api.fetchTenants().then(setTenants).catch(console.error);
    api.fetchManagerUsers().then(setUsers).catch(console.error);
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const result = await api.fetchAuditLogs({
        action: activeQuery.action || undefined,
        targetType: activeQuery.targetType || undefined,
        targetId: activeQuery.targetId || undefined,
        actorId: activeQuery.actorId || undefined,
        from: activeQuery.from || undefined,
        to: activeQuery.to || undefined,
        page,
        limit: 50,
      });
      setData(result);
    } finally {
      setLoading(false);
    }
  }, [activeQuery, page]);

  useEffect(() => {
    void load();
  }, [load]);

  const handleSearch = () => {
    setActiveQuery({
      action: localAction,
      targetType: localTargetType,
      targetId: localTargetId,
      actorId: localActorId,
      from: localFrom,
      to: localTo,
      search: localSearch,
    });
    setPage(1);
  };

  const clearFilters = () => {
    setLocalAction('');
    setLocalTargetType('');
    setLocalTargetId('');
    setLocalActorId('');
    setLocalFrom('');
    setLocalTo('');
    setLocalSearch('');

    const resetQuery = {
      action: '',
      targetType: '',
      targetId: '',
      actorId: '',
      from: '',
      to: '',
      search: '',
    };
    setActiveQuery(resetQuery);
    setPage(1);
  };

  const hasActiveFilters = !!(
    activeQuery.action ||
    activeQuery.targetType ||
    activeQuery.targetId ||
    activeQuery.actorId ||
    activeQuery.from ||
    activeQuery.to ||
    activeQuery.search
  );

  const displayedItems = useMemo(() => {
    if (!data) return [];
    if (!activeQuery.search.trim()) return data.items;
    const q = activeQuery.search.trim().toLowerCase();
    return data.items.filter(
      (e) =>
        e.actorEmail.toLowerCase().includes(q) ||
        e.targetName.toLowerCase().includes(q) ||
        e.targetId.toLowerCase().includes(q),
    );
  }, [data, activeQuery.search]);

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
            value={localSearch}
            onChange={(e) => setLocalSearch(e.target.value)}
            placeholder={t('audit.searchPlaceholder')}
            className="pl-8 pr-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-[13px] outline-none focus:ring-1 focus:ring-primary/30 w-52 dark:text-slate-200"
          />
        </div>

        {/* Actor Select (Searchable) */}
        <SearchableUserSelect
          users={users}
          value={localActorId}
          onChange={setLocalActorId}
          placeholder={t('audit.selectActor')}
        />

        {/* Target Type select */}
        <select
          value={localTargetType}
          onChange={(e) => setLocalTargetType(e.target.value)}
          className={selectClass}
        >
          <option value="">{t('audit.targetTypes.ALL')}</option>
          {ALL_TARGET_TYPES.map((tt) => (
            <option key={tt} value={tt}>
              {t(`audit.targetTypes.${tt}`, tt)}
            </option>
          ))}
        </select>

        {/* Target Select (Searchable) */}
        <SearchableTenantSelect
          tenants={tenants}
          value={localTargetId}
          onChange={setLocalTargetId}
          placeholder={t('audit.selectTenant')}
        />

        {/* Action type select */}
        <select
          value={localAction}
          onChange={(e) => setLocalAction(e.target.value)}
          className={selectClass}
        >
          <option value="">{t('audit.allActions')}</option>
          {ALL_ACTIONS.map((a) => (
            <option key={a} value={a}>
              {t(`audit.actions.${a}`, ACTION_META[a]?.label ?? a)}
            </option>
          ))}
        </select>

        {/* Date range */}
        <div className="flex items-center gap-2">
          <input
            type="date"
            value={localFrom}
            onChange={(e) => setLocalFrom(e.target.value)}
            className={selectClass}
          />
          <span className="text-[12px] text-slate-400">→</span>
          <input
            type="date"
            value={localTo}
            onChange={(e) => setLocalTo(e.target.value)}
            className={selectClass}
          />
        </div>

        {/* Form control buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleSearch}
            className="flex items-center gap-1.5 rounded-lg px-4 py-1.5 text-[13px] font-semibold bg-primary text-white hover:bg-primary/90 transition-colors shadow-sm cursor-pointer"
          >
            <Search size={14} />
            {t('audit.searchButton')}
          </button>

          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[12px] font-semibold text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors border border-slate-200 dark:border-slate-700 cursor-pointer"
            >
              <FilterX size={13} />
              {t('audit.clear')}
            </button>
          )}
        </div>
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
                    {t('audit.targetType')}
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
