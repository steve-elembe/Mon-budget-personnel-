package com.monbudget.app.ui.navigation

sealed class Screen(val route: String, val title: String) {
    object Dashboard : Screen("dashboard", "Tableau de bord")
    object Income : Screen("income", "Revenus")
    object Expense : Screen("expense", "Dépenses")
    object Transactions : Screen("transactions", "Transactions")
    object Budgets : Screen("budgets", "Budgets")
    object Savings : Screen("savings", "Épargne")
    object Stats : Screen("stats", "Statistiques")
    object Settings : Screen("settings", "Paramètres")
}
