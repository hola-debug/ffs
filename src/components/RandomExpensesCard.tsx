import { useState } from 'react';
import { RandomExpensesMonth, Account, Category } from '../lib/types';
import AddExpenseModal from './AddExpenseModal';

interface Props {
  data: RandomExpensesMonth | null;
  accounts: Account[];
  categories: Category[];
  onRefresh: () => void;
}

export default function RandomExpensesCard({ data, accounts, categories, onRefresh }: Props) {
  const [showModal, setShowModal] = useState(false);

  return (
    <>
      <div className="bg-gray-900 rounded-lg p-6 shadow-lg">
        <h2 className="text-lg font-semibold mb-4">Gastos random</h2>
        <div className="text-4xl font-bold mb-4">
          ${(data?.total_random || 0).toLocaleString('es-UY')}
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="w-full py-2 bg-orange-600 hover:bg-orange-700 rounded font-medium"
        >
          Agregar gasto
        </button>
      </div>

      {showModal && (
        <AddExpenseModal
          accounts={accounts}
          categories={categories}
          isRandom={true}
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
