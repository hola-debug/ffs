import { lazy, Suspense } from 'react';

// Lazy load modal components
const AddIncomeModal = lazy(() => import('./modals/AddIncomeModal'));
const AddAccountModal = lazy(() => import('./modals/AddAccountModal'));
const CreatePocketModal = lazy(() => import('./modals/CreatePocketModal'));
const AddExpenseModal = lazy(() => import('./modals/AddExpenseModal'));
const HelpModal = lazy(() => import('./modals/HelpModal'));

interface DynamicModalProps {
  activeModal: string | null;
  onClose: () => void;
  onSuccess: () => void;
}

/**
 * DynamicModal - Only renders the active modal, improving performance
 * Uses React.lazy for code splitting
 */
export default function DynamicModal({ activeModal, onClose, onSuccess }: DynamicModalProps) {
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
        <CreatePocketModal
          isOpen={true}
          onClose={onClose}
          onSuccess={onSuccess}
        />
      )}
      
      {activeModal === 'nuevo-gasto' && (
        <AddExpenseModal
          isOpen={true}
          onClose={onClose}
          onSuccess={onSuccess}
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
