import { useMemo, useState, useEffect } from 'react';
import { ActivePocketSummary, FixedExpenseItem, Movement } from '@/lib/types';
import CountUp from '@/components/ui/CountUp';
import { useAccountsStore } from '@/hooks/useAccountsStore';
import { supabase } from '@/lib/supabaseClient';
import ManageFixedExpensesModal from '@/components/modals/ManageFixedExpensesModal';

interface PocketSummaryProps {
    pocket: ActivePocketSummary;
}

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
    const { convertAmount } = useAccountsStore();

    // Estado para ítems y movimientos
    const [items, setItems] = useState<FixedExpenseItem[]>([]);
    const [movements, setMovements] = useState<Movement[]>([]);
    const [loading, setLoading] = useState(true);
    const [showManageModal, setShowManageModal] = useState(false);
    const [payingExpenseId, setPayingExpenseId] = useState<string | null>(null);

    // Moneda seleccionada (entre UYU y USD)
    const [selectedCurrency, setSelectedCurrency] = useState<string>(
        pocket.currency || 'UYU'
    );
    const toggleCurrency = () => {
        setSelectedCurrency((prev) => (prev === 'USD' ? 'UYU' : 'USD'));
    };

    const currencySymbol = selectedCurrency === 'USD' ? 'US$' : '$';

    // Fetch de datos
    const fetchData = async () => {
        try {
            setLoading(true);

            // 1. Obtener definiciones de gastos fijos
            const { data: expensesData } = await supabase
                .from('fixed_expenses')
                .select('*')
                .eq('pocket_id', pocket.id);

            if (expensesData) {
                setItems(expensesData as any);
            }

            // 2. Obtener movimientos del mes actual para este pocket
            const startOfMonth = new Date();
            startOfMonth.setDate(1);
            startOfMonth.setHours(0, 0, 0, 0);

            const { data: movementsData } = await supabase
                .from('movements' as any)
                .select('*')
                .eq('pocket_id', pocket.id)
                .gte('date', startOfMonth.toISOString());

            if (movementsData) {
                setMovements(movementsData as any);
            }

        } catch (error) {
            console.error('Error fetching fixed expenses:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [pocket.id]);

    // Función para marcar un gasto como pagado
    const handlePayExpense = async (expense: FixedExpenseItem) => {
        try {
            setPayingExpenseId(expense.id);

            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('Usuario no autenticado');

            // Crear un movimiento de tipo "fixed_expense"
            const { error } = await supabase.from('movements' as any).insert({
                user_id: user.id,
                account_id: pocket.account_id,
                pocket_id: pocket.id,
                fixed_expense_id: expense.id,
                type: 'fixed_expense',
                amount: expense.amount,
                currency: expense.currency,
                description: `Pago ${expense.name}`,
                date: new Date().toISOString(),
            });

            if (error) throw error;

            // Refrescar datos
            await fetchData();
        } catch (error: any) {
            console.error('Error paying expense:', error);
            alert(`Error al registrar el pago: ${error.message}`);
        } finally {
            setPayingExpenseId(null);
        }
    };

    // Helper para convertir montos a la moneda elegida
    const toDisplay = (amount: number, currency: string): number => {
        const safe = Number(amount) || 0;
        if (!selectedCurrency || selectedCurrency === currency) {
            return safe;
        }
        const converted = convertAmount(safe, currency as any, selectedCurrency);
        return converted ?? safe;
    };

    // Calcular total mensual (suma de todos los ítems definidos)
    const totalMonthlyAmount = useMemo(() => {
        return items.reduce((sum, item) => {
            return sum + toDisplay(item.amount, item.currency);
        }, 0);
    }, [items, selectedCurrency, convertAmount]);

    // Procesar lista para display
    const processedItems = useMemo(() => {
        return items.map(item => {
            // Buscar si está pagado este mes
            // Un movimiento cuenta como pago si tiene el fixed_expense_id O si el nombre coincide (fallback)
            const isPaid = movements.some(m =>
                m.fixed_expense_id === item.id ||
                (m.description && m.description.toLowerCase().includes(item.name.toLowerCase()))
            );

            return {
                ...item,
                isPaid,
                displayAmount: toDisplay(item.amount, item.currency)
            };
        });
    }, [items, movements, selectedCurrency, convertAmount]);

    return (
        <div className="relative w-full h-[269px] flex rounded-[18px] overflow-hidden font-[Monda] bg-black">
            {/* LADO IZQUIERDO - LISTA DE GASTOS */}
            <div className="w-1/2 flex flex-col p-6 text-white overflow-hidden">
                <p className="text-[10px] uppercase tracking-[0.25em] opacity-90 mb-4">
                    GASTOS FIJOS
                </p>

                <div className="flex-1 overflow-y-auto pr-2 space-y-2 scrollbar-hide">
                    {loading ? (
                        <div className="text-xs opacity-50">Cargando...</div>
                    ) : items.length === 0 ? (
                        <div className="text-xs opacity-50">No hay gastos definidos</div>
                    ) : (
                        processedItems.map((item) => (
                            <div key={item.id} className="flex justify-between items-center text-[11px] group gap-2">
                                <span className={`font-medium tracking-wide transition-colors flex-1 ${item.isPaid ? 'text-green-400' : 'text-white/70 group-hover:text-white'}`}>
                                    {item.name.toUpperCase()}
                                </span>
                                <span className={`font-semibold ${item.isPaid ? 'text-green-400' : 'text-white/70'}`}>
                                    {currencySymbol}{Math.round(item.displayAmount)}
                                </span>
                                {!item.isPaid && (
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handlePayExpense(item);
                                        }}
                                        disabled={payingExpenseId === item.id}
                                        className="ml-2 px-2 py-0.5 text-[9px] rounded-md bg-[#67F690]/20 text-[#67F690] border border-[#67F690]/40 hover:bg-[#67F690]/30 transition-colors disabled:opacity-50"
                                    >
                                        {payingExpenseId === item.id ? '...' : 'PAGAR'}
                                    </button>
                                )}
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* LADO DERECHO - TOTAL Y FONDO */}
            <div
                className="w-1/2 relative flex flex-col justify-center items-center p-6 text-white rounded-[18px] overflow-hidden group cursor-pointer"
                style={{
                    backgroundImage: "url('/fixed_expense.webp')",
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                }}
                onClick={() => setShowManageModal(true)}
            >
                {/* Overlay oscuro para mejorar legibilidad */}
                <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition-colors" />

                <div className="relative z-10 flex flex-col items-center">
                    <p className="text-[10px] uppercase tracking-[0.25em] opacity-90 mb-2">
                        TOTAL MES
                    </p>

                    <div className="flex items-baseline gap-2">
                        <span className="text-[16px] font-bold opacity-80">
                            {currencySymbol}
                        </span>
                        <span className="text-[42px] font-bold leading-none tracking-tighter text-white drop-shadow-lg">
                            <CountUp
                                from={0}
                                to={Math.round(totalMonthlyAmount)}
                                duration={1}
                                separator="."
                            />
                        </span>

                        {/* Botón del ojo */}
                        <button
                            type="button"
                            onClick={(e) => {
                                e.stopPropagation();
                                toggleCurrency();
                            }}
                            className="ml-1 flex items-center justify-center transition hover:opacity-80"
                        >
                            <EyeIcon isOpen={selectedCurrency === 'USD'} />
                        </button>
                    </div>

                    <p className="mt-4 text-[9px] uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity bg-black/50 px-3 py-1 rounded-full">
                        Administrar Gastos
                    </p>
                </div>
            </div>

            {showManageModal && (
                <ManageFixedExpensesModal
                    pocket={pocket}
                    onClose={() => setShowManageModal(false)}
                    onSuccess={() => {
                        fetchData();
                        setShowManageModal(false);
                    }}
                />
            )}
        </div>
    );
};
