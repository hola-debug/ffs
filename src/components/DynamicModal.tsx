import { lazy, Suspense } from 'react';
import { ActivePocketSummary } from '@/lib/types';

// Lazy load modal components
const AddIncomeModal = lazy(() => import('@/components/modals/AddIncomeModal'));
const AddAccountModal = lazy(() => import('@/components/modals/AddAccountModal'));
const PocketEditor = lazy(() => import('@/components/modals/PocketEditor'));
const AddExpenseModal = lazy(() => import('@/components/modals/AddExpenseModal'));
const HelpModal = lazy(() => import('@/components/modals/HelpModal'));

interface DynamicModalProps {
  activeModal: string | null;
  onClose: () => void;
  onSuccess: () => void;
  pockets: ActivePocketSummary[];
}

/**
 * DynamicModal - Only renders the active modal, improving performance
 * Uses React.lazy for code splitting
 */
export default function DynamicModal({ activeModal, onClose, onSuccess, pockets }: DynamicModalProps) {
  if (!activeModal) return null;

  return (
    <Suspense fallback={null}>
      {activeModal === 'agregar-ingreso' && (
        <AddIncomeModal
          isOpen={true}
          onClose={onClose}
          onSuccess={onSuccess}
        />
      )}

      {activeModal === 'agregar-cuentas' && (
        <AddAccountModal
          isOpen={true}
          onClose={onClose}
          onSuccess={onSuccess}
        />
      )}

      {activeModal === 'crear-bolsas' && (
        <PocketEditor
          isOpen={true}
          mode="create"
          onClose={onClose}
          onSuccess={onSuccess}
        />
      )}

      {activeModal === 'nuevo-gasto' && (
        <AddExpenseModal
          isOpen={true}
          onClose={onClose}
          onSuccess={onSuccess}
          expensePockets={pockets.filter(p => p.type === 'expense')}
        />
      )}

      {activeModal === 'ayuda' && (
        <HelpModal
          isOpen={true}
          onClose={onClose}
        />
      )}
    </Suspense>
  );
}
