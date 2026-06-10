import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import * as api from './api';
import { ToastProvider } from './shared/context/ToastContext';
import AdminLayout from './shared/layouts/AdminLayout';
import DashboardPage from './pages/DashboardPage';
import TenantsPage from './pages/TenantsPage';
import TenantDetailPage from './pages/TenantDetailPage';
import PermissionGroupsPage from './pages/PermissionGroupsPage';
import ManagerUsersPage from './pages/ManagerUsersPage';
import CustomerOnboardingPage from './pages/CustomerOnboardingPage';
import AuditLogPage from './pages/AuditLogPage';
import SystemSettingsPage from './pages/SystemSettingsPage';
import { Shield, ArrowRight, Zap, Lock } from 'lucide-react';
import { motion } from 'framer-motion';

// ─── Auth Types ───
type AuthUser = {
  sub?: string;
  email?: string;
  preferred_username?: string;
  name?: string;
  platformRole?: string | null;
};

// ─── Login Screen ───
const LoginScreen = () => {
  const { t } = useTranslation();

  const handleLogin = () => {
    const returnTo = `${window.location.pathname}${window.location.search}`;
    window.location.href = `/api/auth/login?returnTo=${encodeURIComponent(returnTo)}`;
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden" style={{ background: 'var(--surface-page)' }}>
      <div className="absolute top-0 left-0 w-full h-full -z-10 overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/10 rounded-full blur-[120px] animate-pulse"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-500/10 rounded-full blur-[120px] animate-pulse transition-delay-1000"></div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md card p-8 !rounded-4xl shadow-2xl relative z-10"
      >
        <div className="flex flex-col items-center text-center space-y-6">
          <div className="relative">
            <div className="w-16 h-16 rounded-2xl bg-primary flex items-center justify-center text-primary-foreground shadow-xl shadow-primary/20 rotate-3 hover:rotate-0 transition-transform">
              <Zap size={32} fill="currentColor" />
            </div>
            <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-emerald-500 rounded-lg border-2 border-card flex items-center justify-center text-white">
              <Shield size={12} fill="currentColor" />
            </div>
          </div>

          <div>
            <h1 className="text-3xl font-bold tracking-tighter mb-1 bg-linear-to-br from-foreground to-foreground/70 bg-clip-text text-transparent">{t('login.title')}</h1>
            <p className="text-xs text-muted-foreground font-semibold uppercase tracking-widest">{t('login.subtitle')}</p>
          </div>

          <div className="w-full space-y-4">
            <div className="bg-accent/30 rounded-2xl p-4 border border-border/50 text-left">
              <div className="flex items-center gap-3 text-primary mb-2">
                <Lock size={16} />
                <span className="text-[10px] font-bold uppercase tracking-widest">{t('login.securityLabel')}</span>
              </div>
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                {t('login.securityMessage')}
              </p>
            </div>

            <button
              className="w-full btn-primary py-3.5 text-sm hover:scale-[1.02] active:scale-95 flex items-center justify-center gap-2 group"
              onClick={handleLogin}
            >
              {t('login.signIn')}
              <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
            </button>
          </div>

          <div className="pt-4 flex items-center gap-4 text-muted-foreground opacity-40">
            <div className="h-px flex-1 bg-current"></div>
            <span className="text-[10px] font-bold uppercase tracking-widest">{t('login.footer')}</span>
            <div className="h-px flex-1 bg-current"></div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

const AppContent = () => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [checkingAuth, setCheckingAuth] = useState(true);

  useEffect(() => {
    const handleLogout = () => {
      setUser(null);
    };

    window.addEventListener('crm-manager-auth:logout', handleLogout);

    void api
      .fetchCurrentUser()
      .then(setUser)
      .catch(handleLogout)
      .finally(() => setCheckingAuth(false));

    return () => {
      window.removeEventListener('crm-manager-auth:logout', handleLogout);
    };
  }, []);

  if (checkingAuth) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!user) {
    return <LoginScreen />;
  }

  return (
    <BrowserRouter>
      <AdminLayout user={user}>
        <Routes>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/tenants" element={<TenantsPage />} />
          <Route path="/tenants/:id" element={<TenantDetailPage />} />
          <Route path="/permission-groups" element={<PermissionGroupsPage />} />
          <Route path="/users" element={<ManagerUsersPage />} />
          <Route path="/onboarding" element={<CustomerOnboardingPage />} />
          <Route path="/audit-logs" element={<AuditLogPage />} />
          {user.platformRole === 'SUPER_ADMIN' && (
            <Route path="/system-settings" element={<SystemSettingsPage />} />
          )}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AdminLayout>
    </BrowserRouter>
  );
};

const App = () => {
  return (
    <ToastProvider>
      <AppContent />
    </ToastProvider>
  );
};

export default App;
