package com.monbudget.app.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.monbudget.app.domain.model.BudgetItem
import com.monbudget.app.domain.model.SavingsGoalItem
import com.monbudget.app.domain.model.TransactionItem
import com.monbudget.app.domain.model.TransactionType
import com.monbudget.app.ui.theme.ExpenseRed
import com.monbudget.app.ui.theme.IncomeGreen
import com.monbudget.app.ui.theme.SavingsCyan
import com.monbudget.app.ui.viewmodel.BudgetViewModel

// 1. Écran d’accueil / Tableau de bord
@Composable
fun DashboardScreen(
    viewModel: BudgetViewModel,
    onNavigateToTransactions: () -> Unit,
    onNavigateToIncome: () -> Unit,
    onNavigateToExpense: () -> Unit
) {
    val summary by viewModel.dashboardSummary.collectAsState()
    val transactions by viewModel.transactions.collectAsState()

    LazyColumn(
        modifier = Modifier
            .fillMaxSize()
            .padding(16.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        // Solde Actuel Card
        item {
            Card(
                colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.primary),
                shape = RoundedCornerShape(24.dp),
                modifier = Modifier.fillMaxWidth()
            ) {
                Column(modifier = Modifier.padding(24.dp)) {
                    Text(
                        text = "Solde disponible",
                        style = MaterialTheme.typography.labelLarge,
                        color = MaterialTheme.colorScheme.onPrimary.copy(alpha = 0.8f)
                    )
                    Spacer(modifier = Modifier.height(8.dp))
                    Text(
                        text = BudgetViewModel.formatFCFA(summary.currentBalance),
                        style = MaterialTheme.typography.headlineLarge,
                        fontWeight = FontWeight.Bold,
                        color = MaterialTheme.colorScheme.onPrimary
                    )
                    Spacer(modifier = Modifier.height(16.dp))
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.spacedBy(12.dp)
                    ) {
                        Button(
                            onClick = onNavigateToIncome,
                            colors = ButtonDefaults.buttonColors(containerColor = Color.White.copy(alpha = 0.2f)),
                            modifier = Modifier.weight(1f)
                        ) {
                            Icon(Icons.Default.ArrowDownward, contentDescription = null, tint = Color.White)
                            Spacer(Modifier.width(4.dp))
                            Text("+ Revenu", color = Color.White)
                        }
                        Button(
                            onClick = onNavigateToExpense,
                            colors = ButtonDefaults.buttonColors(containerColor = Color.White.copy(alpha = 0.2f)),
                            modifier = Modifier.weight(1f)
                        ) {
                            Icon(Icons.Default.ArrowUpward, contentDescription = null, tint = Color.White)
                            Spacer(Modifier.width(4.dp))
                            Text("- Dépense", color = Color.White)
                        }
                    }
                }
            }
        }

        // Revenus du mois & Dépenses du mois
        item {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(12.dp)
            ) {
                Card(
                    modifier = Modifier.weight(1f),
                    colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceVariant),
                    shape = RoundedCornerShape(16.dp)
                ) {
                    Column(modifier = Modifier.padding(16.dp)) {
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Icon(Icons.Default.TrendingUp, contentDescription = null, tint = IncomeGreen)
                            Spacer(Modifier.width(8.dp))
                            Text("Revenus (Mois)", style = MaterialTheme.typography.labelMedium)
                        }
                        Spacer(Modifier.height(8.dp))
                        Text(
                            text = BudgetViewModel.formatFCFA(summary.totalIncomeMonth),
                            style = MaterialTheme.typography.titleMedium,
                            fontWeight = FontWeight.Bold,
                            color = IncomeGreen
                        )
                    }
                }

                Card(
                    modifier = Modifier.weight(1f),
                    colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceVariant),
                    shape = RoundedCornerShape(16.dp)
                ) {
                    Column(modifier = Modifier.padding(16.dp)) {
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Icon(Icons.Default.TrendingDown, contentDescription = null, tint = ExpenseRed)
                            Spacer(Modifier.width(8.dp))
                            Text("Dépenses (Mois)", style = MaterialTheme.typography.labelMedium)
                        }
                        Spacer(Modifier.height(8.dp))
                        Text(
                            text = BudgetViewModel.formatFCFA(summary.totalExpenseMonth),
                            style = MaterialTheme.typography.titleMedium,
                            fontWeight = FontWeight.Bold,
                            color = ExpenseRed
                        )
                    }
                }
            }
        }

        // Budget restant
        item {
            Card(
                colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceVariant),
                shape = RoundedCornerShape(16.dp),
                modifier = Modifier.fillMaxWidth()
            ) {
                Column(modifier = Modifier.padding(16.dp)) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Text("Budget restant", style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.SemiBold)
                        Text(
                            text = BudgetViewModel.formatFCFA(summary.remainingBudget),
                            fontWeight = FontWeight.Bold,
                            color = MaterialTheme.colorScheme.primary
                        )
                    }
                    Spacer(Modifier.height(8.dp))
                    val progress = if (summary.totalBudget > 0) {
                        (summary.totalExpenseMonth / summary.totalBudget).coerceIn(0.0, 1.0).toFloat()
                    } else 0f
                    LinearProgressIndicator(
                        progress = { progress },
                        modifier = Modifier
                            .fillMaxWidth()
                            .height(8.dp)
                            .clip(RoundedCornerShape(4.dp))
                    )
                    Spacer(Modifier.height(4.dp))
                    Text(
                        text = "Total alloué : ${BudgetViewModel.formatFCFA(summary.totalBudget)}",
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                }
            }
        }

        // Progression de l’épargne
        item {
            Card(
                colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceVariant),
                shape = RoundedCornerShape(16.dp),
                modifier = Modifier.fillMaxWidth()
            ) {
                Column(modifier = Modifier.padding(16.dp)) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Icon(Icons.Default.Savings, contentDescription = null, tint = SavingsCyan)
                            Spacer(Modifier.width(8.dp))
                            Text("Progression de l'épargne", style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.SemiBold)
                        }
                        Text(
                            text = BudgetViewModel.formatFCFA(summary.totalSavings),
                            fontWeight = FontWeight.Bold,
                            color = SavingsCyan
                        )
                    }
                    Spacer(Modifier.height(8.dp))
                    val savingsProgress = if (summary.targetSavings > 0) {
                        (summary.totalSavings / summary.targetSavings).coerceIn(0.0, 1.0).toFloat()
                    } else 0f
                    LinearProgressIndicator(
                        progress = { savingsProgress },
                        color = SavingsCyan,
                        modifier = Modifier
                            .fillMaxWidth()
                            .height(8.dp)
                            .clip(RoundedCornerShape(4.dp))
                    )
                    Spacer(Modifier.height(4.dp))
                    Text(
                        text = "Objectif total : ${BudgetViewModel.formatFCFA(summary.targetSavings)}",
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                }
            }
        }

        // Résumé des dernières transactions
        item {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(
                    text = "Dernières transactions",
                    style = MaterialTheme.typography.titleLarge,
                    fontWeight = FontWeight.Bold
                )
                TextButton(onClick = onNavigateToTransactions) {
                    Text("Voir tout")
                }
            }
        }

        val recentList = transactions.take(5)
        if (recentList.isEmpty()) {
            item {
                Text(
                    text = "Aucune transaction enregistrée. Ajoutez un revenu ou une dépense !",
                    style = MaterialTheme.typography.bodyMedium,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
            }
        } else {
            items(recentList) { item ->
                TransactionRow(item = item, onDelete = { viewModel.deleteTransaction(item.id) })
            }
        }
    }
}

