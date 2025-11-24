import { useMemo, useRef, useState, useEffect } from 'react';
import type { WheelEvent } from 'react';
import { supabase } from '../../lib/supabaseClient';
import IOSModal, { GlassField } from '../IOSModal';
import { PocketType, PocketSubtype } from '../../lib/types';
import { PocketIcon, POCKET_ICON_OPTIONS } from '@/components/PocketIcon';

interface CreatePocketModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

// Extended type for UI selection
type UiPocketType = PocketType | 'fixed_expense';

const POCKET_TYPES: { value: UiPocketType; label: string; description: string }[] = [
  { value: 'expense', label: 'Gasto', description: 'Para gastos diarios con límite temporal' },
  { value: 'fixed_expense', label: 'Gastos Fijos', description: 'Para gastos recurrentes (Luz, Internet, Alquiler)' },
  { value: 'saving', label: 'Ahorro', description: 'Para ahorrar con objetivo específico' },
];

export default function CreatePocketModal({ isOpen, onClose, onSuccess }: CreatePocketModalProps) {
  const [name, setName] = useState('');
  const [uiType, setUiType] = useState<UiPocketType>('expense');
  const [emoji, setEmoji] = useState('wallet');
  const [allocatedAmount, setAllocatedAmount] = useState('');
  const [targetAmount, setTargetAmount] = useState('');
  const [startsAt, setStartsAt] = useState(new Date().toISOString().split('T')[0]);
  const [endsAt, setEndsAt] = useState('');
  const [autoReturnRemaining, setAutoReturnRemaining] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const iconOptionsLoop = useMemo(() => [...POCKET_ICON_OPTIONS, ...POCKET_ICON_OPTIONS, ...POCKET_ICON_OPTIONS], []);
  const iconScrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = iconScrollRef.current;
    if (el) {
      el.scrollLeft = el.scrollWidth / 3;
    }
  }, []);

  const handleIconWheel = (event: WheelEvent<HTMLDivElement>) => {
    if (!iconScrollRef.current) return;
    if (event.deltaY === 0) return;
    event.preventDefault();
    iconScrollRef.current.scrollLeft += event.deltaY;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuario no autenticado');

      // Validar fechas solo si no es fixed_expense (o si se requiere)
      if (uiType !== 'fixed_expense' && endsAt && new Date(endsAt) <= new Date(startsAt)) {
        throw new Error('La fecha de fin debe ser posterior a la fecha de inicio');
      }

      let type: PocketType = 'expense';
      let subtype: PocketSubtype = null;

      if (uiType === 'fixed_expense') {
        type = 'expense';
        subtype = 'fixed';
      } else {
        type = uiType as PocketType;
        if (type === 'expense') subtype = 'period'; // Default subtype for generic expense
      }

      const pocketData: any = {
        user_id: user.id,
        name,
        type,
        subtype,
        emoji,
        currency: 'ARS', // TODO: get from user profile or selection
        starts_at: startsAt,
        status: 'active',
      };

      if (uiType === 'fixed_expense') {
        // Fixed expenses don't have allocated amount initially (sum of items)
        pocketData.monthly_amount = 0;
        pocketData.auto_register = false; // Default
      } else {
        pocketData.allocated_amount = parseFloat(allocatedAmount) || 0;
        pocketData.current_balance = parseFloat(allocatedAmount) || 0;
        pocketData.ends_at = endsAt;
        pocketData.auto_return_remaining = autoReturnRemaining;
      }

      // Solo agregar target_amount para bolsas de ahorro
      if (type === 'saving') {
        if (!targetAmount) {
          throw new Error('Debes especificar un monto objetivo para bolsas de ahorro');
        }
        pocketData.target_amount = parseFloat(targetAmount);
      }

      const { error: insertError } = await supabase
        .from('pockets')
        .insert(pocketData);

      if (insertError) throw insertError;

      // Reset form
      setName('');
      setUiType('expense');
      setEmoji('wallet');
      setAllocatedAmount('');
      setTargetAmount('');
      setStartsAt(new Date().toISOString().split('T')[0]);
      setEndsAt('');
      setAutoReturnRemaining(true);

      onSuccess?.();
      onClose();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <IOSModal isOpen={isOpen} onClose={onClose} title="Crear Bolsa">
      {error && (
        <div className="mb-4 ios-error">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        <GlassField
          label="Nombre"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          placeholder="Ej: Supermercado, Vacaciones..."
        />

        <div>
          <label className="ios-label">Tipo de bolsa</label>
          <div className="space-y-2">
            {POCKET_TYPES.map((pt) => (
              <label
                key={pt.value}
                style={{
                  display: 'flex',
                  alignItems: 'start',
                  padding: '12px',
                  borderRadius: '12px',
                  border: uiType === pt.value ? '2px solid rgba(10, 132, 255, 0.6)' : '1px solid rgba(255, 255, 255, 0.12)',
                  background: uiType === pt.value ? 'rgba(10, 132, 255, 0.15)' : 'rgba(120, 120, 128, 0.16)',
                  cursor: 'pointer',
                  transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                  backdropFilter: 'blur(20px)',
                  WebkitBackdropFilter: 'blur(20px)',
                }}
              >
                <input
                  type="radio"
                  name="type"
                  value={pt.value}
                  checked={uiType === pt.value}
                  onChange={(e) => setUiType(e.target.value as UiPocketType)}
                  className="mt-1 mr-3"
                  style={{ accentColor: '#0A84FF' }}
                />
                <div>
                  <div className="font-medium text-white">{pt.label}</div>
                  <div className="text-sm" style={{ color: 'rgba(255, 255, 255, 0.6)' }}>{pt.description}</div>
                </div>
              </label>
            ))}
          </div>
        </div>

        <div>
          <label className="ios-label">Icono</label>
          <div
            ref={iconScrollRef}
            className="relative mt-2 overflow-x-auto overflow-y-hidden scrollbar-hide rounded-[22px] border border-white/10 bg-black/25"
            onWheel={handleIconWheel}
          >
            <div className="flex gap-2 min-w-max py-2 px-1">
              {iconOptionsLoop.map((option, index) => {
                const key = `${option.id}-${index}`;
                const isSelected = emoji === option.id;
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setEmoji(option.id)}
                    className={`flex flex-col items-center gap-1 rounded-2xl border px-3 py-2 min-w-[84px] shrink-0 transition-all ${isSelected
                        ? 'border-[#67F690] bg-black/70 text-white shadow-[0_12px_30px_rgba(0,0,0,0.55)]'
                        : 'border-white/12 bg-black/30 text-white/70 hover:border-white/30'
                      }`}
                  >
                    <PocketIcon iconId={option.id} className="w-5 h-5" />
                    <span className="text-[9px] text-center font-roboto tracking-[0.08em] leading-tight">{option.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {uiType !== 'fixed_expense' && (
          <GlassField
            label="Monto a asignar"
            type="number"
            step="0.01"
            value={allocatedAmount}
            onChange={(e) => setAllocatedAmount(e.target.value)}
            required
            placeholder="0.00"
          />
        )}

        {uiType === 'saving' && (
          <GlassField
            label="Monto objetivo"
            type="number"
            step="0.01"
            value={targetAmount}
            onChange={(e) => setTargetAmount(e.target.value)}
            required={uiType === 'saving'}
            placeholder="0.00"
          />
        )}

        <div className="grid grid-cols-2 gap-4">
          <GlassField
            label="Fecha inicio"
            type="date"
            value={startsAt}
            onChange={(e) => setStartsAt(e.target.value)}
            required
          />
          {uiType !== 'fixed_expense' && (
            <GlassField
              label="Fecha fin"
              type="date"
              value={endsAt}
              onChange={(e) => setEndsAt(e.target.value)}
              required
            />
          )}
        </div>

        {uiType !== 'fixed_expense' && (
          <div className="flex items-center space-x-3">
            <input
              type="checkbox"
              id="autoReturn"
              checked={autoReturnRemaining}
              onChange={(e) => setAutoReturnRemaining(e.target.checked)}
              className="w-5 h-5 rounded"
              style={{ accentColor: '#0A84FF' }}
            />
            <label htmlFor="autoReturn" className="ios-label" style={{ marginBottom: 0 }}>
              Devolver saldo restante automáticamente al finalizar
            </label>
          </div>
        )}

        <div className="flex space-x-3 pt-4">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 ios-button-secondary"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={loading}
            className="flex-1 ios-button"
          >
            {loading ? 'Creando...' : 'Crear'}
          </button>
        </div>
      </form>
    </IOSModal>
  );
}
