import { useState, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import Header from '../components/Header';
import { useDashboardData } from '../hooks/useDashboardData';
import { useToast } from '../hooks/useToast';
import { ToastContainer } from '../components/ui/Toast';
import { useModuleSync } from '../hooks/useModuleSync';
import { moduleRegistry } from '../lib/moduleRegistry';
import FadeContent from '../components/ui/FadeContent';
import CircularGalleryWithModals from '../components/CircularGalleryWithModals';
import { useImagePreload } from '../hooks/useImagePreload';
import DynamicModal from '../components/DynamicModal';
import TotalBalance, { noiseBackgroundStyle } from '../components/TotalBalance';
import { useAccountsStore } from '../hooks/useAccountsStore';

export default function DashboardPage() {
  const navigate = useNavigate();
  const { loading, error, pockets, refetch } = useDashboardData();
  const { toasts, removeToast } = useToast();
  const { refetch: refetchAccounts } = useAccountsStore();
  const [activeModal, setActiveModal] = useState<string | null>(null);
  
  // Preload gallery images
  const galleryImages = useMemo(() => [
    '/AGGREGAR INGRESO.webp',
    '/AGRREGAR CUENTAS.webp',
    '/AYUDA.webp',
    '/CREAR BOLSAS.webp',
    '/NUEVO GASTO.webp'
  ], []);
  
  useImagePreload(galleryImages);
  
  // Sincronizar bolsas con módulos dinámicos
  useModuleSync(pockets);

  const registeredModules = useMemo(() => {
    return moduleRegistry
      .getAllModules()
      .slice()
      .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
  }, [pockets]);

  const handleCardClick = useCallback((modalId: string) => {
    setActiveModal(modalId);
  }, []);

  const handleModalClose = useCallback(() => {
    setActiveModal(null);
  }, []);

  const handleModalSuccess = useCallback(() => {
    setActiveModal(null);
    refetch();
    refetchAccounts();
  }, [refetch, refetchAccounts]);

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

      <div
        className="pointer-events-none fixed inset-0 -z-10 opacity-80"
        style={noiseBackgroundStyle}
        aria-hidden="true"
      />
      
      <div className="min-h-screen w-full overflow-x-hidden box-border pt-20">
        <div className="max-w-4xl mx-auto w-full">
          <div className="relative z-10">
            <FadeContent
              blur={true}
              duration={1000}
              easing="ease-out"
              initialOpacity={0}
              threshold={0.3}
              delay={0}
            >
              <div className="relative sm:h-[100px] md:h-[250px]">
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

            <div className="mt-10">
              <FadeContent
                blur={false}
                duration={700}
                easing="ease-out"
                initialOpacity={0}
                threshold={0.2}
                delay={150}
              >
                <TotalBalance showNoiseBackground={false} />
              </FadeContent>
            </div>
          </div>

          <DynamicModal
            activeModal={activeModal}
            onClose={handleModalClose}
            onSuccess={handleModalSuccess}
            pockets={pockets}
          />

          {registeredModules.length > 0 && (
            <div className="mt-10 space-y-6">
              <FadeContent
                blur={false}
                duration={700}
                easing="ease-out"
                initialOpacity={0}
                threshold={0.3}
                delay={200}
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between gap-4">
           
                  </div>
                  <div className="space-y-6">
                    {registeredModules.map((module, index) => {
                      const pocket = pockets.find(p => p.id === module.pocketId);
                      if (!pocket) return null;
                      const ModuleComponent = module.component;

                      return (
                        <FadeContent
                          key={module.id}
                          blur={false}
                          duration={600}
                          easing="ease-out"
                          initialOpacity={0}
                          threshold={0.3}
                          delay={250 + index * 60}
                        >
                          <ModuleComponent
                            pocket={pocket}
                            pockets={pockets}
                            onRefresh={refetch}
                          />
                        </FadeContent>
                      );
                    })}
                  </div>
                </div>
              </FadeContent>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
