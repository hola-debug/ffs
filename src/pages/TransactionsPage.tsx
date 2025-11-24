import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useSupabaseUser } from '../hooks/useSupabaseUser';
import Header from '../components/Header';
import { Movement } from '../lib/types';
import AnimatedList from '../components/ui/AnimatedList';

export default function TransactionsPage() {
    const { user } = useSupabaseUser();
    const [transactions, setTransactions] = useState<Movement[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!user) return;

        const fetchData = async () => {
            try {
                setLoading(true);

                // Fetch movements
                const { data, error } = await supabase
                    .from('movements')
                    .select('*')
                    .eq('user_id', user.id)
                    .order('date', { ascending: false })
                    .limit(100); // Limit to 100 for now

                if (error) throw error;

                setTransactions(data as Movement[]);
            } catch (err: any) {
                console.error('Error fetching transactions:', err);
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [user]);

    if (loading) {
        return (
            <>
                <Header />
                <div className="min-h-screen bg-[#D5D5D5] pt-24 px-1 flex justify-center">
                    <div className="text-black">Cargando movimientos...</div>
                </div>
            </>
        );
    }

    if (error) {
        return (
            <>
                <Header />
                <div className="min-h-screen bg-[#D5D5D5] pt-24 px-1 flex justify-center">
                    <div className="text-red-500">Error: {error}</div>
                </div>
            </>
        );
    }

    return (
        <>
            <Header />
            <div className="min-h-screen bg-[#D5D5D5]  ">
                <div className="w-full min-h-screen pt-20 bg-black overflow-hidden flex flex-col">
                    <div className="p-6 border-b border-white/10 flex justify-between items-center bg-gradient-to-b from-white/5 to-transparent">
                        <div>
                            <p className="text-[10px] uppercase tracking-[0.25em] text-white/70 mb-1">
                                HISTORIAL
                            </p>
                            <h1 className="text-2xl font-bold text-white">Movimientos</h1>
                        </div>
                        <span className="text-xs font-medium text-white/50 bg-white/10 px-3 py-1 rounded-full">
                            {transactions.length}
                        </span>
                    </div>

                    <div className="flex-1 overflow-hidden p-2">
                        <AnimatedList<Movement>
                            items={transactions}
                            showGradients={true}
                            enableArrowNavigation={true}
                            displayScrollbar={false}
                            className="w-full h-full"
                            maxHeight="100%"
                            gradientColor="#000000"
                            renderItem={(tx) => {
                                const isExpense = ['pocket_expense', 'fixed_expense', 'debt_payment'].includes(tx.type);
                                const isIncome = ['income', 'pocket_return'].includes(tx.type);
                                const amountClass = isExpense ? 'text-red-400' : (isIncome ? 'text-green-400' : 'text-white/90');
                                const sign = isExpense ? '-' : (isIncome ? '+' : '');

                                return (
                                    <div className="flex flex-col py-1 px-1 ">
                                        <div className="flex justify-between items-start gap-3">
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-medium text-white/90 truncate">
                                                    {tx.description || 'Sin descripción'}
                                                </p>
                                                <p className="text-[10px] text-white/50 mt-0.5 uppercase tracking-wide">
                                                    {new Intl.DateTimeFormat('es-UY', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(tx.date))}
                                                </p>
                                            </div>
                                            <span className={`text-sm font-bold tabular-nums whitespace-nowrap ${amountClass}`}>
                                                {sign}{tx.currency} {tx.amount.toLocaleString('es-UY', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                                            </span>
                                        </div>
                                    </div>
                                );
                            }}
                        />
                    </div>
                </div>
            </div>
        </>
    );
}
