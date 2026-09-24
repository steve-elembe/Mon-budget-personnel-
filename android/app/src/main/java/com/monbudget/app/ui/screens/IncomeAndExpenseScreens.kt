package com.monbudget.app.ui.screens

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import com.monbudget.app.domain.model.TransactionType
import com.monbudget.app.ui.theme.ExpenseRed
import com.monbudget.app.ui.theme.IncomeGreen
import com.monbudget.app.ui.viewmodel.BudgetViewModel

// 2. Écran Revenus
@Composable
fun IncomeScreen(viewModel: BudgetViewModel) {
    var title by remember { mutableStateOf("") }
    var amountText by remember { mutableStateOf("") }
    var category by remember { mutableStateOf("Salaire") }
    var note by remember { mutableStateOf("") }
    val transactions by viewModel.transactions.collectAsState()
    val incomeList = transactions.filter { it.type == TransactionType.INCOME }

    val categories = listOf("Salaire", "Business / Ventes", "Freelance", "Investissement", "Cadeau", "Autre")

    LazyColumn(
        modifier = Modifier
            .fillMaxSize()
            .padding(16.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        item {
            Text("Ajouter un revenu", style = MaterialTheme.typography.titleLarge, fontWeight = FontWeight.Bold)
        }

        item {
            Card(
                colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceVariant),
                shape = RoundedCornerShape(16.dp),
                modifier = Modifier.fillMaxWidth()
            ) {
                Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
                    OutlinedTextField(
                        value = title,
                        onValueChange = { title = it },
                        label = { Text("Libellé (ex. Salaire Mars)") },
                        modifier = Modifier.fillMaxWidth()
                    )
                    OutlinedTextField(
                        value = amountText,
                        onValueChange = { amountText = it },
                        label = { Text("Montant (en FCFA)") },
                        modifier = Modifier.fillMaxWidth()
                    )
                    Text("Catégorie :", style = MaterialTheme.typography.labelMedium)
                    Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                        categories.take(3).forEach { cat ->
                            FilterChip(
                                selected = category == cat,
                                onClick = { category = cat },
                                label = { Text(cat) }
                            )
                        }
                    }
                    Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                        categories.drop(3).forEach { cat ->
                            FilterChip(
                                selected = category == cat,
                                onClick = { category = cat },
                                label = { Text(cat) }
                            )
                        }
                    }
                    OutlinedTextField(
                        value = note,
                        onValueChange = { note = it },
                        label = { Text("Note facultative") },
                        modifier = Modifier.fillMaxWidth()
                    )
                    Button(
                        onClick = {
                            val amount = amountText.toDoubleOrNull() ?: 0.0
                            if (title.isNotBlank() && amount > 0) {
                                viewModel.addIncome(title, amount, category, note)
                                title = ""
                                amountText = ""
                                note = ""
                            }
                        },
                        colors = ButtonDefaults.buttonColors(containerColor = IncomeGreen),
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        Text("Enregistrer le revenu")
                    }
                }
            }
        }

        item {
            Text("Historique des revenus", style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold)
        }

        if (incomeList.isEmpty()) {
            item {
                Text("Aucun revenu enregistré pour le moment.", style = MaterialTheme.typography.bodyMedium)
            }
        } else {
            items(incomeList) { item ->
                TransactionRow(item = item, onDelete = { viewModel.deleteTransaction(item.id) })
            }
        }
    }
}

// 3. Écran Dépenses
@Composable
fun ExpenseScreen(viewModel: BudgetViewModel) {
    var title by remember { mutableStateOf("") }
    var amountText by remember { mutableStateOf("") }
    var category by remember { mutableStateOf("Alimentation") }
    var paymentMethod by remember { mutableStateOf("Mobile Money") }
    var note by remember { mutableStateOf("") }
    val transactions by viewModel.transactions.collectAsState()
    val expenseList = transactions.filter { it.type == TransactionType.EXPENSE }

    val categories = listOf("Alimentation", "Transport", "Logement & Factures", "Santé", "Loisirs", "Autre")
    val payments = listOf("Mobile Money", "Espèces", "Carte bancaire")

    LazyColumn(
        modifier = Modifier
            .fillMaxSize()
            .padding(16.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        item {
            Text("Ajouter une dépense", style = MaterialTheme.typography.titleLarge, fontWeight = FontWeight.Bold)
        }

        item {
            Card(
                colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceVariant),
                shape = RoundedCornerShape(16.dp),
                modifier = Modifier.fillMaxWidth()
            ) {
                Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
                    OutlinedTextField(
                        value = title,
                        onValueChange = { title = it },
                        label = { Text("Libellé (ex. Courses, Carburant)") },
                        modifier = Modifier.fillMaxWidth()
                    )
                    OutlinedTextField(
                        value = amountText,
                        onValueChange = { amountText = it },
                        label = { Text("Montant (en FCFA)") },
                        modifier = Modifier.fillMaxWidth()
                    )
                    Text("Catégorie :", style = MaterialTheme.typography.labelMedium)
                    Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                        categories.take(3).forEach { cat ->
                            FilterChip(
                                selected = category == cat,
                                onClick = { category = cat },
                                label = { Text(cat) }
                            )
                        }
                    }
                    Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                        categories.drop(3).forEach { cat ->
                            FilterChip(
                                selected = category == cat,
                                onClick = { category = cat },
                                label = { Text(cat) }
                            )
                        }
                    }
                    Text("Mode de paiement :", style = MaterialTheme.typography.labelMedium)
                    Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                        payments.forEach { pm ->
                            FilterChip(
                                selected = paymentMethod == pm,
                                onClick = { paymentMethod = pm },
                                label = { Text(pm) }
                            )
                        }
                    }
                    OutlinedTextField(
                        value = note,
                        onValueChange = { note = it },
                        label = { Text("Note facultative") },
                        modifier = Modifier.fillMaxWidth()
                    )
                    Button(
                        onClick = {
                            val amount = amountText.toDoubleOrNull() ?: 0.0
                            if (title.isNotBlank() && amount > 0) {
                                viewModel.addExpense(title, amount, category, paymentMethod, note)
                                title = ""
                                amountText = ""
                                note = ""
                            }
                        },
                        colors = ButtonDefaults.buttonColors(containerColor = ExpenseRed),
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        Text("Enregistrer la dépense")
                    }
                }
            }
        }

        item {
            Text("Historique des dépenses", style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold)
        }

        if (expenseList.isEmpty()) {
            item {
                Text("Aucune dépense enregistrée pour le moment.", style = MaterialTheme.typography.bodyMedium)
            }
        } else {
            items(expenseList) { item ->
                TransactionRow(item = item, onDelete = { viewModel.deleteTransaction(item.id) })
            }
        }
    }
}
