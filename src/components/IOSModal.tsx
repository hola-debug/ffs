import { ReactNode, useEffect } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import GlassSurface from './GlassSurface';

interface IOSModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
}

export default function IOSModal({ isOpen, onClose, title, children }: IOSModalProps) {
  useEffect(() => {
    if (isOpen) {
      // Prevenir scroll del body cuando el modal está abierto
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop con blur gaussiano puro sin oscurecer */}
      <div 
        className="fixed inset-0 z-[9998] animate-backdrop-fade"
        style={{
          backdropFilter: 'blur(4px) saturate(1.2)',
          WebkitBackdropFilter: 'blur(40px) saturate(1.2)',
        }}
        onClick={onClose}
      />
      
      {/* SVG Filter overlay para blur gaussiano extra */}
      <svg className="fixed inset-0 w-full h-full pointer-events-none z-[9998]" style={{ opacity: 0.6 }}>
        <defs>
          <filter id="ios-backdrop-blur" colorInterpolationFilters="sRGB">
            {/* Triple blur gaussiano para efecto profundo */}
            <feGaussianBlur in="BackgroundImage" stdDeviation="60" result="blur1" />
            <feGaussianBlur in="blur1" stdDeviation="40" result="blur2" />
            <feGaussianBlur in="blur2" stdDeviation="20" result="finalBlur" />
          </filter>
        </defs>
        <rect 
          x="0" 
          y="0" 
          width="100%" 
          height="100%" 
          fill="transparent"
          filter="url(#ios-backdrop-blur)"
        />
      </svg>

      {/* Modal Content */}
      <div 
        className="fixed inset-0 flex items-center justify-center p-4 z-[9999] pointer-events-none"
        onClick={onClose}
      >
        <div 
          className="relative w-full max-w-md pointer-events-auto animate-modal-appear"
          style={{
            maxHeight: 'calc(100vh - 2rem)',
            animation: 'modalAppear 0.35s cubic-bezier(0.16, 1, 0.3, 1)',
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Glass Surface Container */}
          <GlassSurface
            width="100%"
            height="auto"
            borderRadius={24}
            borderWidth={0.08}
            brightness={15}
            opacity={0.95}
            blur={20}
            displace={1.2}
            backgroundOpacity={0.25}
            saturation={1.4}
            distortionScale={-200}
            redOffset={0}
            greenOffset={8}
            blueOffset={16}
            xChannel="R"
            yChannel="G"
            mixBlendMode="screen"
            className="shadow-2xl backdrop-blur-3xl"
            style={{
              boxShadow: `
                0 25px 80px rgba(0, 0, 0, 0.35),
                0 10px 40px rgba(0, 0, 0, 0.25),
                0 5px 20px rgba(0, 0, 0, 0.2),
                inset 0 1px 0 rgba(255, 255, 255, 0.15),
                inset 0 -1px 0 rgba(0, 0, 0, 0.2)
              `,
            }}
          >
            <div 
              className="w-full overflow-y-auto scrollbar-thin scrollbar-thumb-white/20 scrollbar-track-transparent"
              style={{
                maxHeight: 'calc(100vh - 4rem)',
              }}
            >
              {/* Header */}
              <div className="relative px-6 pt-6 pb-4 border-b border-white/10">
                <h2 
                  className="text-2xl font-semibold text-white pr-10"
                  style={{
                    textShadow: '0 2px 10px rgba(0, 0, 0, 0.3)',
                  }}
                >
                  {title}
                </h2>
                
                {/* Botón de cerrar estilo iOS */}
                <button
                  onClick={onClose}
                  className="absolute top-5 right-5 group"
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    backgroundColor: 'rgba(120, 120, 128, 0.24)',
                    backdropFilter: 'blur(20px)',
                    WebkitBackdropFilter: 'blur(20px)',
                    border: '0.5px solid rgba(255, 255, 255, 0.1)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.2)',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = 'rgba(120, 120, 128, 0.36)';
                    e.currentTarget.style.transform = 'scale(1.05)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'rgba(120, 120, 128, 0.24)';
                    e.currentTarget.style.transform = 'scale(1)';
                  }}
                >
                  <XMarkIcon 
                    className="w-5 h-5 text-white/90 transition-colors"
                    style={{
                      filter: 'drop-shadow(0 1px 2px rgba(0, 0, 0, 0.3))',
                    }}
                  />
                </button>
              </div>
              
              {/* Content */}
              <div className="px-6 py-6">
                {children}
              </div>
            </div>
          </GlassSurface>
        </div>
      </div>

      <style>{`
        @keyframes modalAppear {
          from {
            opacity: 0;
            transform: scale(0.94) translateY(10px);
          }
          to {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }

        @keyframes backdrop-fade {
          from {
            opacity: 0;
            backdrop-filter: blur(0px) saturate(1);
          }
          to {
            opacity: 1;
            backdrop-filter: blur(40px) saturate(1.2);
          }
        }

        .animate-backdrop-fade {
          animation: backdrop-fade 0.4s cubic-bezier(0.16, 1, 0.3, 1);
        }

        /* Estilos personalizados para inputs y selects estilo iOS */
        .ios-input,
        .ios-select {
          background: rgba(120, 120, 128, 0.16) !important;
          border: 1px solid rgba(255, 255, 255, 0.12) !important;
          color: white !important;
          border-radius: 12px !important;
          padding: 12px 16px !important;
          font-size: 16px !important;
          transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1) !important;
          backdrop-filter: blur(20px) !important;
          -webkit-backdrop-filter: blur(20px) !important;
          box-shadow: inset 0 1px 2px rgba(0, 0, 0, 0.1) !important;
        }

        .ios-input:focus,
        .ios-select:focus {
          background: rgba(120, 120, 128, 0.24) !important;
          border-color: rgba(10, 132, 255, 0.6) !important;
          outline: none !important;
          box-shadow: 
            0 0 0 3px rgba(10, 132, 255, 0.15),
            inset 0 1px 2px rgba(0, 0, 0, 0.1) !important;
        }

        .ios-input::placeholder {
          color: rgba(255, 255, 255, 0.4) !important;
        }

        /* Botones estilo iOS */
        .ios-button {
          background: rgba(10, 132, 255, 0.9) !important;
          border: none !important;
          color: white !important;
          border-radius: 12px !important;
          padding: 12px 24px !important;
          font-size: 16px !important;
          font-weight: 600 !important;
          transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1) !important;
          box-shadow: 
            0 2px 8px rgba(10, 132, 255, 0.3),
            inset 0 1px 0 rgba(255, 255, 255, 0.2) !important;
        }

        .ios-button:hover:not(:disabled) {
          background: rgba(10, 132, 255, 1) !important;
          transform: translateY(-1px) !important;
          box-shadow: 
            0 4px 12px rgba(10, 132, 255, 0.4),
            inset 0 1px 0 rgba(255, 255, 255, 0.2) !important;
        }

        .ios-button:active:not(:disabled) {
          transform: translateY(0) !important;
          box-shadow: 
            0 1px 4px rgba(10, 132, 255, 0.3),
            inset 0 1px 0 rgba(255, 255, 255, 0.2) !important;
        }

        .ios-button:disabled {
          opacity: 0.4 !important;
          cursor: not-allowed !important;
        }

        .ios-button-secondary {
          background: rgba(120, 120, 128, 0.24) !important;
          border: none !important;
          color: white !important;
          border-radius: 12px !important;
          padding: 12px 24px !important;
          font-size: 16px !important;
          font-weight: 600 !important;
          transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1) !important;
          box-shadow: 
            0 2px 8px rgba(0, 0, 0, 0.15),
            inset 0 1px 0 rgba(255, 255, 255, 0.1) !important;
        }

        .ios-button-secondary:hover {
          background: rgba(120, 120, 128, 0.32) !important;
          transform: translateY(-1px) !important;
        }

        .ios-button-secondary:active {
          transform: translateY(0) !important;
        }

        /* Labels estilo iOS */
        .ios-label {
          color: rgba(255, 255, 255, 0.8) !important;
          font-size: 14px !important;
          font-weight: 500 !important;
          margin-bottom: 8px !important;
          display: block !important;
          text-shadow: 0 1px 2px rgba(0, 0, 0, 0.2) !important;
        }

        /* Error messages estilo iOS */
        .ios-error {
          background: rgba(255, 59, 48, 0.15) !important;
          border: 1px solid rgba(255, 59, 48, 0.3) !important;
          color: rgba(255, 100, 90, 1) !important;
          padding: 12px 16px !important;
          border-radius: 12px !important;
          font-size: 14px !important;
          backdrop-filter: blur(20px) !important;
          -webkit-backdrop-filter: blur(20px) !important;
          box-shadow: 0 2px 8px rgba(255, 59, 48, 0.1) !important;
        }

        /* Scrollbar estilo iOS */
        .scrollbar-thin::-webkit-scrollbar {
          width: 6px;
        }

        .scrollbar-thin::-webkit-scrollbar-track {
          background: transparent;
        }

        .scrollbar-thin::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.2);
          border-radius: 3px;
        }

        .scrollbar-thin::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.3);
        }
      `}</style>
    </>
  );
}
