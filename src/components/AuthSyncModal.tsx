import React, { useState } from 'react';
import {
  X,
  Cloud,
  CloudCheck,
  CloudUpload,
  CloudDownload,
  CloudOff,
  RefreshCw,
  User,
  Mail,
  Lock,
  LogOut,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  Smartphone,
  Info,
  KeyRound
} from 'lucide-react';
import { UserAccount, CloudSyncInfo } from '../types';
import { CloudSyncService } from '../services/cloudSyncService';

interface AuthSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserAccount | null;
  syncInfo: CloudSyncInfo;
  onLoginSuccess: (user: UserAccount) => void;
  onLogoutSuccess: () => void;
  onPerformSync: () => Promise<{ success: boolean; message: string }>;
  itemCounts: {
    transactions: number;
    budgets: number;
    savingsGoals: number;
    categories: number;
  };
}

export const AuthSyncModal: React.FC<AuthSyncModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  syncInfo,
  onLoginSuccess,
  onLogoutSuccess,
  onPerformSync,
  itemCounts
}) => {
  const [tab, setTab] = useState<'login' | 'register' | 'recovery'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);
    setLoading(true);

    try {
      if (tab === 'login') {
        const res = await CloudSyncService.signIn(email, password);
        if (res.success && res.user) {
          setSuccessMessage(res.message);
          onLoginSuccess(res.user);
          setTimeout(() => {
            setSuccessMessage(null);
          }, 1500);
        } else {
          setErrorMessage(res.message);
        }
      } else if (tab === 'register') {
        const res = await CloudSyncService.signUp(email, password, displayName);
        if (res.success && res.user) {
          setSuccessMessage(res.message);
          onLoginSuccess(res.user);
          setTimeout(() => {
            setSuccessMessage(null);
          }, 1500);
        } else {
          setErrorMessage(res.message);
        }
      } else if (tab === 'recovery') {
        const res = await CloudSyncService.sendPasswordReset(email);
        if (res.success) {
          setSuccessMessage(res.message);
          setTimeout(() => setTab('login'), 2500);
        } else {
          setErrorMessage(res.message);
        }
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'Une erreur est survenue.');
    } finally {
      setLoading(false);
    }
  };

  const handleManualSync = async () => {
    setErrorMessage(null);
    setSuccessMessage(null);
    const result = await onPerformSync();
    if (result.success) {
      setSuccessMessage(result.message);
      setTimeout(() => setSuccessMessage(null), 3000);
    } else {
      setErrorMessage(result.message);
    }
  };

  const handleSignOut = async () => {
    await CloudSyncService.signOut();
    onLogoutSuccess();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
      <div className="flex w-full max-w-md flex-col overflow-hidden rounded-3xl bg-white shadow-2xl dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-100 p-5 dark:border-zinc-800">
          <div className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-500 text-white shadow-sm">
              <Cloud className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
                Sauvegarde & Synchronisation Cloud
              </h3>
              <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                Architecture offline-first • Données Room & Cloud
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-700 dark:hover:text-zinc-200"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 overflow-y-auto max-h-[75vh]">
          {currentUser ? (
            /* Logged in state */
            <div className="space-y-4">
              {/* User Profile Card */}
              <div className="flex items-center justify-between rounded-2xl bg-emerald-50/80 p-4 border border-emerald-100 dark:bg-emerald-950/30 dark:border-emerald-900/60">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-600 text-white font-bold text-base shadow-xs">
                    {currentUser.displayName.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                      {currentUser.displayName}
                    </h4>
                    <p className="text-xs text-zinc-600 dark:text-zinc-400 flex items-center gap-1">
                      <Mail className="h-3 w-3" />
                      {currentUser.email}
                    </p>
                    <p className="text-[10px] text-emerald-700 dark:text-emerald-400 font-mono mt-0.5">
                      UID: {currentUser.uid}
                    </p>
                  </div>
                </div>

                <button
                  onClick={handleSignOut}
                  className="flex items-center gap-1 rounded-xl bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 px-3 py-1.5 text-xs font-semibold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 transition"
                  title="Se déconnecter"
                >
                  <LogOut className="h-3.5 w-3.5" />
                  <span>Quitter</span>
                </button>
              </div>

              {/* Sync Status Badge */}
              <div className="rounded-2xl border border-zinc-200 bg-zinc-50/70 p-4 dark:border-zinc-800 dark:bg-zinc-900/50 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-zinc-600 dark:text-zinc-400">
                    État de la synchronisation :
                  </span>

                  {syncInfo.state === 'syncing' ? (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-bold text-blue-700 dark:bg-blue-950 dark:text-blue-300">
                      <RefreshCw className="h-3 w-3 animate-spin" />
                      Synchronisation...
                    </span>
                  ) : syncInfo.state === 'offline' ? (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-zinc-200 px-2.5 py-0.5 text-xs font-bold text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
                      <CloudOff className="h-3 w-3" />
                      Hors ligne (Local actif)
                    </span>
                  ) : syncInfo.state === 'error' ? (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-100 px-2.5 py-0.5 text-xs font-bold text-rose-700 dark:bg-rose-950 dark:text-rose-300">
                      <AlertCircle className="h-3 w-3" />
                      Erreur
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-bold text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                      <CheckCircle2 className="h-3 w-3" />
                      Synchronisé
                    </span>
                  )}
                </div>

                <div className="text-xs text-zinc-500 dark:text-zinc-400">
                  Dernière synchronisation :{' '}
                  <span className="font-semibold text-zinc-800 dark:text-zinc-200">
                    {syncInfo.lastSyncedAt
                      ? new Date(syncInfo.lastSyncedAt).toLocaleString('fr-FR', {
                          day: '2-digit',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit',
                          second: '2-digit'
                        })
                      : 'Jamais synchronisé'}
                  </span>
                </div>

                {/* Local Inventory to Sync */}
                <div className="grid grid-cols-2 gap-2 pt-1 border-t border-zinc-200 dark:border-zinc-800">
                  <div className="rounded-xl bg-white dark:bg-zinc-800 p-2 text-center border border-zinc-100 dark:border-zinc-700">
                    <p className="text-[11px] text-zinc-500">Transactions</p>
                    <p className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                      {itemCounts.transactions}
                    </p>
                  </div>
                  <div className="rounded-xl bg-white dark:bg-zinc-800 p-2 text-center border border-zinc-100 dark:border-zinc-700">
                    <p className="text-[11px] text-zinc-500">Budgets</p>
                    <p className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                      {itemCounts.budgets}
                    </p>
                  </div>
                  <div className="rounded-xl bg-white dark:bg-zinc-800 p-2 text-center border border-zinc-100 dark:border-zinc-700">
                    <p className="text-[11px] text-zinc-500">Cagnottes</p>
                    <p className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                      {itemCounts.savingsGoals}
                    </p>
                  </div>
                  <div className="rounded-xl bg-white dark:bg-zinc-800 p-2 text-center border border-zinc-100 dark:border-zinc-700">
                    <p className="text-[11px] text-zinc-500">Catégories</p>
                    <p className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                      {itemCounts.categories}
                    </p>
                  </div>
                </div>

                {/* Sync Action Button */}
                <button
                  onClick={handleManualSync}
                  disabled={syncInfo.state === 'syncing'}
                  className="w-full flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-xs font-bold text-white shadow-xs hover:bg-emerald-700 active:scale-98 transition disabled:opacity-50"
                >
                  <RefreshCw
                    className={`h-4 w-4 ${syncInfo.state === 'syncing' ? 'animate-spin' : ''}`}
                  />
                  <span>
                    {syncInfo.state === 'syncing'
                      ? 'Synchronisation en cours...'
                      : 'Synchroniser manuellement maintenant'}
                  </span>
                </button>
              </div>

              {/* Guarantees Box */}
              <div className="rounded-2xl bg-blue-50/70 p-3.5 text-[11px] text-blue-900 dark:bg-blue-950/40 dark:text-blue-200 border border-blue-100 dark:border-blue-900 flex items-start gap-2.5">
                <ShieldCheck className="h-4 w-4 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
                <span>
                  <strong>Stratégie de fusion sécurisée :</strong> Dédoublonnage strict par identifiant unique et horodatage. Vos données locales restent toujours disponibles même hors ligne.
                </span>
              </div>
            </div>
          ) : (
            /* Unauthenticated / Sign-in form */
            <div className="space-y-4">
              {/* Tab Selector */}
              <div className="flex rounded-xl bg-zinc-100 p-1 dark:bg-zinc-800">
                <button
                  type="button"
                  onClick={() => {
                    setTab('login');
                    setErrorMessage(null);
                    setSuccessMessage(null);
                  }}
                  className={`flex-1 rounded-lg py-1.5 text-xs font-bold transition ${
                    tab === 'login'
                      ? 'bg-white text-zinc-900 shadow-xs dark:bg-zinc-700 dark:text-zinc-100'
                      : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200'
                  }`}
                >
                  Connexion
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setTab('register');
                    setErrorMessage(null);
                    setSuccessMessage(null);
                  }}
                  className={`flex-1 rounded-lg py-1.5 text-xs font-bold transition ${
                    tab === 'register'
                      ? 'bg-white text-zinc-900 shadow-xs dark:bg-zinc-700 dark:text-zinc-100'
                      : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200'
                  }`}
                >
                  Inscription
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setTab('recovery');
                    setErrorMessage(null);
                    setSuccessMessage(null);
                  }}
                  className={`flex-1 rounded-lg py-1.5 text-xs font-bold transition ${
                    tab === 'recovery'
                      ? 'bg-white text-zinc-900 shadow-xs dark:bg-zinc-700 dark:text-zinc-100'
                      : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200'
                  }`}
                >
                  Récupération
                </button>
              </div>

              {/* Offline-first notice */}
              <div className="rounded-xl bg-zinc-50 p-3 text-xs text-zinc-600 dark:bg-zinc-800/60 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-800 flex items-start gap-2">
                <Info className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                <p className="text-[11px] leading-relaxed">
                  L'application conserve 100% de ses fonctionnalités en local sans connexion. Le compte permet de synchroniser et restaurer vos budgets sur tous vos appareils.
                </p>
              </div>

              <form onSubmit={handleAuthSubmit} className="space-y-3">
                {tab === 'register' && (
                  <div>
                    <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                      Nom complet / Pseudo
                    </label>
                    <div className="relative">
                      <User className="absolute left-3 top-2.5 h-4 w-4 text-zinc-400" />
                      <input
                        type="text"
                        value={displayName}
                        onChange={e => setDisplayName(e.target.value)}
                        placeholder="Ex: Steve"
                        className="w-full rounded-xl border border-zinc-200 bg-white py-2 pl-9 pr-3 text-xs dark:border-zinc-700 dark:bg-zinc-800 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                        required
                      />
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                    Adresse email
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-2.5 h-4 w-4 text-zinc-400" />
                    <input
                      type="email"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      placeholder="nom@exemple.com"
                      className="w-full rounded-xl border border-zinc-200 bg-white py-2 pl-9 pr-3 text-xs dark:border-zinc-700 dark:bg-zinc-800 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                      required
                    />
                  </div>
                </div>

                {tab !== 'recovery' && (
                  <div>
                    <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                      Mot de passe
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-2.5 h-4 w-4 text-zinc-400" />
                      <input
                        type="password"
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full rounded-xl border border-zinc-200 bg-white py-2 pl-9 pr-3 text-xs dark:border-zinc-700 dark:bg-zinc-800 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                        required
                      />
                    </div>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full rounded-xl bg-emerald-600 py-2.5 text-xs font-bold text-white hover:bg-emerald-700 active:scale-98 transition shadow-xs disabled:opacity-50 mt-2"
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-1.5">
                      <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                      Traitement...
                    </span>
                  ) : tab === 'login' ? (
                    'Se connecter'
                  ) : tab === 'register' ? (
                    'Créer mon compte'
                  ) : (
                    'Envoyer le lien de récupération'
                  )}
                </button>
              </form>
            </div>
          )}

          {/* Feedback messages */}
          {errorMessage && (
            <div className="mt-3 flex items-center gap-2 rounded-xl bg-rose-50 p-2.5 text-xs text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-200 dark:border-rose-900">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {successMessage && (
            <div className="mt-3 flex items-center gap-2 rounded-xl bg-emerald-50 p-2.5 text-xs text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-900">
              <CheckCircle2 className="h-4 w-4 shrink-0" />
              <span>{successMessage}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
