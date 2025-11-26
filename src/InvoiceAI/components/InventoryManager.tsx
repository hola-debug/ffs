
import React, { useState, useEffect } from 'react';
import { invoiceService, InvoiceItemDB } from '../../services/invoiceService';
import { useInvoice } from '../contexts/InvoiceContext';
import { Plus, Search, AlertTriangle, Package, Loader2, Edit2, TrendingUp, TrendingDown } from 'lucide-react';

const InventoryManager: React.FC = () => {
    const { currentCompany } = useInvoice();
    const [inventory, setInventory] = useState<InvoiceItemDB[]>([]);
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [isAdding, setIsAdding] = useState(false);
    const [editingItem, setEditingItem] = useState<InvoiceItemDB | null>(null);
    const [formData, setFormData] = useState({
        item_name: '',
        current_stock: 0,
        unit_type: 'units',
        unit_price: 0
    });

    const fetchInventory = async () => {
        if (!currentCompany) return;
        try {
            setLoading(true);
            const data = await invoiceService.getInvoiceItems(currentCompany.id);
            setInventory(data);
        } catch (error) {
            console.error('Error fetching inventory:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchInventory();
    }, [currentCompany]);

    const handleSave = async () => {
        if (!formData.item_name || !currentCompany) return;

        try {
            if (editingItem) {
                // Update existing item
                await invoiceService.updateInvoiceItem(editingItem.id, {
                    item_name: formData.item_name,
                    current_stock: formData.current_stock,
                    unit_type: formData.unit_type,
                    unit_price: formData.unit_price
                });
            } else {
                // Create new item
                await invoiceService.addInvoiceItem(currentCompany.id, formData);
            }

            fetchInventory();
            handleCancel();
        } catch (error) {
            console.error('Error saving inventory item:', error);
            alert('Error al guardar item: ' + (error instanceof Error ? error.message : 'Unknown error'));
        }
    };

    const handleEdit = (item: InvoiceItemDB) => {
        setEditingItem(item);
        setFormData({
            item_name: item.item_name,
            current_stock: item.current_stock,
            unit_type: item.unit_type,
            unit_price: item.unit_price
        });
        setIsAdding(true);
    };

    const handleCancel = () => {
        setIsAdding(false);
        setEditingItem(null);
        setFormData({
            item_name: '',
            current_stock: 0,
            unit_type: 'units',
            unit_price: 0
        });
    };

    const filteredItems = inventory.filter(i =>
        i.item_name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const getStockStatusColor = (status: string) => {
        switch (status) {
            case 'depleted':
                return 'bg-red-500/15 text-red-100 border-red-300/40';
            case 'low':
                return 'bg-amber-500/15 text-amber-100 border-amber-300/40';
            default:
                return 'bg-emerald-500/15 text-emerald-100 border-emerald-300/40';
        }
    };

    const getStockStatusLabel = (status: string) => {
        switch (status) {
            case 'depleted':
                return 'Agotado';
            case 'low':
                return 'Bajo';
            default:
                return 'Normal';
        }
    };

    return (
        <div className="space-y-5 text-slate-50">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Inventario</p>
                    <h2 className="text-2xl font-bold text-white">Items conectados</h2>
                    <p className="text-sm text-slate-400">Stock, costos y alertas en tiempo real.</p>
                </div>
                <button
                    onClick={() => setIsAdding(true)}
                    className="bg-gradient-to-r from-sky-500 to-indigo-500 text-white px-4 py-2 rounded-xl text-sm font-semibold hover:shadow-lg hover:shadow-sky-900/40 flex items-center gap-2"
                >
                    <Plus className="w-4 h-4" /> Nuevo Item
                </button>
            </div>

            {isAdding && (
                <div className="rounded-3xl border border-white/10 bg-slate-950/70 shadow-2xl shadow-slate-900/60 p-6 animate-in fade-in slide-in-from-top-4">
                    <h3 className="font-semibold text-white mb-4">
                        {editingItem ? 'Editar Item' : 'Agregar Nuevo Item'}
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                        <div className="lg:col-span-2">
                            <label className="block text-xs font-semibold text-slate-300 mb-1">Nombre del Item</label>
                            <input
                                type="text"
                                className="w-full border border-white/10 p-2 rounded-xl focus:ring-2 focus:ring-sky-400/50 outline-none bg-slate-900/70 text-white"
                                value={formData.item_name}
                                onChange={e => setFormData({ ...formData, item_name: e.target.value })}
                                placeholder="Ej. Harina 000"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-slate-300 mb-1">Tipo de Unidad</label>
                            <select
                                className="w-full border border-white/10 p-2 rounded-xl focus:ring-2 focus:ring-sky-400/50 outline-none bg-slate-900/70 text-white"
                                value={formData.unit_type}
                                onChange={e => setFormData({ ...formData, unit_type: e.target.value })}
                            >
                                <option value="units">Unidades</option>
                                <option value="kg">Kilogramos</option>
                                <option value="lt">Litros</option>
                                <option value="boxes">Cajas</option>
                                <option value="packs">Paquetes</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-slate-300 mb-1">Stock Actual</label>
                            <input
                                type="number"
                                step="0.01"
                                className="w-full border border-white/10 p-2 rounded-xl font-bold text-white bg-slate-900/70 focus:ring-2 focus:ring-sky-400/50 outline-none"
                                value={formData.current_stock}
                                onChange={e => setFormData({ ...formData, current_stock: parseFloat(e.target.value) || 0 })}
                            />
                        </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div>
                            <label className="block text-xs font-semibold text-slate-300 mb-1">Precio Unitario (Referencia)</label>
                            <input
                                type="number"
                                step="0.01"
                                className="w-full border border-white/10 p-2 rounded-xl bg-slate-900/70 text-white focus:ring-2 focus:ring-sky-400/50 outline-none"
                                value={formData.unit_price}
                                onChange={e => setFormData({ ...formData, unit_price: parseFloat(e.target.value) || 0 })}
                                placeholder="0.00"
                            />
                        </div>
                    </div>
                    <div className="flex justify-end gap-2">
                        <button
                            onClick={handleCancel}
                            className="px-4 py-2 border border-white/10 rounded-xl bg-white/5 text-slate-200 hover:border-white/20 transition"
                        >
                            Cancelar
                        </button>
                        <button
                            onClick={handleSave}
                            className="px-4 py-2 bg-gradient-to-r from-emerald-400 to-emerald-500 text-emerald-950 rounded-xl font-semibold hover:shadow-lg hover:shadow-emerald-900/40 transition"
                        >
                            Guardar
                        </button>
                    </div>
                </div>
            )}

            <div className="rounded-3xl border border-white/10 bg-slate-950/60 shadow-2xl shadow-slate-900/60">
                <div className="p-4 border-b border-white/5 flex items-center gap-4">
                    <div className="relative flex-1 max-w-sm">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 w-4 h-4" />
                        <input
                            type="text"
                            placeholder="Buscar items..."
                            className="pl-9 pr-4 py-2 rounded-xl bg-slate-900/70 border border-white/10 text-sm text-white w-full outline-none focus:ring-2 focus:ring-sky-400/50"
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <div className="text-sm text-slate-400">
                        {filteredItems.length} items
                    </div>
                </div>

                {loading ? (
                    <div className="flex items-center justify-center py-12">
                        <Loader2 className="w-8 h-8 animate-spin text-sky-300" />
                    </div>
                ) : filteredItems.length === 0 ? (
                    <div className="text-center py-12">
                        <Package className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                        <p className="text-slate-300">No hay items en el inventario</p>
                        <p className="text-sm text-slate-500">Agrega items desde facturas o manualmente</p>
                    </div>
                ) : (
                    <div className="p-4 grid gap-3 sm:grid-cols-2">
                        {filteredItems.map(item => (
                            <div
                                key={item.id}
                                className="rounded-2xl border border-white/10 bg-white/5 p-4 shadow-md shadow-slate-900/50 hover:border-sky-300/40 transition"
                            >
                                <div className="flex items-start justify-between gap-3">
                                    <div className="flex items-center gap-3">
                                        <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-indigo-500/60 to-slate-900 border border-white/10 flex items-center justify-center text-white">
                                            <Package className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <div className="font-semibold text-white">{item.item_name}</div>
                                            <div className="text-xs text-slate-400">{item.unit_type}</div>
                                        </div>
                                    </div>
                                    <span className={`inline-flex items-center gap-1 text-[11px] font-medium px-2.5 py-1 rounded-full border ${getStockStatusColor(item.stock_status)}`}>
                                        {(item.stock_status === 'depleted' || item.stock_status === 'low') && <AlertTriangle className="w-3 h-3" />}
                                        {getStockStatusLabel(item.stock_status)}
                                    </span>
                                </div>

                                <div className="mt-3 grid grid-cols-3 gap-2 text-sm text-slate-200">
                                    <div className="rounded-xl bg-white/5 border border-white/5 p-2">
                                        <p className="text-[11px] text-slate-400">Stock</p>
                                        <div className="flex items-center gap-2">
                                            <span className="font-mono font-semibold text-white">
                                                {item.current_stock.toFixed(2)}
                                            </span>
                                            <TrendingUp className="w-4 h-4 text-emerald-300" />
                                        </div>
                                    </div>
                                    <div className="rounded-xl bg-white/5 border border-white/5 p-2">
                                        <p className="text-[11px] text-slate-400">Consumido</p>
                                        <div className="flex items-center gap-2">
                                            <span className="font-mono text-white">
                                                {item.stock_consumed.toFixed(2)}
                                            </span>
                                            <TrendingDown className="w-4 h-4 text-red-300" />
                                        </div>
                                    </div>
                                    <div className="rounded-xl bg-gradient-to-br from-slate-900 to-slate-800 border border-white/10 p-2 text-right">
                                        <p className="text-[11px] text-slate-400">Precio</p>
                                        <p className="font-mono font-semibold text-sky-100">${item.unit_price.toFixed(2)}</p>
                                    </div>
                                </div>

                                <div className="mt-3 flex justify-end">
                                    <button
                                        onClick={() => handleEdit(item)}
                                        className="inline-flex items-center gap-1 text-xs font-semibold px-3 py-2 rounded-xl bg-white/10 border border-white/10 text-white hover:border-sky-300/40"
                                    >
                                        <Edit2 className="w-3 h-3" />
                                        Editar
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default InventoryManager;
