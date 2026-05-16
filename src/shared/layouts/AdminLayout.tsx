import React, { useState } from 'react';
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
  Zap
} from 'lucide-react';
import { NavLink } from 'react-router-dom';
import { motion } from 'framer-motion';

const AdminLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { t, i18n } = useTranslation();
  const { theme, toggleTheme } = useTheme();
  const [isSidebarCollapsed, setSidebarCollapsed] = useState(false);

  const toggleLanguage = () => {
    const nextLang = i18n.language === 'en' ? 'vi' : 'en';
    i18n.changeLanguage(nextLang);
  };

  const navItems = [
    { id: 'dashboard', icon: LayoutDashboard, label: t('common.dashboard'), path: '/' },
    { id: 'tenants', icon: Users, label: t('common.tenants'), path: '/tenants' },
    { id: 'settings', icon: Settings, label: t('common.settings'), path: '/settings' },
  ];

  return (
    <div className="flex min-h-screen bg-background transition-colors duration-300">
      {/* Sidebar */}
      <motion.aside 
        initial={false}
        animate={{ width: isSidebarCollapsed ? 80 : 280 }}
        className="fixed inset-y-0 left-0 z-50 flex flex-col bg-card border-r border-border"
      >
        <div className="p-6 flex items-center justify-between">
          {!isSidebarCollapsed && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex items-center gap-3 font-bold text-xl text-primary tracking-tight"
            >
              <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center text-primary-foreground shadow-lg shadow-primary/20">
                <Zap size={24} fill="currentColor" />
              </div>
              <span>CRM Admin</span>
            </motion.div>
          )}
          {isSidebarCollapsed && (
             <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center text-primary-foreground mx-auto shadow-lg shadow-primary/20">
                <Zap size={24} fill="currentColor" />
             </div>
          )}
        </div>

        <nav className="flex-1 px-4 space-y-2 mt-4">
          {navItems.map((item) => (
            <NavLink
              key={item.id}
              to={item.path}
              className={({ isActive }) => `
                flex items-center gap-4 px-4 py-3 rounded-xl transition-all duration-200 group
                ${isActive 
                  ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20' 
                  : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'}
              `}
            >
              <item.icon size={20} className="group-hover:scale-110 transition-transform" />
              {!isSidebarCollapsed && (
                <motion.span 
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="font-medium"
                >
                  {item.label}
                </motion.span>
              )}
            </NavLink>
          ))}
        </nav>

        <div className="p-4 border-t border-border">
          <button 
            onClick={() => setSidebarCollapsed(!isSidebarCollapsed)}
            className="w-full flex items-center gap-4 px-4 py-3 rounded-xl text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-all"
          >
            <ChevronLeft size={20} className={`transition-transform duration-300 ${isSidebarCollapsed ? 'rotate-180' : ''}`} />
            {!isSidebarCollapsed && <span className="font-medium">Collapse</span>}
          </button>
        </div>
      </motion.aside>

      {/* Main Content */}
      <main 
        className={`flex-1 transition-all duration-300 ${isSidebarCollapsed ? 'pl-20' : 'pl-[280px]'}`}
      >
        {/* Header */}
        <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-md border-b border-border h-20 flex items-center px-8 justify-between">
          <div className="flex items-center gap-4 text-muted-foreground">
             <div className="relative group">
                <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 group-focus-within:text-primary transition-colors" />
                <input 
                  type="text" 
                  placeholder={t('common.search')} 
                  className="bg-accent/50 border-none rounded-full pl-10 pr-4 py-2 text-sm w-64 focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                />
             </div>
          </div>

          <div className="flex items-center gap-4">
            <button 
              onClick={toggleLanguage}
              className="p-2.5 rounded-full hover:bg-accent text-muted-foreground transition-colors relative group"
              title={i18n.language === 'en' ? 'Switch to Vietnamese' : 'Switch to English'}
            >
              <Globe size={20} />
              <span className="absolute -bottom-8 left-1/2 -translate-x-1/2 bg-popover text-popover-foreground text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap border border-border shadow-sm">
                {i18n.language.toUpperCase()}
              </span>
            </button>

            <button 
              onClick={toggleTheme}
              className="p-2.5 rounded-full hover:bg-accent text-muted-foreground transition-colors"
            >
              {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
            </button>

            <button className="p-2.5 rounded-full hover:bg-accent text-muted-foreground transition-colors relative">
              <Bell size={20} />
              <span className="absolute top-2 right-2 w-2 h-2 bg-destructive rounded-full border-2 border-background"></span>
            </button>

            <div className="h-8 w-px bg-border mx-2"></div>

            <div className="flex items-center gap-3 pl-2">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-semibold">Admin User</p>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-bold">Platform Manager</p>
              </div>
              <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-primary to-indigo-400 border-2 border-background shadow-md overflow-hidden">
                <img 
                  src="https://api.dicebear.com/7.x/avataaars/svg?seed=Felix" 
                  alt="Avatar" 
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
          </div>
        </header>

        <div className="p-8 max-w-7xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
};

export default AdminLayout;
