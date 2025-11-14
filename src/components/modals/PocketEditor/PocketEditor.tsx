import { memo } from 'react';
import { PocketCreateWizard } from './Create/PocketCreateWizard';
import { PocketEditForm } from './Edit/PocketEditForm';
import { useAccountsLoader } from './hooks/useAccountsLoader';
import { PocketEditorProps } from './types';

function PocketEditor({ isOpen, onClose, onSuccess, mode, pocket }: PocketEditorProps) {
  const { accounts } = useAccountsLoader(isOpen);

  if (!isOpen) return null;

  if (mode === 'create') {
    return <PocketCreateWizard isOpen={isOpen} onClose={onClose} onSuccess={onSuccess} accounts={accounts} />;
  }

  if (mode === 'edit' && pocket) {
    return <PocketEditForm isOpen={isOpen} onClose={onClose} onSuccess={onSuccess} pocket={pocket} accounts={accounts} />;
  }

  return null;
}

export default memo(PocketEditor);
