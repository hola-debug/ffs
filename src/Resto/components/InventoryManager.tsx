
import React, { useState, useEffect } from 'react';
import { InventoryItem } from '../types';
import { restoService } from '../../services/restoService';
import { useResto } from '../contexts/RestoContext';
import { Plus, Search, AlertTriangle, Package, Loader2 } from 'lucide-react';

const InventoryManager: React.FC = () => {
    const { currentRestaurant } = useResto();
    const [inventory, setInventory] = useState<InventoryItem[]>([]);
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [isAdding, setIsAdding] = useState(false);
    const [newItem, setNewItem] = useState<Partial<InventoryItem>>({ quantity: 0, minStock: 0 });

    const fetchInventory = async () => {
        if (!currentRestaurant) return;
        try {
            setLoading(true);
            const data = await restoService.getInventory(currentRestaurant.id);
            setInventory(data as any);
        } catch (error) {
            console.error('Error fetching inventory:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchInventory();
    }, [currentRestaurant]);

    const handleSave = async () => {
        if (newItem.name && newItem.unit && currentRestaurant) {
            try {
                const itemData = {
                    item_name: newItem.name,
                    quantity: Number(newItem.quantity) || 0,
                    unit_price: 0, // Default or add field
                    // category: newItem.category || 'General', // Not in migration yet, maybe add to table or ignore
                };

                if (newItem.id) {
                    await restoService.updateInventoryItem(newItem.id, itemData);
                } else {
                    await restoService.addInventoryItem(currentRestaurant.id, itemData);
                }

                fetchInventory();
                setIsAdding(false);
                setNewItem({ quantity: 0, minStock: 0 });
            } catch (error) {
                console.error('Error saving inventory item:', error);
                alert('Error al guardar item');
            }
        }
    };

    const handleEdit = (item: InventoryItem) => {
        // Map back to local state structure if needed
        setNewItem({
            id: item.id,
            name: item.name || (item as any).item_name,
            quantity: item.quantity,
            unit: item.unit, // Might be missing in DB
            category: item.category, // Might be missing in DB
            minStock: item.minStock // Might be missing in DB
        });
        setIsAdding(true);
    };

    const filteredItems = inventory.filter(i =>
        i.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        i.category.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h2 className="text-xl font-bold text-slate-800">Inventario de Insumos</h2>
                    <p className="text-sm text-slate-500">Gestión de stock en tiempo real.</p>
                </div>
                <button
                    onClick={() => { setNewItem({ quantity: 0, minStock: 0 }); setIsAdding(true); }}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 flex items-center gap-2 shadow-sm"
                >
                    <Plus className="w-4 h-4" /> Nuevo Item
                </button>
            </div>

            {isAdding && (
                <div className="bg-white p-6 rounded-xl shadow-md border border-slate-200 animate-in fade-in slide-in-from-top-4">
                    <h3 className="font-semibold text-slate-700 mb-4">{newItem.id ? 'Editar Item' : 'Agregar Nuevo Item'}</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-4">
                        <div className="lg:col-span-2">
                            <label className="block text-xs font-semibold text-slate-500 mb-1">Nombre</label>
                            <input type="text" className="w-full border p-2 rounded" value={newItem.name || ''} onChange={e => setNewItem({ ...newItem, name: e.target.value })} placeholder="Ej. Harina 000" />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-slate-500 mb-1">Categoría</label>
                            <input type="text" className="w-full border p-2 rounded" value={newItem.category || ''} onChange={e => setNewItem({ ...newItem, category: e.target.value })} placeholder="Materia Prima" />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-slate-500 mb-1">Unidad</label>
                            <select className="w-full border p-2 rounded" value={newItem.unit || ''} onChange={e => setNewItem({ ...newItem, unit: e.target.value })}>
                                <option value="">Seleccionar</option>
                                <option value="kg">Kg</option>
                                <option value="lt">Lt</option>
                                <option value="un">Unidad</option>
                                <option value="caja">Caja</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-slate-500 mb-1">Stock Mínimo</label>
                            <input type="number" className="w-full border p-2 rounded" value={newItem.minStock} onChange={e => setNewItem({ ...newItem, minStock: Number(e.target.value) })} />
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="w-32">
                            <label className="block text-xs font-semibold text-slate-500 mb-1">Cantidad Actual</label>
                            <input type="number" className="w-full border p-2 rounded font-bold text-slate-800" value={newItem.quantity} onChange={e => setNewItem({ ...newItem, quantity: Number(e.target.value) })} />
                        </div>
                        <div className="flex-1 flex justify-end gap-2 mt-5">
                            <button onClick={() => setIsAdding(false)} className="px-4 py-2 border rounded hover:bg-slate-50">Cancelar</button>
                            <button onClick={handleSave} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">Guardar</button>
                        </div>
                    </div>
                </div>
            )}

            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="p-4 border-b border-slate-200 flex items-center gap-4">
                    <div className="relative flex-1 max-w-sm">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                        <input
                            type="text"
                            placeholder="Buscar items..."
                            className="pl-9 pr-4 py-2 border border-slate-300 rounded-lg text-sm w-full outline-none focus:ring-2 focus:ring-blue-500"
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>
                <table className="w-full text-left text-sm text-slate-600">
                    <thead className="bg-slate-50 text-xs uppercase font-semibold text-slate-500">
                        <tr>
                            <th className="px-6 py-3">Nombre</th>
                            <th className="px-6 py-3">Categoría</th>
                            <th className="px-6 py-3 text-right">Stock</th>
                            <th className="px-6 py-3 text-right">Estado</th>
                            <th className="px-6 py-3 text-center">Acciones</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                        {filteredItems.map(item => {
                            const isLow = item.quantity <= item.minStock;
                            return (
                                <tr key={item.id} className="hover:bg-slate-50">
                                    <td className="px-6 py-4 font-medium text-slate-900 flex items-center gap-2">
                                        <div className="w-8 h-8 rounded bg-slate-100 flex items-center justify-center text-slate-400">
                                            <Package className="w-4 h-4" />
                                        </div>
                                        {item.name}
                                    </td>
                                    <td className="px-6 py-4">{item.category}</td>
                                    <td className="px-6 py-4 text-right font-mono font-medium">
                                        {item.quantity} <span className="text-xs text-slate-400">{item.unit}</span>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        {isLow ? (
                                            <span className="inline-flex items-center gap-1 text-xs font-medium text-red-700 bg-red-100 px-2 py-1 rounded-full">
                                                <AlertTriangle className="w-3 h-3" /> Bajo
                                            </span>
                                        ) : (
                                            <span className="text-xs font-medium text-green-700 bg-green-100 px-2 py-1 rounded-full">
                                                Normal
                                            </span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        <button onClick={() => handleEdit(item)} className="text-blue-600 hover:underline">Editar</button>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default InventoryManager;
