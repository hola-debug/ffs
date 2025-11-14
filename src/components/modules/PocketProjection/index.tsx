import { ActivePocketSummary } from '../../../lib/types';
import { EyeIcon } from '@heroicons/react/24/outline';
import AnimatedList from '../../ui/AnimatedList';
import CountUp from '../../ui/CountUp';
import { useMemo } from 'react';

interface PocketProjectionModuleProps {
  pockets?: ActivePocketSummary[];
  pocket?: ActivePocketSummary;
  onRefresh?: () => void;
}

interface DailyProjection {
  date: string;
  day_name: string;
  accumulated_balance: number;
}

export function PocketProjectionModule({ pockets, pocket, onRefresh }: PocketProjectionModuleProps) {
  const activeExpensePocket =
    pocket || (pockets ? pockets.find(p => p.type === 'expense' && p.status === 'active') : undefined);

  // Calcular proyecciones
  const projections = useMemo(() => {
    if (!activeExpensePocket) return [];

    const dailyAllowance = Number(activeExpensePocket.daily_allowance) || 0;
    const allocatedAmount = Number(activeExpensePocket.allocated_amount) || 0;
    
    // Parsear fechas
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const startsAt = new Date(activeExpensePocket.starts_at);
    startsAt.setHours(0, 0, 0, 0);
    
    const endsAt = new Date(activeExpensePocket.ends_at);
    endsAt.setHours(0, 0, 0, 0);
    
    // Calcular días disponibles sin exceder ends_at
    const maxDays = Math.max(0, Math.ceil((endsAt.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)));
    
    const projectionsList: DailyProjection[] = [];
    const dayNames = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

    // Calcular proyección para cada día hasta ends_at
    for (let i = 0; i <= maxDays; i++) {
      const projectionDate = new Date(today);
      projectionDate.setDate(today.getDate() + i);
      
      // No exceder ends_at
      if (projectionDate > endsAt) break;
      
      // Calcular días desde el inicio de la bolsa hasta la fecha de proyección
      const daysFromStart = Math.ceil((projectionDate.getTime() - startsAt.getTime()) / (1000 * 60 * 60 * 24));
      
      // Saldo teórico acumulado: (daily_allowance * días desde inicio) - gastos realizados
      // Los gastos realizados = allocated_amount - current_balance
      const spentAmount = allocatedAmount - Number(activeExpensePocket.current_balance);
      const accumulatedBalance = (dailyAllowance * daysFromStart) - spentAmount;
      
      projectionsList.push({
        date: projectionDate.toISOString().split('T')[0],
        day_name: dayNames[projectionDate.getDay()],
        accumulated_balance: accumulatedBalance
      });
    }

    return projectionsList;
  }, [activeExpensePocket]);

  // Calcular el saldo actual acumulado usando la misma lógica que las proyecciones
  const currentAccumulatedBalance = useMemo(() => {
    if (!activeExpensePocket) return 0;

    const dailyAllowance = Number(activeExpensePocket.daily_allowance) || 0;
    const allocatedAmount = Number(activeExpensePocket.allocated_amount) || 0;
    const currentBalance = Number(activeExpensePocket.current_balance) || 0;
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const startsAt = new Date(activeExpensePocket.starts_at);
    startsAt.setHours(0, 0, 0, 0);
    
    // Días desde el inicio hasta hoy
    const daysFromStart = Math.ceil((today.getTime() - startsAt.getTime()) / (1000 * 60 * 60 * 24));
    
    // Gastos realizados
    const spentAmount = allocatedAmount - currentBalance;
    
    // Saldo acumulado hoy: (daily_allowance * días desde inicio) - gastos realizados
    return (dailyAllowance * daysFromStart) - spentAmount;
  }, [activeExpensePocket]);

  return (
    <div
      className="relative w-full"
      style={{ borderRadius: '15px', overflow: 'hidden' }}
    >
      <div
        className="relative h-[270px] text-white font-sans "
        style={{ backgroundColor: '#000000' }}
      >
        {!activeExpensePocket ? (
          <div className="flex h-full flex-col items-center justify-center text-center p-6">
            <p className="text-xs opacity-70">No hay bolsa</p>
            <p className="text-[9px] opacity-50 mt-2">Crea una</p>
          </div>
        ) : (
          <>
            {/* COLUMNA IZQUIERDA (contenido negro) */}
            <div className="relative z-10 flex h-full flex-col p-3 pr-[52%]">
              {/* Header */}
              <div className="mb-4">
                <p className="text-[10px] uppercase text-[#ffffff] opacity-70 mb-2">
                  SALDO DIARIO
                </p>
                <div className="flex items-baseline gap-2">
                  <span className="text-xs opacity-70">HOY</span>
                  <span className="text-[19px] font-bold">$</span>
                  <CountUp
                    from={0}
                    to={Math.round(currentAccumulatedBalance)}
                    separator="."
                    direction="up"
                    duration={1}
                    className="text-[39px] font-bold leading-none tracking-tighter"
                  />
                  <EyeIcon className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                </div>
              </div>

              {/* Total mensual */}
              <div className="mb-4 pb-4 border-b border-white/10">
                <p className="text-[9px] uppercase opacity-50 mb-1">
                  Total mensual
                </p>
                <p className="text-lg font-semibold">
                  ${(Number(activeExpensePocket.allocated_amount) || 0).toLocaleString()}
                </p>
              </div>

              {/* Lista de proyecciones */}
              {projections.length > 0 && (
                <div className="relative flex-1 overflow-hidden">
                  <AnimatedList<DailyProjection>
                    items={projections}
                    onItemSelect={(item, index) => console.log(item, index)}
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
                      return (
                        <div
                          className={`flex justify-between items-center ${
                            isToday ? 'border px-2 -mx-2 rounded' : 'py-0'
                          }`}
                          style={isToday ? { borderColor: '#FF0000' } : undefined}
                        >
                          <span className="text-[10px] sm:text-xs tracking-wide font-medium">
                            {dayNum}/{monthNum} {proj.day_name.toUpperCase()}
                          </span>
                          <span className="text-sm sm:text-base font-semibold tabular-nums">
                            {Math.round(
                              Number(proj.accumulated_balance) || 0
                            ).toLocaleString('es-UY', {
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

            {/* COLUMNA DERECHA - Tarjeta celeste superpuesta */}
            <div className="absolute inset-y-0 right-0 w-[48%]">
              <div
                className="h-full flex flex-col justify-between p-3"
                style={{
                  backgroundColor: '#2BA9E4',
                  borderRadius: '10px',
                }}
              >
                {/* Nombre Bolsa */}
                <div className="mb-6">
                  <p className="text-[10px] uppercase opacity-70 mb-3">
                    Nombre de tu bolsa
                  </p>
                  <h3 className="text-2xl font-bold">
                    {activeExpensePocket.name}
                  </h3>
                </div>

                {/* Info Destino */}
                <div className="mb-6">
                  <p className="text-[10px] uppercase opacity-70 mb-3">
                    Destino
                  </p>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-xs opacity-70">Inicio</span>
                      <span className="text-sm font-semibold">
                        {new Date(
                          activeExpensePocket.starts_at
                        ).toLocaleDateString('es-UY')}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs opacity-70">Fin</span>
                      <span className="text-sm font-semibold">
                        {new Date(
                          activeExpensePocket.ends_at
                        ).toLocaleDateString('es-UY')}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Botón */}
                <button className="w-full bg-black/80 hover:bg-black text-white text-xs uppercase font-semibold py-2 px-4 rounded-full transition">
                  Agregar gasto
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}