import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { STEP_FLOW } from './onboarding/constants';
import { WelcomeStep } from './onboarding/steps/WelcomeStep';
import { AccountsStep } from './onboarding/steps/AccountsStep';
import { CategoriesStep } from './onboarding/steps/CategoriesStep';
import { PeriodStep } from './onboarding/steps/PeriodStep';
import { useOnboardingData } from './onboarding/hooks/useOnboardingData';

export default function OnboardingPage() {
  const navigate = useNavigate();
  const [currentIndex, setCurrentIndex] = useState(0);
  const currentStep = STEP_FLOW[currentIndex];

  const {
    accounts,
    categories,
    loadingData,
    errorMessage,
    totalBalance,
    accountForm,
    setAccountForm,
    savingAccount,
    addAccount,
    categoryDrafts,
    setCategoryDrafts,
    pendingCategories,
    togglePresetCategory,
    addCustomCategory,
    removePendingCategory,
    persistPendingCategories,
    savingCategories,
    savingPeriod,
    periodError,
    createPeriod,
    recentCategoryIds,
    periodForm,
    setPeriodForm,
    selectedAccount,
    allocatedAmount,
    dailyAmount,
  } = useOnboardingData();

  const handleNext = async () => {
    if (currentStep.id === 'categories') {
      const saved = await persistPendingCategories();
      if (!saved) {
        return;
      }
    } else if (currentStep.id === 'period') {
      const saved = await createPeriod();
      if (!saved) {
        return;
      }
      // Redirigir al dashboard después de crear el periodo exitosamente
      navigate('/app');
      return;
    }
    setCurrentIndex((prev) => Math.min(prev + 1, STEP_FLOW.length - 1));
  };

  const handlePrev = () => {
    setCurrentIndex((prev) => Math.max(prev - 1, 0));
  };

  const renderStep = () => {
    switch (currentStep.id) {
      case 'welcome':
        return <WelcomeStep />;
      case 'accounts':
        return (
          <AccountsStep
            accounts={accounts}
            totalBalance={totalBalance}
            accountForm={accountForm}
            setAccountForm={setAccountForm}
            onAddAccount={addAccount}
            savingAccount={savingAccount}
          />
        );
      case 'categories':
        return (
          <CategoriesStep
            categories={categories}
            categoryDrafts={categoryDrafts}
            setCategoryDrafts={setCategoryDrafts}
            pendingCategories={pendingCategories}
            recentCategoryIds={recentCategoryIds}
            onTogglePreset={togglePresetCategory}
            onAddCustom={addCustomCategory}
            onRemovePending={removePendingCategory}
          />
        );
      case 'period':
        return (
          <PeriodStep
            accounts={accounts}
            periodForm={periodForm}
            setPeriodForm={setPeriodForm}
            selectedAccount={selectedAccount}
            allocatedAmount={allocatedAmount}
            dailyAmount={dailyAmount}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-[#f5f5f5] px-6 py-8 text-gray-900">
      <div className="mx-auto flex min-h-[90vh] w-full max-w-sm flex-col justify-between rounded-[40px] bg-white px-6 py-8 shadow-sm">
        <div className="space-y-6">
       

          {loadingData && (
            <div className="rounded-2xl bg-gray-100 px-4 py-3 text-center text-xs uppercase tracking-wide text-gray-500">
              Cargando tu información...
            </div>
          )}

          {errorMessage && (
            <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-xs uppercase tracking-wide text-red-500">
              {errorMessage}
            </div>
          )}

          {renderStep()}
        </div>

            <div className="space-y-4 pt-8">
          {periodError && currentStep.id === 'period' && (
            <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-xs uppercase tracking-wide text-red-500">
              {periodError}
            </div>
          )}
          <div className="flex items-center justify-between">
            <div className="flex gap-1">
              {STEP_FLOW.map((step, index) => (
                <span
                  key={step.id}
                  className={`h-1 w-12 rounded-full ${
                    index <= currentIndex ? 'bg-black' : 'bg-gray-200'
                  }`}
                />
              ))}
            </div>
            {currentIndex > 0 && (
              <button
                type="button"
                onClick={handlePrev}
                className="text-xs uppercase tracking-wide text-gray-500 underline"
              >
                Volver
              </button>
            )}
          </div>

          <button
            type="button"
            onClick={handleNext}
            disabled={
              (currentStep.id === 'categories' && savingCategories) ||
              (currentStep.id === 'period' && savingPeriod)
            }
            className="w-full rounded-full bg-black py-3 text-center text-sm font-semibold uppercase tracking-wide text-white disabled:opacity-50"
          >
            {currentStep.id === 'categories' && savingCategories
              ? 'Guardando...'
              : currentStep.id === 'period' && savingPeriod
                ? 'Guardando periodo...'
                : currentStep.actionLabel}
          </button>

      
        </div>
      </div>
    </div>
  );
}
