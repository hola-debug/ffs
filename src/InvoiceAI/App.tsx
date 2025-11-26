
import React, { useState } from 'react';
import Dashboard from './components/Dashboard';
import UploadProcessor from './components/UploadProcessor';
import InvoiceReview from './components/InvoiceReview';
import InventoryManager from './components/InventoryManager';
import PurchaseOrderManager from './components/PurchaseOrderManager';
import CompanySetup from './components/CompanySetup';
import { Invoice, AppView } from './types';
import { invoiceService } from '../services/invoiceService';
import { storageService } from '../services/storageService';
import { LayoutDashboard, Receipt, Bell, Package, ClipboardList, Sparkles, ShieldCheck, ArrowRight } from 'lucide-react';

import { InvoiceProvider, useInvoice } from './contexts/InvoiceContext';
import { useSupabaseUser } from '../hooks/useSupabaseUser';

const App: React.FC = () => {
  // ... existing state ...

  return (
    <InvoiceProvider>
      <InvoiceAppContent />
    </InvoiceProvider>
  );
};

const InvoiceAppContent: React.FC = () => {
  const { currentCompany, companies, loading } = useInvoice();
  const { user } = useSupabaseUser();

  // All hooks must be called before any conditional returns
  const [currentView, setCurrentView] = useState<AppView>('dashboard');
  const [reviewQueue, setReviewQueue] = useState<Invoice[]>([]);
  const [currentReviewIndex, setCurrentReviewIndex] = useState(0);

  // Handlers
  const handleNewInvoice = () => {
    setCurrentView('upload');
  };

  const handleAnalysisComplete = (drafts: Invoice[]) => {
    if (drafts.length > 0) {
      setReviewQueue(drafts);
      setCurrentReviewIndex(0);
      setCurrentView('review');
    }
  };

  const handleEditInvoice = (invoice: Invoice) => {
    setReviewQueue([invoice]);
    setCurrentReviewIndex(0);
    setCurrentView('review');
  };

  const base64ToBlob = (base64: string, mimeType: string = 'image/jpeg') => {
    const byteCharacters = atob(base64.split(',')[1]);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    return new Blob([byteArray], { type: mimeType });
  };

  const handleSaveInvoice = async (invoice: Invoice) => {
    if (!currentCompany || !user) return;

    try {
      // 1. Upload image if exists
      let filePath = '';
      if (invoice.originalImage) {
        const blob = base64ToBlob(invoice.originalImage);
        const file = new File([blob], `invoice-${invoice.id}.jpg`, { type: 'image/jpeg' });
        filePath = await storageService.uploadInvoice(user.id, invoice.id, file);
      }

      // 2. Create invoice record with all details
      await invoiceService.createInvoice(currentCompany.id, {
        total: invoice.total,
        subtotal: invoice.subtotal,
        tax: invoice.tax,
        vendor_name: invoice.vendorName,
        invoice_date: invoice.date,
        category: invoice.category,
        status: 'saved',
        pdf_path: filePath
      });

      // 3. Process each invoice item
      for (const item of invoice.items) {
        if (item.linkedInventoryId) {
          // Item is linked to existing inventory - update stock
          try {
            await invoiceService.updateItemStock(
              item.linkedInventoryId,
              item.quantity,
              'add' // Adding stock from purchase
            );
          } catch (error) {
            console.error(`Error updating stock for item ${item.linkedInventoryId}:`, error);
          }
        } else if (item.description && item.quantity > 0) {
          // Item is not linked - create new inventory item
          try {
            await invoiceService.addInvoiceItem(currentCompany.id, {
              item_name: item.description,
              current_stock: item.quantity,
              unit_type: 'units', // Default, could be enhanced to detect from description
              unit_price: item.unitPrice
            });
          } catch (error) {
            console.error(`Error creating inventory item for ${item.description}:`, error);
          }
        }
      }

      // 4. Move to next in queue or return to dashboard
      if (currentReviewIndex < reviewQueue.length - 1) {
        setCurrentReviewIndex(prev => prev + 1);
      } else {
        // Done with queue
        setReviewQueue([]);
        setCurrentView('dashboard');
      }
    } catch (error) {
      console.error('Error saving invoice:', error);
      alert('Error al guardar la factura: ' + (error instanceof Error ? error.message : 'Unknown error'));
    }
  };

  const handleSkipInvoice = () => {
    if (currentReviewIndex < reviewQueue.length - 1) {
      setCurrentReviewIndex(prev => prev + 1);
    } else {
      setReviewQueue([]);
      setCurrentView('dashboard');
    }
  };

  const handleCancelReview = () => {
    setReviewQueue([]);
    setCurrentView('dashboard');
  };

  // Conditional return AFTER all hooks
  if (!loading && companies.length === 0) {
    return <CompanySetup />;
  }

  const navItems: Array<{ id: AppView; label: string; icon: React.ElementType; accent: string; hint: string }> = [
    { id: 'dashboard', label: 'Inicio', icon: LayoutDashboard, accent: 'from-sky-400 to-blue-500', hint: 'Resumen y actividad' },
    { id: 'upload', label: 'Batch IA', icon: Receipt, accent: 'from-emerald-400 to-teal-500', hint: 'Escanea y clasifica' },
    { id: 'inventory', label: 'Inventario', icon: Package, accent: 'from-indigo-400 to-purple-500', hint: 'Stock y precios' },
    { id: 'orders', label: 'Órdenes', icon: ClipboardList, accent: 'from-amber-400 to-orange-500', hint: 'Compras y entregas' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-slate-50 relative overflow-hidden">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-24 top-10 h-72 w-72 bg-sky-500/20 blur-[120px] rounded-full" />
        <div className="absolute right-0 top-40 h-80 w-80 bg-purple-600/20 blur-[140px] rounded-full" />
        <div className="absolute -bottom-10 left-20 h-64 w-64 bg-blue-400/10 blur-[120px] rounded-full" />
      </div>

      <div className="relative max-w-6xl mx-auto px-4 py-6 md:py-10">
        <header className="bg-white/5 border border-white/10 rounded-3xl shadow-2xl shadow-blue-950/30 p-5 md:p-7 backdrop-blur-md">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-1">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-400 flex items-center gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-xl bg-gradient-to-br from-sky-500/70 to-indigo-500/70 text-white">
                  <Sparkles className="w-3.5 h-3.5" />
                </span>
                Factura AI · Touch UI
              </p>
              <h1 className="text-2xl md:text-3xl font-black text-white">Panel operativo</h1>
              <p className="text-sm text-slate-400 max-w-2xl">
                Captura, revisa y sincroniza inventario en un flujo pensado para móvil: gestos simples, tarjetas limpias y micro-sombras elegantes.
              </p>
              {currentCompany && (
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs text-slate-200 shadow-inner shadow-slate-900/30">
                  <ShieldCheck className="w-4 h-4 text-emerald-300" />
                  {currentCompany.name}
                </div>
              )}
            </div>

            <div className="flex items-center gap-2">
              <button className="p-2 relative text-slate-300 hover:text-white hover:bg-white/5 rounded-full transition">
                <Bell className="w-5 h-5" />
                <span className="absolute top-1.5 right-1.5 h-2 w-2 bg-emerald-400 rounded-full shadow-lg shadow-emerald-500/50" />
              </button>
              <div className="flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-3 py-2 shadow-inner shadow-slate-900/40">
                <div className="h-10 w-10 rounded-2xl bg-gradient-to-br from-sky-500 to-indigo-600 text-white font-bold flex items-center justify-center shadow-lg shadow-sky-900/50">
                  {user?.email?.[0]?.toUpperCase() || 'AI'}
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-white leading-none">{user?.email?.split('@')[0] || 'Usuario IA'}</p>
                  <p className="text-xs text-slate-400 leading-none">Modo rápido</p>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-5 grid gap-3 md:grid-cols-3">
            <button
              onClick={handleNewInvoice}
              className="group relative overflow-hidden rounded-2xl border border-sky-400/30 bg-gradient-to-r from-sky-500/30 via-sky-500/20 to-transparent px-4 py-4 text-left shadow-lg shadow-sky-900/40 hover:border-sky-300/50 transition"
            >
              <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition" />
              <p className="text-xs uppercase tracking-[0.2em] text-slate-200">Escanear</p>
              <div className="mt-1 flex items-center gap-2 text-lg font-semibold text-white">
                Nueva tanda IA <ArrowRight className="w-4 h-4 text-sky-200" />
              </div>
              <p className="text-sm text-slate-300 mt-1">Carga múltiple, plantillas inteligentes y revisión en una sola vista.</p>
            </button>

            <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-4 shadow-inner shadow-slate-900/40 flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-400">Cola de revisión</p>
                <p className="text-xl font-semibold text-white">{reviewQueue.length || 'Lista'}</p>
                <p className="text-[11px] text-slate-400">IA lista para confirmar</p>
              </div>
              <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-indigo-900/50">
                <Sparkles className="w-6 h-6" />
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-4 shadow-inner shadow-slate-900/40 flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-400">Modo seguro</p>
                <p className="text-xl font-semibold text-emerald-200">On</p>
                <p className="text-[11px] text-slate-400">Sube, revisa y confirma</p>
              </div>
              <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-emerald-950 shadow-lg shadow-emerald-900/50">
                <ShieldCheck className="w-6 h-6" />
              </div>
            </div>
          </div>
        </header>

        <nav className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-3">
          {navItems.map(item => {
            const Icon = item.icon;
            const active = currentView === item.id || (item.id === 'upload' && currentView === 'review');

            return (
              <button
                key={item.id}
                onClick={() => setCurrentView(item.id)}
                className={`relative overflow-hidden rounded-2xl border transition-all ${
                  active
                    ? 'border-white/40 bg-white/10 shadow-xl shadow-sky-900/40'
                    : 'border-white/10 bg-white/5 hover:border-white/20 hover:shadow-lg hover:shadow-slate-900/30'
                }`}
              >
                <div className={`absolute inset-0 bg-gradient-to-r ${item.accent} ${active ? 'opacity-25' : 'opacity-10'}`} />
                <div className="relative px-4 py-4 flex items-center gap-3">
                  <div className="h-11 w-11 rounded-2xl bg-white/10 flex items-center justify-center text-white shadow-inner shadow-slate-900/50">
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-semibold text-white">{item.label}</p>
                    <p className="text-[11px] text-slate-300">{item.hint}</p>
                  </div>
                  <ArrowRight className="w-4 h-4 text-slate-400 ml-auto" />
                </div>
              </button>
            );
          })}
        </nav>

        {reviewQueue.length > 0 && currentView !== 'review' && (
          <div className="mt-4 rounded-2xl border border-emerald-300/30 bg-emerald-500/10 px-4 py-3 flex items-center justify-between text-sm text-emerald-100 shadow-lg shadow-emerald-900/40">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4" />
              <span>{reviewQueue.length} factura(s) listas para confirmar</span>
            </div>
            <button
              onClick={() => setCurrentView('review')}
              className="px-3 py-1.5 rounded-xl bg-white/10 border border-white/20 text-xs font-semibold hover:bg-white/20 transition"
            >
              Abrir revisión
            </button>
          </div>
        )}

        <section className="mt-6">
          <div className="bg-white/5 border border-white/10 rounded-3xl shadow-2xl shadow-slate-900/50 p-4 md:p-6 backdrop-blur">
            <div className="animate-in fade-in duration-300">
              {currentView === 'dashboard' && (
                <Dashboard
                  onNewInvoice={handleNewInvoice}
                  onEditInvoice={handleEditInvoice}
                />
              )}

              {currentView === 'upload' && (
                <UploadProcessor
                  onAnalysisComplete={handleAnalysisComplete}
                  onCancel={() => setCurrentView('dashboard')}
                />
              )}

              {currentView === 'review' && reviewQueue.length > 0 && (
                <InvoiceReview
                  invoice={reviewQueue[currentReviewIndex]}
                  queueLength={reviewQueue.length}
                  currentIndex={currentReviewIndex}
                  onSave={handleSaveInvoice}
                  onSkip={handleSkipInvoice}
                  onCancel={handleCancelReview}
                />
              )}

              {currentView === 'inventory' && (
                <InventoryManager />
              )}

              {currentView === 'orders' && (
                <PurchaseOrderManager />
              )}
            </div>
          </div>
        </section>
      </div>

      <div className="fixed bottom-4 left-1/2 -translate-x-1/2 md:hidden z-20 w-full max-w-md px-4">
        <div className="rounded-2xl bg-slate-900/80 border border-white/10 shadow-2xl shadow-slate-900/70 backdrop-blur">
          <div className="grid grid-cols-4">
            {navItems.map(item => {
              const Icon = item.icon;
              const active = currentView === item.id || (item.id === 'upload' && currentView === 'review');
              return (
                <button
                  key={item.id}
                  onClick={() => setCurrentView(item.id)}
                  className={`flex flex-col items-center gap-1 py-3 text-xs ${active ? 'text-white' : 'text-slate-400'}`}
                >
                  <div className={`h-10 w-10 rounded-xl flex items-center justify-center ${active ? 'bg-white/10' : 'bg-white/5'}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  {item.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default App;
