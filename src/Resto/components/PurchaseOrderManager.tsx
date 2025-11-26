
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
    <div className="space-y-6">
       <div className="flex justify-between items-center">
        <div>
           <h2 className="text-xl font-bold text-slate-800">Órdenes de Compra</h2>
           <p className="text-sm text-slate-500">Gestiona pedidos a proveedores y valida entregas.</p>
        </div>
        <button 
          onClick={() => setIsAdding(true)}
          className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 flex items-center gap-2 shadow-sm"
        >
          <Plus className="w-4 h-4" /> Crear Orden
        </button>
      </div>

      {isAdding && (
          <div className="bg-white p-6 rounded-xl shadow-md border border-indigo-100 animate-in fade-in slide-in-from-top-4">
              <h3 className="font-semibold text-slate-700 mb-4">Nueva Orden de Compra</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  <div className="col-span-2">
                      <label className="block text-xs font-semibold text-slate-500 mb-1">Proveedor</label>
                      <input 
                        type="text" 
                        className="w-full border p-2 rounded" 
                        placeholder="Nombre del proveedor"
                        value={newOrder.vendorName || ''} 
                        onChange={e => setNewOrder({...newOrder, vendorName: e.target.value})} 
                      />
                  </div>
                  <div>
                      <label className="block text-xs font-semibold text-slate-500 mb-1">Fecha Esperada</label>
                      <input type="date" className="w-full border p-2 rounded" />
                  </div>
              </div>

              {/* Add Items Sub-form */}
              <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 mb-4">
                  <h4 className="text-xs font-bold text-slate-500 uppercase mb-2">Items del Pedido</h4>
                  <div className="flex gap-2 items-end mb-2">
                      <input 
                        className="flex-1 border p-2 rounded text-sm" 
                        placeholder="Producto" 
                        value={tempItem.description || ''} 
                        onChange={e => setTempItem({...tempItem, description: e.target.value})}
                      />
                      <input 
                        type="number" className="w-20 border p-2 rounded text-sm" placeholder="Cant." 
                        value={tempItem.quantity} 
                        onChange={e => setTempItem({...tempItem, quantity: Number(e.target.value)})}
                      />
                      <input 
                        type="number" className="w-24 border p-2 rounded text-sm" placeholder="$ Unit" 
                        value={tempItem.unitPrice} 
                        onChange={e => setTempItem({...tempItem, unitPrice: Number(e.target.value)})}
                      />
                      <button onClick={handleAddItem} className="bg-slate-800 text-white p-2 rounded hover:bg-slate-900">
                          <Plus className="w-4 h-4" />
                      </button>
                  </div>
                  {/* Items List Preview */}
                  {newOrder.items && newOrder.items.length > 0 && (
                      <div className="mt-3 space-y-1">
                          {newOrder.items.map((item, idx) => (
                              <div key={idx} className="flex justify-between text-sm p-2 bg-white rounded border border-slate-200">
                                  <span>{item.quantity} x {item.description}</span>
                                  <span className="font-mono">${item.total.toFixed(2)}</span>
                              </div>
                          ))}
                          <div className="text-right font-bold pt-2 text-slate-800">
                              Total Est.: ${newOrder.items.reduce((acc, i) => acc + i.total, 0).toFixed(2)}
                          </div>
                      </div>
                  )}
              </div>

              <div className="flex justify-end gap-2">
                  <button onClick={() => setIsAdding(false)} className="px-4 py-2 border rounded hover:bg-slate-50">Cancelar</button>
                  <button onClick={handleSaveOrder} className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 flex items-center gap-2">
                      <Save className="w-4 h-4" /> Guardar Orden
                  </button>
              </div>
          </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {orders.map(order => (
              <div key={order.id} className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 hover:border-indigo-300 transition group relative">
                  <div className="flex justify-between items-start mb-3">
                      <div>
                          <span className={`text-xs font-bold px-2 py-1 rounded-full ${order.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'}`}>
                              {order.status === 'pending' ? 'Pendiente' : 'Recibido'}
                          </span>
                          <h3 className="font-bold text-slate-800 mt-2">{order.vendorName}</h3>
                          <p className="text-xs text-slate-500 flex items-center gap-1 mt-1">
                              <Clock className="w-3 h-3" /> {order.date}
                          </p>
                      </div>
                      <div className="bg-slate-100 p-2 rounded-lg">
                          <ClipboardList className="w-5 h-5 text-slate-600" />
                      </div>
                  </div>
                  
                  <div className="space-y-1 mb-4">
                      {order.items.slice(0, 3).map((item, i) => (
                          <div key={i} className="text-sm text-slate-600 flex justify-between">
                              <span>{item.description}</span>
                              <span className="text-slate-400">x{item.quantity}</span>
                          </div>
                      ))}
                      {order.items.length > 3 && <p className="text-xs text-slate-400 italic">... y {order.items.length - 3} más</p>}
                  </div>
                  
                  <div className="flex justify-between items-center pt-3 border-t border-slate-100">
                      <span className="font-bold text-lg text-slate-900">${order.total.toFixed(2)}</span>
                      {order.status === 'pending' && (
                           <button onClick={() => deletePurchaseOrder(order.id)} className="text-red-400 hover:text-red-600 text-xs opacity-0 group-hover:opacity-100 transition">Eliminar</button>
                      )}
                  </div>
              </div>
          ))}
          {orders.length === 0 && !isAdding && (
              <div className="col-span-full py-12 text-center text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-300">
                  <ClipboardList className="w-12 h-12 mx-auto mb-2 opacity-20" />
                  <p>No hay órdenes de compra activas.</p>
              </div>
          )}
      </div>
    </div>
  );
};

export default PurchaseOrderManager;
