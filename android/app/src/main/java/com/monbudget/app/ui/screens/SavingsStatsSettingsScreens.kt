package com.monbudget.app.ui.screens

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Add
import androidx.compose.material.icons.filled.Savings
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import com.monbudget.app.domain.model.SavingsGoalItem
import com.monbudget.app.domain.model.TransactionType
import com.monbudget.app.ui.theme.ExpenseRed
import com.monbudget.app.ui.theme.IncomeGreen
import com.monbudget.app.ui.theme.SavingsCyan
import com.monbudget.app.ui.viewmodel.BudgetViewModel

// 6. Écran Épargne
@Composable
fun SavingsScreen(viewModel: BudgetViewModel) {
    val goals by viewModel.savingsGoals.collectAsState()
    var showAddDialog by remember { mutableStateOf(false) }
    var showDepositDialog by remember { mutableStateOf<SavingsGoalItem?>(null) }

    var newGoalName by remember { mutableStateOf("") }
    var newGoalTarget by remember { mutableStateOf("") }
    var depositAmountText by remember { mutableStateOf("") }

    Scaffold(
        floatingActionButton = {
            FloatingActionButton(onClick = { showAddDialog = true }) {
                Icon(Icons.Default.Add, contentDescription = "Nouvel objectif")
            }
        }
    ) { padding ->
        LazyColumn(
            modifier = Modifier
                .fillMaxSize()
                .padding(padding)
                .padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(16.dp)
        ) {
            item {
                Text("Mes objectifs d'épargne", style = MaterialTheme.typography.titleLarge, fontWeight = FontWeight.Bold)
                Text(
                    "Constituez votre fonds d'urgence ou financez vos projets d'avenir.",
                    style = MaterialTheme.typography.bodyMedium,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
            }

            if (goals.isEmpty()) {
                item {
                    Card(
                        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceVariant),
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        Column(modifier = Modifier.padding(24.dp), horizontalAlignment = Alignment.CenterHorizontally) {
                            Icon(Icons.Default.Savings, contentDescription = null, modifier = Modifier.size(48.dp), tint = SavingsCyan)
                            Spacer(Modifier.height(8.dp))
                            Text("Aucun objectif d'épargne", fontWeight = FontWeight.SemiBold)
                            Spacer(Modifier.height(4.dp))
                            Text("Créez un projet (ex. Fonds de précaution, Voyage, Équipement).")
                        }
                    }
                }
            } else {
                items(goals) { goal ->
                    val progress = if (goal.targetAmount > 0) (goal.currentAmount / goal.targetAmount).toFloat() else 0f
                    val percentage = (progress * 100).toInt()

                    Card(
                        modifier = Modifier.fillMaxWidth(),
                        shape = RoundedCornerShape(16.dp),
                        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceVariant)
                    ) {
                        Column(modifier = Modifier.padding(16.dp)) {
                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.SpaceBetween,
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Text(goal.name, style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold)
                                Text("$percentage%", fontWeight = FontWeight.Bold, color = SavingsCyan)
                            }
                            Spacer(Modifier.height(8.dp))
                            LinearProgressIndicator(
                                progress = { progress.coerceIn(0f, 1f) },
                                color = SavingsCyan,
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .height(8.dp)
                                    .clip(RoundedCornerShape(4.dp))
                            )
                            Spacer(Modifier.height(8.dp))
                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.SpaceBetween,
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Column {
                                    Text("Actuel: ${BudgetViewModel.formatFCFA(goal.currentAmount)}", fontWeight = FontWeight.Medium)
                                    Text("Cible: ${BudgetViewModel.formatFCFA(goal.targetAmount)}", style = MaterialTheme.typography.bodySmall)
                                }
                                Button(
                                    onClick = { showDepositDialog = goal },
                                    colors = ButtonDefaults.buttonColors(containerColor = SavingsCyan)
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

    if (showAddDialog) {
        AlertDialog(
            onDismissRequest = { showAddDialog = false },
            title = { Text("Nouvel objectif d'épargne") },
            text = {
                Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                    OutlinedTextField(
                        value = newGoalName,
                        onValueChange = { newGoalName = it },
                        label = { Text("Nom du projet (ex. Fonds d'urgence)") }
                    )
                    OutlinedTextField(
                        value = newGoalTarget,
                        onValueChange = { newGoalTarget = it },
                        label = { Text("Montant cible (FCFA)") }
                    )
                }
            },
            confirmButton = {
                Button(
                    onClick = {
                        val target = newGoalTarget.toDoubleOrNull() ?: 0.0
                        if (newGoalName.isNotBlank() && target > 0) {
                            viewModel.addSavingsGoal(newGoalName, target)
                            newGoalName = ""
                            newGoalTarget = ""
                            showAddDialog = false
                        }
                    }
                ) {
                    Text("Créer")
                }
            },
            dismissButton = {
                TextButton(onClick = { showAddDialog = false }) { Text("Annuler") }
            }
        )
    }

    showDepositDialog?.let { goal ->
        AlertDialog(
            onDismissRequest = { showDepositDialog = null },
            title = { Text("Verser sur « ${goal.name} »") },
            text = {
                Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                    Text("Combien voulez-vous verser aujourd'hui ?")
                    OutlinedTextField(
                        value = depositAmountText,
                        onValueChange = { depositAmountText = it },
                        label = { Text("Montant (FCFA)") }
                    )
                }
            },
            confirmButton = {
                Button(
                    onClick = {
                        val amt = depositAmountText.toDoubleOrNull() ?: 0.0
                        if (amt > 0) {
                            viewModel.contributeToSavings(goal.id, amt)
                            depositAmountText = ""
                            showDepositDialog = null
                        }
                    }
                ) {
                    Text("Confirmer le versement")
                }
            },
            dismissButton = {
                TextButton(onClick = { showDepositDialog = null }) { Text("Annuler") }
            }
        )
    }
}

// 7. Écran Statistiques
@Composable
fun StatsScreen(viewModel: BudgetViewModel) {
    val transactions by viewModel.transactions.collectAsState()
    val summary by viewModel.dashboardSummary.collectAsState()

    val totalIncome = transactions.filter { it.type == TransactionType.INCOME }.sumOf { it.amount }
    val totalExpense = transactions.filter { it.type == TransactionType.EXPENSE }.sumOf { it.amount }
    val savingsRate = if (totalIncome > 0) (((totalIncome - totalExpense) / totalIncome) * 100).coerceAtLeast(0.0).toInt() else 0

    val expensesByCategory = transactions
        .filter { it.type == TransactionType.EXPENSE }
        .groupBy { it.category }
        .mapValues { it.value.sumOf { tx -> tx.amount } }
        .toList()
        .sortedByDescending { it.second }

    LazyColumn(
        modifier = Modifier
            .fillMaxSize()
            .padding(16.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        item {
            Text("Analyses & Statistiques", style = MaterialTheme.typography.titleLarge, fontWeight = FontWeight.Bold)
        }

        // Taux d'épargne et KPIs
        item {
            Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                Card(
                    modifier = Modifier.weight(1f),
                    colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceVariant)
                ) {
                    Column(modifier = Modifier.padding(16.dp)) {
                        Text("Taux d'épargne global", style = MaterialTheme.typography.labelMedium)
                        Spacer(Modifier.height(4.dp))
                        Text("$savingsRate%", style = MaterialTheme.typography.headlineMedium, fontWeight = FontWeight.Bold, color = IncomeGreen)
                    }
                }
                Card(
                    modifier = Modifier.weight(1f),
                    colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceVariant)
                ) {
                    Column(modifier = Modifier.padding(16.dp)) {
                        Text("Ratio Dépenses / Revenus", style = MaterialTheme.typography.labelMedium)
                        Spacer(Modifier.height(4.dp))
                        val ratio = if (totalIncome > 0) ((totalExpense / totalIncome) * 100).toInt() else 0
                        Text("$ratio%", style = MaterialTheme.typography.headlineMedium, fontWeight = FontWeight.Bold, color = ExpenseRed)
                    }
                }
            }
        }

        item {
            Text("Dépenses par catégorie", style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold)
        }

        if (expensesByCategory.isEmpty()) {
            item {
                Text("Aucune donnée de dépense disponible pour l'analyse.", style = MaterialTheme.typography.bodyMedium)
            }
        } else {
            items(expensesByCategory) { (cat, amount) ->
                val ratio = if (totalExpense > 0) (amount / totalExpense).toFloat() else 0f
                Card(
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(12.dp),
                    colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceVariant)
                ) {
                    Column(modifier = Modifier.padding(12.dp)) {
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween
                        ) {
                            Text(cat, fontWeight = FontWeight.SemiBold)
                            Text(BudgetViewModel.formatFCFA(amount), fontWeight = FontWeight.Bold)
                        }
                        Spacer(Modifier.height(6.dp))
                        LinearProgressIndicator(
                            progress = { ratio },
                            modifier = Modifier
                                .fillMaxWidth()
                                .height(6.dp)
                                .clip(RoundedCornerShape(3.dp))
                        )
                    }
                }
            }
        }
    }
}

