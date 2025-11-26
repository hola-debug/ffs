
import React, { useState, useEffect } from 'react';
import { PurchaseOrder, InvoiceItem } from '../types';
import { getPurchaseOrders, savePurchaseOrder, deletePurchaseOrder } from '../services/storageService';
import { Plus, Trash2, ClipboardList, CheckCircle, Clock, Save, X } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';

const PurchaseOrderManager: React.FC = () => {
  const [orders, setOrders] = useState<PurchaseOrder[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  
  // New Order State
  const [newOrder, setNewOrder] = useState<Partial<PurchaseOrder>>({ items: [] });
  const [tempItem, setTempItem] = useState<Partial<InvoiceItem>>({ quantity: 1, unitPrice: 0 });

  useEffect(() => {
    setOrders(getPurchaseOrders());
  }, []);

  const handleAddItem = () => {
      if (tempItem.description && tempItem.quantity) {
          const item: InvoiceItem = {
              description: tempItem.description,
              quantity: Number(tempItem.quantity),
              unitPrice: Number(tempItem.unitPrice),
              total: Number(tempItem.quantity) * Number(tempItem.unitPrice)
          };
          setNewOrder(prev => ({
              ...prev,
              items: [...(prev.items || []), item]
          }));
          setTempItem({ description: '', quantity: 1, unitPrice: 0 });
      }
  };

  const handleSaveOrder = () => {
      if (newOrder.vendorName && newOrder.items && newOrder.items.length > 0) {
          const total = newOrder.items.reduce((acc, i) => acc + i.total, 0);
          const order: PurchaseOrder = {
              id: uuidv4(),
              vendorName: newOrder.vendorName,
              date: new Date().toISOString().split('T')[0],
              items: newOrder.items,
              total: total,
              status: 'pending'
          };
          savePurchaseOrder(order);
          setOrders(getPurchaseOrders());
          setIsAdding(false);
          setNewOrder({ items: [] });
      }
  };

  return (
    <div className="space-y-6 text-slate-50">
       <div className="flex justify-between items-start gap-3">
        <div>
           <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Órdenes</p>
           <h2 className="text-2xl font-bold text-white">Compras & entregas</h2>
           <p className="text-sm text-slate-400">Gestiona pedidos a proveedores y valida entregas.</p>
        </div>
        <button 
          onClick={() => setIsAdding(true)}
          className="bg-gradient-to-r from-amber-400 to-orange-500 text-amber-950 px-4 py-2 rounded-xl text-sm font-semibold hover:shadow-lg hover:shadow-orange-900/40 flex items-center gap-2"
        >
          <Plus className="w-4 h-4" /> Crear Orden
        </button>
      </div>

      {isAdding && (
          <div className="rounded-3xl border border-white/10 bg-slate-950/70 shadow-2xl shadow-slate-900/60 p-6 animate-in fade-in slide-in-from-top-4">
              <h3 className="font-semibold text-white mb-4">Nueva Orden de Compra</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  <div className="col-span-2">
                      <label className="block text-xs font-semibold text-slate-300 mb-1">Proveedor</label>
                      <input 
                        type="text" 
                        className="w-full border border-white/10 p-3 rounded-xl bg-slate-900/70 text-white focus:ring-2 focus:ring-amber-400/50 outline-none" 
                        placeholder="Nombre del proveedor"
                        value={newOrder.vendorName || ''} 
                        onChange={e => setNewOrder({...newOrder, vendorName: e.target.value})} 
                      />
                  </div>
                  <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">Fecha Esperada</label>
                      <input type="date" className="w-full border border-white/10 p-3 rounded-xl bg-slate-900/70 text-white focus:ring-2 focus:ring-amber-400/50 outline-none" />
                  </div>
              </div>

              <div className="bg-white/5 p-4 rounded-2xl border border-white/10 mb-4">
                  <h4 className="text-xs font-bold text-slate-200 uppercase mb-2">Items del Pedido</h4>
                  <div className="flex flex-col md:flex-row gap-2 items-end mb-2">
                      <input 
                        className="flex-1 border border-white/10 p-2 rounded-xl text-sm bg-slate-900/70 text-white focus:ring-2 focus:ring-amber-400/50 outline-none" 
                        placeholder="Producto" 
                        value={tempItem.description || ''} 
                        onChange={e => setTempItem({...tempItem, description: e.target.value})}
                      />
                      <input 
                        type="number" className="w-24 border border-white/10 p-2 rounded-xl text-sm bg-slate-900/70 text-white" placeholder="Cant." 
                        value={tempItem.quantity} 
                        onChange={e => setTempItem({...tempItem, quantity: Number(e.target.value)})}
                      />
                      <input 
                        type="number" className="w-28 border border-white/10 p-2 rounded-xl text-sm bg-slate-900/70 text-white" placeholder="$ Unit" 
                        value={tempItem.unitPrice} 
                        onChange={e => setTempItem({...tempItem, unitPrice: Number(e.target.value)})}
                      />
                      <button onClick={handleAddItem} className="bg-gradient-to-r from-slate-800 to-slate-900 text-white p-2 rounded-xl border border-white/10 hover:border-amber-300/40">
                          <Plus className="w-4 h-4" />
                      </button>
                  </div>
                  {newOrder.items && newOrder.items.length > 0 && (
                      <div className="mt-3 space-y-1">
                          {newOrder.items.map((item, idx) => (
                              <div key={idx} className="flex justify-between text-sm p-2 bg-slate-900/70 rounded-xl border border-white/10 text-white">
                                  <span>{item.quantity} x {item.description}</span>
                                  <span className="font-mono">${item.total.toFixed(2)}</span>
                              </div>
                          ))}
                          <div className="text-right font-bold pt-2 text-amber-100">
                              Total Est.: ${newOrder.items.reduce((acc, i) => acc + i.total, 0).toFixed(2)}
                          </div>
                      </div>
                  )}
              </div>

              <div className="flex justify-end gap-2">
                  <button onClick={() => setIsAdding(false)} className="px-4 py-2 border border-white/10 rounded-xl bg-white/5 text-slate-200 hover:border-white/20">Cancelar</button>
                  <button onClick={handleSaveOrder} className="px-4 py-2 bg-gradient-to-r from-amber-400 to-orange-500 text-amber-950 rounded-xl font-semibold hover:shadow-lg hover:shadow-orange-900/40 flex items-center gap-2">
                      <Save className="w-4 h-4" /> Guardar Orden
                  </button>
              </div>
          </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {orders.map(order => (
              <div key={order.id} className="rounded-2xl border border-white/10 bg-white/5 p-5 hover:border-amber-300/40 transition group relative shadow-md shadow-slate-900/40">
                  <div className="flex justify-between items-start mb-3">
                      <div>
                          <span className={`text-xs font-bold px-2 py-1 rounded-full ${order.status === 'pending' ? 'bg-yellow-500/20 text-yellow-100 border border-yellow-300/40' : 'bg-emerald-500/20 text-emerald-100 border border-emerald-300/40'}`}>
                              {order.status === 'pending' ? 'Pendiente' : 'Recibido'}
                          </span>
                          <h3 className="font-bold text-white mt-2">{order.vendorName}</h3>
                          <p className="text-xs text-slate-400 flex items-center gap-1 mt-1">
                              <Clock className="w-3 h-3" /> {order.date}
                          </p>
                      </div>
                      <div className="bg-slate-900/60 p-2 rounded-xl border border-white/10">
                          <ClipboardList className="w-5 h-5 text-slate-100" />
                      </div>
                  </div>
                  
                  <div className="space-y-1 mb-4">
                      {order.items.slice(0, 3).map((item, i) => (
                          <div key={i} className="text-sm text-slate-200 flex justify-between">
                              <span>{item.description}</span>
                              <span className="text-slate-400">x{item.quantity}</span>
                          </div>
                      ))}
                      {order.items.length > 3 && <p className="text-xs text-slate-500 italic">... y {order.items.length - 3} más</p>}
                  </div>
                  
                  <div className="flex justify-between items-center pt-3 border-t border-white/10">
                      <span className="font-bold text-lg text-amber-100">${order.total.toFixed(2)}</span>
                      {order.status === 'pending' && (
                           <button onClick={() => deletePurchaseOrder(order.id)} className="text-red-300 hover:text-red-200 text-xs opacity-0 group-hover:opacity-100 transition">Eliminar</button>
                      )}
                  </div>
              </div>
          ))}
          {orders.length === 0 && !isAdding && (
              <div className="col-span-full py-12 text-center text-slate-400 bg-slate-900/50 rounded-2xl border border-dashed border-white/10">
                  <ClipboardList className="w-12 h-12 mx-auto mb-2 opacity-60" />
                  <p>No hay órdenes de compra activas.</p>
              </div>
          )}
      </div>
    </div>
  );
};

export default PurchaseOrderManager;