// Composant réutilisable pour afficher une transaction
@Composable
fun TransactionRow(item: TransactionItem, onDelete: () -> Unit) {
    Card(
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(12.dp),
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface)
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(12.dp),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.SpaceBetween
        ) {
            Row(verticalAlignment = Alignment.CenterVertically) {
                Box(
                    modifier = Modifier
                        .size(40.dp)
                        .clip(RoundedCornerShape(8.dp))
                        .background(
                            if (item.type == TransactionType.INCOME) IncomeGreen.copy(alpha = 0.15f)
                            else ExpenseRed.copy(alpha = 0.15f)
                        ),
                    contentAlignment = Alignment.Center
                ) {
                    Icon(
                        imageVector = if (item.type == TransactionType.INCOME) Icons.Default.ArrowDownward else Icons.Default.ArrowUpward,
                        contentDescription = null,
                        tint = if (item.type == TransactionType.INCOME) IncomeGreen else ExpenseRed
                    )
                }
                Spacer(Modifier.width(12.dp))
                Column {
                    Text(item.title, fontWeight = FontWeight.SemiBold)
                    Text("${item.category} • ${item.paymentMethod}", style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
                }
            }
            Text(
                text = "${if (item.type == TransactionType.INCOME) "+" else "-"}${BudgetViewModel.formatFCFA(item.amount)}",
                fontWeight = FontWeight.Bold,
                color = if (item.type == TransactionType.INCOME) IncomeGreen else ExpenseRed
            )
        }
    }
}
