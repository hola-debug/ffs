
import React, { useState, useEffect } from 'react';
import { Invoice, InvoiceItem, ReferencePrice, PriceStatus, InvoiceCategory, PurchaseOrder, InventoryItem } from '../types';
import { restoService } from '../../services/restoService';
import { useResto } from '../contexts/RestoContext';
import { Save, ArrowLeft, Plus, Trash2, AlertTriangle, CheckCircle, Tag, ArrowRight, ClipboardList, Sparkles, Link as LinkIcon, Package } from 'lucide-react';

interface InvoiceReviewProps {
  invoice: Invoice;
  queueLength: number;
  currentIndex: number;
  onSave: (invoice: Invoice) => void;
  onSkip: () => void;
  onCancel: () => void;
}

const CATEGORIES: InvoiceCategory[] = ['Materia Prima', 'Insumos', 'Servicios', 'Mantenimiento', 'Impuestos', 'Otros'];

const InvoiceReview: React.FC<InvoiceReviewProps> = ({ invoice, queueLength, currentIndex, onSave, onSkip, onCancel }) => {
  const { currentRestaurant } = useResto();
  const [data, setData] = useState<Invoice>(invoice);
  const [prices, setPrices] = useState<ReferencePrice[]>([]);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [openOrders, setOpenOrders] = useState<PurchaseOrder[]>([]);

  useEffect(() => {
    const loadData = async () => {
      if (!currentRestaurant) return;

      // 1. Load context data
      // Mock prices and orders for now as they are not in the initial migration
      setPrices([]);
      setOpenOrders([]);

      try {
        const allInventory = await restoService.getInventory(currentRestaurant.id);
        // Map Supabase inventory to local type if needed, or just use it
        // The types might slightly differ (e.g. created_at string vs number), but let's assume compatibility or cast
        setInventory(allInventory as any);

        // 2. Initialize Invoice Data
        const updatedInvoice = { ...invoice };

        // Auto-match Inventory Items if not already linked (Simple string match fallback)
        updatedInvoice.items = updatedInvoice.items.map(item => {
          if (!item.linkedInventoryId) {
            const invMatch = allInventory.find(inv =>
              inv.item_name.toLowerCase() === item.description.toLowerCase() ||
              item.description.toLowerCase().includes(inv.item_name.toLowerCase())
            );
            if (invMatch) return { ...item, linkedInventoryId: invMatch.id };
          }
          return item;
        });

        setData(updatedInvoice);
      } catch (error) {
        console.error("Error loading inventory:", error);
      }
    };

    loadData();
  }, [invoice, currentRestaurant]);

  const updateField = (field: keyof Invoice, value: any) => {
    setData(prev => ({ ...prev, [field]: value }));
  };

  const updateItem = (index: number, field: keyof InvoiceItem, value: any) => {
    const newItems = [...data.items];
    newItems[index] = { ...newItems[index], [field]: value };

    if (field === 'quantity' || field === 'unitPrice') {
      newItems[index].total = newItems[index].quantity * newItems[index].unitPrice;
    }

    const newSubtotal = newItems.reduce((acc, item) => acc + item.total, 0);
    setData(prev => ({
      ...prev,
      items: newItems,
      subtotal: newSubtotal,
      total: newSubtotal + (prev.tax || 0)
    }));
  };

  const addItem = () => {
    setData(prev => ({
      ...prev,
      items: [...prev.items, { description: '', quantity: 1, unitPrice: 0, total: 0 }]
    }));
  };

  const removeItem = (index: number) => {
    const newItems = data.items.filter((_, i) => i !== index);
    const newSubtotal = newItems.reduce((acc, item) => acc + item.total, 0);
    setData(prev => ({
      ...prev,
      items: newItems,
      subtotal: newSubtotal,
      total: newSubtotal + (prev.tax || 0)
    }));
  };

  const checkPrice = (item: InvoiceItem): { status: PriceStatus; ref?: ReferencePrice } => {
    const match = prices.find(p => item.description.toLowerCase().includes(p.itemName.toLowerCase()));
    if (!match) return { status: 'unknown' };

    if (item.unitPrice < match.minPrice) return { status: 'low', ref: match };
    if (item.unitPrice > match.maxPrice) return { status: 'high', ref: match };
    return { status: 'ok', ref: match };
  };

  const handleSaveInternal = () => {
    onSave({ ...data, status: 'saved' });
  };

  return (
    <div className="flex flex-col lg:flex-row gap-6 h-[calc(100vh-100px)]">
      {/* Left: Form */}
      <div className="flex-1 bg-white rounded-xl shadow-sm border border-slate-200 flex flex-col overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2">
            <button onClick={onCancel} className="p-2 hover:bg-white rounded-full transition text-slate-500" title="Volver al Dashboard">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h2 className="font-bold text-slate-800 flex items-center gap-2">
                Revisar Factura
                <span className="text-xs font-normal text-slate-500 bg-slate-200 px-2 py-0.5 rounded-full">
                  {currentIndex + 1} de {queueLength}
                </span>
                {data.isSmartMatch && (
                  <span className="text-xs font-medium text-purple-700 bg-purple-100 px-2 py-0.5 rounded-full flex items-center gap-1 border border-purple-200">
                    <Sparkles className="w-3 h-3" /> Auto
                  </span>
                )}
              </h2>
            </div>
          </div>
          <div className="flex gap-2">
            {queueLength > 1 && (
              <button onClick={onSkip} className="text-slate-500 hover:text-slate-800 px-3 py-2 text-sm font-medium">
                Saltar
              </button>
            )}
            <button
              onClick={handleSaveInternal}
              className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition shadow-sm"
            >
              <Save className="w-4 h-4" />
              {currentIndex + 1 < queueLength ? 'Guardar y Siguiente' : 'Guardar'}
            </button>
          </div>
        </div>

        <div className="p-6 overflow-y-auto flex-1">
          {/* Order Match Banner & Selector */}
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-6">
            <div className="flex items-start gap-3">
              <ClipboardList className="w-5 h-5 text-amber-600 mt-1" />
              <div className="flex-1">
                <h4 className="text-sm font-bold text-amber-800 mb-1">Vincular con Orden de Compra</h4>
                <select
                  className="w-full text-sm border-amber-300 bg-white rounded p-1.5 focus:ring-2 focus:ring-amber-500"
                  value={data.matchedOrderId || ''}
                  onChange={(e) => updateField('matchedOrderId', e.target.value || undefined)}
                >
                  <option value="">-- Sin Orden de Compra vinculada --</option>
                  {openOrders.map(order => (
                    <option key={order.id} value={order.id}>
                      {order.vendorName} - {order.date} (${order.total})
                    </option>
                  ))}
                </select>
                {data.matchedOrderId && (
                  <p className="text-xs text-amber-700 mt-1">
                    Al guardar, la orden seleccionada se marcará como <strong>Recibida</strong>.
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Header Info */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Proveedor</label>
              <input
                type="text"
                value={data.vendorName}
                onChange={e => updateField('vendorName', e.target.value)}
                className={`w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none ${data.isSmartMatch ? 'border-purple-300 bg-purple-50' : 'border-slate-300'}`}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Fecha</label>
              <input
                type="date"
                value={data.date}
                onChange={e => updateField('date', e.target.value)}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1 flex items-center gap-1"><Tag className="w-3 h-3" /> Categoría</label>
              <div className="flex flex-wrap gap-2 mt-1">
                {CATEGORIES.map(cat => (
                  <button
                    key={cat}
                    onClick={() => updateField('category', cat)}
                    className={`text-xs px-2 py-1 rounded-full border transition ${data.category === cat
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'bg-white text-slate-600 border-slate-200 hover:border-blue-300'
                      }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Items Table */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold text-slate-700">Items Extraídos & Inventario</h3>
              <button onClick={addItem} type="button" className="text-sm text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1">
                <Plus className="w-3 h-3" /> Agregar Item
              </button>
            </div>

            <div className="space-y-3">
              {data.items.map((item, idx) => {
                const validation = checkPrice(item);
                let borderColor = 'border-slate-200';

                // Color Logic based on link status and price
                if (!item.linkedInventoryId) borderColor = 'border-l-4 border-l-slate-300 border-slate-200'; // Unlinked
                else borderColor = 'border-l-4 border-l-green-500 border-slate-200'; // Linked

                return (
                  <div key={idx} className={`p-3 rounded-lg border ${borderColor} bg-white relative shadow-sm`}>
                    <div className="grid grid-cols-12 gap-2 items-start">
                      {/* Description & Inventory Mapping */}
                      <div className="col-span-12 md:col-span-5">
                        <label className="text-xs text-slate-500 block mb-1">Descripción Factura</label>
                        <input
                          type="text"
                          value={item.description}
                          onChange={e => updateItem(idx, 'description', e.target.value)}
                          className="w-full text-sm bg-transparent border-b border-slate-300 focus:border-blue-500 outline-none py-1 mb-2 font-medium"
                        />

                        {/* Inventory Linker */}
                        <div className="flex items-center gap-2 bg-slate-50 p-1.5 rounded border border-slate-200">
                          <LinkIcon className={`w-3 h-3 ${item.linkedInventoryId ? 'text-green-600' : 'text-slate-400'}`} />
                          <select
                            className="w-full text-xs bg-transparent outline-none text-slate-700"
                            value={item.linkedInventoryId || ''}
                            onChange={(e) => updateItem(idx, 'linkedInventoryId', e.target.value || undefined)}
                          >
                            <option value="">(No vincular a inventario)</option>
                            {inventory.map(inv => (
                              <option key={inv.id} value={inv.id}>
                                Map a: {inv.name} (Stock: {inv.quantity} {inv.unit})
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>

                      {/* Numbers */}
                      <div className="col-span-4 md:col-span-2">
                        <label className="text-xs text-slate-500 block mb-1">Cant.</label>
                        <input
                          type="number"
                          value={item.quantity}
                          onChange={e => updateItem(idx, 'quantity', parseFloat(e.target.value) || 0)}
                          className="w-full text-sm bg-transparent border-b border-slate-300 focus:border-blue-500 outline-none py-1 text-right"
                        />
                      </div>
                      <div className="col-span-4 md:col-span-2">
                        <label className="text-xs text-slate-500 block mb-1">Precio Unit.</label>
                        <input
                          type="number"
                          value={item.unitPrice}
                          onChange={e => updateItem(idx, 'unitPrice', parseFloat(e.target.value) || 0)}
                          className="w-full text-sm bg-transparent border-b border-slate-300 focus:border-blue-500 outline-none py-1 text-right"
                        />
                      </div>
                      <div className="col-span-3 md:col-span-2">
                        <label className="text-xs text-slate-500 block mb-1">Total</label>
                        <div className="text-sm font-semibold text-right py-1">${item.total.toFixed(2)}</div>
                      </div>
                      <div className="col-span-1 flex justify-end pt-4">
                        <button onClick={() => removeItem(idx)} className="text-slate-400 hover:text-red-500 transition">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Validation Message */}
                    {validation.status !== 'unknown' && validation.status !== 'ok' && (
                      <div className="mt-2 text-xs flex items-center gap-1 p-1 rounded bg-yellow-50">
                        <AlertTriangle className={`w-3 h-3 ${validation.status === 'high' ? 'text-red-600' : 'text-yellow-600'}`} />
                        <span className={validation.status === 'high' ? 'text-red-600 font-medium' : 'text-yellow-700'}>
                          {validation.status === 'high'
                            ? `Precio alto! (Ref: $${validation.ref?.maxPrice})`
                            : `Precio inusualmente bajo.`
                          }
                        </span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Totals */}
          <div className="bg-slate-50 p-4 rounded-lg space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-slate-600">Subtotal</span>
              <span className="font-medium">${data.subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm items-center">
              <span className="text-slate-600">Impuestos</span>
              <input
                type="number"
                value={data.tax}
                onChange={e => updateField('tax', parseFloat(e.target.value) || 0)}
                className="w-20 text-right bg-white border border-slate-300 rounded px-2 py-1 text-sm"
              />
            </div>
            <div className="flex justify-between text-lg font-bold border-t border-slate-200 pt-2 text-slate-800">
              <span>Total</span>
              <span>${(data.subtotal + (data.tax || 0)).toFixed(2)}</span>
            </div>

            <div className="pt-2 text-xs text-slate-400 text-center flex items-center justify-center gap-1">
              <CheckCircle className="w-3 h-3" />
              El inventario y órdenes se actualizarán al guardar.
            </div>
          </div>
        </div>
      </div>

      {/* Right: Original Image Preview */}
      <div className="lg:w-1/3 bg-slate-900 rounded-xl shadow-lg flex flex-col overflow-hidden">
        <div className="p-3 bg-slate-800 text-white text-sm font-medium border-b border-slate-700 flex justify-between">
          <span>Documento Original</span>
          {queueLength > 0 && <span className="text-slate-400 text-xs">{currentIndex + 1} / {queueLength}</span>}
        </div>
        <div className="flex-1 overflow-auto p-4 flex items-start justify-center bg-slate-900">
          {data.originalImage ? (
            <img src={data.originalImage} alt="Original Invoice" className="max-w-full rounded-lg shadow-md" />
          ) : (
            <div className="text-slate-500 mt-10">Imagen no disponible</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default InvoiceReview;
