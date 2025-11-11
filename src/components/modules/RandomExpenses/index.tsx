import { RandomExpensesMonth, Account, Category } from '../../../lib/types';
import { BaseCard } from '../BaseCard';
import AddExpensePopover from '../../AddExpensePopover';

interface RandomExpensesModuleProps {
  data: RandomExpensesMonth | null;
  accounts: Account[];
  categories: Category[];
  periods?: import('../../../lib/types').Period[];
  onRefresh: () => void;
}

export function RandomExpensesModule({ 
  data, 
  accounts, 
  categories,
  periods,
  onRefresh 
}: RandomExpensesModuleProps) {

  return (
    <>
      <BaseCard variant="warning">
        <h2 className="text-sm font-semibold mb-4 uppercase tracking-wide">
          Gastos Random
        </h2>

        <div className="text-2xl sm:text-6xl font-bold mb-2 sm:mb-6 break-all px-1">
          ${(data?.total_random || 0).toLocaleString('es-UY')}
        </div>

        <AddExpensePopover
          accounts={accounts}
          categories={categories}
          periods={periods}
          isRandom={true}
          onSuccess={onRefresh}
          trigger={
            <button className="w-full py-2 sm:py-3 bg-orange-600 hover:bg-orange-700 rounded-lg font-semibold uppercase text-xs sm:text-base tracking-wide transition-colors">
              Agregar Gasto
            </button>
          }
        />
      </BaseCard>
    </>
  );
}
