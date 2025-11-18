import { memo, useEffect, useState } from 'react';
import type { CSSProperties, ReactNode } from 'react';
import GlassField, { GlassSelect } from './GlassField';

export { GlassField, GlassSelect };

const BACKDROP_ENTER_DURATION = 450;
const BACKDROP_EXIT_DURATION = 220;
const CONTENT_ENTER_DURATION = 450;
const CONTENT_EXIT_DURATION = 320;
const CONTENT_EXIT_DELAY = 220;
const TOTAL_EXIT_DURATION = CONTENT_EXIT_DURATION + CONTENT_EXIT_DELAY;
const ACCENT_COLOR = '#53ff94';

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
    from { opacity: 0; transform: translateY(24px) scale(0.98); }
    to { opacity: 1; transform: translateY(0) scale(1); }
  }
  @keyframes slideOutContent {
    from { opacity: 1; transform: translateY(0) scale(1); }
    to { opacity: 0; transform: translateY(20px) scale(0.98); }
  }
  .modal-backdrop-enter {
    animation: fadeInBackdrop ${BACKDROP_ENTER_DURATION}ms ease-out forwards;
  }
  .modal-backdrop-exit {
    animation: fadeOutBackdrop ${BACKDROP_EXIT_DURATION}ms ease-in forwards;
  }
  .modal-content-enter {
    animation: slideInContent ${CONTENT_ENTER_DURATION}ms cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
    will-change: transform, opacity;
  }
  .modal-content-exit {
    animation: slideOutContent ${CONTENT_EXIT_DURATION}ms cubic-bezier(0.36, 0, 0.66, -0.56) forwards;
    animation-delay: ${CONTENT_EXIT_DELAY}ms;
    will-change: transform, opacity;
  }
  .modal-close-button {
    transition: border-color 200ms ease, background-color 200ms ease, color 200ms ease, transform 200ms ease;
  }
  .modal-close-button:hover {
    border-color: ${ACCENT_COLOR};
    color: #ffffff;
    background-color: rgba(0, 0, 0, 0.85);
    transform: scale(1.05);
  }
  .modal-close-button:focus-visible {
    outline: 2px solid ${ACCENT_COLOR};
    outline-offset: 2px;
  }
`;

if (typeof document !== 'undefined') {
  const existingStyle = document.getElementById('ios-modal-style');
  if (!existingStyle) {
    const styleEl = document.createElement('style');
    styleEl.id = 'ios-modal-style';
    styleEl.textContent = styles;
    document.head.appendChild(styleEl);
  }
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
    // Espera la animación: delay del contenido + duración del slide
    setTimeout(() => {
      onClose();
    }, TOTAL_EXIT_DURATION);
  };

  if (!mounted && !isOpen) return null;

  const containerStyle: CSSProperties = {
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
      <div
        className={isClosing ? 'modal-backdrop-exit' : 'modal-backdrop-enter'}
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 9998,
          backgroundColor: 'rgba(0, 0, 0, 0.93)',
          willChange: 'opacity',
          transform: 'translateZ(0)',
        }}
        onClick={handleClose}
      />

      <div 
        style={containerStyle}
        onClick={handleClose}
      >
        <div
          className={`relative w-full max-w-md pointer-events-auto ${isClosing ? 'modal-content-exit' : 'modal-content-enter'}`}
          onClick={(e) => e.stopPropagation()}
        >
          <div
            className="ios-modal-surface relative overflow-hidden rounded-[32px] border border-white/5 text-white shadow-[0_30px_80px_rgba(0,0,0,0.75)]"
            style={{
              backgroundColor: '#040404',
              backgroundImage: ` url('/modal.bg.webp')`,
              backgroundSize: 'auto, auto, cover',
              backgroundPosition: 'center',
              backgroundRepeat: 'repeat, no-repeat, no-repeat',
            }}
          >
            <div
              className="pointer-events-none absolute inset-0"
              style={{
                boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.08), inset 0 -40px 80px rgba(0,0,0,0.85)',
              }}
            />
            <div 
              className="relative w-full overflow-y-auto scrollbar-hide"
              style={{
                maxHeight: 'calc(100vh - 4rem)',
              }}
            >
              <div 
                className="relative px-6 pt-8 pb-5 border-b border-white/5"
              >
                <h2 
                  className="modal-title text-lg font-semibold uppercase text-[#53ff94] pr-12"
                >
                  {title}
                </h2>
                <div className="mt-4 h-px w-full bg-gradient-to-r from-white/50 via-white/10 to-transparent" />
                <button
                  onClick={handleClose}
                  aria-label="Cerrar"
                  className="modal-close-button absolute top-6 right-6 flex h-9 w-9 items-center justify-center"
                >
                  <img src="/x.svg" alt="Cerrar" className="h-4 w-4" />
                </button>
              </div>
              <div className="px-6 py-6">
                {children}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default memo(IOSModalComponent);
