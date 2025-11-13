import { ReactNode, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop con blur y oscuridad */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ 
              duration: 0.5,
              ease: [0.22, 1, 0.36, 1]
            }}
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: 9998,
              backgroundColor: 'rgba(0, 0, 0, 0.8)',
              backdropFilter: 'blur(2px)',
              WebkitBackdropFilter: 'blur(2px)',
            }}
            onClick={onClose}
          />

          {/* Modal Content */}
          <div 
            className="fixed inset-0 flex items-center justify-center p-4 z-[9999] pointer-events-none"
            onClick={onClose}
          >
            <motion.div
              initial={{ 
                opacity: 0, 
                scale: 0.9,
                y: 60
              }}
              animate={{ 
                opacity: 1, 
                scale: 1,
                y: 0
              }}
              exit={{ 
                opacity: 0, 
                scale: 0.95,
                y: 20
              }}
              transition={{
                duration: 0.6,
                ease: [0.22, 1, 0.36, 1],
                opacity: { duration: 0.5 },
                when: 'afterChildren'
              }}
              className="relative w-full max-w-md pointer-events-auto"
              style={{
                maxHeight: 'calc(100vh - 2rem)',
              }}
              onClick={(e) => e.stopPropagation()}
            >
          {/* Glass Surface Container con animación progresiva */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{
              duration: 0.4,
              delay: 0.2,
              ease: [0.22, 1, 0.36, 1],
              exit: { delay: 0.3, duration: 0.3 }
            }}
          >
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
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              transition={{
                duration: 0.5,
                delay: 0.35,
                ease: [0.22, 1, 0.36, 1],
                exit: { delay: 0.2, duration: 0.3 }
              }}
              className="w-full overflow-y-auto scrollbar-hide"
              style={{
                maxHeight: 'calc(100vh - 4rem)',
              }}
            >
              {/* Header */}
              <motion.div 
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{
                  duration: 0.5,
                  delay: 0.45,
                  ease: [0.22, 1, 0.36, 1],
                  exit: { delay: 0.1, duration: 0.25 }
                }}
                className="relative px-6 pt-6 pb-4 border-b border-white/10"
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
              </motion.div>
              
              {/* Content */}
              <motion.div 
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{
                  duration: 0.5,
                  delay: 0.5,
                  ease: [0.22, 1, 0.36, 1],
                  exit: { delay: 0, duration: 0.2 }
                }}
                className="px-6 py-6"
              >
                {children}
              </motion.div>
            </motion.div>
          </GlassSurface>
          </motion.div>
            </motion.div>
          </div>
          <style>{`
            /* Estilos personalizados para inputs y selects estilo iOS */
        .glass-control {
          width: 100% !important;
          border: none !important;
          background: transparent !important;
          color: white !important;
          font-size: 16px !important;
          font-weight: 500 !important;
          letter-spacing: 0.01em !important;
          line-height: 1.4 !important;
          font-family: 'SF Pro Display', 'Albert Sans', sans-serif !important;
          transition: color 0.2s ease, filter 0.2s ease !important;
        }

        .glass-control:focus {
          outline: none !important;
          color: rgba(255, 255, 255, 0.95) !important;
        }

        .glass-control::placeholder {
          color: rgba(255, 255, 255, 0.45) !important;
        }

        .glass-control:disabled {
          opacity: 0.45 !important;
          cursor: not-allowed !important;
        }

        .glass-control--select {
          appearance: none;
          -webkit-appearance: none;
          cursor: pointer;
          padding-right: 48px !important;
          background-image: url("data:image/svg+xml,%3Csvg width='24' height='24' viewBox='0 0 24 24' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M7 10L12 15L17 10' stroke='white' stroke-width='1.5' stroke-linecap='round'/%3E%3C/svg%3E") !important;
          background-repeat: no-repeat !important;
          background-position: right 12px center !important;
          background-size: 18px !important;
        }

        .glass-control[type="date"] {
          color-scheme: dark;
          padding-right: 12px !important;
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
      )}
    </AnimatePresence>
  );
}
