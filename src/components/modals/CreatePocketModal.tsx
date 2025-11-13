import { useState } from 'react';
import { supabase } from '../../lib/supabaseClient';
import IOSModal from '../IOSModal';
import { PocketType } from '../../lib/types';
import GlassField from '../ui/GlassField';

interface CreatePocketModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

const POCKET_TYPES: { value: PocketType; label: string; description: string }[] = [
  { value: 'expense', label: 'Gasto', description: 'Para gastos diarios con límite temporal' },
  { value: 'saving', label: 'Ahorro', description: 'Para ahorrar con objetivo específico' },
];

const EMOJIS = ['💰', '🎯', '🛒', '🏖️', '🏠', '🚗', '🎮', '📚', '✈️', '🎉'];

export default function CreatePocketModal({ isOpen, onClose, onSuccess }: CreatePocketModalProps) {
  const [name, setName] = useState('');
  const [type, setType] = useState<PocketType>('expense');
  const [emoji, setEmoji] = useState('💰');
  const [allocatedAmount, setAllocatedAmount] = useState('');
  const [targetAmount, setTargetAmount] = useState('');
  const [startsAt, setStartsAt] = useState(new Date().toISOString().split('T')[0]);
  const [endsAt, setEndsAt] = useState('');
  const [autoReturnRemaining, setAutoReturnRemaining] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuario no autenticado');

      // Validar fechas
      if (new Date(endsAt) <= new Date(startsAt)) {
        throw new Error('La fecha de fin debe ser posterior a la fecha de inicio');
      }

      const pocketData: any = {
        user_id: user.id,
        name,
        type,
        emoji,
        allocated_amount: parseFloat(allocatedAmount),
        current_balance: parseFloat(allocatedAmount), // Inicia con el monto asignado
        currency: 'ARS', // TODO: get from user profile or selection
        starts_at: startsAt,
        ends_at: endsAt,
        status: 'active',
        auto_return_remaining: autoReturnRemaining,
      };

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
      setType('expense');
      setEmoji('💰');
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
        <div>
          <label className="ios-label">Nombre</label>
          <GlassField>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              placeholder="Ej: Supermercado, Vacaciones..."
              className="glass-control"
            />
          </GlassField>
        </div>

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
                  border: type === pt.value ? '2px solid rgba(10, 132, 255, 0.6)' : '1px solid rgba(255, 255, 255, 0.12)',
                  background: type === pt.value ? 'rgba(10, 132, 255, 0.15)' : 'rgba(120, 120, 128, 0.16)',
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
                  checked={type === pt.value}
                  onChange={(e) => setType(e.target.value as PocketType)}
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
          <label className="ios-label">Emoji</label>
          <div className="flex flex-wrap gap-2">
            {EMOJIS.map((e) => (
              <button
                key={e}
                type="button"
                onClick={() => setEmoji(e)}
                className="text-2xl p-2 rounded transition-all"
                style={{
                  background: emoji === e ? 'rgba(10, 132, 255, 0.9)' : 'rgba(120, 120, 128, 0.16)',
                  border: emoji === e ? '2px solid rgba(10, 132, 255, 0.6)' : '1px solid rgba(255, 255, 255, 0.12)',
                  transform: emoji === e ? 'scale(1.1)' : 'scale(1)',
                  backdropFilter: 'blur(20px)',
                  WebkitBackdropFilter: 'blur(20px)',
                }}
              >
                {e}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="ios-label">Monto a asignar</label>
          <GlassField>
            <input
              type="number"
              step="0.01"
              value={allocatedAmount}
              onChange={(e) => setAllocatedAmount(e.target.value)}
              required
              placeholder="0.00"
              className="glass-control"
            />
          </GlassField>
        </div>

        {type === 'saving' && (
          <div>
            <label className="ios-label">Monto objetivo</label>
            <GlassField>
              <input
                type="number"
                step="0.01"
                value={targetAmount}
                onChange={(e) => setTargetAmount(e.target.value)}
                required={type === 'saving'}
                placeholder="0.00"
                className="glass-control"
              />
            </GlassField>
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="ios-label">Fecha inicio</label>
            <GlassField>
              <input
                type="date"
                value={startsAt}
                onChange={(e) => setStartsAt(e.target.value)}
                required
                className="glass-control"
              />
            </GlassField>
          </div>
          <div>
            <label className="ios-label">Fecha fin</label>
            <GlassField>
              <input
                type="date"
                value={endsAt}
                onChange={(e) => setEndsAt(e.target.value)}
                required
                className="glass-control"
              />
            </GlassField>
          </div>
        </div>

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
