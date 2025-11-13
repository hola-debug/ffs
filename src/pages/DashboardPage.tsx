import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import Header from '../components/Header';
import { useDashboardData } from '../hooks/useDashboardData';
import { PocketProjectionModule, AIInputModule } from '../components/modules';
import { useToast } from '../hooks/useToast';
import { ToastContainer } from '../components/ui/Toast';
import { useModuleSync } from '../hooks/useModuleSync';
import { moduleRegistry } from '../lib/moduleRegistry';
import FadeContent from '../components/ui/FadeContent';
import CircularGalleryWithModals from '../components/CircularGalleryWithModals';
import {
  AddIncomeModal,
  AddAccountModal,
  CreatePocketModal,
  AddExpenseModal,
  HelpModal
} from '../components/modals';

export default function DashboardPage() {
  const navigate = useNavigate();
  const { loading, error, pockets, refetch } = useDashboardData();
  const { toasts, removeToast, showToasts } = useToast();
  const [activeModal, setActiveModal] = useState<string | null>(null);
  
  // Sincronizar bolsas con módulos dinámicos
  useModuleSync(pockets);

  const handleCardClick = useCallback((modalId: string) => {
    setActiveModal(modalId);
  }, []);

  const handleModalClose = useCallback(() => {
    setActiveModal(null);
  }, []);

  const handleModalSuccess = useCallback(() => {
    setActiveModal(null);
    refetch();
  }, [refetch]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/login');
  };

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-red-400">Error: {error}</div>
      </div>
    );
  }

  if (loading) {
    return (
      <>
        <Header />
        <div className="min-h-screen bg-[#D5D5D5] w-full overflow-x-hidden box-border " />
      </>
    );
  }

  return (
    <>
      <Header />
      <ToastContainer toasts={toasts} onRemove={removeToast} />
      
      <div className="min-h-screen bg-[#D5D5D5] w-full overflow-x-hidden box-border pt-20 " >
        <div className="max-w-4xl mx-auto w-full ">
          {/* Galería Circular de Formularios */}
          <div className="">
            <FadeContent
              blur={true}
              duration={1000}
              easing="ease-out"
              initialOpacity={0}
              threshold={0.3}
              delay={0}
            >
              <div className=" relative sm:h-[100px] md:h-[250px] ">
                <CircularGalleryWithModals 
                  bend={-0.5} 
                  textColor="#333333" 
                  borderRadius={0.05} 
                  scrollEase={0.02} 
                  scrollSpeed={10}
                  onCardClick={handleCardClick}
                />
              </div>
            </FadeContent>
          </div>

  

          {/* Módulos Dinámicos Registrados - uno por fila completa */}
          <div className="space-y-1">
            {moduleRegistry.getAllModules().map((module, index) => {
              const pocket = pockets.find(p => p.id === module.pocketId);
              if (!pocket) return null;
              
              const Component = module.component;
              return (
                <div key={module.id} className="w-full">
                  <FadeContent
                    blur={false}
                    duration={600}
                    easing="ease-out"
                    initialOpacity={0}
                    threshold={0.3}
                    delay={100 + (index * 80)}
                  >
                    <Component pocket={pocket} onRefresh={refetch} />
                  </FadeContent>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Modales a nivel raíz - pantalla completa */}
      <AddIncomeModal
        isOpen={activeModal === 'agregar-ingreso'}
        onClose={handleModalClose}
        onSuccess={handleModalSuccess}
      />
      
      <AddAccountModal
        isOpen={activeModal === 'agregar-cuentas'}
        onClose={handleModalClose}
        onSuccess={handleModalSuccess}
      />
      
      <CreatePocketModal
        isOpen={activeModal === 'crear-bolsas'}
        onClose={handleModalClose}
        onSuccess={handleModalSuccess}
      />
      
      <AddExpenseModal
        isOpen={activeModal === 'nuevo-gasto'}
        onClose={handleModalClose}
        onSuccess={handleModalSuccess}
      />
      
      <HelpModal
        isOpen={activeModal === 'ayuda'}
        onClose={handleModalClose}
      />
    </>
  );
}
