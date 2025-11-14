import { useState, useRef, useEffect } from 'react';
import GlassSurface from './GlassSurface';

interface DropdownOption {
  value: string;
  label: string;
  icon?: React.ReactNode;
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
        {/* Selected Value Display */}
        <GlassSurface
          width="100%"
          height="auto"
          borderRadius={12}
          borderWidth={0.08}
          brightness={0}
          opacity={100}
          blur={100}
          displace={8}
          backgroundOpacity={0.3}
          saturation={12}
          distortionScale={0}
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
              {selectedOption?.icon && (
                <span className="flex-shrink-0">{selectedOption.icon}</span>
              )}
              <span style={{ color: selectedOption ? 'rgba(255, 255, 255, 0.9)' : 'rgba(255, 255, 255, 0.5)' }}>
                {selectedOption ? selectedOption.label : placeholder}
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

        {/* Dropdown Menu */}
        {isOpen && (
          <div 
            className="absolute w-full mt-2 z-50 "
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
              backgroundOpacity={0.8}
              saturation={1.2}
              distortionScale={0}
              redOffset={0}
              greenOffset={0}
              blueOffset={0}
              xChannel="R"
              yChannel="G"
              mixBlendMode="screen"
              className="scrollbar-hide"
              style={{
                boxShadow: `
                  0 8px 24px rgba(0, 0, 0, 0.2),
                  inset 0 1px 0 rgba(255, 255, 255, 0.2),
                  inset 0 -1px 0 rgba(0, 0, 0, 0.15)
                `,
                maxHeight: '240px',
                overflowY: 'auto',
                scrollbarWidth: 'none',
                msOverflowStyle: 'none'
              }}
            >
              <div className="py-2">
                {options.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => handleSelect(option.value)}
                    className="w-full px-4 py-3 text-left flex items-center gap-3 transition-all"
                    style={{
                      background: option.value === value 
                        ? 'rgba(255, 255, 255, 0.1)' 
                        : 'transparent',
                      color: 'rgba(255, 255, 255, 0.9)',
                      fontSize: '16px',
                      fontWeight: option.value === value ? 500 : 400,
                      borderRadius: '12px'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = option.value === value 
                        ? 'rgba(255, 255, 255, 0.1)' 
                        : 'transparent';
                    }}
                  >
                    {option.icon && (
                      <span className="flex-shrink-0">{option.icon}</span>
                    )}
                    <div className="flex-1">
                      <div>{option.label}</div>
                      {option.description && (
                        <div 
                          className="text-xs mt-0.5"
                          style={{ color: 'rgba(255, 255, 255, 0.6)' }}
                        >
                          {option.description}
                        </div>
                      )}
                    </div>
                    {option.value === value && (
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
                ))}
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
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  );
};

export default GlassDropdown;
