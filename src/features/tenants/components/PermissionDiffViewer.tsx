type Props = {
  groupPermissions: string[];
  tenantCurrentPermissions: string[];
};

const PermissionDiffViewer = ({ groupPermissions, tenantCurrentPermissions }: Props) => {
  const groupSet = new Set(groupPermissions);
  const tenantSet = new Set(tenantCurrentPermissions);

  const missingFromTenant = groupPermissions.filter(p => !tenantSet.has(p));
  const extraInTenant = tenantCurrentPermissions.filter(p => !groupSet.has(p));

  const missingSet = new Set(missingFromTenant);
  const extraSet = new Set(extraInTenant);

  const hasDiff = missingFromTenant.length > 0 || extraInTenant.length > 0;

  return (
    <div className="mt-3 rounded-lg border border-slate-200 dark:border-slate-700 overflow-hidden text-left">
      {/* Summary bar */}
      <div className="flex items-center gap-3 px-3 py-2 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700 text-[11px] font-bold">
        {extraInTenant.length > 0 && (
          <span className="text-emerald-600 dark:text-emerald-400">+{extraInTenant.length} thừa (extra)</span>
        )}
        {missingFromTenant.length > 0 && (
          <span className="text-rose-600 dark:text-rose-400">−{missingFromTenant.length} thiếu (missing)</span>
        )}
        {!hasDiff && (
          <span className="text-slate-500">Không có sự khác biệt</span>
        )}
      </div>

      {/* Two-column diff grid */}
      <div className="grid grid-cols-2 divide-x divide-slate-200 dark:divide-slate-700 max-h-52 overflow-y-auto">
        {/* Left: Group source-of-truth */}
        <div>
          <div className="px-3 py-1.5 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700 sticky top-0">
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Group gốc</p>
          </div>
          <div className="divide-y divide-slate-100 dark:divide-slate-800/50">
            {groupPermissions.map(perm => (
              <div
                key={perm}
                className={`px-3 py-1 text-[11px] font-mono ${
                  missingSet.has(perm)
                    ? 'bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-400'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                {missingSet.has(perm) ? '− ' : '  '}{perm}
              </div>
            ))}
          </div>
        </div>

        {/* Right: Tenant actual permissions */}
        <div>
          <div className="px-3 py-1.5 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700 sticky top-0">
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Tenant thực tế</p>
          </div>
          <div className="divide-y divide-slate-100 dark:divide-slate-800/50">
            {tenantCurrentPermissions.map(perm => (
              <div
                key={perm}
                className={`px-3 py-1 text-[11px] font-mono ${
                  extraSet.has(perm)
                    ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                {extraSet.has(perm) ? '+ ' : '  '}{perm}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PermissionDiffViewer;
