import { useState, useRef, useEffect } from 'react';

interface GlassDatePickerProps {
  label?: string;
  error?: string;
  value?: Date;
  onChange: (date: Date) => void;
  className?: string;
  minDate?: Date;
  maxDate?: Date;
}

const MONTHS = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

const DAYS = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

export const GlassDatePicker = ({ 
  label, 
  error, 
  value, 
  onChange,
  className = '',
  minDate,
  maxDate
}: GlassDatePickerProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(value || new Date());
  const datePickerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (datePickerRef.current && !datePickerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    return { daysInMonth, startingDayOfWeek, year, month };
  };

  const isDateDisabled = (date: Date) => {
    if (minDate && date < minDate) return true;
    if (maxDate && date > maxDate) return true;
    return false;
  };

  const isSameDay = (date1: Date, date2: Date) => {
    return date1.getDate() === date2.getDate() &&
           date1.getMonth() === date2.getMonth() &&
           date1.getFullYear() === date2.getFullYear();
  };

  const handleDateSelect = (day: number) => {
    const selectedDate = new Date(
      currentMonth.getFullYear(),
      currentMonth.getMonth(),
      day
    );
    
    if (!isDateDisabled(selectedDate)) {
      onChange(selectedDate);
      setIsOpen(false);
    }
  };

  const handlePrevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1));
  };

  const handleNextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1));
  };

  const renderCalendar = () => {
    const { daysInMonth, startingDayOfWeek, year, month } = getDaysInMonth(currentMonth);
    const days = [];

    // Empty cells for days before the first day of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(
        <div key={`empty-${i}`} className="aspect-square" />
      );
    }

    // Days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      const isSelected = value && isSameDay(date, value);
      const isDisabled = isDateDisabled(date);
      const isToday = isSameDay(date, new Date());

      let dayClasses = 'aspect-square flex items-center justify-center rounded-lg text-sm transition-colors';
      if (isDisabled) {
        dayClasses += ' text-white/30 cursor-not-allowed';
      } else {
        dayClasses += ' text-white/80 hover:bg-white/10';
      }
      if (isToday && !isSelected) {
        dayClasses += ' ring-1 ring-white/30';
      }
      if (isSelected) {
        dayClasses += ' bg-indigo-500 text-white font-semibold shadow-inner';
      }

      days.push(
        <button
          key={day}
          type="button"
          onClick={() => handleDateSelect(day)}
          disabled={isDisabled}
          className={dayClasses}
          aria-pressed={isSelected}
        >
          {day}
        </button>
      );
    }

    return days;
  };

  const formatDate = (date: Date) => {
    return `${date.getDate()} ${MONTHS[date.getMonth()]} ${date.getFullYear()}`;
  };

  return (
    <div className={className} ref={datePickerRef}>
      {label && (
        <label 
          className="block text-sm font-medium text-white/80 mb-2"
        >
          {label}
        </label>
      )}
      
      <div className="relative">
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="w-full flex items-center justify-between rounded-xl border border-white/10 bg-neutral-950/70 px-4 py-3 text-left text-white transition-all hover:border-white/30 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/50"
        >
          <div className="flex items-center gap-2">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" className="text-white/70">
              <path 
                d="M15.8333 3.33334H4.16667C3.24619 3.33334 2.5 4.07954 2.5 5.00001V16.6667C2.5 17.5871 3.24619 18.3333 4.16667 18.3333H15.8333C16.7538 18.3333 17.5 17.5871 17.5 16.6667V5.00001C17.5 4.07954 16.7538 3.33334 15.8333 3.33334Z" 
                stroke="currentColor" 
                strokeWidth="1.5" 
                strokeLinecap="round" 
                strokeLinejoin="round"
              />
              <path 
                d="M13.3333 1.66666V4.99999" 
                stroke="currentColor" 
                strokeWidth="1.5" 
                strokeLinecap="round" 
                strokeLinejoin="round"
              />
              <path 
                d="M6.66667 1.66666V4.99999" 
                stroke="currentColor" 
                strokeWidth="1.5" 
                strokeLinecap="round" 
                strokeLinejoin="round"
              />
              <path 
                d="M2.5 8.33334H17.5" 
                stroke="currentColor" 
                strokeWidth="1.5" 
                strokeLinecap="round" 
                strokeLinejoin="round"
              />
            </svg>
            <span className={value ? 'text-white' : 'text-white/50'}>
              {value ? formatDate(value) : 'Seleccionar fecha'}
            </span>
          </div>
          <svg 
            width="12" 
            height="8" 
            viewBox="0 0 12 8" 
            fill="none"
            className={`transition-transform duration-150 ${isOpen ? 'rotate-180' : ''}`}
          >
            <path 
              d="M1 1.5L6 6.5L11 1.5" 
              stroke="rgba(255,255,255,0.7)" 
              strokeWidth="1.5" 
              strokeLinecap="round" 
              strokeLinejoin="round"
            />
          </svg>
        </button>

        {/* Calendar Dropdown */}
        {isOpen && (
          <div 
            className="absolute w-full mt-2 z-50"
            style={{
              animation: 'fadeIn 0.15s ease-out'
            }}
          >
            <div className="rounded-xl border border-white/10 bg-neutral-950 shadow-[0_20px_50px_rgba(0,0,0,0.55)]">
              <div className="p-4">
                <div className="flex items-center justify-between mb-4">
                  <button
                    type="button"
                    onClick={handlePrevMonth}
                    className="p-2 rounded-lg text-white/70 hover:bg-white/5"
                  >
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                      <path 
                        d="M12.5 15L7.5 10L12.5 5" 
                        stroke="currentColor" 
                        strokeWidth="1.5" 
                        strokeLinecap="round" 
                        strokeLinejoin="round"
                      />
                    </svg>
                  </button>
                  <div className="text-white font-semibold text-base">
                    {MONTHS[currentMonth.getMonth()]} {currentMonth.getFullYear()}
                  </div>
                  <button
                    type="button"
                    onClick={handleNextMonth}
                    className="p-2 rounded-lg text-white/70 hover:bg-white/5"
                  >
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                      <path 
                        d="M7.5 15L12.5 10L7.5 5" 
                        stroke="currentColor" 
                        strokeWidth="1.5" 
                        strokeLinecap="round" 
                        strokeLinejoin="round"
                      />
                    </svg>
                  </button>
                </div>

                <div className="grid grid-cols-7 gap-2 mb-2">
                  {DAYS.map((day) => (
                    <div
                      key={day}
                      className="text-center text-[11px] font-medium text-white/60 uppercase"
                    >
                      {day}
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-7 gap-2">
                  {renderCalendar()}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {error && (
        <span className="text-red-400 text-sm mt-1 block">{error}</span>
      )}

      <style>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(-8px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
};

export default GlassDatePicker;
