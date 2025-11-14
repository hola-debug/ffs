import { CommonFields } from '../../fields/CommonFields';
import { SavingFields } from '../../fields/subtypes/SavingFields';
import { ExpensePeriodFields } from '../../fields/subtypes/ExpensePeriodFields';
import { ExpenseRecurrentFields } from '../../fields/subtypes/ExpenseRecurrentFields';
import { ExpenseFixedFields } from '../../fields/subtypes/ExpenseFixedFields';
import { DebtFields } from '../../fields/subtypes/DebtFields';
import { PocketFormState, PocketFieldsProps } from '../../types';
import { Account } from '../../../../lib/types';

interface Step3Props extends PocketFieldsProps {
  onSubmit: () => void;
  onBack: () => void;
  onClose: () => void;
  loading: boolean;
  error: string | null;
}

function getSubtypeFields(state: PocketFormState, setState: React.Dispatch<React.SetStateAction<PocketFormState>>) {
  if (state.pocketType === 'saving') return <SavingFields state={state} setState={setState} accounts={[]} />;
  if (state.pocketType === 'expense' && state.pocketSubtype === 'period') return <ExpensePeriodFields state={state} setState={setState} accounts={[]} />;
  if (state.pocketType === 'expense' && state.pocketSubtype === 'recurrent') return <ExpenseRecurrentFields state={state} setState={setState} accounts={[]} />;
  if (state.pocketType === 'expense' && state.pocketSubtype === 'fixed') return <ExpenseFixedFields state={state} setState={setState} accounts={[]} />;
  if (state.pocketType === 'debt') return <DebtFields state={state} setState={setState} accounts={[]} />;
  return null;
}

export function Step3_Config({ state, setState, accounts, onSubmit, onBack, onClose, loading, error }: Step3Props) {
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit();
      }}
      className="space-y-5"
    >
      {error && <div className="mb-4 ios-error">{error}</div>}

      <CommonFields state={state} setState={setState} accounts={accounts} />
      {getSubtypeFields(state, setState)}

      <div className="flex space-x-3 pt-4">
        <button type="button" onClick={onBack} className="flex-1 ios-button-secondary">
          Atrás
        </button>
        <button type="button" onClick={onClose} className="flex-1 ios-button-secondary">
          Cancelar
        </button>
        <button type="submit" disabled={loading} className="flex-1 ios-button">
          {loading ? 'Creando...' : 'Crear'}
        </button>
      </div>
    </form>
  );
}
