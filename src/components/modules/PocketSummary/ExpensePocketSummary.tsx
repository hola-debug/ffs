import { useMemo, useState, useEffect } from 'react';
import { ActivePocketSummary, Movement } from '@/lib/types';
import AnimatedList from '@/components/ui/AnimatedList';
import CountUp from '@/components/ui/CountUp';
import { usePocketSummary } from './usePocketSummary';
import { useAccountsStore } from '@/hooks/useAccountsStore';
import { supabase } from '@/lib/supabaseClient';

interface PocketSummaryProps {
  pocket: ActivePocketSummary;
  openModal?: (modalId: string, data?: { pocketId?: string }) => void;
}

interface DailyProjection {
  date: string;
  day_name: string;
  accumulated_balance: number;
}

// Icono del ojo (mismo recurso que en TotalBalance, desde /public/ojo.svg)
const EYE_ICON_URL = '/ojo.svg';

function EyeIcon({ isOpen }: { isOpen: boolean }) {
  return (
    <img
      src={EYE_ICON_URL}
      alt={isOpen ? 'Mostrar en USD' : 'Mostrar en UYU'}
      className="h-[19px] w-[19px]"
      draggable={false}
    />
  );
}

export const ExpensePocketSummary = ({ pocket, openModal }: PocketSummaryProps) => {
  const { format } = usePocketSummary(pocket);
  const { convertAmount } = useAccountsStore();

  // Estado para movimientos
  const [movements, setMovements] = useState<Movement[]>([]);
  const [loadingMovements, setLoadingMovements] = useState(true);

  // Moneda seleccionada (entre UYU y USD)
  const [selectedCurrency, setSelectedCurrency] = useState<string>(
    pocket.currency || 'UYU'
  );
  const toggleCurrency = () => {
    setSelectedCurrency((prev) => (prev === 'USD' ? 'UYU' : 'USD'));
  };

  const currencySymbol = selectedCurrency === 'USD' ? 'US$' : '$';

  // Fetch de movimientos pocket_expense
  const fetchMovements = async () => {
    try {
      setLoadingMovements(true);
      const { data, error } = await supabase
        .from('movements')
        .select('*')
        .eq('pocket_id', pocket.id)
        .eq('type', 'pocket_expense')
        .order('date', { ascending: false })
        .limit(20);

      if (error) throw error;
      setMovements((data as Movement[]) || []);
    } catch (error) {
      console.error('Error fetching movements:', error);
    } finally {
      setLoadingMovements(false);
    }
  };

  useEffect(() => {
    fetchMovements();
  }, [pocket.id]);

  // Helper para convertir montos a la moneda elegida
  const toDisplay = (amount: number): number => {
    const safe = Number(amount) || 0;
    if (!selectedCurrency || selectedCurrency === pocket.currency) {
      return safe;
    }
    const converted = convertAmount(safe, pocket.currency, selectedCurrency);
    return converted ?? safe;
  };

  // Campos específicos de EXPENSE.PERIOD (en moneda original del pocket)
  const allocatedAmount = Number(pocket.allocated_amount) || 0;

  const spentAmount =
    pocket.spent_amount != null
      ? Number(pocket.spent_amount)
      : allocatedAmount - (Number(pocket.current_balance) || 0);

  const remainingAmount =
    pocket.remaining_amount_expense != null
      ? Number(pocket.remaining_amount_expense)
      : allocatedAmount - spentAmount;

  const dailyAllowance = Number(pocket.daily_allowance) || 0;

  const startsAt = pocket.starts_at ? new Date(pocket.starts_at) : null;
  const endsAt = pocket.ends_at ? new Date(pocket.ends_at) : null;

  const MS_PER_DAY = 1000 * 60 * 60 * 24;

  const projections = useMemo<DailyProjection[]>(() => {
    if (!startsAt || !endsAt || !dailyAllowance) return [];

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const starts = new Date(startsAt);
    starts.setHours(0, 0, 0, 0);

    const ends = new Date(endsAt);
    ends.setHours(0, 0, 0, 0);

    // 👇 CAMBIO: usamos floor y no ponemos break dentro del for
    const diffDays = Math.max(
      0,
      Math.floor((ends.getTime() - today.getTime()) / MS_PER_DAY)
    );

    const dayNames = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
    const spent = spentAmount;
    const list: DailyProjection[] = [];

    for (let i = 0; i <= diffDays; i++) {
      const projectionDate = new Date(today);
      projectionDate.setDate(today.getDate() + i);

      const diffFromStart = projectionDate.getTime() - starts.getTime();
      let daysFromStart = Math.floor(diffFromStart / MS_PER_DAY) + 1;

      // Si aún no empezó el período, no contamos días
      if (diffFromStart < 0) {
        daysFromStart = 0;
      }

      const accumulatedBalance =
        daysFromStart > 0 ? dailyAllowance * daysFromStart - spent : -spent;


      list.push({
        date: projectionDate.toISOString().split('T')[0],
        day_name: dayNames[projectionDate.getDay()],
        accumulated_balance: accumulatedBalance,
      });
    }

    return list;
  }, [startsAt, endsAt, dailyAllowance, spentAmount]);


  // Saldo acumulado al día de hoy (mismo criterio que la lista)
  const currentAccumulatedBalance = useMemo(() => {
    if (!startsAt || !dailyAllowance) return 0;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const starts = new Date(startsAt);
    starts.setHours(0, 0, 0, 0);

    const diffFromStart = today.getTime() - starts.getTime();
    if (diffFromStart < 0) return 0; // todavía no arrancó

    const daysFromStart = Math.floor(diffFromStart / MS_PER_DAY) + 1;
    const spent = spentAmount;

    return dailyAllowance * daysFromStart - spent;

  }, [startsAt, dailyAllowance, spentAmount]);

  // Valores ya convertidos a la moneda seleccionada
  const displayDaily = toDisplay(currentAccumulatedBalance);
  const displayRemaining = toDisplay(remainingAmount);

  return (
    <div className="relative w-full h-[269px] flex rounded-[18px] overflow-hidden bg-black font-sans">
      {/* No hay bolsa (defensivo, en práctica siempre tenés pocket) */}
      {!pocket ? (
        <div className="flex h-full w-full flex-col items-center justify-center text-center p-6 text-white">
          <p className="text-xs opacity-70">No hay bolsa de gasto</p>
          <p className="text-[9px] opacity-50 mt-2">
            Creá una para ver el resumen
          </p>
        </div>
      ) : (
        <>
          {/* COLUMNA IZQUIERDA (contenido negro / resumen diario + mensual + lista) */}
          <div className="w-1/2 flex flex-col p-6 text-white">
            {/* Header: saldo diario hoy (acumulado) */}
            <div className="mb-4">
              <p className="text-[10px] uppercase text-[#ffffff] opacity-70 mb-2">
                SALDO DIARIO
              </p>
              <div className="flex items-baseline gap-2">
                <span className="text-xs opacity-70">HOY</span>
                <span className="text-[19px] font-bold">
                  {currencySymbol}
                </span>

                <CountUp
                  from={0}
                  to={Math.round(displayDaily)}
                  separator="."
                  direction="up"
                  duration={1}
                  className="text-[39px] font-bold leading-none tracking-tighter"
                />

                {/* Botón del ojo → cambia moneda */}
                <button
                  type="button"
                  onClick={toggleCurrency}
                  className="ml-1 flex items-center justify-center transition hover:opacity-80"
                >
                  <EyeIcon isOpen={selectedCurrency === 'USD'} />
                </button>
              </div>

              {/* TOTAL MENSUAL (restante = total - gastos) */}
              <p className="mt-2 text-[9px] text-center opacity-60 uppercase tracking-[0.2em]">
                TOTAL MENSUAL {format(displayRemaining)}
              </p>
            </div>

            {/* Lista de proyecciones (acumulación de saldos hacia adelante) */}
            {projections.length > 0 && (
              <div className="relative flex-1 overflow-hidden">
                <AnimatedList<DailyProjection>
                  items={projections}
                  onItemSelect={() => { }}
                  showGradients={true}
                  enableArrowNavigation={true}
                  displayScrollbar={false}
                  className="w-full h-full"
                  maxHeight="100%"
                  gradientColor="#000000"
                  renderItem={(proj) => {
                    const projDate = new Date(proj.date + 'T00:00:00');
                    const isToday =
                      projDate.toDateString() ===
                      new Date().toDateString();
                    const dayNum = projDate.getDate();
                    const monthNum = projDate.getMonth() + 1;
                    const displayAccum = Math.round(
                      toDisplay(proj.accumulated_balance)
                    );

                    return (
                      <div
                        className={`flex justify-between items-center ${isToday ? 'border px-2 -mx-2 rounded' : 'py-0'
                          }`}
                        style={
                          isToday ? { borderColor: '#FF0000' } : undefined
                        }
                      >
                        <span className="text-[10px] sm:text-xs tracking-wide font-medium">
                          {dayNum}/{monthNum}{' '}
                          {proj.day_name.toUpperCase()}
                        </span>
                        <span className="text-sm sm:text-base font-semibold tabular-nums">
                          {displayAccum.toLocaleString('es-UY', {
                            minimumFractionDigits: 0,
                          })}
                        </span>
                      </div>
                    );
                  }}
                />
              </div>
            )}
          </div>

          {/* COLUMNA DERECHA - Lista de transacciones */}
          <div
            className="w-1/2 flex flex-col p-6 text-white bg-gradient-to-br from-black/90 to-black/70 rounded-[18px] overflow-hidden backdrop-blur-sm border border-white/5"
          >
            {/* Header - Clickeable para agregar gasto */}
            <div
              className="mb-4 cursor-pointer group/header hover:opacity-80 transition-opacity"
              onClick={() => openModal?.('add-expense-to-pocket', { pocketId: pocket.id })}
            >
              <p className="text-[10px] uppercase tracking-[0.25em] opacity-70 mb-1">
                {pocket.name}
              </p>
              <h3 className="text-[14px] font-bold opacity-90 flex items-center gap-2">
                Transacciones Recientes
                <span className="text-[9px] opacity-0 group-hover/header:opacity-100 transition-opacity">
                  + Agregar
                </span>
              </h3>
            </div>

            {/* Lista de movimientos */}
            <div className="flex-1 overflow-hidden">
              {loadingMovements ? (
                <div className="flex items-center justify-center h-full">
                  <p className="text-xs opacity-50">Cargando...</p>
                </div>
              ) : movements.length === 0 ? (
                <div className="flex items-center justify-center h-full">
                  <p className="text-xs opacity-50 text-center">
                    No hay gastos registrados
                  </p>
                </div>
              ) : (
                <AnimatedList<Movement>
                  items={movements}
                  onItemSelect={() => { }}
                  showGradients={true}
                  enableArrowNavigation={false}
                  displayScrollbar={false}
                  className="w-full h-full"
                  maxHeight="100%"
                  gradientColor="rgba(0,0,0,0.9)"
                  renderItem={(movement) => {
                    const movDate = new Date(movement.date);
                    const dayNum = movDate.getDate();
                    const monthNum = movDate.getMonth() + 1;
                    const displayAmount = Math.round(
                      toDisplay(movement.amount)
                    );

                    return (
                      <div className="flex flex-col py-2 border-b border-white/5 last:border-0">
                        <div className="flex justify-between items-start gap-2">
                          <div className="flex-1 min-w-0">
                            <p className="text-[10px] font-medium text-white/90 truncate">
                              {movement.description || 'Sin descripción'}
                            </p>
                            <p className="text-[8px] text-white/50 mt-0.5">
                              {dayNum}/{monthNum}/{movDate.getFullYear().toString().slice(-2)}
                            </p>
                          </div>
                          <span className="text-[11px] font-bold text-red-400 tabular-nums whitespace-nowrap">
                            -{currencySymbol}{displayAmount.toLocaleString('es-UY')}
                          </span>
                        </div>
                      </div>
                    );
                  }}
                />
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};
