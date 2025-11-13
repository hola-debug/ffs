import IOSModal from '../IOSModal';

interface HelpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function HelpModal({ isOpen, onClose }: HelpModalProps) {
  return (
    <IOSModal isOpen={isOpen} onClose={onClose} title="Ayuda">
      <div className="space-y-5 text-sm">
        <section>
          <h3 className="font-semibold text-lg mb-2" style={{ color: '#0A84FF' }}>¿Qué son las bolsas?</h3>
          <p className="mb-2" style={{ color: 'rgba(255, 255, 255, 0.8)' }}>
            Las bolsas son contenedores de dinero con un propósito y tiempo específico. 
            Hay dos tipos:
          </p>
          <ul className="list-disc list-inside space-y-1" style={{ color: 'rgba(255, 255, 255, 0.8)' }}>
            <li><strong className="text-white">Bolsas de Gasto:</strong> Para gestionar gastos diarios con un límite temporal</li>
            <li><strong className="text-white">Bolsas de Ahorro:</strong> Para alcanzar objetivos de ahorro específicos</li>
          </ul>
        </section>

        <section>
          <h3 className="font-semibold text-lg mb-2" style={{ color: '#0A84FF' }}>¿Cómo funciona?</h3>
          <ol className="list-decimal list-inside space-y-1" style={{ color: 'rgba(255, 255, 255, 0.8)' }}>
            <li>Agrega tus cuentas bancarias o billeteras</li>
            <li>Registra tus ingresos</li>
            <li>Crea bolsas para organizar tu dinero</li>
            <li>Registra gastos desde las bolsas</li>
          </ol>
        </section>

        <section>
          <h3 className="font-semibold text-lg mb-2" style={{ color: '#0A84FF' }}>Funciones principales</h3>
          <ul className="list-disc list-inside space-y-1" style={{ color: 'rgba(255, 255, 255, 0.8)' }}>
            <li><strong className="text-white">Agregar Ingreso:</strong> Registra tus entradas de dinero</li>
            <li><strong className="text-white">Agregar Cuentas:</strong> Gestiona tus cuentas bancarias y billeteras</li>
            <li><strong className="text-white">Crear Bolsas:</strong> Organiza tu dinero en bolsas con propósitos específicos</li>
            <li><strong className="text-white">Nuevo Gasto:</strong> Registra gastos desde tus bolsas activas</li>
          </ul>
        </section>

        <section>
          <h3 className="font-semibold text-lg mb-2" style={{ color: '#0A84FF' }}>Consejos</h3>
          <ul className="list-disc list-inside space-y-1" style={{ color: 'rgba(255, 255, 255, 0.8)' }}>
            <li>Crea bolsas con nombres descriptivos</li>
            <li>Define períodos realistas para tus bolsas</li>
            <li>Revisa regularmente tus gastos</li>
            <li>Usa emojis para identificar rápidamente tus bolsas</li>
          </ul>
        </section>

        <div className="pt-4" style={{ borderTop: '1px solid rgba(255, 255, 255, 0.1)' }}>
          <button
            onClick={onClose}
            className="w-full ios-button"
          >
            Entendido
          </button>
        </div>
      </div>
    </IOSModal>
  );
}
