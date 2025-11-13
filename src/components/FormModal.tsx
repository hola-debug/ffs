import { ReactNode } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';

interface FormModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
}

export default function FormModal({ isOpen, onClose, title, children }: FormModalProps) {
  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 flex items-center justify-center p-4 z-[9999]"
      style={{
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
      }}
      onClick={onClose}
    >
      <div 
        className="relative w-full max-w-md"
        style={{
          maxHeight: 'calc(100vh - 2rem)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className="bg-gray-900/95 rounded-xl p-6 w-full relative shadow-2xl overflow-y-auto"
          style={{
            border: '1px solid rgba(255, 255, 255, 0.1)',
            backdropFilter: 'blur(20px) saturate(1.8)',
            WebkitBackdropFilter: 'blur(20px) saturate(1.8)',
            boxShadow: `
              0 20px 60px rgba(0, 0, 0, 0.5),
              0 0 0 1px rgba(255, 255, 255, 0.05),
              inset 0 1px 0 rgba(255, 255, 255, 0.1)
            `,
            maxHeight: 'calc(100vh - 4rem)',
          }}
        >
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors z-10"
          >
            <XMarkIcon className="w-6 h-6" />
          </button>
          
          <h2 className="text-2xl font-bold mb-6 pr-8">{title}</h2>
          
          {children}
        </div>
      </div>
    </div>
  );
}
