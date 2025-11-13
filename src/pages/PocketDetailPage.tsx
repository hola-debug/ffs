import { useParams, useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import { usePocketDetail } from '../hooks/usePocketDetail';
import { ToastContainer } from '../components/ui/Toast';
import { useToast } from '../hooks/useToast';
import { BaseCard } from '../components/modules/BaseCard';
import CountUp from '../components/ui/CountUp';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';

export default function PocketDetailPage() {
  const { pocketId } = useParams<{ pocketId: string }>();
  const navigate = useNavigate();
  const { pocket, movements, stats, loading, error } = usePocketDetail(pocketId);
  const { toasts, removeToast } = useToast();

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-red-400">Error: {error}</div>
      </div>
    );
  }

  if (loading) {
    return (
      <>
        <Header />
        <div className="min-h-screen bg-[#D5D5D5] w-full overflow-x-hidden box-border pt-20" />
      </>
    );
  }

  if (!pocket) {
    return (
      <>
        <Header />
        <div className="min-h-screen bg-[#D5D5D5] w-full overflow-x-hidden box-border pt-20">
          <div className="flex items-center justify-center h-96">
            <div className="text-gray-600">Bolsa no encontrada</div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Header />
      <ToastContainer toasts={toasts} onRemove={removeToast} />
      <div className="min-h-screen bg-[#D5D5D5] w-full overflow-x-hidden box-border pt-20">
        <div className="max-w-4xl mx-auto w-full box-border px-2 sm:px-4 py-2 sm:py-4">
          {/* Botón atrás */}
          <button
            onClick={() => navigate('/app')}
            className="flex items-center gap-2 text-gray-700 hover:text-gray-900 mb-4 transition"
          >
            <ArrowLeftIcon className="w-5 h-5" />
            Volver
          </button>

          {/* Header con emoji y nombre */}
          <div className="flex items-center gap-3 mb-6">
            <span className="text-6xl">{pocket.emoji || '👛'}</span>
            <div>
              <h1 className="text-3xl font-bold text-gray-800">{pocket.name}</h1>
              <p className="text-sm text-gray-600">
                {pocket.days_remaining} días restantes
              </p>
            </div>
          </div>

          {/* Grid principal */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            {/* Tarjeta: Saldo disponible */}
            <BaseCard>
              <div className="flex flex-col">
                <span className="text-xs text-white/50 uppercase font-semibold mb-2">
                  Saldo Disponible
                </span>
                <div className="flex items-baseline gap-1">
                  <span className="text-2xl font-bold text-white">$</span>
                  <CountUp
                    from={0}
                    to={Math.round(pocket.current_balance)}
                    separator="."
                    direction="up"
                    duration={1}
                    className="text-4xl font-bold text-white"
                  />
                </div>
                <p className="text-xs text-white/60 mt-2">
                  de ${pocket.allocated_amount.toLocaleString()}
                </p>
              </div>
            </BaseCard>

            {/* Tarjeta: Diario */}
            <BaseCard>
              <div className="flex flex-col">
                <span className="text-xs text-white/50 uppercase font-semibold mb-2">
                  Por Día
                </span>
                <div className="flex items-baseline gap-1">
                  <span className="text-2xl font-bold text-emerald-400">$</span>
                  <CountUp
                    from={0}
                    to={Math.round(pocket.remaining_daily_allowance || 0)}
                    separator="."
                    direction="up"
                    duration={1}
                    className="text-4xl font-bold text-emerald-400"
                  />
                </div>
                <p className="text-xs text-white/60 mt-2">
                  {pocket.days_remaining} días disponibles
                </p>
              </div>
            </BaseCard>

            {/* Tarjeta: Gastado */}
            {stats && (
              <BaseCard>
                <div className="flex flex-col">
                  <span className="text-xs text-white/50 uppercase font-semibold mb-2">
                    Total Gastado
                  </span>
                  <div className="flex items-baseline gap-1">
                    <span className="text-2xl font-bold text-red-400">$</span>
                    <CountUp
                      from={0}
                      to={Math.round(stats.totalSpent)}
                      separator="."
                      direction="up"
                      duration={1}
                      className="text-4xl font-bold text-red-400"
                    />
                  </div>
                  <p className="text-xs text-white/60 mt-2">
                    {stats.percentageUsed.toFixed(0)}% del presupuesto
                  </p>
                </div>
              </BaseCard>
            )}

            {/* Tarjeta: Promedio diario */}
            {stats && (
              <BaseCard>
                <div className="flex flex-col">
                  <span className="text-xs text-white/50 uppercase font-semibold mb-2">
                    Promedio Diario
                  </span>
                  <div className="flex items-baseline gap-1">
                    <span className="text-2xl font-bold text-blue-400">$</span>
                    <CountUp
                      from={0}
                      to={Math.round(stats.dailyAverage)}
                      separator="."
                      direction="up"
                      duration={1}
                      className="text-4xl font-bold text-blue-400"
                    />
                  </div>
                  <p className="text-xs text-white/60 mt-2">
                    en {stats.daysElapsed} días
                  </p>
                </div>
              </BaseCard>
            )}
          </div>

          {/* Barra de progreso */}
          {stats && (
            <BaseCard className="mb-6">
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-semibold text-white/80">Progreso</span>
                  <span className="text-sm font-bold text-white">
                    {stats.percentageUsed.toFixed(0)}%
                  </span>
                </div>
                <div className="w-full bg-white/10 rounded-full h-3 overflow-hidden">
                  <div
                    className="h-3 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all duration-500"
                    style={{
                      width: `${Math.min(stats.percentageUsed, 100)}%`,
                    }}
                  />
                </div>
              </div>
            </BaseCard>
          )}

          {/* Movimientos */}
          <BaseCard>
            <div>
              <h2 className="text-lg font-bold text-white/90 mb-4">Movimientos</h2>
              {movements.length === 0 ? (
                <p className="text-sm text-white/50">Sin movimientos registrados</p>
              ) : (
                <div className="space-y-2">
                  {movements.slice(0, 20).map((movement) => (
                    <div
                      key={movement.id}
                      className="flex justify-between items-center py-2 px-2 rounded hover:bg-white/5 transition"
                    >
                      <div>
                        <p className="text-sm text-white/80">{movement.description}</p>
                        <p className="text-xs text-white/50">
                          {new Date(movement.date).toLocaleDateString('es-UY')}
                        </p>
                      </div>
                      <span
                        className={`font-semibold ${
                          movement.type === 'pocket_expense'
                            ? 'text-red-400'
                            : 'text-emerald-400'
                        }`}
                      >
                        {movement.type === 'pocket_expense' ? '-' : '+'}$
                        {Math.abs(movement.amount).toLocaleString()}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </BaseCard>
        </div>
      </div>
    </>
  );
}
