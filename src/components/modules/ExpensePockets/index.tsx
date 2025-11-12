import { BaseCard } from '../BaseCard';

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
    <BaseCard className="col-span-2">
      <div className="space-y-3">
        {/* Header */}
        <div className="flex items-center gap-2 mb-1">
          <span className="text-2xl">👛</span>
          <h3 className="text-lg font-bold text-white/90">Bolsas de Gasto</h3>
        </div>

        {/* Pockets Grid */}
        <div className="grid gap-3">
          {pockets.map((pocket) => {
            const percentage = (pocket.current_balance / pocket.allocated_amount) * 100;
            const isLow = percentage < 20;
            const isMedium = percentage >= 20 && percentage < 50;
            
            return (
              <div
                key={pocket.id}
                className="group relative bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/10 
                          hover:bg-white/8 hover:border-white/20 transition-all duration-300
                          hover:shadow-lg hover:shadow-black/20"
              >
                {/* Header */}
                <div className="flex justify-between items-start mb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{pocket.emoji}</span>
                    <h4 className="font-bold text-white/90 text-base">{pocket.name}</h4>
                  </div>
                  <div className="flex flex-col items-end">
                    <span className="text-xs text-white/50 font-medium">
                      {pocket.days_remaining} días
                    </span>
                  </div>
                </div>

                {/* Amounts */}
                <div className="flex justify-between items-baseline mb-3">
                  <div>
                    <div className="text-xs text-white/50 mb-0.5">Saldo</div>
                    <div className="text-2xl font-bold text-white">
                      ${pocket.current_balance.toLocaleString()}
                    </div>
                  </div>
                  {pocket.remaining_daily_allowance != null && (
                    <div className="text-right">
                      <div className="text-xs text-white/50 mb-0.5">Diario</div>
                      <div className="text-lg font-semibold text-emerald-400">
                        ${pocket.remaining_daily_allowance.toFixed(0)}
                      </div>
                    </div>
                  )}
                </div>

                {/* Progress Bar */}
                <div className="relative">
                  <div className="w-full bg-white/10 rounded-full h-2 overflow-hidden">
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
                  <div className="flex justify-between mt-1.5">
                    <span className="text-xs text-white/40">
                      ${pocket.allocated_amount.toLocaleString()}
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
            );
          })}
        </div>
      </div>
    </BaseCard>
  );
}
