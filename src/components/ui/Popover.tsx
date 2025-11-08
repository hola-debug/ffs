import * as PopoverPrimitive from '@radix-ui/react-popover';
import { motion, AnimatePresence } from 'framer-motion';

interface PopoverProps {
  trigger: React.ReactNode;
  children: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  side?: 'top' | 'right' | 'bottom' | 'left';
  align?: 'start' | 'center' | 'end';
}

export function Popover({
  trigger,
  children,
  open,
  onOpenChange,
  side = 'bottom',
  align = 'end',
}: PopoverProps) {
  return (
    <PopoverPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <PopoverPrimitive.Trigger asChild>
        {trigger}
      </PopoverPrimitive.Trigger>

      <AnimatePresence>
        {open && (
          <PopoverPrimitive.Portal forceMount>
            <PopoverPrimitive.Content
              side={side}
              align={align}
              sideOffset={8}
              asChild
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: -10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: -10 }}
                transition={{ duration: 0.15, ease: 'easeOut' }}
                className="
                  p-4
                  w-[320px] max-w-[90vw]
                  bg-[#FFFFFF]/10 backdrop-blur-xl
                  rounded-[20px]
                  z-[9999]
                  outline-none
                "
              >
                {children}
                <PopoverPrimitive.Arrow className="          bg-[#FFFFFF]/10 backdrop-blur-xl" />
              </motion.div>
            </PopoverPrimitive.Content>
          </PopoverPrimitive.Portal>
        )}
      </AnimatePresence>
    </PopoverPrimitive.Root>
  );
}

// Componentes auxiliares para usar dentro del Popover
export function PopoverTitle({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="text-sm font-semibold text-[#ffffff] mb-3">
      {children}
    </h3>
  );
}

export function PopoverSection({ children }: { children: React.ReactNode }) {
  return <div className="space-y-2">{children}</div>;
}

export function PopoverOption({
  selected,
  onClick,
  title,
  description,
  badge,
}: {
  selected: boolean;
  onClick: () => void;
  title: string;
  description?: string;
  badge?: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`
        w-full text-left p-3 rounded-lg
        transition-all duration-200
        border
        ${
          selected
            ? 'bg-black-500/20 text-white'
            : 'bg-black-800/50 border-none text-white '
        }
      `}
    >
      <div className="flex items-center justify-between mb-1">
        <span className="font-medium text-sm">{title}</span>
        {badge && (
          <span className="text-xs px-2 py-0.5 rounded  text-white">
            {badge}
          </span>
        )}
      </div>
      {description && (
        <p className="text-xs text-white leading-snug">{description}</p>
      )}
    </button>
  );
}

export function PopoverInput({
  label,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & { label?: string }) {
  return (
    <div className="space-y-1.5">
      {label && <label className="text-xs font-medium text-white">{label}</label>}
      <input
        {...props}
        className="
          w-full px-3 py-2 text-sm
          bg-black/10 border-none
          text-white placeholder-gray-500
          rounded-lg
          focus:outline-none focus:ring-none focus:ring-blue-none focus:border-transparent
          transition-all
        "
      />
    </div>
  );
}

export function PopoverActions({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex  mt-2 gap-1">
      {children}
    </div>
  );
}

export function PopoverButton({
  children,
  variant = 'primary',
  onClick,
  disabled,
  type = 'button',
}: {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary';
  onClick?: () => void;
  disabled?: boolean;
  type?: 'button' | 'submit';
}) {
  const variants = {
    primary: 'bg-[#00D73D] hover:bg-[#00D73D/50] text-white text-bold',
    secondary: 'bg-[#0076D7] hover:bg-[#0076D7/50] text-white text-bold',
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`
        flex-1 px-3 py-1.5 text-sm font-bold rounded-lg
        transition-all
        disabled:opacity-50 disabled:cursor-not-allowed
        ${variants[variant]}
      `}
    >
      {children}
    </button>
  );
}
