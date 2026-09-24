import { Transaction, Budget, SavingsGoal, SavingsMovement, Category } from '../types';

const now = new Date();
const currentMonth = now.getMonth();
const currentYear = now.getFullYear();

export const INITIAL_EXPENSE_CATEGORIES: Category[] = [
  { id: 'cat-exp-1', name: 'Alimentation', type: 'EXPENSE', icon: 'Utensils', color: '#ef4444', isCustom: false },
  { id: 'cat-exp-2', name: 'Transport', type: 'EXPENSE', icon: 'Car', color: '#f97316', isCustom: false },
  { id: 'cat-exp-3', name: 'Logement', type: 'EXPENSE', icon: 'Home', color: '#8b5cf6', isCustom: false },
  { id: 'cat-exp-4', name: 'Électricité', type: 'EXPENSE', icon: 'Zap', color: '#eab308', isCustom: false },
  { id: 'cat-exp-5', name: 'Eau', type: 'EXPENSE', icon: 'Droplets', color: '#06b6d4', isCustom: false },
  { id: 'cat-exp-6', name: 'Internet', type: 'EXPENSE', icon: 'Wifi', color: '#3b82f6', isCustom: false },
  { id: 'cat-exp-7', name: 'Téléphone', type: 'EXPENSE', icon: 'Phone', color: '#14b8a6', isCustom: false },
  { id: 'cat-exp-8', name: 'Santé', type: 'EXPENSE', icon: 'HeartPulse', color: '#ec4899', isCustom: false },
  { id: 'cat-exp-9', name: 'Éducation', type: 'EXPENSE', icon: 'GraduationCap', color: '#6366f1', isCustom: false },
  { id: 'cat-exp-10', name: 'Vêtements', type: 'EXPENSE', icon: 'Shirt', color: '#d946ef', isCustom: false },
  { id: 'cat-exp-11', name: 'Loisirs', type: 'EXPENSE', icon: 'Gamepad2', color: '#10b981', isCustom: false },
  { id: 'cat-exp-12', name: 'Famille', type: 'EXPENSE', icon: 'Users', color: '#f43f5e', isCustom: false },
  { id: 'cat-exp-13', name: 'Dettes', type: 'EXPENSE', icon: 'CreditCard', color: '#64748b', isCustom: false },
  { id: 'cat-exp-14', name: 'Abonnements', type: 'EXPENSE', icon: 'Tv', color: '#a855f7', isCustom: false },
  { id: 'cat-exp-15', name: 'Autre', type: 'EXPENSE', icon: 'MoreHorizontal', color: '#94a3b8', isCustom: false }
];

export const INITIAL_INCOME_CATEGORIES: Category[] = [
  { id: 'cat-inc-1', name: 'Salaire', type: 'INCOME', icon: 'Briefcase', color: '#10b981', isCustom: false },
  { id: 'cat-inc-2', name: 'Activité commerciale', type: 'INCOME', icon: 'Store', color: '#059669', isCustom: false },
  { id: 'cat-inc-3', name: 'Prime', type: 'INCOME', icon: 'Award', color: '#0284c7', isCustom: false },
  { id: 'cat-inc-4', name: 'Bonus', type: 'INCOME', icon: 'Sparkles', color: '#f59e0b', isCustom: false },
  { id: 'cat-inc-5', name: 'Transfert reçu', type: 'INCOME', icon: 'ArrowDownToLine', color: '#14b8a6', isCustom: false },
  { id: 'cat-inc-6', name: 'Autre', type: 'INCOME', icon: 'MoreHorizontal', color: '#64748b', isCustom: false }
];

export const INITIAL_CATEGORIES: Category[] = [
  ...INITIAL_EXPENSE_CATEGORIES,
  ...INITIAL_INCOME_CATEGORIES
];

