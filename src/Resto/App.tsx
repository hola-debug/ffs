
import React, { useState } from 'react';
import Dashboard from './components/Dashboard';
import UploadProcessor from './components/UploadProcessor';
import InvoiceReview from './components/InvoiceReview';
import PriceListManager from './components/PriceListManager';
import InventoryManager from './components/InventoryManager';
import PurchaseOrderManager from './components/PurchaseOrderManager';
import RestaurantSetup from './components/RestaurantSetup';
import { Invoice, AppView } from './types';
import { restoService } from '../services/restoService';
import { storageService } from '../services/storageService';
import { LayoutDashboard, Receipt, Settings, Bell, Package, ClipboardList } from 'lucide-react';

import { RestoProvider, useResto } from './contexts/RestoContext';
import { useSupabaseUser } from '../hooks/useSupabaseUser';

const App: React.FC = () => {
  // ... existing state ...

  return (
    <RestoProvider>
      <RestoAppContent />
    </RestoProvider>
  );
};

const RestoAppContent: React.FC = () => {
  const { currentRestaurant, restaurants, loading } = useResto();
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
    if (!currentRestaurant || !user) return;

    try {
      let filePath = '';
      if (invoice.originalImage) {
        const blob = base64ToBlob(invoice.originalImage);
        const file = new File([blob], `invoice-${invoice.id}.jpg`, { type: 'image/jpeg' });
        filePath = await storageService.uploadInvoice(user.id, invoice.id, file);
      }

      await restoService.createInvoice(currentRestaurant.id, invoice.total, filePath);

      // Move to next in queue
      if (currentReviewIndex < reviewQueue.length - 1) {
        setCurrentReviewIndex(prev => prev + 1);
      } else {
        // Done with queue
        setReviewQueue([]);
        setCurrentView('dashboard');
      }
    } catch (error) {
      console.error('Error saving invoice:', error);
      alert('Error al guardar la factura');
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
  if (!loading && restaurants.length === 0) {
    return <RestaurantSetup />;
  }

  return (
    <div className="resto-app min-h-screen bg-slate-100 text-slate-800 font-sans">
      {/* Sidebar */}
      <aside className="fixed top-0 left-0 w-64 h-full bg-slate-900 text-white hidden md:flex flex-col z-10">
        <div className="p-6">
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <span className="text-blue-500">Factura</span>AI
          </h1>
        </div>

        <nav className="flex-1 px-4 space-y-2 mt-4">
          <button
            onClick={() => setCurrentView('dashboard')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition ${currentView === 'dashboard' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:bg-slate-800'}`}
          >
            <LayoutDashboard className="w-5 h-5" />
            Dashboard
          </button>
          <button
            onClick={() => setCurrentView('upload')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition ${currentView === 'upload' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:bg-slate-800'}`}
          >
            <Receipt className="w-5 h-5" />
            Escanear (Batch)
          </button>
          <button
            onClick={() => setCurrentView('prices')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition ${currentView === 'prices' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:bg-slate-800'}`}
          >
            <Settings className="w-5 h-5" />
            Configuración
          </button>

          <div className="pt-4 mt-4 border-t border-slate-800">
            <p className="px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Operativo</p>
            <button
              onClick={() => setCurrentView('inventory')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition ${currentView === 'inventory' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:bg-slate-800'}`}
            >
              <Package className="w-5 h-5" /> Inventario
            </button>
            <button
              onClick={() => setCurrentView('orders')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition ${currentView === 'orders' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:bg-slate-800'}`}
            >
              <ClipboardList className="w-5 h-5" /> Órdenes Compra
            </button>
          </div>
        </nav>

        <div className="p-6 border-t border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-blue-500 to-indigo-500 flex items-center justify-center font-bold">
              JS
            </div>
            <div>
              <p className="text-sm font-medium">Juan Sistema</p>
              <p className="text-xs text-slate-400">Admin</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="md:ml-64 p-4 md:p-8 min-h-screen transition-all">
        {/* Mobile Header */}
        <div className="md:hidden flex justify-between items-center mb-6 bg-white p-4 rounded-lg shadow-sm">
          <h1 className="font-bold text-lg">FacturaAI</h1>
          <div className="flex gap-4">
            <button onClick={() => setCurrentView('dashboard')}><LayoutDashboard className="w-6 h-6" /></button>
            <button onClick={() => setCurrentView('inventory')}><Package className="w-6 h-6" /></button>
          </div>
        </div>

        {/* Top Bar Desktop */}
        <div className="hidden md:flex justify-between items-center mb-8">
          <h2 className="text-2xl font-bold text-slate-800">
            {currentView === 'dashboard' && 'Resumen General'}
            {currentView === 'upload' && 'Nueva Carga de Facturas'}
            {currentView === 'review' && 'Revisión de Facturas'}
            {currentView === 'prices' && 'Configuración de Precios'}
            {currentView === 'inventory' && 'Gestión de Inventario'}
            {currentView === 'orders' && 'Órdenes de Compra'}
          </h2>
          <div className="flex items-center gap-4">
            <button className="p-2 relative text-slate-500 hover:bg-white rounded-full transition">
              <Bell className="w-5 h-5" />
              <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full"></span>
            </button>
          </div>
        </div>

        {/* Dynamic View Content */}
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

          {currentView === 'prices' && (
            <PriceListManager />
          )}

          {currentView === 'inventory' && (
            <InventoryManager />
          )}

          {currentView === 'orders' && (
            <PurchaseOrderManager />
          )}
        </div>
      </main>
    </div>
  );
};

export default App;
