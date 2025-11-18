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
      <div className="space-y-2">
        {label && (
          <label 
            className="block font-monda text-[10px] tracking-[0.35em] text-white/60 uppercase"
          >
            {label}
          </label>
        )}
        <div className="rounded-[20px] border border-white/12 bg-black/45 px-2 transition-all shadow-[0_18px_45px_rgba(0,0,0,0.55)] focus-within:border-[#67F690] focus-within:shadow-[0_25px_55px_rgba(0,0,0,0.65)]">
          <input
            ref={ref}
            className={`w-full bg-transparent border-none outline-none px-4 py-3 font-roboto text-[13px] tracking-[0.08em] text-white placeholder:text-white/30 ${className}`}
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
      <div className="space-y-2">
        {label && (
          <label 
            className="block font-monda text-[10px] tracking-[0.35em] text-white/60 uppercase"
          >
            {label}
          </label>
        )}
        <div className="rounded-[20px] border border-white/12 bg-black/45 px-2 transition-all shadow-[0_18px_45px_rgba(0,0,0,0.55)] focus-within:border-[#67F690] focus-within:shadow-[0_25px_55px_rgba(0,0,0,0.65)]">
          <select
            ref={ref}
            className={`w-full bg-transparent border-none outline-none px-4 py-3 font-roboto text-[13px] tracking-[0.08em] text-white appearance-none ${className}`}
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
