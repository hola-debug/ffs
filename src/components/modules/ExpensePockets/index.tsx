import { BaseCard } from '../BaseCard';
import { useNavigate } from 'react-router-dom';
import { PocketIcon } from '@/components/PocketIcon';

interface ExpensePocket {
  id: string;
  name: string;
  emoji: string;
  current_balance: number;
  allocated_amount: number;
  days_remaining: number;
  remaining_daily_allowance?: number;
}

interface ExpensePocketsModuleProps {
  pockets: ExpensePocket[];
}

export function ExpensePocketsModule({ pockets }: ExpensePocketsModuleProps) {
  const navigate = useNavigate();
  if (pockets.length === 0) {
    return (
      <BaseCard className="col-span-2">
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <div className="text-5xl mb-3">👛</div>
          <h3 className="text-lg font-bold text-white/90 mb-2">No hay bolsas de gasto</h3>
          <p className="text-sm text-white/50">Crea una bolsa para empezar a gestionar tus gastos</p>
        </div>
      </BaseCard>
    );
  }

  return (
    <>
      {/* Header */}
      <div className="col-span-2 flex items-center gap-2 px-2">
        <PocketIcon iconId="wallet" className="w-6 h-6 text-gray-800" />
        <h3 className="text-lg font-bold text-gray-800">Bolsas de Gasto</h3>
      </div>

      {/* Pockets Grid */}
      {pockets.map((pocket) => {
        const percentage = (pocket.current_balance / pocket.allocated_amount) * 100;
        const isLow = percentage < 20;
        const isMedium = percentage >= 20 && percentage < 50;
        
        return (
          <BaseCard
            key={pocket.id}
            className="group relative overflow-hidden hover:shadow-xl transition-all duration-300 cursor-pointer"
            onClick={() => navigate(`/app/pocket/${pocket.id}`)}
          >
            <div className="flex flex-col h-full">
              {/* Emoji y Nombre */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <PocketIcon iconId={pocket.emoji} className="w-7 h-7 text-white" fallbackClassName="text-3xl" />
                  <h4 className="font-bold text-white/90 text-base">{pocket.name}</h4>
                </div>
                <span className="text-xs text-white/50 font-medium">
                  {pocket.days_remaining}d
                </span>
              </div>

              {/* Saldo Principal */}
              <div className="mb-2">
                <div className="text-xs text-white/50 mb-1">Saldo Disponible</div>
                <div className="text-3xl font-bold text-white">
                  ${pocket.current_balance.toLocaleString()}
                </div>
              </div>

              {/* Diario */}
              {pocket.remaining_daily_allowance != null && (
                <div className="mb-3">
                  <div className="text-xs text-white/50 mb-0.5">Por día</div>
                  <div className="text-lg font-semibold text-emerald-400">
                    ${pocket.remaining_daily_allowance.toFixed(0)}
                  </div>
                </div>
              )}

              {/* Spacer */}
              <div className="flex-grow" />

              {/* Progress Bar */}
              <div className="mt-auto">
                <div className="w-full bg-white/10 rounded-full h-2 overflow-hidden mb-2">
                  <div 
                    className={`h-2 rounded-full transition-all duration-500 ease-out ${
                      isLow 
                        ? 'bg-gradient-to-r from-red-500 to-rose-500' 
                        : isMedium
                        ? 'bg-gradient-to-r from-amber-500 to-orange-500'
                        : 'bg-gradient-to-r from-purple-500 to-pink-500'
                    }`}
                    style={{ width: `${Math.min(percentage, 100)}%` }}
                  />
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-white/40">
                    de ${pocket.allocated_amount.toLocaleString()}
                  </span>
                  <span className={`text-xs font-semibold ${
                    isLow 
                      ? 'text-red-400' 
                      : isMedium
                      ? 'text-amber-400'
                      : 'text-purple-400'
                  }`}>
                    {percentage.toFixed(0)}%
                  </span>
                </div>
              </div>
            </div>
          </BaseCard>
        );
      })}
    </>
  );
}
