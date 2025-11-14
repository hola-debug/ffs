import IOSModal from '@/components/IOSModal';
import { CommonFields } from '../fields/CommonFields';
import { SavingFields } from '../fields/subtypes/SavingFields';
import { ExpensePeriodFields } from '../fields/subtypes/ExpensePeriodFields';
import { ExpenseRecurrentFields } from '../fields/subtypes/ExpenseRecurrentFields';
import { ExpenseFixedFields } from '../fields/subtypes/ExpenseFixedFields';
import { DebtFields } from '../fields/subtypes/DebtFields';
import { useEditForm } from './hooks/useEditForm';
import { usePocketSubmit } from '../hooks/usePocketSubmit';
import { Pocket, Account } from '@/lib/types';

interface PocketEditFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  pocket: Pocket;
  accounts: Account[];
}

function getSubtypeFields(pocketType: string, pocketSubtype: string | null, state: any, setState: any) {
  if (pocketType === 'saving') return <SavingFields state={state} setState={setState} accounts={[]} />;
  if (pocketType === 'expense' && pocketSubtype === 'period') return <ExpensePeriodFields state={state} setState={setState} accounts={[]} />;
  if (pocketType === 'expense' && pocketSubtype === 'recurrent') return <ExpenseRecurrentFields state={state} setState={setState} accounts={[]} />;
  if (pocketType === 'expense' && pocketSubtype === 'fixed') return <ExpenseFixedFields state={state} setState={setState} accounts={[]} />;
  if (pocketType === 'debt') return <DebtFields state={state} setState={setState} accounts={[]} />;
  return null;
}

export function PocketEditForm({ isOpen, onClose, onSuccess, pocket, accounts }: PocketEditFormProps) {
  const { state, setState } = useEditForm(pocket);
  const { submit, loading, error } = usePocketSubmit();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const success = await submit(state, accounts, 'edit', pocket);
    if (success) {
      onSuccess?.();
      onClose();
    }
  };

  return (
    <IOSModal isOpen={isOpen} onClose={onClose} title={`Editar ${pocket?.name || 'Bolsa'}`}>
      <form onSubmit={handleSubmit} className="space-y-5">
        {error && <div className="mb-4 ios-error">{error}</div>}

        <CommonFields state={state} setState={setState} accounts={accounts} />
        {getSubtypeFields(state.pocketType, state.pocketSubtype, state, setState)}

        <div className="flex space-x-3 pt-4">
          <button type="button" onClick={onClose} className="flex-1 ios-button-secondary">
            Cancelar
          </button>
          <button type="submit" disabled={loading} className="flex-1 ios-button">
            {loading ? 'Guardando...' : 'Guardar'}
          </button>
        </div>
      </form>
    </IOSModal>
  );
}
