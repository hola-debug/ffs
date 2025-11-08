import { BaseCard } from '../BaseCard';

export function DayCounterModule() {
  const today = new Date().getDate();

  return (
    <BaseCard variant="gradient" className="flex items-center justify-center min-h-[150px] sm:min-h-[250px]">
      <div className="text-center">
        <p className="text-xs sm:text-sm uppercase tracking-wide mb-2 sm:mb-4 text-gray-300">
          Día
        </p>
        <div className="text-5xl sm:text-9xl font-bold leading-none">{today}</div>
      </div>
    </BaseCard>
  );
}
