import { ActivePocketSummary } from './types';

export interface RegisteredModule {
  id: string;
  pocketId: string;
  type: 'expense' | 'saving' | 'debt';
  name: string;
  // El componente debe aceptar al menos la prop 'pocket' y opcionalmente 'pockets', 'onRefresh', 'openModal'
  component: React.ComponentType<{ 
    pocket: ActivePocketSummary; 
    pockets?: ActivePocketSummary[]; 
    onRefresh?: () => void;
    openModal?: (modalId: string, data?: { pocketId?: string }) => void;
  }>;
  createdAt: Date;
}

class ModuleRegistry {
  private modules: Map<string, RegisteredModule> = new Map();

  registerModule(module: RegisteredModule): void {
    this.modules.set(module.id, module);
    console.log(`[ModuleRegistry] Module registered: ${module.name} (${module.id})`);
  }

  unregisterModule(moduleId: string): void {
    this.modules.delete(moduleId);
    console.log(`[ModuleRegistry] Module unregistered: ${moduleId}`);
  }

  getModule(moduleId: string): RegisteredModule | undefined {
    return this.modules.get(moduleId);
  }

  getModulesByType(type: 'expense' | 'saving' | 'debt'): RegisteredModule[] {
    return Array.from(this.modules.values()).filter(m => m.type === type);
  }

  getAllModules(): RegisteredModule[] {
    return Array.from(this.modules.values());
  }

  getModulesByPocket(pocketId: string): RegisteredModule[] {
    return Array.from(this.modules.values()).filter(m => m.pocketId === pocketId);
  }

  clear(): void {
    this.modules.clear();
    console.log('[ModuleRegistry] All modules cleared');
  }
}

export const moduleRegistry = new ModuleRegistry();