export const INITIAL_TRANSACTIONS: Transaction[] = [
  {
    id: 'tx-1',
    description: 'Salaire mensuel',
    title: 'Salaire mensuel',
    amount: 550000,
    type: 'INCOME',
    category: 'Salaire',
    date: new Date(currentYear, currentMonth, 1).toISOString().split('T')[0],
    timestamp: new Date(currentYear, currentMonth, 1, 9, 30).getTime(),
    paymentMethod: 'Compte bancaire',
    note: 'Salaire principal versé'
  },
  {
    id: 'tx-2',
    description: 'Paiement Loyer',
    title: 'Paiement Loyer',
    amount: 140000,
    type: 'EXPENSE',
    category: 'Logement',
    date: new Date(currentYear, currentMonth, 2).toISOString().split('T')[0],
    timestamp: new Date(currentYear, currentMonth, 2, 14, 0).getTime(),
    paymentMethod: 'Compte bancaire',
    note: 'Loyer mensuel appartement'
  },
  {
    id: 'tx-3',
    description: 'Courses supermarché',
    title: 'Courses supermarché',
    amount: 48500,
    type: 'EXPENSE',
    category: 'Alimentation',
    date: new Date(currentYear, currentMonth, 5).toISOString().split('T')[0],
    timestamp: new Date(currentYear, currentMonth, 5, 17, 45).getTime(),
    paymentMethod: 'Orange Money',
    note: 'Provisions du mois'
  },
  {
    id: 'tx-4',
    description: 'Vente boutique / Prestation',
    title: 'Vente boutique / Prestation',
    amount: 120000,
    type: 'INCOME',
    category: 'Activité commerciale',
    date: new Date(currentYear, currentMonth, 8).toISOString().split('T')[0],
    timestamp: new Date(currentYear, currentMonth, 8, 11, 20).getTime(),
    paymentMethod: 'MTN Mobile Money',
    note: 'Recettes boutique'
  },
  {
    id: 'tx-5',
    description: 'Facture Électricité Eneo',
    title: 'Facture Électricité Eneo',
    amount: 22000,
    type: 'EXPENSE',
    category: 'Électricité',
    date: new Date(currentYear, currentMonth, 10).toISOString().split('T')[0],
    timestamp: new Date(currentYear, currentMonth, 10, 16, 10).getTime(),
    paymentMethod: 'MTN Mobile Money',
    note: 'Consommation électrique'
  },
  {
    id: 'tx-6',
    description: 'Carburant & Déplacements',
    title: 'Carburant & Déplacements',
    amount: 25000,
    type: 'EXPENSE',
    category: 'Transport',
    date: new Date(currentYear, currentMonth, 12).toISOString().split('T')[0],
    timestamp: new Date(currentYear, currentMonth, 12, 8, 15).getTime(),
    paymentMethod: 'Espèces',
    note: 'Plein carburant véhicule'
  },
  {
    id: 'tx-7',
    description: 'Pharmacie & Soins',
    title: 'Pharmacie & Soins',
    amount: 17500,
    type: 'EXPENSE',
    category: 'Santé',
    date: new Date(currentYear, currentMonth, 15).toISOString().split('T')[0],
    timestamp: new Date(currentYear, currentMonth, 15, 12, 0).getTime(),
    paymentMethod: 'Orange Money',
    note: 'Médicaments prescrits'
  },
  {
    id: 'tx-8',
    description: 'Abonnement Internet fibre',
    title: 'Abonnement Internet fibre',
    amount: 25000,
    type: 'EXPENSE',
    category: 'Internet',
    date: new Date(currentYear, currentMonth, 16).toISOString().split('T')[0],
    timestamp: new Date(currentYear, currentMonth, 16, 10, 0).getTime(),
    paymentMethod: 'MTN Mobile Money',
    note: 'Forfait mensuel fibre'
  },
  {
    id: 'tx-9',
    description: 'Prime de performance',
    title: 'Prime de performance',
    amount: 75000,
    type: 'INCOME',
    category: 'Prime',
    date: new Date(currentYear, currentMonth, 18, 12, 0).toISOString().split('T')[0],
    timestamp: new Date(currentYear, currentMonth, 18, 15, 0).getTime(),
    paymentMethod: 'Compte bancaire',
    note: 'Prime trimestrielle'
  },
  // Mois précédent (Mois - 1)
  {
    id: 'tx-prev-1',
    description: 'Salaire mensuel M-1',
    title: 'Salaire mensuel M-1',
    amount: 550000,
    type: 'INCOME',
    category: 'Salaire',
    date: new Date(currentYear, currentMonth - 1, 1, 12, 0).toISOString().split('T')[0],
    timestamp: new Date(currentYear, currentMonth - 1, 1, 9, 30).getTime(),
    paymentMethod: 'Compte bancaire',
    note: 'Salaire principal'
  },
  {
    id: 'tx-prev-2',
    description: 'Loyer mensuel M-1',
    title: 'Loyer mensuel M-1',
    amount: 140000,
    type: 'EXPENSE',
    category: 'Logement',
    date: new Date(currentYear, currentMonth - 1, 3, 12, 0).toISOString().split('T')[0],
    timestamp: new Date(currentYear, currentMonth - 1, 3, 14, 0).getTime(),
    paymentMethod: 'Compte bancaire',
    note: 'Loyer appartement'
  },
  {
    id: 'tx-prev-3',
    description: 'Courses alimentation M-1',
    title: 'Courses alimentation M-1',
    amount: 65000,
    type: 'EXPENSE',
    category: 'Alimentation',
    date: new Date(currentYear, currentMonth - 1, 7, 12, 0).toISOString().split('T')[0],
    timestamp: new Date(currentYear, currentMonth - 1, 7, 16, 0).getTime(),
    paymentMethod: 'Orange Money',
    note: 'Ravitaillement'
  },
  {
    id: 'tx-prev-4',
    description: 'Activité freelance & conseils M-1',
    title: 'Activité freelance & conseils M-1',
    amount: 90000,
    type: 'INCOME',
    category: 'Activité commerciale',
    date: new Date(currentYear, currentMonth - 1, 14, 12, 0).toISOString().split('T')[0],
    timestamp: new Date(currentYear, currentMonth - 1, 14, 11, 0).getTime(),
    paymentMethod: 'MTN Mobile Money',
    note: 'Prestation conseil'
  },
  {
    id: 'tx-prev-5',
    description: 'Carburant et entretien M-1',
    title: 'Carburant et entretien M-1',
    amount: 32000,
    type: 'EXPENSE',
    category: 'Transport',
    date: new Date(currentYear, currentMonth - 1, 20, 12, 0).toISOString().split('T')[0],
    timestamp: new Date(currentYear, currentMonth - 1, 20, 10, 0).getTime(),
    paymentMethod: 'Espèces',
    note: 'Transport et vidange'
  },
  // 2 mois auparavant (Mois - 2)
  {
    id: 'tx-prev2-1',
    description: 'Salaire mensuel M-2',
    title: 'Salaire mensuel M-2',
    amount: 550000,
    type: 'INCOME',
    category: 'Salaire',
    date: new Date(currentYear, currentMonth - 2, 1, 12, 0).toISOString().split('T')[0],
    timestamp: new Date(currentYear, currentMonth - 2, 1, 9, 30).getTime(),
    paymentMethod: 'Compte bancaire',
    note: 'Salaire'
  },
  {
    id: 'tx-prev2-2',
    description: 'Loyer M-2',
    title: 'Loyer M-2',
    amount: 140000,
    type: 'EXPENSE',
    category: 'Logement',
    date: new Date(currentYear, currentMonth - 2, 2, 12, 0).toISOString().split('T')[0],
    timestamp: new Date(currentYear, currentMonth - 2, 2, 14, 0).getTime(),
    paymentMethod: 'Compte bancaire',
    note: 'Loyer'
  },
  {
    id: 'tx-prev2-3',
    description: 'Alimentation du mois M-2',
    title: 'Alimentation du mois M-2',
    amount: 58000,
    type: 'EXPENSE',
    category: 'Alimentation',
    date: new Date(currentYear, currentMonth - 2, 10, 12, 0).toISOString().split('T')[0],
    timestamp: new Date(currentYear, currentMonth - 2, 10, 17, 0).getTime(),
    paymentMethod: 'Orange Money',
    note: 'Alimentation'
  }
];

