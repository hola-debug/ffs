import { GlassField, GlassSelect } from '../../IOSModal';
import { PocketFieldsProps } from '../types';

const EMOJIS = ['💰', '🎯', '🛒', '🏖️', '🏠', '🚗', '🎮', '📚', '✈️', '🎉', '🍔', '⚡', '📱', '🎬', '🏋️'];

export function CommonFields({ state, setState, accounts }: PocketFieldsProps) {
  return (
    <div className="space-y-5">
      <GlassField
        label="Nombre"
        type="text"
        value={state.name}
        onChange={(e) => setState((prev) => ({ ...prev, name: e.target.value }))}
        required
        placeholder="Ej: Supermercado, Ahorro, Netflix..."
      />

      <div>
        <label className="ios-label">Emoji</label>
        <div className="flex flex-wrap gap-2">
          {EMOJIS.map((e) => (
            <button
              key={e}
              type="button"
              onClick={() => setState((prev) => ({ ...prev, emoji: e }))}
              className="text-2xl p-2 rounded transition-all"
              style={{
                background: state.emoji === e ? 'rgba(10, 132, 255, 0.9)' : 'rgba(120, 120, 128, 0.16)',
                border: state.emoji === e ? '2px solid rgba(10, 132, 255, 0.6)' : '1px solid rgba(255, 255, 255, 0.12)',
                transform: state.emoji === e ? 'scale(1.1)' : 'scale(1)',
                backdropFilter: 'blur(20px)',
                WebkitBackdropFilter: 'blur(20px)',
              }}
            >
              {e}
            </button>
          ))}
        </div>
      </div>

      <GlassSelect
        label="Cuenta"
        value={state.accountId}
        onChange={(e) => setState((prev) => ({ ...prev, accountId: e.target.value }))}
        required
      >
        <option value="">Selecciona una cuenta</option>
        {accounts.map((acc) => (
          <option key={acc.id} value={acc.id}>
            {acc.name}
          </option>
        ))}
      </GlassSelect>

      {(state.pocketType === 'expense' || state.pocketType === 'debt') && (
        <GlassSelect
          label="Cuenta de pago (opcional)"
          value={state.linkedAccountId}
          onChange={(e) => setState((prev) => ({ ...prev, linkedAccountId: e.target.value }))}
        >
          <option value="">No especificar</option>
          {accounts.map((acc) => (
            <option key={acc.id} value={acc.id}>
              {acc.name}
            </option>
          ))}
        </GlassSelect>
      )}
    </div>
  );
}
