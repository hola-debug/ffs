import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
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

function getTruncatedValue(value: number | null | undefined): number {
  const numericValue = Number(value ?? 0);
  if (!Number.isFinite(numericValue)) return 0;
  const truncated = Math.trunc(Math.abs(numericValue));
  return numericValue < 0 ? -truncated : truncated;
}

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
  const prevDisplayValuesRef = useRef<Record<string, number>>({});
  const prevTotalDisplayValuesRef = useRef<Record<string, number>>({});

  useEffect(() => {
    const supportedCodes = SUPPORTED_TOTAL_CURRENCIES.map((option) => option.code);
    if (!supportedCodes.includes(selectedCurrency)) {
      setSelectedCurrency(BASE_CURRENCY);
    }
  }, [selectedCurrency]);

  const totalInSelectedCurrency = selectedCurrency ? getTotalBalance(selectedCurrency) : 0;

  const accountRows = useMemo(() => {
    return accountBalances
      .map((row) => ({
        id: `${row.accountId}-${row.currency}`,
        label: `${row.accountName.toUpperCase()} · ${row.currency}`,
        amount: row.balance,
        displayAmount: getTruncatedValue(row.balance)
      }))
      .sort((a, b) => b.amount - a.amount);
  }, [accountBalances]);

  const accountRowsWithPrevious = useMemo(
    () =>
      accountRows.map((row) => ({
        ...row,
        previousDisplayAmount: prevDisplayValuesRef.current[row.id] ?? row.displayAmount
      })),
    [accountRows]
  );

  useEffect(() => {
    const nextValues: Record<string, number> = { ...prevDisplayValuesRef.current };
    accountRows.forEach((row) => {
      nextValues[row.id] = row.displayAmount;
    });
    prevDisplayValuesRef.current = nextValues;
  }, [accountRows]);

  const toggleCurrency = useCallback(() => {
    setSelectedCurrency((prev) => (prev === 'USD' ? 'UYU' : 'USD'));
  }, []);

  const totalDisplayValue = useMemo(() => {
    return getTruncatedValue(totalInSelectedCurrency);
  }, [totalInSelectedCurrency]);

  const previousTotalDisplayValue =
    prevTotalDisplayValuesRef.current[selectedCurrency] ?? 0;
  const totalDirection =
    totalDisplayValue < previousTotalDisplayValue ? 'down' : 'up';

  useEffect(() => {
    prevTotalDisplayValuesRef.current[selectedCurrency] = totalDisplayValue;
  }, [selectedCurrency, totalDisplayValue]);

  const containerClass = ['w-full', className].filter(Boolean).join(' ');
  const shouldAnimate = !loading;

  return (
    <div className={containerClass}>
      <div className="relative text-white">
        {showNoiseBackground && (
          <div className="absolute inset-0" style={noiseBackgroundStyle} aria-hidden="true" />
        )}

        <div
          className="relative z-10 grid mt-6"
          style={{ gridTemplateColumns: 'repeat(2,minmax(0,1fr))' }}
        >
          <div className="flex flex-col justify-center items-center  ">
            <div>
              <p className="font-Monda  text-[10px] text-center  font-semibold uppercase text-white/80 sm:text-xs leading-none">
                Plata disponible              </p>
              <div className="  flex space-y-4  items-end gap-2">
                <span className="font-Monda text-[10px]uppercase text-white/90 leading-none">
                  {selectedCurrency || '---'}
                </span>
                <CountUp
                  to={totalDisplayValue}
                  from={previousTotalDisplayValue}
                  direction={totalDirection}
                  className="font-Monda text-[30px] font-bold leading-none tracking-[-0.15em]"
                  startWhen={shouldAnimate}
                  duration={1.2}
                />
              </div>
            </div>

            <div className=" flex justify-center">
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

          <div className="flex flex-col items-center px-4">
            <div className="flex w-full flex-col items-center">

              <div className="mt-3 w-full">
                <div className="h-px w-full bg-white" aria-hidden="true" />
                <div className="mt-3 space-y-3 px-2 font-monda text-xs text-white/80 sm:text-sm">
                  {!loading && error && (
                    <div className="text-red-300 text-[10px]">{error}</div>
                  )}
                  {!loading && !error && accountRows.length === 0 && (
                    <div className="text-white/70">No hay cuentas con saldo.</div>
                  )}
                  {accountRowsWithPrevious.map((row) => (
                    <div
                      className="flex items-center justify-between leading-none"
                      key={row.id}
                    >
                      <span className="text-white text-[10px] font-Monda">{row.label}</span>
                      <CountUp
                        to={row.displayAmount}
                        from={row.previousDisplayAmount}
                        direction={row.displayAmount < row.previousDisplayAmount ? 'down' : 'up'}
                        duration={0.6}
                        startWhen={shouldAnimate}
                        className="font-bold leading-none tracking-[-0.1em] text-[10px] font-Mond"
                      />
                    </div>
                  ))}
                </div>
                <div className="mt-3 h-px w-full bg-white" aria-hidden="true" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
