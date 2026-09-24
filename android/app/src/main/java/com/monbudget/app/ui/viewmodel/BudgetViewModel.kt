package com.monbudget.app.ui.viewmodel

import androidx.lifecycle.ViewModel
import androidx.lifecycle.ViewModelProvider
import androidx.lifecycle.viewModelScope
import com.monbudget.app.data.repository.BudgetRepository
import com.monbudget.app.domain.model.BudgetItem
import com.monbudget.app.domain.model.DashboardSummary
import com.monbudget.app.domain.model.SavingsGoalItem
import com.monbudget.app.domain.model.TransactionItem
import com.monbudget.app.domain.model.TransactionType
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.SharingStarted
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.combine
import kotlinx.coroutines.flow.stateIn
import kotlinx.coroutines.launch
import java.text.NumberFormat
import java.util.Calendar
import java.util.Locale

class BudgetViewModel(private val repository: BudgetRepository) : ViewModel() {

    val transactions: StateFlow<List<TransactionItem>> = repository.allTransactions
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), emptyList())

    val budgets: StateFlow<List<BudgetItem>> = repository.allBudgets
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), emptyList())

    val savingsGoals: StateFlow<List<SavingsGoalItem>> = repository.allSavingsGoals
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), emptyList())

    val dashboardSummary: StateFlow<DashboardSummary> = combine(
        transactions,
        budgets,
        savingsGoals
    ) { txList, bList, sList ->
        val now = Calendar.getInstance()
        val currentMonth = now.get(Calendar.MONTH)
        val currentYear = now.get(Calendar.YEAR)

        var balance = 0.0
        var monthIncome = 0.0
        var monthExpense = 0.0

        txList.forEach { tx ->
            val txCal = Calendar.getInstance().apply { timeInMillis = tx.date }
            val isCurrentMonth = txCal.get(Calendar.MONTH) == currentMonth && txCal.get(Calendar.YEAR) == currentYear

            if (tx.type == TransactionType.INCOME) {
                balance += tx.amount
                if (isCurrentMonth) monthIncome += tx.amount
            } else {
                balance -= tx.amount
                if (isCurrentMonth) monthExpense += tx.amount
            }
        }

        val totalBudget = bList.sumOf { it.allocatedAmount }
        val remainingBudget = (totalBudget - monthExpense).coerceAtLeast(0.0)

        val totalSavings = sList.sumOf { it.currentAmount }
        val targetSavings = sList.sumOf { it.targetAmount }

        DashboardSummary(
            currentBalance = balance,
            totalIncomeMonth = monthIncome,
            totalExpenseMonth = monthExpense,
            remainingBudget = remainingBudget,
            totalBudget = totalBudget,
            totalSavings = totalSavings,
            targetSavings = targetSavings
        )
    }.stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), DashboardSummary())

    fun addIncome(title: String, amount: Double, category: String, note: String = "") {
        viewModelScope.launch {
            repository.insertTransaction(
                TransactionItem(
                    title = title,
                    amount = amount,
                    type = TransactionType.INCOME,
                    category = category,
                    date = System.currentTimeMillis(),
                    note = note,
                    paymentMethod = "Virement / Mobile Money"
                )
            )
        }
    }

    fun addExpense(title: String, amount: Double, category: String, paymentMethod: String, note: String = "") {
        viewModelScope.launch {
            repository.insertTransaction(
                TransactionItem(
                    title = title,
                    amount = amount,
                    type = TransactionType.EXPENSE,
                    category = category,
                    date = System.currentTimeMillis(),
                    note = note,
                    paymentMethod = paymentMethod
                )
            )
        }
    }

    fun deleteTransaction(id: Long) {
        viewModelScope.launch {
            repository.deleteTransaction(id)
        }
    }

    fun addBudget(category: String, allocatedAmount: Double) {
        viewModelScope.launch {
            val now = Calendar.getInstance()
            repository.insertBudget(
                BudgetItem(
                    category = category,
                    allocatedAmount = allocatedAmount,
                    month = now.get(Calendar.MONTH),
                    year = now.get(Calendar.YEAR)
                )
            )
        }
    }

    fun addSavingsGoal(name: String, targetAmount: Double, initialAmount: Double = 0.0) {
        viewModelScope.launch {
            val targetCal = Calendar.getInstance().apply { add(Calendar.MONTH, 6) }
            repository.insertSavingsGoal(
                SavingsGoalItem(
                    name = name,
                    targetAmount = targetAmount,
                    currentAmount = initialAmount,
                    targetDate = targetCal.timeInMillis
                )
            )
        }
    }

    fun contributeToSavings(goalId: Long, amount: Double) {
        viewModelScope.launch {
            repository.depositToSavings(goalId, amount)
            // Déduit également comme épargne réalisée
            repository.insertTransaction(
                TransactionItem(
                    title = "Épargne vers objectif",
                    amount = amount,
                    type = TransactionType.EXPENSE,
                    category = "Épargne",
                    date = System.currentTimeMillis(),
                    note = "Dépôt sur objectif d'épargne",
                    paymentMethod = "Mobile Money"
                )
            )
        }
    }

    companion object {
        fun formatFCFA(amount: Double): String {
            val formatter = NumberFormat.getNumberInstance(Locale.FRANCE)
            formatter.maximumFractionDigits = 0
            return "${formatter.format(amount)} FCFA"
        }
    }
}

class BudgetViewModelFactory(private val repository: BudgetRepository) : ViewModelProvider.Factory {
    override fun <T : ViewModel> create(modelClass: Class<T>): T {
        if (modelClass.isAssignableFrom(BudgetViewModel::class.java)) {
            @Suppress("UNCHECKED_CAST")
            return BudgetViewModel(repository) as T
        }
        throw IllegalArgumentException("Unknown ViewModel class")
    }
}
