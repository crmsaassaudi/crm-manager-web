import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Check,
  Layers,
  Pencil,
  Plus,
  Save,
  Search,
  Trash2,
} from 'lucide-react';
import * as api from '../api';

type Catalog = {
  featurePermissions: string[];
  corePermissions: string[];
};

const groupPermissions = (permissions: string[]) =>
  permissions.reduce<Record<string, string[]>>((acc, permission) => {
    const [resource] = permission.split(':');
    acc[resource] = [...(acc[resource] || []), permission];
    return acc;
  }, {});

const PermissionGroupsPage = () => {
  const { t } = useTranslation();
  const [catalog, setCatalog] = useState<Catalog>({
    featurePermissions: [],
    corePermissions: [],
  });
  const [groups, setGroups] = useState<api.PermissionGroup[]>([]);
  const [tenants, setTenants] = useState<api.Tenant[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedPermissions, setSelectedPermissions] = useState<Set<string>>(
    new Set(),
  );
  const [selectedTenantIds, setSelectedTenantIds] = useState<Set<string>>(
    new Set(),
  );
  const [selectedGroupId, setSelectedGroupId] = useState('');
  const [applyMode, setApplyMode] = useState<'replace' | 'merge'>('replace');
  const [search, setSearch] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const [catalogData, groupsData, tenantsData] = await Promise.all([
        api.fetchPermissionCatalog(),
        api.fetchPermissionGroups(),
        api.fetchTenants(),
      ]);
      setCatalog(catalogData);
      setGroups(groupsData);
      setTenants(tenantsData);
      setSelectedGroupId(groupsData[0]?.id || '');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadData();
  }, []);

  const filteredPermissions = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return catalog.featurePermissions;
    return catalog.featurePermissions.filter((permission) =>
      permission.toLowerCase().includes(query),
    );
  }, [catalog.featurePermissions, search]);

  const permissionGroups = useMemo(
    () => groupPermissions(filteredPermissions),
    [filteredPermissions],
  );

  const selectedGroup = groups.find((group) => group.id === selectedGroupId);

  const togglePermission = (permission: string) => {
    setSelectedPermissions((current) => {
      const next = new Set(current);
      if (next.has(permission)) next.delete(permission);
      else next.add(permission);
      return next;
    });
  };

  const toggleTenant = (tenantId: string) => {
    setSelectedTenantIds((current) => {
      const next = new Set(current);
      if (next.has(tenantId)) next.delete(tenantId);
      else next.add(tenantId);
      return next;
    });
  };

  const resetForm = () => {
    setEditingId(null);
    setName('');
    setDescription('');
    setSelectedPermissions(new Set());
  };

  const editGroup = (group: api.PermissionGroup) => {
    setEditingId(group.id);
    setName(group.name);
    setDescription(group.description || '');
    setSelectedPermissions(new Set(group.permissions));
  };

  const saveGroup = async () => {
    setSaving(true);
    setMessage(null);
    try {
      const payload = {
        name,
        description,
        permissions: Array.from(selectedPermissions),
      };
      if (editingId) {
        await api.updatePermissionGroup(editingId, payload);
        setMessage(t('permissionGroups.groupUpdated'));
      } else {
        await api.createPermissionGroup(payload);
        setMessage(t('permissionGroups.groupCreated'));
      }
      resetForm();
      await loadData();
    } catch (error: any) {
      setMessage(error.response?.data?.message || t('permissionGroups.saveError'));
    } finally {
      setSaving(false);
    }
  };

  const removeGroup = async (group: api.PermissionGroup) => {
    if (!window.confirm(t('permissionGroups.deleteConfirm', { name: group.name }))) return;
    setSaving(true);
    setMessage(null);
    try {
      await api.deletePermissionGroup(group.id);
      setMessage(t('permissionGroups.groupDeleted'));
      await loadData();
    } catch (error: any) {
      setMessage(error.response?.data?.message || t('permissionGroups.deleteError'));
    } finally {
      setSaving(false);
    }
  };

  const applyGroup = async () => {
    if (!selectedGroupId || selectedTenantIds.size === 0) return;
    setSaving(true);
    setMessage(null);
    try {
      await api.applyPermissionGroupToTenants(selectedGroupId, {
        tenantIds: Array.from(selectedTenantIds),
        mode: applyMode,
      });
      setMessage(t('permissionGroups.applySuccess'));
      setSelectedTenantIds(new Set());
    } catch (error: any) {
      setMessage(error.response?.data?.message || t('permissionGroups.applyError'));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="h-64 flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            {t('permissionGroups.title')}
          </h1>
          <p className="text-[13px] text-slate-500 font-medium mt-1">
            {t('permissionGroups.subtitle')}
          </p>
        </div>
        {message && (
          <div className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-[12px] font-semibold text-slate-600 shadow-sm dark:border-slate-800 dark:bg-[#0F172A] dark:text-slate-300">
            {message}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_380px] gap-6">
        <section className="bg-white dark:bg-[#0F172A] rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                <Layers size={18} />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-900 dark:text-white">
                  {t('permissionGroups.savedGroups')}
                </h2>
                <p className="text-[12px] text-slate-500">
                  {t('permissionGroups.savedGroupsDesc', { count: groups.length })}
                </p>
              </div>
            </div>
            <button
              onClick={resetForm}
              className="flex items-center gap-2 rounded-lg bg-primary px-3 py-2 text-[12px] font-bold text-white shadow-sm"
            >
              <Plus size={15} />
              {t('permissionGroups.newGroup')}
            </button>
          </div>

          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {groups.map((group) => (
              <div
                key={group.id}
                className="p-5 flex flex-wrap items-start justify-between gap-4"
              >
                <div className="min-w-[240px] flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="text-[15px] font-bold text-slate-900 dark:text-white">
                      {group.name}
                    </h3>
                    {group.isSystem && (
                      <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-bold uppercase text-slate-500 dark:bg-slate-800">
                        {t('permissionGroups.system')}
                      </span>
                    )}
                  </div>
                  <p className="mt-1 text-[12px] text-slate-500">
                    {group.description || t('permissionGroups.noDescription')}
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {group.permissions.length === 0 ? (
                      <span className="rounded-md bg-slate-50 px-2 py-1 text-[11px] font-semibold text-slate-400 dark:bg-slate-900">
                        {t('permissionGroups.coreOnly')}
                      </span>
                    ) : (
                      group.permissions.slice(0, 8).map((permission) => (
                        <span
                          key={permission}
                          className="rounded-md bg-primary/5 px-2 py-1 text-[11px] font-semibold text-primary"
                        >
                          {permission}
                        </span>
                      ))
                    )}
                    {group.permissions.length > 8 && (
                      <span className="rounded-md bg-slate-50 px-2 py-1 text-[11px] font-semibold text-slate-400 dark:bg-slate-900">
                        +{group.permissions.length - 8}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => editGroup(group)}
                    className="h-9 w-9 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-800 flex items-center justify-center"
                    title={t('permissionGroups.edit')}
                  >
                    <Pencil size={15} />
                  </button>
                  {!group.isSystem && (
                    <button
                      onClick={() => void removeGroup(group)}
                      className="h-9 w-9 rounded-lg border border-rose-200 text-rose-500 hover:bg-rose-50 dark:border-rose-900/60 dark:hover:bg-rose-500/10 flex items-center justify-center"
                      title={t('permissionGroups.delete')}
                    >
                      <Trash2 size={15} />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>

        <aside className="space-y-6">
          <section className="bg-white dark:bg-[#0F172A] rounded-xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm">
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              {editingId ? t('permissionGroups.editGroup') : t('permissionGroups.createGroup')}
            </h2>
            <div className="mt-4 space-y-3">
              <input
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder={t('permissionGroups.groupName')}
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-[13px] outline-none focus:ring-1 focus:ring-primary/30 dark:border-slate-800 dark:bg-slate-900"
              />
              <textarea
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                placeholder={t('permissionGroups.description')}
                rows={3}
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-[13px] outline-none focus:ring-1 focus:ring-primary/30 dark:border-slate-800 dark:bg-slate-900"
              />
              <div className="relative">
                <Search
                  size={15}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                />
                <input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder={t('permissionGroups.searchPermissions')}
                  className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-9 pr-3 text-[13px] outline-none focus:ring-1 focus:ring-primary/30 dark:border-slate-800 dark:bg-slate-900"
                />
              </div>

              <div className="max-h-[320px] overflow-y-auto space-y-3 pr-1">
                {Object.entries(permissionGroups).map(([resource, permissions]) => (
                  <div key={resource}>
                    <p className="mb-2 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                      {resource}
                    </p>
                    <div className="space-y-2">
                      {permissions.map((permission) => {
                        const checked = selectedPermissions.has(permission);
                        return (
                          <button
                            key={permission}
                            type="button"
                            onClick={() => togglePermission(permission)}
                            className={`w-full min-h-10 rounded-lg border px-3 py-2 text-left text-[12px] font-semibold transition-colors flex items-center justify-between gap-3 ${
                              checked
                                ? 'border-primary/30 bg-primary/5 text-primary'
                                : 'border-slate-200 bg-white text-slate-500 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:hover:bg-slate-800'
                            }`}
                          >
                            <span>{permission}</span>
                            {checked && <Check size={14} />}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>

              <button
                onClick={() => void saveGroup()}
                disabled={!name.trim() || saving}
                className="w-full h-10 rounded-lg bg-primary text-white text-[13px] font-bold disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <Save size={15} />
                {saving ? t('permissionGroups.saving') : t('permissionGroups.saveGroup')}
              </button>
            </div>
          </section>

          <section className="bg-white dark:bg-[#0F172A] rounded-xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm">
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              {t('permissionGroups.applyToTenants')}
            </h2>
            <div className="mt-4 space-y-3">
              <select
                value={selectedGroupId}
                onChange={(event) => setSelectedGroupId(event.target.value)}
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-[13px] dark:border-slate-800 dark:bg-slate-900"
              >
                {groups.map((group) => (
                  <option key={group.id} value={group.id}>
                    {group.name}
                  </option>
                ))}
              </select>
              <div className="grid grid-cols-2 gap-2">
                {(['replace', 'merge'] as const).map((mode) => (
                  <button
                    key={mode}
                    onClick={() => setApplyMode(mode)}
                    className={`h-9 rounded-lg border text-[12px] font-bold capitalize ${
                      applyMode === mode
                        ? 'border-primary bg-primary/10 text-primary'
                        : 'border-slate-200 text-slate-500 dark:border-slate-800'
                    }`}
                  >
                    {mode === 'replace' ? t('permissionGroups.replace') : t('permissionGroups.merge')}
                  </button>
                ))}
              </div>
              <div className="max-h-[220px] overflow-y-auto rounded-lg border border-slate-200 dark:border-slate-800">
                {tenants.map((tenant) => (
                  <label
                    key={tenant.id}
                    className="flex items-center gap-3 border-b border-slate-100 px-3 py-2 last:border-b-0 dark:border-slate-800"
                  >
                    <input
                      type="checkbox"
                      checked={selectedTenantIds.has(tenant.id)}
                      onChange={() => toggleTenant(tenant.id)}
                    />
                    <span className="min-w-0">
                      <span className="block truncate text-[13px] font-bold text-slate-800 dark:text-slate-100">
                        {tenant.name}
                      </span>
                      <span className="block truncate text-[11px] text-slate-400">
                        {tenant.alias}
                      </span>
                    </span>
                  </label>
                ))}
              </div>
              <button
                onClick={() => void applyGroup()}
                disabled={!selectedGroup || selectedTenantIds.size === 0 || saving}
                className="w-full h-10 rounded-lg bg-slate-900 text-white text-[13px] font-bold disabled:opacity-50 dark:bg-white dark:text-slate-900"
              >
                {t('permissionGroups.applySelected')}
              </button>
            </div>
          </section>
        </aside>
      </div>
    </div>
  );
};

export default PermissionGroupsPage;
