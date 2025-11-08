import { DailySpendable } from '../lib/types';

interface Props {
  data: DailySpendable | null;
}

export default function DailyBalanceCard({ data }: Props) {
  if (!data) {
    return (
      <div className="bg-[#000000] rounded-lg p-6 shadow-lg">
        <h2 className="text-lg font-semibold mb-4">Saldo diario</h2>
        <p className="text-gray-400">Sin datos</p>
      </div>
    );
  }

  return (
    <div className="bg-[#000000] rounded-lg p-6 shadow-lg">
      <h2 className="text-lg font-semibold mb-2">Saldo diario</h2>
      <div className="text-5xl font-bold mb-4">
        ${data.saldo_diario_restante_hoy.toLocaleString('es-UY')}
      </div>
      <div className="space-y-1 text-sm text-gray-300">
        <p>Disponible mes: ${data.disponible_mes.toLocaleString('es-UY')}</p>
        <p>Días restantes: {data.dias_restantes}</p>
        <p>Gastos hoy: ${data.gastos_hoy.toLocaleString('es-UY')}</p>
      </div>
    </div>
  );
}
