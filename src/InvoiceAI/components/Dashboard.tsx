import React, { useState, useEffect } from 'react';
import { Invoice } from '../types';
import { invoiceService } from '../../services/invoiceService';
import { useInvoice } from '../contexts/InvoiceContext';
import { Search, Trash2, FileText, Calendar, DollarSign, Plus, CheckSquare, BarChart3, Loader2 } from 'lucide-react';

interface DashboardProps {
  onNewInvoice: () => void;
  onEditInvoice: (invoice: Invoice) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ onNewInvoice, onEditInvoice }) => {
  const { currentCompany, loading: restoLoading } = useInvoice();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchInvoices = async () => {
    if (!currentCompany) return;
    try {
      setLoading(true);
      const data = await invoiceService.getInvoices(currentCompany.id);
      // Map DB invoice to UI invoice type
      const mappedInvoices: Invoice[] = data.map(dbInv => ({
        id: dbInv.id,
        vendorName: 'Proveedor Desconocido', // Placeholder as DB lacks this field
        date: new Date(dbInv.created_at).toISOString().split('T')[0],
        total: dbInv.total,
        subtotal: dbInv.total, // Assumption
        tax: 0,
        items: [],
        status: 'saved',
        createdAt: new Date(dbInv.created_at).getTime(),
        // Add other required fields with defaults
      }));
      setInvoices(mappedInvoices);
    } catch (error) {
      console.error('Error fetching invoices:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvoices();
  }, [currentCompany]);

  const handleDelete = async (id: string) => {
    if (confirm('¿Estás seguro de eliminar esta factura?')) {
      try {
        await invoiceService.deleteInvoice(id);
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

  if (restoLoading || (!currentCompany && loading)) {
    return <div className="flex justify-center p-12"><Loader2 className="w-8 h-8 animate-spin text-blue-500" /></div>;
  }

  if (!currentCompany) {
    return (
      <div className="text-center p-12">
        <h2 className="text-xl font-bold text-slate-700">No hay empresa seleccionada</h2>
        <p className="text-slate-500">Por favor crea o selecciona una empresa para continuar.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 text-slate-50">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="rounded-2xl border border-slate-800 bg-gradient-to-br from-sky-500/20 via-slate-900 to-slate-950 p-5 shadow-lg shadow-sky-900/40">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs text-slate-300 uppercase tracking-[0.2em] flex items-center gap-2">
                <CheckSquare className="w-4 h-4 text-sky-200" />
                Cierre del día
              </p>
              <h3 className="text-xl font-semibold text-white mt-1">{todayStr}</h3>
              <p className="text-sm text-slate-400">Flujo IA listo para el turno.</p>
            </div>
            <div className="h-12 w-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center">
              <BarChart3 className="w-6 h-6 text-sky-200" />
            </div>
          </div>
          <div className="mt-4">
            <div className="flex justify-between text-xs text-slate-300">
              <span>{todayInvoices.length} facturas</span>
              <span>Meta {dailyGoal}</span>
            </div>
            <div className="mt-2 h-2 rounded-full bg-slate-800 overflow-hidden">
              <div className="h-full bg-gradient-to-r from-sky-400 to-indigo-500 transition-all" style={{ width: `${dailyProgress}%` }} />
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5 shadow-lg shadow-slate-900/40 flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-400 uppercase tracking-[0.2em]">Gasto acumulado</p>
            <p className="text-3xl font-bold text-white mt-2">${totalSpent.toFixed(2)}</p>
            <p className="text-sm text-slate-400">Incluye facturas confirmadas</p>
          </div>
          <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-emerald-400/80 to-teal-500/80 flex items-center justify-center text-emerald-950 shadow-lg shadow-emerald-900/50">
            <DollarSign className="w-6 h-6" />
          </div>
        </div>

        <button
          onClick={onNewInvoice}
          className="rounded-2xl border border-emerald-300/40 bg-gradient-to-br from-emerald-500/20 via-emerald-500/10 to-slate-900 p-5 shadow-lg shadow-emerald-900/40 text-left group transition hover:-translate-y-0.5"
        >
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs text-emerald-100 uppercase tracking-[0.2em] flex items-center gap-2">
                <Plus className="w-4 h-4" />
                Nueva carga IA
              </p>
              <h3 className="text-xl font-semibold text-white mt-1">Escanear (Batch)</h3>
              <p className="text-sm text-emerald-50/80 mt-1">Optimizado para móvil: arrastra y suelta, confirma y listo.</p>
            </div>
            <div className="h-12 w-12 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center">
              <ArrowRight className="w-5 h-5 text-white group-hover:translate-x-1 transition" />
            </div>
          </div>
        </button>
      </div>

      <div className="rounded-3xl border border-slate-800 bg-slate-950/60 shadow-2xl shadow-slate-900/60 overflow-hidden">
        <div className="p-4 md:p-5 border-b border-white/5 flex flex-col md:flex-row md:items-center gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Historial</p>
            <h2 className="text-xl font-bold text-white">Facturas recientes</h2>
          </div>
          <div className="relative w-full md:max-w-xs ml-auto">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 w-4 h-4" />
            <input
              type="text"
              placeholder="Proveedor, fecha..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-900/70 border border-white/10 text-sm text-white placeholder:text-slate-500 focus:ring-2 focus:ring-sky-400/50 outline-none"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-7 h-7 animate-spin text-sky-300" />
          </div>
        ) : filteredInvoices.length === 0 ? (
          <div className="py-12 text-center text-slate-400">
            <FileText className="w-10 h-10 mx-auto mb-2 opacity-60" />
            No se encontraron facturas.
          </div>
        ) : (
          <div className="p-4 md:p-5 grid gap-3 sm:grid-cols-2">
            {filteredInvoices.map((inv) => (
              <div
                key={inv.id}
                className="rounded-2xl border border-white/10 bg-white/5 p-4 shadow-md shadow-slate-900/50 hover:border-sky-300/40 transition relative overflow-hidden"
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="h-11 w-11 rounded-2xl bg-gradient-to-br from-indigo-500/60 to-slate-900 border border-white/10 flex items-center justify-center text-white">
                      <Calendar className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-sm text-slate-300">{inv.date}</p>
                      <p className="text-lg font-semibold text-white leading-tight">{inv.vendorName}</p>
                      <p className="text-xs text-slate-400">#{inv.id.slice(0, 6)}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-slate-400">Total</p>
                    <p className="text-xl font-bold text-sky-200">${inv.total?.toFixed(2)}</p>
                    <p className="text-xs text-slate-400">Subtotal ${inv.subtotal?.toFixed(2)}</p>
                  </div>
                </div>

                <div className="mt-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {inv.category ? (
                      <span className="text-[11px] px-2.5 py-1 rounded-full bg-sky-500/15 text-sky-100 border border-sky-300/20">
                        {inv.category}
                      </span>
                    ) : (
                      <span className="text-[11px] px-2.5 py-1 rounded-full bg-slate-800 text-slate-300 border border-white/5">
                        Sin categoría
                      </span>
                    )}
                    <span className="text-[11px] px-2 py-1 rounded-full bg-white/5 border border-white/10 text-slate-200">
                      {inv.status === 'saved' ? 'Guardada' : 'Borrador'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => onEditInvoice(inv)}
                      className="px-3 py-1.5 rounded-xl bg-white/10 text-xs font-semibold text-slate-50 border border-white/10 hover:border-sky-300/40 transition"
                    >
                      Abrir
                    </button>
                    <button
                      onClick={() => handleDelete(inv.id)}
                      className="px-2 py-1.5 rounded-xl bg-red-500/10 text-xs font-semibold text-red-200 border border-red-400/30 hover:bg-red-500/20 transition"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
