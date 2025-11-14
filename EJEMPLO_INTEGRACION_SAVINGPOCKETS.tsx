/**
 * EJEMPLO PRÁCTICO: Cómo integrar PocketEditor en SavingPockets
 * 
 * Este archivo es un EJEMPLO. Cópialo y adáptalo a tu componente real.
 */

import { useState } from 'react';
import { BaseCard } from '../BaseCard';
import { useNavigate } from 'react-router-dom';
import PocketEditor from '../../modals/PocketEditor/PocketEditor';
import { Pocket } from '../../../lib/types';  // Ajusta la ruta según tu proyecto

interface SavingPocket {
  id: string;
  name: string;
  emoji: string;
  current_balance: number;
  target_amount?: number;
  progress_percentage: number;
  // ... otros campos del tipo Pocket
}

interface SavingPocketsModuleProps {
  pockets: SavingPocket[];
  onRefresh?: () => void;  // Función para recargar los datos
}

export function SavingPocketsModule({ pockets, onRefresh }: SavingPocketsModuleProps) {
  const navigate = useNavigate();

  // ========================
  // ESTADOS DEL EDITOR
  // ========================
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editorMode, setEditorMode] = useState<'create' | 'edit'>('create');
  const [selectedPocket, setSelectedPocket] = useState<Pocket | null>(null);

  // ========================
  // FUNCIONES
  // ========================

  /**
   * Abre el editor en modo "crear nueva bolsa"
   */
  const handleCreateNew = () => {
    setEditorMode('create');
    setSelectedPocket(null);
    setIsEditorOpen(true);
  };

  /**
   * Abre el editor en modo "editar bolsa existente"
   */
  const handleEditPocket = (pocket: SavingPocket) => {
    setEditorMode('edit');
    // ⚠️ NOTA: Asegúrate de que `pocket` tenga todos los campos de tipo `Pocket`
    // Si no los tiene, haz un mapeo antes:
    setSelectedPocket(pocket as unknown as Pocket);
    setIsEditorOpen(true);
  };

  /**
   * Se ejecuta después de crear/editar exitosamente
   * AQUÍ es donde recargas los datos
   */
  const handleEditorSuccess = () => {
    // Opción 1: Si tu componente padre pasa un callback
    if (onRefresh) {
      onRefresh();
    }

    // Opción 2: Si usas un hook personalizado en este componente
    // const { refetch } = usePockets();
    // refetch();

    // Opción 3: Si usas un estado local con useEffect
    // setNeedsRefresh(prev => !prev);
  };

  // ========================
  // RENDER
  // ========================

  if (pockets.length === 0) {
    return (
      <BaseCard className="col-span-2">
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <div className="text-5xl mb-3">🐷</div>
          <h3 className="text-lg font-bold text-white/90 mb-2">No hay bolsas de ahorro</h3>
          <p className="text-sm text-white/50 mb-4">Crea una bolsa para empezar a ahorrar</p>

          {/* ← BOTÓN CREAR NUEVA BOLSA */}
          <button
            onClick={handleCreateNew}
            className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium transition"
          >
            + Crear Primera Bolsa
          </button>
        </div>

        {/* ← MODAL DEL EDITOR (vacío pero necesario) */}
        <PocketEditor
          isOpen={isEditorOpen}
          onClose={() => setIsEditorOpen(false)}
          onSuccess={handleEditorSuccess}
          mode={editorMode}
          pocket={selectedPocket || undefined}
        />
      </BaseCard>
    );
  }

  return (
    <>
      <BaseCard className="col-span-2">
        <div className="space-y-3">
          {/* Header con botón crear */}
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center gap-2">
              <span className="text-2xl">🐷</span>
              <h3 className="text-lg font-bold text-white/90">Bolsas de Ahorro</h3>
            </div>

            {/* ← BOTÓN CREAR NUEVA BOLSA */}
            <button
              onClick={handleCreateNew}
              className="px-3 py-1.5 bg-blue-500 hover:bg-blue-600 text-white text-sm rounded-lg font-medium transition"
            >
              + Nueva
            </button>
          </div>

          {/* Grid de bolsas */}
          <div className="grid gap-3">
            {pockets.map((pocket) => {
              const isNearGoal = pocket.progress_percentage >= 80;
              const isMidway = pocket.progress_percentage >= 50 && pocket.progress_percentage < 80;

              return (
                <div
                  key={pocket.id}
                  onClick={() => navigate(`/app/pocket/${pocket.id}`)}
                  className="group relative bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/10 
                            hover:bg-white/8 hover:border-white/20 transition-all duration-300
                            hover:shadow-lg hover:shadow-black/20 cursor-pointer"
                >
                  {/* ← BOTÓN EDITAR (aparece al hacer hover) */}
                  <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();  // No navegar al detalle
                        handleEditPocket(pocket);
                      }}
                      className="px-2 py-1 bg-amber-500 hover:bg-amber-600 text-white text-xs rounded font-medium transition"
                      title="Editar esta bolsa"
                    >
                      ✏️ Editar
                    </button>
                  </div>

                  {/* Header */}
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">{pocket.emoji}</span>
                      <h4 className="font-bold text-white/90 text-base">{pocket.name}</h4>
                    </div>
                    <div
                      className={`
                        text-lg font-bold px-3 py-1 rounded-full
                        ${isNearGoal
                          ? 'bg-emerald-500/20 text-emerald-300'
                          : isMidway
                          ? 'bg-cyan-500/20 text-cyan-300'
                          : 'bg-blue-500/20 text-blue-300'
                        }
                      `}
                    >
                      {pocket.progress_percentage}%
                    </div>
                  </div>

                  {/* Amounts */}
                  <div className="flex justify-between items-baseline mb-3">
                    <div>
                      <div className="text-xs text-white/50 mb-0.5">Ahorrado</div>
                      <div className="text-2xl font-bold text-white">
                        ${pocket.current_balance.toLocaleString()}
                      </div>
                    </div>
                    {pocket.target_amount && (
                      <div className="text-right">
                        <div className="text-xs text-white/50 mb-0.5">Meta</div>
                        <div className="text-lg font-semibold text-blue-400">
                          ${pocket.target_amount.toLocaleString()}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Progress Bar */}
                  <div className="relative">
                    <div className="w-full bg-white/10 rounded-full h-2 overflow-hidden">
                      <div
                        className={`h-2 rounded-full transition-all duration-500 ease-out ${
                          isNearGoal
                            ? 'bg-gradient-to-r from-emerald-500 to-teal-500'
                            : isMidway
                            ? 'bg-gradient-to-r from-cyan-500 to-blue-500'
                            : 'bg-gradient-to-r from-blue-500 to-indigo-500'
                        }`}
                        style={{ width: `${Math.min(pocket.progress_percentage, 100)}%` }}
                      />
                    </div>

                    {pocket.target_amount && (
                      <div className="flex justify-between mt-1.5">
                        <span className="text-xs text-white/40">
                          ${(pocket.target_amount - pocket.current_balance).toLocaleString()} restantes
                        </span>
                        <span
                          className={`text-xs font-semibold ${
                            isNearGoal
                              ? 'text-emerald-400'
                              : isMidway
                              ? 'text-cyan-400'
                              : 'text-blue-400'
                          }`}
                        >
                          {pocket.progress_percentage >= 100 ? '¡Completado! 🎉' : `${pocket.progress_percentage}%`}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Celebration effect */}
                  {pocket.progress_percentage >= 100 && (
                    <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-emerald-500/10 to-teal-500/10 
                                  animate-pulse pointer-events-none" />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </BaseCard>

      {/* ← MODAL DEL POCKETEDITOR (al final del JSX) */}
      <PocketEditor
        isOpen={isEditorOpen}
        onClose={() => setIsEditorOpen(false)}
        onSuccess={handleEditorSuccess}
        mode={editorMode}
        pocket={selectedPocket || undefined}
      />
    </>
  );
}
