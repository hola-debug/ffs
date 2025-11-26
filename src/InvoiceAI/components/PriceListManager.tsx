import React, { useState, useEffect } from 'react';
import { ReferencePrice } from '../types';
import { getReferencePrices, saveReferencePrice, deleteReferencePrice } from '../services/storageService';
import { Plus, Trash2, Save, X } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';

const PriceListManager: React.FC = () => {
  const [prices, setPrices] = useState<ReferencePrice[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [newPrice, setNewPrice] = useState<Partial<ReferencePrice>>({});

  useEffect(() => {
    setPrices(getReferencePrices());
  }, []);

  const handleSave = () => {
    if (newPrice.itemName && newPrice.minPrice !== undefined && newPrice.maxPrice !== undefined) {
      const price: ReferencePrice = {
        id: uuidv4(),
        itemName: newPrice.itemName,
        minPrice: Number(newPrice.minPrice),
        maxPrice: Number(newPrice.maxPrice)
      };
      saveReferencePrice(price);
      setPrices(getReferencePrices());
      setNewPrice({});
      setIsAdding(false);
    }
  };

  const handleDelete = (id: string) => {
    deleteReferencePrice(id);
    setPrices(getReferencePrices());
  };

  return (
    <div className="rounded-3xl border border-white/10 bg-slate-950/60 p-6 shadow-2xl shadow-slate-900/60 text-slate-50">
      <div className="flex justify-between items-center mb-6">
        <div>
            <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Referencias</p>
            <h2 className="text-lg font-bold text-white">Lista de Precios</h2>
            <p className="text-sm text-slate-400">Define rangos aceptables para validar automáticamente tus facturas.</p>
        </div>
        <button 
          onClick={() => setIsAdding(true)} 
          className="bg-gradient-to-r from-indigo-500 to-purple-500 text-white px-4 py-2 rounded-xl text-sm font-semibold hover:shadow-lg hover:shadow-indigo-900/40 flex items-center gap-2"
        >
          <Plus className="w-4 h-4" /> Agregar Producto
        </button>
      </div>

      {isAdding && (
        <div className="bg-white/5 p-4 rounded-2xl mb-6 border border-white/10 flex flex-wrap gap-4 items-end animate-in fade-in slide-in-from-top-2">
            <div className="flex-1 min-w-[200px]">
                <label className="block text-xs font-semibold text-slate-200 mb-1">Nombre / Palabra Clave</label>
                <input 
                    type="text" 
                    placeholder="Ej. Teclado" 
                    className="w-full border border-white/10 rounded-xl px-3 py-2 text-sm bg-slate-900/70 text-white focus:ring-2 focus:ring-indigo-400/50 outline-none"
                    value={newPrice.itemName || ''}
                    onChange={e => setNewPrice({...newPrice, itemName: e.target.value})}
                />
            </div>
            <div className="w-32">
                <label className="block text-xs font-semibold text-slate-200 mb-1">Precio Min.</label>
                <input 
                    type="number" 
                    className="w-full border border-white/10 rounded-xl px-3 py-2 text-sm bg-slate-900/70 text-white focus:ring-2 focus:ring-indigo-400/50 outline-none"
                    value={newPrice.minPrice || ''}
                    onChange={e => setNewPrice({...newPrice, minPrice: parseFloat(e.target.value)})}
                />
            </div>
            <div className="w-32">
                <label className="block text-xs font-semibold text-slate-200 mb-1">Precio Max.</label>
                <input 
                    type="number" 
                    className="w-full border border-white/10 rounded-xl px-3 py-2 text-sm bg-slate-900/70 text-white focus:ring-2 focus:ring-indigo-400/50 outline-none"
                    value={newPrice.maxPrice || ''}
                    onChange={e => setNewPrice({...newPrice, maxPrice: parseFloat(e.target.value)})}
                />
            </div>
            <div className="flex gap-2 pb-0.5">
                <button onClick={handleSave} className="p-2 bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-xl border border-white/10 hover:shadow-lg hover:shadow-indigo-900/40">
                    <Save className="w-5 h-5" />
                </button>
                <button onClick={() => setIsAdding(false)} className="p-2 bg-white/10 text-indigo-200 border border-white/10 rounded-xl hover:border-indigo-300/40">
                    <X className="w-5 h-5" />
                </button>
            </div>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm text-slate-200">
          <thead className="bg-white/5 text-xs uppercase font-semibold text-slate-400">
            <tr>
              <th className="px-6 py-3">Producto (Keyword)</th>
              <th className="px-6 py-3">Rango Aceptable</th>
              <th className="px-6 py-3 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {prices.map((price) => (
              <tr key={price.id} className="hover:bg-white/5">
                <td className="px-6 py-4 font-medium text-white">{price.itemName}</td>
                <td className="px-6 py-4">
                    <span className="bg-emerald-500/15 text-emerald-100 px-2 py-1 rounded text-xs font-mono border border-emerald-300/30">
                        ${price.minPrice} - ${price.maxPrice}
                    </span>
                </td>
                <td className="px-6 py-4 text-right">
                    <button onClick={() => handleDelete(price.id)} className="text-red-300 hover:text-red-100">
                        <Trash2 className="w-4 h-4" />
                    </button>
                </td>
              </tr>
            ))}
            {prices.length === 0 && (
                <tr>
                    <td colSpan={3} className="px-6 py-8 text-center text-slate-400">
                        No hay precios de referencia configurados.
                    </td>
                </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default PriceListManager;
