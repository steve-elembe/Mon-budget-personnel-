import React, { useState } from 'react';
import { useBudgetStore } from './services/storage';
import { ScreenName } from './types';
import { AndroidFrame } from './components/AndroidFrame';
import { TopAppBar } from './components/TopAppBar';
import { BottomNavBar } from './components/BottomNavBar';
import { AndroidProjectModal } from './components/AndroidProjectModal';
import { CategoryModal } from './components/CategoryModal';
import { LockScreen } from './components/LockScreen';
import { NotificationDrawer } from './components/NotificationDrawer';
import { AuthSyncModal } from './components/AuthSyncModal';

// Screens
import { DashboardScreen } from './screens/DashboardScreen';
import { IncomeScreen } from './screens/IncomeScreen';
import { ExpenseScreen } from './screens/ExpenseScreen';
import { TransactionsScreen } from './screens/TransactionsScreen';
import { BudgetsScreen } from './screens/BudgetsScreen';
import { SavingsScreen } from './screens/SavingsScreen';
import { StatsScreen } from './screens/StatsScreen';
import { SettingsScreen } from './screens/SettingsScreen';
import { AssistantScreen } from './screens/AssistantScreen';

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<ScreenName>('dashboard');
  const [isDeviceMode, setIsDeviceMode] = useState<boolean>(true);
  const [isAndroidModalOpen, setIsAndroidModalOpen] = useState<boolean>(false);
  const [androidModalTab, setAndroidModalTab] = useState<'code' | 'export'>('code');
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState<boolean>(false);
  const [isNotificationDrawerOpen, setIsNotificationDrawerOpen] = useState<boolean>(false);
  const [isAuthSyncModalOpen, setIsAuthSyncModalOpen] = useState<boolean>(false);

  const {
    transactions,
    categories,
    budgets,
    savingsGoals,
    summary,
    darkTheme,
    currency,
    setCurrency,
    setDarkTheme,
    // Security
    securitySettings,
    isAppLocked,
    setPinCredentials,
    disablePin,
    toggleLock,
    toggleBiometrics,
    lockApp,
    unlockApp,
    // Notifications
    notificationSettings,
    notifications,
    updateNotificationSettings,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    clearAllNotifications,
    triggerTestNotification,
    // Cloud & Authentication
    currentUser,
    syncInfo,
    performCloudSync,
    loginUser,
    logoutUser,
    // Handlers
    addTransaction,
    updateTransaction,
    addIncome,
    addExpense,
    deleteTransaction,
    addCategory,
    updateCategory,
    deleteCategory,
    isCategoryUsed,
    addBudget,
    saveBudget,
    updateBudget,
    deleteBudget,
    applyBudgetTestScenario,
    addSavingsGoal,
    updateSavingsGoal,
    deleteSavingsGoal,
    addSavingsDeposit,
    withdrawSavings,
    getSavingsMovements,
    deleteSavingsMovement,
    contributeToSavings,
    savingsMovements,
    resetToDefaultData,
    exportDataJson,
    importDataJson
  } = useBudgetStore();

  const handleNavigate = (screen: ScreenName) => {
    setCurrentScreen(screen);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleOpenCategoryManager = () => {
    setIsCategoryModalOpen(true);
  };

  const unreadNotificationsCount = notifications.filter(n => !n.read).length;

  const renderCurrentScreen = () => {
    switch (currentScreen) {
      case 'dashboard':
        return (
          <DashboardScreen
            summary={summary}
            recentTransactions={transactions}
            categories={categories}
            budgets={budgets}
            savingsGoals={savingsGoals}
            onNavigate={handleNavigate}
            onDeleteTransaction={deleteTransaction}
            onOpenCategoryManager={handleOpenCategoryManager}
          />
        );
      case 'income':
        return (
          <IncomeScreen
            transactions={transactions}
            categories={categories}
            onAddIncome={addIncome}
            onDeleteTransaction={deleteTransaction}
            onUpdateTransaction={updateTransaction}
            onOpenCategoryManager={handleOpenCategoryManager}
          />
        );
      case 'expense':
        return (
          <ExpenseScreen
            transactions={transactions}
            categories={categories}
            onAddExpense={addExpense}
            onDeleteTransaction={deleteTransaction}
            onUpdateTransaction={updateTransaction}
            onOpenCategoryManager={handleOpenCategoryManager}
          />
        );
      case 'transactions':
        return (
          <TransactionsScreen
            transactions={transactions}
            categories={categories}
            onAddTransaction={addTransaction}
            onUpdateTransaction={updateTransaction}
            onDeleteTransaction={deleteTransaction}
            onOpenCategoryManager={handleOpenCategoryManager}
          />
        );
      case 'budgets':
        return (
          <BudgetsScreen
            budgets={budgets}
            transactions={transactions}
            categories={categories}
            onAddBudget={addBudget}
            onSaveBudget={saveBudget}
            onUpdateBudget={updateBudget}
            onDeleteBudget={deleteBudget}
            onApplyTestScenario={applyBudgetTestScenario}
            onOpenCategoryManager={handleOpenCategoryManager}
          />
        );
      case 'savings':
        return (
          <SavingsScreen
            savingsGoals={savingsGoals}
            savingsMovements={savingsMovements}
            onAddSavingsGoal={addSavingsGoal}
            onUpdateSavingsGoal={updateSavingsGoal}
            onDeleteSavingsGoal={deleteSavingsGoal}
            onAddDeposit={addSavingsDeposit}
            onWithdraw={withdrawSavings}
            onDeleteMovement={deleteSavingsMovement}
            onContribute={contributeToSavings}
          />
        );
      case 'stats':
        return (
          <StatsScreen
            transactions={transactions}
            summary={summary}
            categories={categories}
            savingsGoals={savingsGoals}
          />
        );
      case 'assistant':
        return (
          <AssistantScreen
            transactions={transactions}
            categories={categories}
            budgets={budgets}
            savingsGoals={savingsGoals}
            savingsMovements={savingsMovements}
            currency={currency}
          />
        );
      case 'settings':
        return (
          <SettingsScreen
            darkTheme={darkTheme}
            onToggleDarkTheme={setDarkTheme}
            currency={currency}
            onSelectCurrency={setCurrency}
            securitySettings={securitySettings}
            onSetPinCredentials={setPinCredentials}
            onDisablePin={disablePin}
            onToggleLock={toggleLock}
            onToggleBiometrics={toggleBiometrics}
            onLockApp={lockApp}
            notificationSettings={notificationSettings}
            onUpdateNotificationSettings={updateNotificationSettings}
            onTestNotification={triggerTestNotification}
            categoriesCount={categories.length}
            onOpenCategoryManager={handleOpenCategoryManager}
            onExportJson={exportDataJson}
            onImportJson={importDataJson}
            onResetData={resetToDefaultData}
            onOpenAndroidCode={(tab?: 'code' | 'export') => {
              setAndroidModalTab(tab || 'code');
              setIsAndroidModalOpen(true);
            }}
            currentUser={currentUser}
            syncInfo={syncInfo}
            onOpenAuthSync={() => setIsAuthSyncModalOpen(true)}
            onPerformSync={performCloudSync}
          />
        );
      default:
        return null;
    }
  };

  return (
    <>
      {/* Optional App Lock Screen (if PIN is enabled and app is locked) */}
      {isAppLocked && securitySettings.isLockEnabled && securitySettings.hasSetupPin && (
        <LockScreen
          pinHash={securitySettings.pinHash}
          pinSalt={securitySettings.pinSalt}
          isBiometricsEnabled={securitySettings.isBiometricsEnabled}
          onUnlock={unlockApp}
        />
      )}

      <AndroidFrame
        isDeviceMode={isDeviceMode}
        onToggleDeviceMode={() => setIsDeviceMode(prev => !prev)}
      >
        <div className="flex flex-1 flex-col bg-zinc-50 dark:bg-zinc-950 transition-colors min-h-full">
          <TopAppBar
            currentScreen={currentScreen}
            onNavigate={handleNavigate}
            darkTheme={darkTheme}
            onToggleTheme={() => setDarkTheme(!darkTheme)}
            onOpenAndroidCode={(tab?: 'code' | 'export') => {
              setAndroidModalTab(tab || 'code');
              setIsAndroidModalOpen(true);
            }}
            onOpenCategoryManager={handleOpenCategoryManager}
            onOpenNotifications={() => setIsNotificationDrawerOpen(true)}
            unreadNotificationsCount={unreadNotificationsCount}
            isLockEnabled={Boolean(securitySettings.isLockEnabled && securitySettings.hasSetupPin)}
            onLockApp={lockApp}
            currentUser={currentUser}
            syncInfo={syncInfo}
            onOpenAuthSync={() => setIsAuthSyncModalOpen(true)}
          />

          <main className="flex-1 overflow-y-auto pb-20">{renderCurrentScreen()}</main>

          <BottomNavBar currentScreen={currentScreen} onNavigate={handleNavigate} />
        </div>
      </AndroidFrame>

      {/* Cloud Auth & Synchronization Modal */}
      <AuthSyncModal
        isOpen={isAuthSyncModalOpen}
        onClose={() => setIsAuthSyncModalOpen(false)}
        currentUser={currentUser}
        syncInfo={syncInfo}
        onLoginSuccess={loginUser}
        onLogoutSuccess={logoutUser}
        onPerformSync={performCloudSync}
        itemCounts={{
          transactions: transactions.length,
          budgets: budgets.length,
          savingsGoals: savingsGoals.length,
          categories: categories.length
        }}
      />

      {/* Android Kotlin Native Code Viewer Modal */}
      <AndroidProjectModal
        isOpen={isAndroidModalOpen}
        initialTab={androidModalTab}
        onClose={() => setIsAndroidModalOpen(false)}
      />

      {/* Category Manager Modal (Room Database entities & DAOs) */}
      <CategoryModal
        isOpen={isCategoryModalOpen}
        onClose={() => setIsCategoryModalOpen(false)}
        categories={categories}
        onAddCategory={addCategory}
        onUpdateCategory={updateCategory}
        onDeleteCategory={deleteCategory}
        isCategoryUsed={isCategoryUsed}
      />

      {/* Notification Drawer (Budget alerts 70%, 90%, 100% & savings reminders) */}
      <NotificationDrawer
        isOpen={isNotificationDrawerOpen}
        onClose={() => setIsNotificationDrawerOpen(false)}
        notifications={notifications}
        onMarkAllAsRead={markAllNotificationsAsRead}
        onClearAll={clearAllNotifications}
        onNavigateToScreen={handleNavigate}
        onTestNotification={triggerTestNotification}
      />
    </>
  );
}
