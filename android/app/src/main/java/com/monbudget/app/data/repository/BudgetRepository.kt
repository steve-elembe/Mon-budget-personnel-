package com.monbudget.app.data.repository

import com.monbudget.app.data.local.dao.BudgetDao
import com.monbudget.app.data.local.dao.SavingsGoalDao
import com.monbudget.app.data.local.dao.TransactionDao
import com.monbudget.app.data.local.entity.BudgetEntity
import com.monbudget.app.data.local.entity.SavingsGoalEntity
import com.monbudget.app.data.local.entity.TransactionEntity
import com.monbudget.app.domain.model.BudgetItem
import com.monbudget.app.domain.model.SavingsGoalItem
import com.monbudget.app.domain.model.TransactionItem
import com.monbudget.app.domain.model.TransactionType
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.map

class BudgetRepository(
    private val transactionDao: TransactionDao,
    private val budgetDao: BudgetDao,
    private val savingsGoalDao: SavingsGoalDao
) {
    val allTransactions: Flow<List<TransactionItem>> = transactionDao.getAllTransactions().map { list ->
        list.map { it.toDomain() }
    }

    val recentTransactions: Flow<List<TransactionItem>> = transactionDao.getRecentTransactions(5).map { list ->
        list.map { it.toDomain() }
    }

    val allBudgets: Flow<List<BudgetItem>> = budgetDao.getAllBudgets().map { list ->
        list.map { it.toDomain() }
    }

    val allSavingsGoals: Flow<List<SavingsGoalItem>> = savingsGoalDao.getAllSavingsGoals().map { list ->
        list.map { it.toDomain() }
    }

    fun getTransactionsByType(type: TransactionType): Flow<List<TransactionItem>> =
        transactionDao.getTransactionsByType(type.name).map { list -> list.map { it.toDomain() } }

    fun getTransactionsByCategory(category: String): Flow<List<TransactionItem>> =
        transactionDao.getTransactionsByCategory(category).map { list -> list.map { it.toDomain() } }

    fun getTransactionsByPaymentMethod(method: String): Flow<List<TransactionItem>> =
        transactionDao.getTransactionsByPaymentMethod(method).map { list -> list.map { it.toDomain() } }

    fun searchTransactions(query: String): Flow<List<TransactionItem>> =
        transactionDao.searchTransactions(query).map { list -> list.map { it.toDomain() } }

    fun getTransactionsInRange(startTime: Long, endTime: Long): Flow<List<TransactionItem>> =
        transactionDao.getTransactionsInRange(startTime, endTime).map { list -> list.map { it.toDomain() } }

    fun getBudgetsForMonth(month: Int, year: Int): Flow<List<BudgetItem>> =
        budgetDao.getBudgetsForMonth(month, year).map { list -> list.map { it.toDomain() } }

    suspend fun insertTransaction(item: TransactionItem): Long {
        require(item.amount > 0) { "Le montant de la transaction doit être supérieur à zéro" }
        require(item.category.isNotBlank()) { "La catégorie est obligatoire" }
        require(item.description.isNotBlank()) { "La description est obligatoire" }
        return transactionDao.insertTransaction(item.toEntity())
    }

    suspend fun updateTransaction(item: TransactionItem) {
        require(item.amount > 0) { "Le montant de la transaction doit être supérieur à zéro" }
        require(item.category.isNotBlank()) { "La catégorie est obligatoire" }
        require(item.description.isNotBlank()) { "La description est obligatoire" }
        transactionDao.updateTransaction(item.toEntity())
    }

    suspend fun deleteTransaction(id: Long) {
        transactionDao.deleteById(id)
    }

    suspend fun insertBudget(item: BudgetItem): Long {
        return budgetDao.insertBudget(item.toEntity())
    }

    suspend fun deleteBudget(item: BudgetItem) {
        budgetDao.deleteBudget(item.toEntity())
    }

    suspend fun insertSavingsGoal(goal: SavingsGoalItem): Long {
        return savingsGoalDao.insertSavingsGoal(goal.toEntity())
    }

    suspend fun depositToSavings(id: Long, amount: Double) {
        savingsGoalDao.depositToSavings(id, amount)
    }

    suspend fun deleteSavingsGoal(goal: SavingsGoalItem) {
        savingsGoalDao.deleteSavingsGoal(goal.toEntity())
    }

    private fun TransactionEntity.toDomain() = TransactionItem(
        id = id,
        description = description,
        amount = amount,
        type = if (type == "INCOME") TransactionType.INCOME else TransactionType.EXPENSE,
        category = category,
        date = date,
        timestamp = timestamp,
        note = note ?: "",
        paymentMethod = paymentMethod
    )

    private fun TransactionItem.toEntity() = TransactionEntity(
        id = id,
        description = description,
        amount = amount,
        type = type.name,
        category = category,
        date = date,
        timestamp = timestamp,
        note = note.ifBlank { null },
        paymentMethod = paymentMethod
    )

    private fun BudgetEntity.toDomain() = BudgetItem(
        id = id,
        category = category,
        allocatedAmount = allocatedAmount,
        spentAmount = 0.0,
        month = month,
        year = year
    )

    private fun BudgetItem.toEntity() = BudgetEntity(
        id = id,
        category = category,
        allocatedAmount = allocatedAmount,
        month = month,
        year = year
    )

    private fun SavingsGoalEntity.toDomain() = SavingsGoalItem(
        id = id,
        name = name,
        targetAmount = targetAmount,
        currentAmount = currentAmount,
        targetDate = targetDate,
        iconName = iconName
    )

    private fun SavingsGoalItem.toEntity() = SavingsGoalEntity(
        id = id,
        name = name,
        targetAmount = targetAmount,
        currentAmount = currentAmount,
        targetDate = targetDate,
        iconName = iconName
    )
}
