import { useMemo, useState } from 'react';
import { ActivePocketSummary } from '@/lib/types';
import { usePocketSummary } from './usePocketSummary';
import CountUp from '@/components/ui/CountUp';
import { useAccountsStore } from '@/hooks/useAccountsStore';

interface PocketSummaryProps {
    pocket: ActivePocketSummary;
}

const formatShortDate = (date: Date) =>
    date.toLocaleDateString('es-UY', {
        day: 'numeric',
        month: 'numeric',
    });

// Icono del ojo
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

export const FixedExpensePocketSummary = ({ pocket }: PocketSummaryProps) => {
    const { format } = usePocketSummary(pocket);
    const { convertAmount } = useAccountsStore();

    // Moneda seleccionada (entre UYU y USD)
    const [selectedCurrency, setSelectedCurrency] = useState<string>(
        pocket.currency || 'UYU'
    );
    const toggleCurrency = () => {
        setSelectedCurrency((prev) => (prev === 'USD' ? 'UYU' : 'USD'));
    };

    const currencySymbol = selectedCurrency === 'USD' ? 'US$' : '$';

    // Helper para convertir montos a la moneda elegida
    const toDisplay = (amount: number): number => {
        const safe = Number(amount) || 0;
        if (!selectedCurrency || selectedCurrency === pocket.currency) {
            return safe;
        }
        const converted = convertAmount(safe, pocket.currency, selectedCurrency);
        return converted ?? safe;
    };

    // Campos específicos de EXPENSE.FIXED
    const monthlyAmount = Number((pocket as any).monthly_amount) || 0;
    const dueDay = Number((pocket as any).due_day) || 1;
    const lastPayment = (pocket as any).last_payment ? new Date((pocket as any).last_payment) : null;
    const nextPayment = (pocket as any).next_payment ? new Date((pocket as any).next_payment) : null;

    // Calcular días hasta el próximo pago
    const daysUntilPayment = useMemo(() => {
        if (!nextPayment) return 0;

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const next = new Date(nextPayment);
        next.setHours(0, 0, 0, 0);

        const diff = next.getTime() - today.getTime();
        const MS_PER_DAY = 1000 * 60 * 60 * 24;
        return Math.max(0, Math.ceil(diff / MS_PER_DAY));
    }, [nextPayment]);

    // Valores convertidos a la moneda seleccionada
    const displayMonthlyAmount = toDisplay(monthlyAmount);

    // Determinar el estado del pago
    const paymentStatus = useMemo(() => {
        if (daysUntilPayment === 0) return 'Vence hoy';
        if (daysUntilPayment === 1) return 'Vence mañana';
        if (daysUntilPayment <= 7) return `Vence en ${daysUntilPayment} días`;
        return `Próximo pago: día ${dueDay}`;
    }, [daysUntilPayment, dueDay]);

    return (
        <div className="relative w-full h-[269px] flex rounded-[18px] overflow-hidden font-[Monda] bg-black">
            {/* LADO IZQUIERDO - FONDO NEGRO */}
            <div className="w-1/2 flex flex-col justify-between px-6 py-6 text-white">
                <p className="text-[10px] uppercase tracking-[0.25em] opacity-90">
                    Gasto fijo mensual
                </p>

                <div className="-mt-2">
                    <div className="flex items-baseline gap-2">
                        <span className="text-[19px] font-bold">
                            {currencySymbol}
                        </span>
                        <span style={{ color: '#2BA9E4' }} className="text-[52px] font-bold leading-none tracking-tighter">
                            <CountUp
                                from={0}
                                to={Math.round(displayMonthlyAmount)}
                                duration={1}
                                separator="."
                            />
                        </span>

                        {/* Botón del ojo → cambia moneda */}
                        <button
                            type="button"
                            onClick={toggleCurrency}
                            className="ml-1 flex items-center justify-center transition hover:opacity-80"
                        >
                            <EyeIcon isOpen={selectedCurrency === 'USD'} />
                        </button>
                    </div>
                </div>

                <p className="text-[11px] leading-tight uppercase tracking-[0.12em] max-w-[210px] opacity-90">
                    {paymentStatus}
                </p>
            </div>

            {/* LADO DERECHO - IMAGEN DE FONDO */}
            <div
                className="w-1/2 relative flex flex-col justify-between p-6 text-white rounded-[18px] overflow-hidden"
                style={{
                    backgroundImage: "url('/fixed_expense.webp')",
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                }}
            >
                {/* Nombre */}
                <div>
                    <p className="text-[10px] uppercase opacity-70 mb-1 tracking-[0.15em]">
                        Nombre de tu gasto
                    </p>
                    <h3 className="text-[20px] font-bold leading-none text-white">
                        {pocket.name || 'Gasto Fijo'}
                    </h3>
                </div>

                {/* Detalles */}
                <div className="space-y-1 text-[11px]">
                    <div className="flex justify-between">
                        <span className="opacity-70">Monto mensual</span>
                        <span className="font-semibold">
                            {format(monthlyAmount)}
                        </span>
                    </div>

                    <div className="flex justify-between">
                        <span className="opacity-70">Día de vencimiento</span>
                        <span className="font-semibold">{dueDay}</span>
                    </div>

                    {lastPayment && (
                        <div className="flex justify-between">
                            <span className="opacity-70">Último pago</span>
                            <span className="font-semibold">
                                {formatShortDate(lastPayment)}
                            </span>
                        </div>
                    )}

                    {nextPayment && (
                        <div className="flex justify-between">
                            <span className="opacity-70">Próximo pago</span>
                            <span className="font-semibold">
                                {formatShortDate(nextPayment)}
                            </span>
                        </div>
                    )}
                </div>

                {/* BOTÓN */}
                <button
                    type="button"
                    className="w-full text-white uppercase tracking-[0.25em] text-[11px] font-semibold py-2 rounded-full transition-transform active:scale-95"
                    style={{
                        backgroundColor: '#1E1614',
                    }}
                >
                    Registrar pago
                </button>
            </div>
        </div>
    );
};
