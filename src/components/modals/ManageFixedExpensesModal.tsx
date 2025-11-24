import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { ActivePocketSummary, FixedExpenseItem } from '@/lib/types';
import { useToast } from '@/hooks/useToast';
import GlassField from '@/components/GlassField';
import GlassDropdown from '@/components/GlassDropdown';

interface ManageFixedExpensesModalProps {
    pocket: ActivePocketSummary;
    onClose: () => void;
    onSuccess: () => void;
}

export default function ManageFixedExpensesModal({ pocket, onClose, onSuccess }: ManageFixedExpensesModalProps) {
    const { addToast } = useToast();
    const [items, setItems] = useState<FixedExpenseItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [newItemName, setNewItemName] = useState('');
    const [newItemAmount, setNewItemAmount] = useState('');
    const [newItemDueDay, setNewItemDueDay] = useState('1');
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Fetch items
    useEffect(() => {
        fetchItems();
    }, [pocket.id]);

    const fetchItems = async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('fixed_expenses')
                .select('*')
                .eq('pocket_id', pocket.id)
                .order('created_at', { ascending: true });

            if (error) throw error;
            setItems(data as any || []);
        } catch (error) {
            console.error('Error fetching items:', error);
            addToast('Error al cargar gastos', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleAdd = async () => {
        if (!newItemName || !newItemAmount) {
            addToast('Completa todos los campos', 'error');
            return;
        }

        try {
            setIsSubmitting(true);
            const { error } = await supabase
                .from('fixed_expenses')
                .insert({
                    pocket_id: pocket.id,
                    name: newItemName,
                    amount: Number(newItemAmount),
                    currency: pocket.currency,
                    due_day: Number(newItemDueDay)
                });

            if (error) throw error;

            addToast('Gasto agregado', 'success');
            setNewItemName('');
            setNewItemAmount('');
            fetchItems();
            onSuccess(); // Refresh parent
        } catch (error) {
            console.error('Error adding item:', error);
            addToast('Error al agregar gasto', 'error');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async (id: string) => {
        try {
            const { error } = await supabase
                .from('fixed_expenses')
                .delete()
                .eq('id', id);

            if (error) throw error;
            addToast('Gasto eliminado', 'success');
            fetchItems();
            onSuccess();
        } catch (error) {
            console.error('Error deleting item:', error);
            addToast('Error al eliminar gasto', 'error');
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="w-full max-w-md bg-[#1E1E1E] rounded-2xl overflow-hidden shadow-2xl border border-white/10">
                {/* Header */}
                <div className="p-4 border-b border-white/10 flex justify-between items-center">
                    <h3 className="text-white font-bold text-lg">Administrar Gastos Fijos</h3>
                    <button onClick={onClose} className="text-white/50 hover:text-white">✕</button>
                </div>

                {/* Body */}
                <div className="p-4 space-y-6">
                    {/* Formulario Nuevo */}
                    <div className="space-y-3 bg-white/5 p-4 rounded-xl border border-white/5">
                        <p className="text-xs text-white/70 uppercase tracking-wider font-semibold">Nuevo Gasto</p>

                        <GlassField
                            placeholder="Nombre (ej: Antel)"
                            value={newItemName}
                            onChange={(e) => setNewItemName(e.target.value)}
                        />

                        <div className="flex gap-2">
                            <div className="w-2/3">
                                <GlassField
                                    type="number"
                                    placeholder="Monto"
                                    value={newItemAmount}
                                    onChange={(e) => setNewItemAmount(e.target.value)}
                                />
                            </div>
                            <div className="w-1/3">
                                <GlassDropdown
                                    options={Array.from({ length: 31 }, (_, i) => ({ value: (i + 1).toString(), label: `Día ${i + 1}` }))}
                                    value={newItemDueDay}
                                    onChange={setNewItemDueDay}
                                />
                            </div>
                        </div>

                        <button
                            onClick={handleAdd}
                            disabled={isSubmitting}
                            className="w-full py-2 bg-[#2BA9E4] hover:bg-[#2398d1] text-white rounded-lg font-semibold text-sm transition-colors disabled:opacity-50"
                        >
                            {isSubmitting ? 'Agregando...' : 'Agregar Gasto'}
                        </button>
                    </div>

                    {/* Lista Existente */}
                    <div className="space-y-2">
                        <p className="text-xs text-white/50 uppercase tracking-wider">Gastos Definidos</p>

                        <div className="max-h-[200px] overflow-y-auto space-y-2 pr-1">
                            {loading ? (
                                <p className="text-white/30 text-center text-sm py-4">Cargando...</p>
                            ) : items.length === 0 ? (
                                <p className="text-white/30 text-center text-sm py-4">No hay gastos definidos</p>
                            ) : (
                                items.map(item => (
                                    <div key={item.id} className="flex justify-between items-center bg-white/5 p-3 rounded-lg border border-white/5 group">
                                        <div>
                                            <p className="text-white font-medium text-sm">{item.name}</p>
                                            <p className="text-white/50 text-xs">
                                                {item.currency} {item.amount} • Día {item.due_day}
                                            </p>
                                        </div>
                                        <button
                                            onClick={() => handleDelete(item.id)}
                                            className="text-red-400 opacity-0 group-hover:opacity-100 transition-opacity p-2 hover:bg-white/5 rounded"
                                        >
                                            🗑️
                                        </button>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
