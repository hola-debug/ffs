
import React, { useState, useEffect, useRef } from 'react';
import { Invoice, InvoiceItem, ReferencePrice, PriceStatus, InventoryItem } from '../types';
import { invoiceService } from '../../services/invoiceService';
import { useInvoice } from '../contexts/InvoiceContext';
import { Save, ArrowLeft, Plus, Trash2, AlertTriangle, CheckCircle, Sparkles, Link as LinkIcon, ZoomIn, ZoomOut, Maximize2, Image as ImageIcon } from 'lucide-react';

interface InvoiceReviewProps {
  invoice: Invoice;
  queueLength: number;
  currentIndex: number;
  onSave: (invoice: Invoice) => void;
  onSkip: () => void;
  onCancel: () => void;
}

const InvoiceReview: React.FC<InvoiceReviewProps> = ({ invoice, queueLength, currentIndex, onSave, onSkip, onCancel }) => {
  const { currentCompany } = useInvoice();
  const [data, setData] = useState<Invoice>(invoice);
  const [prices, setPrices] = useState<ReferencePrice[]>([]);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);

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
      // Mock prices for now as they are not in the initial migration
      setPrices([]);

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
    // Only trap scroll when zooming the preview (or pinch-zoom via ctrlKey)
    if (zoom <= 1 && !e.ctrlKey) return;
    e.preventDefault();
    e.stopPropagation();
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

  const computedTotal = data.subtotal + (data.tax || 0);

  return (
    <div className="text-slate-50 flex flex-col lg:flex-row gap-6 lg:items-start pt-16 lg:pt-8 lg:min-h-[calc(100vh-100px)]">
      <div className="flex-1 min-w-0">
        <div className="rounded-3xl border border-white/10 bg-slate-950/70 shadow-2xl shadow-slate-900/70 backdrop-blur-xl overflow-hidden flex flex-col lg:h-full">
          <div className="p-4 sm:p-5 flex flex-col gap-4 border-b border-white/5 bg-slate-950/80">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div className="flex items-center gap-3">
                <button
                  onClick={onCancel}
                  className="p-2 rounded-2xl bg-white/5 border border-white/10 text-slate-200 hover:border-slate-400/40 transition"
                  title="Volver"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>
                <div>
                  <p className="text-[11px] uppercase tracking-[0.2em] text-slate-400">Revisión IA</p>
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="font-black text-2xl sm:text-3xl text-white leading-tight">Factura</h2>
                    <span className="text-xs font-semibold text-slate-900 bg-slate-100 px-3 py-1 rounded-full border border-white/20">
                      {currentIndex + 1} de {queueLength || 1}
                    </span>
                    {data.isSmartMatch && (
                      <span className="text-xs font-medium text-purple-100 bg-purple-500/25 px-2.5 py-1 rounded-full flex items-center gap-1 border border-purple-300/30">
                        <Sparkles className="w-3 h-3" /> IA
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap gap-2 justify-end">
                {queueLength > 1 && (
                  <button
                    onClick={onSkip}
                    className="text-slate-200 hover:text-white px-3 py-2 text-sm font-medium rounded-xl border border-white/10 bg-white/5 transition"
                  >
                    Saltar
                  </button>
                )}
                <button
                  onClick={handleSaveInternal}
                  className="flex items-center gap-2 bg-sky-500 text-white px-4 py-2 rounded-xl shadow-lg shadow-sky-900/40 hover:-translate-y-0.5 transition"
                >
                  <Save className="w-4 h-4" />
                  {currentIndex + 1 < queueLength ? 'Guardar y seguir' : 'Guardar'}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between text-xs text-slate-300">
              <span>Revisa proveedor, fecha y totales.</span>
              <span>{queueLength > 0 ? `${currentIndex + 1}/${queueLength} en cola` : 'Sin cola'}</span>
            </div>
          </div>

          <div className="p-4 sm:p-6 space-y-5 overflow-visible lg:overflow-y-auto lg:flex-1">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="rounded-2xl border border-white/10 bg-white/5 p-3 shadow-sm shadow-slate-900/60">
                <label className="block text-[11px] uppercase tracking-[0.08em] text-slate-400 mb-2">Proveedor</label>
                <input
                  type="text"
                  value={data.vendorName}
                  onChange={e => updateField('vendorName', e.target.value)}
                  className={`w-full rounded-2xl px-3 py-3 bg-gradient-to-r from-slate-900/80 to-slate-900/60 text-white border ${data.isSmartMatch ? 'border-purple-300/50' : 'border-white/10'
                    } focus:ring-2 focus:ring-sky-400/50 outline-none shadow-inner shadow-slate-900/50 transition`}
                  placeholder="Ej. Proveedor destacado"
                />
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-3 shadow-sm shadow-slate-900/60">
                <label className="block text-[11px] uppercase tracking-[0.08em] text-slate-400 mb-2">Fecha</label>
                <input
                  type="date"
                  value={data.date}
                  onChange={e => updateField('date', e.target.value)}
                  className="w-full rounded-2xl px-3 py-3 bg-gradient-to-r from-slate-900/80 to-slate-900/60 text-white border border-white/10 focus:ring-2 focus:ring-sky-400/50 outline-none shadow-inner shadow-slate-900/50 transition"
                />
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/5 p-3 sm:p-4 shadow-inner shadow-slate-900/60 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h3 className="font-semibold text-white">Items & Inventario</h3>
                  <p className="text-xs text-slate-400">Sincroniza las líneas de la factura con tu inventario.</p>
                </div>
                <button
                  onClick={addItem}
                  type="button"
                  className="text-sm text-sky-100 hover:text-white font-medium flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-900/60 border border-white/10 hover:-translate-y-0.5 transition"
                >
                  <Plus className="w-3.5 h-3.5" /> Agregar Item
                </button>
              </div>

              <div className="space-y-3">
                {data.items.map((item, idx) => {
                  const validation = checkPrice(item);
                  const linked = Boolean(item.linkedInventoryId);

                  return (
                    <div
                      key={idx}
                      className={`p-3 rounded-2xl border bg-slate-950/70 transition hover:border-sky-300/40 hover:-translate-y-0.5 shadow-sm shadow-slate-900/50 ${linked ? 'border-emerald-300/40' : 'border-white/10'}`}
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                        <span className="text-[11px] uppercase tracking-[0.08em] text-slate-400">Item {idx + 1}</span>
                        <div className="flex items-center gap-2 text-[11px]">
                          <span className={`px-2 py-1 rounded-full border ${linked ? 'border-emerald-300/40 bg-emerald-500/10 text-emerald-50' : 'border-white/10 bg-white/5 text-slate-200'}`}>
                            {linked ? 'Inventario vinculado' : 'Sin vincular'}
                          </span>
                          {validation.status !== 'unknown' && (
                            <span className={`px-2 py-1 rounded-full border flex items-center gap-1 ${validation.status === 'ok'
                              ? 'border-emerald-300/30 bg-emerald-500/10 text-emerald-100'
                              : 'border-amber-300/30 bg-amber-500/10 text-amber-100'
                              }`}>
                              {validation.status === 'ok' ? <CheckCircle className="w-3 h-3" /> : <AlertTriangle className="w-3 h-3" />}
                              {validation.status === 'ok' ? 'Precio en rango' : validation.status === 'high' ? 'Precio alto' : 'Precio bajo'}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="grid grid-cols-12 gap-3 items-start">
                        <div className="col-span-12 lg:col-span-5">
                          <label className="text-[11px] text-slate-400 block mb-2">Descripción Factura</label>
                          <input
                            type="text"
                            value={item.description}
                            onChange={e => updateItem(idx, 'description', e.target.value)}
                            className="w-full text-sm bg-gradient-to-r from-slate-900/80 to-slate-900/60 border border-white/10 rounded-xl focus:border-sky-300/60 focus:ring-2 focus:ring-sky-400/40 text-white outline-none px-3 py-2 shadow-inner shadow-slate-900/50"
                          />
                          <div className="flex items-center gap-2 bg-white/5 p-2 rounded-xl border border-white/10 mt-2">
                            <LinkIcon className={`w-3.5 h-3.5 ${linked ? 'text-emerald-300' : 'text-slate-500'}`} />
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

                        <div className="col-span-6 sm:col-span-3 lg:col-span-2">
                          <label className="text-[11px] text-slate-400 block mb-2">Cant.</label>
                          <input
                            type="number"
                            value={item.quantity}
                            onChange={e => updateItem(idx, 'quantity', parseFloat(e.target.value) || 0)}
                            className="w-full text-sm bg-slate-900/70 border border-white/10 rounded-xl focus:ring-2 focus:ring-sky-400/40 outline-none px-3 py-2 text-right text-white shadow-inner shadow-slate-900/50"
                          />
                        </div>
                        <div className="col-span-6 sm:col-span-3 lg:col-span-2">
                          <label className="text-[11px] text-slate-400 block mb-2">Precio Unit.</label>
                          <input
                            type="number"
                            value={item.unitPrice}
                            onChange={e => updateItem(idx, 'unitPrice', parseFloat(e.target.value) || 0)}
                            className="w-full text-sm bg-slate-900/70 border border-white/10 rounded-xl focus:ring-2 focus:ring-sky-400/40 outline-none px-3 py-2 text-right text-white shadow-inner shadow-slate-900/50"
                          />
                        </div>
                        <div className="col-span-8 sm:col-span-4 lg:col-span-2">
                          <label className="text-[11px] text-slate-400 block mb-2">Total</label>
                          <div className="text-base font-semibold text-right py-2 px-3 rounded-xl bg-white/5 border border-white/10 text-sky-100 shadow-inner shadow-slate-900/40">
                            ${item.total.toFixed(2)}
                          </div>
                        </div>
                        <div className="col-span-4 sm:col-span-2 lg:col-span-1 flex justify-end pt-6">
                          <button
                            onClick={() => removeItem(idx)}
                            className="text-slate-500 hover:text-red-300 transition hover:-translate-y-0.5"
                            title="Eliminar item"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="relative overflow-hidden rounded-3xl border border-white/20 bg-white/5 backdrop-blur-xl shadow-2xl shadow-slate-900/60">
              <div className="absolute inset-0 bg-gradient-to-br from-sky-400/10 via-indigo-500/10 to-fuchsia-500/10" />
              <div className="absolute inset-x-6 top-0 h-px bg-gradient-to-r from-transparent via-white/40 to-transparent" />
              <div className="relative p-4 sm:p-5 space-y-3">
                <div className="flex flex-wrap justify-between text-sm items-center gap-3">
                  <div className="flex items-center gap-2">
                    <span className="text-slate-200 font-semibold">Subtotal</span>
                    {(() => {
                      const calculatedSubtotal = data.items.reduce((acc, item) => acc + item.total, 0);
                      const isManuallyAdjusted = Math.abs(calculatedSubtotal - data.subtotal) > 0.01;
                      return isManuallyAdjusted ? (
                        <span className="text-xs text-amber-100 bg-amber-500/15 px-2 py-1 rounded-full border border-amber-300/30 flex items-center gap-1">
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
                    className="w-28 text-right bg-slate-900/70 border border-white/20 rounded-xl px-3 py-2 text-sm font-semibold focus:ring-2 focus:ring-sky-400/50 outline-none text-white shadow-inner shadow-slate-900/50"
                  />
                </div>
                <div className="flex flex-wrap justify-between text-sm items-center gap-3">
                  <span className="text-slate-200 font-semibold">Impuestos</span>
                  <input
                    type="number"
                    step="0.01"
                    value={data.tax}
                    onChange={e => updateField('tax', parseFloat(e.target.value) || 0)}
                    className="w-28 text-right bg-slate-900/70 border border-white/20 rounded-xl px-3 py-2 text-sm font-semibold focus:ring-2 focus:ring-sky-400/50 outline-none text-white shadow-inner shadow-slate-900/50"
                  />
                </div>
                <div className="flex justify-between items-center border-t border-white/15 pt-4">
                  <div className="space-y-1">
                    <span className="text-xs uppercase tracking-[0.12em] text-slate-300">Total estimado</span>
                    <div className="text-lg font-bold text-white">Saldo listo para aprobar</div>
                  </div>
                  <span className="text-2xl font-black text-emerald-200">${computedTotal.toFixed(2)}</span>
                </div>

                <div className="pt-1 text-xs text-slate-200 text-center flex items-center justify-center gap-1">
                  <CheckCircle className="w-3 h-3 text-emerald-300" />
                  Al guardar, inventario y órdenes se actualizarán con este total.
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="lg:w-[38%] min-w-[320px] mt-2 lg:mt-4">
        <div className="min-h-[420px] lg:h-full rounded-3xl border border-white/10 bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 shadow-2xl shadow-slate-900/70 overflow-hidden relative flex flex-col">
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute inset-x-0 top-0 h-20 bg-gradient-to-b from-white/5 to-transparent" />
            <div className="absolute right-[-8%] bottom-[-20%] h-48 w-48 bg-sky-500/10 blur-3xl" />
          </div>

          <div className="p-4 sm:p-5 flex items-start justify-between">
            <div className="flex items-center gap-2 text-sm text-white bg-white/5 border border-white/10 rounded-2xl px-3 py-2 backdrop-blur">
              <ImageIcon className="w-4 h-4 text-sky-200" />
              Documento original
            </div>
            <div className="flex items-center gap-2">
              {queueLength > 0 && <span className="text-slate-300 text-xs">{currentIndex + 1} / {queueLength}</span>}
            </div>
          </div>

          <div className="absolute top-4 right-4 z-20 flex items-center gap-1 bg-slate-900/70 border border-white/10 rounded-2xl px-2 py-1 shadow-lg shadow-slate-900/50 backdrop-blur">
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
            <div className="text-[11px] text-slate-200 font-mono px-2">{Math.round(zoom * 100)}%</div>
          </div>

          <div className="px-4 pb-2 space-y-2">
            <div className="rounded-2xl border border-white/10 bg-slate-950/70 p-3 flex items-center gap-3 shadow-inner shadow-slate-900/60">
              <div className="flex-1">
                <p className="text-[11px] uppercase tracking-[0.08em] text-slate-400">Proveedor</p>
                <div className="text-white font-semibold">{data.vendorName || 'Pendiente de asignar'}</div>
              </div>
              <div className="text-right">
                <p className="text-[11px] uppercase tracking-[0.08em] text-slate-400">Total</p>
                <div className="text-lg font-black text-emerald-200">${computedTotal.toFixed(2)}</div>
              </div>
            </div>
            <div className="text-[11px] text-slate-400 px-1">
              Zoom: rueda/pellizca. Pan: arrastra con zoom &gt; 1. Reset: botón ⤢.
            </div>
          </div>

          <div
            ref={imageContainerRef}
            className="flex-1 overflow-hidden px-4 pb-6 flex items-start justify-center bg-transparent relative overscroll-contain"
            onWheelCapture={handleWheel}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            style={{
              cursor: zoom > 1 ? (isDragging ? 'grabbing' : 'grab') : 'default',
              touchAction: zoom > 1 ? 'none' : 'pan-y'
            }}
          >
            {data.originalImage ? (
              <div
                style={{
                  transform: `translate(${position.x}px, ${position.y}px) scale(${zoom})`,
                  transformOrigin: 'center center',
                  transition: isDragging ? 'none' : 'transform 0.12s ease-out',
                }}
                className="select-none"
              >
                <img
                  src={data.originalImage}
                  alt="Original Invoice"
                  className="max-w-full rounded-2xl shadow-2xl shadow-slate-900/70 pointer-events-none"
                  draggable={false}
                />
              </div>
            ) : (
              <div className="text-slate-500 mt-10">Imagen no disponible</div>
            )}

            {zoom === 1 && data.originalImage && (
              <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 bg-white/10 text-slate-200 text-xs px-3 py-1.5 rounded-full border border-white/20 pointer-events-none backdrop-blur">
                Usa la rueda o pellizca para hacer zoom. Arrastra para mover.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default InvoiceReview;
