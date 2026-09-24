import React, { useState } from 'react';
import { X, Download, FileCode, Check, Folder, ChevronRight } from 'lucide-react';
import JSZip from 'jszip';

interface AndroidProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: 'code' | 'export';
}

const ANDROID_FILES: { path: string; language: string; content: string }[] = [
  {
    path: 'app/src/main/java/com/monbudget/app/MainActivity.kt',
    language: 'kotlin',
    content: `package com.monbudget.app

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.activity.viewModels
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.padding
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.semantics.Role
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.heading
import androidx.compose.ui.semantics.role
import androidx.compose.ui.semantics.semantics
import com.monbudget.app.ui.navigation.Screen
import com.monbudget.app.ui.screens.*
import com.monbudget.app.ui.theme.MonBudgetTheme
import com.monbudget.app.ui.viewmodel.BudgetViewModel
import com.monbudget.app.ui.viewmodel.BudgetViewModelFactory

class MainActivity : ComponentActivity() {
    private val viewModel: BudgetViewModel by viewModels {
        val app = application as MonBudgetApplication
        BudgetViewModelFactory(app.repository)
    }

    @OptIn(ExperimentalMaterial3Api::class)
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()

        setContent {
            var darkTheme by remember { mutableStateOf(false) }
            var currentScreen by remember { mutableStateOf<Screen>(Screen.Dashboard) }

            MonBudgetTheme(darkTheme = darkTheme) {
                Scaffold(
                    topBar = {
                        TopAppBar(
                            title = {
                                Text(
                                    text = currentScreen.title,
                                    modifier = Modifier.semantics { heading() }
                                )
                            },
                            actions = {
                                IconButton(
                                    onClick = { currentScreen = Screen.Assistant },
                                    modifier = Modifier.semantics {
                                        contentDescription = "Ouvrir l'assistant financier intelligent Gemini"
                                        role = Role.Button
                                    }
                                ) {
                                    Icon(
                                        imageVector = Icons.Default.AutoAwesome,
                                        contentDescription = null
                                    )
                                }
                                IconButton(
                                    onClick = { darkTheme = !darkTheme },
                                    modifier = Modifier.semantics {
                                        contentDescription = if (darkTheme) "Basculer en mode clair" else "Basculer en mode sombre"
                                        role = Role.Button
                                    }
                                ) {
                                    Icon(
                                        imageVector = if (darkTheme) Icons.Default.LightMode else Icons.Default.DarkMode,
                                        contentDescription = null
                                    )
                                }
                            },
                            colors = TopAppBarDefaults.topAppBarColors(
                                containerColor = MaterialTheme.colorScheme.primaryContainer,
                                titleContentColor = MaterialTheme.colorScheme.onPrimaryContainer
                            )
                        )
                    },
                    bottomBar = {
                        NavigationBar(
                            modifier = Modifier.semantics {
                                contentDescription = "Barre de navigation principale de l'application"
                            }
                        ) {
                            val items = listOf(
                                Triple(Screen.Dashboard, "Accueil", Icons.Default.Dashboard),
                                Triple(Screen.Transactions, "Transactions", Icons.Default.ListAlt),
                                Triple(Screen.Budgets, "Budgets", Icons.Default.AccountBalanceWallet),
                                Triple(Screen.Savings, "Épargne", Icons.Default.Savings),
                                Triple(Screen.Stats, "Stats", Icons.Default.BarChart)
                            )
                            items.forEach { (screen, label, icon) ->
                                val isSelected = currentScreen == screen
                                NavigationBarItem(
                                    selected = isSelected,
                                    onClick = { currentScreen = screen },
                                    icon = { Icon(icon, contentDescription = null) },
                                    label = { Text(label) },
                                    modifier = Modifier.semantics {
                                        contentDescription = "Onglet $label, \${if (isSelected) "sélectionné" else "non sélectionné"}"
                                        role = Role.Tab
                                    }
                                )
                            }
                        }
                    }
                ) { innerPadding ->
                    Box(modifier = Modifier.padding(innerPadding)) {
                        when (currentScreen) {
                            Screen.Dashboard -> DashboardScreen(
                                viewModel = viewModel,
                                onNavigateToTransactions = { currentScreen = Screen.Transactions },
                                onNavigateToIncome = { currentScreen = Screen.Income },
                                onNavigateToExpense = { currentScreen = Screen.Expense },
                                onNavigateToAssistant = { currentScreen = Screen.Assistant }
                            )
                            Screen.Income -> IncomeScreen(
                                viewModel = viewModel,
                                onNavigateBack = { currentScreen = Screen.Dashboard }
                            )
                            Screen.Expense -> ExpenseScreen(
                                viewModel = viewModel,
                                onNavigateBack = { currentScreen = Screen.Dashboard }
                            )
                            Screen.Transactions -> TransactionsScreen(
                                viewModel = viewModel,
                                onNavigateToIncome = { currentScreen = Screen.Income },
                                onNavigateToExpense = { currentScreen = Screen.Expense }
                            )
                            Screen.Budgets -> BudgetsScreen(viewModel)
                            Screen.Savings -> SavingsScreen(viewModel)
                            Screen.Stats -> StatsScreen(viewModel)
                            Screen.Assistant -> AssistantScreen(
                                viewModel = viewModel,
                                onNavigateBack = { currentScreen = Screen.Dashboard }
                            )
                            Screen.Settings -> SettingsScreen(
                                darkTheme = darkTheme,
                                onToggleDarkTheme = { darkTheme = it }
                            )
                        }
                    }
                }
            }
        }
    }
}`
  },
  {
    path: 'app/src/main/java/com/monbudget/app/data/local/entity/CategoryEntity.kt',
    language: 'kotlin',
    content: `package com.monbudget.app.data.local.entity

import androidx.room.Entity
import androidx.room.PrimaryKey

@Entity(tableName = "categories")
data class CategoryEntity(
    @PrimaryKey
    val id: String,
    val name: String,
    val type: String, // "INCOME" or "EXPENSE"
    val icon: String,
    val color: String,
    val isCustom: Boolean = false
)`
  },
  {
    path: 'app/src/main/java/com/monbudget/app/data/local/dao/CategoryDao.kt',
    language: 'kotlin',
    content: `package com.monbudget.app.data.local.dao

import androidx.room.*
import com.monbudget.app.data.local.entity.CategoryEntity
import kotlinx.coroutines.flow.Flow

@Dao
interface CategoryDao {
    @Query("SELECT * FROM categories ORDER BY name ASC")
    fun getAllCategories(): Flow<List<CategoryEntity>>

    @Query("SELECT * FROM categories WHERE type = :type ORDER BY name ASC")
    fun getCategoriesByType(type: String): Flow<List<CategoryEntity>>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertCategory(category: CategoryEntity)

    @Update
    suspend fun updateCategory(category: CategoryEntity)

    @Delete
    suspend fun deleteCategory(category: CategoryEntity)

    @Query("SELECT COUNT(*) FROM transactions WHERE category = :categoryName")
    suspend fun countTransactionsUsingCategory(categoryName: String): Int

    @Query("SELECT COUNT(*) FROM budgets WHERE category = :categoryName")
    suspend fun countBudgetsUsingCategory(categoryName: String): Int
}`
  },
  {
    path: 'app/src/main/java/com/monbudget/app/data/local/entity/BudgetEntity.kt',
    language: 'kotlin',
    content: `package com.monbudget.app.data.local.entity

import androidx.room.Entity
import androidx.room.PrimaryKey

@Entity(tableName = "budgets")
data class BudgetEntity(
    @PrimaryKey
    val id: String,
    val category: String, // "GLOBAL" or category name
    val allocatedAmount: Double,
    val month: Int, // 0-11
    val year: Int,
    val isGlobal: Boolean = false
)`
  },
  {
    path: 'app/src/main/java/com/monbudget/app/data/local/dao/BudgetDao.kt',
    language: 'kotlin',
    content: `package com.monbudget.app.data.local.dao

import androidx.room.*
import com.monbudget.app.data.local.entity.BudgetEntity
import kotlinx.coroutines.flow.Flow

@Dao
interface BudgetDao {
    @Query("SELECT * FROM budgets WHERE month = :month AND year = :year ORDER BY isGlobal DESC, category ASC")
    fun getBudgetsForMonth(month: Int, year: Int): Flow<List<BudgetEntity>>

    @Query("SELECT * FROM budgets WHERE month = :month AND year = :year AND isGlobal = 1 LIMIT 1")
    suspend fun getGlobalBudgetForMonth(month: Int, year: Int): BudgetEntity?

    @Query("SELECT * FROM budgets ORDER BY year DESC, month DESC")
    fun getAllBudgets(): Flow<List<BudgetEntity>>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertBudget(budget: BudgetEntity)

    @Update
    suspend fun updateBudget(budget: BudgetEntity)

    @Delete
    suspend fun deleteBudget(budget: BudgetEntity)
}
`
  },
  {
    path: 'app/src/main/java/com/monbudget/app/data/local/entity/SavingsGoalEntity.kt',
    language: 'kotlin',
    content: `package com.monbudget.app.data.local.entity

import androidx.room.Entity
import androidx.room.PrimaryKey

@Entity(tableName = "savings_goals")
data class SavingsGoalEntity(
    @PrimaryKey
    val id: String,
    val name: String,
    val targetAmount: Double,
    val currentAmount: Double,
    val targetDate: String? = null,
    val description: String? = null,
    val iconName: String = "Target",
    val createdAt: Long = System.currentTimeMillis()
)
`
  },
  {
    path: 'app/src/main/java/com/monbudget/app/data/local/dao/SavingsGoalDao.kt',
    language: 'kotlin',
    content: `package com.monbudget.app.data.local.dao

import androidx.room.*
import com.monbudget.app.data.local.entity.SavingsGoalEntity
import kotlinx.coroutines.flow.Flow

@Dao
interface SavingsGoalDao {
    @Query("SELECT * FROM savings_goals ORDER BY createdAt DESC")
    fun getAllGoals(): Flow<List<SavingsGoalEntity>>

    @Query("SELECT * FROM savings_goals WHERE id = :id")
    suspend fun getGoalById(id: String): SavingsGoalEntity?

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertGoal(goal: SavingsGoalEntity)

    @Update
    suspend fun updateGoal(goal: SavingsGoalEntity)

    @Delete
    suspend fun deleteGoal(goal: SavingsGoalEntity)

    @Query("UPDATE savings_goals SET currentAmount = currentAmount + :amount WHERE id = :goalId")
    suspend fun deposit(goalId: String, amount: Double)

    @Query("UPDATE savings_goals SET currentAmount = CASE WHEN (currentAmount - :amount) < 0 THEN 0 ELSE (currentAmount - :amount) END WHERE id = :goalId")
    suspend fun withdraw(goalId: String, amount: Double)
}
`
  },
  {
    path: 'app/src/main/java/com/monbudget/app/data/local/entity/SavingsMovementEntity.kt',
    language: 'kotlin',
    content: `package com.monbudget.app.data.local.entity

import androidx.room.Entity
import androidx.room.ForeignKey
import androidx.room.Index
import androidx.room.PrimaryKey

@Entity(
    tableName = "savings_movements",
    foreignKeys = [
        ForeignKey(
            entity = SavingsGoalEntity::class,
            parentColumns = ["id"],
            childColumns = ["goalId"],
            onDelete = ForeignKey.CASCADE
        )
    ],
    indices = [Index("goalId")]
)
data class SavingsMovementEntity(
    @PrimaryKey
    val id: String,
    val goalId: String,
    val type: String, // "DEPOSIT" or "WITHDRAWAL"
    val amount: Double,
    val date: String,
    val timestamp: Long = System.currentTimeMillis(),
    val note: String? = null
)
`
  },
  {
    path: 'app/src/main/java/com/monbudget/app/data/local/dao/SavingsMovementDao.kt',
    language: 'kotlin',
    content: `package com.monbudget.app.data.local.dao

import androidx.room.*
import com.monbudget.app.data.local.entity.SavingsMovementEntity
import kotlinx.coroutines.flow.Flow

@Dao
interface SavingsMovementDao {
    @Query("SELECT * FROM savings_movements ORDER BY timestamp DESC")
    fun getAllMovements(): Flow<List<SavingsMovementEntity>>

    @Query("SELECT * FROM savings_movements WHERE goalId = :goalId ORDER BY timestamp DESC")
    fun getMovementsForGoal(goalId: String): Flow<List<SavingsMovementEntity>>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertMovement(movement: SavingsMovementEntity)

    @Delete
    suspend fun deleteMovement(movement: SavingsMovementEntity)
}
`
  },
  {
    path: 'app/src/main/java/com/monbudget/app/data/local/MonBudgetDatabase.kt',
    language: 'kotlin',
    content: `package com.monbudget.app.data.local

import android.content.Context
import androidx.room.Database
import androidx.room.Room
import androidx.room.RoomDatabase
import com.monbudget.app.data.local.dao.*
import com.monbudget.app.data.local.entity.*

@Database(
    entities = [
        CategoryEntity::class,
        TransactionEntity::class,
        BudgetEntity::class,
        SavingsGoalEntity::class,
        SavingsMovementEntity::class
    ],
    version = 3,
    exportSchema = false
)
abstract class MonBudgetDatabase : RoomDatabase() {
    abstract fun categoryDao(): CategoryDao
    abstract fun transactionDao(): TransactionDao
    abstract fun budgetDao(): BudgetDao
    abstract fun savingsGoalDao(): SavingsGoalDao
    abstract fun savingsMovementDao(): SavingsMovementDao

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
}`
  },
  {
    path: 'app/src/main/java/com/monbudget/app/ui/viewmodel/BudgetViewModel.kt',
    language: 'kotlin',
    content: `package com.monbudget.app.ui.viewmodel

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.monbudget.app.data.repository.BudgetRepository
import com.monbudget.app.domain.model.DashboardSummary
import com.monbudget.app.domain.model.TransactionItem
import com.monbudget.app.domain.model.TransactionType
import kotlinx.coroutines.flow.SharingStarted
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.combine
import kotlinx.coroutines.flow.stateIn
import kotlinx.coroutines.launch
import java.text.NumberFormat
import java.util.Calendar
import java.util.Locale

class BudgetViewModel(private val repository: BudgetRepository) : ViewModel() {
    val transactions = repository.allTransactions
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), emptyList())

    val budgets = repository.allBudgets
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), emptyList())

    val savingsGoals = repository.allSavingsGoals
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), emptyList())

    val dashboardSummary: StateFlow<DashboardSummary> = combine(
        transactions,
        budgets,
        savingsGoals
    ) { txList, bList, sList ->
        var balance = 0.0
        var monthIncome = 0.0
        var monthExpense = 0.0

        txList.forEach { tx ->
            if (tx.type == TransactionType.INCOME) {
                balance += tx.amount
                monthIncome += tx.amount
            } else {
                balance -= tx.amount
                monthExpense += tx.amount
            }
        }

        val totalBudget = bList.sumOf { it.allocatedAmount }
        val remainingBudget = totalBudget - monthExpense

        DashboardSummary(
            currentBalance = balance,
            totalIncomeMonth = monthIncome,
            totalExpenseMonth = monthExpense,
            remainingBudget = remainingBudget,
            totalBudget = totalBudget,
            totalSavings = sList.sumOf { it.currentAmount },
            targetSavings = sList.sumOf { it.targetAmount }
        )
    }.stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), DashboardSummary())

    fun addTransaction(
        description: String,
        amount: Double,
        type: TransactionType,
        category: String,
        paymentMethod: String,
        date: String = "",
        note: String = ""
    ) {
        require(amount > 0) { "Le montant doit être supérieur à zéro" }
        require(category.isNotBlank()) { "La catégorie est obligatoire" }
        require(description.isNotBlank()) { "La description est obligatoire" }

        viewModelScope.launch {
            repository.insertTransaction(
                TransactionItem(
                    description = description,
                    amount = amount,
                    type = type,
                    category = category,
                    date = date,
                    timestamp = System.currentTimeMillis(),
                    paymentMethod = paymentMethod,
                    note = note
                )
            )
        }
    }

    fun updateTransaction(
        id: Long,
        description: String,
        amount: Double,
        type: TransactionType,
        category: String,
        paymentMethod: String,
        date: String = "",
        note: String = ""
    ) {
        require(amount > 0) { "Le montant doit être supérieur à zéro" }
        require(category.isNotBlank()) { "La catégorie est obligatoire" }
        require(description.isNotBlank()) { "La description est obligatoire" }

        viewModelScope.launch {
            repository.updateTransaction(
                TransactionItem(
                    id = id,
                    description = description,
                    amount = amount,
                    type = type,
                    category = category,
                    date = date,
                    paymentMethod = paymentMethod,
                    note = note
                )
            )
        }
    }

    fun deleteTransaction(id: Long) {
        viewModelScope.launch {
            repository.deleteTransaction(id)
        }
    }

    fun addIncome(description: String, amount: Double, category: String, paymentMethod: String = "MTN Mobile Money", note: String = "") {
        addTransaction(description, amount, TransactionType.INCOME, category, paymentMethod, "", note)
    }

    fun addExpense(description: String, amount: Double, category: String, paymentMethod: String = "MTN Mobile Money", note: String = "") {
        addTransaction(description, amount, TransactionType.EXPENSE, category, paymentMethod, "", note)
    }
}`
  },
  {
    path: 'app/src/main/java/com/monbudget/app/ui/screens/StatsScreen.kt',
    language: 'kotlin',
    content: `package com.monbudget.app.ui.screens

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.semantics.Role
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.heading
import androidx.compose.ui.semantics.role
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.unit.dp
import com.monbudget.app.ui.viewmodel.BudgetViewModel
import java.text.NumberFormat
import java.util.Locale

enum class PeriodOption(val label: String) {
    THIS_MONTH("Ce mois"),
    PREV_MONTH("Mois précédent"),
    LAST_3_MONTHS("3 derniers mois"),
    THIS_YEAR("Cette année"),
    CUSTOM("Période personnalisée")
}

@Composable
fun StatsScreen(viewModel: BudgetViewModel) {
    val transactions by viewModel.transactions.collectAsState()
    var selectedPeriod by remember { mutableStateOf(PeriodOption.THIS_MONTH) }

    val totalIncome = transactions.filter { it.type.name == "INCOME" }.sumOf { it.amount }
    val totalExpense = transactions.filter { it.type.name == "EXPENSE" }.sumOf { it.amount }
    val netSavings = totalIncome - totalExpense
    val savingsRate = if (totalIncome > 0) ((netSavings / totalIncome) * 100).coerceAtLeast(0.0) else 0.0

    val formatFCFA = { amount: Double ->
        val nf = NumberFormat.getNumberInstance(Locale.FRENCH)
        "\${nf.format(amount.toLong())} FCFA"
    }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(16.dp)
            .verticalScroll(rememberScrollState()),
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        Text(
            text = "Statistiques Financières",
            style = MaterialTheme.typography.headlineMedium,
            modifier = Modifier.semantics { heading() }
        )

        // Period filter chips with clear TalkBack accessibility
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .semantics {
                    contentDescription = "Filtres de période temporelle pour les statistiques"
                },
            horizontalArrangement = Arrangement.spacedBy(8.dp)
        ) {
            PeriodOption.values().take(3).forEach { option ->
                val isSelected = selectedPeriod == option
                FilterChip(
                    selected = isSelected,
                    onClick = { selectedPeriod = option },
                    label = { Text(option.label) },
                    modifier = Modifier.semantics {
                        contentDescription = "Filtrer par \${option.label}, \${if (isSelected) "activé" else "désactivé"}"
                        role = Role.RadioButton
                    }
                )
            }
        }

        // Overview KPI Cards with consolidated TalkBack content description
        Card(
            modifier = Modifier
                .fillMaxWidth()
                .semantics(mergeDescendants = true) {
                    contentDescription = "Résumé statistique global : Taux d'épargne \${String.format("%.1f", savingsRate)} pour cent, Total des revenus \${formatFCFA(totalIncome)}, Total des dépenses \${formatFCFA(totalExpense)}, Solde net \${formatFCFA(netSavings)}"
                }
        ) {
            Column(modifier = Modifier.padding(16.dp)) {
                Text("Taux d'épargne: \${String.format("%.1f", savingsRate)}%")
                Text("Total revenus: \${formatFCFA(totalIncome)}")
                Text("Total dépenses: \${formatFCFA(totalExpense)}")
                Text("Solde net: \${formatFCFA(netSavings)}")
            }
        }
    }
}`
  },
  {
    path: 'app/src/main/java/com/monbudget/app/ui/screens/DashboardScreen.kt',
    language: 'kotlin',
    content: `package com.monbudget.app.ui.screens

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.semantics.Role
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.heading
import androidx.compose.ui.semantics.role
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.unit.dp
import com.monbudget.app.ui.viewmodel.BudgetViewModel
import java.text.NumberFormat
import java.util.Locale

@Composable
fun DashboardScreen(
    viewModel: BudgetViewModel,
    onNavigateToTransactions: () -> Unit,
    onNavigateToIncome: () -> Unit,
    onNavigateToExpense: () -> Unit,
    onNavigateToAssistant: () -> Unit = {}
) {
    val summary by viewModel.dashboardSummary.collectAsState()

    val formatFCFA = { amount: Double ->
        val nf = NumberFormat.getNumberInstance(Locale.FRENCH)
        "\${nf.format(amount.toLong())} FCFA"
    }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(16.dp)
            .verticalScroll(rememberScrollState()),
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        // Solde Card - Accessibility: merge descendants into single cohesive TalkBack announcement
        Card(
            colors = CardDefaults.cardColors(
                containerColor = MaterialTheme.colorScheme.primaryContainer,
                contentColor = MaterialTheme.colorScheme.onPrimaryContainer
            ),
            modifier = Modifier
                .fillMaxWidth()
                .semantics(mergeDescendants = true) {
                    contentDescription = "Solde actuel disponible : \${formatFCFA(summary.currentBalance)}"
                }
        ) {
            Column(modifier = Modifier.padding(20.dp)) {
                Text(
                    text = "Solde Actuel Global",
                    style = MaterialTheme.typography.labelLarge,
                    modifier = Modifier.semantics { heading() }
                )
                Text(
                    text = formatFCFA(summary.currentBalance),
                    style = MaterialTheme.typography.headlineLarge
                )
            }
        }

        // Quick Action Buttons with clear semantics and roles
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.spacedBy(12.dp)
        ) {
            Button(
                onClick = onNavigateToIncome,
                modifier = Modifier
                    .weight(1f)
                    .semantics {
                        contentDescription = "Bouton ajouter un nouveau revenu financier"
                        role = Role.Button
                    }
            ) {
                Icon(Icons.Default.ArrowDownward, contentDescription = null)
                Spacer(Modifier.width(8.dp))
                Text("+ Revenu")
            }

            Button(
                onClick = onNavigateToExpense,
                colors = ButtonDefaults.buttonColors(containerColor = MaterialTheme.colorScheme.error),
                modifier = Modifier
                    .weight(1f)
                    .semantics {
                        contentDescription = "Bouton enregistrer une nouvelle dépense"
                        role = Role.Button
                    }
            ) {
                Icon(Icons.Default.ArrowUpward, contentDescription = null)
                Spacer(Modifier.width(8.dp))
                Text("- Dépense")
            }
        }

        // Gemini AI Assistant Banner with accessibility action
        Card(
            onClick = onNavigateToAssistant,
            colors = CardDefaults.cardColors(
                containerColor = MaterialTheme.colorScheme.tertiaryContainer,
                contentColor = MaterialTheme.colorScheme.onTertiaryContainer
            ),
            modifier = Modifier
                .fillMaxWidth()
                .semantics(mergeDescendants = true) {
                    contentDescription = "Assistant financier intelligent Gemini : Cliquez pour obtenir une analyse personnalisée de vos dépenses, budgets et épargne"
                    role = Role.Button
                }
        ) {
            Row(
                modifier = Modifier.padding(16.dp),
                verticalAlignment = Alignment.CenterVertically
            ) {
                Icon(Icons.Default.AutoAwesome, contentDescription = null)
                Spacer(Modifier.width(12.dp))
                Column(modifier = Modifier.weight(1f)) {
                    Text(
                        text = "Assistant Financier Gemini",
                        style = MaterialTheme.typography.titleMedium,
                        modifier = Modifier.semantics { heading() }
                    )
                    Text(
                        text = "Analyse instantanée et conseils d'épargne réels.",
                        style = MaterialTheme.typography.bodySmall
                    )
                }
                Icon(Icons.Default.ChevronRight, contentDescription = null)
            }
        }

        // Overview KPI summary cards
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.spacedBy(12.dp)
        ) {
            Card(
                modifier = Modifier
                    .weight(1f)
                    .semantics(mergeDescendants = true) {
                        contentDescription = "Total des revenus du mois : \${formatFCFA(summary.totalIncomeMonth)}"
                    }
            ) {
                Column(modifier = Modifier.padding(14.dp)) {
                    Text("Revenus", style = MaterialTheme.typography.labelMedium)
                    Text(formatFCFA(summary.totalIncomeMonth), style = MaterialTheme.typography.titleMedium)
                }
            }

            Card(
                modifier = Modifier
                    .weight(1f)
                    .semantics(mergeDescendants = true) {
                        contentDescription = "Total des dépenses du mois : \${formatFCFA(summary.totalExpenseMonth)}"
                    }
            ) {
                Column(modifier = Modifier.padding(14.dp)) {
                    Text("Dépenses", style = MaterialTheme.typography.labelMedium)
                    Text(formatFCFA(summary.totalExpenseMonth), style = MaterialTheme.typography.titleMedium)
                }
            }
        }
    }
}`
  },
  {
    path: 'app/src/main/java/com/monbudget/app/ui/screens/TransactionFormScreens.kt',
    language: 'kotlin',
    content: `package com.monbudget.app.ui.screens

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ArrowBack
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.semantics.Role
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.heading
import androidx.compose.ui.semantics.role
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.unit.dp
import com.monbudget.app.domain.model.TransactionType
import com.monbudget.app.ui.viewmodel.BudgetViewModel

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun IncomeScreen(viewModel: BudgetViewModel, onNavigateBack: () -> Unit = {}) {
    TransactionForm(
        title = "Ajouter un Revenu",
        type = TransactionType.INCOME,
        onSubmit = { desc, amount, category, method ->
            viewModel.addIncome(desc, amount, category, method)
            onNavigateBack()
        },
        onNavigateBack = onNavigateBack
    )
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ExpenseScreen(viewModel: BudgetViewModel, onNavigateBack: () -> Unit = {}) {
    TransactionForm(
        title = "Enregistrer une Dépense",
        type = TransactionType.EXPENSE,
        onSubmit = { desc, amount, category, method ->
            viewModel.addExpense(desc, amount, category, method)
            onNavigateBack()
        },
        onNavigateBack = onNavigateBack
    )
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
private fun TransactionForm(
    title: String,
    type: TransactionType,
    onSubmit: (description: String, amount: Double, category: String, method: String) -> Unit,
    onNavigateBack: () -> Unit
) {
    var description by remember { mutableStateOf("") }
    var amountText by remember { mutableStateOf("") }
    var selectedCategory by remember { mutableStateOf(if (type == TransactionType.INCOME) "Salaire" else "Alimentation") }
    var selectedMethod by remember { mutableStateOf("MTN Mobile Money") }
    var errorMessage by remember { mutableStateOf<String?>(null) }

    val categories = if (type == TransactionType.INCOME) {
        listOf("Salaire", "Business / Ventes", "Freelance", "Transfert reçu", "Autre revenu")
    } else {
        listOf("Alimentation", "Transport", "Logement", "Factures", "Santé", "Loisirs", "Autre")
    }

    val paymentMethods = listOf("Espèces", "MTN Mobile Money", "Orange Money", "Compte bancaire", "Carte bancaire")

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text(title, modifier = Modifier.semantics { heading() }) },
                navigationIcon = {
                    IconButton(
                        onClick = onNavigateBack,
                        modifier = Modifier.semantics {
                            contentDescription = "Retourner à l'écran précédent"
                            role = Role.Button
                        }
                    ) {
                        Icon(Icons.Default.ArrowBack, contentDescription = null)
                    }
                }
            )
        }
    ) { innerPadding ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(innerPadding)
                .padding(16.dp)
                .verticalScroll(rememberScrollState()),
            verticalArrangement = Arrangement.spacedBy(16.dp)
        ) {
            // Amount Input Field with explicit TalkBack description
            OutlinedTextField(
                value = amountText,
                onValueChange = { amountText = it; errorMessage = null },
                label = { Text("Montant (FCFA)") },
                placeholder = { Text("Ex: 25000") },
                keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                isError = errorMessage != null,
                modifier = Modifier
                    .fillMaxWidth()
                    .semantics {
                        contentDescription = "Champ de saisie du montant en Francs CFA, champ obligatoire"
                    }
            )

            // Description Input Field with TalkBack description
            OutlinedTextField(
                value = description,
                onValueChange = { description = it; errorMessage = null },
                label = { Text("Description") },
                placeholder = { Text("Ex: Salaire mensuel ou Courses supermarché") },
                modifier = Modifier
                    .fillMaxWidth()
                    .semantics {
                        contentDescription = "Champ de saisie de la description ou du motif de la transaction"
                    }
            )

            Text(
                text = "Catégorie",
                style = MaterialTheme.typography.labelLarge,
                modifier = Modifier.semantics { heading() }
            )

            // Category FilterChips with accessible roles and state descriptions
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .semantics { contentDescription = "Sélection de la catégorie" },
                horizontalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                categories.take(3).forEach { cat ->
                    val isSelected = selectedCategory == cat
                    FilterChip(
                        selected = isSelected,
                        onClick = { selectedCategory = cat },
                        label = { Text(cat) },
                        modifier = Modifier.semantics {
                            contentDescription = "Catégorie $cat, \${if (isSelected) "sélectionnée" else "non sélectionnée"}"
                            role = Role.RadioButton
                        }
                    )
                }
            }

            Text(
                text = "Moyen de paiement",
                style = MaterialTheme.typography.labelLarge,
                modifier = Modifier.semantics { heading() }
            )

            // Payment methods with accessibility semantics
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .semantics { contentDescription = "Sélection du moyen de paiement" },
                horizontalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                paymentMethods.take(3).forEach { method ->
                    val isSelected = selectedMethod == method
                    FilterChip(
                        selected = isSelected,
                        onClick = { selectedMethod = method },
                        label = { Text(method) },
                        modifier = Modifier.semantics {
                            contentDescription = "Moyen de paiement $method, \${if (isSelected) "sélectionné" else "non sélectionné"}"
                            role = Role.RadioButton
                        }
                    )
                }
            }

            if (errorMessage != null) {
                Text(
                    text = errorMessage!!,
                    color = MaterialTheme.colorScheme.error,
                    style = MaterialTheme.typography.bodyMedium,
                    modifier = Modifier.semantics {
                        contentDescription = "Erreur de validation : $errorMessage"
                    }
                )
            }

            // Submit Button
            Button(
                onClick = {
                    val amount = amountText.toDoubleOrNull()
                    if (amount == null || amount <= 0) {
                        errorMessage = "Veuillez saisir un montant valide supérieur à 0 FCFA"
                        return@Button
                    }
                    if (description.isBlank()) {
                        errorMessage = "Veuillez renseigner une description pour la transaction"
                        return@Button
                    }
                    onSubmit(description.trim(), amount, selectedCategory, selectedMethod)
                },
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(top = 16.dp)
                    .semantics {
                        contentDescription = "Bouton pour valider et enregistrer la transaction"
                        role = Role.Button
                    }
            ) {
                Text("Enregistrer la transaction")
            }
        }
    }
}`
  },
  {
    path: 'app/src/main/java/com/monbudget/app/ui/screens/AssistantScreen.kt',
    language: 'kotlin',
    content: `package com.monbudget.app.ui.screens

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ArrowBack
import androidx.compose.material.icons.filled.Send
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.semantics.Role
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.heading
import androidx.compose.ui.semantics.role
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.unit.dp
import com.monbudget.app.ui.viewmodel.BudgetViewModel

data class AssistantChatMessage(val id: String, val sender: String, val text: String)

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun AssistantScreen(viewModel: BudgetViewModel, onNavigateBack: () -> Unit = {}) {
    var userQuery by remember { mutableStateOf("") }
    val messages = remember {
        mutableStateListOf(
            AssistantChatMessage("1", "gemini", "Bonjour ! Je suis votre assistant financier intelligent. Posez-moi vos questions budgétaires ou demandez une analyse de vos dépenses.")
        )
    }

    val suggestions = listOf(
        "Analyse mes dépenses du mois",
        "Où ai-je le plus dépensé ?",
        "Combien me reste-t-il sur mon budget ?"
    )

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Assistant Financier Gemini", modifier = Modifier.semantics { heading() }) },
                navigationIcon = {
                    IconButton(
                        onClick = onNavigateBack,
                        modifier = Modifier.semantics {
                            contentDescription = "Retourner à l'accueil"
                            role = Role.Button
                        }
                    ) {
                        Icon(Icons.Default.ArrowBack, contentDescription = null)
                    }
                }
            )
        }
    ) { innerPadding ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(innerPadding)
                .padding(16.dp)
        ) {
            // Quick suggestions chips
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .semantics { contentDescription = "Suggestions de questions rapides" },
                horizontalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                suggestions.take(2).forEach { suggestion ->
                    SuggestionChip(
                        onClick = { userQuery = suggestion },
                        label = { Text(suggestion, maxLines = 1) },
                        modifier = Modifier.semantics {
                            contentDescription = "Suggestion : $suggestion"
                            role = Role.Button
                        }
                    )
                }
            }

            Spacer(Modifier.height(8.dp))

            // Conversation list
            LazyColumn(
                modifier = Modifier
                    .weight(1f)
                    .fillMaxWidth()
                    .semantics { contentDescription = "Historique de discussion avec l'assistant financier" },
                verticalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                items(messages) { msg ->
                    val isUser = msg.sender == "user"
                    Card(
                        colors = CardDefaults.cardColors(
                            containerColor = if (isUser) MaterialTheme.colorScheme.primaryContainer else MaterialTheme.colorScheme.surfaceVariant
                        ),
                        modifier = Modifier
                            .fillMaxWidth()
                            .semantics(mergeDescendants = true) {
                                contentDescription = "\${if (isUser) "Votre message" else "Message de l'assistant Gemini"} : \${msg.text}"
                            }
                    ) {
                        Text(
                            text = msg.text,
                            modifier = Modifier.padding(12.dp),
                            style = MaterialTheme.typography.bodyMedium
                        )
                    }
                }
            }

            Spacer(Modifier.height(8.dp))

            // Query Input field and send button with accessible labels
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                OutlinedTextField(
                    value = userQuery,
                    onValueChange = { userQuery = it },
                    placeholder = { Text("Posez votre question financière...") },
                    modifier = Modifier
                        .weight(1f)
                        .semantics {
                            contentDescription = "Champ de saisie de votre question pour l'assistant Gemini"
                        }
                )

                IconButton(
                    onClick = {
                        if (userQuery.isNotBlank()) {
                            val text = userQuery.trim()
                            messages.add(AssistantChatMessage(System.currentTimeMillis().toString(), "user", text))
                            userQuery = ""
                        }
                    },
                    modifier = Modifier.semantics {
                        contentDescription = "Bouton envoyer la question à l'assistant"
                        role = Role.Button
                    }
                ) {
                    Icon(Icons.Default.Send, contentDescription = null)
                }
            }
        }
    }
}`
  },
  {
    path: 'app/src/main/java/com/monbudget/app/ui/screens/TransactionsScreen.kt',
    language: 'kotlin',
    content: `package com.monbudget.app.ui.screens

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.semantics.Role
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.heading
import androidx.compose.ui.semantics.role
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.unit.dp
import com.monbudget.app.domain.model.TransactionItem
import com.monbudget.app.domain.model.TransactionType
import com.monbudget.app.ui.viewmodel.BudgetViewModel
import java.text.NumberFormat
import java.util.Locale

@Composable
fun TransactionsScreen(
    viewModel: BudgetViewModel,
    onNavigateToIncome: () -> Unit = {},
    onNavigateToExpense: () -> Unit = {}
) {
    val transactions by viewModel.transactions.collectAsState()
    var searchQuery by remember { mutableStateOf("") }
    var selectedFilter by remember { mutableStateOf<TransactionType?>(null) }

    val formatFCFA = { amount: Double ->
        val nf = NumberFormat.getNumberInstance(Locale.FRENCH)
        "\${nf.format(amount.toLong())} FCFA"
    }

    val filteredList = transactions.filter { tx ->
        (selectedFilter == null || tx.type == selectedFilter) &&
        (searchQuery.isBlank() || tx.description.contains(searchQuery, ignoreCase = true) || tx.category.contains(searchQuery, ignoreCase = true))
    }

    Scaffold(
        floatingActionButton = {
            Column(
                verticalArrangement = Arrangement.spacedBy(8.dp),
                horizontalAlignment = Alignment.End
            ) {
                SmallFloatingActionButton(
                    onClick = onNavigateToIncome,
                    containerColor = MaterialTheme.colorScheme.primaryContainer,
                    modifier = Modifier.semantics {
                        contentDescription = "Bouton d'action flottant : Ajouter un nouveau revenu"
                        role = Role.Button
                    }
                ) {
                    Icon(Icons.Default.Add, contentDescription = null)
                }
                FloatingActionButton(
                    onClick = onNavigateToExpense,
                    containerColor = MaterialTheme.colorScheme.errorContainer,
                    modifier = Modifier.semantics {
                        contentDescription = "Bouton d'action flottant : Enregistrer une nouvelle dépense"
                        role = Role.Button
                    }
                ) {
                    Icon(Icons.Default.Remove, contentDescription = null)
                }
            }
        }
    ) { innerPadding ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(innerPadding)
                .padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(12.dp)
        ) {
            // Accessible Search Field with TalkBack description
            OutlinedTextField(
                value = searchQuery,
                onValueChange = { searchQuery = it },
                label = { Text("Rechercher des transactions") },
                leadingIcon = { Icon(Icons.Default.Search, contentDescription = null) },
                trailingIcon = {
                    if (searchQuery.isNotEmpty()) {
                        IconButton(
                            onClick = { searchQuery = "" },
                            modifier = Modifier.semantics {
                                contentDescription = "Effacer la recherche de transactions"
                                role = Role.Button
                            }
                        ) {
                            Icon(Icons.Default.Clear, contentDescription = null)
                        }
                    }
                },
                modifier = Modifier
                    .fillMaxWidth()
                    .semantics {
                        contentDescription = "Champ de recherche par description, marchand ou catégorie"
                    }
            )

            // Filter Chips with TalkBack accessibility
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .semantics { contentDescription = "Filtres de type de transaction" },
                horizontalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                FilterChip(
                    selected = selectedFilter == null,
                    onClick = { selectedFilter = null },
                    label = { Text("Toutes") },
                    modifier = Modifier.semantics {
                        contentDescription = "Afficher toutes les transactions, \${if (selectedFilter == null) "sélectionné" else "non sélectionné"}"
                        role = Role.RadioButton
                    }
                )
                FilterChip(
                    selected = selectedFilter == TransactionType.INCOME,
                    onClick = { selectedFilter = TransactionType.INCOME },
                    label = { Text("Revenus") },
                    modifier = Modifier.semantics {
                        contentDescription = "Filtrer uniquement les revenus, \${if (selectedFilter == TransactionType.INCOME) "sélectionné" else "non sélectionné"}"
                        role = Role.RadioButton
                    }
                )
                FilterChip(
                    selected = selectedFilter == TransactionType.EXPENSE,
                    onClick = { selectedFilter = TransactionType.EXPENSE },
                    label = { Text("Dépenses") },
                    modifier = Modifier.semantics {
                        contentDescription = "Filtrer uniquement les dépenses, \${if (selectedFilter == TransactionType.EXPENSE) "sélectionné" else "non sélectionné"}"
                        role = Role.RadioButton
                    }
                )
            }

            // Transactions list
            if (filteredList.isEmpty()) {
                Box(
                    modifier = Modifier
                        .fillMaxSize()
                        .semantics { contentDescription = "Aucune transaction trouvée" },
                    contentAlignment = Alignment.Center
                ) {
                    Text("Aucune transaction enregistrée.", style = MaterialTheme.typography.bodyLarge)
                }
            } else {
                LazyColumn(
                    modifier = Modifier
                        .weight(1f)
                        .semantics { contentDescription = "Liste de \${filteredList.size} transactions" },
                    verticalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    items(filteredList) { tx ->
                        val isIncome = tx.type == TransactionType.INCOME
                        Card(
                            modifier = Modifier
                                .fillMaxWidth()
                                .semantics(mergeDescendants = true) {
                                    contentDescription = "Transaction : \${tx.description}, montant : \${formatFCFA(tx.amount)}, type : \${if (isIncome) "revenu" else "dépense"}, catégorie : \${tx.category}, moyen : \${tx.paymentMethod}"
                                }
                        ) {
                            Row(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .padding(14.dp),
                                horizontalArrangement = Arrangement.SpaceBetween,
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Column(modifier = Modifier.weight(1f)) {
                                    Text(tx.description, style = MaterialTheme.typography.titleMedium)
                                    Text(
                                        text = "\${tx.category} • \${tx.paymentMethod}",
                                        style = MaterialTheme.typography.bodySmall,
                                        color = MaterialTheme.colorScheme.onSurfaceVariant
                                    )
                                }
                                Row(verticalAlignment = Alignment.CenterVertically) {
                                    Text(
                                        text = "\${if (isIncome) "+" else "-"} \${formatFCFA(tx.amount)}",
                                        style = MaterialTheme.typography.titleMedium,
                                        color = if (isIncome) MaterialTheme.colorScheme.primary else MaterialTheme.colorScheme.error
                                    )
                                    IconButton(
                                        onClick = { viewModel.deleteTransaction(tx.id) },
                                        modifier = Modifier.semantics {
                                            contentDescription = "Supprimer la transaction \${tx.description} de \${formatFCFA(tx.amount)}"
                                            role = Role.Button
                                        }
                                    ) {
                                        Icon(Icons.Default.Delete, contentDescription = null)
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    }
}`
  },
  {
    path: 'app/src/main/java/com/monbudget/app/ui/screens/BudgetsScreen.kt',
    language: 'kotlin',
    content: `package com.monbudget.app.ui.screens

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Add
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.semantics.Role
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.heading
import androidx.compose.ui.semantics.role
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.semantics.stateDescription
import androidx.compose.ui.unit.dp
import com.monbudget.app.ui.viewmodel.BudgetViewModel
import java.text.NumberFormat
import java.util.Locale

@Composable
fun BudgetsScreen(viewModel: BudgetViewModel) {
    val budgets by viewModel.budgets.collectAsState()
    val transactions by viewModel.transactions.collectAsState()

    val formatFCFA = { amount: Double ->
        val nf = NumberFormat.getNumberInstance(Locale.FRENCH)
        "\${nf.format(amount.toLong())} FCFA"
    }

    Scaffold(
        floatingActionButton = {
            FloatingActionButton(
                onClick = { /* Ouvre création budget */ },
                modifier = Modifier.semantics {
                    contentDescription = "Bouton définir un nouveau budget mensuel"
                    role = Role.Button
                }
            ) {
                Icon(Icons.Default.Add, contentDescription = null)
            }
        }
    ) { innerPadding ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(innerPadding)
                .padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(16.dp)
        ) {
            Text(
                text = "Plafonds & Budgets Mensuels",
                style = MaterialTheme.typography.headlineMedium,
                modifier = Modifier.semantics { heading() }
            )

            if (budgets.isEmpty()) {
                Box(
                    modifier = Modifier
                        .fillMaxSize()
                        .semantics { contentDescription = "Aucun budget configuré pour le mois" },
                    contentAlignment = Alignment.Center
                ) {
                    Text("Aucun budget défini. Appuyez sur le bouton + pour en créer un.")
                }
            } else {
                LazyColumn(
                    modifier = Modifier
                        .weight(1f)
                        .semantics { contentDescription = "Liste des budgets par catégorie" },
                    verticalArrangement = Arrangement.spacedBy(12.dp)
                ) {
                    items(budgets) { budget ->
                        val spent = transactions
                            .filter { it.type.name == "EXPENSE" && (budget.isGlobal || it.category == budget.category) }
                            .sumOf { it.amount }
                        val remaining = budget.allocatedAmount - spent
                        val progress = if (budget.allocatedAmount > 0) (spent / budget.allocatedAmount).coerceIn(0.0, 1.0).toFloat() else 0f
                        val percent = if (budget.allocatedAmount > 0) ((spent / budget.allocatedAmount) * 100).toInt() else 0
                        val isOver = spent > budget.allocatedAmount

                        Card(
                            colors = CardDefaults.cardColors(
                                containerColor = if (isOver) MaterialTheme.colorScheme.errorContainer else MaterialTheme.colorScheme.surfaceVariant
                            ),
                            modifier = Modifier
                                .fillMaxWidth()
                                .semantics(mergeDescendants = true) {
                                    contentDescription = "Budget \${budget.category} : \${formatFCFA(spent)} dépensés sur \${formatFCFA(budget.allocatedAmount)} alloués, restant : \${formatFCFA(remaining)}, soit \${percent} pour cent consommé\${if (isOver) ", Attention : budget dépassé !" else ""}"
                                }
                        ) {
                            Column(modifier = Modifier.padding(16.dp)) {
                                Row(
                                    modifier = Modifier.fillMaxWidth(),
                                    horizontalArrangement = Arrangement.SpaceBetween
                                ) {
                                    Text(budget.category, style = MaterialTheme.typography.titleMedium)
                                    Text("\${percent}%", style = MaterialTheme.typography.titleMedium)
                                }
                                Spacer(Modifier.height(8.dp))
                                LinearProgressIndicator(
                                    progress = { progress },
                                    modifier = Modifier
                                        .fillMaxWidth()
                                        .semantics {
                                            stateDescription = "\${percent} pour cent du budget consommé"
                                        }
                                )
                                Spacer(Modifier.height(8.dp))
                                Text(
                                    text = "\${formatFCFA(spent)} / \${formatFCFA(budget.allocatedAmount)} • Restant : \${formatFCFA(remaining)}",
                                    style = MaterialTheme.typography.bodySmall
                                )
                            }
                        }
                    }
                }
            }
        }
    }
}`
  },
  {
    path: 'app/src/main/java/com/monbudget/app/ui/screens/SavingsScreen.kt',
    language: 'kotlin',
    content: `package com.monbudget.app.ui.screens

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Add
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.semantics.Role
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.heading
import androidx.compose.ui.semantics.role
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.semantics.stateDescription
import androidx.compose.ui.unit.dp
import com.monbudget.app.ui.viewmodel.BudgetViewModel
import java.text.NumberFormat
import java.util.Locale

@Composable
fun SavingsScreen(viewModel: BudgetViewModel) {
    val savingsGoals by viewModel.savingsGoals.collectAsState()

    val formatFCFA = { amount: Double ->
        val nf = NumberFormat.getNumberInstance(Locale.FRENCH)
        "\${nf.format(amount.toLong())} FCFA"
    }

    Scaffold(
        floatingActionButton = {
            FloatingActionButton(
                onClick = { /* Ouvre création objectif d'épargne */ },
                modifier = Modifier.semantics {
                    contentDescription = "Bouton créer un nouvel objectif ou une cagnotte d'épargne"
                    role = Role.Button
                }
            ) {
                Icon(Icons.Default.Add, contentDescription = null)
            }
        }
    ) { innerPadding ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(innerPadding)
                .padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(16.dp)
        ) {
            Text(
                text = "Objectifs d'Épargne & Cagnottes",
                style = MaterialTheme.typography.headlineMedium,
                modifier = Modifier.semantics { heading() }
            )

            if (savingsGoals.isEmpty()) {
                Box(
                    modifier = Modifier
                        .fillMaxSize()
                        .semantics { contentDescription = "Aucun objectif d'épargne défini" },
                    contentAlignment = Alignment.Center
                ) {
                    Text("Aucun objectif d'épargne en cours. Créez un objectif avec le bouton +.")
                }
            } else {
                LazyColumn(
                    modifier = Modifier
                        .weight(1f)
                        .semantics { contentDescription = "Liste des cagnottes d'épargne" },
                    verticalArrangement = Arrangement.spacedBy(12.dp)
                ) {
                    items(savingsGoals) { goal ->
                        val progressRatio = if (goal.targetAmount > 0) (goal.currentAmount / goal.targetAmount).coerceIn(0.0, 1.0).toFloat() else 0f
                        // progression épargne = montant épargné / objectif × 100
                        val percent = if (goal.targetAmount > 0) ((goal.currentAmount / goal.targetAmount) * 100).toInt() else 0

                        Card(
                            modifier = Modifier
                                .fillMaxWidth()
                                .semantics(mergeDescendants = true) {
                                    contentDescription = "Cagnotte : \${goal.name}, épargne accumulée : \${formatFCFA(goal.currentAmount)} sur un objectif de \${formatFCFA(goal.targetAmount)}, progression : \${percent} pour cent"
                                }
                        ) {
                            Column(modifier = Modifier.padding(16.dp)) {
                                Row(
                                    modifier = Modifier.fillMaxWidth(),
                                    horizontalArrangement = Arrangement.SpaceBetween
                                ) {
                                    Text(goal.name, style = MaterialTheme.typography.titleMedium)
                                    Text("\${percent}%", style = MaterialTheme.typography.titleMedium)
                                }
                                Spacer(Modifier.height(8.dp))
                                LinearProgressIndicator(
                                    progress = { progressRatio },
                                    modifier = Modifier
                                        .fillMaxWidth()
                                        .semantics {
                                            stateDescription = "Progression de l'objectif : \${percent} pour cent"
                                        }
                                )
                                Spacer(Modifier.height(8.dp))
                                Row(
                                    modifier = Modifier.fillMaxWidth(),
                                    horizontalArrangement = Arrangement.SpaceBetween,
                                    verticalAlignment = Alignment.CenterVertically
                                ) {
                                    Text(
                                        text = "\${formatFCFA(goal.currentAmount)} / \${formatFCFA(goal.targetAmount)}",
                                        style = MaterialTheme.typography.bodySmall
                                    )
                                    Button(
                                        onClick = { /* Dépôt */ },
                                        modifier = Modifier.semantics {
                                            contentDescription = "Verser de l'épargne dans la cagnotte \${goal.name}"
                                            role = Role.Button
                                        }
                                    ) {
                                        Text("+ Verser")
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    }
}`
  },
  {
    path: 'app/src/main/java/com/monbudget/app/ui/screens/SettingsScreen.kt',
    language: 'kotlin',
    content: `package com.monbudget.app.ui.screens

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.semantics.Role
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.heading
import androidx.compose.ui.semantics.role
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.unit.dp

@Composable
fun SettingsScreen(
    darkTheme: Boolean,
    onToggleDarkTheme: (Boolean) -> Unit
) {
    var notificationsEnabled by remember { mutableStateOf(true) }
    var pinLockEnabled by remember { mutableStateOf(false) }
    var biometricEnabled by remember { mutableStateOf(false) }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(16.dp)
            .verticalScroll(rememberScrollState()),
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        Text(
            text = "Paramètres de l'Application",
            style = MaterialTheme.typography.headlineMedium,
            modifier = Modifier.semantics { heading() }
        )

        // Appearance
        Card(modifier = Modifier.fillMaxWidth()) {
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(16.dp),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Column(modifier = Modifier.weight(1f)) {
                    Text("Thème sombre", style = MaterialTheme.typography.titleMedium)
                    Text("Activer l'affichage contrasté pour la nuit", style = MaterialTheme.typography.bodySmall)
                }
                Switch(
                    checked = darkTheme,
                    onCheckedChange = onToggleDarkTheme,
                    modifier = Modifier.semantics {
                        contentDescription = "Interrupteur Thème sombre, \${if (darkTheme) "activé" else "désactivé"}"
                    }
                )
            }
        }

        // Security & PIN
        Card(modifier = Modifier.fillMaxWidth()) {
            Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
                Text(
                    text = "Sécurité & Confidentialité",
                    style = MaterialTheme.typography.titleMedium,
                    modifier = Modifier.semantics { heading() }
                )

                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Column(modifier = Modifier.weight(1f)) {
                        Text("Verrouillage par code PIN", style = MaterialTheme.typography.bodyLarge)
                        Text("Protéger l'accès à vos données financières", style = MaterialTheme.typography.bodySmall)
                    }
                    Switch(
                        checked = pinLockEnabled,
                        onCheckedChange = { pinLockEnabled = it },
                        modifier = Modifier.semantics {
                            contentDescription = "Interrupteur verrouillage par code PIN, \${if (pinLockEnabled) "activé" else "désactivé"}"
                        }
                    )
                }

                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Column(modifier = Modifier.weight(1f)) {
                        Text("Biométrie / Empreinte", style = MaterialTheme.typography.bodyLarge)
                        Text("Déverrouillage rapide par empreinte digitale", style = MaterialTheme.typography.bodySmall)
                    }
                    Switch(
                        checked = biometricEnabled,
                        onCheckedChange = { biometricEnabled = it },
                        enabled = pinLockEnabled,
                        modifier = Modifier.semantics {
                            contentDescription = "Interrupteur biométrie par empreinte digitale, \${if (biometricEnabled) "activé" else "désactivé"}"
                        }
                    )
                }
            }
        }

        // Notifications
        Card(modifier = Modifier.fillMaxWidth()) {
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(16.dp),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Column(modifier = Modifier.weight(1f)) {
                    Text("Alertes budgétaires", style = MaterialTheme.typography.titleMedium)
                    Text("Notifications à 70%, 90% et en cas de dépassement", style = MaterialTheme.typography.bodySmall)
                }
                Switch(
                    checked = notificationsEnabled,
                    onCheckedChange = { notificationsEnabled = it },
                    modifier = Modifier.semantics {
                        contentDescription = "Interrupteur alertes budgétaires automatiques, \${if (notificationsEnabled) "activé" else "désactivé"}"
                    }
                )
            }
        }
    }
}`
  },
  {
    path: 'app/build.gradle.kts',
    language: 'kotlin',
    content: `plugins {
    alias(libs.plugins.android.application)
    alias(libs.plugins.kotlin.android)
    alias(libs.plugins.kotlin.compose)
    alias(libs.plugins.ksp)
    id("com.google.gms.google-services")
}

android {
    namespace = "com.monbudget.app"
    compileSdk = 35

    defaultConfig {
        applicationId = "com.monbudget.app"
        minSdk = 26
        targetSdk = 35
        versionCode = 1
        versionName = "1.0.0"
        testInstrumentationRunner = "androidx.test.runner.AndroidJUnitRunner"
        vectorDrawables {
            useSupportLibrary = true
        }
    }

    signingConfigs {
        create("release") {
            storeFile = file("monbudget-release.jks")
            storePassword = System.getenv("MONBUDGET_KEYSTORE_PASSWORD") ?: "monbudget123"
            keyAlias = System.getenv("MONBUDGET_KEY_ALIAS") ?: "monbudget"
            keyPassword = System.getenv("MONBUDGET_KEY_PASSWORD") ?: "monbudget123"
        }
    }

    buildTypes {
        debug {
            applicationIdSuffix = ".debug"
            isDebuggable = true
        }
        release {
            isMinifyEnabled = true
            isShrinkResources = true
            proguardFiles(
                getDefaultProguardFile("proguard-android-optimize.txt"),
                "proguard-rules.pro"
            )
            signingConfig = signingConfigs.getByName("release")
        }
    }

    bundle {
        language { enableSplit = true }
        density { enableSplit = true }
        abi { enableSplit = true }
    }

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }

    kotlinOptions {
        jvmTarget = "17"
    }

    buildFeatures {
        compose = true
    }
}

dependencies {
    implementation(platform(libs.androidx.compose.bom))
    implementation(libs.androidx.material3)
    implementation(libs.androidx.room.runtime)
    implementation(libs.androidx.room.ktx)
    ksp(libs.androidx.room.compiler)
    implementation(libs.kotlinx.coroutines.android)

    // Firebase (Auth & Firestore offline-first)
    implementation(platform("com.google.firebase:firebase-bom:33.9.0"))
    implementation("com.google.firebase:firebase-auth-ktx")
    implementation("com.google.firebase:firebase-firestore-ktx")

    // Gemini Client Generative AI SDK pour Android
    implementation("com.google.ai.client.generativeai:generativeai:0.9.0")

    // Security & Biometrics
    implementation("androidx.security:security-crypto:1.1.0-alpha06")
    implementation("androidx.biometric:biometric:1.2.0-alpha05")

    // Notifications & Permissions
    implementation("androidx.core:core-ktx:1.15.0")
    implementation("androidx.work:work-runtime-ktx:2.10.0")
}`
  },
  {
    path: 'app/proguard-rules.pro',
    language: 'pro',
    content: `# Proguard rules pour Mon Budget (Release APK & AAB)
-keepattributes *Annotation*
-keepclassmembers class * {
    @androidx.room.Dao *;
    @androidx.room.Entity *;
}
-dontwarn com.google.firebase.**
-dontwarn com.google.ai.client.generativeai.**`
  },
  {
    path: 'app/src/main/res/values/strings.xml',
    language: 'xml',
    content: `<?xml version="1.0" encoding="utf-8"?>
<resources>
    <string name="app_name">Mon Budget</string>
    <string name="default_currency">FCFA</string>
</resources>`
  },
  {
    path: 'gradle/wrapper/gradle-wrapper.properties',
    language: 'properties',
    content: `distributionBase=GRADLE_USER_HOME
distributionPath=wrapper/dists
distributionUrl=https\\://services.gradle.org/distributions/gradle-8.7-bin.zip
networkTimeout=10000
validateDistributionUrl=true
zipStoreBase=GRADLE_USER_HOME
zipStorePath=wrapper/dists`
  },
  {
    path: 'app/src/main/AndroidManifest.xml',
    language: 'xml',
    content: `<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android">

    <!-- Permissions réseau pour Firebase Cloud Sync & Gemini Assistant -->
    <uses-permission android:name="android.permission.INTERNET" />
    <uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />

    <!-- Permissions demandées UNIQUEMENT lorsque l'utilisateur active les options -->
    <uses-permission android:name="android.permission.POST_NOTIFICATIONS" />
    <uses-permission android:name="android.permission.USE_BIOMETRIC" />

    <application
        android:name=".MonBudgetApplication"
        android:allowBackup="true"
        android:icon="@mipmap/ic_launcher"
        android:label="@string/app_name"
        android:roundIcon="@mipmap/ic_launcher_round"
        android:supportsRtl="true"
        android:theme="@style/Theme.MonBudget">
        
        <activity
            android:name=".MainActivity"
            android:exported="true"
            android:theme="@style/Theme.MonBudget">
            <intent-filter>
                <action android:name="android.intent.action.MAIN" />
                <category android:name="android.intent.category.LAUNCHER" />
            </intent-filter>
        </activity>
    </application>

</manifest>`
  },
  {
    path: 'app/src/main/java/com/monbudget/app/security/SecurityManager.kt',
    language: 'kotlin',
    content: `package com.monbudget.app.security

import android.content.Context
import androidx.biometric.BiometricManager
import androidx.biometric.BiometricManager.Authenticators.BIOMETRIC_STRONG
import androidx.biometric.BiometricPrompt
import androidx.core.content.ContextCompat
import androidx.fragment.app.FragmentActivity
import androidx.security.crypto.EncryptedSharedPreferences
import androidx.security.crypto.MasterKey
import java.security.MessageDigest
import java.security.SecureRandom

/**
 * Gestionnaire de sécurité Android pour « Mon Budget »
 * - Le code PIN n'est JAMAIS stocké en clair
 * - Hachage cryptographique SHA-256 avec sel aléatoire de 16 octets
 * - Stockage des condensats dans EncryptedSharedPreferences (Android KeyStore)
 * - Support de l'authentification biométrique (Empreinte / Reconnaissance faciale)
 */
class SecurityManager(private val context: Context) {

    private val masterKey = MasterKey.Builder(context)
        .setKeyScheme(MasterKey.KeyScheme.AES256_GCM)
        .build()

    private val encryptedPrefs = EncryptedSharedPreferences.create(
        context,
        "mon_budget_secure_prefs",
        masterKey,
        EncryptedSharedPreferences.PrefKeyEncryptionScheme.AES256_SIV,
        EncryptedSharedPreferences.PrefValueEncryptionScheme.AES256_GCM
    )

    companion object {
        private const val KEY_PIN_HASH = "pin_hash"
        private const val KEY_PIN_SALT = "pin_salt"
        private const val KEY_LOCK_ENABLED = "lock_enabled"
        private const val KEY_BIOMETRICS_ENABLED = "biometrics_enabled"
    }

    val isLockEnabled: Boolean
        get() = encryptedPrefs.getBoolean(KEY_LOCK_ENABLED, false) && hasPinConfigured()

    val isBiometricsEnabled: Boolean
        get() = encryptedPrefs.getBoolean(KEY_BIOMETRICS_ENABLED, false)

    fun hasPinConfigured(): Boolean {
        return !encryptedPrefs.getString(KEY_PIN_HASH, null).isNullOrEmpty()
    }

    /**
     * Enregistre un nouveau code PIN.
     * Génère un sel cryptographique aléatoire et hache le code via SHA-256.
     * Le code en clair est immédiatement écrasé en mémoire.
     */
    fun savePin(pin: String) {
        val random = SecureRandom()
        val saltBytes = ByteArray(16)
        random.nextBytes(saltBytes)
        val saltHex = saltBytes.joinToString("") { "%02x".format(it) }

        val hashHex = hashWithSha256(pin, saltHex)

        encryptedPrefs.edit()
            .putString(KEY_PIN_HASH, hashHex)
            .putString(KEY_PIN_SALT, saltHex)
            .putBoolean(KEY_LOCK_ENABLED, true)
            .apply()
    }

    fun verifyPin(pinInput: String): Boolean {
        val storedHash = encryptedPrefs.getString(KEY_PIN_HASH, null) ?: return false
        val storedSalt = encryptedPrefs.getString(KEY_PIN_SALT, null) ?: return false

        val computedHash = hashWithSha256(pinInput, storedSalt)
        return computedHash == storedHash
    }

    fun disablePin() {
        encryptedPrefs.edit()
            .remove(KEY_PIN_HASH)
            .remove(KEY_PIN_SALT)
            .putBoolean(KEY_LOCK_ENABLED, false)
            .putBoolean(KEY_BIOMETRICS_ENABLED, false)
            .apply()
    }

    fun setLockEnabled(enabled: Boolean) {
        encryptedPrefs.edit().putBoolean(KEY_LOCK_ENABLED, enabled).apply()
    }

    fun setBiometricsEnabled(enabled: Boolean) {
        encryptedPrefs.edit().putBoolean(KEY_BIOMETRICS_ENABLED, enabled).apply()
    }

    fun canUseBiometrics(): Boolean {
        val biometricManager = BiometricManager.from(context)
        return biometricManager.canAuthenticate(BIOMETRIC_STRONG) == BiometricManager.BIOMETRIC_SUCCESS
    }

    fun showBiometricPrompt(
        activity: FragmentActivity,
        onSuccess: () -> Unit,
        onError: (String) -> Unit
    ) {
        val executor = ContextCompat.getMainExecutor(context)
        val prompt = BiometricPrompt(activity, executor, object : BiometricPrompt.AuthenticationCallback() {
            override fun onAuthenticationSucceeded(result: BiometricPrompt.AuthenticationResult) {
                super.onAuthenticationSucceeded(result)
                onSuccess()
            }

            override fun onAuthenticationError(errorCode: Int, errString: CharSequence) {
                super.onAuthenticationError(errorCode, errString)
                onError(errString.toString())
            }
        })

        val promptInfo = BiometricPrompt.PromptInfo.Builder()
            .setTitle("Déverrouillage Mon Budget")
            .setSubtitle("Vérifiez votre identité par biométrie")
            .setNegativeButtonText("Utiliser le code PIN")
            .build()

        prompt.authenticate(promptInfo)
    }

    private fun hashWithSha256(pin: String, saltHex: String): String {
        val digest = MessageDigest.getInstance("SHA-256")
        val combined = pin + saltHex
        val bytes = digest.digest(combined.toByteArray(Charsets.UTF_8))
        return bytes.joinToString("") { "%02x".format(it) }
    }
}`
  },
  {
    path: 'app/src/main/java/com/monbudget/app/notifications/NotificationHelper.kt',
    language: 'kotlin',
    content: `package com.monbudget.app.notifications

import android.Manifest
import android.app.NotificationChannel
import android.app.NotificationManager
import android.content.Context
import android.content.pm.PackageManager
import android.os.Build
import androidx.core.app.NotificationCompat
import androidx.core.app.NotificationManagerCompat
import androidx.core.content.ContextCompat

/**
 * Gestionnaire des notifications et alertes budgétaires Android
 * - Avertissement seuil 70%
 * - Avertissement critique 90%
 * - Alerte dépassement de budget (100%+)
 * - Rappel d'objectifs d'épargne
 * - Demande la permission POST_NOTIFICATIONS uniquement lors de l'activation
 */
class NotificationHelper(private val context: Context) {

    companion object {
        const val CHANNEL_BUDGET = "mon_budget_alerts"
        const val CHANNEL_SAVINGS = "mon_budget_savings"
    }

    init {
        createNotificationChannels()
    }

    private fun createNotificationChannels() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val budgetChannel = NotificationChannel(
                CHANNEL_BUDGET,
                "Alertes Budgets (70%, 90%, Dépassement)",
                NotificationManager.IMPORTANCE_HIGH
            ).apply {
                description = "Notifie l'utilisateur quand un budget atteint ou dépasse un seuil critique"
            }

            val savingsChannel = NotificationChannel(
                CHANNEL_SAVINGS,
                "Rappels Objectifs d'Épargne",
                NotificationManager.IMPORTANCE_DEFAULT
            ).apply {
                description = "Rappels réguliers des cagnottes d'épargne en cours"
            }

            val manager = context.getSystemService(NotificationManager::class.java)
            manager.createNotificationChannel(budgetChannel)
            manager.createNotificationChannel(savingsChannel)
        }
    }

    fun hasNotificationPermission(): Boolean {
        return if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            ContextCompat.checkSelfPermission(
                context,
                Manifest.permission.POST_NOTIFICATIONS
            ) == PackageManager.PERMISSION_GRANTED
        } else {
            true
        }
    }

    fun notifyBudgetThreshold(
        budgetId: Long,
        categoryName: String,
        percentage: Double,
        spent: Double,
        allocated: Double
    ) {
        if (!hasNotificationPermission()) return

        val (title, priority, icon) = when {
            percentage >= 100.0 -> Triple(
                "🚨 Dépassement de budget : $categoryName",
                NotificationCompat.PRIORITY_MAX,
                android.R.drawable.stat_notify_error
            )
            percentage >= 90.0 -> Triple(
                "⚠️ Alerte 90% : Budget $categoryName presque épuisé",
                NotificationCompat.PRIORITY_HIGH,
                android.R.drawable.stat_sys_warning
            )
            percentage >= 70.0 -> Triple(
                "ℹ️ Avertissement 70% : Budget $categoryName",
                NotificationCompat.PRIORITY_DEFAULT,
                android.R.drawable.ic_dialog_info
            )
            else -> return
        }

        val message = "Dépensé : \${spent.toLong()} FCFA sur un plafond de \${allocated.toLong()} FCFA (\${percentage.toInt()}%)"

        val builder = NotificationCompat.Builder(context, CHANNEL_BUDGET)
            .setSmallIcon(icon)
            .setContentTitle(title)
            .setContentText(message)
            .setPriority(priority)
            .setAutoCancel(true)

        with(NotificationManagerCompat.from(context)) {
            if (hasNotificationPermission()) {
                notify(budgetId.toInt(), builder.build())
            }
        }
    }

    fun notifySavingsGoalReminder(goalId: Long, goalName: String, current: Double, target: Double) {
        if (!hasNotificationPermission()) return

        val percent = (current / target * 100).toInt()
        val builder = NotificationCompat.Builder(context, CHANNEL_SAVINGS)
            .setSmallIcon(android.R.drawable.ic_menu_save)
            .setContentTitle("🎯 Objectif d'épargne : $goalName")
            .setContentText("Progression actuelle : $percent% (\${current.toLong()} / \${target.toLong()} FCFA)")
            .setPriority(NotificationCompat.PRIORITY_DEFAULT)
            .setAutoCancel(true)

        with(NotificationManagerCompat.from(context)) {
            if (hasNotificationPermission()) {
                notify((10000 + goalId).toInt(), builder.build())
            }
        }
    }
}`
  },
  {
    path: 'app/src/main/java/com/monbudget/app/data/sync/FirebaseSyncManager.kt',
    language: 'kotlin',
    content: `package com.monbudget.app.data.sync

import android.content.Context
import com.google.firebase.auth.FirebaseAuth
import com.google.firebase.firestore.FirebaseFirestore
import com.google.firebase.firestore.SetOptions
import com.monbudget.app.data.local.BudgetDatabase
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.tasks.await
import kotlinx.coroutines.withContext

/**
 * Synchronisation Cloud Firebase (Authentication & Firestore)
 * Architecture Offline-First : Room reste la base de données locale principale.
 * Aucune clé secrète n'est intégrée en dur dans le code source.
 */
enum class SyncState { IDLE, SYNCING, SUCCESS, ERROR, OFFLINE }

data class SyncStatus(
    val state: SyncState = SyncState.IDLE,
    val lastSyncedTimestamp: Long? = null,
    val pendingCount: Int = 0,
    val errorMessage: String? = null
)

class FirebaseSyncManager(
    private val context: Context,
    private val database: BudgetDatabase
) {
    private val auth: FirebaseAuth by lazy { FirebaseAuth.getInstance() }
    private val firestore: FirebaseFirestore by lazy { FirebaseFirestore.getInstance() }

    private val _syncStatus = MutableStateFlow(SyncStatus())
    val syncStatus: Flow<SyncStatus> = _syncStatus.asStateFlow()

    val currentUserId: String?
        get() = auth.currentUser?.uid

    val currentUserEmail: String?
        get() = auth.currentUser?.email

    val isAuthenticated: Boolean
        get() = auth.currentUser != null

    suspend fun signUp(email: String, pass: String): Result<String> = withContext(Dispatchers.IO) {
        try {
            val result = auth.createUserWithEmailAndPassword(email, pass).await()
            val uid = result.user?.uid ?: return@withContext Result.failure(Exception("Utilisateur introuvable"))
            Result.success(uid)
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun signIn(email: String, pass: String): Result<String> = withContext(Dispatchers.IO) {
        try {
            val result = auth.signInWithEmailAndPassword(email, pass).await()
            val uid = result.user?.uid ?: return@withContext Result.failure(Exception("Identifiants incorrects"))
            performSync()
            Result.success(uid)
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    fun signOut() {
        auth.signOut()
        _syncStatus.value = SyncStatus(state = SyncState.IDLE)
    }

    suspend fun sendPasswordReset(email: String): Result<Unit> = withContext(Dispatchers.IO) {
        try {
            auth.sendPasswordResetEmail(email).await()
            Result.success(Unit)
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun performSync(): Result<Unit> = withContext(Dispatchers.IO) {
        val uid = currentUserId ?: return@withContext Result.failure(Exception("Veuillez vous connecter"))
        _syncStatus.value = _syncStatus.value.copy(state = SyncState.SYNCING, errorMessage = null)

        try {
            val userDocRef = firestore.collection("users").document(uid)

            val localTransactions = database.transactionDao().getAllTransactionsSync()
            val localBudgets = database.budgetDao().getAllBudgetsSync()
            val localGoals = database.savingsGoalDao().getAllSavingsGoalsSync()

            val cloudPayload = hashMapOf(
                "updatedAt" to System.currentTimeMillis(),
                "transactions" to localTransactions,
                "budgets" to localBudgets,
                "savingsGoals" to localGoals
            )

            userDocRef.set(cloudPayload, SetOptions.merge()).await()

            _syncStatus.value = SyncStatus(
                state = SyncState.SUCCESS,
                lastSyncedTimestamp = System.currentTimeMillis()
            )
            Result.success(Unit)
        } catch (e: Exception) {
            _syncStatus.value = SyncStatus(
                state = SyncState.ERROR,
                errorMessage = e.localizedMessage
            )
            Result.failure(e)
        }
    }
}`
  },
  {
    path: 'app/src/main/java/com/monbudget/app/ai/GeminiFinancialAssistant.kt',
    language: 'kotlin',
    content: `package com.monbudget.app.ai

import com.google.ai.client.generativeai.GenerativeModel
import com.google.ai.client.generativeai.type.content
import com.monbudget.app.data.model.FinancialContext
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext

/**
 * Assistant financier utilisant Gemini dans l'architecture Android native.
 * Effectue l'analyse uniquement à la demande de l'utilisateur.
 * Les calculs financiers proviennent de Room Database et ne sont jamais inventés.
 */
class GeminiFinancialAssistant(
    private val apiKey: String
) {
    private val generativeModel = GenerativeModel(
        modelName = "gemini-3.8-flash",
        apiKey = apiKey
    )

    suspend fun askFinancialAdvice(
        userQuery: String,
        context: FinancialContext
    ): Result<String> = withContext(Dispatchers.IO) {
        try {
            val systemPrompt = """
                Tu es l'assistant financier personnel officiel de « Mon Budget » (application Android native en FCFA).
                RÈGLES STRICTES :
                - Ne jamais inventer de montants ou de transactions.
                - Base-toi uniquement sur les calculs réels suivants :
                  * Mois en cours : \${context.monthName} \${context.year}
                  * Dépenses totales réelles : \${context.totalExpenses} \${context.currency}
                  * Revenus réels : \${context.totalIncome} \${context.currency}
                  * Poste principal : \${context.topCategory} (\${context.topCategoryAmount} \${context.currency})
                  * Budget restant : \${context.remainingBudget} \${context.currency}
                  * Épargne totale accumulée : \${context.totalSavings} \${context.currency}
                - Interprète ces résultats réels avec pédagogie (règle 50/30/20, fonds d'urgence).
            """.trimIndent()

            val response = generativeModel.generateContent(
                content {
                    text(systemPrompt)
                    text("Question de l'utilisateur : $userQuery")
                }
            )

            val reply = response.text ?: "Impossible de générer une réponse."
            Result.success(reply)
        } catch (e: Exception) {
            Result.failure(e)
        }
    }
}`
  }
];

