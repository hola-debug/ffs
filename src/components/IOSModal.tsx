import { ReactNode, useEffect } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import GlassSurface from './GlassSurface';
import GlassField, { GlassSelect } from './GlassField';

export { GlassField, GlassSelect };

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

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop con blur y oscuridad */}
      <div
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
        <div
          className="relative w-full max-w-md pointer-events-auto"
          style={{
            maxHeight: 'calc(100vh - 2rem)',
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Glass Surface Container */}
          <div>
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
              className="w-full overflow-y-auto scrollbar-hide"
              style={{
                maxHeight: 'calc(100vh - 4rem)',
              }}
            >
              {/* Header */}
              <div 
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
