import { useState, useCallback, useMemo, useEffect } from 'react';
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
import TotalBalance from '../components/TotalBalance';
import { useAccountsStore } from '../hooks/useAccountsStore';
import { PocketProjectionModule } from '../components/modules/PocketProjection';
import { DndContext, closestCenter, DragEndEvent, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { SortableModuleItem } from '../components/SortableModuleItem';
import { useModuleOrder } from '../hooks/useModuleOrder';

export default function DashboardPage() {
  const navigate = useNavigate();
  const { loading, error, pockets, refetch } = useDashboardData();
  const { toasts, removeToast } = useToast();
  const { refetch: refetchAccounts } = useAccountsStore();
  const [activeModal, setActiveModal] = useState<string | null>(null);
  const [moduleUpdateTrigger, setModuleUpdateTrigger] = useState(0);

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

  // Force re-render when pockets change to ensure modules are registered
  useEffect(() => {
    if (pockets.length > 0) {
      // Small delay to ensure useModuleSync has completed
      const timer = setTimeout(() => {
        setModuleUpdateTrigger(prev => prev + 1);
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [pockets]);

  const registeredModules = useMemo(() => {
    return moduleRegistry
      .getAllModules()
      .slice()
      .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
  }, [pockets, moduleUpdateTrigger]);

  // Get module IDs for ordering
  const moduleIds = useMemo(() => registeredModules.map(m => m.id), [registeredModules]);

  // Module ordering hook
  const { orderedIds, handleReorder } = useModuleOrder(moduleIds);

  // Order modules according to user preference
  const orderedModules = useMemo(() => {
    if (orderedIds.length === 0) return registeredModules;

    return orderedIds
      .map(id => registeredModules.find(m => m.id === id))
      .filter(Boolean) as typeof registeredModules;
  }, [registeredModules, orderedIds]);

  // DnD sensors - optimized for both desktop and mobile
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 10, // Require 10px of movement before drag starts (prevents accidental drags)
        delay: 100, // Small delay to distinguish between click and drag
        tolerance: 5, // Tolerance for movement during delay
      },
    })
  );

  // Handle drag end
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      handleReorder(active.id as string, over.id as string);
    }
  };

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

      <div className="min-h-screen w-full overflow-x-hidden box-border pt-20 px-1">
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
                  bend={-0.1}
                  borderRadius={0.1}
                  scrollEase={0.002}
                  scrollSpeed={20}
                  onCardClick={handleCardClick}

                />
              </div>
            </FadeContent>

            <div className="">
              <FadeContent
                blur={false}
                duration={700}
                easing="ease-out"
                initialOpacity={0}
                threshold={0.2}
                delay={150}
              >
                <TotalBalance showNoiseBackground={true} />
              </FadeContent>
            </div>
          </div>

          <DynamicModal
            activeModal={activeModal}
            onClose={handleModalClose}
            onSuccess={handleModalSuccess}
            pockets={pockets}
          />

          {orderedModules.length > 0 && (
            <div className="space-y-1 pb-1">
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
                  <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragEnd={handleDragEnd}
                  >
                    <SortableContext
                      items={orderedModules.map(m => m.id)}
                      strategy={verticalListSortingStrategy}
                    >
                      <div className="space-y-2">
                        {orderedModules.map((module, index) => {
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
                              <SortableModuleItem id={module.id}>
                                <ModuleComponent
                                  pocket={pocket}
                                  pockets={pockets}
                                  onRefresh={refetch}
                                />
                              </SortableModuleItem>
                            </FadeContent>
                          );
                        })}
                      </div>
                    </SortableContext>
                  </DndContext>
                </div>
              </FadeContent>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
