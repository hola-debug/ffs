import IOSModal from '../../../IOSModal';
import { Step1_Type } from './steps/Step1_Type';
import { Step2_Subtype } from './steps/Step2_Subtype';
import { Step3_Config } from './steps/Step3_Config';
import { useCreateWizard } from './hooks/useCreateWizard';
import { usePocketSubmit } from '../../hooks/usePocketSubmit';
import { useAccountsLoader } from '../../hooks/useAccountsLoader';
import { Account } from '../../../../lib/types';

interface PocketCreateWizardProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  accounts: Account[];
}

export function PocketCreateWizard({ isOpen, onClose, onSuccess, accounts }: PocketCreateWizardProps) {
  const { step, state, setState, nextStep, prevStep, reset } = useCreateWizard();
  const { submit, loading, error, setError } = usePocketSubmit();

  const handleClose = () => {
    reset();
    onClose();
  };

  const handleSubmit = async () => {
    const success = await submit(state, accounts, 'create');
    if (success) {
      reset();
      onSuccess?.();
      onClose();
    }
  };

  return (
    <IOSModal isOpen={isOpen} onClose={handleClose} title="Nueva Bolsa">
      {step === 'type' && (
        <Step1_Type
          state={state}
          setState={setState}
          onNext={nextStep}
          onClose={handleClose}
        />
      )}

      {step === 'subtype' && state.pocketType === 'expense' && (
        <Step2_Subtype
          state={state}
          setState={setState}
          onNext={nextStep}
          onBack={prevStep}
          onClose={handleClose}
        />
      )}

      {step === 'config' && (
        <Step3_Config
          state={state}
          setState={setState}
          accounts={accounts}
          onSubmit={handleSubmit}
          onBack={prevStep}
          onClose={handleClose}
          loading={loading}
          error={error}
        />
      )}
    </IOSModal>
  );
}