// 8. Écran Paramètres
@Composable
fun SettingsScreen(
    darkTheme: Boolean,
    onToggleDarkTheme: (Boolean) -> Unit
) {
    LazyColumn(
        modifier = Modifier
            .fillMaxSize()
            .padding(16.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        item {
            Text("Paramètres de l'application", style = MaterialTheme.typography.titleLarge, fontWeight = FontWeight.Bold)
        }

        item {
            Card(
                colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceVariant),
                shape = RoundedCornerShape(16.dp),
                modifier = Modifier.fillMaxWidth()
            ) {
                Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(16.dp)) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Column {
                            Text("Mode Sombre", fontWeight = FontWeight.SemiBold)
                            Text("Activer le thème sombre Material 3", style = MaterialTheme.typography.bodySmall)
                        }
                        Switch(
                            checked = darkTheme,
                            onCheckedChange = onToggleDarkTheme
                        )
                    }

                    Divider()

                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Column {
                            Text("Devise par défaut", fontWeight = FontWeight.SemiBold)
                            Text("Devise principale du compte", style = MaterialTheme.typography.bodySmall)
                        }
                        Badge(containerColor = MaterialTheme.colorScheme.primaryContainer) {
                            Text("FCFA (XAF)", modifier = Modifier.padding(horizontal = 8.dp, vertical = 4.dp))
                        }
                    }

                    Divider()

                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Column {
                            Text("Stockage local", fontWeight = FontWeight.SemiBold)
                            Text("Room SQLite Database • Offline-first", style = MaterialTheme.typography.bodySmall)
                        }
                        Text("Actif", color = IncomeGreen, fontWeight = FontWeight.Bold)
                    }

                    Divider()

                    Column {
                        Text("À propos de Mon Budget", fontWeight = FontWeight.SemiBold)
                        Text("Version 1.0.0 (Native Android Compose + Material 3)", style = MaterialTheme.typography.bodySmall)
                    }
                }
            }
        }
    }
}
