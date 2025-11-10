import type { CategorySection, StepConfig } from './types';
import type { Category } from '../../lib/types';

export const STEP_FLOW: StepConfig[] = [
  { id: 'welcome', label: 'Bienvenida', actionLabel: 'Empezar' },
  { id: 'accounts', label: 'Cuentas', actionLabel: 'Listo' },
  { id: 'categories', label: 'Categorías', actionLabel: 'Siguiente' },
  { id: 'period', label: 'Periodos', actionLabel: 'Iniciar periodo' },
];

export const CATEGORY_SECTIONS: CategorySection[] = [
  {
    title: 'INGRESOS',
    kind: 'income',
    description: 'Sueldo, freelance, reembolsos.',
  },
  {
    title: 'FIJOS',
    kind: 'fixed',
    description: 'Alquiler, internet, luz, Netflix.',
  },
  {
    title: 'VARIABLES',
    kind: 'variable',
    description: 'Comida, transporte, salud.',
  },
  {
    title: 'RANDOM',
    kind: 'random',
    description: 'Compras impulsivas, delivery extra.',
  },
  {
    title: 'AHORRO',
    kind: 'saving',
    description: 'Fondo de emergencia, inversiones.',
  },
];

export const PRESET_CATEGORY_OPTIONS: Record<Category['kind'], string[]> = {
  income: ['Sueldo', 'Freelance', 'Reembolsos', 'Bonus'],
  fixed: ['Alquiler', 'Internet', 'Luz', 'Netflix', 'Teléfono'],
  variable: ['Comida', 'Transporte', 'Salud', 'Entretenimiento'],
  random: ['Compras impulsivas', 'Delivery extra', 'Regalos'],
  saving: ['Fondo de emergencia', 'Inversiones', 'Viajes'],
};
