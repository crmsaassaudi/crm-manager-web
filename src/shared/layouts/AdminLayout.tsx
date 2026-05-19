import React, { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../core/ThemeContext';
import {
  LayoutDashboard,
  Users,
  Settings,
  Sun,
  Moon,
  Globe,
  ChevronLeft,
  Bell,
  Search,
  Zap,
  LogOut,
  User,
  ChevronDown,
  Check,
  Shield as ShieldIcon,
  ScrollText,
} from 'lucide-react';
import { NavLink } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

interface AuthUser {
  sub?: string;
  email?: string;
  preferred_username?: string;
  name?: string;
}

const AdminLayout: React.FC<{ children: React.ReactNode; user: AuthUser }> = ({
  children,
  user,
}) => {
  const { t, i18n } = useTranslation();
  const { theme, toggleTheme } = useTheme();
  const [isSidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isLangOpen, setIsLangOpen] = useState(false);
  const [isUserOpen, setIsUserOpen] = useState(false);
  const langRef = useRef<HTMLDivElement>(null);
  const userRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (langRef.current && !langRef.current.contains(event.target as Node)) setIsLangOpen(false);
      if (userRef.current && !userRef.current.contains(event.target as Node)) setIsUserOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    window.location.href = '/api/auth/logout';
  };

  const navItems = [
    { id: 'dashboard', icon: LayoutDashboard, label: t('common.dashboard'), path: '/' },
    { id: 'tenants', icon: Users, label: t('common.tenants'), path: '/tenants' },
    { id: 'onboarding', icon: Zap, label: t('common.onboarding'), path: '/onboarding' },
    { id: 'permission-groups', icon: ShieldIcon, label: t('common.permissionGroups'), path: '/permission-groups' },
    { id: 'users', icon: User, label: t('common.managerUsers'), path: '/users' },
    { id: 'audit-logs', icon: ScrollText, label: t('common.auditLogs'), path: '/audit-logs' },
    { id: 'settings', icon: Settings, label: t('common.settings'), path: '/settings' },
  ];

  const languages = [
    { code: 'vi', label: 'Tiếng Việt', flag: '🇻🇳' },
    { code: 'en', label: 'English', flag: '🇺🇸' },
  ];

  return (
    <div className="flex min-h-screen bg-[#F8FAFC] dark:bg-[#020617] transition-colors duration-300 font-sans">
      {/* Sidebar */}
      <motion.aside 
        initial={false}
        animate={{ width: isSidebarCollapsed ? 64 : 220 }}
        className="fixed inset-y-0 left-0 z-50 flex flex-col bg-white dark:bg-[#0F172A] border-r border-slate-200 dark:border-slate-800 shadow-sm"
      >
        <div className="h-14 flex items-center px-4 border-b border-slate-100 dark:border-slate-800/50">
          <div className={`flex items-center gap-2 ${isSidebarCollapsed ? 'mx-auto' : ''}`}>
            <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center text-white shadow-sm shadow-primary/20">
              <Zap size={16} fill="currentColor" />
            </div>
            {!isSidebarCollapsed && (
              <span className="font-bold text-base tracking-tight text-slate-900 dark:text-white">CRM Admin</span>
            )}
          </div>
        </div>

        <nav className="flex-1 px-2 space-y-0.5 mt-3">
          {navItems.map((item) => (
            <NavLink
              key={item.id}
              to={item.path}
              className={({ isActive }) => `
                flex items-center gap-2.5 px-3 py-2 rounded-lg transition-all duration-200 group relative
                ${isActive 
                  ? 'bg-primary/10 text-primary font-semibold' 
                  : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-slate-200'}
              `}
            >
              <item.icon size={18} className={`transition-transform duration-200 ${isSidebarCollapsed ? 'mx-auto' : ''}`} />
              {!isSidebarCollapsed && (
                <span className="text-[14px] leading-none">{item.label}</span>
              )}
            </NavLink>
          ))}
        </nav>

        <div className="p-2 border-t border-slate-100 dark:border-slate-800/50">
          <button 
            onClick={() => setSidebarCollapsed(!isSidebarCollapsed)}
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-all"
          >
            <ChevronLeft size={16} className={`transition-transform duration-300 ${isSidebarCollapsed ? 'rotate-180 mx-auto' : ''}`} />
            {!isSidebarCollapsed && <span className="text-[12px] font-medium uppercase tracking-wider">{t('common.collapse')}</span>}
          </button>
        </div>
      </motion.aside>

      {/* Main Content */}
      <main 
        className={`flex-1 transition-all duration-300 ${isSidebarCollapsed ? 'pl-16' : 'pl-[220px]'}`}
      >
        {/* Header */}
        <header className="sticky top-0 z-40 bg-white/80 dark:bg-[#0F172A]/80 backdrop-blur-md border-b border-slate-100 dark:border-slate-800/50 h-14 flex items-center px-6 justify-between">
          <div className="flex items-center gap-4">
             <div className="relative group">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors" />
                <input 
                  type="text" 
                  placeholder={t('common.search')} 
                  className="bg-slate-100 dark:bg-slate-800/50 border-none rounded-lg pl-9 pr-4 py-1.5 text-[13px] w-48 focus:ring-1 focus:ring-primary/30 outline-none transition-all focus:w-64"
                />
             </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Language Dropdown */}
            <div className="relative" ref={langRef}>
              <button 
                onClick={() => setIsLangOpen(!isLangOpen)}
                className="h-8 px-2.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors flex items-center gap-2 text-[12px] font-medium"
              >
                <Globe size={16} />
                <span>{i18n.language.toUpperCase()}</span>
                <ChevronDown size={14} className={`transition-transform duration-200 ${isLangOpen ? 'rotate-180' : ''}`} />
              </button>
              <AnimatePresence>
                {isLangOpen && (
                  <motion.div 
                    initial={{ opacity: 0, y: 8, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 8, scale: 0.98 }}
                    className="absolute right-0 mt-1.5 w-44 bg-white dark:bg-[#1E293B] border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl py-1 z-50 overflow-hidden"
                  >
                    {languages.map((lang) => (
                      <button
                        key={lang.code}
                        onClick={() => {
                          i18n.changeLanguage(lang.code);
                          setIsLangOpen(false);
                        }}
                        className={`w-full flex items-center justify-between px-3 py-2.5 text-[13px] hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors ${i18n.language === lang.code ? 'text-primary font-semibold bg-primary/5' : 'text-slate-600 dark:text-slate-300'}`}
                      >
                        <div className="flex items-center gap-2.5">
                          <span className="text-sm">{lang.flag}</span>
                          <span>{lang.label}</span>
                        </div>
                        {i18n.language === lang.code && <Check size={14} />}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <button 
              onClick={toggleTheme}
              className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 transition-colors"
            >
              {theme === 'light' ? <Moon size={16} /> : <Sun size={16} />}
            </button>

            <button className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 transition-colors relative">
              <Bell size={16} />
              <span className="absolute top-2 right-2 w-1.5 h-1.5 bg-rose-500 rounded-full border border-white dark:border-[#0F172A]"></span>
            </button>

            <div className="h-4 w-px bg-slate-200 dark:bg-slate-800 mx-1.5"></div>

            {/* User Dropdown */}
            <div className="relative" ref={userRef}>
              <button 
                onClick={() => setIsUserOpen(!isUserOpen)}
                className="flex items-center gap-2.5 p-1 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
              >
                <div className="w-7 h-7 rounded-lg bg-slate-200 dark:bg-slate-800 overflow-hidden">
                  <img
                    src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${user.email || 'Felix'}`}
                    alt="Avatar"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="text-left hidden sm:block">
                  <p className="text-[12px] font-semibold leading-none text-slate-900 dark:text-white">
                    {user.name || user.preferred_username || t('layout.adminUser')}
                  </p>
                  <p className="text-[10px] text-slate-400 font-medium mt-0.5">
                    {t('layout.adminRole')}
                  </p>
                </div>
                <ChevronDown size={14} className={`text-slate-400 transition-transform duration-200 ${isUserOpen ? 'rotate-180' : ''}`} />
              </button>
              
              <AnimatePresence>
                {isUserOpen && (
                  <motion.div 
                    initial={{ opacity: 0, y: 8, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 8, scale: 0.98 }}
                    className="absolute right-0 mt-1.5 w-56 bg-white dark:bg-[#1E293B] border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl py-1 z-50 overflow-hidden"
                  >
                    <div className="px-3 py-2.5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30">
                      <p className="text-[11px] font-medium text-slate-500 mb-0.5">
                        {t('layout.loginBy')}
                      </p>
                      <p className="text-[13px] font-semibold text-slate-900 dark:text-slate-100 truncate">
                        {user.email}
                      </p>
                    </div>
                    <div className="p-1 space-y-0.5">
                      <button className="w-full flex items-center gap-2.5 px-2.5 py-2 text-[13px] text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/50 rounded-lg transition-colors">
                        <User size={16} className="text-slate-400" />
                        {t('layout.profile')}
                      </button>
                      <button className="w-full flex items-center gap-2.5 px-2.5 py-2 text-[13px] text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/50 rounded-lg transition-colors">
                        <ShieldIcon size={16} className="text-slate-400" />
                        {t('layout.security')}
                      </button>
                      <div className="h-px bg-slate-100 dark:bg-slate-800 my-1 mx-2"></div>
                      <button 
                        onClick={handleLogout}
                        className="w-full flex items-center gap-2.5 px-2.5 py-2 text-[13px] text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-lg transition-colors font-semibold"
                      >
                        <LogOut size={16} />
                        {t('layout.logout')}
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </header>

        <div className="p-6 max-w-[1400px] mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
};

export default AdminLayout;
