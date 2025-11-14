import { useState, useRef, useEffect } from 'react';
import GlassSurface from './GlassSurface';

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

      days.push(
        <button
          key={day}
          type="button"
          onClick={() => handleDateSelect(day)}
          disabled={isDisabled}
          className="aspect-square flex items-center justify-center rounded-lg transition-all"
          style={{
            background: isSelected 
              ? 'rgba(255, 255, 255, 0.2)' 
              : isToday 
                ? 'rgba(255, 255, 255, 0.05)'
                : 'transparent',
            color: isDisabled 
              ? 'rgba(255, 255, 255, 0.3)' 
              : 'rgba(255, 255, 255, 0.9)',
            fontSize: '14px',
            fontWeight: isSelected ? 600 : 400,
            cursor: isDisabled ? 'not-allowed' : 'pointer',
            border: isToday ? '1px solid rgba(255, 255, 255, 0.2)' : 'none'
          }}
          onMouseEnter={(e) => {
            if (!isDisabled) {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.12)';
            }
          }}
          onMouseLeave={(e) => {
            if (!isDisabled) {
              e.currentTarget.style.background = isSelected 
                ? 'rgba(255, 255, 255, 0.2)' 
                : isToday
                  ? 'rgba(255, 255, 255, 0.05)'
                  : 'transparent';
            }
          }}
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
          className="block text-sm font-medium mb-2"
          style={{ 
            color: 'rgba(255, 255, 255, 0.9)',
            textShadow: '0 1px 2px rgba(0, 0, 0, 0.3)'
          }}
        >
          {label}
        </label>
      )}
      
      <div className="relative">
        {/* Date Display */}
        <GlassSurface
          width="100%"
          height="auto"
          borderRadius={12}
          borderWidth={0.08}
          brightness={60}
          opacity={0.8}
          blur={20}
          displace={0.8}
          backgroundOpacity={0.3}
          saturation={1.2}
          distortionScale={-100}
          xChannel="R"
          yChannel="G"
          mixBlendMode="screen"
          redOffset={0}
          greenOffset={2}
          blueOffset={4}
          style={{
            boxShadow: `
              0 2px 10px rgba(0, 0, 0, 0.1),
              inset 0 1px 0 rgba(255, 255, 255, 0.15),
              inset 0 -1px 0 rgba(0, 0, 0, 0.1)
            `,
          }}
        >
          <button
            type="button"
            onClick={() => setIsOpen(!isOpen)}
            className="w-full bg-transparent border-none outline-none px-4 py-3 text-white flex items-center justify-between"
            style={{
              fontSize: '16px',
              fontWeight: 400,
              cursor: 'pointer'
            }}
          >
            <div className="flex items-center gap-2">
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <path 
                  d="M15.8333 3.33334H4.16667C3.24619 3.33334 2.5 4.07954 2.5 5.00001V16.6667C2.5 17.5871 3.24619 18.3333 4.16667 18.3333H15.8333C16.7538 18.3333 17.5 17.5871 17.5 16.6667V5.00001C17.5 4.07954 16.7538 3.33334 15.8333 3.33334Z" 
                  stroke="rgba(255,255,255,0.7)" 
                  strokeWidth="1.5" 
                  strokeLinecap="round" 
                  strokeLinejoin="round"
                />
                <path 
                  d="M13.3333 1.66666V4.99999" 
                  stroke="rgba(255,255,255,0.7)" 
                  strokeWidth="1.5" 
                  strokeLinecap="round" 
                  strokeLinejoin="round"
                />
                <path 
                  d="M6.66667 1.66666V4.99999" 
                  stroke="rgba(255,255,255,0.7)" 
                  strokeWidth="1.5" 
                  strokeLinecap="round" 
                  strokeLinejoin="round"
                />
                <path 
                  d="M2.5 8.33334H17.5" 
                  stroke="rgba(255,255,255,0.7)" 
                  strokeWidth="1.5" 
                  strokeLinecap="round" 
                  strokeLinejoin="round"
                />
              </svg>
              <span style={{ color: value ? 'rgba(255, 255, 255, 0.9)' : 'rgba(255, 255, 255, 0.5)' }}>
                {value ? formatDate(value) : 'Seleccionar fecha'}
              </span>
            </div>
            <svg 
              width="12" 
              height="8" 
              viewBox="0 0 12 8" 
              fill="none"
              style={{
                transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                transition: 'transform 0.2s ease'
              }}
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
        </GlassSurface>

        {/* Calendar Dropdown */}
        {isOpen && (
          <div 
            className="absolute w-full mt-2 z-50"
            style={{
              animation: 'fadeIn 0.15s ease-out'
            }}
          >
            <GlassSurface
              width="100%"
              height="auto"
              borderRadius={12}
              borderWidth={0.08}
              brightness={60}
              opacity={0.9}
              blur={25}
              displace={10}
              backgroundOpacity={0.6}
              saturation={1.2}
              distortionScale={0}
              redOffset={0}
              greenOffset={2}
              blueOffset={4}
              xChannel="R"
              yChannel="G"
              mixBlendMode="screen"
              style={{
                boxShadow: `
                  0 8px 24px rgba(0, 0, 0, 0.2),
                  inset 0 1px 0 rgba(255, 255, 255, 0.2),
                  inset 0 -1px 0 rgba(0, 0, 0, 0.15)
                `,
              }}
            >
              <div className="p-4">
              {/* Month/Year Header */}
              <div className="flex items-center justify-between mb-4">
                  <button
                    type="button"
                    onClick={handlePrevMonth}
                    className="p-2 rounded-lg transition-all"
                    style={{
                      background: 'transparent',
                      color: 'rgba(255, 255, 255, 0.7)'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'transparent';
                    }}
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
                  
                  <div 
                    style={{ 
                      color: 'rgba(255, 255, 255, 0.9)',
                      fontSize: '16px',
                      fontWeight: 600
                    }}
                  >
                    {MONTHS[currentMonth.getMonth()]} {currentMonth.getFullYear()}
                  </div>
                  
                  <button
                    type="button"
                    onClick={handleNextMonth}
                    className="p-2 rounded-lg transition-all"
                    style={{
                      background: 'transparent',
                      color: 'rgba(255, 255, 255, 0.7)'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'transparent';
                    }}
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

            {/* Days of Week */}
            <div className="grid grid-cols-7 gap-2 mb-2">
                  {DAYS.map((day) => (
                    <div
                      key={day}
                      className="text-center"
                      style={{
                        color: 'rgba(255, 255, 255, 0.6)',
                        fontSize: '12px',
                        fontWeight: 500
                      }}
                    >
                      {day}
                    </div>
                  ))}
            </div>

            {/* Calendar Grid */}
            <div className="grid grid-cols-7 gap-2">
              {renderCalendar()}
            </div>
              </div>
            </GlassSurface>
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
