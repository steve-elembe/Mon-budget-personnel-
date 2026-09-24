# Mon Budget - Application Android Native (Kotlin & Jetpack Compose)

« **Mon Budget** » est une application native Android moderne de gestion des finances personnelles et d'épargne en **FCFA (XAF)**, conçue avec une architecture **MVVM propre**, **Room Database** pour la persistance locale **offline-first**, **Kotlin Coroutines + Flow**, et **Material 3**.

---

## 📱 Caractéristiques Techniques

- **Langage** : Kotlin 2.1.0
- **UI Toolkit** : Jetpack Compose avec Material 3 (Material Design You)
- **Architecture** : MVVM (Model-View-ViewModel) avec Repository Pattern
- **Persistance locale** : Room Database (SQLite sous Android) avec Coroutines et reactive StateFlow
- **Gestion asynchrone** : Kotlin Coroutines & Kotlin StateFlow
- **Stratégie de données** : 100% Offline-First
- **Devise par défaut** : Franc CFA (FCFA / XAF)
- **Langue** : Français
- **Compatibilité** : Android 8.0 (API 26) jusqu'à Android 15 (API 35+)
- **Thématisation** : Prise en charge native du Mode Clair et du Mode Sombre

---

## 🗂️ Structure du Projet Android

```
android/
├── app/
│   ├── build.gradle.kts
│   └── src/
│       └── main/
│           ├── AndroidManifest.xml
│           ├── java/com/monbudget/app/
│           │   ├── MainActivity.kt
│           │   ├── MonBudgetApplication.kt
│           │   ├── data/
│           │   │   ├── local/
│           │   │   │   ├── MonBudgetDatabase.kt
│           │   │   │   ├── dao/
│           │   │   │   │   └── Daos.kt (TransactionDao, BudgetDao, SavingsGoalDao)
│           │   │   │   └── entity/
│           │   │   │       └── Entities.kt (TransactionEntity, BudgetEntity, SavingsGoalEntity)
│           │   │   └── repository/
│           │   │       └── BudgetRepository.kt
│           │   ├── domain/
│           │   │   └── model/
│           │   │       └── Models.kt (TransactionItem, BudgetItem, SavingsGoalItem, DashboardSummary)
│           │   └── ui/
│           │       ├── navigation/
│           │       │   └── Screen.kt
│           │       ├── screens/
│           │       │   ├── Screens.kt (DashboardScreen, TransactionRow)
│           │       │   ├── IncomeAndExpenseScreens.kt (IncomeScreen, ExpenseScreen)
│           │       │   ├── TransactionsAndBudgetScreens.kt (TransactionsScreen, BudgetsScreen)
│           │       │   └── SavingsStatsSettingsScreens.kt (SavingsScreen, StatsScreen, SettingsScreen)
│           │       ├── theme/
│           │       │   ├── Color.kt
│           │       │   ├── Theme.kt
│           │       │   └── Type.kt
│           │       └── viewmodel/
│           │           └── BudgetViewModel.kt
│           └── res/
│               └── values/
│                   ├── colors.xml
│                   ├── strings.xml
│                   └── themes.xml
├── gradle/
│   └── libs.versions.toml
├── build.gradle.kts
├── gradle.properties
└── settings.gradle.kts
```

---

## 🚀 Ouverture et Compilation dans Android Studio

1. Lancez **Android Studio** (Ladybug / Jellyfish ou supérieur recommandé).
2. Cliquez sur **Open** et sélectionnez le dossier `android/`.
3. Laissez Gradle synchroniser les dépendances (`libs.versions.toml`).
4. Branchez un appareil physique ou lancez un émulateur Android (API 26 à 35).
5. Cliquez sur le bouton **Run 'app'** (Maj + F10) ou exécutez dans un terminal :
   ```bash
   ./gradlew assembleDebug
   ```
