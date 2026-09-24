package com.monbudget.app.ui.screens

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Add
import androidx.compose.material.icons.filled.Search
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import com.monbudget.app.domain.model.BudgetItem
import com.monbudget.app.domain.model.TransactionType
import com.monbudget.app.ui.theme.ExpenseRed
import com.monbudget.app.ui.theme.IncomeGreen
import com.monbudget.app.ui.viewmodel.BudgetViewModel

// 4. Écran Transactions
@Composable
fun TransactionsScreen(viewModel: BudgetViewModel) {
    val transactions by viewModel.transactions.collectAsState()
    var filterType by remember { mutableStateOf("TOUS") }
    var searchQuery by remember { mutableStateOf("") }

    val filteredList = transactions.filter { tx ->
        val matchesType = when (filterType) {
            "REVENUS" -> tx.type == TransactionType.INCOME
            "DEPENSES" -> tx.type == TransactionType.EXPENSE
            else -> true
        }
        val matchesQuery = tx.title.contains(searchQuery, ignoreCase = true) ||
                tx.category.contains(searchQuery, ignoreCase = true)
        matchesType && matchesQuery
    }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(16.dp),
        verticalArrangement = Arrangement.spacedBy(12.dp)
    ) {
        Text("Toutes les transactions", style = MaterialTheme.typography.titleLarge, fontWeight = FontWeight.Bold)

        OutlinedTextField(
            value = searchQuery,
            onValueChange = { searchQuery = it },
            placeholder = { Text("Rechercher une transaction...") },
            leadingIcon = { Icon(Icons.Default.Search, contentDescription = null) },
            modifier = Modifier.fillMaxWidth()
        )

        Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
            FilterChip(
                selected = filterType == "TOUS",
                onClick = { filterType = "TOUS" },
                label = { Text("Toutes") }
            )
            FilterChip(
                selected = filterType == "REVENUS",
                onClick = { filterType = "REVENUS" },
                label = { Text("Revenus") }
            )
            FilterChip(
                selected = filterType == "DEPENSES",
                onClick = { filterType = "DEPENSES" },
                label = { Text("Dépenses") }
            )
        }

        LazyColumn(
            modifier = Modifier.fillMaxSize(),
            verticalArrangement = Arrangement.spacedBy(8.dp)
        ) {
            if (filteredList.isEmpty()) {
                item {
                    Text(
                        "Aucune transaction ne correspond à vos critères.",
                        style = MaterialTheme.typography.bodyMedium,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                }
            } else {
                items(filteredList) { item ->
                    TransactionRow(item = item, onDelete = { viewModel.deleteTransaction(item.id) })
                }
            }
        }
    }
}

// 5. Écran Budgets
@Composable
fun BudgetsScreen(viewModel: BudgetViewModel) {
    val budgets by viewModel.budgets.collectAsState()
    val transactions by viewModel.transactions.collectAsState()
    var showDialog by remember { mutableStateOf(false) }

    var newCategory by remember { mutableStateOf("Alimentation") }
    var newAmountText by remember { mutableStateOf("") }

    val categories = listOf("Alimentation", "Transport", "Logement & Factures", "Santé", "Loisirs", "Autre")

    // Calcul de la dépense par catégorie
    val spentByCategory = transactions
        .filter { it.type == TransactionType.EXPENSE }
        .groupBy { it.category }
        .mapValues { entry -> entry.value.sumOf { it.amount } }

    Scaffold(
        floatingActionButton = {
            FloatingActionButton(onClick = { showDialog = true }) {
                Icon(Icons.Default.Add, contentDescription = "Nouveau budget")
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
                Text("Budgets mensuels", style = MaterialTheme.typography.titleLarge, fontWeight = FontWeight.Bold)
                Text(
                    "Définissez vos limites de dépenses pour maîtriser votre trésorerie.",
                    style = MaterialTheme.typography.bodyMedium,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
            }

            if (budgets.isEmpty()) {
                item {
                    Card(
                        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceVariant),
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        Column(modifier = Modifier.padding(24.dp), horizontalAlignment = Alignment.CenterHorizontally) {
                            Text("Aucun budget configuré", fontWeight = FontWeight.SemiBold)
                            Spacer(Modifier.height(8.dp))
                            Text("Cliquez sur le bouton '+' pour définir un budget mensuel par catégorie.")
                        }
                    }
                }
            } else {
                items(budgets) { budget ->
                    val spent = spentByCategory[budget.category] ?: 0.0
                    val remaining = (budget.allocatedAmount - spent).coerceAtLeast(0.0)
                    val progress = if (budget.allocatedAmount > 0) (spent / budget.allocatedAmount).toFloat() else 0f
                    val isExceeded = spent > budget.allocatedAmount

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
                                Text(budget.category, style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold)
                                Text(
                                    text = if (isExceeded) "Dépassé de ${BudgetViewModel.formatFCFA(spent - budget.allocatedAmount)}"
                                    else "Reste : ${BudgetViewModel.formatFCFA(remaining)}",
                                    color = if (isExceeded) ExpenseRed else MaterialTheme.colorScheme.primary,
                                    fontWeight = FontWeight.SemiBold
                                )
                            }
                            Spacer(Modifier.height(8.dp))
                            LinearProgressIndicator(
                                progress = { progress.coerceIn(0f, 1f) },
                                color = if (isExceeded) ExpenseRed else MaterialTheme.colorScheme.primary,
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .height(8.dp)
                                    .clip(RoundedCornerShape(4.dp))
                            )
                            Spacer(Modifier.height(8.dp))
                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.SpaceBetween
                            ) {
                                Text("Dépensé: ${BudgetViewModel.formatFCFA(spent)}", style = MaterialTheme.typography.bodySmall)
                                Text("Plafond: ${BudgetViewModel.formatFCFA(budget.allocatedAmount)}", style = MaterialTheme.typography.bodySmall)
                            }
                        }
                    }
                }
            }
        }
    }

    if (showDialog) {
        AlertDialog(
            onDismissRequest = { showDialog = false },
            title = { Text("Nouveau budget") },
            text = {
                Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                    Text("Catégorie :")
                    categories.forEach { cat ->
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            RadioButton(
                                selected = newCategory == cat,
                                onClick = { newCategory = cat }
                            )
                            Text(cat)
                        }
                    }
                    OutlinedTextField(
                        value = newAmountText,
                        onValueChange = { newAmountText = it },
                        label = { Text("Montant plafond (FCFA)") }
                    )
                }
            },
            confirmButton = {
                Button(
                    onClick = {
                        val amount = newAmountText.toDoubleOrNull() ?: 0.0
                        if (amount > 0) {
                            viewModel.addBudget(newCategory, amount)
                            newAmountText = ""
                            showDialog = false
                        }
                    }
                ) {
                    Text("Créer")
                }
            },
            dismissButton = {
                TextButton(onClick = { showDialog = false }) {
                    Text("Annuler")
                }
            }
        )
    }
}
