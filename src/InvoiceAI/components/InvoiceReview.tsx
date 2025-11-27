
import React, { useState, useEffect, useRef } from 'react';
import { Invoice, InvoiceItem, ReferencePrice, PriceStatus, InvoiceCategory, PurchaseOrder, InventoryItem } from '../types';
import { invoiceService } from '../../services/invoiceService';
import { useInvoice } from '../contexts/InvoiceContext';
import { Save, ArrowLeft, Plus, Trash2, AlertTriangle, CheckCircle, Tag, ClipboardList, Sparkles, Link as LinkIcon, ZoomIn, ZoomOut, Maximize2 } from 'lucide-react';

interface InvoiceReviewProps {
  invoice: Invoice;
  queueLength: number;
  currentIndex: number;
  onSave: (invoice: Invoice) => void;
  onSkip: () => void;
  onCancel: () => void;
}

const CATEGORIES: InvoiceCategory[] = ['Materials', 'Supplies', 'Services', 'Maintenance', 'Taxes', 'Other'];

const CATEGORY_LABELS: Record<InvoiceCategory, string> = {
  'Materials': 'Materia Prima',
  'Supplies': 'Insumos',
  'Services': 'Servicios',
  'Maintenance': 'Mantenimiento',
  'Taxes': 'Impuestos',
  'Other': 'Otros',
  'Otros': 'Otros'
};

