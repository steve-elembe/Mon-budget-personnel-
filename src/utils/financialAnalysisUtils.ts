import {
  Transaction,
  Category,
  Budget,
  SavingsGoal,
  SavingsMovement,
  FinancialCalculatedContext
} from '../types';

const MONTH_NAMES = [
  'Janvier',
  'Février',
  'Mars',
  'Avril',
  'Mai',
  'Juin',
  'Juillet',
  'Août',
  'Septembre',
  'Octobre',
  'Novembre',
  'Décembre'
];

/**
 * Calcule avec exactitude les métriques financières réelles de l'utilisateur.
 * Ces calculs sont effectués localement pour garantir la véracité des chiffres,
 * et servent de base factuelle inaltérable à Gemini.
 */
export function calculateFinancialContext(
  transactions: Transaction[],
  categories: Category[],
  budgets: Budget[],
  savingsGoals: SavingsGoal[],
  savingsMovements: SavingsMovement[],
  currency: string = 'FCFA'
): FinancialCalculatedContext {
  const now = new Date();
  const currentMonthIdx = now.getMonth();
  const currentYear = now.getFullYear();

  // Filtrer les transactions du mois en cours
  const currentMonthTransactions = transactions.filter(t => {
    const d = new Date(t.date);
    return d.getMonth() === currentMonthIdx && d.getFullYear() === currentYear;
  });

  // Filtrer le mois précédent pour analyse de tendances
  const prevMonthDate = new Date(currentYear, currentMonthIdx - 1, 1);
  const prevMonthIdx = prevMonthDate.getMonth();
  const prevMonthYear = prevMonthDate.getFullYear();

  const prevMonthTransactions = transactions.filter(t => {
    const d = new Date(t.date);
    return d.getMonth() === prevMonthIdx && d.getFullYear() === prevMonthYear;
  });

  // Calcul revenus et dépenses du mois en cours
  const totalIncomeMonth = currentMonthTransactions
    .filter(t => t.type === 'INCOME')
    .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);

  const currentMonthExpensesList = currentMonthTransactions.filter(t => t.type === 'EXPENSE');
  const totalExpenseMonth = currentMonthExpensesList
    .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);

  const netSavingsMonth = totalIncomeMonth - totalExpenseMonth;
  const savingsRatePercentage = totalIncomeMonth > 0
    ? Math.round((netSavingsMonth / totalIncomeMonth) * 100)
    : 0;

  // Calcul dépenses par catégorie
  const expensesByCategoryMap = new Map<string, { amount: number; count: number }>();
  currentMonthExpensesList.forEach(t => {
    const cat = t.category || 'Non classé';
    const existing = expensesByCategoryMap.get(cat) || { amount: 0, count: 0 };
    expensesByCategoryMap.set(cat, {
      amount: existing.amount + (Number(t.amount) || 0),
      count: existing.count + 1
    });
  });

  const expenseCategoriesBreakdown = Array.from(expensesByCategoryMap.entries())
    .map(([cat, val]) => ({
      category: cat,
      amount: Math.round(val.amount),
      percentage: totalExpenseMonth > 0 ? Math.round((val.amount / totalExpenseMonth) * 100) : 0,
      transactionCount: val.count
    }))
    .sort((a, b) => b.amount - a.amount);

  const topExpenseCategory = expenseCategoriesBreakdown.length > 0
    ? {
        name: expenseCategoriesBreakdown[0].category,
        amount: expenseCategoriesBreakdown[0].amount,
        percentage: expenseCategoriesBreakdown[0].percentage,
        count: expenseCategoriesBreakdown[0].transactionCount
      }
    : null;

  // Analyse des budgets
  // Chercher budget global ou somme des budgets par catégorie
  const currentMonthBudgets = budgets.filter(
    b => b.month === currentMonthIdx && b.year === currentYear
  );

  const globalBudget = currentMonthBudgets.find(b => b.isGlobal || b.category === 'GLOBAL');
  const categorySpecificBudgets = currentMonthBudgets.filter(b => !b.isGlobal && b.category !== 'GLOBAL');

  let totalAllocated = 0;
  if (globalBudget) {
    totalAllocated = Number(globalBudget.allocatedAmount) || 0;
  } else if (categorySpecificBudgets.length > 0) {
    totalAllocated = categorySpecificBudgets.reduce(
      (sum, b) => sum + (Number(b.allocatedAmount) || 0),
      0
    );
  }

  const remainingBudget = Math.max(0, totalAllocated - totalExpenseMonth);
  const percentageConsumed = totalAllocated > 0
    ? Math.round((totalExpenseMonth / totalAllocated) * 100)
    : 0;
  const isExceeded = totalAllocated > 0 && totalExpenseMonth > totalAllocated;
  const exceededAmount = isExceeded ? totalExpenseMonth - totalAllocated : 0;

  const categoriesOverBudget: Array<{
    category: string;
    allocated: number;
    spent: number;
    exceededBy: number;
  }> = [];

  const categoriesWarningBudget: Array<{
    category: string;
    allocated: number;
    spent: number;
    percentage: number;
  }> = [];

  categorySpecificBudgets.forEach(b => {
    const spent = expensesByCategoryMap.get(b.category)?.amount || 0;
    const allocated = Number(b.allocatedAmount) || 0;
    if (allocated > 0) {
      const pct = (spent / allocated) * 100;
      if (spent > allocated) {
        categoriesOverBudget.push({
          category: b.category,
          allocated,
          spent: Math.round(spent),
          exceededBy: Math.round(spent - allocated)
        });
      } else if (pct >= 70) {
        categoriesWarningBudget.push({
          category: b.category,
          allocated,
          spent: Math.round(spent),
          percentage: Math.round(pct)
        });
      }
    }
  });

  // Analyse de l'épargne
  const totalSaved = savingsGoals.reduce(
    (sum, g) => sum + (Number(g.currentAmount) || 0),
    0
  );
  const totalTarget = savingsGoals.reduce(
    (sum, g) => sum + (Number(g.targetAmount) || 0),
    0
  );
  const savingsProgressPercentage = totalTarget > 0
    ? Math.round((totalSaved / totalTarget) * 100)
    : 0;

  const goalsSummary = savingsGoals.map(g => ({
    name: g.name,
    currentAmount: Math.round(Number(g.currentAmount) || 0),
    targetAmount: Math.round(Number(g.targetAmount) || 0),
    progressPercentage: g.targetAmount > 0
      ? Math.min(100, Math.round(((Number(g.currentAmount) || 0) / Number(g.targetAmount)) * 100))
      : 0,
    targetDate: g.targetDate
  }));

  // Tendances et ventilation par mode de paiement
  const previousMonthExpenses = prevMonthTransactions
    .filter(t => t.type === 'EXPENSE')
    .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);

  const previousMonthIncome = prevMonthTransactions
    .filter(t => t.type === 'INCOME')
    .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);

  let expenseVariationPercentage = 0;
  if (previousMonthExpenses > 0) {
    expenseVariationPercentage = Math.round(
      ((totalExpenseMonth - previousMonthExpenses) / previousMonthExpenses) * 100
    );
  }

  const expenseByPaymentMethod: Record<string, number> = {};
  currentMonthExpensesList.forEach(t => {
    const method = t.paymentMethod || 'Espèces';
    expenseByPaymentMethod[method] = (expenseByPaymentMethod[method] || 0) + (Number(t.amount) || 0);
  });

  const averageExpensePerTransaction = currentMonthExpensesList.length > 0
    ? Math.round(totalExpenseMonth / currentMonthExpensesList.length)
    : 0;

  return {
    currency,
    currentMonth: MONTH_NAMES[currentMonthIdx],
    currentYear,
    totalIncomeMonth: Math.round(totalIncomeMonth),
    totalExpenseMonth: Math.round(totalExpenseMonth),
    netSavingsMonth: Math.round(netSavingsMonth),
    savingsRatePercentage,
    topExpenseCategory,
    expenseCategoriesBreakdown,
    budgetStatus: {
      totalAllocated: Math.round(totalAllocated),
      totalSpent: Math.round(totalExpenseMonth),
      remainingBudget: Math.round(remainingBudget),
      percentageConsumed,
      isExceeded,
      exceededAmount: Math.round(exceededAmount),
      categoriesOverBudget,
      categoriesWarningBudget
    },
    savingsStatus: {
      totalSaved: Math.round(totalSaved),
      totalTarget: Math.round(totalTarget),
      progressPercentage: savingsProgressPercentage,
      goals: goalsSummary,
      recentMovementsCount: savingsMovements.length
    },
    trends: {
      previousMonthExpenses: Math.round(previousMonthExpenses),
      previousMonthIncome: Math.round(previousMonthIncome),
      expenseVariationPercentage,
      expenseByPaymentMethod,
      averageExpensePerTransaction,
      totalTransactionsMonthCount: currentMonthTransactions.length
    }
  };
}

