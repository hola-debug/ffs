import { useState, useRef, useEffect } from 'react';
import type { ReactNode } from 'react';

const ACCENT_COLOR = '#67F690';

interface DropdownOption {
  value: string;
  label: string;
  icon?: ReactNode;
  description?: string;
}

interface GlassDropdownProps {
  label?: string;
  error?: string;
  placeholder?: string;
  options: DropdownOption[];
  value?: string;
  onChange: (value: string) => void;
  className?: string;
}

export const GlassDropdown = ({ 
  label, 
  error, 
  placeholder = 'Seleccionar...', 
  options, 
  value, 
  onChange,
  className = ''
}: GlassDropdownProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find(opt => opt.value === value);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (optionValue: string) => {
    onChange(optionValue);
    setIsOpen(false);
  };

  return (
    <div className={className} ref={dropdownRef}>
      {label && (
        <label className="block font-monda text-[10px] tracking-[0.35em] text-white/60 uppercase mb-2">
          {label}
        </label>
      )}
      
      <div className="relative">
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className={`w-full flex items-center justify-between rounded-[20px] border px-5 py-3 text-left transition-all shadow-[0_18px_45px_rgba(0,0,0,0.55)] ${
            isOpen ? 'border-[rgba(103,246,144,0.7)] bg-black/60 text-white' : 'border-white/12 bg-black/45 text-white'
          } focus:outline-none`}
          style={{ boxShadow: '0 18px 45px rgba(0,0,0,0.55)' }}
        >
          <div className="flex flex-col">
            <div className="flex items-center gap-2 font-roboto text-[13px] tracking-[0.08em]">
              {selectedOption?.icon && <span className="flex-shrink-0">{selectedOption.icon}</span>}
              <span className={selectedOption ? 'text-white' : 'text-white/50'}>
                {selectedOption ? selectedOption.label : placeholder}
              </span>
            </div>
            {selectedOption?.description && (
              <span className="font-roboto text-[10px] text-white/60 mt-0.5">
                {selectedOption.description}
              </span>
            )}
          </div>
          <span
            className="ml-3 flex h-9 w-9 items-center justify-center rounded-full border border-white/15 text-base"
            style={{
              backgroundColor: isOpen ? ACCENT_COLOR : 'rgba(255,255,255,0.08)',
              color: isOpen ? '#000' : '#fff',
              boxShadow: isOpen ? `0 0 20px ${ACCENT_COLOR}70` : 'inset 0 0 5px rgba(0,0,0,0.6)',
            }}
          >
            {isOpen ? '−' : '＋'}
          </span>
        </button>

        {/* Dropdown Menu */}
        {isOpen && (
          <div 
            className="absolute w-full mt-2 z-50"
            style={{
              animation: 'fadeIn 0.15s ease-out'
            }}
          >
            <div className="rounded-[20px] border border-white/15 bg-black/90 shadow-[0_30px_70px_rgba(0,0,0,0.65)] overflow-hidden">
              <div className="max-h-60 overflow-y-auto scrollbar-hide py-2">
                {options.map((option) => {
                  const isSelected = option.value === value;
                  return (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => handleSelect(option.value)}
                      className={`w-full px-4 py-3 text-left flex items-center gap-3 font-roboto text-[13px] transition-colors ${
                        isSelected ? 'bg-white/5 text-white' : 'text-white/80 hover:bg-white/5'
                      }`}
                    >
                      {option.icon && (
                        <span className="flex-shrink-0">{option.icon}</span>
                      )}
                      <div className="flex-1">
                        <div className="font-medium tracking-[0.08em] uppercase text-[11px] text-white/80">
                          {option.label}
                        </div>
                        {option.description && (
                          <div className="text-[10px] text-white/60 mt-0.5">
                            {option.description}
                          </div>
                        )}
                      </div>
                      {isSelected && (
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                          <path 
                            d="M13.3337 4L6.00033 11.3333L2.66699 8" 
                            stroke="rgba(255,255,255,0.9)" 
                            strokeWidth="2" 
                            strokeLinecap="round" 
                            strokeLinejoin="round"
                          />
                        </svg>
                      )}
                    </button>
                  );
                })}
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
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
};

export default GlassDropdown;
