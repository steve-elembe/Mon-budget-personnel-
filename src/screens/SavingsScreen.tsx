import React, { useState, useMemo } from 'react';
import {
  PiggyBank,
  Plus,
  Trash2,
  Edit2,
  ArrowDownLeft,
  ArrowUpRight,
  Target,
  Calendar,
  Clock,
  CheckCircle2,
  X,
  History,
  Sparkles,
  AlertCircle,
  TrendingUp,
  Landmark,
  Car,
  Home,
  Plane,
  GraduationCap,
  ShieldCheck,
  HeartPulse,
  Info,
  ChevronRight,
  Filter,
  DollarSign
} from 'lucide-react';
import { SavingsGoal, SavingsMovement, SavingsMovementType } from '../types';
import { formatFCFA } from '../services/storage';
import { CategoryIcon } from '../components/CategoryIcon';

interface SavingsScreenProps {
  savingsGoals: SavingsGoal[];
  savingsMovements?: SavingsMovement[];
  onAddSavingsGoal: (
    nameOrData:
      | string
      | {
          name: string;
          targetAmount: number;
          initialAmount?: number;
          targetDate?: string;
          description?: string;
          iconName?: string;
        },
    targetAmount?: number,
    initialAmount?: number,
    targetDate?: string,
    description?: string,
    iconName?: string
  ) => { success: boolean; message: string; goal?: SavingsGoal } | void;
  onUpdateSavingsGoal?: (
    id: string,
    updates: Partial<{
      name: string;
      targetAmount: number;
      targetDate?: string;
      description?: string;
      iconName?: string;
    }>
  ) => { success: boolean; message: string };
  onDeleteSavingsGoal: (id: string) => void;
  onAddDeposit?: (
    goalId: string,
    amount: number,
    date?: string,
    note?: string
  ) => { success: boolean; message: string };
  onWithdraw?: (
    goalId: string,
    amount: number,
    date?: string,
    note?: string
  ) => { success: boolean; message: string };
  onDeleteMovement?: (movementId: string) => { success: boolean; message: string };
  onContribute?: (goalId: string, amount: number) => void;
}

// Presets demandés explicitement par l'utilisateur
const SAVINGS_PRESETS = [
  {
    name: 'Terrain',
    icon: 'Landmark',
    description: 'Acquisition d’une parcelle foncière / terrain titré',
    color: '#16a34a',
    defaultAmount: 3000000
  },
  {
    name: 'Voiture',
    icon: 'Car',
    description: 'Achat d’un véhicule ou moto de transport',
    color: '#f97316',
    defaultAmount: 2000000
  },
  {
    name: 'Maison',
    icon: 'Home',
    description: 'Construction de maison ou apport immobilier',
    color: '#0284c7',
    defaultAmount: 5000000
  },
  {
    name: 'Voyage',
    icon: 'Plane',
    description: 'Vacances en famille ou billet d’avion',
    color: '#8b5cf6',
    defaultAmount: 800000
  },
  {
    name: 'Études',
    icon: 'GraduationCap',
    description: 'Frais de scolarité, université ou formation pro',
    color: '#6366f1',
    defaultAmount: 600000
  },
  {
    name: 'Urgence',
    icon: 'ShieldCheck',
    description: 'Fonds de sécurité pour imprévus médicaux et pannes',
    color: '#ef4444',
    defaultAmount: 1000000
  },
  {
    name: 'Projet personnel',
    icon: 'Sparkles',
    description: 'Création d’activité commerciale ou projet de cœur',
    color: '#f59e0b',
    defaultAmount: 1500000
  }
];

const SELECTABLE_ICONS = [
  'Target',
  'PiggyBank',
  'Landmark',
  'Car',
  'Home',
  'Plane',
  'GraduationCap',
  'ShieldCheck',
  'HeartPulse',
  'Sparkles',
  'Wallet',
  'Store',
  'Gift',
  'Tag'
];

