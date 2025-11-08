import { MonthSummary } from '../lib/types';

interface Props {
  data: MonthSummary | null;
}

export default function MonthlyIncomeCard({ data }: Props) {
  return (
    <div className="bg-gray-900 rounded-lg p-6 shadow-lg">
      <h2 className="text-lg font-semibold mb-4">Ingreso mes</h2>
      <div className="text-4xl font-bold mb-4">
        ${(data?.total_income || 0).toLocaleString('es-UY')}
      </div>
      <button className="w-full py-2 bg-blue-600 hover:bg-blue-700 rounded font-medium">
        Gestionar
      </button>
    </div>
  );
}