export const INITIAL_BUDGETS: Budget[] = [
  {
    id: 'b-global',
    category: 'GLOBAL',
    allocatedAmount: 400000,
    month: currentMonth,
    year: currentYear,
    isGlobal: true
  },
  {
    id: 'b-1',
    category: 'Logement',
    allocatedAmount: 180000,
    month: currentMonth,
    year: currentYear,
    isGlobal: false
  },
  {
    id: 'b-2',
    category: 'Alimentation',
    allocatedAmount: 120000,
    month: currentMonth,
    year: currentYear,
    isGlobal: false
  },
  {
    id: 'b-3',
    category: 'Transport',
    allocatedAmount: 60000,
    month: currentMonth,
    year: currentYear,
    isGlobal: false
  },
  {
    id: 'b-4',
    category: 'Électricité',
    allocatedAmount: 23000,
    month: currentMonth,
    year: currentYear,
    isGlobal: false
  },
  {
    id: 'b-5',
    category: 'Internet',
    allocatedAmount: 20000,
    month: currentMonth,
    year: currentYear,
    isGlobal: false
  },
  {
    id: 'b-6',
    category: 'Santé',
    allocatedAmount: 40000,
    month: currentMonth,
    year: currentYear,
    isGlobal: false
  }
];

export const INITIAL_SAVINGS_GOALS: SavingsGoal[] = [
  {
    id: 's-1',
    name: 'Fonds d’urgence',
    targetAmount: 1000000,
    currentAmount: 450000,
    targetDate: '2026-12-31',
    description: 'Réserve de sécurité pour imprévus médicaux et pannes',
    iconName: 'ShieldCheck'
  },
  {
    id: 's-2',
    name: 'Achat moto / Véhicule',
    targetAmount: 1500000,
    currentAmount: 600000,
    targetDate: '2026-11-30',
    description: 'Apport pour acquisition d’une moto ou véhicule',
    iconName: 'Car'
  },
  {
    id: 's-3',
    name: 'Terrain & Construction',
    targetAmount: 5000000,
    currentAmount: 850000,
    targetDate: '2027-06-30',
    description: 'Projet acquisition parcelle et début fondations',
    iconName: 'Home'
  }
];

