import * as Dialog from '@radix-ui/react-dialog';
import { motion, AnimatePresence } from 'framer-motion';
import { XMarkIcon } from '@heroicons/react/24/outline';

interface SheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  side?: 'left' | 'right' | 'top' | 'bottom';
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
}

const sizeClasses = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-xl',
  full: 'max-w-full',
};

const slideVariants = {
  right: {
    initial: { x: '100%' },
    animate: { x: 0 },
    exit: { x: '100%' },
  },
  left: {
    initial: { x: '-100%' },
    animate: { x: 0 },
    exit: { x: '-100%' },
  },
  top: {
    initial: { y: '-100%' },
    animate: { y: 0 },
    exit: { y: '-100%' },
  },
  bottom: {
    initial: { y: '100%' },
    animate: { y: 0 },
    exit: { y: '100%' },
  },
};

const positionClasses = {
  right: 'inset-y-0 right-0',
  left: 'inset-y-0 left-0',
  top: 'inset-x-0 top-0',
  bottom: 'inset-x-0 bottom-0',
};

export function Sheet({
  open,
  onOpenChange,
  title,
  description,
  children,
  side = 'right',
  size = 'md',
}: SheetProps) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <AnimatePresence>
        {open && (
          <Dialog.Portal forceMount>
            {/* Overlay */}
            <Dialog.Overlay asChild>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
              />
            </Dialog.Overlay>

            {/* Content */}
            <Dialog.Content asChild>
              <motion.div
                initial={slideVariants[side].initial}
                animate={slideVariants[side].animate}
                exit={slideVariants[side].exit}
                transition={{
                  type: 'spring',
                  damping: 30,
                  stiffness: 300,
                }}
                className={`
                  fixed ${positionClasses[side]} ${sizeClasses[size]}
                  w-full h-full
                  bg-gradient-to-br from-gray-900 via-gray-900 to-gray-800
                  shadow-2xl
                  z-50
                  flex flex-col
                `}
              >
                {/* Header */}
                <div className="flex items-start justify-between p-6 border-b border-gray-800">
                  <div className="flex-1">
                    <Dialog.Title className="text-2xl font-bold text-white mb-1">
                      {title}
                    </Dialog.Title>
                    {description && (
                      <Dialog.Description className="text-sm text-gray-400">
                        {description}
                      </Dialog.Description>
                    )}
                  </div>
                  <Dialog.Close asChild>
                    <button
                      className="
                        ml-4 p-2 rounded-lg
                        text-gray-400 hover:text-white
                        bg-gray-800/50 hover:bg-gray-800
                        transition-all duration-200
                        focus:outline-none focus:ring-2 focus:ring-blue-500
                      "
                      aria-label="Cerrar"
                    >
                      <XMarkIcon className="w-5 h-5" />
                    </button>
                  </Dialog.Close>
                </div>

                {/* Body */}
                <div className="flex-1 overflow-y-auto p-6">
                  {children}
                </div>
              </motion.div>
            </Dialog.Content>
          </Dialog.Portal>
        )}
      </AnimatePresence>
    </Dialog.Root>
  );
}

// Componente auxiliar para el footer de acciones
export function SheetFooter({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex gap-3 pt-6 mt-6 border-t border-gray-800">
      {children}
    </div>
  );
}

// Botones estilizados para usar en el Sheet
export function SheetButton({
  children,
  variant = 'primary',
  onClick,
  disabled,
  type = 'button',
}: {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'danger';
  onClick?: () => void;
  disabled?: boolean;
  type?: 'button' | 'submit';
}) {
  const variants = {
    primary: 'bg-blue-600 hover:bg-blue-700 text-white',
    secondary: 'bg-gray-700 hover:bg-gray-600 text-white',
    danger: 'bg-red-600 hover:bg-red-700 text-white',
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`
        flex-1 px-4 py-2.5 rounded-lg font-medium
        transition-all duration-200
        focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900
        disabled:opacity-50 disabled:cursor-not-allowed
        ${variants[variant]}
      `}
    >
      {children}
    </button>
  );
}

// Input estilizado para usar en el Sheet
export function SheetInput({
  label,
  error,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
  error?: string;
}) {
  return (
    <div className="space-y-2">
      {label && (
        <label className="block text-sm font-medium text-gray-300">
          {label}
        </label>
      )}
      <input
        {...props}
        className={`
          w-full px-4 py-2.5 rounded-lg
          bg-gray-800 border
          ${error ? 'border-red-500' : 'border-gray-700 focus:border-blue-500'}
          text-white placeholder-gray-500
          focus:outline-none focus:ring-2
          ${error ? 'focus:ring-red-500' : 'focus:ring-blue-500'}
          transition-all duration-200
        `}
      />
      {error && (
        <p className="text-sm text-red-400">{error}</p>
      )}
    </div>
  );
}

// Select estilizado para usar en el Sheet
export function SheetSelect({
  label,
  error,
  children,
  ...props
}: React.SelectHTMLAttributes<HTMLSelectElement> & {
  label?: string;
  error?: string;
}) {
  return (
    <div className="space-y-2">
      {label && (
        <label className="block text-sm font-medium text-gray-300">
          {label}
        </label>
      )}
      <select
        {...props}
        className={`
          w-full px-4 py-2.5 rounded-lg
          bg-gray-800 border
          ${error ? 'border-red-500' : 'border-gray-700 focus:border-blue-500'}
          text-white
          focus:outline-none focus:ring-2
          ${error ? 'focus:ring-red-500' : 'focus:ring-blue-500'}
          transition-all duration-200
        `}
      >
        {children}
      </select>
      {error && (
        <p className="text-sm text-red-400">{error}</p>
      )}
    </div>
  );
}
