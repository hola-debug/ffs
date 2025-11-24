import { useEffect } from 'react';
import { PocketFieldsProps } from '../../types';

export function ExpenseFixedFields({ state, setState }: PocketFieldsProps) {
  // Set default values for fixed expenses container
  useEffect(() => {
    setState((prev) => ({
      ...prev,
      monthlyAmount: '0',
      dueDay: 1,
      autoRegister: false
    }));
  }, [setState]);

  return (
    <div className="space-y-5">
      <div className="space-y-1">
        <p className="font-monda text-[10px] tracking-[0.35em] text-white/70 uppercase">GASTO FIJO</p>
        <p className="font-roboto text-[11px] text-white/60">
          Esta bolsa agrupará tus gastos fijos recurrentes (Luz, Internet, Alquiler, etc).
        </p>
      </div>

      <div className="rounded-[20px] border border-white/10 bg-white/5 p-4">
        <div className="flex items-start gap-3">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#67F690]/20 text-[#67F690]">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
              <path fillRule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12zm8.706-1.442c1.146-.573 2.437.463 2.126 1.706l-.709 2.836.042-.02a.75.75 0 01.67 1.34l-.04.022c-1.147.573-2.438-.463-2.127-1.706l.71-2.836-.042.02a.75.75 0 11-.671-1.34l.041-.022zM12 9a.75.75 0 100-1.5.75.75 0 000 1.5z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="space-y-1">
            <p className="font-monda text-[11px] font-bold text-white">CONFIGURACIÓN AUTOMÁTICA</p>
            <p className="font-roboto text-[11px] leading-relaxed text-white/70">
              No es necesario configurar un monto total ahora. Podrás agregar cada gasto fijo individualmente (con su propio monto y fecha) una vez creada la bolsa.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
