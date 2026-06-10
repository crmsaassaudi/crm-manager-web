import { useState, useEffect, useTransition } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Wrench,
  Megaphone,
  ShieldAlert,
  WifiOff,
  Wifi,
  Plus,
  X,
  AlertTriangle,
  CheckCircle,
} from 'lucide-react';
import * as api from '../api';
import type { SystemSettings } from '../api';
import { useToast } from '../shared/context/ToastContext';

const SystemSettingsPage = () => {
  const { t } = useTranslation();
  const { showToast } = useToast();
  const [isPending, startTransition] = useTransition();
  const [settings, setSettings] = useState<SystemSettings | null>(null);
  const [loading, setLoading] = useState(true);

  // Maintenance state
  const [ipInput, setIpInput] = useState('');
  const [localIPs, setLocalIPs] = useState<string[]>([]);

  // Banner state
  const [bannerEnabled, setBannerEnabled] = useState(false);
  const [bannerTitle, setBannerTitle] = useState('');
  const [bannerMessage, setBannerMessage] = useState('');
  const [bannerColor, setBannerColor] = useState<'yellow' | 'red'>('yellow');

  useEffect(() => {
    api.fetchSystemSettings()
      .then((data) => {
        setSettings(data);
        setLocalIPs(data.maintenanceMode.whitelistedIPs ?? []);
        setBannerEnabled(data.emergencyBanner.enabled);
        setBannerTitle(data.emergencyBanner.title);
        setBannerMessage(data.emergencyBanner.message);
        setBannerColor(data.emergencyBanner.color);
      })
      .catch(() => showToast(t('systemSettings.loadError'), 'error'))
      .finally(() => setLoading(false));
  }, []);

  const handleToggleMaintenance = () => {
    if (!settings) return;
    const next = !settings.maintenanceMode.enabled;
    startTransition(async () => {
      try {
        const updated = await api.toggleMaintenance(next, localIPs);
        setSettings(updated);
        showToast(
          next ? t('systemSettings.maintenance.enableSuccess') : t('systemSettings.maintenance.disableSuccess'),
          next ? 'warning' : 'success',
        );
      } catch (err: any) {
        showToast(err.response?.data?.message || t('systemSettings.maintenance.toggleError'), 'error');
      }
    });
  };

  const handleSaveIPs = () => {
    if (!settings) return;
    startTransition(async () => {
      try {
        const updated = await api.toggleMaintenance(
          settings.maintenanceMode.enabled,
          localIPs,
        );
        setSettings(updated);
        showToast(t('systemSettings.maintenance.saveIPSuccess'), 'success');
      } catch (err: any) {
        showToast(err.response?.data?.message || t('systemSettings.maintenance.saveIPError'), 'error');
      }
    });
  };

  const handleAddIP = () => {
    const ip = ipInput.trim();
    if (!ip || localIPs.includes(ip)) return;
    setLocalIPs((prev) => [...prev, ip]);
    setIpInput('');
  };

  const handleSaveBanner = () => {
    startTransition(async () => {
      try {
        const updated = await api.updateEmergencyBanner({
          enabled: bannerEnabled,
          title: bannerTitle,
          message: bannerMessage,
          color: bannerColor,
        });
        setSettings(updated);
        showToast(
          bannerEnabled ? t('systemSettings.banner.activateSuccess') : t('systemSettings.banner.deactivateSuccess'),
          bannerEnabled ? 'warning' : 'success',
        );
      } catch (err: any) {
        showToast(err.response?.data?.message || t('systemSettings.banner.error'), 'error');
      }
    });
  };

  if (loading) return (
    <div className="h-64 flex items-center justify-center">
      <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  );

  const maintenanceOn = settings?.maintenanceMode.enabled ?? false;
  const bannerActivated = settings?.emergencyBanner.enabled ?? false;

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Page Header */}
      <div>
        <h1 className="text-page-title">
          {t('systemSettings.title')}
        </h1>
        <p className="text-page-subtitle">
          {t('systemSettings.subtitle')}
        </p>
      </div>

      {/* Live Preview Banner */}
      {bannerActivated && settings && (
        <div className={`flex items-center gap-3 px-4 py-3 rounded-xl border ${
          settings.emergencyBanner.color === 'red'
            ? 'bg-rose-50 border-rose-200 dark:bg-rose-500/10 dark:border-rose-500/20'
            : 'bg-amber-50 border-amber-200 dark:bg-amber-500/10 dark:border-amber-500/20'
        }`}>
          <Megaphone size={16} className={settings.emergencyBanner.color === 'red' ? 'text-rose-600 dark:text-rose-400' : 'text-amber-600 dark:text-amber-400'} />
          <div className="flex-1">
            <span className={`text-[13px] font-bold ${settings.emergencyBanner.color === 'red' ? 'text-rose-700 dark:text-rose-400' : 'text-amber-700 dark:text-amber-400'}`}>
              {settings.emergencyBanner.title}
            </span>
            {settings.emergencyBanner.message && (
              <span className="ml-2 text-[13px] text-slate-600 dark:text-slate-300">{settings.emergencyBanner.message}</span>
            )}
          </div>
          <span className="text-[10px] font-bold uppercase text-slate-400">{t('systemSettings.liveLabel')}</span>
        </div>
      )}

      {/* Module 1: Maintenance Mode */}
      <div className="bg-white dark:bg-[#0F172A] rounded-xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-5">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${
              maintenanceOn ? 'bg-amber-50 dark:bg-amber-500/10' : 'bg-slate-50 dark:bg-slate-800'
            }`}>
              <Wrench size={16} className={maintenanceOn ? 'text-amber-600 dark:text-amber-400' : 'text-slate-400'} />
            </div>
            <div>
              <h2 className="text-[15px] font-bold text-slate-900 dark:text-white">{t('systemSettings.maintenance.title')}</h2>
              <p className="text-[12px] text-slate-500 mt-0.5">
                {t('systemSettings.maintenance.desc')}
              </p>
            </div>
          </div>

          <button
            onClick={handleToggleMaintenance}
            disabled={isPending}
            className={`relative flex items-center gap-2 px-4 py-2 rounded-lg text-[13px] font-semibold transition-all disabled:opacity-50 ${
              maintenanceOn
                ? 'bg-amber-50 text-amber-700 hover:bg-amber-100 dark:bg-amber-500/10 dark:text-amber-400'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300'
            }`}
          >
            {maintenanceOn ? <WifiOff size={14} /> : <Wifi size={14} />}
            {maintenanceOn ? t('systemSettings.maintenance.disable') : t('systemSettings.maintenance.enable')}
          </button>
        </div>

        {maintenanceOn && settings && (
          <div className="bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 rounded-xl p-3 flex items-center gap-2">
            <AlertTriangle size={14} className="text-amber-600 dark:text-amber-400 shrink-0" />
            <p className="text-[12px] text-amber-700 dark:text-amber-400">
              {t('systemSettings.maintenance.activeInfo', {
                time: settings.maintenanceMode.enabledAt
                  ? new Date(settings.maintenanceMode.enabledAt).toLocaleString()
                  : 'N/A',
                by: settings.maintenanceMode.enabledBy ?? 'unknown',
              })}
            </p>
          </div>
        )}

        {/* IP Whitelist */}
        <div className="space-y-3">
          <h3 className="text-[13px] font-semibold text-slate-700 dark:text-slate-300">
            {t('systemSettings.maintenance.ipWhitelist')}
          </h3>
          <div className="flex gap-2">
            <input
              type="text"
              value={ipInput}
              onChange={(e) => setIpInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAddIP()}
              placeholder={t('systemSettings.maintenance.ipPlaceholder')}
              className="flex-1 px-3 py-2 text-[13px] bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none font-mono"
            />
            <button
              onClick={handleAddIP}
              className="px-3 py-2 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
            >
              <Plus size={14} />
            </button>
          </div>

          {localIPs.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {localIPs.map((ip) => (
                <span
                  key={ip}
                  className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-lg text-[12px] font-mono"
                >
                  {ip}
                  <button
                    onClick={() => setLocalIPs((prev) => prev.filter((i) => i !== ip))}
                    className="text-slate-400 hover:text-rose-500 transition-colors"
                  >
                    <X size={11} />
                  </button>
                </span>
              ))}
            </div>
          )}

          <div className="flex justify-end">
            <button
              onClick={handleSaveIPs}
              disabled={isPending}
              className="px-4 py-2 text-[13px] font-semibold text-white bg-primary hover:bg-primary/90 rounded-lg transition-colors disabled:opacity-50"
            >
              {t('systemSettings.maintenance.saveWhitelist')}
            </button>
          </div>
        </div>
      </div>

      {/* Module 2: Emergency Banner */}
      <div className="bg-white dark:bg-[#0F172A] rounded-xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-5">
        <div className="flex items-center gap-3">
          <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${
            bannerActivated ? 'bg-rose-50 dark:bg-rose-500/10' : 'bg-slate-50 dark:bg-slate-800'
          }`}>
            <Megaphone size={16} className={bannerActivated ? 'text-rose-600 dark:text-rose-400' : 'text-slate-400'} />
          </div>
          <div>
            <h2 className="text-[15px] font-bold text-slate-900 dark:text-white">{t('systemSettings.banner.title')}</h2>
            <p className="text-[12px] text-slate-500 mt-0.5">
              {t('systemSettings.banner.desc')}
            </p>
          </div>
        </div>

        <div className="space-y-4">
          {/* Banner Toggle */}
          <div className="flex items-center justify-between py-2">
            <div>
              <p className="text-[13px] font-semibold text-slate-700 dark:text-slate-300">{t('systemSettings.banner.activateLabel')}</p>
              <p className="text-[11px] text-slate-400">{t('systemSettings.banner.activateDesc')}</p>
            </div>
            <button
              onClick={() => setBannerEnabled(!bannerEnabled)}
              className={`relative w-11 h-6 rounded-full transition-colors focus:outline-none ${
                bannerEnabled ? 'bg-rose-500' : 'bg-slate-200 dark:bg-slate-700'
              }`}
            >
              <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                bannerEnabled ? 'translate-x-5' : 'translate-x-0.5'
              }`} />
            </button>
          </div>

          {/* Color Picker */}
          <div className="space-y-1.5">
            <label className="text-[12px] font-semibold text-slate-600 dark:text-slate-400">{t('systemSettings.banner.colorLabel')}</label>
            <div className="flex gap-2">
              {(['yellow', 'red'] as const).map((color) => (
                <button
                  key={color}
                  onClick={() => setBannerColor(color)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-[12px] font-semibold transition-all ${
                    bannerColor === color
                      ? color === 'yellow'
                        ? 'bg-amber-50 border-amber-300 text-amber-700 dark:bg-amber-500/10 dark:border-amber-500/30 dark:text-amber-400'
                        : 'bg-rose-50 border-rose-300 text-rose-700 dark:bg-rose-500/10 dark:border-rose-500/30 dark:text-rose-400'
                      : 'bg-slate-50 border-slate-200 text-slate-500 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-400'
                  }`}
                >
                  <ShieldAlert size={13} />
                  {color === 'yellow' ? t('systemSettings.banner.colorWarning') : t('systemSettings.banner.colorCritical')}
                </button>
              ))}
            </div>
          </div>

          {/* Title */}
          <div className="space-y-1.5">
            <label className="text-[12px] font-semibold text-slate-600 dark:text-slate-400">{t('systemSettings.banner.titleLabel')}</label>
            <input
              type="text"
              value={bannerTitle}
              onChange={(e) => setBannerTitle(e.target.value)}
              placeholder={t('systemSettings.banner.titlePlaceholder')}
              className="w-full px-3 py-2 text-[13px] bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none"
            />
          </div>

          {/* Message */}
          <div className="space-y-1.5">
            <label className="text-[12px] font-semibold text-slate-600 dark:text-slate-400">{t('systemSettings.banner.messageLabel')}</label>
            <textarea
              value={bannerMessage}
              onChange={(e) => setBannerMessage(e.target.value)}
              placeholder={t('systemSettings.banner.messagePlaceholder')}
              rows={3}
              className="w-full px-3 py-2 text-[13px] bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none resize-none"
            />
          </div>

          {/* Preview */}
          {(bannerTitle || bannerMessage) && (
            <div className={`flex items-start gap-3 px-4 py-3 rounded-xl border text-[12px] ${
              bannerColor === 'red'
                ? 'bg-rose-50 border-rose-200 dark:bg-rose-500/10 dark:border-rose-500/20'
                : 'bg-amber-50 border-amber-200 dark:bg-amber-500/10 dark:border-amber-500/20'
            }`}>
              <Megaphone size={14} className={`mt-0.5 shrink-0 ${bannerColor === 'red' ? 'text-rose-600 dark:text-rose-400' : 'text-amber-600 dark:text-amber-400'}`} />
              <div>
                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1 block">{t('systemSettings.banner.previewLabel')}</span>
                {bannerTitle && <p className={`font-bold ${bannerColor === 'red' ? 'text-rose-700 dark:text-rose-400' : 'text-amber-700 dark:text-amber-400'}`}>{bannerTitle}</p>}
                {bannerMessage && <p className="text-slate-600 dark:text-slate-300 mt-0.5">{bannerMessage}</p>}
              </div>
            </div>
          )}

          <div className="flex justify-end pt-1">
            <button
              onClick={handleSaveBanner}
              disabled={isPending}
              className={`flex items-center gap-2 px-5 py-2.5 text-[13px] font-semibold rounded-xl transition-all disabled:opacity-50 shadow-sm ${
                bannerEnabled
                  ? 'bg-rose-500 hover:bg-rose-600 text-white shadow-rose-500/20'
                  : 'bg-primary hover:bg-primary/90 text-white shadow-primary/20'
              }`}
            >
              {bannerEnabled ? <Megaphone size={14} /> : <CheckCircle size={14} />}
              {isPending
                ? t('systemSettings.banner.publishing')
                : bannerEnabled
                  ? t('systemSettings.banner.activateBroadcast')
                  : t('systemSettings.banner.saveDeactivated')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SystemSettingsPage;
