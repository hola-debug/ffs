import { useState } from 'react';
import { SavingsTotal } from '../lib/types';
import ManageSavingsModal from './ManageSavingsModal';

interface Props {
  data: SavingsTotal[];
  onRefresh: () => void;
}

export default function SavingsCard({ data, onRefresh }: Props) {
  const [showModal, setShowModal] = useState(false);

  const totalGeneral = data.reduce((sum, s) => sum + s.total_saved, 0);

  return (
    <>
      <div className="bg-gray-900 rounded-lg p-6 shadow-lg">
        <h2 className="text-lg font-semibold mb-4">Ahorro total</h2>
        <div className="text-4xl font-bold mb-4">
          ${totalGeneral.toLocaleString('es-UY')}
        </div>
        <div className="space-y-1 text-sm text-gray-300 mb-4">
          {data.map((s) => (
            <p key={s.currency}>
              {s.currency}: ${s.total_saved.toLocaleString('es-UY')}
            </p>
          ))}
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="w-full py-2 bg-purple-600 hover:bg-purple-700 rounded font-medium"
        >
          Gestionar
        </button>
      </div>

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
