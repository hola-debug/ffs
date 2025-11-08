import { useState } from 'react';
import { SavingsTotal } from '../../../lib/types';
import { BaseCard } from '../BaseCard';
import ManageSavingsModal from '../../ManageSavingsModal';

interface SavingsModuleProps {
  data: SavingsTotal[];
  onRefresh: () => void;
}

export function SavingsModule({ data, onRefresh }: SavingsModuleProps) {
  const [showModal, setShowModal] = useState(false);
  const totalGeneral = data.reduce((sum, s) => sum + s.total_saved, 0);

  return (
    <>
      <BaseCard variant="primary">
        <h2 className="text-sm font-semibold mb-4 uppercase tracking-wide">
          Ahorro Total
        </h2>

        <div className="text-2xl sm:text-6xl font-bold mb-1 sm:mb-4 break-all px-1">
          ${totalGeneral.toLocaleString('es-UY')}
        </div>

        <div className="space-y-1 sm:space-y-2 text-xs sm:text-sm mb-3 sm:mb-6">
          <div className="flex justify-between items-center border-b border-blue-700 pb-2">
            <span className="text-gray-400 uppercase text-xs">Moneda</span>
            <span className="text-gray-400 uppercase text-xs">Monto</span>
          </div>
          {data.map((s) => (
            <div key={s.currency} className="flex justify-between items-center">
              <span className="font-medium">{s.currency.toUpperCase()}</span>
              <span className="font-bold">${s.total_saved.toLocaleString('es-UY')}</span>
            </div>
          ))}
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="w-full py-3 bg-blue-600 hover:bg-blue-700 rounded-lg font-semibold uppercase tracking-wide transition-colors"
        >
          Gestionar
        </button>
      </BaseCard>

      {showModal && (
        <ManageSavingsModal
          onClose={() => setShowModal(false)}
          onSuccess={() => {
            onRefresh();
            setShowModal(false);
          }}
        />
      )}
    </>
  );
}
