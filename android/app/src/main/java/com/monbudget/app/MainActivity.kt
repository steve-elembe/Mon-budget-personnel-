package com.monbudget.app

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.activity.viewModels
import androidx.compose.foundation.layout.*
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.vector.ImageVector
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
                            title = { Text(currentScreen.title) },
                            colors = TopAppBarDefaults.topAppBarColors(
                                containerColor = MaterialTheme.colorScheme.primaryContainer,
                                titleContentColor = MaterialTheme.colorScheme.onPrimaryContainer
                            ),
                            actions = {
                                IconButton(onClick = { currentScreen = Screen.Settings }) {
                                    Icon(Icons.Default.Settings, contentDescription = "Paramètres")
                                }
                            }
                        )
                    },
                    bottomBar = {
                        NavigationBar {
                            val items = listOf(
                                Triple(Screen.Dashboard, "Accueil", Icons.Default.Dashboard),
                                Triple(Screen.Transactions, "Transactions", Icons.Default.ListAlt),
                                Triple(Screen.Budgets, "Budgets", Icons.Default.AccountBalanceWallet),
                                Triple(Screen.Savings, "Épargne", Icons.Default.Savings),
                                Triple(Screen.Stats, "Stats", Icons.Default.BarChart)
                            )
                            items.forEach { (screen, label, icon) ->
                                NavigationBarItem(
                                    selected = currentScreen == screen,
                                    onClick = { currentScreen = screen },
                                    icon = { Icon(icon, contentDescription = label) },
                                    label = { Text(label) }
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
                                onNavigateToExpense = { currentScreen = Screen.Expense }
                            )
                            Screen.Income -> IncomeScreen(viewModel)
                            Screen.Expense -> ExpenseScreen(viewModel)
                            Screen.Transactions -> TransactionsScreen(viewModel)
                            Screen.Budgets -> BudgetsScreen(viewModel)
                            Screen.Savings -> SavingsScreen(viewModel)
                            Screen.Stats -> StatsScreen(viewModel)
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
}
