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
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
            <h2 className="text-lg font-bold text-slate-800">Lista de Precios de Referencia</h2>
            <p className="text-sm text-slate-500">Define rangos aceptables para validar automáticamente tus facturas.</p>
        </div>
        <button 
          onClick={() => setIsAdding(true)} 
          className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 flex items-center gap-2"
        >
          <Plus className="w-4 h-4" /> Agregar Producto
        </button>
      </div>

      {isAdding && (
        <div className="bg-indigo-50 p-4 rounded-lg mb-6 border border-indigo-100 flex flex-wrap gap-4 items-end animate-in fade-in slide-in-from-top-2">
            <div className="flex-1 min-w-[200px]">
                <label className="block text-xs font-semibold text-indigo-900 mb-1">Nombre / Palabra Clave</label>
                <input 
                    type="text" 
                    placeholder="Ej. Teclado" 
                    className="w-full border border-indigo-200 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                    value={newPrice.itemName || ''}
                    onChange={e => setNewPrice({...newPrice, itemName: e.target.value})}
                />
            </div>
            <div className="w-32">
                <label className="block text-xs font-semibold text-indigo-900 mb-1">Precio Min.</label>
                <input 
                    type="number" 
                    className="w-full border border-indigo-200 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                    value={newPrice.minPrice || ''}
                    onChange={e => setNewPrice({...newPrice, minPrice: parseFloat(e.target.value)})}
                />
            </div>
            <div className="w-32">
                <label className="block text-xs font-semibold text-indigo-900 mb-1">Precio Max.</label>
                <input 
                    type="number" 
                    className="w-full border border-indigo-200 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                    value={newPrice.maxPrice || ''}
                    onChange={e => setNewPrice({...newPrice, maxPrice: parseFloat(e.target.value)})}
                />
            </div>
            <div className="flex gap-2 pb-0.5">
                <button onClick={handleSave} className="p-2 bg-indigo-600 text-white rounded hover:bg-indigo-700">
                    <Save className="w-5 h-5" />
                </button>
                <button onClick={() => setIsAdding(false)} className="p-2 bg-white text-indigo-600 border border-indigo-200 rounded hover:bg-indigo-50">
                    <X className="w-5 h-5" />
                </button>
            </div>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm text-slate-600">
          <thead className="bg-slate-50 text-xs uppercase font-semibold text-slate-500">
            <tr>
              <th className="px-6 py-3">Producto (Keyword)</th>
              <th className="px-6 py-3">Rango Aceptable</th>
              <th className="px-6 py-3 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {prices.map((price) => (
              <tr key={price.id} className="hover:bg-slate-50">
                <td className="px-6 py-4 font-medium text-slate-900">{price.itemName}</td>
                <td className="px-6 py-4">
                    <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs font-mono">
                        ${price.minPrice} - ${price.maxPrice}
                    </span>
                </td>
                <td className="px-6 py-4 text-right">
                    <button onClick={() => handleDelete(price.id)} className="text-red-500 hover:text-red-700">
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
