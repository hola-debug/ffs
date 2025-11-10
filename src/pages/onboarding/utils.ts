export const formatCurrency = (value: number, currency = 'UYU') =>
  new Intl.NumberFormat('es-UY', {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(value || 0);
