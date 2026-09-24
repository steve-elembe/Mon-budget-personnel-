package com.monbudget.app.data.local

import android.content.Context
import androidx.room.Database
import androidx.room.Room
import androidx.room.RoomDatabase
import com.monbudget.app.data.local.dao.BudgetDao
import com.monbudget.app.data.local.dao.SavingsGoalDao
import com.monbudget.app.data.local.dao.TransactionDao
import com.monbudget.app.data.local.entity.BudgetEntity
import com.monbudget.app.data.local.entity.SavingsGoalEntity
import com.monbudget.app.data.local.entity.TransactionEntity

@Database(
    entities = [
        TransactionEntity::class,
        BudgetEntity::class,
        SavingsGoalEntity::class
    ],
    version = 1,
    exportSchema = false
)
abstract class MonBudgetDatabase : RoomDatabase() {
    abstract fun transactionDao(): TransactionDao
    abstract fun budgetDao(): BudgetDao
    abstract fun savingsGoalDao(): SavingsGoalDao

    companion object {
        @Volatile
        private var INSTANCE: MonBudgetDatabase? = null

        fun getDatabase(context: Context): MonBudgetDatabase {
            return INSTANCE ?: synchronized(this) {
                val instance = Room.databaseBuilder(
                    context.applicationContext,
                    MonBudgetDatabase::class.java,
                    "mon_budget_database"
                )
                    .fallbackToDestructiveMigration()
                    .build()
                INSTANCE = instance
                instance
            }
        }
    }
}
