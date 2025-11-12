import { useState } from 'react';
import { Account, Category, Period } from '../lib/types';
import { Popover } from './ui/Popover';
import { ExpenseForm } from './expenses/ExpenseForm';

interface Props {
  accounts: Account[];
  categories: Category[];
  periods?: Period[];
  isRandom: boolean;
  trigger: React.ReactNode;
  onSuccess: () => void;
}

export default function AddExpensePopover({ 
  accounts, 
  categories, 
  periods = [],
  isRandom, 
  trigger,
  onSuccess 
}: Props) {
  const [open, setOpen] = useState(false);

  return (
    <Popover 
      trigger={trigger} 
      open={open} 
      onOpenChange={setOpen}
      side="bottom"
      align="center"
    >
      <div className="w-full">
        <ExpenseForm
          title="Agregar gasto"
          accounts={accounts}
          categories={categories}
          periods={periods}
          defaultIsRandom={isRandom}
          onCancel={() => setOpen(false)}
          onSuccess={() => {
            onSuccess();
            setOpen(false);
          }}
        />
      </div>
    </Popover>
  );
}
