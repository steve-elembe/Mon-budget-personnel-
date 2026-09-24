package com.monbudget.app.domain.model

enum class TransactionType {
    INCOME,
    EXPENSE
}

enum class PaymentMethod(val label: String) {
    CASH("Espèces"),
    MTN_MOMO("MTN Mobile Money"),
    ORANGE_MONEY("Orange Money"),
    BANK_ACCOUNT("Compte bancaire"),
    BANK_CARD("Carte bancaire"),
    OTHER("Autre");

    companion object {
        fun fromLabel(label: String): PaymentMethod {
            return entries.find { it.label.equals(label, ignoreCase = true) } ?: CASH
        }
    }
}

data class TransactionItem(
    val id: Long = 0,
    val description: String,
    val amount: Double,
    val type: TransactionType,
    val category: String,
    val date: String = "",
    val timestamp: Long = System.currentTimeMillis(),
    val paymentMethod: String = "MTN Mobile Money",
    val note: String = ""
) {
    val title: String get() = description
}

data class BudgetItem(
    val id: Long = 0,
    val category: String,
    val allocatedAmount: Double,
    val spentAmount: Double = 0.0,
    val month: Int,
    val year: Int
)

data class SavingsGoalItem(
    val id: Long = 0,
    val name: String,
    val targetAmount: Double,
    val currentAmount: Double,
    val targetDate: Long,
    val iconName: String = "savings"
)

data class DashboardSummary(
    val currentBalance: Double = 0.0,
    val totalIncomeMonth: Double = 0.0,
    val totalExpenseMonth: Double = 0.0,
    val remainingBudget: Double = 0.0,
    val totalBudget: Double = 0.0,
    val totalSavings: Double = 0.0,
    val targetSavings: Double = 0.0
)