/**
 * Génère des réponses locales instantanées et exactes pour le mode hors-ligne
 * ou en secours si l'API n'est pas joignable.
 */
export function generateLocalCalculatedAnswer(
  query: string,
  context: FinancialCalculatedContext
): string {
  const q = query.toLowerCase();

  // 1. Dépenses principales
  if (q.includes('plus dépensé') || q.includes('principale dépense') || q.includes('top dépense')) {
    if (!context.topExpenseCategory) {
      return `Vous n'avez enregistré aucune dépense pour le mois de **${context.currentMonth} ${context.currentYear}**.`;
    }
    return `Votre poste de dépense principal pour ce mois de **${context.currentMonth}** est **${context.topExpenseCategory.name}** avec un total de **${context.topExpenseCategory.amount.toLocaleString()} ${context.currency}**, ce qui représente **${context.topExpenseCategory.percentage}%** de l'ensemble de vos dépenses (${context.topExpenseCategory.count} transaction(s)).`;
  }

  // 2. Budget restant
  if (q.includes('reste') || q.includes('budget')) {
    if (context.budgetStatus.totalAllocated === 0) {
      return `Aucun budget global n'est défini pour **${context.currentMonth} ${context.currentYear}**. Vos dépenses actuelles s'élèvent à **${context.budgetStatus.totalSpent.toLocaleString()} ${context.currency}**. Vous pouvez configurer une enveloppe dans l'écran *Budgets*.`;
    }
    if (context.budgetStatus.isExceeded) {
      return `⚠️ **Alerte dépassement de budget :** Votre budget prévu de **${context.budgetStatus.totalAllocated.toLocaleString()} ${context.currency}** a été dépassé de **${context.budgetStatus.exceededAmount.toLocaleString()} ${context.currency}** (dépenses réelles : **${context.budgetStatus.totalSpent.toLocaleString()} ${context.currency}**, soit **${context.budgetStatus.percentageConsumed}%** consommé). Il est conseillé de freiner les dépenses non essentielles.`;
    }
    return `Il vous reste **${context.budgetStatus.remainingBudget.toLocaleString()} ${context.currency}** sur votre budget prévu de **${context.budgetStatus.totalAllocated.toLocaleString()} ${context.currency}** pour ce mois de **${context.currentMonth}** (consommation : **${context.budgetStatus.percentageConsumed}%**).`;
  }

  // 3. Épargne
  if (q.includes('économisé') || q.includes('épargne') || q.includes('cagnotte')) {
    if (context.savingsStatus.goals.length === 0) {
      return `Vous n'avez pas encore créé d'objectif d'épargne. Rendez-vous dans l'écran *Épargne* pour créer votre première cagnotte (fonds d'urgence, projet, etc.).`;
    }
    const goalsList = context.savingsStatus.goals
      .map(g => `• **${g.name}** : ${g.currentAmount.toLocaleString()} / ${g.targetAmount.toLocaleString()} ${context.currency} (${g.progressPercentage}%)`)
      .join('\n');

    return `Vous avez actuellement épargné au total **${context.savingsStatus.totalSaved.toLocaleString()} ${context.currency}** sur un objectif cumulé de **${context.savingsStatus.totalTarget.toLocaleString()} ${context.currency}** (progression globale : **${context.savingsStatus.progressPercentage}%**).\n\nDétail de vos cagnottes :\n${goalsList}`;
  }

  // 4. Analyse mensuelle générale
  if (q.includes('analyse') || q.includes('résumé') || q.includes('bilan') || q.includes('dépenses')) {
    const topCats = context.expenseCategoriesBreakdown.slice(0, 3)
      .map(c => `• **${c.category}** : ${c.amount.toLocaleString()} ${context.currency} (${c.percentage}%)`)
      .join('\n');

    return `📊 **Synthèse financière pour ${context.currentMonth} ${context.currentYear} :**\n\n` +
      `• **Revenus totaux :** ${context.totalIncomeMonth.toLocaleString()} ${context.currency}\n` +
      `• **Dépenses totales :** ${context.totalExpenseMonth.toLocaleString()} ${context.currency}\n` +
      `• **Solde net :** ${context.netSavingsMonth >= 0 ? '+' : ''}${context.netSavingsMonth.toLocaleString()} ${context.currency} (taux d'épargne : ${context.savingsRatePercentage}%)\n\n` +
      (topCats ? `🏆 **Principales catégories de dépenses :**\n${topCats}\n\n` : '') +
      `💳 **Situation budgétaire :** ${context.budgetStatus.totalAllocated > 0 ? `${context.budgetStatus.percentageConsumed}% consommé (${context.budgetStatus.remainingBudget.toLocaleString()} ${context.currency} restant)` : 'Aucun budget défini'}.\n` +
      `🎯 **Épargne totale accumulée :** ${context.savingsStatus.totalSaved.toLocaleString()} ${context.currency}.`;
  }

  // Fallback général précis
  return `Pour le mois de **${context.currentMonth} ${context.currentYear}**, vos revenus sont de **${context.totalIncomeMonth.toLocaleString()} ${context.currency}**, vos dépenses de **${context.totalExpenseMonth.toLocaleString()} ${context.currency}** et votre épargne totale en réserve est de **${context.savingsStatus.totalSaved.toLocaleString()} ${context.currency}**. Vous pouvez me demander des détails sur vos budgets, votre épargne ou vos catégories de dépenses.`;
}
