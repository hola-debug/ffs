import { useState } from 'react';
import { supabase } from '../../../lib/supabaseClient';
import { 
  Popover, 
  PopoverTitle, 
  PopoverSection, 
  PopoverOption, 
  PopoverInput, 
  PopoverActions, 
  PopoverButton 
} from '../../ui/Popover';
import { Cog6ToothIcon } from '@heroicons/react/24/outline';

interface DailyLimitModalProps {
  currentLimit: number | null;
  autoCalculatedLimit: number;
  onSuccess: () => void;
}

export function DailyLimitModal({ 
  currentLimit, 
  autoCalculatedLimit,
  onSuccess 
}: DailyLimitModalProps) {
  const [open, setOpen] = useState(false);
  const [limit, setLimit] = useState(currentLimit?.toString() ?? '');
  const [useManual, setUseManual] = useState(currentLimit !== null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSave = async () => {
    try {
      setSaving(true);
      setError(null);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No autenticado');

      const now = new Date();
      const month = now.getMonth() + 1;
      const year = now.getFullYear();

      const dailyLimit = useManual && limit ? parseFloat(limit) : null;

      // Insertar o actualizar el límite
      const { error: upsertError } = await supabase
        .from('monthly_plan')
        .upsert({
          user_id: user.id,
          month,
          year,
          daily_spendable_limit: dailyLimit,
        }, {
          onConflict: 'user_id,month,year'
        });

      if (upsertError) throw upsertError;

      onSuccess();
      setOpen(false);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Popover
      open={open}
      onOpenChange={setOpen}
      trigger={
        <button
          className="p-1 rounded"
          title="Configurar saldo diario"
          onClick={() => setOpen((v) => !v)}
        >
          <Cog6ToothIcon className="w-5 h-5  hover:text-white" />
        </button>
      }
    >
      
      <PopoverSection>
        <PopoverOption
          selected={!useManual}
          onClick={() => setUseManual(false)}
          title="Automático"
          description="Calcula dividiendo entre días del mes"
          badge={`$${Math.round(autoCalculatedLimit).toLocaleString('es-UY')}`}
        />
        
        <PopoverOption
          selected={useManual}
          onClick={() => setUseManual(true)}
          title="Manual"
          description="Define un límite fijo por día"
        />
      </PopoverSection>

      {useManual && (
        <div className="mt-3">
          <PopoverInput
            type="number"
            value={limit}
            onChange={(e) => setLimit(e.target.value)}
            placeholder="Ej: 500"
            min="0"
            step="0.01"
            label="Límite diario"
          />
        </div>
      )}

 

      <PopoverActions>
        <PopoverButton
          variant="secondary"
          onClick={() => setOpen(false)}
          disabled={saving}
        >
          Cancelar
        </PopoverButton>
        <PopoverButton
          variant="primary"
          onClick={handleSave}
          disabled={saving || (useManual && !limit)}
        >
          {saving ? '...' : 'Guardar'}
        </PopoverButton>
      </PopoverActions>
    </Popover>
  );
}
