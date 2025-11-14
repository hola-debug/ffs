import { ReactNode, useEffect, useState, memo } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import GlassSurface from './GlassSurface';
import GlassField, { GlassSelect } from './GlassField';

export { GlassField, GlassSelect };

const styles = `
  @keyframes fadeInBackdrop {
    from { opacity: 0; }
    to { opacity: 1; }
  }
  @keyframes fadeOutBackdrop {
    from { opacity: 1; }
    to { opacity: 0; }
  }
  @keyframes slideInContent {
    from { transform: translateY(20px); }
    to { transform: translateY(0); }
  }
  @keyframes slideOutContent {
    from { transform: translateY(0); }
    to { transform: translateY(20px); }
  }
  .modal-backdrop-enter {
    animation: fadeInBackdrop 600ms ease-out forwards;
  }
  .modal-backdrop-exit {
    animation: fadeOutBackdrop 300ms ease-in forwards;
  }
  .modal-content-enter {
    animation: slideInContent 600ms cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
    will-change: transform;
  }
  .modal-content-exit {
    animation: slideOutContent 300ms cubic-bezier(0.36, 0, 0.66, -0.56) forwards;
    will-change: transform;
  }
`;

if (typeof document !== 'undefined') {
  const styleEl = document.createElement('style');
  styleEl.textContent = styles;
  document.head.appendChild(styleEl);
}

interface IOSModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
}

function IOSModalComponent({ isOpen, onClose, title, children }: IOSModalProps) {
  const [isClosing, setIsClosing] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      setMounted(true);
      setIsClosing(false);
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  const handleClose = () => {
    setIsClosing(true);
    // Espera la duración de salida (300ms)
    setTimeout(() => {
      onClose();
    }, 300);
  };

  if (!mounted && !isOpen) return null;

  const containerStyle: React.CSSProperties = {
    position: 'fixed',
    inset: 0,
    zIndex: 9999,
    pointerEvents: 'none',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '1rem',
  };

  return (
    <>
      {/* Backdrop con blur y oscuridad - Optimized */}
      <div
        className={isClosing ? 'modal-backdrop-exit' : 'modal-backdrop-enter'}
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 9998,
          backgroundColor: 'rgba(0, 0, 0, 0.85)',
          backdropFilter: 'blur(10px)',
          willChange: 'opacity',
          transform: 'translateZ(0)',
        }}
        onClick={handleClose}
      />

      {/* Modal Content Container */}
      <div 
        style={containerStyle}
        onClick={handleClose}
      >
        <div
          className={`relative w-full max-w-md pointer-events-auto ${isClosing ? 'modal-content-exit' : 'modal-content-enter'}`}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Glass Surface Container - Optimized */}
          <div>
           <GlassSurface
            width="100%"
            height="auto"
            borderRadius={11}
            borderWidth={0.011}
            brightness={11}
            opacity={0.95}
            blur={25}
            displace={0.8}
            backgroundOpacity={0.25}
            saturation={1.1}
            distortionScale={-150}
            redOffset={0}
            greenOffset={6}
            blueOffset={12}
            xChannel="R"
            yChannel="G"
            mixBlendMode="screen"
            className="shadow-2xl backdrop-blur-2xl"
            style={{
              willChange: 'transform',
              transform: 'translateZ(0)',
              backfaceVisibility: 'hidden',
              boxShadow: `
                0 20px 60px rgba(0, 0, 0, 0.3),
                0 8px 30px rgba(0, 0, 0, 0.2),
                inset 0 1px 0 rgba(255, 255, 255, 0.15)
              `,
            }}
          >
       
            <div 
              className="w-full overflow-y-auto scrollbar-hide"
              style={{
                maxHeight: 'calc(100vh - 4rem)',
              }}
            >
              {/* Header */}
              <div 
                className="relative px-6 pt-6 pb-4 border-b border-white/10 "
              >
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
                  onClick={handleClose}
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
              <div 
                className="px-6 py-6"
              >
                {children}
              </div>
            </div>
          </GlassSurface>
        </div>
        </div>
      </div>
    </>
  );
}

export default memo(IOSModalComponent);
