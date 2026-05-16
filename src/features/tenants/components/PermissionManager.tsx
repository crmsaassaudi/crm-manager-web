import { useState, useMemo } from 'react';
import { 
  Shield, 
  Search, 
  Check, 
  Zap, 
  ChevronDown, 
  ChevronUp,
  RotateCcw,
  Save,
  Layers
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface PermissionManagerProps {
  corePermissions: string[];
  featurePermissions: string[];
  grantedPermissions: Set<string>;
  onToggle: (perm: string, checked: boolean) => void;
  onGrantAll: () => void;
  onRevokeAll: () => void;
  onApplyTemplate: (perms: string[]) => void;
  isSaving: boolean;
}

const TEMPLATES = [
  { name: 'Silver', perms: ['leads:read', 'contacts:read', 'accounts:read', 'deals:read'] },
  { name: 'Gold', perms: ['leads:*', 'contacts:*', 'accounts:*', 'deals:read', 'reports:read'] },
  { name: 'Platinum', perms: ['leads:*', 'contacts:*', 'accounts:*', 'deals:*', 'reports:*', 'campaigns:*', 'tickets:*'] },
];

const PermissionManager: React.FC<PermissionManagerProps> = ({
  corePermissions,
  featurePermissions,
  grantedPermissions,
  onToggle,
  onGrantAll,
  onRevokeAll,
  onApplyTemplate,
  isSaving
}) => {
  const [search, setSearch] = useState('');
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
  const [activeTab, setActiveTab] = useState<'feature' | 'core'>('feature');

  const groupByResource = (perms: string[]) => {
    const groups: Record<string, string[]> = {};
    perms.forEach(p => {
      const [resource] = p.split(':');
      if (!groups[resource]) groups[resource] = [];
      groups[resource].push(p);
    });
    return groups;
  };

  const featureGroups = useMemo(() => groupByResource(featurePermissions), [featurePermissions]);
  const coreGroups = useMemo(() => groupByResource(corePermissions), [corePermissions]);

  const toggleGroup = (group: string) => {
    const next = new Set(expandedGroups);
    if (next.has(group)) next.delete(group);
    else next.add(group);
    setExpandedGroups(next);
  };

  const filteredGroups = (groups: Record<string, string[]>) => {
    if (!search) return groups;
    const filtered: Record<string, string[]> = {};
    Object.entries(groups).forEach(([resource, perms]) => {
      const matches = perms.filter(p => p.toLowerCase().includes(search.toLowerCase()) || resource.toLowerCase().includes(search.toLowerCase()));
      if (matches.length > 0) filtered[resource] = matches;
    });
    return filtered;
  };

  const currentGroups = filteredGroups(activeTab === 'feature' ? featureGroups : coreGroups);

  return (
    <div className="space-y-6">
      {/* Header Controls */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex bg-accent/50 p-1 rounded-xl border border-border">
          <button 
            onClick={() => setActiveTab('feature')}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${activeTab === 'feature' ? 'bg-card text-primary shadow-sm' : 'text-muted-foreground'}`}
          >
            Feature Permissions
          </button>
          <button 
            onClick={() => setActiveTab('core')}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${activeTab === 'core' ? 'bg-card text-primary shadow-sm' : 'text-muted-foreground'}`}
          >
            Core (Read-only)
          </button>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input 
              type="text"
              placeholder="Search permissions..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="bg-card border border-border rounded-xl pl-10 pr-4 py-2 text-sm w-64 focus:ring-2 focus:ring-primary/20 outline-none"
            />
          </div>
          {activeTab === 'feature' && (
            <div className="flex items-center gap-2">
               <button 
                 onClick={onRevokeAll}
                 disabled={isSaving}
                 className="p-2 rounded-xl border border-border hover:bg-accent text-muted-foreground transition-all"
                 title="Revoke All"
               >
                 <RotateCcw size={18} />
               </button>
               <button 
                 onClick={onGrantAll}
                 disabled={isSaving}
                 className="p-2 rounded-xl bg-primary/10 border border-primary/20 text-primary hover:bg-primary/20 transition-all"
                 title="Grant All"
               >
                 <Zap size={18} />
               </button>
            </div>
          )}
        </div>
      </div>

      {/* Template Selector */}
      {activeTab === 'feature' && (
        <div className="bg-primary/5 border border-primary/10 rounded-2xl p-4">
          <div className="flex items-center gap-2 text-primary mb-3">
            <Layers size={18} />
            <span className="text-sm font-bold uppercase tracking-wider">Quick Templates</span>
          </div>
          <div className="flex gap-3">
            {TEMPLATES.map(template => (
              <button
                key={template.name}
                onClick={() => onApplyTemplate(template.perms)}
                disabled={isSaving}
                className="bg-card hover:bg-accent border border-border px-4 py-2 rounded-xl text-sm font-medium transition-all shadow-sm"
              >
                {template.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Permission List */}
      <div className="space-y-3">
        {Object.entries(currentGroups).map(([resource, perms]) => {
          const isExpanded = expandedGroups.has(resource) || search.length > 0;
          const activeCount = perms.filter(p => grantedPermissions.has(p)).length;
          
          return (
            <div key={resource} className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
              <button 
                onClick={() => toggleGroup(resource)}
                className="w-full flex items-center justify-between p-4 hover:bg-accent/30 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-accent flex items-center justify-center text-muted-foreground">
                    <Shield size={16} />
                  </div>
                  <div className="text-left">
                    <h4 className="font-bold capitalize">{resource}</h4>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-widest">{perms.length} Permissions Available</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-xs font-semibold px-2 py-1 rounded-md bg-accent text-muted-foreground">
                    {activeCount} / {perms.length} Active
                  </div>
                  {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                </div>
              </button>

              <AnimatePresence>
                {isExpanded && (
                  <motion.div 
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="border-t border-border bg-accent/10"
                  >
                    <div className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                      {perms.map(perm => {
                        const isGranted = grantedPermissions.has(perm) || activeTab === 'core';
                        return (
                          <div 
                            key={perm}
                            className={`flex items-center justify-between p-3 rounded-xl border transition-all ${isGranted ? 'bg-primary/5 border-primary/20' : 'bg-card border-border opacity-60'}`}
                          >
                            <span className="text-xs font-mono font-medium truncate mr-2" title={perm}>
                              {perm.split(':')[1] || perm}
                            </span>
                            
                            {activeTab === 'feature' ? (
                              <button 
                                onClick={() => onToggle(perm, !isGranted)}
                                disabled={isSaving}
                                className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${isGranted ? 'bg-primary text-primary-foreground' : 'bg-accent text-muted-foreground hover:bg-border'}`}
                              >
                                {isGranted ? <Check size={16} /> : <div className="w-1.5 h-1.5 rounded-full bg-current" />}
                              </button>
                            ) : (
                              <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400">
                                <Check size={16} />
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>

      {isSaving && (
        <div className="fixed bottom-8 right-8 bg-primary text-primary-foreground px-6 py-3 rounded-full shadow-2xl flex items-center gap-3 animate-bounce">
          <Save size={18} className="animate-pulse" />
          <span className="text-sm font-bold uppercase tracking-wider">Saving Changes...</span>
        </div>
      )}
    </div>
  );
};

export default PermissionManager;