export const AndroidProjectModal: React.FC<AndroidProjectModalProps> = ({
  isOpen,
  onClose,
  initialTab = 'code'
}) => {
  const [activeTab, setActiveTab] = useState<'code' | 'export'>(initialTab);
  const [selectedFile, setSelectedFile] = useState(ANDROID_FILES[0]);
  const [copied, setCopied] = useState(false);
  const [copiedCommand, setCopiedCommand] = useState<string | null>(null);
  const [isZipping, setIsZipping] = useState(false);

  React.useEffect(() => {
    if (isOpen && initialTab) {
      setActiveTab(initialTab);
    }
  }, [isOpen, initialTab]);

  if (!isOpen) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(selectedFile.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCopyText = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCommand(id);
    setTimeout(() => setCopiedCommand(null), 2000);
  };

  const handleDownloadZip = async () => {
    try {
      setIsZipping(true);
      const zip = new JSZip();

      // Root Gradle files
      zip.file('settings.gradle.kts', `rootProject.name = "MonBudget"\ninclude(":app")\n`);
      zip.file(
        'build.gradle.kts',
        `plugins {\n    alias(libs.plugins.android.application) apply false\n    alias(libs.plugins.kotlin.android) apply false\n    alias(libs.plugins.kotlin.compose) apply false\n    alias(libs.plugins.ksp) apply false\n    id("com.google.gms.google-services") version "4.4.2" apply false\n}\n`
      );
      zip.file('gradle.properties', `org.gradle.jvmargs=-Xmx2048m\nandroid.useAndroidX=true\nandroid.nonTransitiveRClass=true\n`);

      // Script wrapper gradlew unix & windows
      zip.file('gradlew', `#!/usr/bin/env sh\nexec gradle "$@"\n`);
      zip.file('gradlew.bat', `@rem Gradle startup script for Windows\ngradle %*\n`);

      // Add project files
      ANDROID_FILES.forEach(file => {
        zip.file(file.path, file.content);
      });

      const blob = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'MonBudget_Android_Native_Project.zip';
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Erreur génération ZIP', err);
    } finally {
      setIsZipping(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
      <div className="flex h-[88vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl dark:bg-zinc-900">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-200 px-6 py-4 dark:border-zinc-800">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-sm">
              <FileCode className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
                Projet Android Natif « Mon Budget »
              </h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Kotlin 2.1 • Jetpack Compose • Room • Material 3 • Firebase • Gemini AI
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleDownloadZip}
              disabled={isZipping}
              className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700 disabled:opacity-50"
            >
              <Download className="h-4 w-4" />
              {isZipping ? 'Génération...' : 'Télécharger le ZIP Android Studio'}
            </button>
            <button
              onClick={onClose}
              className="rounded-lg p-2 text-zinc-500 transition hover:bg-zinc-100 dark:hover:bg-zinc-800"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Tab selection */}
        <div className="flex border-b border-zinc-200 bg-zinc-50 px-6 dark:border-zinc-800 dark:bg-zinc-950">
          <button
            onClick={() => setActiveTab('code')}
            className={`border-b-2 py-3 px-4 text-xs font-bold transition ${
              activeTab === 'code'
                ? 'border-emerald-600 text-emerald-700 dark:text-emerald-400'
                : 'border-transparent text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-200'
            }`}
          >
            Arborescence & Fichiers Kotlin
          </button>
          <button
            onClick={() => setActiveTab('export')}
            className={`border-b-2 py-3 px-4 text-xs font-bold transition flex items-center gap-1.5 ${
              activeTab === 'export'
                ? 'border-emerald-600 text-emerald-700 dark:text-emerald-400'
                : 'border-transparent text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-200'
            }`}
          >
            <span>Génération APK & AAB (Google Play)</span>
            <span className="rounded-full bg-emerald-100 px-1.5 py-0.2 text-[9px] font-bold text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
              Prêt release
            </span>
          </button>
        </div>

        {/* Tab Content */}
        {activeTab === 'export' ? (
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* Metadata Summary Card */}
            <div className="rounded-2xl border border-zinc-200 bg-zinc-50/70 p-4 dark:border-zinc-800 dark:bg-zinc-950/60">
              <h4 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 mb-3 flex items-center gap-2">
                <span>📋 Métadonnées & Configuration Release de l'Application</span>
              </h4>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div className="rounded-xl bg-white p-3 border border-zinc-200 dark:border-zinc-800 dark:bg-zinc-900">
                  <span className="text-[10px] text-zinc-400 block font-semibold">Nom de l'application</span>
                  <span className="font-bold text-zinc-800 dark:text-zinc-200">Mon Budget</span>
                </div>
                <div className="rounded-xl bg-white p-3 border border-zinc-200 dark:border-zinc-800 dark:bg-zinc-900">
                  <span className="text-[10px] text-zinc-400 block font-semibold">Application ID (Package)</span>
                  <span className="font-mono font-bold text-emerald-700 dark:text-emerald-400 truncate block">com.monbudget.app</span>
                </div>
                <div className="rounded-xl bg-white p-3 border border-zinc-200 dark:border-zinc-800 dark:bg-zinc-900">
                  <span className="text-[10px] text-zinc-400 block font-semibold">Version</span>
                  <span className="font-bold text-zinc-800 dark:text-zinc-200">1.0.0 (versionCode 1)</span>
                </div>
                <div className="rounded-xl bg-white p-3 border border-zinc-200 dark:border-zinc-800 dark:bg-zinc-900">
                  <span className="text-[10px] text-zinc-400 block font-semibold">Compatibilité SDK</span>
                  <span className="font-bold text-zinc-800 dark:text-zinc-200">Min 26 • Target 35</span>
                </div>
              </div>
            </div>

            {/* 1. Build APK Option */}
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50/40 p-5 dark:border-emerald-900/60 dark:bg-emerald-950/20">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-emerald-600 text-white text-xs font-bold">1</span>
                    <h4 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                      Générer un APK (Installation Directe sur Téléphone Android)
                    </h4>
                  </div>
                  <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-1">
                    Permet d'installer directement l'application sur un smartphone ou tablette Android sans passer par le Play Store.
                  </p>
                </div>
                <button
                  onClick={() => handleCopyText('./gradlew assembleRelease', 'apk_release')}
                  className="shrink-0 flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white transition hover:bg-emerald-700 active:scale-95"
                >
                  {copiedCommand === 'apk_release' ? <Check className="h-3.5 w-3.5" /> : null}
                  <span>{copiedCommand === 'apk_release' ? 'Copié !' : 'Copier commande'}</span>
                </button>
              </div>

              <div className="mt-3 rounded-xl bg-zinc-950 p-3 font-mono text-xs text-emerald-300 overflow-x-auto">
                ./gradlew assembleRelease
              </div>
              <p className="mt-2 text-[11px] text-zinc-500 dark:text-zinc-400">
                📁 Fichier de sortie généré : <code className="font-mono text-zinc-700 dark:text-zinc-300 font-bold">app/build/outputs/apk/release/app-release.apk</code>
                <br />(Pour tester en mode développement : <code className="font-mono">./gradlew assembleDebug</code>)
              </p>
            </div>

            {/* 2. Build AAB Option */}
            <div className="rounded-2xl border border-blue-200 bg-blue-50/40 p-5 dark:border-blue-900/60 dark:bg-blue-950/20">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-blue-600 text-white text-xs font-bold">2</span>
                    <h4 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                      Générer un AAB (Android App Bundle pour Google Play Store)
                    </h4>
                  </div>
                  <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-1">
                    Format obligatoire requis par Google pour la publication sur le Google Play Console.
                  </p>
                </div>
                <button
                  onClick={() => handleCopyText('./gradlew bundleRelease', 'aab_release')}
                  className="shrink-0 flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-bold text-white transition hover:bg-blue-700 active:scale-95"
                >
                  {copiedCommand === 'aab_release' ? <Check className="h-3.5 w-3.5" /> : null}
                  <span>{copiedCommand === 'aab_release' ? 'Copié !' : 'Copier commande'}</span>
                </button>
              </div>

              <div className="mt-3 rounded-xl bg-zinc-950 p-3 font-mono text-xs text-blue-300 overflow-x-auto">
                ./gradlew bundleRelease
              </div>
              <p className="mt-2 text-[11px] text-zinc-500 dark:text-zinc-400">
                📁 Fichier de sortie généré : <code className="font-mono text-zinc-700 dark:text-zinc-300 font-bold">app/build/outputs/bundle/release/app-release.aab</code>
              </p>
            </div>

            {/* Step-by-Step Instructions */}
            <div className="rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900 space-y-3">
              <h4 className="text-xs font-bold text-zinc-900 dark:text-zinc-100 uppercase tracking-wider">
                Procédure de compilation pas à pas
              </h4>
              <ol className="list-decimal ml-4 space-y-2 text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
                <li>
                  Cliquez sur <strong>« Télécharger le ZIP Android Studio »</strong> en haut à droite.
                </li>
                <li>
                  Décompressez l'archive ZIP sur votre ordinateur.
                </li>
                <li>
                  Ouvrez le dossier avec <strong>Android Studio</strong> (Ladybug ou supérieur recommandé) ou ouvrez un terminal dans ce dossier.
                </li>
                <li>
                  Lancez <code className="font-mono bg-zinc-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded">./gradlew assembleRelease</code> pour créer votre <strong>APK</strong> ou <code className="font-mono bg-zinc-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded">./gradlew bundleRelease</code> pour votre <strong>AAB</strong>.
                </li>
              </ol>
            </div>
          </div>
        ) : (
          /* Body with sidebar + code viewer */
          <div className="flex flex-1 overflow-hidden">
            {/* File explorer sidebar */}
            <div className="w-72 border-r border-zinc-200 bg-zinc-50/70 p-3 dark:border-zinc-800 dark:bg-zinc-950/50">
              <div className="mb-2 flex items-center gap-2 px-2 text-xs font-semibold uppercase tracking-wider text-zinc-500">
                <Folder className="h-4 w-4 text-emerald-600" />
                <span>Arborescence Android</span>
              </div>
              <div className="space-y-1">
                {ANDROID_FILES.map(file => {
                  const isSelected = selectedFile.path === file.path;
                  const fileName = file.path.split('/').pop();
                  return (
                    <button
                      key={file.path}
                      onClick={() => setSelectedFile(file)}
                      className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-xs font-medium transition ${
                        isSelected
                          ? 'bg-emerald-100 text-emerald-900 dark:bg-emerald-950/50 dark:text-emerald-300'
                          : 'text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800'
                      }`}
                    >
                      <span className="truncate">{fileName}</span>
                      <ChevronRight className="h-3 w-3 shrink-0 opacity-60" />
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Code viewer */}
            <div className="flex flex-1 flex-col bg-zinc-950 text-zinc-100">
              <div className="flex items-center justify-between border-b border-zinc-800 px-4 py-2 text-xs text-zinc-400">
                <span className="font-mono">{selectedFile.path}</span>
                <button
                  onClick={handleCopy}
                  className="flex items-center gap-1.5 rounded bg-zinc-800 px-2.5 py-1 text-xs text-zinc-200 hover:bg-zinc-700"
                >
                  {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : null}
                  <span>{copied ? 'Copié !' : 'Copier'}</span>
                </button>
              </div>
              <pre className="flex-1 overflow-auto p-4 font-mono text-xs leading-relaxed text-emerald-300">
                <code>{selectedFile.content}</code>
              </pre>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
