import React, { useState, useEffect } from 'react';
import { Invoice } from '../types';
import { restoService } from '../../services/restoService';
import { useResto } from '../contexts/RestoContext';
import { Search, Trash2, FileText, Calendar, DollarSign, Plus, CheckSquare, BarChart3, Loader2 } from 'lucide-react';

interface DashboardProps {
  onNewInvoice: () => void;
  onEditInvoice: (invoice: Invoice) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ onNewInvoice, onEditInvoice }) => {
  const { currentRestaurant, loading: restoLoading } = useResto();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchInvoices = async () => {
    if (!currentRestaurant) return;
    try {
      setLoading(true);
      const data = await restoService.getInvoices(currentRestaurant.id);
      setInvoices(data);
    } catch (error) {
      console.error('Error fetching invoices:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvoices();
  }, [currentRestaurant]);

  const handleDelete = async (id: string) => {
    if (confirm('¿Estás seguro de eliminar esta factura?')) {
      try {
        await restoService.deleteInvoice(id);
        fetchInvoices();
      } catch (error) {
        console.error('Error deleting invoice:', error);
        alert('Error al eliminar la factura');
      }
    }
  };

  const filteredInvoices = invoices.filter(inv =>
    inv.vendorName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    inv.date?.includes(searchTerm)
  );

  const totalSpent = invoices.reduce((acc, curr) => acc + (curr.total || 0), 0);

  // Daily Closing Stats
  const todayStr = new Date().toISOString().split('T')[0];
  const todayInvoices = invoices.filter(i => i.date === todayStr);
  const dailyGoal = 10;
  const dailyProgress = Math.min((todayInvoices.length / dailyGoal) * 100, 100);

  if (restoLoading || (!currentRestaurant && loading)) {
    return <div className="flex justify-center p-12"><Loader2 className="w-8 h-8 animate-spin text-blue-500" /></div>;
  }

  if (!currentRestaurant) {
    return (
      <div className="text-center p-12">
        <h2 className="text-xl font-bold text-slate-700">No hay restaurante seleccionado</h2>
        <p className="text-slate-500">Por favor crea o selecciona un restaurante para continuar.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Daily Operations Panel (New) */}
      <div className="bg-gradient-to-r from-slate-800 to-slate-900 rounded-xl p-6 text-white shadow-md">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h2 className="text-xl font-bold flex items-center gap-2">
              <CheckSquare className="w-5 h-5 text-blue-400" /> Cierre del Día
            </h2>
            <p className="text-slate-400 text-sm mt-1">Estado operativo de hoy: {todayStr}</p>
          </div>
          <div className="flex-1 w-full md:w-auto md:max-w-md">
            <div className="flex justify-between text-xs mb-1">
              <span>{todayInvoices.length} facturas procesadas</span>
              <span>Meta: {dailyGoal}</span>
            </div>
            <div className="w-full bg-slate-700 rounded-full h-2.5">
              <div className="bg-blue-500 h-2.5 rounded-full transition-all duration-500" style={{ width: `${dailyProgress}%` }}></div>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500">Total Gastado</p>
              <p className="text-2xl font-bold text-slate-900">${totalSpent.toFixed(2)}</p>
            </div>
            <div className="bg-blue-100 p-3 rounded-full">
              <DollarSign className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500">Facturas Registradas</p>
              <p className="text-2xl font-bold text-slate-900">{invoices.length}</p>
            </div>
            <div className="bg-indigo-100 p-3 rounded-full">
              <FileText className="w-6 h-6 text-indigo-600" />
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex items-center justify-center cursor-pointer hover:bg-slate-50 transition border-dashed border-2 border-green-200" onClick={onNewInvoice}>
          <div className="text-center">
            <div className="bg-green-100 p-3 rounded-full inline-block mb-2">
              <Plus className="w-6 h-6 text-green-600" />
            </div>
            <p className="text-sm font-medium text-green-700">Nueva Carga (Batch)</p>
          </div>
        </div>
      </div>

      {/* List Section */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <h2 className="text-lg font-bold text-slate-800">Historial de Facturas</h2>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Buscar por proveedor o fecha..."
              className="pl-9 pr-4 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none w-full md:w-64"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50 text-xs uppercase font-semibold text-slate-500">
              <tr>
                <th className="px-6 py-3">Fecha</th>
                <th className="px-6 py-3">Proveedor</th>
                <th className="px-6 py-3">Categoría</th>
                <th className="px-6 py-3 text-right">Total</th>
                <th className="px-6 py-3 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {loading ? (
                <tr><td colSpan={5} className="p-8 text-center"><Loader2 className="w-6 h-6 animate-spin mx-auto text-blue-500" /></td></tr>
              ) : filteredInvoices.length > 0 ? (
                filteredInvoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-slate-50 transition">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-slate-400" />
                        {inv.date}
                      </div>
                    </td>
                    <td className="px-6 py-4 font-medium text-slate-900">{inv.vendorName}</td>
                    <td className="px-6 py-4">
                      {inv.category ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                          {inv.category}
                        </span>
                      ) : (
                        <span className="text-slate-400 italic">Sin categoría</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right font-bold text-slate-900">${inv.total?.toFixed(2)}</td>
                    <td className="px-6 py-4 flex justify-center gap-2">
                      <button
                        onClick={() => onEditInvoice(inv)}
                        className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-md"
                        title="Ver/Editar"
                      >
                        <FileText className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(inv.id)}
                        className="p-1.5 text-red-600 hover:bg-red-50 rounded-md"
                        title="Eliminar"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-500">
                    No se encontraron facturas.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;