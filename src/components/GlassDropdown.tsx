import { useState, useRef, useEffect } from 'react';
import type { ReactNode } from 'react';

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
            {selectedOption?.icon && (
              <span className="flex-shrink-0">{selectedOption.icon}</span>
            )}
            <span className={selectedOption ? 'text-white' : 'text-white/50'}>
              {selectedOption ? selectedOption.label : placeholder}
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

        {/* Dropdown Menu */}
        {isOpen && (
          <div 
            className="absolute w-full mt-2 z-50"
            style={{
              animation: 'fadeIn 0.15s ease-out'
            }}
          >
            <div className="rounded-xl border border-white/10 bg-neutral-950 shadow-[0_20px_50px_rgba(0,0,0,0.55)] overflow-hidden">
              <div className="max-h-60 overflow-y-auto scrollbar-hide py-2">
                {options.map((option) => {
                  const isSelected = option.value === value;
                  return (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => handleSelect(option.value)}
                      className={`w-full px-4 py-3 text-left flex items-center gap-3 text-sm sm:text-base transition-colors ${isSelected ? 'bg-white/5 text-white' : 'text-white/80 hover:bg-white/5'}`}
                    >
                      {option.icon && (
                        <span className="flex-shrink-0">{option.icon}</span>
                      )}
                      <div className="flex-1">
                        <div className="font-medium">{option.label}</div>
                        {option.description && (
                          <div className="text-xs text-white/60 mt-0.5">
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