const InvoiceReview: React.FC<InvoiceReviewProps> = ({ invoice, queueLength, currentIndex, onSave, onSkip, onCancel }) => {
  const { currentCompany } = useInvoice();
  const [data, setData] = useState<Invoice>(invoice);
  const [prices, setPrices] = useState<ReferencePrice[]>([]);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [openOrders, setOpenOrders] = useState<PurchaseOrder[]>([]);

  // Zoom and Pan state
  const [zoom, setZoom] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [lastTouchDistance, setLastTouchDistance] = useState(0);
  const imageContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const loadData = async () => {
      if (!currentCompany) return;

      // 1. Load context data
      // Mock prices and orders for now as they are not in the initial migration
      setPrices([]);
      setOpenOrders([]);

      try {
        const allInventory = await invoiceService.getInvoiceItems(currentCompany.id);
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
  }, [invoice, currentCompany]);

  // Helper function to get distance between two touch points
  const getTouchDistance = (touches: React.TouchList) => {
    if (touches.length < 2) return 0;
    const dx = touches[0].clientX - touches[1].clientX;
    const dy = touches[0].clientY - touches[1].clientY;
    return Math.sqrt(dx * dx + dy * dy);
  };

  // Zoom and Pan handlers - Mouse
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.1 : 0.1;
    setZoom(prev => Math.min(Math.max(1, prev + delta), 5));
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (zoom > 1) {
      e.preventDefault();
      setIsDragging(true);
      setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging && zoom > 1) {
      e.preventDefault();
      setPosition({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Touch handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      // Pinch to zoom
      e.preventDefault();
      const distance = getTouchDistance(e.touches);
      setLastTouchDistance(distance);
    } else if (e.touches.length === 1 && zoom > 1) {
      // Pan
      e.preventDefault();
      setIsDragging(true);
      setDragStart({
        x: e.touches[0].clientX - position.x,
        y: e.touches[0].clientY - position.y
      });
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      // Pinch to zoom
      e.preventDefault();
      const distance = getTouchDistance(e.touches);
      if (lastTouchDistance > 0) {
        const delta = (distance - lastTouchDistance) * 0.01;
        setZoom(prev => Math.min(Math.max(1, prev + delta), 5));
      }
      setLastTouchDistance(distance);
    } else if (e.touches.length === 1 && isDragging && zoom > 1) {
      // Pan
      e.preventDefault();
      setPosition({
        x: e.touches[0].clientX - dragStart.x,
        y: e.touches[0].clientY - dragStart.y
      });
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (e.touches.length < 2) {
      setLastTouchDistance(0);
    }
    if (e.touches.length === 0) {
      setIsDragging(false);
    }
  };

  const handleZoomIn = () => {
    setZoom(prev => Math.min(prev + 0.25, 5));
  };

  const handleZoomOut = () => {
    setZoom(prev => Math.max(prev - 0.25, 1));
    if (zoom <= 1.25) {
      setPosition({ x: 0, y: 0 });
    }
  };

  const handleResetZoom = () => {
    setZoom(1);
    setPosition({ x: 0, y: 0 });
  };

  const updateField = (field: keyof Invoice, value: any) => {
    setData(prev => ({ ...prev, [field]: value }));
  };

  const updateItem = (index: number, field: keyof InvoiceItem, value: any) => {
    const newItems = [...data.items];
    newItems[index] = { ...newItems[index], [field]: value };

    if (field === 'quantity' || field === 'unitPrice') {
      newItems[index].total = newItems[index].quantity * newItems[index].unitPrice;
    }

    // Auto-calculate subtotal when items change
    const calculatedSubtotal = newItems.reduce((acc, item) => acc + item.total, 0);
    setData(prev => ({
      ...prev,
      items: newItems,
      subtotal: calculatedSubtotal
    }));
  };

  const addItem = () => {
    const newItems = [...data.items, { description: '', quantity: 1, unitPrice: 0, total: 0 }];
    const calculatedSubtotal = newItems.reduce((acc, item) => acc + item.total, 0);
    setData(prev => ({
      ...prev,
      items: newItems,
      subtotal: calculatedSubtotal
    }));
  };

  const removeItem = (index: number) => {
    const newItems = data.items.filter((_, i) => i !== index);
    const calculatedSubtotal = newItems.reduce((acc, item) => acc + item.total, 0);
    setData(prev => ({
      ...prev,
      items: newItems,
      subtotal: calculatedSubtotal
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
    <div className="flex flex-col lg:flex-row gap-3 h-auto lg:h-[calc(100vh-140px)] text-slate-50">
      <div className="flex-1 rounded-3xl border border-white/10 bg-slate-950/70 shadow-2xl shadow-slate-900/60 flex flex-col overflow-visible lg:overflow-hidden backdrop-blur">
        <div className="p-3 md:p-4 border-b border-white/5 flex items-center justify-between bg-gradient-to-r from-slate-900/80 via-slate-900 to-slate-900/80">
          <div className="flex items-center gap-3">
            <button onClick={onCancel} className="p-2 rounded-2xl bg-white/5 border border-white/10 text-slate-200 hover:border-slate-400/40" title="Volver al Dashboard">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Revisión IA</p>
              <h2 className="font-black text-2xl text-white flex items-center gap-2">
                Factura
                <span className="text-xs font-normal text-slate-200 bg-white/10 px-2 py-0.5 rounded-full border border-white/10">
                  {currentIndex + 1} de {queueLength}
                </span>
                {data.isSmartMatch && (
                  <span className="text-xs font-medium text-purple-100 bg-purple-500/20 px-2 py-0.5 rounded-full flex items-center gap-1 border border-purple-300/30">
                    <Sparkles className="w-3 h-3" /> Auto
                  </span>
                )}
              </h2>
            </div>
          </div>
          <div className="flex gap-2">
            {queueLength > 1 && (
              <button onClick={onSkip} className="text-slate-300 hover:text-white px-3 py-2 text-sm font-medium rounded-xl border border-white/10 bg-white/5">
                Saltar
              </button>
            )}
            <button
              onClick={handleSaveInternal}
              className="flex items-center gap-2 bg-gradient-to-r from-sky-500 to-indigo-500 text-white px-4 py-2 rounded-xl hover:shadow-lg hover:shadow-sky-900/50 transition"
            >
              <Save className="w-4 h-4" />
              {currentIndex + 1 < queueLength ? 'Guardar y seguir' : 'Guardar'}
            </button>
          </div>
        </div>

        <div className="p-3 md:p-4 overflow-visible lg:overflow-y-auto flex-1 space-y-4">
          <div className="rounded-2xl border border-amber-300/30 bg-amber-500/10 p-3">
            <div className="flex items-start gap-3">
              <ClipboardList className="w-5 h-5 text-amber-200 mt-1" />
              <div className="flex-1">
                <h4 className="text-sm font-bold text-amber-50">Vincular con Orden de Compra</h4>
                <select
                  className="mt-1 w-full text-sm bg-slate-900/70 text-white border border-amber-200/30 rounded-xl p-2 focus:ring-2 focus:ring-amber-300/60 outline-none"
                  value={data.matchedOrderId || ''}
                  onChange={(e) => updateField('matchedOrderId', e.target.value || undefined)}
                >
                  <option value="">-- Sin Orden vinculada --</option>
                  {openOrders.map(order => (
                    <option key={order.id} value={order.id}>
                      {order.vendorName} - {order.date} (${order.total})
                    </option>
                  ))}
                </select>
                {data.matchedOrderId && (
                  <p className="text-xs text-amber-100 mt-1">
                    Al guardar, la orden seleccionada se marcará como <strong>Recibida</strong>.
                  </p>
                )}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Proveedor</label>
              <input
                type="text"
                value={data.vendorName}
                onChange={e => updateField('vendorName', e.target.value)}
                className={`w-full rounded-xl px-3 py-2 bg-slate-900/70 text-white border ${data.isSmartMatch ? 'border-purple-300/50' : 'border-white/10'
                  } focus:ring-2 focus:ring-sky-400/50 outline-none`}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Fecha</label>
              <input
                type="date"
                value={data.date}
                onChange={e => updateField('date', e.target.value)}
                className="w-full rounded-xl px-3 py-2 bg-slate-900/70 text-white border border-white/10 focus:ring-2 focus:ring-sky-400/50 outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-2 flex items-center gap-1"><Tag className="w-3 h-3" /> Categoría</label>
              <div className="flex flex-wrap gap-2">
                {CATEGORIES.map(cat => (
                  <button
                    key={cat}
                    onClick={() => updateField('category', cat)}
                    className={`text-xs px-3 py-1.5 rounded-full border transition ${data.category === cat
                      ? 'bg-gradient-to-r from-sky-500 to-indigo-500 text-white border-transparent shadow-lg shadow-sky-900/40'
                      : 'bg-slate-900/70 text-slate-200 border-white/10 hover:border-sky-300/40'
                      }`}
                  >
                    {CATEGORY_LABELS[cat]}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/5 p-3 shadow-inner shadow-slate-900/50">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-white">Items & Inventario</h3>
              <button onClick={addItem} type="button" className="text-sm text-sky-200 hover:text-white font-medium flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-900/60 border border-white/10">
                <Plus className="w-3 h-3" /> Agregar Item
              </button>
            </div>

            <div className="space-y-2">
              {data.items.map((item, idx) => {
                const validation = checkPrice(item);
                const linked = Boolean(item.linkedInventoryId);

                return (
                  <div
                    key={idx}
                    className={`p-2.5 rounded-2xl border ${linked ? 'border-emerald-300/40' : 'border-white/10'} bg-slate-950/60 shadow-sm shadow-slate-900/40`}>
                    <div className="grid grid-cols-12 gap-2 items-start">
                      <div className="col-span-12 md:col-span-5">
                        <label className="text-[11px] text-slate-400 block mb-1">Descripción Factura</label>
                        <input
                          type="text"
                          value={item.description}
                          onChange={e => updateItem(idx, 'description', e.target.value)}
                          className="w-full text-sm bg-transparent border-b border-white/15 focus:border-sky-300/60 text-white outline-none py-1 mb-2 font-medium"
                        />
                        <div className="flex items-center gap-2 bg-white/5 p-1.5 rounded-xl border border-white/10">
                          <LinkIcon className={`w-3 h-3 ${linked ? 'text-emerald-300' : 'text-slate-500'}`} />
                          <select
                            className="w-full text-xs bg-transparent outline-none text-slate-100"
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

                      <div className="col-span-4 md:col-span-2">
                        <label className="text-[11px] text-slate-400 block mb-1">Cant.</label>
                        <input
                          type="number"
                          value={item.quantity}
                          onChange={e => updateItem(idx, 'quantity', parseFloat(e.target.value) || 0)}
                          className="w-full text-sm bg-slate-900/70 border border-white/10 rounded-lg focus:ring-2 focus:ring-sky-400/40 outline-none py-1 text-right text-white"
                        />
                      </div>
                      <div className="col-span-4 md:col-span-2">
                        <label className="text-[11px] text-slate-400 block mb-1">Precio Unit.</label>
                        <input
                          type="number"
                          value={item.unitPrice}
                          onChange={e => updateItem(idx, 'unitPrice', parseFloat(e.target.value) || 0)}
                          className="w-full text-sm bg-slate-900/70 border border-white/10 rounded-lg focus:ring-2 focus:ring-sky-400/40 outline-none py-1 text-right text-white"
                        />
                      </div>
                      <div className="col-span-3 md:col-span-2">
                        <label className="text-[11px] text-slate-400 block mb-1">Total</label>
                        <div className="text-sm font-semibold text-right py-1 text-sky-100">${item.total.toFixed(2)}</div>
                      </div>
                      <div className="col-span-1 flex justify-end pt-4">
                        <button onClick={() => removeItem(idx)} className="text-slate-500 hover:text-red-300 transition">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {validation.status !== 'unknown' && validation.status !== 'ok' && (
                      <div className="mt-2 text-xs flex items-center gap-1 p-1.5 rounded-xl bg-amber-500/10 border border-amber-300/30 text-amber-100">
                        <AlertTriangle className="w-3 h-3" />
                        <span>
                          {validation.status === 'high'
                            ? `Precio alto! (Ref: $${validation.ref?.maxPrice})`
                            : `Precio inusualmente bajo.`}
                        </span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-slate-900 via-slate-900/80 to-slate-800 p-3 space-y-2 shadow-inner shadow-slate-900/50">
            <div className="flex justify-between text-sm items-center">
              <div className="flex items-center gap-2">
                <span className="text-slate-200 font-medium">Subtotal</span>
                {(() => {
                  const calculatedSubtotal = data.items.reduce((acc, item) => acc + item.total, 0);
                  const isManuallyAdjusted = Math.abs(calculatedSubtotal - data.subtotal) > 0.01;
                  return isManuallyAdjusted ? (
                    <span className="text-xs text-amber-100 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-300/30 flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3" />
                      Ajustado (Calc: ${calculatedSubtotal.toFixed(2)})
                    </span>
                  ) : null;
                })()}
              </div>
              <input
                type="number"
                step="0.01"
                value={data.subtotal}
                onChange={e => updateField('subtotal', parseFloat(e.target.value) || 0)}
                className="w-28 text-right bg-slate-900/70 border border-white/10 rounded-xl px-3 py-1.5 text-sm font-medium focus:ring-2 focus:ring-sky-400/50 outline-none text-white"
              />
            </div>
            <div className="flex justify-between text-sm items-center">
              <span className="text-slate-200 font-medium">Impuestos</span>
              <input
                type="number"
                step="0.01"
                value={data.tax}
                onChange={e => updateField('tax', parseFloat(e.target.value) || 0)}
                className="w-28 text-right bg-slate-900/70 border border-white/10 rounded-xl px-3 py-1.5 text-sm font-medium focus:ring-2 focus:ring-sky-400/50 outline-none text-white"
              />
            </div>
            <div className="flex justify-between text-lg font-bold border-t border-white/10 pt-3 text-white">
              <span>Total</span>
              <span className="text-emerald-200">${(data.subtotal + (data.tax || 0)).toFixed(2)}</span>
            </div>

            <div className="pt-2 text-xs text-slate-300 text-center flex items-center justify-center gap-1">
              <CheckCircle className="w-3 h-3" />
              El inventario y órdenes se actualizarán al guardar.
            </div>
          </div>
        </div>
      </div>

      <div className="h-96 lg:h-auto lg:w-[34%] rounded-3xl border border-white/10 bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 shadow-2xl shadow-slate-900/70 flex flex-col overflow-hidden">
        <div className="p-3 bg-white/5 text-white text-sm font-medium border-b border-white/10 flex justify-between items-center">
          <span>Documento Original</span>
          <div className="flex items-center gap-2">
            {queueLength > 0 && <span className="text-slate-300 text-xs">{currentIndex + 1} / {queueLength}</span>}
          </div>
        </div>

        <div className="p-2 bg-slate-900/80 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-1">
            <button
              onClick={handleZoomOut}
              disabled={zoom <= 1}
              className="p-1.5 bg-white/5 hover:bg-white/10 disabled:bg-slate-900/60 disabled:text-slate-600 text-white rounded transition border border-white/10"
              title="Alejar"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <button
              onClick={handleZoomIn}
              disabled={zoom >= 5}
              className="p-1.5 bg-white/5 hover:bg-white/10 disabled:bg-slate-900/60 disabled:text-slate-600 text-white rounded transition border border-white/10"
              title="Acercar"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
            <button
              onClick={handleResetZoom}
              disabled={zoom === 1}
              className="p-1.5 bg-white/5 hover:bg-white/10 disabled:bg-slate-900/60 disabled:text-slate-600 text-white rounded transition border border-white/10"
              title="Restablecer"
            >
              <Maximize2 className="w-4 h-4" />
            </button>
          </div>
          <div className="text-xs text-slate-300 font-mono">
            {Math.round(zoom * 100)}%
          </div>
        </div>

        <div
          ref={imageContainerRef}
          className="flex-1 overflow-hidden p-4 flex items-start justify-center bg-slate-950 relative"
          onWheel={handleWheel}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          style={{
            cursor: zoom > 1 ? (isDragging ? 'grabbing' : 'grab') : 'default',
            touchAction: zoom > 1 ? 'none' : 'auto'
          }}
        >
          {data.originalImage ? (
            <div
              style={{
                transform: `translate(${position.x}px, ${position.y}px) scale(${zoom})`,
                transformOrigin: 'center center',
                transition: isDragging ? 'none' : 'transform 0.1s ease-out',
              }}
              className="select-none"
            >
              <img
                src={data.originalImage}
                alt="Original Invoice"
                className="max-w-full rounded-xl shadow-2xl shadow-slate-900/70 pointer-events-none"
                draggable={false}
              />
            </div>
          ) : (
            <div className="text-slate-500 mt-10">Imagen no disponible</div>
          )}

          {zoom === 1 && data.originalImage && (
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-white/10 text-slate-200 text-xs px-3 py-1.5 rounded-full border border-white/20 pointer-events-none">
              Usa la rueda del mouse o pellizca para hacer zoom
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default InvoiceReview;
