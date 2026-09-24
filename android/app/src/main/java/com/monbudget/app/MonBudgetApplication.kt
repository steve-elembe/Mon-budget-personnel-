package com.monbudget.app

import android.app.Application
import com.monbudget.app.data.local.MonBudgetDatabase
import com.monbudget.app.data.repository.BudgetRepository

class MonBudgetApplication : Application() {
    val database: MonBudgetDatabase by lazy { MonBudgetDatabase.getDatabase(this) }
    val repository: BudgetRepository by lazy {
        BudgetRepository(
            transactionDao = database.transactionDao(),
            budgetDao = database.budgetDao(),
            savingsGoalDao = database.savingsGoalDao()
        )
    }
}