export const INITIAL_SAVINGS_MOVEMENTS: SavingsMovement[] = [
  // Mouvements pour s-1 (Fonds d'urgence : 300 000 + 200 000 - 50 000 = 450 000)
  {
    id: 'sm-1',
    goalId: 's-1',
    type: 'DEPOSIT',
    amount: 300000,
    date: '2026-07-15',
    timestamp: new Date('2026-07-15T10:00:00').getTime(),
    note: 'Constitution du capital initial de sécurité'
  },
  {
    id: 'sm-2',
    goalId: 's-1',
    type: 'DEPOSIT',
    amount: 200000,
    date: '2026-08-25',
    timestamp: new Date('2026-08-25T14:30:00').getTime(),
    note: 'Versement prime semestrielle'
  },
  {
    id: 'sm-3',
    goalId: 's-1',
    type: 'WITHDRAWAL',
    amount: 50000,
    date: '2026-09-10',
    timestamp: new Date('2026-09-10T16:00:00').getTime(),
    note: 'Réparation d’urgence plomberie'
  },
  // Mouvements pour s-2 (Véhicule : 400 000 + 200 000 = 600 000)
  {
    id: 'sm-4',
    goalId: 's-2',
    type: 'DEPOSIT',
    amount: 400000,
    date: '2026-08-01',
    timestamp: new Date('2026-08-01T11:00:00').getTime(),
    note: 'Premier apport épargne transport'
  },
  {
    id: 'sm-5',
    goalId: 's-2',
    type: 'DEPOSIT',
    amount: 200000,
    date: '2026-09-05',
    timestamp: new Date('2026-09-05T09:15:00').getTime(),
    note: 'Économie sur prime mensuelle'
  },
  // Mouvements pour s-3 (Terrain : 500 000 + 350 000 = 850 000)
  {
    id: 'sm-6',
    goalId: 's-3',
    type: 'DEPOSIT',
    amount: 500000,
    date: '2026-07-20',
    timestamp: new Date('2026-07-20T12:00:00').getTime(),
    note: 'Dépôt initial projet foncier'
  },
  {
    id: 'sm-7',
    goalId: 's-3',
    type: 'DEPOSIT',
    amount: 350000,
    date: '2026-09-02',
    timestamp: new Date('2026-09-02T15:45:00').getTime(),
    note: 'Virement mensuel planifié'
  }
];
