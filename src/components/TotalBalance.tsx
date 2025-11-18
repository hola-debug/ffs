import { useCallback, useEffect, useMemo, useState } from 'react';
import CountUp from './ui/CountUp';
import { useAccountsStore } from '../hooks/useAccountsStore';

interface TotalBalanceProps {
  className?: string;
  showNoiseBackground?: boolean;
}

export const noiseBackgroundStyle = {
  backgroundImage: 'url(/noise.bg.webp)',
  backgroundSize: 'cover',
  backgroundPosition: 'center'
};

const BASE_CURRENCY = 'UYU';
const SUPPORTED_TOTAL_CURRENCIES = [
  { code: 'UYU', label: 'Pesos uruguayos' },
  { code: 'USD', label: 'Dólares' }
];

const EYE_ICON_URL = new URL('../../public/ojo.svg', import.meta.url).href;

function EyeIcon({ isOpen }: { isOpen: boolean }) {
  return (
    <img
      src={EYE_ICON_URL}
      alt={isOpen ? 'Ocultar balance' : 'Mostrar balance'}
      className="h-[19px] w-[19px]"
      draggable={false}
    />
  );
}

export default function TotalBalance({ className, showNoiseBackground = true }: TotalBalanceProps) {
  const { accountBalances, getTotalBalance, loading, refreshing, error } = useAccountsStore();
  const [selectedCurrency, setSelectedCurrency] = useState<string>(BASE_CURRENCY);

  useEffect(() => {
    const supportedCodes = SUPPORTED_TOTAL_CURRENCIES.map((option) => option.code);
    if (!supportedCodes.includes(selectedCurrency)) {
      setSelectedCurrency(BASE_CURRENCY);
    }
  }, [selectedCurrency]);

  const totalInSelectedCurrency = useMemo(() => {
    if (!selectedCurrency) return 0;

    return getTotalBalance(selectedCurrency);
  }, [selectedCurrency, getTotalBalance]);

  const accountRows = useMemo(() => {
    return accountBalances
      .map((row) => ({
        id: `${row.accountId}-${row.currency}`,
        label: `${row.accountName.toUpperCase()} · ${row.currency}`,
        amount: row.balance
      }))
      .sort((a, b) => b.amount - a.amount);
  }, [accountBalances]);

  const toggleCurrency = useCallback(() => {
    setSelectedCurrency((prev) => (prev === 'USD' ? 'UYU' : 'USD'));
  }, []);

  const formatPlainNumber = useCallback((value: number | null) => {
    const numericValue = Number(value ?? 0);
    if (!Number.isFinite(numericValue)) return '0';
    const truncated = Math.trunc(Math.abs(numericValue));
    const digits = truncated.toString();
    return numericValue < 0 ? `-${digits}` : digits;
  }, []);

  const totalDisplayValue = useMemo(() => {
    const numericValue = Number(totalInSelectedCurrency ?? 0);
    if (!Number.isFinite(numericValue)) return 0;
    const truncated = Math.trunc(Math.abs(numericValue));
    return numericValue < 0 ? -truncated : truncated;
  }, [totalInSelectedCurrency]);

  const containerClass = ['w-full', className].filter(Boolean).join(' ');
  const isLoading = loading || refreshing;

  return (
    <div className={containerClass}>
      <div className="relative text-white">
        {showNoiseBackground && (
          <div className="absolute inset-0" style={noiseBackgroundStyle} aria-hidden="true" />
        )}

        <div
          className="relative z-10 grid"
          style={{ gridTemplateColumns: 'repeat(2,minmax(0,1fr))' }}
        >
          <div className="flex flex-col justify-center items-center">
            <div>
              <p className="font-Monda text-[10px] text-center font-semibold uppercase text-white/80 sm:text-xs leading-none">
                Plata total
              </p>
              <div className="mt-4 flex items-end gap-2">
                <span className="font-Monda text-[10px]uppercase text-white/90 leading-none">
                  {selectedCurrency || '---'}
                </span>
                <CountUp
                  key={`${selectedCurrency}-${totalDisplayValue}`}
                  to={totalDisplayValue}
                  className="font-Monda text-[30px] font-bold leading-none tracking-[-0.15em]"
                  startWhen={!isLoading}
                  duration={1.2}
                />
              </div>
            </div>

            <div className="mt-6 flex justify-center">
              <button
                type="button"
                onClick={toggleCurrency}
                className="flex h-12 w-12 items-center justify-center text-white transition hover:opacity-80"
                aria-label="Cambiar moneda"
              >
                <EyeIcon isOpen={selectedCurrency === 'USD'} />
              </button>
            </div>
          </div>

          <div className="flex flex-col justify-center items-center space-y-6">
            <div className=" ">
              <div className="font-monda text-[10px] uppercase text-white/60 sm:text-xs">
                Cuentas
              </div>
              <div className="mt-4 space-y-3 font-monda text-[10px] text-white/80 sm:text-sm">
                {isLoading && (
                  <div className="animate-pulse text-white/60">Cargando...</div>
                )}
                {!isLoading && error && (
                  <div className="text-red-300 text-xs">{error}</div>
                )}
                {!isLoading && !error && accountRows.length === 0 && (
                  <div className="text-white/70">No hay cuentas con saldo.</div>
                )}
                {!isLoading &&
                  accountRows.map((row) => (
                    <div
                      className="flex items-center justify-between border-b border-white/10 pb-2 last:border-b-0 last:pb-0"
                      key={row.id}
                    >
                      <span className="text-white/80">
                        {row.label}
                      </span>
                      <span className="font-semibold">
                        {formatPlainNumber(row.amount)}
                      </span>
                    </div>
                  ))}
              </div>
            </div>

         
          </div>
        </div>
      </div>
    </div>
  );
}
