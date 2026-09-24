package com.monbudget.app.data.local.entity

import androidx.room.Entity
import androidx.room.PrimaryKey

@Entity(tableName = "transactions")
data class TransactionEntity(
    @PrimaryKey(autoGenerate = true)
    val id: Long = 0,
    val description: String,
    val amount: Double,
    val type: String, // "INCOME" or "EXPENSE"
    val category: String,
    val date: String = "", // ISO string YYYY-MM-DD
    val timestamp: Long = System.currentTimeMillis(),
    val paymentMethod: String = "MTN Mobile Money", // "Espèces", "MTN Mobile Money", "Orange Money", "Compte bancaire", "Carte bancaire", "Autre"
    val note: String? = null
) {
    val title: String get() = description
}

@Entity(tableName = "budgets")
data class BudgetEntity(
    @PrimaryKey(autoGenerate = true)
    val id: Long = 0,
    val category: String,
    val allocatedAmount: Double,
    val month: Int,
    val year: Int
)

@Entity(tableName = "savings_goals")
data class SavingsGoalEntity(
    @PrimaryKey(autoGenerate = true)
    val id: Long = 0,
    val name: String,
    val targetAmount: Double,
    val currentAmount: Double,
    val targetDate: Long,
    val iconName: String = "savings"
)
