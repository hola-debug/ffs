import { useState } from 'react';
import { TodayExpenses, Account, Category } from '../../../lib/types';
import { BaseCard } from '../BaseCard';
import AddExpenseModal from '../../AddExpenseModal';

interface DailyExpensesModuleProps {
  data: TodayExpenses | null;
  accounts: Account[];
  categories: Category[];
  onRefresh: () => void;
}

export function DailyExpensesModule({ 
  data, 
  accounts, 
  categories, 
  onRefresh 
}: DailyExpensesModuleProps) {
  const [showModal, setShowModal] = useState(false);

  return (
    <>
      <BaseCard variant="success">
        <div className="text-center min-w-0">
          <h2 className="text-sm font-semibold mb-2 uppercase tracking-wide truncate">
            Gastos Diarios
          </h2>
          <div className="mb-1">
            <span className="text-xs sm:text-sm">RESTA</span>
          </div>
          <div className="text-3xl sm:text-7xl font-bold mb-2 sm:mb-6 break-all px-1">
            ${(data?.total_today || 0).toLocaleString('es-UY')}
          </div>
          
          <button
            onClick={() => setShowModal(true)}
            className="w-full py-2 sm:py-3 bg-green-600 hover:bg-green-700 rounded-lg font-semibold uppercase text-xs sm:text-base tracking-wide transition-colors"
          >
            Agregar Gasto
          </button>
        </div>

        {/* Logo o branding */}
        <div className="mt-2 sm:mt-6 text-center opacity-50">
          <div className="text-sm sm:text-2xl font-bold italic break-all">FFS.FINANCE</div>
        </div>
      </BaseCard>

      {showModal && (
        <AddExpenseModal
          accounts={accounts}
          categories={categories}
          isRandom={false}
          onClose={() => setShowModal(false)}
          onSuccess={() => {
            onRefresh();
            setShowModal(false);
          }}
        />
      )}
    </>
  );
}
