import React, { useState, useRef } from 'react';
import {
  Moon,
  Sun,
  Coins,
  Bell,
  Lock,
  Unlock,
  KeyRound,
  Fingerprint,
  FolderKanban,
  Database,
  Download,
  Upload,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  Shield,
  ShieldCheck,
  Smartphone,
  Code2,
  Sparkles,
  Info,
  ChevronRight,
  Cloud,
  CloudOff,
  RefreshCw,
  UserCheck
} from 'lucide-react';
import {
  SecuritySettings,
  NotificationSettings,
  CurrencyOption,
  UserAccount,
  CloudSyncInfo
} from '../types';
import { CURRENCIES } from '../services/storage';
import { requestAndroidNotificationPermission } from '../utils/notificationUtils';
import { PinSetupModal } from '../components/PinSetupModal';

interface SettingsScreenProps {
  darkTheme: boolean;
  onToggleDarkTheme: (value: boolean) => void;
  currency: string;
  onSelectCurrency: (code: string) => void;
  // Security
  securitySettings: SecuritySettings;
  onSetPinCredentials: (hash: string, salt: string) => void;
  onDisablePin: () => void;
  onToggleLock: (enabled: boolean) => void;
  onToggleBiometrics: (enabled: boolean) => void;
  onLockApp: () => void;
  // Notifications
  notificationSettings: NotificationSettings;
  onUpdateNotificationSettings: (updates: Partial<NotificationSettings>) => void;
  onTestNotification: (type?: 'BUDGET_70' | 'BUDGET_90' | 'BUDGET_EXCEEDED' | 'SAVINGS_REMINDER') => void;
  // Categories & Data
  categoriesCount?: number;
  onOpenCategoryManager?: () => void;
  onExportJson: () => void;
  onImportJson: (content: string) => { success: boolean; message: string };
  onResetData: () => void;
  onOpenAndroidCode: (tab?: 'code' | 'export') => void;
  // Cloud Sync
  currentUser?: UserAccount | null;
  syncInfo?: CloudSyncInfo;
  onOpenAuthSync?: () => void;
  onPerformSync?: () => Promise<{ success: boolean; message: string }>;
}

