import { useMemo } from 'react';
import { ActivePocketSummary, PocketSubtype, PocketType } from '@/lib/types';

export const TYPE_CONFIG: Record<PocketType, { label: string; gradient: string; accent: string }> = {
  saving: {
    label: 'Ahorro',
    gradient: 'linear-gradient(135deg, #0b3c24, #11271e)',
    accent: '#67F690',
  },
  expense: {
    label: 'Gasto',
    gradient: 'linear-gradient(135deg, #09243a, #111527)',
    accent: '#2BA9E4',
  },
  debt: {
    label: 'Deuda',
    gradient: 'linear-gradient(135deg, #2f120d, #190805)',
    accent: '#ff8f5c',
  },
};

export const SUBTYPE_LABELS: Record<Exclude<PocketSubtype, null>, string> = {
  period: 'Por período',
  recurrent: 'Recurrente variable',
  fixed: 'Fijo mensual',
  shared: 'Compartida',
};

export const usePocketSummary = (pocket: ActivePocketSummary) => {
  const config = TYPE_CONFIG[pocket.type];
  const subtypeLabel =
    pocket.type === 'expense' && pocket.subtype ? SUBTYPE_LABELS[pocket.subtype] : null;

  const formatter = useMemo(
    () =>
      new Intl.NumberFormat('es-UY', {
        style: 'currency',
        currency: pocket.currency || 'UYU',
        maximumFractionDigits: 0,
      }),
    [pocket.currency]
  );

  const format = (value: number | undefined | null) => formatter.format(value ?? 0);

  return {
    config,
    subtypeLabel,
    format,
  };
};
