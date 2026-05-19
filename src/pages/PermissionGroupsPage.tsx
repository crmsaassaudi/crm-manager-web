import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Check,
  Layers,
  Pencil,
  Plus,
  Search,
  Trash2,
  Filter,
  ShieldCheck,
  Info,
} from 'lucide-react';
import * as api from '../api';
import { showToast } from '../App';
import Modal from '../shared/components/Modal';
import ConfirmationModal from '../shared/components/ConfirmationModal';

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
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Filters and search states for main page table
  const [groupSearch, setGroupSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<'ALL' | 'SYSTEM' | 'CUSTOM'>('ALL');

  // Modal form states
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedPermissions, setSelectedPermissions] = useState<Set<string>>(new Set());
  const [permissionSearch, setPermissionSearch] = useState('');

  // Delete modal states
  const [groupToDelete, setGroupToDelete] = useState<api.PermissionGroup | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const [catalogData, groupsData] = await Promise.all([
        api.fetchPermissionCatalog(),
        api.fetchPermissionGroups(),
      ]);
      setCatalog(catalogData);
      setGroups(groupsData);
    } catch (error) {
      console.error(error);
      showToast(t('permissionGroups.loadError', { defaultValue: 'Could not load permission data.' }), 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadData();
  }, []);

  // Filtered permission catalog in the Create/Edit modal
  const filteredCatalogPermissions = useMemo(() => {
    const query = permissionSearch.trim().toLowerCase();
    if (!query) return catalog.featurePermissions;
    return catalog.featurePermissions.filter((permission) =>
      permission.toLowerCase().includes(query)
    );
  }, [catalog.featurePermissions, permissionSearch]);

  const modalPermissionGroups = useMemo(
    () => groupPermissions(filteredCatalogPermissions),
    [filteredCatalogPermissions]
  );

  // Filtered groups in the main list table
  const filteredGroups = useMemo(() => {
    return groups.filter((group) => {
      const query = groupSearch.toLowerCase().trim();
      const matchesSearch =
        group.name.toLowerCase().includes(query) ||
        (group.description || '').toLowerCase().includes(query);

      const matchesType =
        typeFilter === 'ALL' ||
        (typeFilter === 'SYSTEM' && group.isSystem) ||
        (typeFilter === 'CUSTOM' && !group.isSystem);

      return matchesSearch && matchesType;
    });
  }, [groups, groupSearch, typeFilter]);

  const togglePermission = (permission: string) => {
    setSelectedPermissions((current) => {
      const next = new Set(current);
      if (next.has(permission)) next.delete(permission);
      else next.add(permission);
      return next;
    });
  };

  const openCreateModal = () => {
    setEditingId(null);
    setName('');
    setDescription('');
    setSelectedPermissions(new Set());
    setPermissionSearch('');
    setIsFormOpen(true);
  };

  const openEditModal = (group: api.PermissionGroup) => {
    setEditingId(group.id);
    setName(group.name);
    setDescription(group.description || '');
    setSelectedPermissions(new Set(group.permissions));
    setPermissionSearch('');
    setIsFormOpen(true);
  };

  const saveGroup = async () => {
    if (!name.trim()) return;
    setSaving(true);
    try {
      const payload = {
        name,
        description,
        permissions: Array.from(selectedPermissions),
      };
      if (editingId) {
        await api.updatePermissionGroup(editingId, payload);
        showToast(t('permissionGroups.groupUpdated'), 'success');
      } else {
        await api.createPermissionGroup(payload);
        showToast(t('permissionGroups.groupCreated'), 'success');
      }
      setIsFormOpen(false);
      await loadData();
    } catch (error: any) {
      showToast(
        error.response?.data?.message || t('permissionGroups.saveError'),
        'error'
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!groupToDelete) return;
    setSaving(true);
    try {
      await api.deletePermissionGroup(groupToDelete.id);
      showToast(t('permissionGroups.groupDeleted'), 'success');
      setGroupToDelete(null);
      await loadData();
    } catch (error: any) {
      showToast(
        error.response?.data?.message || t('permissionGroups.deleteError'),
        'error'
      );
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
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            {t('permissionGroups.title')}
          </h1>
          <p className="text-[13px] text-slate-500 font-medium mt-1">
            {t('permissionGroups.subtitle')}
          </p>
        </div>
        <button
          onClick={openCreateModal}
          className="flex items-center gap-2 rounded-xl bg-primary hover:bg-primary/95 px-4 py-2.5 text-[13px] font-bold text-white shadow-lg shadow-primary/20 transition-all active:scale-[0.98]"
        >
          <Plus size={16} />
          {t('permissionGroups.newGroup')}
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="flex items-center gap-3 w-full sm:w-auto flex-1 max-w-md">
          <div className="relative w-full">
            <Search
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              type="text"
              value={groupSearch}
              onChange={(e) => setGroupSearch(e.target.value)}
              placeholder={t('common.search', { defaultValue: 'Search...' })}
              className="w-full bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800 rounded-xl pl-10 pr-4 py-2 text-[13px] focus:ring-1 focus:ring-primary/30 outline-none shadow-sm text-slate-900 dark:text-white"
            />
          </div>
        </div>

        {/* Custom Segments Filter */}
        <div className="flex bg-slate-100 dark:bg-slate-800/40 p-1 rounded-xl w-full sm:w-auto overflow-x-auto">
          {(['ALL', 'SYSTEM', 'CUSTOM'] as const).map((filter) => (
            <button
              key={filter}
              onClick={() => setTypeFilter(filter)}
              className={`flex-1 sm:flex-none px-4 py-1.5 rounded-lg text-[12px] font-bold transition-all ${
                typeFilter === filter
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                  : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
              }`}
            >
              {filter === 'ALL'
                ? t('common.allStatus', { defaultValue: 'All Types' })
                : filter === 'SYSTEM'
                ? t('permissionGroups.system', { defaultValue: 'System' })
                : t('permissionGroups.custom', { defaultValue: 'Custom' })}
            </button>
          ))}
        </div>
      </div>

      {/* Main Groups Table */}
      <div className="bg-white dark:bg-[#0F172A] rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30">
                <th className="px-5 py-3.5 text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider w-[220px]">
                  {t('permissionGroups.groupName')}
                </th>
                <th className="px-5 py-3.5 text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                  {t('permissionGroups.description')}
                </th>
                <th className="px-5 py-3.5 text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider w-[180px]">
                  {t('common.permissions', { defaultValue: 'Permissions' })}
                </th>
                <th className="px-5 py-3.5 text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider w-[120px] text-right">
                  {t('tenants.table.actions', { defaultValue: 'Actions' })}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredGroups.map((group) => (
                <tr
                  key={group.id}
                  className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors group"
                >
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-primary/5 text-primary flex items-center justify-center shrink-0">
                        <Layers size={15} />
                      </div>
                      <div className="min-w-0">
                        <span className="block truncate text-[13px] font-bold text-slate-900 dark:text-white">
                          {group.name}
                        </span>
                        {group.isSystem && (
                          <span className="mt-1 inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-amber-50 dark:bg-amber-500/10 border border-amber-200/50 dark:border-amber-800/30 text-[9px] font-black uppercase text-amber-600 dark:text-amber-400 tracking-wider">
                            <ShieldCheck size={10} />
                            {t('permissionGroups.system')}
                          </span>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <p className="text-[12px] text-slate-500 dark:text-slate-400 line-clamp-2 max-w-xl">
                      {group.description || t('permissionGroups.noDescription')}
                    </p>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-2">
                      <span className="text-[12px] font-bold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-lg border border-slate-200/40 dark:border-slate-700/40 shadow-inner">
                        {group.permissions.length}
                      </span>
                      <span className="text-[11px] text-slate-400 dark:text-slate-500 font-semibold uppercase tracking-wider">
                        {t('permissions.available')}
                      </span>
                    </div>
                    {/* Tiny visual indicators of the permission scope */}
                    <div className="mt-1.5 flex flex-wrap gap-1 max-w-[200px]">
                      {group.permissions.slice(0, 4).map((p) => (
                        <span
                          key={p}
                          className="px-1 py-0.5 text-[9px] font-mono font-bold rounded bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 text-slate-400 dark:text-slate-500 truncate max-w-[80px]"
                        >
                          {p.split(':')[1] || p}
                        </span>
                      ))}
                      {group.permissions.length > 4 && (
                        <span className="px-1 py-0.5 text-[9px] font-black rounded bg-primary/5 text-primary">
                          +{group.permissions.length - 4}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-5 py-4 text-right">
                    <div className="flex items-center justify-end gap-2.5">
                      <button
                        onClick={() => openEditModal(group)}
                        className="h-8 w-8 rounded-lg border border-slate-200 text-slate-400 hover:text-slate-700 dark:border-slate-800 dark:text-slate-500 dark:hover:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center justify-center transition-colors"
                        title={t('permissionGroups.edit')}
                      >
                        <Pencil size={14} />
                      </button>
                      {!group.isSystem ? (
                        <button
                          onClick={() => setGroupToDelete(group)}
                          className="h-8 w-8 rounded-lg border border-rose-200 text-rose-400 hover:text-rose-600 dark:border-rose-900/60 dark:text-rose-500 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10 flex items-center justify-center transition-colors"
                          title={t('permissionGroups.delete')}
                        >
                          <Trash2 size={14} />
                        </button>
                      ) : (
                        <div className="w-8 h-8 flex items-center justify-center text-slate-300 dark:text-slate-700" title="System group cannot be deleted">
                          <Info size={14} />
                        </div>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Empty State */}
        {filteredGroups.length === 0 && (
          <div className="p-12 text-center">
            <div className="w-12 h-12 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-400 dark:text-slate-500">
              <Search size={22} />
            </div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-200 mb-1">
              {t('common.noResults')}
            </h3>
            <p className="text-slate-400 dark:text-slate-500 text-[12px] font-medium max-w-sm mx-auto">
              No permission groups match your current filters. Try adjusting your query or create a new one.
            </p>
          </div>
        )}
      </div>

      {/* Create/Edit Sheet Modal */}
      <Modal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        title={editingId ? t('permissionGroups.editGroup') : t('permissionGroups.createGroup')}
        size="lg"
        footer={
          <>
            <button
              onClick={() => setIsFormOpen(false)}
              className="px-4 py-2 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl text-[13px] font-bold text-slate-500 dark:text-slate-400 transition-colors"
            >
              {t('common.cancel')}
            </button>
            <button
              onClick={saveGroup}
              disabled={!name.trim() || saving}
              className="px-4 py-2 bg-primary text-white hover:bg-primary/95 rounded-xl text-[13px] font-bold disabled:opacity-50 transition-all flex items-center gap-1.5 shadow-lg shadow-primary/10"
            >
              {saving && (
                <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
              )}
              {t('permissionGroups.saveGroup')}
            </button>
          </>
        }
      >
        <div className="space-y-5">
          {/* Metadata Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                {t('permissionGroups.groupName')}
              </label>
              <input
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder={t('permissionGroups.groupName')}
                className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-[13px] outline-none focus:ring-1 focus:ring-primary/30 dark:border-slate-800 dark:bg-slate-900 text-slate-900 dark:text-white transition-all shadow-sm"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                {t('permissionGroups.description')}
              </label>
              <input
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                placeholder={t('permissionGroups.description')}
                className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-[13px] outline-none focus:ring-1 focus:ring-primary/30 dark:border-slate-800 dark:bg-slate-900 text-slate-900 dark:text-white transition-all shadow-sm"
              />
            </div>
          </div>

          <div className="border-t border-slate-100 dark:border-slate-800 pt-4 space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div>
                <h4 className="text-[13px] font-bold text-slate-800 dark:text-white">
                  {t('permissions.features')}
                </h4>
                <p className="text-[11px] text-slate-400 dark:text-slate-500">
                  Select feature modules bundled inside this permission group. ({selectedPermissions.size} selected)
                </p>
              </div>

              {/* Internal Permission Catalog Search */}
              <div className="relative w-full sm:w-60">
                <Search
                  size={14}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                />
                <input
                  value={permissionSearch}
                  onChange={(event) => setPermissionSearch(event.target.value)}
                  placeholder={t('permissionGroups.searchPermissions')}
                  className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800 rounded-xl py-1.5 pl-9 pr-3 text-[12px] outline-none focus:ring-1 focus:ring-primary/30 text-slate-900 dark:text-white transition-all"
                />
              </div>
            </div>

            {/* Scrollable grid of Permissions */}
            <div className="max-h-[350px] overflow-y-auto space-y-4 pr-2.5 scrollbar-thin">
              {Object.entries(modalPermissionGroups).map(([resource, permissions]) => (
                <div key={resource} className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-black uppercase tracking-wider text-primary bg-primary/5 px-2 py-0.5 rounded border border-primary/10">
                      {resource}
                    </span>
                    <div className="h-px bg-slate-100 dark:bg-slate-800/80 flex-1" />
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {permissions.map((permission) => {
                      const checked = selectedPermissions.has(permission);
                      return (
                        <button
                          key={permission}
                          type="button"
                          onClick={() => togglePermission(permission)}
                          className={`w-full rounded-xl border px-3.5 py-2.5 text-left text-[12px] font-bold transition-all flex items-center justify-between gap-3 shadow-sm ${
                            checked
                              ? 'border-primary bg-primary/5 text-primary dark:bg-primary/10'
                              : 'border-slate-200/60 bg-white text-slate-500 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:hover:bg-slate-800/80 dark:text-slate-400'
                          }`}
                        >
                          <span className="truncate font-mono text-[11px]">
                            {permission.split(':')[1] || permission}
                          </span>
                          {checked ? (
                            <div className="w-5 h-5 rounded-lg bg-primary text-white flex items-center justify-center shrink-0">
                              <Check size={12} />
                            </div>
                          ) : (
                            <div className="w-5 h-5 rounded-lg border border-slate-200 dark:border-slate-800 shrink-0" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}

              {Object.keys(modalPermissionGroups).length === 0 && (
                <div className="text-center py-8 text-slate-400 dark:text-slate-500">
                  <Filter size={20} className="mx-auto mb-2 text-slate-300 dark:text-slate-700" />
                  <span className="text-[12px] font-medium">No catalog permissions match your search query.</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </Modal>

      {/* Delete Confirmation Dialog */}
      <ConfirmationModal
        isOpen={groupToDelete !== null}
        onClose={() => setGroupToDelete(null)}
        onConfirm={handleDeleteConfirm}
        title={t('permissionGroups.deleteConfirm', { name: groupToDelete?.name || '' })}
        message={`Are you sure you want to delete the permission group "${groupToDelete?.name}"? This action will permanently remove the group from the catalog. Existing tenants will retain their current permissions, but the group can no longer be used as a template.`}
        confirmText={t('permissionGroups.delete')}
        cancelText={t('common.cancel')}
        type="danger"
        isConfirming={saving}
      />
    </div>
  );
};

export default PermissionGroupsPage;
