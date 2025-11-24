import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useSupabaseUser } from '../hooks/useSupabaseUser';
import Header from '../components/Header';
import { Movement } from '../lib/types';
import AnimatedList from '../components/ui/AnimatedList';
import { TrashIcon } from '@heroicons/react/24/outline';
import { useToast } from '../hooks/useToast';
import { ToastContainer } from '../components/ui/Toast';
import { ConfirmationToast } from '../components/ui/ConfirmationToast';
import { AnimatePresence } from 'framer-motion';

export default function TransactionsPage() {
    const { user } = useSupabaseUser();
    const [transactions, setTransactions] = useState<Movement[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const { toasts, addToast, removeToast } = useToast();
    const [deleteConfirmation, setDeleteConfirmation] = useState<{ show: boolean; id: string | null }>({
        show: false,
        id: null
    });

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

    const handleDeleteClick = (id: string) => {
        setDeleteConfirmation({ show: true, id });
    };

    const handleConfirmDelete = async () => {
        if (!deleteConfirmation.id) return;

        try {
            const { error } = await supabase
                .from('movements')
                .delete()
                .eq('id', deleteConfirmation.id);

            if (error) throw error;

            setTransactions(prev => prev.filter(tx => tx.id !== deleteConfirmation.id));
            addToast('Movimiento eliminado correctamente', 'success');
        } catch (err: any) {
            console.error('Error deleting transaction:', err);
            addToast('Error al eliminar el movimiento', 'error');
        } finally {
            setDeleteConfirmation({ show: false, id: null });
        }
    };

    const handleCancelDelete = () => {
        setDeleteConfirmation({ show: false, id: null });
    };

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
            <div className="h-screen bg-[#D5D5D5] overflow-hidden">
                <div className="w-full h-full pt-20 bg-black flex flex-col">
                    <div className="p-6 border-b border-white/10 flex justify-between items-center bg-gradient-to-b from-white/5 to-transparent shrink-0">
                        <div>
                            <h1 className="text-[16px] uppercase font-bold text-white">Movimientos</h1>
                        </div>
                        <span className="text-xs font-medium text-white/50 bg-white/10 px-3 py-1 rounded-full">
                            {transactions.length}
                        </span>
                    </div>

                    <div className="flex-1 overflow-hidden p-2 min-h-0">
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
                                const date = new Date(tx.date);
                                const day = date.getDate().toString().padStart(2, '0');
                                const month = (date.getMonth() + 1).toString().padStart(2, '0');

                                return (
                                    <div className="flex items-center py-2 px-1 gap-3 group">
                                        <span className="text-xs font-medium text-white/40 w-10 shrink-0">
                                            {day}/{month}
                                        </span>
                                        <p className="text-sm font-medium text-white/90 truncate flex-1">
                                            {tx.description || 'Sin descripción'}
                                        </p>
                                        <div className="flex items-center gap-3">
                                            <span className={`text-sm font-bold tabular-nums whitespace-nowrap ${amountClass}`}>
                                                {sign}{tx.currency} {tx.amount.toLocaleString('es-UY', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                                            </span>
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleDeleteClick(tx.id);
                                                }}
                                                className="p-1.5 rounded-full text-white/20 hover:text-red-400 hover:bg-white/5 transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100"
                                                title="Eliminar movimiento"
                                            >
                                                <TrashIcon className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                );
                            }}
                        />
                    </div>
                </div>
            </div>
            <ToastContainer toasts={toasts} onRemove={removeToast} />

            {/* Confirmation Toast */}
            <div className="fixed top-4 left-0 right-0 z-[9999] pointer-events-none px-4">
                <AnimatePresence mode="wait">
                    {deleteConfirmation.show && (
                        <ConfirmationToast
                            message="¿Estás seguro de que quieres eliminar este movimiento?"
                            onConfirm={handleConfirmDelete}
                            onCancel={handleCancelDelete}
                        />
                    )}
                </AnimatePresence>
            </div>
        </>
    );
}