export const SavingsScreen: React.FC<SavingsScreenProps> = ({
  savingsGoals,
  savingsMovements = [],
  onAddSavingsGoal,
  onUpdateSavingsGoal,
  onDeleteSavingsGoal,
  onAddDeposit,
  onWithdraw,
  onDeleteMovement,
  onContribute
}) => {
  // Modals state
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingGoal, setEditingGoal] = useState<SavingsGoal | null>(null);
  const [activeDepositGoal, setActiveDepositGoal] = useState<SavingsGoal | null>(null);
  const [activeWithdrawGoal, setActiveWithdrawGoal] = useState<SavingsGoal | null>(null);
  const [activeHistoryGoal, setActiveHistoryGoal] = useState<SavingsGoal | null>(null);
  const [goalToDelete, setGoalToDelete] = useState<SavingsGoal | null>(null);

  // Form states for Add/Edit
  const [formName, setFormName] = useState('');
  const [formTargetAmount, setFormTargetAmount] = useState('');
  const [formInitialAmount, setFormInitialAmount] = useState('');
  const [formTargetDate, setFormTargetDate] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formIcon, setFormIcon] = useState('Target');
  const [formErrorMessage, setFormErrorMessage] = useState('');

  // Form states for Deposit
  const [depositAmount, setDepositAmount] = useState('');
  const [depositDate, setDepositDate] = useState(new Date().toISOString().split('T')[0]);
  const [depositNote, setDepositNote] = useState('');
  const [depositError, setDepositError] = useState('');

  // Form states for Withdraw
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [withdrawDate, setWithdrawDate] = useState(new Date().toISOString().split('T')[0]);
  const [withdrawNote, setWithdrawNote] = useState('');
  const [withdrawError, setWithdrawError] = useState('');

  // History filter
  const [historyFilter, setHistoryFilter] = useState<'ALL' | 'DEPOSIT' | 'WITHDRAWAL'>('ALL');

  // Flash feedback toast
  const [feedbackToast, setFeedbackToast] = useState<{
    show: boolean;
    message: string;
    type: 'success' | 'error';
  }>({ show: false, message: '', type: 'success' });

  const triggerToast = (message: string, type: 'success' | 'error' = 'success') => {
    setFeedbackToast({ show: true, message, type });
    setTimeout(() => {
      setFeedbackToast(prev => ({ ...prev, show: false }));
    }, 4000);
  };

  // Global calculations
  const totalCurrent = useMemo(
    () => savingsGoals.reduce((acc, g) => acc + g.currentAmount, 0),
    [savingsGoals]
  );
  const totalTarget = useMemo(
    () => savingsGoals.reduce((acc, g) => acc + g.targetAmount, 0),
    [savingsGoals]
  );
  const totalRemaining = Math.max(0, totalTarget - totalCurrent);
  const globalProgress =
    totalTarget > 0 ? Math.min(100, Math.round((totalCurrent / totalTarget) * 100)) : 0;
  const completedGoalsCount = savingsGoals.filter(g => g.currentAmount >= g.targetAmount).length;

  // Open Add Modal
  const handleOpenAddModal = (preset?: typeof SAVINGS_PRESETS[0]) => {
    if (preset) {
      setFormName(preset.name);
      setFormTargetAmount(preset.defaultAmount.toString());
      setFormInitialAmount('');
      setFormTargetDate('');
      setFormDescription(preset.description);
      setFormIcon(preset.icon);
    } else {
      setFormName('');
      setFormTargetAmount('');
      setFormInitialAmount('');
      setFormTargetDate('');
      setFormDescription('');
      setFormIcon('Target');
    }
    setFormErrorMessage('');
    setShowAddModal(true);
  };

  // Open Edit Modal
  const handleOpenEditModal = (goal: SavingsGoal) => {
    setEditingGoal(goal);
    setFormName(goal.name);
    setFormTargetAmount(goal.targetAmount.toString());
    setFormInitialAmount('');
    setFormTargetDate(goal.targetDate || '');
    setFormDescription(goal.description || '');
    setFormIcon(goal.iconName || 'Target');
    setFormErrorMessage('');
  };

  // Handle Preset Click in Add Modal
  const handleSelectPreset = (preset: typeof SAVINGS_PRESETS[0]) => {
    setFormName(preset.name);
    if (!formTargetAmount) {
      setFormTargetAmount(preset.defaultAmount.toString());
    }
    if (!formDescription) {
      setFormDescription(preset.description);
    }
    setFormIcon(preset.icon);
  };

  // Submit Add Goal
  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsedTarget = parseFloat(formTargetAmount);
    const parsedInitial = parseFloat(formInitialAmount) || 0;

    if (!formName.trim()) {
      setFormErrorMessage("Le nom de l'objectif est obligatoire.");
      return;
    }
    if (isNaN(parsedTarget) || parsedTarget <= 0) {
      setFormErrorMessage('Le montant cible doit être supérieur à 0 FCFA.');
      return;
    }

    const res = onAddSavingsGoal(
      {
        name: formName.trim(),
        targetAmount: parsedTarget,
        initialAmount: parsedInitial,
        targetDate: formTargetDate || undefined,
        description: formDescription.trim() || undefined,
        iconName: formIcon
      },
      parsedTarget,
      parsedInitial,
      formTargetDate || undefined,
      formDescription.trim() || undefined,
      formIcon
    );

    triggerToast(
      res && typeof res === 'object' && res.message
        ? res.message
        : `Objectif « ${formName.trim()} » créé avec succès !`
    );
    setShowAddModal(false);
  };

  // Submit Edit Goal
  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingGoal) return;

    const parsedTarget = parseFloat(formTargetAmount);
    if (!formName.trim()) {
      setFormErrorMessage("Le nom de l'objectif est obligatoire.");
      return;
    }
    if (isNaN(parsedTarget) || parsedTarget <= 0) {
      setFormErrorMessage('Le montant cible doit être supérieur à 0 FCFA.');
      return;
    }

    if (onUpdateSavingsGoal) {
      const res = onUpdateSavingsGoal(editingGoal.id, {
        name: formName.trim(),
        targetAmount: parsedTarget,
        targetDate: formTargetDate || undefined,
        description: formDescription.trim() || undefined,
        iconName: formIcon
      });
      triggerToast(res.message);
    }

    setEditingGoal(null);
  };

  // Submit Deposit
  const handleDepositSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeDepositGoal) return;

    const parsed = parseFloat(depositAmount);
    if (isNaN(parsed) || parsed <= 0) {
      setDepositError('Veuillez saisir un montant supérieur à 0 FCFA.');
      return;
    }

    if (onAddDeposit) {
      const res = onAddDeposit(
        activeDepositGoal.id,
        parsed,
        depositDate,
        depositNote.trim() || undefined
      );
      if (res.success) {
        triggerToast(res.message);
        setActiveDepositGoal(null);
        setDepositAmount('');
        setDepositNote('');
        setDepositError('');
      } else {
        setDepositError(res.message);
      }
    } else if (onContribute) {
      onContribute(activeDepositGoal.id, parsed);
      triggerToast(`Dépôt de ${formatFCFA(parsed)} effectué !`);
      setActiveDepositGoal(null);
      setDepositAmount('');
      setDepositNote('');
      setDepositError('');
    }
  };

  // Submit Withdrawal
  const handleWithdrawSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeWithdrawGoal) return;

    const parsed = parseFloat(withdrawAmount);
    if (isNaN(parsed) || parsed <= 0) {
      setWithdrawError('Veuillez saisir un montant supérieur à 0 FCFA.');
      return;
    }

    if (parsed > activeWithdrawGoal.currentAmount) {
      setWithdrawError(
        `Le montant dépasse le disponible (${formatFCFA(activeWithdrawGoal.currentAmount)}).`
      );
      return;
    }

    if (onWithdraw) {
      const res = onWithdraw(
        activeWithdrawGoal.id,
        parsed,
        withdrawDate,
        withdrawNote.trim() || undefined
      );
      if (res.success) {
        triggerToast(res.message);
        setActiveWithdrawGoal(null);
        setWithdrawAmount('');
        setWithdrawNote('');
        setWithdrawError('');
      } else {
        setWithdrawError(res.message);
      }
    }
  };

  // Format and countdown date helper
  const getDateInfo = (dateStr?: string) => {
    if (!dateStr) {
      return { label: 'Sans date limite', status: 'none', daysText: 'Aucune échéance fixée' };
    }
    const target = new Date(dateStr + 'T00:00:00');
    const now = new Date();
    now.setHours(0, 0, 0, 0);

    const diffMs = target.getTime() - now.getTime();
    const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));

    const options: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short', year: 'numeric' };
    const label = target.toLocaleDateString('fr-FR', options);

    if (diffDays > 0) {
      if (diffDays >= 30) {
        const months = Math.round(diffDays / 30);
        return {
          label,
          status: 'future',
          daysText: `Dans ~${months} mois (${diffDays} j)`
        };
      }
      return {
        label,
        status: 'future',
        daysText: `Dans ${diffDays} jour${diffDays > 1 ? 's' : ''}`
      };
    } else if (diffDays === 0) {
      return { label, status: 'today', daysText: "Échéance aujourd'hui !" };
    } else {
      const pastDays = Math.abs(diffDays);
      return { label, status: 'expired', daysText: `Échéance dépassée (${pastDays} j)` };
    }
  };

  // Filtered movements for History Modal
  const goalMovements = useMemo(() => {
    if (!activeHistoryGoal) return [];
    return savingsMovements.filter(m => {
      if (m.goalId !== activeHistoryGoal.id) return false;
      if (historyFilter === 'ALL') return true;
      return m.type === historyFilter;
    });
  }, [savingsMovements, activeHistoryGoal, historyFilter]);

  // Statistics for active history goal
  const historyStats = useMemo(() => {
    if (!activeHistoryGoal) return { totalDeposits: 0, totalWithdrawals: 0, count: 0 };
    const allForGoal = savingsMovements.filter(m => m.goalId === activeHistoryGoal.id);
    const totalDeposits = allForGoal
      .filter(m => m.type === 'DEPOSIT')
      .reduce((acc, m) => acc + m.amount, 0);
    const totalWithdrawals = allForGoal
      .filter(m => m.type === 'WITHDRAWAL')
      .reduce((acc, m) => acc + m.amount, 0);
    return {
      totalDeposits,
      totalWithdrawals,
      count: allForGoal.length
    };
  }, [savingsMovements, activeHistoryGoal]);

  return (
    <div className="space-y-6 p-4 sm:p-6">
      {/* Toast Feedback */}
      {feedbackToast.show && (
        <div
          className={`fixed top-4 right-4 z-50 flex items-center gap-2 rounded-2xl px-4 py-3 text-xs font-bold text-white shadow-xl transition-all ${
            feedbackToast.type === 'success' ? 'bg-emerald-600' : 'bg-rose-600'
          }`}
        >
          <CheckCircle2 className="h-4 w-4" />
          <span>{feedbackToast.message}</span>
        </div>
      )}

      {/* Hero Header Card */}
      <div className="relative overflow-hidden rounded-3xl bg-linear-to-br from-cyan-900 via-sky-900 to-teal-950 p-6 text-white shadow-xl">
        <div className="relative z-10">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3.5">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/15 backdrop-blur-xs">
                <PiggyBank className="h-6 w-6 text-cyan-200" />
              </div>
              <div>
                <span className="text-[11px] font-semibold uppercase tracking-wider text-cyan-200/90">
                  Épargne totale mobilisée (Room DB)
                </span>
                <h2 className="text-2xl font-black tracking-tight sm:text-3xl">
                  {formatFCFA(totalCurrent)}
                </h2>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                id="btn-create-savings-goal"
                onClick={() => handleOpenAddModal()}
                className="flex items-center gap-1.5 rounded-xl bg-white px-4 py-2.5 text-xs font-bold text-cyan-950 shadow-md transition hover:bg-cyan-50 active:scale-95"
              >
                <Plus className="h-4 w-4 text-cyan-700" />
                <span>Nouvel objectif</span>
              </button>
            </div>
          </div>

          {/* Detailed KPIs row */}
          <div className="mt-6 grid grid-cols-2 gap-3 border-t border-white/10 pt-4 sm:grid-cols-4">
            <div>
              <span className="text-[10px] uppercase text-cyan-200/80">Objectif cumulé</span>
              <p className="text-sm font-extrabold sm:text-base">{formatFCFA(totalTarget)}</p>
            </div>
            <div>
              <span className="text-[10px] uppercase text-cyan-200/80">Reste à collecter</span>
              <p className="text-sm font-extrabold sm:text-base">{formatFCFA(totalRemaining)}</p>
            </div>
            <div>
              <span className="text-[10px] uppercase text-cyan-200/80">Progression globale</span>
              <p className="text-sm font-extrabold text-cyan-300 sm:text-base">{globalProgress}%</p>
            </div>
            <div>
              <span className="text-[10px] uppercase text-cyan-200/80">Objectifs atteints</span>
              <p className="text-sm font-extrabold text-emerald-300 sm:text-base">
                {completedGoalsCount} / {savingsGoals.length}
              </p>
            </div>
          </div>

          {/* Global Progress bar */}
          <div className="mt-4">
            <div className="h-2.5 w-full overflow-hidden rounded-full bg-white/20">
              <div
                className="h-full rounded-full bg-linear-to-r from-cyan-400 to-emerald-400 transition-all duration-700"
                style={{ width: `${globalProgress}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Quick Preset Shortcuts */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
            Créer rapidement un objectif recommandé
          </span>
          <span className="text-[11px] text-zinc-400">Cliquez pour pré-remplir</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {SAVINGS_PRESETS.map(preset => (
            <button
              key={preset.name}
              onClick={() => handleOpenAddModal(preset)}
              className="flex items-center gap-1.5 rounded-xl border border-zinc-200 bg-white px-3 py-1.5 text-xs font-semibold text-zinc-800 shadow-2xs transition hover:border-cyan-400 hover:bg-cyan-50/50 hover:text-cyan-900 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-cyan-950/40"
            >
              <div
                className="flex h-5 w-5 items-center justify-center rounded-lg text-white"
                style={{ backgroundColor: preset.color }}
              >
                <CategoryIcon name={preset.icon} className="h-3 w-3" />
              </div>
              <span>{preset.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Savings Goals List */}
      <div className="space-y-3.5">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 sm:text-base">
            Mes projets et objectifs d'épargne ({savingsGoals.length})
          </h3>
          <span className="rounded-full bg-zinc-100 px-2.5 py-0.5 text-[11px] font-semibold text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
            Room Database
          </span>
        </div>

        {savingsGoals.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-zinc-300 bg-white p-10 text-center dark:border-zinc-800 dark:bg-zinc-900">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-cyan-50 text-cyan-700 dark:bg-cyan-950/60 dark:text-cyan-300">
              <Target className="h-7 w-7" />
            </div>
            <h4 className="mt-3 text-base font-bold text-zinc-900 dark:text-zinc-100">
              Aucun projet d'épargne pour le moment
            </h4>
            <p className="mx-auto mt-1 max-w-md text-xs text-zinc-500 dark:text-zinc-400">
              Commencez dès aujourd'hui à épargner pour votre terrain, véhicule, logement, fonds
              d'urgence ou vacances.
            </p>
            <div className="mt-5 flex justify-center">
              <button
                onClick={() => handleOpenAddModal()}
                className="inline-flex items-center gap-2 rounded-xl bg-cyan-700 px-4 py-2.5 text-xs font-bold text-white shadow-md transition hover:bg-cyan-800"
              >
                <Plus className="h-4 w-4" />
                <span>Créer mon premier objectif</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            {savingsGoals.map(goal => {
              // Exact calculation as requested: progression = montant épargné / montant cible * 100
              const progress =
                goal.targetAmount > 0
                  ? Math.round((goal.currentAmount / goal.targetAmount) * 100)
                  : 0;

              // Montant restant
              const remaining = Math.max(0, goal.targetAmount - goal.currentAmount);
              const isCompleted = goal.currentAmount >= goal.targetAmount;
              const dateInfo = getDateInfo(goal.targetDate);

              // Find count of movements for this goal
              const movementCount = savingsMovements.filter(m => m.goalId === goal.id).length;

              return (
                <div
                  key={goal.id}
                  id={`goal-card-${goal.id}`}
                  className={`relative flex flex-col justify-between rounded-3xl border p-5 shadow-2xs transition hover:shadow-md dark:bg-zinc-900 ${
                    isCompleted
                      ? 'border-emerald-200 bg-emerald-50/20 dark:border-emerald-900 dark:bg-emerald-950/10'
                      : 'border-zinc-200 bg-white dark:border-zinc-800'
                  }`}
                >
                  <div>
                    {/* Goal Header */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div
                          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl shadow-xs ${
                            isCompleted
                              ? 'bg-emerald-600 text-white'
                              : 'bg-cyan-600 text-white dark:bg-cyan-700'
                          }`}
                        >
                          <CategoryIcon name={goal.iconName || 'Target'} className="h-5 w-5" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="text-base font-extrabold text-zinc-900 dark:text-zinc-100">
                              {goal.name}
                            </h4>
                            {isCompleted && (
                              <span className="flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-black text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300">
                                <Sparkles className="h-2.5 w-2.5" />
                                <span>Atteint !</span>
                              </span>
                            )}
                          </div>
                          {goal.description ? (
                            <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400 line-clamp-1">
                              {goal.description}
                            </p>
                          ) : (
                            <p className="mt-0.5 text-xs text-zinc-400 dark:text-zinc-500 italic">
                              Projet d'épargne Room
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Header Actions (Edit / Delete) */}
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleOpenEditModal(goal)}
                          className="rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 dark:hover:bg-zinc-800 dark:hover:text-zinc-200 transition"
                          title="Modifier l'objectif"
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => setGoalToDelete(goal)}
                          className="rounded-lg p-1.5 text-zinc-400 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/40 transition"
                          title="Supprimer l'objectif"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Date limite si elle existe */}
                    <div className="mt-3.5 flex items-center justify-between rounded-xl bg-zinc-50 px-3 py-1.5 text-[11px] dark:bg-zinc-800/50">
                      <div className="flex items-center gap-1.5 text-zinc-600 dark:text-zinc-400">
                        <Calendar className="h-3.5 w-3.5 text-cyan-600 dark:text-cyan-400" />
                        <span className="font-semibold">{dateInfo.label}</span>
                      </div>
                      <span
                        className={`font-semibold ${
                          dateInfo.status === 'expired'
                            ? 'text-rose-600 dark:text-rose-400'
                            : dateInfo.status === 'today'
                            ? 'text-amber-600 font-bold'
                            : 'text-zinc-500 dark:text-zinc-400'
                        }`}
                      >
                        {dateInfo.daysText}
                      </span>
                    </div>

                    {/* Progress Bar & Numerical Metrics */}
                    <div className="mt-4 space-y-1.5">
                      <div className="flex items-baseline justify-between text-xs">
                        <div className="flex items-baseline gap-1.5">
                          <span className="text-lg font-black text-zinc-900 dark:text-zinc-100">
                            {formatFCFA(goal.currentAmount)}
                          </span>
                          <span className="text-xs font-semibold text-zinc-400">épargnés</span>
                        </div>
                        <div className="flex items-baseline gap-1">
                          <span
                            className={`text-sm font-black ${
                              isCompleted
                                ? 'text-emerald-600 dark:text-emerald-400'
                                : 'text-cyan-600 dark:text-cyan-400'
                            }`}
                          >
                            {progress}%
                          </span>
                          <span className="text-[10px] text-zinc-400">atteint</span>
                        </div>
                      </div>

                      {/* Visual Progress Bar */}
                      <div className="h-3 w-full overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${
                            isCompleted
                              ? 'bg-linear-to-r from-emerald-500 to-teal-400'
                              : progress >= 75
                              ? 'bg-linear-to-r from-cyan-500 to-emerald-400'
                              : 'bg-cyan-500'
                          }`}
                          style={{ width: `${Math.min(100, progress)}%` }}
                        />
                      </div>

                      {/* Target & Remaining Amount */}
                      <div className="flex items-center justify-between text-[11px] text-zinc-500 dark:text-zinc-400 pt-0.5">
                        <span>Montant cible : {formatFCFA(goal.targetAmount)}</span>
                        <span className={isCompleted ? 'font-bold text-emerald-600' : 'font-bold'}>
                          {isCompleted
                            ? `Surplus : +${formatFCFA(goal.currentAmount - goal.targetAmount)}`
                            : `Reste : ${formatFCFA(remaining)}`}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Goal Action Buttons */}
                  <div className="mt-5 grid grid-cols-3 gap-2 border-t border-zinc-100 pt-4 dark:border-zinc-800">
                    {/* Ajouter un dépôt */}
                    <button
                      onClick={() => {
                        setActiveDepositGoal(goal);
                        setDepositAmount('');
                        setDepositNote('');
                        setDepositError('');
                      }}
                      className="flex items-center justify-center gap-1.5 rounded-xl bg-emerald-600 px-2.5 py-2 text-xs font-bold text-white shadow-2xs transition hover:bg-emerald-700 active:scale-95"
                    >
                      <ArrowDownLeft className="h-3.5 w-3.5" />
                      <span>+ Dépôt</span>
                    </button>

                    {/* Retirer une somme */}
                    <button
                      onClick={() => {
                        setActiveWithdrawGoal(goal);
                        setWithdrawAmount('');
                        setWithdrawNote('');
                        setWithdrawError('');
                      }}
                      disabled={goal.currentAmount <= 0}
                      className="flex items-center justify-center gap-1.5 rounded-xl border border-rose-200 bg-rose-50/60 px-2.5 py-2 text-xs font-bold text-rose-700 transition hover:bg-rose-100 disabled:opacity-40 disabled:cursor-not-allowed dark:border-rose-900/60 dark:bg-rose-950/40 dark:text-rose-300"
                    >
                      <ArrowUpRight className="h-3.5 w-3.5" />
                      <span>- Retrait</span>
                    </button>

                    {/* Historique des mouvements */}
                    <button
                      onClick={() => {
                        setActiveHistoryGoal(goal);
                        setHistoryFilter('ALL');
                      }}
                      className="flex items-center justify-center gap-1.5 rounded-xl border border-zinc-200 bg-zinc-50 px-2.5 py-2 text-xs font-bold text-zinc-700 transition hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200"
                    >
                      <History className="h-3.5 w-3.5 text-zinc-500" />
                      <span>Historique ({movementCount})</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal: Créer un objectif d'épargne */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-2xs">
          <div className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl dark:bg-zinc-900 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-zinc-100 pb-3 dark:border-zinc-800">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-cyan-100 text-cyan-800 dark:bg-cyan-950 dark:text-cyan-300">
                  <PiggyBank className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
                    Nouvel objectif d'épargne
                  </h3>
                  <p className="text-xs text-zinc-500">Persisté dans Room Database</p>
                </div>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="rounded-lg p-1 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 dark:hover:bg-zinc-800"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Presets chips */}
            <div className="mt-4">
              <label className="block text-xs font-semibold text-zinc-500 dark:text-zinc-400 mb-1.5">
                Modèles rapides (exemples demandés) :
              </label>
              <div className="flex flex-wrap gap-1.5">
                {SAVINGS_PRESETS.map(preset => (
                  <button
                    key={preset.name}
                    type="button"
                    onClick={() => handleSelectPreset(preset)}
                    className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-semibold transition ${
                      formName.toLowerCase() === preset.name.toLowerCase()
                        ? 'bg-cyan-600 text-white'
                        : 'bg-zinc-100 text-zinc-700 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300'
                    }`}
                  >
                    <CategoryIcon name={preset.icon} className="h-3 w-3" />
                    <span>{preset.name}</span>
                  </button>
                ))}
              </div>
            </div>

            <form onSubmit={handleAddSubmit} className="mt-4 space-y-4">
              {formErrorMessage && (
                <div className="flex items-center gap-2 rounded-xl bg-rose-50 p-3 text-xs font-semibold text-rose-700 dark:bg-rose-950/40 dark:text-rose-300">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{formErrorMessage}</span>
                </div>
              )}

              {/* Nom de l'objectif */}
              <div>
                <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                  Nom de l'objectif *
                </label>
                <input
                  type="text"
                  required
                  value={formName}
                  onChange={e => setFormName(e.target.value)}
                  placeholder="ex. Terrain, Voiture, Maison, Voyage, Études, Urgence..."
                  className="w-full rounded-xl border border-zinc-300 bg-transparent px-3.5 py-2.5 text-sm font-medium text-zinc-900 focus:border-cyan-500 focus:outline-hidden dark:border-zinc-700 dark:text-zinc-100"
                />
              </div>

              {/* Montant Cible & Montant déjà épargné */}
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                    Montant cible (en FCFA) *
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      required
                      min="1000"
                      step="1000"
                      value={formTargetAmount}
                      onChange={e => setFormTargetAmount(e.target.value)}
                      placeholder="ex. 2000000"
                      className="w-full rounded-xl border border-zinc-300 bg-transparent px-3.5 py-2.5 text-sm font-bold text-zinc-900 focus:border-cyan-500 focus:outline-hidden dark:border-zinc-700 dark:text-zinc-100"
                    />
                    <span className="absolute right-3 top-2.5 text-xs font-bold text-zinc-400">
                      FCFA
                    </span>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                    Montant déjà épargné (en FCFA)
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      min="0"
                      step="1000"
                      value={formInitialAmount}
                      onChange={e => setFormInitialAmount(e.target.value)}
                      placeholder="ex. 250000"
                      className="w-full rounded-xl border border-zinc-300 bg-transparent px-3.5 py-2.5 text-sm font-semibold text-zinc-900 focus:border-cyan-500 focus:outline-hidden dark:border-zinc-700 dark:text-zinc-100"
                    />
                    <span className="absolute right-3 top-2.5 text-xs font-bold text-zinc-400">
                      FCFA
                    </span>
                  </div>
                </div>
              </div>

              {/* Date limite facultative */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300">
                    Date limite souhaitée (facultative)
                  </label>
                  {formTargetDate && (
                    <button
                      type="button"
                      onClick={() => setFormTargetDate('')}
                      className="text-[11px] font-semibold text-rose-600 hover:underline"
                    >
                      Effacer la date
                    </button>
                  )}
                </div>
                <input
                  type="date"
                  value={formTargetDate}
                  onChange={e => setFormTargetDate(e.target.value)}
                  className="w-full rounded-xl border border-zinc-300 bg-transparent px-3.5 py-2.5 text-sm text-zinc-900 focus:border-cyan-500 focus:outline-hidden dark:border-zinc-700 dark:text-zinc-100"
                />
              </div>

              {/* Description facultative */}
              <div>
                <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                  Description / Note (facultative)
                </label>
                <textarea
                  rows={2}
                  value={formDescription}
                  onChange={e => setFormDescription(e.target.value)}
                  placeholder="Détails sur l'emplacement du terrain, modèle de véhicule, établissement scolaire..."
                  className="w-full rounded-xl border border-zinc-300 bg-transparent px-3.5 py-2 text-sm text-zinc-900 focus:border-cyan-500 focus:outline-hidden dark:border-zinc-700 dark:text-zinc-100"
                />
              </div>

              {/* Choix de l'icône */}
              <div>
                <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1.5">
                  Icône représentative
                </label>
                <div className="flex flex-wrap gap-2">
                  {SELECTABLE_ICONS.map(icName => (
                    <button
                      key={icName}
                      type="button"
                      onClick={() => setFormIcon(icName)}
                      className={`flex h-9 w-9 items-center justify-center rounded-xl border transition ${
                        formIcon === icName
                          ? 'border-cyan-600 bg-cyan-50 text-cyan-800 dark:bg-cyan-950 dark:text-cyan-300'
                          : 'border-zinc-200 text-zinc-600 hover:bg-zinc-50 dark:border-zinc-800 dark:text-zinc-400'
                      }`}
                    >
                      <CategoryIcon name={icName} className="h-4 w-4" />
                    </button>
                  ))}
                </div>
              </div>

              {/* Boutons d'action */}
              <div className="flex gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 rounded-xl border border-zinc-200 py-2.5 text-xs font-bold text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="flex-1 rounded-xl bg-cyan-700 py-2.5 text-xs font-bold text-white shadow-md hover:bg-cyan-800"
                >
                  Créer l'objectif
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Modifier un objectif */}
      {editingGoal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-2xs">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl dark:bg-zinc-900 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-zinc-100 pb-3 dark:border-zinc-800">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-cyan-100 text-cyan-800 dark:bg-cyan-950 dark:text-cyan-300">
                  <Edit2 className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
                    Modifier l'objectif
                  </h3>
                  <p className="text-xs text-zinc-500">Mise à jour dans Room</p>
                </div>
              </div>
              <button
                onClick={() => setEditingGoal(null)}
                className="rounded-lg p-1 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 dark:hover:bg-zinc-800"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="mt-4 space-y-4">
              {formErrorMessage && (
                <div className="flex items-center gap-2 rounded-xl bg-rose-50 p-3 text-xs font-semibold text-rose-700 dark:bg-rose-950/40 dark:text-rose-300">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{formErrorMessage}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                  Nom de l'objectif *
                </label>
                <input
                  type="text"
                  required
                  value={formName}
                  onChange={e => setFormName(e.target.value)}
                  className="w-full rounded-xl border border-zinc-300 bg-transparent px-3.5 py-2.5 text-sm font-medium text-zinc-900 focus:border-cyan-500 focus:outline-hidden dark:border-zinc-700 dark:text-zinc-100"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                  Montant cible (en FCFA) *
                </label>
                <div className="relative">
                  <input
                    type="number"
                    required
                    min="1000"
                    step="1000"
                    value={formTargetAmount}
                    onChange={e => setFormTargetAmount(e.target.value)}
                    className="w-full rounded-xl border border-zinc-300 bg-transparent px-3.5 py-2.5 text-sm font-bold text-zinc-900 focus:border-cyan-500 focus:outline-hidden dark:border-zinc-700 dark:text-zinc-100"
                  />
                  <span className="absolute right-3 top-2.5 text-xs font-bold text-zinc-400">
                    FCFA
                  </span>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300">
                    Date limite (facultative)
                  </label>
                  {formTargetDate && (
                    <button
                      type="button"
                      onClick={() => setFormTargetDate('')}
                      className="text-[11px] font-semibold text-rose-600 hover:underline"
                    >
                      Supprimer la date
                    </button>
                  )}
                </div>
                <input
                  type="date"
                  value={formTargetDate}
                  onChange={e => setFormTargetDate(e.target.value)}
                  className="w-full rounded-xl border border-zinc-300 bg-transparent px-3.5 py-2.5 text-sm text-zinc-900 focus:border-cyan-500 focus:outline-hidden dark:border-zinc-700 dark:text-zinc-100"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                  Description / Note (facultative)
                </label>
                <textarea
                  rows={2}
                  value={formDescription}
                  onChange={e => setFormDescription(e.target.value)}
                  className="w-full rounded-xl border border-zinc-300 bg-transparent px-3.5 py-2 text-sm text-zinc-900 focus:border-cyan-500 focus:outline-hidden dark:border-zinc-700 dark:text-zinc-100"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1.5">
                  Icône
                </label>
                <div className="flex flex-wrap gap-2">
                  {SELECTABLE_ICONS.map(icName => (
                    <button
                      key={icName}
                      type="button"
                      onClick={() => setFormIcon(icName)}
                      className={`flex h-9 w-9 items-center justify-center rounded-xl border transition ${
                        formIcon === icName
                          ? 'border-cyan-600 bg-cyan-50 text-cyan-800 dark:bg-cyan-950 dark:text-cyan-300'
                          : 'border-zinc-200 text-zinc-600 hover:bg-zinc-50 dark:border-zinc-800 dark:text-zinc-400'
                      }`}
                    >
                      <CategoryIcon name={icName} className="h-4 w-4" />
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingGoal(null)}
                  className="flex-1 rounded-xl border border-zinc-200 py-2.5 text-xs font-bold text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="flex-1 rounded-xl bg-cyan-700 py-2.5 text-xs font-bold text-white shadow-md hover:bg-cyan-800"
                >
                  Enregistrer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Ajouter un dépôt */}
      {activeDepositGoal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-2xs">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl dark:bg-zinc-900">
            <div className="flex items-center justify-between border-b border-zinc-100 pb-3 dark:border-zinc-800">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                  <ArrowDownLeft className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
                    Ajouter un dépôt
                  </h3>
                  <p className="text-xs text-zinc-500">Vers « {activeDepositGoal.name} »</p>
                </div>
              </div>
              <button
                onClick={() => setActiveDepositGoal(null)}
                className="rounded-lg p-1 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 dark:hover:bg-zinc-800"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Current progress pill */}
            <div className="mt-4 rounded-2xl bg-zinc-50 p-3.5 dark:bg-zinc-800/60">
              <div className="flex items-center justify-between text-xs">
                <span className="text-zinc-500 dark:text-zinc-400">Solde actuel :</span>
                <span className="font-extrabold text-zinc-900 dark:text-zinc-100">
                  {formatFCFA(activeDepositGoal.currentAmount)} /{' '}
                  {formatFCFA(activeDepositGoal.targetAmount)}
                </span>
              </div>
              <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-700">
                <div
                  className="h-full rounded-full bg-emerald-500 transition-all duration-300"
                  style={{
                    width: `${Math.min(
                      100,
                      Math.round(
                        (activeDepositGoal.currentAmount / activeDepositGoal.targetAmount) * 100
                      )
                    )}%`
                  }}
                />
              </div>
            </div>

            <form onSubmit={handleDepositSubmit} className="mt-4 space-y-4">
              {depositError && (
                <div className="flex items-center gap-2 rounded-xl bg-rose-50 p-3 text-xs font-semibold text-rose-700 dark:bg-rose-950/40 dark:text-rose-300">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{depositError}</span>
                </div>
              )}

              {/* Quick chip amounts */}
              <div>
                <label className="block text-xs font-semibold text-zinc-500 dark:text-zinc-400 mb-1.5">
                  Montants rapides :
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {[10000, 25000, 50000, 100000, 250000].map(amt => (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => setDepositAmount(amt.toString())}
                      className="rounded-lg bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-800 hover:bg-emerald-100 dark:bg-emerald-950/60 dark:text-emerald-300"
                    >
                      +{formatFCFA(amt)}
                    </button>
                  ))}
                </div>
              </div>

              {/* Amount input */}
              <div>
                <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                  Montant du versement (en FCFA) *
                </label>
                <div className="relative">
                  <input
                    type="number"
                    required
                    min="500"
                    step="500"
                    autoFocus
                    value={depositAmount}
                    onChange={e => setDepositAmount(e.target.value)}
                    placeholder="ex. 50000"
                    className="w-full rounded-xl border border-zinc-300 bg-transparent px-3.5 py-2.5 text-base font-black text-zinc-900 focus:border-emerald-500 focus:outline-hidden dark:border-zinc-700 dark:text-zinc-100"
                  />
                  <span className="absolute right-3 top-3 text-xs font-bold text-zinc-400">
                    FCFA
                  </span>
                </div>
              </div>

              {/* Date du dépôt */}
              <div>
                <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                  Date du versement
                </label>
                <input
                  type="date"
                  value={depositDate}
                  onChange={e => setDepositDate(e.target.value)}
                  className="w-full rounded-xl border border-zinc-300 bg-transparent px-3.5 py-2.5 text-sm text-zinc-900 focus:border-emerald-500 focus:outline-hidden dark:border-zinc-700 dark:text-zinc-100"
                />
              </div>

              {/* Note / Motif */}
              <div>
                <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                  Motif / Note (facultatif)
                </label>
                <input
                  type="text"
                  value={depositNote}
                  onChange={e => setDepositNote(e.target.value)}
                  placeholder="ex. Virement sur salaire, tontine, prime trimestrielle"
                  className="w-full rounded-xl border border-zinc-300 bg-transparent px-3.5 py-2 text-sm text-zinc-900 focus:border-emerald-500 focus:outline-hidden dark:border-zinc-700 dark:text-zinc-100"
                />
              </div>

              {/* Projection preview */}
              {Number(depositAmount) > 0 && (
                <div className="rounded-xl border border-emerald-200 bg-emerald-50/60 p-3 text-xs text-emerald-900 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-300">
                  <div className="flex items-center justify-between font-semibold">
                    <span>Nouveau solde épargné :</span>
                    <span className="font-extrabold">
                      {formatFCFA(activeDepositGoal.currentAmount + Number(depositAmount))}
                    </span>
                  </div>
                  <div className="mt-1 flex items-center justify-between text-[11px] text-emerald-700 dark:text-emerald-400">
                    <span>Nouvelle progression :</span>
                    <span className="font-bold">
                      {Math.round(
                        ((activeDepositGoal.currentAmount + Number(depositAmount)) /
                          activeDepositGoal.targetAmount) *
                          100
                      )}
                      %
                    </span>
                  </div>
                </div>
              )}

              <div className="flex gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setActiveDepositGoal(null)}
                  className="flex-1 rounded-xl border border-zinc-200 py-2.5 text-xs font-bold text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="flex-1 rounded-xl bg-emerald-600 py-2.5 text-xs font-bold text-white shadow-md hover:bg-emerald-700"
                >
                  Confirmer le dépôt
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Retirer une somme */}
      {activeWithdrawGoal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-2xs">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl dark:bg-zinc-900">
            <div className="flex items-center justify-between border-b border-zinc-100 pb-3 dark:border-zinc-800">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300">
                  <ArrowUpRight className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
                    Retirer de l'épargne
                  </h3>
                  <p className="text-xs text-zinc-500">Depuis « {activeWithdrawGoal.name} »</p>
                </div>
              </div>
              <button
                onClick={() => setActiveWithdrawGoal(null)}
                className="rounded-lg p-1 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 dark:hover:bg-zinc-800"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Available to withdraw banner */}
            <div className="mt-4 rounded-2xl bg-rose-50/70 p-3.5 dark:bg-rose-950/40">
              <div className="flex items-center justify-between text-xs">
                <span className="text-rose-800 dark:text-rose-300 font-semibold">
                  Solde disponible au retrait :
                </span>
                <span className="font-extrabold text-rose-700 dark:text-rose-200">
                  {formatFCFA(activeWithdrawGoal.currentAmount)}
                </span>
              </div>
            </div>

            <form onSubmit={handleWithdrawSubmit} className="mt-4 space-y-4">
              {withdrawError && (
                <div className="flex items-center gap-2 rounded-xl bg-rose-100 p-3 text-xs font-semibold text-rose-800 dark:bg-rose-950 dark:text-rose-200">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{withdrawError}</span>
                </div>
              )}

              {/* Quick % chips */}
              <div>
                <label className="block text-xs font-semibold text-zinc-500 dark:text-zinc-400 mb-1.5">
                  Raccourcis :
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {[0.25, 0.5, 0.75, 1].map(ratio => {
                    const calcAmt = Math.round(activeWithdrawGoal.currentAmount * ratio);
                    return (
                      <button
                        key={ratio}
                        type="button"
                        onClick={() => setWithdrawAmount(calcAmt.toString())}
                        className="rounded-lg bg-zinc-100 px-2.5 py-1 text-xs font-semibold text-zinc-700 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300"
                      >
                        {ratio === 1 ? 'Tout retirer' : `${ratio * 100}%`} ({formatFCFA(calcAmt)})
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Amount input */}
              <div>
                <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                  Montant à retirer (en FCFA) *
                </label>
                <div className="relative">
                  <input
                    type="number"
                    required
                    min="500"
                    step="500"
                    max={activeWithdrawGoal.currentAmount}
                    autoFocus
                    value={withdrawAmount}
                    onChange={e => setWithdrawAmount(e.target.value)}
                    placeholder="ex. 25000"
                    className="w-full rounded-xl border border-zinc-300 bg-transparent px-3.5 py-2.5 text-base font-black text-zinc-900 focus:border-rose-500 focus:outline-hidden dark:border-zinc-700 dark:text-zinc-100"
                  />
                  <span className="absolute right-3 top-3 text-xs font-bold text-zinc-400">
                    FCFA
                  </span>
                </div>
              </div>

              {/* Date */}
              <div>
                <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                  Date du retrait
                </label>
                <input
                  type="date"
                  value={withdrawDate}
                  onChange={e => setWithdrawDate(e.target.value)}
                  className="w-full rounded-xl border border-zinc-300 bg-transparent px-3.5 py-2.5 text-sm text-zinc-900 focus:border-rose-500 focus:outline-hidden dark:border-zinc-700 dark:text-zinc-100"
                />
              </div>

              {/* Motif */}
              <div>
                <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                  Motif du retrait (facultatif)
                </label>
                <input
                  type="text"
                  value={withdrawNote}
                  onChange={e => setWithdrawNote(e.target.value)}
                  placeholder="ex. Acompte achat, dépense imprévue, santé"
                  className="w-full rounded-xl border border-zinc-300 bg-transparent px-3.5 py-2 text-sm text-zinc-900 focus:border-rose-500 focus:outline-hidden dark:border-zinc-700 dark:text-zinc-100"
                />
              </div>

              {/* Projection preview */}
              {Number(withdrawAmount) > 0 &&
                Number(withdrawAmount) <= activeWithdrawGoal.currentAmount && (
                  <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-3 text-xs text-zinc-700 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
                    <div className="flex items-center justify-between font-semibold">
                      <span>Solde restant sur l'objectif :</span>
                      <span className="font-extrabold">
                        {formatFCFA(activeWithdrawGoal.currentAmount - Number(withdrawAmount))}
                      </span>
                    </div>
                  </div>
                )}

              <div className="flex gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setActiveWithdrawGoal(null)}
                  className="flex-1 rounded-xl border border-zinc-200 py-2.5 text-xs font-bold text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="flex-1 rounded-xl bg-rose-600 py-2.5 text-xs font-bold text-white shadow-md hover:bg-rose-700"
                >
                  Confirmer le retrait
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Historique des mouvements */}
      {activeHistoryGoal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-2xs">
          <div className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl dark:bg-zinc-900 max-h-[90vh] flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-zinc-100 pb-3 dark:border-zinc-800">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-cyan-100 text-cyan-800 dark:bg-cyan-950 dark:text-cyan-300">
                  <History className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
                    Historique des mouvements
                  </h3>
                  <p className="text-xs text-zinc-500">« {activeHistoryGoal.name} »</p>
                </div>
              </div>
              <button
                onClick={() => setActiveHistoryGoal(null)}
                className="rounded-lg p-1 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 dark:hover:bg-zinc-800"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Quick stats banner */}
            <div className="mt-4 grid grid-cols-3 gap-2 rounded-2xl bg-zinc-50 p-3 text-center dark:bg-zinc-800/60">
              <div>
                <span className="text-[10px] text-zinc-400 font-semibold uppercase">Total épargné</span>
                <p className="text-xs font-bold text-zinc-900 dark:text-zinc-100 sm:text-sm">
                  {formatFCFA(activeHistoryGoal.currentAmount)}
                </p>
              </div>
              <div>
                <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold uppercase">
                  Total versé (+)
                </span>
                <p className="text-xs font-bold text-emerald-700 dark:text-emerald-400 sm:text-sm">
                  +{formatFCFA(historyStats.totalDeposits)}
                </p>
              </div>
              <div>
                <span className="text-[10px] text-rose-600 dark:text-rose-400 font-semibold uppercase">
                  Total retiré (-)
                </span>
                <p className="text-xs font-bold text-rose-700 dark:text-rose-400 sm:text-sm">
                  -{formatFCFA(historyStats.totalWithdrawals)}
                </p>
              </div>
            </div>

            {/* Filter tabs */}
            <div className="mt-3 flex items-center gap-1.5 border-b border-zinc-100 pb-2 dark:border-zinc-800">
              <button
                onClick={() => setHistoryFilter('ALL')}
                className={`rounded-lg px-3 py-1 text-xs font-bold transition ${
                  historyFilter === 'ALL'
                    ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900'
                    : 'text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800'
                }`}
              >
                Tous ({historyStats.count})
              </button>
              <button
                onClick={() => setHistoryFilter('DEPOSIT')}
                className={`rounded-lg px-3 py-1 text-xs font-bold transition ${
                  historyFilter === 'DEPOSIT'
                    ? 'bg-emerald-600 text-white'
                    : 'text-emerald-700 hover:bg-emerald-50 dark:text-emerald-400'
                }`}
              >
                Dépôts (+)
              </button>
              <button
                onClick={() => setHistoryFilter('WITHDRAWAL')}
                className={`rounded-lg px-3 py-1 text-xs font-bold transition ${
                  historyFilter === 'WITHDRAWAL'
                    ? 'bg-rose-600 text-white'
                    : 'text-rose-700 hover:bg-rose-50 dark:text-rose-400'
                }`}
              >
                Retraits (-)
              </button>
            </div>

            {/* Movement list */}
            <div className="mt-2 flex-1 overflow-y-auto space-y-2 pr-1 min-h-[220px]">
              {goalMovements.length === 0 ? (
                <div className="py-12 text-center text-xs text-zinc-400">
                  Aucun mouvement enregistré pour ce filtre.
                </div>
              ) : (
                goalMovements.map(m => {
                  const isDep = m.type === 'DEPOSIT';
                  return (
                    <div
                      key={m.id}
                      className="flex items-center justify-between rounded-xl border border-zinc-100 bg-zinc-50/50 p-3 transition hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-800/40"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`flex h-8 w-8 items-center justify-center rounded-lg ${
                            isDep
                              ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                              : 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300'
                          }`}
                        >
                          {isDep ? (
                            <ArrowDownLeft className="h-4 w-4" />
                          ) : (
                            <ArrowUpRight className="h-4 w-4" />
                          )}
                        </div>
                        <div>
                          <p className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
                            {isDep ? 'Versement d’épargne' : 'Retrait d’épargne'}
                          </p>
                          <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                            {m.date} {m.note ? `• ${m.note}` : ''}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <span
                          className={`text-xs font-extrabold ${
                            isDep
                              ? 'text-emerald-600 dark:text-emerald-400'
                              : 'text-rose-600 dark:text-rose-400'
                          }`}
                        >
                          {isDep ? '+' : '-'}
                          {formatFCFA(m.amount)}
                        </span>
                        {onDeleteMovement && (
                          <button
                            onClick={() => {
                              if (confirm('Supprimer ce mouvement et réajuster le solde ?')) {
                                onDeleteMovement(m.id);
                                triggerToast('Mouvement supprimé et solde recalculé.');
                              }
                            }}
                            className="p-1 text-zinc-400 hover:text-rose-600"
                            title="Supprimer ce mouvement"
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Quick actions in history footer */}
            <div className="mt-4 flex gap-2 border-t border-zinc-100 pt-3 dark:border-zinc-800">
              <button
                onClick={() => {
                  setActiveDepositGoal(activeHistoryGoal);
                  setActiveHistoryGoal(null);
                }}
                className="flex-1 rounded-xl bg-emerald-600 py-2 text-xs font-bold text-white hover:bg-emerald-700"
              >
                + Effectuer un versement
              </button>
              <button
                onClick={() => {
                  setActiveWithdrawGoal(activeHistoryGoal);
                  setActiveHistoryGoal(null);
                }}
                disabled={activeHistoryGoal.currentAmount <= 0}
                className="flex-1 rounded-xl border border-rose-200 bg-rose-50 py-2 text-xs font-bold text-rose-700 hover:bg-rose-100 disabled:opacity-40"
              >
                - Effectuer un retrait
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Confirmation Suppression */}
      {goalToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-2xs">
          <div className="w-full max-w-sm rounded-3xl bg-white p-6 shadow-2xl dark:bg-zinc-900">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-100 text-rose-600 dark:bg-rose-950 dark:text-rose-300">
              <Trash2 className="h-6 w-6" />
            </div>
            <h3 className="mt-3 text-center text-base font-bold text-zinc-900 dark:text-zinc-100">
              Supprimer cet objectif ?
            </h3>
            <p className="mt-1 text-center text-xs text-zinc-500">
              Êtes-vous sûr de vouloir supprimer définitivement «{' '}
              <span className="font-bold text-zinc-900 dark:text-zinc-100">{goalToDelete.name}</span>{' '}
              » ({formatFCFA(goalToDelete.currentAmount)} épargnés) ainsi que tous ses mouvements
              associés dans Room ?
            </p>

            <div className="mt-5 flex gap-2">
              <button
                onClick={() => setGoalToDelete(null)}
                className="flex-1 rounded-xl border border-zinc-200 py-2.5 text-xs font-bold text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300"
              >
                Annuler
              </button>
              <button
                onClick={() => {
                  onDeleteSavingsGoal(goalToDelete.id);
                  triggerToast(`Objectif « ${goalToDelete.name} » supprimé.`);
                  setGoalToDelete(null);
                }}
                className="flex-1 rounded-xl bg-rose-600 py-2.5 text-xs font-bold text-white shadow-md hover:bg-rose-700"
              >
                Supprimer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
