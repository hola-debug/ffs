
import React, { useState } from 'react';
import Dashboard from './components/Dashboard';
import UploadProcessor from './components/UploadProcessor';
import InvoiceReview from './components/InvoiceReview';
import InventoryManager from './components/InventoryManager';
import CompanySetup from './components/CompanySetup';
import { Invoice, AppView } from './types';
import { invoiceService } from '../services/invoiceService';
import { storageService } from '../services/storageService';
import { ArrowRight } from 'lucide-react';
import logo from '../assets/logo.svg';

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

  const handleOpenInventory = () => {
    setCurrentView('inventory');
  };

  const handleBackToInvoices = () => {
    setCurrentView('dashboard');
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



  return (
    <div className="min-h-screen bg-black text-slate-50 relative">
      {/* Subtle Background Gradient */}
      <div className="fixed inset-0 bg-gradient-radial from-violet-950/20 via-black to-black pointer-events-none" />

      {/* Logo */}
      <div className="fixed top-4 left-4 z-50 animate-fade-in">
        <img src={logo} alt="FFS.finance" className="h-6 md:h-8 opacity-90 hover:opacity-100 transition-opacity" />
      </div>

      {/* Floating Profile Button */}
      <div className="fixed top-4 right-4 z-50">
        <button className="h-12 w-12 rounded-full bg-gradient-to-br from-violet-500 via-fuchsia-500 to-cyan-500 text-white font-bold flex items-center justify-center shadow-lg shadow-violet-500/30 hover:shadow-xl hover:shadow-violet-500/50 hover:scale-105 transition-all duration-300">
          {user?.email?.[0]?.toUpperCase() || 'AI'}
        </button>
      </div>

      <div className="relative w-full">
        <section className="w-full">
          <div className="w-full">
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

            {currentView === 'dashboard' && (
              <Dashboard
                onNewInvoice={handleNewInvoice}
                onEditInvoice={handleEditInvoice}
                onOpenInventory={handleOpenInventory}
              />
            )}

            {currentView === 'inventory' && (
              <InventoryManager onBack={handleBackToInvoices} />
            )}
          </div>
        </section>
      </div>

      {/* Floating Review Button */}
      {reviewQueue.length > 0 && currentView === 'upload' && (
        <button
          onClick={() => setCurrentView('review')}
          className="fixed bottom-6 right-6 z-40 flex items-center gap-2 bg-gradient-to-r from-violet-500 via-fuchsia-500 to-cyan-500 text-white px-6 py-3 rounded-full shadow-2xl shadow-violet-500/50 hover:shadow-violet-500/70 hover:scale-105 transition-all duration-300 font-semibold"
        >
          Revisar ({reviewQueue.length})
          <ArrowRight className="w-4 h-4" />
        </button>
      )}
    </div>
  );
};

export default App;
