import { InputHTMLAttributes, ReactNode, SelectHTMLAttributes, forwardRef } from 'react';

interface BaseFieldProps {
  label?: string;
  error?: string;
}

type InputProps = BaseFieldProps & InputHTMLAttributes<HTMLInputElement>;
type SelectProps = BaseFieldProps & SelectHTMLAttributes<HTMLSelectElement> & {
  children: ReactNode;
};

const GlassField = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, className = '', ...props }, ref) => {
    return (
      <div>
        {label && (
          <label 
            className="block text-sm font-medium text-white/80 mb-2"
          >
            {label}
          </label>
        )}
        <div className="rounded-xl border border-white/10 bg-neutral-950/70 transition-all focus-within:border-white/40 focus-within:ring-2 focus-within:ring-indigo-500/40">
          <input
            ref={ref}
            className={`w-full bg-transparent border-none outline-none px-4 py-3 text-white placeholder:text-white/40 text-base ${className}`}
            {...props}
          />
        </div>
        {error && (
          <span className="text-red-400 text-sm mt-1 block">{error}</span>
        )}
      </div>
    );
  }
);

GlassField.displayName = 'GlassField';

export const GlassSelect = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, className = '', children, ...props }, ref) => {
    return (
      <div>
        {label && (
          <label 
            className="block text-sm font-medium text-white/80 mb-2"
          >
            {label}
          </label>
        )}
        <div className="rounded-xl border border-white/10 bg-neutral-950/70 transition-all focus-within:border-white/40 focus-within:ring-2 focus-within:ring-indigo-500/40">
          <select
            ref={ref}
            className={`w-full bg-transparent border-none outline-none px-4 py-3 text-white placeholder:text-white/40 text-base appearance-none ${className}`}
            style={{
              WebkitAppearance: 'none',
              MozAppearance: 'none',
              backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8' fill='none'%3E%3Cpath d='M1 1.5L6 6.5L11 1.5' stroke='rgba(255,255,255,0.7)' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E")`,
              backgroundRepeat: 'no-repeat',
              backgroundPosition: 'right 14px center',
              paddingRight: '40px',
            }}
            {...props}
          >
            {children}
          </select>
        </div>
        {error && (
          <span className="text-red-400 text-sm mt-1 block">{error}</span>
        )}
      </div>
    );
  }
);

GlassSelect.displayName = 'GlassSelect';

export default GlassField;
