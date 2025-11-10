import type { Dispatch, SetStateAction } from 'react';
import type { Account } from '../../../lib/types';
import type { PeriodFormState } from '../types';
import { AccountDropdown } from '../components/AccountDropdown';
import Counter from '../../../components/Counter';

const getPlaces = (value: number) => {
  const absValue = Math.max(1, Math.floor(Math.abs(value)));
  const digits = absValue.toString().length;
  return Array.from({ length: digits }, (_unused, index) => 10 ** (digits - index - 1));
};

interface CurrencyCounterProps {
  value: number;
  currency: string;
  fontSize?: number;
  textColor?: string;
  align?: 'start' | 'center' | 'end';
}

const CurrencyCounter = ({
  value,
  currency,
  fontSize = 32,
  textColor = '#0f172a',
  align = 'start',
}: CurrencyCounterProps) => {
  const absolute = Math.abs(Math.round(value));
  const sign = value < 0 ? '-' : '';
  const alignmentClass =
    align === 'center' ? 'justify-center' : align === 'end' ? 'justify-end' : '';

  return (
    <div className={`flex items-end gap-2 ${alignmentClass}`}>
      <span className="text-xs font-semibold uppercase tracking-wide" style={{ color: textColor }}>
        {sign}
        {currency}
      </span>
      <Counter
        value={absolute}
        places={getPlaces(absolute)}
        fontSize={fontSize}
        padding={4}
        gap={4}
        textColor={textColor}
        fontWeight={900}
      />
    </div>
  );
};

interface PeriodStepProps {
  accounts: Account[];
  periodForm: PeriodFormState;
  setPeriodForm: Dispatch<SetStateAction<PeriodFormState>>;
  selectedAccount?: Account;
  allocatedAmount: number;
  dailyAmount: number;
}

export function PeriodStep({
  accounts,
  periodForm,
  setPeriodForm,
  selectedAccount,
  allocatedAmount,
  dailyAmount,
}: PeriodStepProps) {
  return (
    <div className="space-y-6">
      <header className="space-y-1 text-center">
        <p className="text-lg font-semibold uppercase">Periodos</p>
        <p className="text-sm uppercase text-gray-500">Crear un nuevo periodo</p>
      </header>

      <div className="space-y-5">
        <div className="rounded-[28px] bg-slate-200/70 px-5 py-4 space-y-3">
          <label className="text-xs uppercase tracking-wide text-gray-600">
            Elegí la cuenta que vas a usar para gastar
          </label>
          <AccountDropdown
            accounts={accounts}
            selectedId={selectedAccount?.id}
            onSelect={(accountId) =>
              setPeriodForm((state) => ({
                ...state,
                accountId,
              }))
            }
          />
          <div className="mt-4 flex items-center justify-between text-sm font-semibold uppercase">
            <span>Total cuenta</span>
            <CurrencyCounter
              value={selectedAccount?.balance ?? 0}
              currency={selectedAccount?.currency ?? 'UYU'}
              fontSize={28}
              align="end"
            />
          </div>
        </div>

        <div className="rounded-[28px] bg-slate-200/70 px-5 py-4 space-y-4">
          <div>
            <label className="text-xs uppercase tracking-wide text-gray-600">
              ¿Cuánto te gustaría destinar?
            </label>
            <div className="mt-2 flex items-center gap-3">
              <input
                type="range"
                min={1}
                max={100}
                value={periodForm.percentage}
                onChange={(event) =>
                  setPeriodForm((state) => ({ ...state, percentage: Number(event.target.value) }))
                }
                className="flex-1 accent-black"
              />
              <div className="flex items-end gap-1">
                <Counter
                  value={periodForm.percentage}
                  places={getPlaces(periodForm.percentage)}
                  fontSize={42}
                  padding={2}
                  gap={2}
                  textColor="#0f172a"
                  fontWeight={900}
                />
                <span className="text-lg font-semibold">%</span>
              </div>
            </div>
          </div>

          <div>
            <label className="text-xs uppercase tracking-wide text-gray-600">
              Elegí un nombre
            </label>
            <input
              type="text"
              value={periodForm.label}
              onChange={(event) =>
                setPeriodForm((state) => ({ ...state, label: event.target.value }))
              }
              className="mt-2 w-full rounded-2xl border border-gray-300 bg-white px-4 py-2 text-sm uppercase outline-none"
            />
          </div>

          <div>
            <label className="text-xs uppercase tracking-wide text-gray-600">Días</label>
            <div className="mt-3 flex items-center gap-3">
              <input
                type="range"
                min={1}
                max={60}
                value={periodForm.days}
                onChange={(event) =>
                  setPeriodForm((state) => ({
                    ...state,
                    days: Number(event.target.value),
                  }))
                }
                className="flex-1 accent-black"
              />
              <Counter
                value={periodForm.days}
                places={getPlaces(periodForm.days)}
                fontSize={42}
                padding={2}
                gap={2}
                textColor="#0f172a"
                fontWeight={900}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-[24px] bg-white px-4 py-3 text-center">
              <p className="text-xs uppercase tracking-wide text-gray-500">Plata</p>
              <CurrencyCounter
                value={allocatedAmount}
                currency={selectedAccount?.currency ?? 'UYU'}
                fontSize={36}
                align="center"
              />
            </div>
            <div className="rounded-[24px] bg-white px-4 py-3 text-center">
              <p className="text-xs uppercase tracking-wide text-gray-500">Plata por día</p>
              <CurrencyCounter
                value={dailyAmount}
                currency={selectedAccount?.currency ?? 'UYU'}
                fontSize={36}
                align="center"
              />
            </div>
          </div>
        </div>

        <div className="rounded-[28px] bg-gray-900 px-5 py-4 text-white">
          <div className="flex items-center justify-between text-sm uppercase tracking-wide text-gray-300">
            <span>Total</span>
            <CurrencyCounter
              value={-allocatedAmount}
              currency={selectedAccount?.currency ?? 'UYU'}
              fontSize={32}
              textColor="#ffffff"
              align="end"
            />
          </div>
          <div className="mt-2 flex items-center justify-between text-xs uppercase tracking-wide text-gray-400">
            <span>Total cuenta</span>
            <CurrencyCounter
              value={(selectedAccount?.balance ?? 0) - allocatedAmount}
              currency={selectedAccount?.currency ?? 'UYU'}
              fontSize={24}
              textColor="#d1d5db"
              align="end"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
