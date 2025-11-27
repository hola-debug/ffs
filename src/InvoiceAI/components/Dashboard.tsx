import React, { useState, useEffect } from 'react';
import { Invoice } from '../types';
import { invoiceService } from '../../services/invoiceService';
import { useInvoice } from '../contexts/InvoiceContext';
import { Search, Trash2, FileText, Calendar, DollarSign, ScanLine, Loader2, ChevronRight, Package } from 'lucide-react';

interface DashboardProps {
  onNewInvoice: () => void;
  onEditInvoice: (invoice: Invoice) => void;
  onOpenInventory: () => void;
}

const Dashboard: React.FC<DashboardProps> = ({ onNewInvoice, onEditInvoice, onOpenInventory }) => {
  const { currentCompany, loading: restoLoading } = useInvoice();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchInvoices = async () => {
    if (!currentCompany) return;
    try {
      setLoading(true);
      const data = await invoiceService.getInvoices(currentCompany.id);
      const mappedInvoices: Invoice[] = data.map(dbInv => ({
        id: dbInv.id,
        vendorName: dbInv.vendor_name || 'Proveedor Desconocido',
        date: new Date((dbInv.invoice_date || dbInv.created_at)).toISOString().split('T')[0],
        total: dbInv.total ?? 0,
        subtotal: dbInv.subtotal ?? dbInv.total ?? 0,
        tax: dbInv.tax ?? 0,
        items: [],
        status: 'saved',
        createdAt: new Date(dbInv.created_at).getTime(),
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

  if (restoLoading || (!currentCompany && loading)) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-cyan-400" />
      </div>
    );
  }

  if (!currentCompany) {
    return (
      <div className="flex items-center justify-center min-h-screen px-6">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-slate-200">No hay empresa seleccionada</h2>
          <p className="text-sm text-slate-500 mt-2">Por favor crea o selecciona una empresa para continuar.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen px-4 pt-20 pb-8" style={{ backgroundColor: '#0A0A0F' }}>
      {/* Main Content */}
      <div className="mx-auto max-w-md space-y-4">

        {/* Accumulated Spending Card - Solid Block with Glow */}
        <div
          className="rounded-3xl border p-6 relative overflow-hidden"
          style={{
            backgroundColor: '#0F1115',
            borderColor: 'rgba(6, 182, 212, 0.15)',
            boxShadow: '0 0 40px rgba(6, 182, 212, 0.08), 0px 8px 24px rgba(0, 0, 0, 0.3)'
          }}
        >
          <div className="relative z-10">
            <div className="flex items-start justify-between mb-6">
              <div>
                <p className="text-[11px] uppercase tracking-[0.15em] font-medium" style={{ color: '#64748b' }}>
                  Gasto acumulado
                </p>
                <p className="text-5xl font-semibold text-white mt-3" style={{ fontFamily: 'Inter, system-ui, sans-serif', letterSpacing: '-0.02em' }}>
                  ${totalSpent.toFixed(2)}
                </p>
              </div>
              <div
                className="h-12 w-12 rounded-2xl flex items-center justify-center"
                style={{
                  background: 'linear-gradient(135deg, #06b6d4 0%, #14b8a6 100%)',
                  boxShadow: '0 4px 16px rgba(6, 182, 212, 0.3)'
                }}
              >
                <DollarSign className="w-6 h-6 text-white" strokeWidth={2.5} />
              </div>
            </div>
          </div>

          {/* Subtle glow effect */}
          <div
            className="absolute -bottom-20 -right-20 w-60 h-60 rounded-full opacity-10"
            style={{
              background: 'radial-gradient(circle, #06b6d4 0%, transparent 70%)',
              filter: 'blur(40px)'
            }}
          />
        </div>

        {/* Scan Invoices Button - Full Width Elevated */}
        <button
          onClick={onNewInvoice}
          className="w-full rounded-3xl border p-5 flex items-center justify-between group transition-all duration-300 active:scale-[0.98]"
          style={{
            backgroundColor: 'rgba(6, 182, 212, 0.08)',
            borderColor: 'rgba(6, 182, 212, 0.25)',
            boxShadow: '0px 8px 24px rgba(0, 0, 0, 0.2), 0 0 0 1px rgba(6, 182, 212, 0.1) inset'
          }}
        >
          <div className="flex items-center gap-4">
            <div
              className="h-14 w-14 rounded-2xl flex items-center justify-center"
              style={{
                backgroundColor: 'rgba(6, 182, 212, 0.15)',
                border: '1.5px solid rgba(6, 182, 212, 0.3)'
              }}
            >
              <ScanLine className="w-7 h-7 text-cyan-400" strokeWidth={2} />
            </div>
            <div className="text-left">
              <p className="text-[10px] uppercase tracking-[0.15em] font-medium text-cyan-400/70">
                + Escanear
              </p>
              <p className="text-lg font-semibold text-white mt-0.5" style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>
                Escanear Facturas
              </p>
            </div>
          </div>
          <ChevronRight className="w-5 h-5 text-cyan-400 group-hover:translate-x-1 transition-transform" />
        </button>

        <button
          onClick={onOpenInventory}
          className="w-full rounded-3xl border p-5 flex items-center justify-between group transition-all duration-300 active:scale-[0.98]"
          style={{
            backgroundColor: 'rgba(99, 102, 241, 0.08)',
            borderColor: 'rgba(99, 102, 241, 0.25)',
            boxShadow: '0px 8px 24px rgba(0, 0, 0, 0.2), 0 0 0 1px rgba(99, 102, 241, 0.1) inset'
          }}
        >
          <div className="flex items-center gap-4">
            <div
              className="h-14 w-14 rounded-2xl flex items-center justify-center"
              style={{
                backgroundColor: 'rgba(99, 102, 241, 0.15)',
                border: '1.5px solid rgba(99, 102, 241, 0.3)'
              }}
            >
              <Package className="w-7 h-7 text-indigo-300" strokeWidth={2} />
            </div>
            <div className="text-left">
              <p className="text-[10px] uppercase tracking-[0.15em] font-medium text-indigo-200/70">
                Inventario
              </p>
              <p className="text-lg font-semibold text-white mt-0.5" style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>
                Abrir inventario y stock
              </p>
            </div>
          </div>
          <ChevronRight className="w-5 h-5 text-indigo-300 group-hover:translate-x-1 transition-transform" />
        </button>

        {/* Recent Invoices Section */}
        <div
          className="rounded-3xl border overflow-hidden"
          style={{
            backgroundColor: 'rgba(15, 17, 21, 0.6)',
            backdropFilter: 'blur(20px)',
            borderColor: 'rgba(255, 255, 255, 0.06)',
            boxShadow: '0px 8px 24px rgba(0, 0, 0, 0.3)'
          }}
        >
          {/* Header */}
          <div className="px-5 py-4 border-b" style={{ borderColor: 'rgba(255, 255, 255, 0.04)' }}>
            <p className="text-[10px] uppercase tracking-[0.15em] font-medium text-slate-500 mb-1">
              Historial
            </p>
            <h2 className="text-xl font-semibold text-white" style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>
              Facturas recientes
            </h2>
          </div>

          {/* Search Bar */}
          <div className="px-5 py-3 border-b" style={{ borderColor: 'rgba(255, 255, 255, 0.04)' }}>
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600" />
              <input
                type="text"
                placeholder="Proveedor, fecha..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-11 pr-4 py-3 rounded-2xl text-sm text-white placeholder:text-slate-600 outline-none transition-all focus:ring-2"
                style={{
                  backgroundColor: 'rgba(255, 255, 255, 0.03)',
                  border: '1px solid rgba(255, 255, 255, 0.06)',
                  fontFamily: 'Inter, system-ui, sans-serif'
                }}
              />
            </div>
          </div>

          {/* Invoice List */}
          <div className="px-5 py-4">
            {loading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="w-6 h-6 animate-spin text-cyan-400" />
              </div>
            ) : filteredInvoices.length === 0 ? (
              <div className="py-16 text-center">
                <div
                  className="w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center"
                  style={{
                    backgroundColor: 'rgba(255, 255, 255, 0.03)',
                    border: '1px solid rgba(255, 255, 255, 0.06)'
                  }}
                >
                  <FileText className="w-7 h-7 text-slate-700" />
                </div>
                <p className="text-sm text-slate-500 font-medium">No se encontraron facturas.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {filteredInvoices.map((inv, idx) => (
                  <div
                    key={inv.id}
                    className="rounded-2xl border p-4 transition-all duration-200 active:scale-[0.98]"
                    style={{
                      backgroundColor: 'rgba(255, 255, 255, 0.02)',
                      borderColor: 'rgba(255, 255, 255, 0.06)',
                      boxShadow: idx === 0 ? '0 2px 8px rgba(0, 0, 0, 0.1)' : 'none'
                    }}
                  >
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="flex items-start gap-3 flex-1 min-w-0">
                        <div
                          className="h-11 w-11 rounded-xl flex items-center justify-center flex-shrink-0"
                          style={{
                            backgroundColor: 'rgba(100, 116, 139, 0.1)',
                            border: '1px solid rgba(100, 116, 139, 0.15)'
                          }}
                        >
                          <Calendar className="w-5 h-5 text-slate-400" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-slate-500 font-medium">{inv.date}</p>
                          <p className="text-base font-semibold text-white mt-0.5 truncate" style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>
                            {inv.vendorName}
                          </p>
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="text-xs text-slate-500 font-medium">Total</p>
                        <p className="text-lg font-semibold text-cyan-400 mt-0.5" style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>
                          ${inv.total?.toFixed(2)}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        {inv.category && (
                          <span
                            className="text-[10px] px-2.5 py-1 rounded-full font-medium"
                            style={{
                              backgroundColor: 'rgba(100, 116, 139, 0.12)',
                              color: '#94a3b8',
                              border: '1px solid rgba(100, 116, 139, 0.2)'
                            }}
                          >
                            {inv.category}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => onEditInvoice(inv)}
                          className="px-3 py-1.5 rounded-xl text-xs font-semibold transition-all"
                          style={{
                            backgroundColor: 'rgba(6, 182, 212, 0.1)',
                            color: '#06b6d4',
                            border: '1px solid rgba(6, 182, 212, 0.2)'
                          }}
                        >
                          Abrir
                        </button>
                        <button
                          onClick={() => handleDelete(inv.id)}
                          className="px-2 py-1.5 rounded-xl transition-all"
                          style={{
                            backgroundColor: 'rgba(239, 68, 68, 0.08)',
                            border: '1px solid rgba(239, 68, 68, 0.15)'
                          }}
                        >
                          <Trash2 className="w-4 h-4 text-red-400" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