export const SettingsScreen: React.FC<SettingsScreenProps> = ({
  darkTheme,
  onToggleDarkTheme,
  currency,
  onSelectCurrency,
  securitySettings,
  onSetPinCredentials,
  onDisablePin,
  onToggleLock,
  onToggleBiometrics,
  onLockApp,
  notificationSettings,
  onUpdateNotificationSettings,
  onTestNotification,
  categoriesCount = 21,
  onOpenCategoryManager,
  onExportJson,
  onImportJson,
  onResetData,
  onOpenAndroidCode,
  currentUser,
  syncInfo,
  onOpenAuthSync,
  onPerformSync
}) => {
  const [isPinModalOpen, setIsPinModalOpen] = useState(false);
  const [resetConfirm, setResetConfirm] = useState(false);
  const [permissionFeedback, setPermissionFeedback] = useState<string | null>(null);
  const [importFeedback, setImportFeedback] = useState<{ success: boolean; text: string } | null>(null);
  const [testSentMsg, setTestSentMsg] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const activeCurrency = CURRENCIES.find(c => c.code === currency) || CURRENCIES[0];

  const handleToggleLockSwitch = (checked: boolean) => {
    if (checked) {
      if (!securitySettings.hasSetupPin || !securitySettings.pinHash) {
        // Open PIN creation modal first
        setIsPinModalOpen(true);
      } else {
        onToggleLock(true);
      }
    } else {
      // Must open PIN modal to confirm deactivation
      setIsPinModalOpen(true);
    }
  };

  const handleRequestSystemNotifications = async () => {
    const res = await requestAndroidNotificationPermission();
    if (res.granted) {
      onUpdateNotificationSettings({ systemNotificationsEnabled: true });
      setPermissionFeedback('Permission notifications accordée !');
    } else {
      onUpdateNotificationSettings({ systemNotificationsEnabled: false });
      setPermissionFeedback(res.message);
    }
    setTimeout(() => setPermissionFeedback(null), 3500);
  };

  const handleTestAlert = (type: 'BUDGET_70' | 'BUDGET_90' | 'BUDGET_EXCEEDED' | 'SAVINGS_REMINDER') => {
    onTestNotification(type);
    const labelMap = {
      BUDGET_70: 'Alerte 70% simulée',
      BUDGET_90: 'Alerte 90% simulée',
      BUDGET_EXCEEDED: 'Alerte dépassement simulée',
      SAVINGS_REMINDER: 'Rappel d’épargne simulé'
    };
    setTestSentMsg(labelMap[type]);
    setTimeout(() => setTestSentMsg(null), 2500);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = event => {
      const content = event.target?.result as string;
      if (content) {
        const result = onImportJson(content);
        setImportFeedback({
          success: result.success,
          text: result.message
        });
        setTimeout(() => setImportFeedback(null), 3500);
      }
    };
    reader.readAsText(file);
    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleReset = () => {
    onResetData();
    setResetConfirm(true);
    setTimeout(() => setResetConfirm(false), 2500);
  };

  return (
    <div className="space-y-6 p-4 sm:p-6 pb-24">
      {/* Header */}
      <div>
        <h2 className="text-lg font-black text-zinc-900 dark:text-zinc-100 sm:text-xl">
          Paramètres de l’application
        </h2>
        <p className="text-xs text-zinc-500 dark:text-zinc-400">
          Devise, sécurité, alertes budgétaires, apparence et données locales
        </p>
      </div>

      {/* 1. SECTION DEVISE */}
      <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-2xs dark:border-zinc-800 dark:bg-zinc-900">
        <div className="flex items-center gap-2.5 pb-4 border-b border-zinc-100 dark:border-zinc-800">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
            <Coins className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
              Devise monétaire
            </h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Devise active : <span className="font-semibold text-emerald-600 dark:text-emerald-400">{activeCurrency.name}</span>
            </p>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
          {CURRENCIES.map(c => {
            const isSelected = c.code === currency;
            return (
              <button
                key={c.code}
                onClick={() => onSelectCurrency(c.code)}
                className={`flex items-center justify-between rounded-xl border p-3 text-left transition ${
                  isSelected
                    ? 'border-emerald-500 bg-emerald-50/70 dark:border-emerald-600 dark:bg-emerald-950/40 text-emerald-950 dark:text-emerald-200 font-bold shadow-2xs'
                    : 'border-zinc-200 hover:border-zinc-300 bg-white hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:bg-zinc-800/60 text-zinc-700 dark:text-zinc-300'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="text-base">{c.flag}</span>
                  <div>
                    <p className="text-xs font-bold leading-tight">{c.code}</p>
                    <p className="text-[10px] text-zinc-400 truncate max-w-[130px]">{c.name}</p>
                  </div>
                </div>
                <span className="rounded-lg bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 text-[11px] font-mono font-semibold">
                  {c.symbol}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. SECTION SÉCURITÉ */}
      <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-2xs dark:border-zinc-800 dark:bg-zinc-900 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-zinc-100 dark:border-zinc-800">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300">
              <Shield className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                Sécurité & Verrouillage
              </h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Code PIN chiffré SHA-256 et authentification biométrique Android
              </p>
            </div>
          </div>

          {securitySettings.isLockEnabled && securitySettings.hasSetupPin && (
            <button
              onClick={onLockApp}
              className="flex items-center gap-1.5 rounded-xl border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-bold text-blue-700 hover:bg-blue-100 dark:border-blue-900 dark:bg-blue-950/60 dark:text-blue-300 transition"
              title="Tester le verrouillage"
            >
              <Lock className="h-3.5 w-3.5" />
              <span>Verrouiller</span>
            </button>
          )}
        </div>

        {/* Lock Switch */}
        <div className="flex items-center justify-between py-1">
          <div>
            <h4 className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
              Activer le verrouillage de l'application
            </h4>
            <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
              Demande le code PIN ou l’empreinte digitale au démarrage
            </p>
          </div>

          <label className="relative inline-flex cursor-pointer items-center">
            <input
              type="checkbox"
              checked={securitySettings.isLockEnabled}
              onChange={e => handleToggleLockSwitch(e.target.checked)}
              className="peer sr-only"
            />
            <div className="peer h-6 w-11 rounded-full bg-zinc-200 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:bg-white after:transition-all after:content-[''] peer-checked:bg-blue-600 peer-checked:after:translate-x-full peer-checked:after:border-white peer-focus:outline-hidden dark:bg-zinc-700" />
          </label>
        </div>

        {/* PIN Management button */}
        <div className="flex items-center justify-between rounded-xl bg-zinc-50 p-3.5 dark:bg-zinc-800/50 border border-zinc-100 dark:border-zinc-800">
          <div className="flex items-center gap-3">
            <KeyRound className="h-4 w-4 text-zinc-500 dark:text-zinc-400" />
            <div>
              <p className="text-xs font-bold text-zinc-800 dark:text-zinc-200">
                {securitySettings.hasSetupPin ? 'Code PIN configuré' : 'Aucun code PIN défini'}
              </p>
              <p className="text-[11px] text-zinc-500">
                {securitySettings.hasSetupPin
                  ? 'Code à 4 chiffres haché avec sel cryptographique'
                  : 'Créez un code PIN pour sécuriser l’accès'}
              </p>
            </div>
          </div>

          <button
            onClick={() => setIsPinModalOpen(true)}
            className="rounded-xl border border-zinc-300 bg-white px-3 py-1.5 text-xs font-bold text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200"
          >
            {securitySettings.hasSetupPin ? 'Modifier le PIN' : 'Créer un PIN'}
          </button>
        </div>

        {/* Biometrics Switch */}
        <div className="flex items-center justify-between py-1">
          <div className="flex items-start gap-2.5">
            <Fingerprint className="h-4 w-4 text-emerald-600 dark:text-emerald-400 mt-0.5 shrink-0" />
            <div>
              <h4 className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
                Authentification biométrique
              </h4>
              <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                Empreinte digitale / Reconnaissance faciale (BiometricPrompt Android)
              </p>
            </div>
          </div>

          <label className="relative inline-flex cursor-pointer items-center">
            <input
              type="checkbox"
              checked={securitySettings.isBiometricsEnabled}
              disabled={!securitySettings.hasSetupPin}
              onChange={e => onToggleBiometrics(e.target.checked)}
              className="peer sr-only"
            />
            <div className="peer h-6 w-11 rounded-full bg-zinc-200 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:bg-white after:transition-all after:content-[''] peer-checked:bg-emerald-600 peer-checked:after:translate-x-full peer-checked:after:border-white peer-focus:outline-hidden dark:bg-zinc-700 disabled:opacity-40" />
          </label>
        </div>

        {/* Cryptographic safety badge */}
        <div className="flex items-center gap-2 rounded-xl bg-emerald-50/80 p-3 text-[11px] text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-100 dark:border-emerald-900">
          <ShieldCheck className="h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
          <span>
            <strong>Sécurité garantie :</strong> Le code PIN n'est jamais stocké en clair. Il est haché localement par l'algorithme cryptographique SHA-256 avec sel aléatoire unique.
          </span>
        </div>
      </div>

      {/* 3. SECTION NOTIFICATIONS */}
      <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-2xs dark:border-zinc-800 dark:bg-zinc-900 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-zinc-100 dark:border-zinc-800">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300">
              <Bell className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                Notifications & Alertes
              </h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Seuils budgétaires (70%, 90%, 100%) & Rappels d’épargne
              </p>
            </div>
          </div>

          <label className="relative inline-flex cursor-pointer items-center">
            <input
              type="checkbox"
              checked={notificationSettings.enabled}
              onChange={e => onUpdateNotificationSettings({ enabled: e.target.checked })}
              className="peer sr-only"
            />
            <div className="peer h-6 w-11 rounded-full bg-zinc-200 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:bg-white after:transition-all after:content-[''] peer-checked:bg-amber-500 peer-checked:after:translate-x-full peer-checked:after:border-white peer-focus:outline-hidden dark:bg-zinc-700" />
          </label>
        </div>

        {notificationSettings.enabled && (
          <div className="space-y-3 pt-1">
            {/* 70% Alert */}
            <div className="flex items-center justify-between py-1">
              <div>
                <h4 className="text-xs font-bold text-zinc-800 dark:text-zinc-200">
                  Avertissement seuil 70 %
                </h4>
                <p className="text-[11px] text-zinc-500">
                  Alerte lorsque les dépenses atteignent 70 % d'un budget
                </p>
              </div>
              <input
                type="checkbox"
                checked={notificationSettings.alert70Enabled}
                onChange={e => onUpdateNotificationSettings({ alert70Enabled: e.target.checked })}
                className="h-4 w-4 rounded-sm border-zinc-300 text-amber-600 focus:ring-amber-500 dark:border-zinc-700"
              />
            </div>

            {/* 90% Alert */}
            <div className="flex items-center justify-between py-1">
              <div>
                <h4 className="text-xs font-bold text-zinc-800 dark:text-zinc-200">
                  Avertissement critique 90 %
                </h4>
                <p className="text-[11px] text-zinc-500">
                  Alerte quand le budget est presque entièrement épuisé
                </p>
              </div>
              <input
                type="checkbox"
                checked={notificationSettings.alert90Enabled}
                onChange={e => onUpdateNotificationSettings({ alert90Enabled: e.target.checked })}
                className="h-4 w-4 rounded-sm border-zinc-300 text-amber-600 focus:ring-amber-500 dark:border-zinc-700"
              />
            </div>

            {/* Budget Exceeded (100%+) */}
            <div className="flex items-center justify-between py-1">
              <div>
                <h4 className="text-xs font-bold text-zinc-800 dark:text-zinc-200">
                  Alerte dépassement de budget (100 %+)
                </h4>
                <p className="text-[11px] text-zinc-500">
                  Avertissement immédiat en cas d'excédent de dépenses
                </p>
              </div>
              <input
                type="checkbox"
                checked={notificationSettings.alertExceededEnabled}
                onChange={e => onUpdateNotificationSettings({ alertExceededEnabled: e.target.checked })}
                className="h-4 w-4 rounded-sm border-zinc-300 text-rose-600 focus:ring-rose-500 dark:border-zinc-700"
              />
            </div>

            {/* Savings Reminder */}
            <div className="flex items-center justify-between py-1">
              <div>
                <h4 className="text-xs font-bold text-zinc-800 dark:text-zinc-200">
                  Rappels des objectifs d'épargne
                </h4>
                <p className="text-[11px] text-zinc-500">
                  Rappels périodiques et alertes à l'approche de la date cible
                </p>
              </div>
              <input
                type="checkbox"
                checked={notificationSettings.savingsRemindersEnabled}
                onChange={e => onUpdateNotificationSettings({ savingsRemindersEnabled: e.target.checked })}
                className="h-4 w-4 rounded-sm border-zinc-300 text-emerald-600 focus:ring-emerald-500 dark:border-zinc-700"
              />
            </div>

            {/* Android System Push Permissions (Requested ONLY when toggled) */}
            <div className="rounded-xl bg-zinc-50 p-3.5 dark:bg-zinc-800/60 border border-zinc-100 dark:border-zinc-800 space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-zinc-800 dark:text-zinc-200">
                    Notifications système Android (POST_NOTIFICATIONS)
                  </h4>
                  <p className="text-[11px] text-zinc-500">
                    Demande de permission explicite uniquement à l'activation
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleRequestSystemNotifications}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                    notificationSettings.systemNotificationsEnabled
                      ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                      : 'bg-zinc-200 text-zinc-800 hover:bg-zinc-300 dark:bg-zinc-700 dark:text-zinc-200'
                  }`}
                >
                  {notificationSettings.systemNotificationsEnabled ? 'Autorisé ✓' : 'Demander la permission'}
                </button>
              </div>

              {permissionFeedback && (
                <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold animate-pulse">
                  {permissionFeedback}
                </p>
              )}
            </div>

            {/* Simulation test buttons */}
            <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800">
              <p className="text-[11px] font-bold text-zinc-500 mb-2">
                Simulateur de scénarios d'alerte :
              </p>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => handleTestAlert('BUDGET_70')}
                  className="rounded-lg bg-blue-50 px-2.5 py-1 text-[11px] font-semibold text-blue-700 hover:bg-blue-100 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200 dark:border-blue-900"
                >
                  Test Seuil 70%
                </button>
                <button
                  onClick={() => handleTestAlert('BUDGET_90')}
                  className="rounded-lg bg-amber-50 px-2.5 py-1 text-[11px] font-semibold text-amber-700 hover:bg-amber-100 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200 dark:border-amber-900"
                >
                  Test Seuil 90%
                </button>
                <button
                  onClick={() => handleTestAlert('BUDGET_EXCEEDED')}
                  className="rounded-lg bg-rose-50 px-2.5 py-1 text-[11px] font-semibold text-rose-700 hover:bg-rose-100 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-200 dark:border-rose-900"
                >
                  Test Dépassement
                </button>
                <button
                  onClick={() => handleTestAlert('SAVINGS_REMINDER')}
                  className="rounded-lg bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-900"
                >
                  Test Rappel Épargne
                </button>
              </div>

              {testSentMsg && (
                <p className="mt-2 text-xs font-bold text-emerald-600 dark:text-emerald-400">
                  ✓ {testSentMsg} envoyée dans le centre d'alertes !
                </p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* 4. SECTION THÈME CLAIR / SOMBRE */}
      <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-2xs dark:border-zinc-800 dark:bg-zinc-900">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
              {darkTheme ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
            </div>
            <div>
              <h4 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                Thème de l'interface (Material 3)
              </h4>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                {darkTheme ? 'Mode sombre actif' : 'Mode clair actif'}
              </p>
            </div>
          </div>

          <label className="relative inline-flex cursor-pointer items-center">
            <input
              type="checkbox"
              checked={darkTheme}
              onChange={e => onToggleDarkTheme(e.target.checked)}
              className="peer sr-only"
            />
            <div className="peer h-6 w-11 rounded-full bg-zinc-200 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:bg-white after:transition-all after:content-[''] peer-checked:bg-emerald-600 peer-checked:after:translate-x-full peer-checked:after:border-white peer-focus:outline-hidden dark:bg-zinc-700" />
          </label>
        </div>
      </div>

      {/* 5. SECTION GESTION DES CATÉGORIES */}
      <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-2xs dark:border-zinc-800 dark:bg-zinc-900">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-100 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300">
              <FolderKanban className="h-5 w-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                Gestion des catégories
              </h4>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                {categoriesCount} catégories actives (Revenus & Dépenses) • CRUD & Icônes
              </p>
            </div>
          </div>

          <button
            onClick={onOpenCategoryManager}
            className="flex items-center gap-1.5 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 dark:bg-purple-950/50 dark:text-purple-300 dark:border-purple-800 px-3.5 py-1.5 text-xs font-bold transition-colors"
          >
            <span>Gérer</span>
            <ChevronRight className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* 6. SECTION GESTION DES DONNÉES */}
      <div className="divide-y divide-zinc-100 rounded-2xl border border-zinc-200 bg-white shadow-2xs dark:divide-zinc-800 dark:border-zinc-800 dark:bg-zinc-900">
        <div className="p-4 sm:p-5">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-teal-100 text-teal-700 dark:bg-teal-950 dark:text-teal-300">
              <Database className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                Gestion des données & Sauvegardes
              </h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Synchronisation Cloud, Exportation, Restauration JSON et Réinitialisation
              </p>
            </div>
          </div>
        </div>

        {/* Cloud Sync & Backup */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 sm:p-5 bg-emerald-50/40 dark:bg-emerald-950/20">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700 dark:bg-emerald-900/60 dark:text-emerald-300">
              <Cloud className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
                  Sauvegarde & Synchronisation Cloud
                </h4>
                {currentUser ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                    <CheckCircle2 className="h-2.5 w-2.5" />
                    {syncInfo?.state === 'syncing' ? 'Synchro...' : 'Connecté'}
                  </span>
                ) : (
                  <span className="rounded-full bg-zinc-200 px-2 py-0.5 text-[10px] font-bold text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400">
                    Hors ligne (Local actif)
                  </span>
                )}
              </div>
              <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                {currentUser
                  ? `Compte : ${currentUser.email} • Dernière synchro : ${
                      syncInfo?.lastSyncedAt
                        ? new Date(syncInfo.lastSyncedAt).toLocaleTimeString('fr-FR', {
                            hour: '2-digit',
                            minute: '2-digit'
                          })
                        : 'Jamais'
                    }`
                  : 'Connectez-vous pour synchroniser vos budgets et transactions entre plusieurs appareils'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto">
            {currentUser && onPerformSync && (
              <button
                onClick={onPerformSync}
                disabled={syncInfo?.state === 'syncing'}
                className="flex items-center gap-1.5 rounded-xl border border-emerald-300 bg-white px-3 py-1.5 text-xs font-bold text-emerald-800 hover:bg-emerald-50 dark:border-emerald-800 dark:bg-zinc-800 dark:text-emerald-300 dark:hover:bg-zinc-700 transition"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${syncInfo?.state === 'syncing' ? 'animate-spin' : ''}`} />
                <span>{syncInfo?.state === 'syncing' ? 'Synchro...' : 'Synchroniser'}</span>
              </button>
            )}

            <button
              onClick={onOpenAuthSync}
              className="rounded-xl bg-emerald-600 px-3.5 py-1.5 text-xs font-bold text-white hover:bg-emerald-700 transition shadow-2xs"
            >
              {currentUser ? 'Gérer le compte' : 'Se connecter'}
            </button>
          </div>
        </div>

        {/* Export JSON */}
        <div className="flex items-center justify-between p-4 sm:p-5">
          <div className="flex items-center gap-3">
            <Download className="h-4 w-4 text-zinc-500" />
            <div>
              <h4 className="text-xs font-bold text-zinc-800 dark:text-zinc-200">
                Exporter une sauvegarde complète (JSON)
              </h4>
              <p className="text-[11px] text-zinc-500">
                Transactions, budgets, cagnottes d'épargne et devises
              </p>
            </div>
          </div>

          <button
            onClick={onExportJson}
            className="rounded-xl border border-zinc-200 px-3.5 py-1.5 text-xs font-bold text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800 shadow-2xs"
          >
            Exporter
          </button>
        </div>

        {/* Import JSON */}
        <div className="flex items-center justify-between p-4 sm:p-5">
          <div className="flex items-center gap-3">
            <Upload className="h-4 w-4 text-zinc-500" />
            <div>
              <h4 className="text-xs font-bold text-zinc-800 dark:text-zinc-200">
                Restaurer à partir d'un fichier JSON
              </h4>
              <p className="text-[11px] text-zinc-500">
                Importer une sauvegarde précédente
              </p>
            </div>
          </div>

          <label className="cursor-pointer rounded-xl border border-zinc-200 px-3.5 py-1.5 text-xs font-bold text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800 shadow-2xs">
            <span>Importer</span>
            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              onChange={handleFileChange}
              className="sr-only"
            />
          </label>
        </div>

        {importFeedback && (
          <div className="px-5 py-2.5">
            <p className={`text-xs font-bold ${importFeedback.success ? 'text-emerald-600' : 'text-rose-600'}`}>
              {importFeedback.text}
            </p>
          </div>
        )}

        {/* Reset Demo Data */}
        <div className="flex items-center justify-between p-4 sm:p-5">
          <div className="flex items-center gap-3">
            <RotateCcw className="h-4 w-4 text-amber-600" />
            <div>
              <h4 className="text-xs font-bold text-zinc-800 dark:text-zinc-200">
                Données de démonstration
              </h4>
              <p className="text-[11px] text-zinc-500">
                Recharger les exemples initiaux de revenus, budgets et épargne
              </p>
            </div>
          </div>

          <button
            onClick={handleReset}
            className="rounded-xl border border-amber-300 bg-amber-50 px-3.5 py-1.5 text-xs font-bold text-amber-800 hover:bg-amber-100 dark:border-amber-800 dark:bg-amber-950/50 dark:text-amber-300"
          >
            {resetConfirm ? 'Réinitialisé !' : 'Réinitialiser'}
          </button>
        </div>
      </div>

      {/* Android Studio Native Project Banner */}
      <div className="rounded-2xl border border-emerald-200 bg-linear-to-r from-emerald-500/10 via-teal-500/10 to-emerald-500/10 p-5 dark:border-emerald-800/60">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-xs">
              <Smartphone className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 sm:text-base">
                  Projet Android Natif Kotlin & Compose
                </h3>
                <span className="rounded-full bg-emerald-200/60 px-2 py-0.2 text-[9px] font-bold text-emerald-900 dark:bg-emerald-900/60 dark:text-emerald-200">
                  APK & Google Play AAB
                </span>
              </div>
              <p className="mt-0.5 text-xs text-zinc-600 dark:text-zinc-300">
                ApplicationId: <code className="font-mono text-[11px] font-bold text-emerald-700 dark:text-emerald-400">com.monbudget.app</code> • Room Database • Firebase Sync • Assistant Gemini • Biométrie • Notifications
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => onOpenAndroidCode('export')}
              className="flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3.5 py-2 text-xs font-bold text-white shadow-xs hover:bg-emerald-700 active:scale-95 transition"
              title="Générer l'APK pour téléphone ou l'AAB pour Google Play"
            >
              <Download className="h-4 w-4" />
              <span>Générer APK / AAB</span>
            </button>
            <button
              onClick={() => onOpenAndroidCode('code')}
              className="flex items-center gap-1.5 rounded-xl border border-zinc-300 bg-white px-3 py-2 text-xs font-semibold text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700 transition"
              title="Consulter l'architecture et les classes Kotlin"
            >
              <Code2 className="h-4 w-4" />
              <span>Code source</span>
            </button>
          </div>
        </div>
      </div>

      {/* Modal for PIN Setup & Change */}
      <PinSetupModal
        isOpen={isPinModalOpen}
        onClose={() => setIsPinModalOpen(false)}
        hasExistingPin={Boolean(securitySettings.hasSetupPin && securitySettings.pinHash)}
        currentPinHash={securitySettings.pinHash}
        currentPinSalt={securitySettings.pinSalt}
        onSavePin={(hash, salt) => {
          onSetPinCredentials(hash, salt);
        }}
        onDisablePin={() => {
          onDisablePin();
        }}
      />
    </div>
  );
};
