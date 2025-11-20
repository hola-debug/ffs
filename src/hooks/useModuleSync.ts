import { useEffect } from 'react';
import { ActivePocketSummary } from '../lib/types';
import { moduleRegistry, RegisteredModule } from '../lib/moduleRegistry';
import PocketSummaryModule from '../components/modules/PocketSummaryModule';

/**
 * Hook que sincroniza las bolsas con el registro de módulos
 * Cuando una bolsa cambia o se crea, automáticamente:
 * - Registra un módulo si no existe
 * - Actualiza el módulo existente
 * - Elimina módulos para bolsas eliminadas
 */
export function useModuleSync(pockets: ActivePocketSummary[]) {
  useEffect(() => {
    // Crear un Set de IDs de módulos que deberían existir
    const expectedModuleIds = new Set<string>();

    pockets.forEach((pocket) => {
      const moduleId = `pocket-${pocket.id}`;
      expectedModuleIds.add(moduleId);

      const existingModule = moduleRegistry.getModule(moduleId);

      if (!existingModule) {
        // Crear nuevo módulo si no existe
        const newModule: RegisteredModule = {
          id: moduleId,
          pocketId: pocket.id,
          type: pocket.type,
          name: `${pocket.name} Module`,
          component: PocketSummaryModule,
          createdAt: new Date(),
        };

        moduleRegistry.registerModule(newModule);
        console.log(`[useModuleSync] Nuevo módulo registrado para bolsa: ${pocket.name}`);
      }
    });

    // Eliminar módulos para bolsas que ya no existen
    const registeredModules = moduleRegistry.getAllModules();
    registeredModules.forEach((module) => {
      if (!expectedModuleIds.has(module.id)) {
        moduleRegistry.unregisterModule(module.id);
        console.log(`[useModuleSync] Módulo eliminado: ${module.id}`);
      }
    });
  }, [pockets]);
}
