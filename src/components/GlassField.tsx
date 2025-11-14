import { InputHTMLAttributes, SelectHTMLAttributes, forwardRef } from 'react';
import GlassSurface from './GlassSurface';

interface BaseFieldProps {
  label?: string;
  error?: string;
}

type InputProps = BaseFieldProps & InputHTMLAttributes<HTMLInputElement>;
type SelectProps = BaseFieldProps & SelectHTMLAttributes<HTMLSelectElement> & {
  children: React.ReactNode;
};

const GlassField = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, className = '', ...props }, ref) => {
    return (
      <div>
        {label && (
          <label 
            className="block text-sm font-medium mb-2"
            style={{ 
              color: 'rgba(255, 255, 255, 0.9)',
            }}
          >
            {label}
          </label>
        )}
        <GlassSurface
          width="100%"
          height="auto"
          borderRadius={12}
          borderWidth={0.08}
          brightness={60}
          opacity={0.4}
          blur={20}
          displace={1.5}
          backgroundOpacity={0.1}
          saturation={1.4}
          distortionScale={-150}
          xChannel="R"
          yChannel="G"
          mixBlendMode="screen"
          style={{
            boxShadow: `
              0 2px 10px rgba(0, 0, 0, 0.1),
              inset 0 1px 0 rgba(255, 255, 255, 0.15),
              inset 0 -1px 0 rgba(0, 0, 0, 0.1)
            `,
          }}
          redOffset={0}
          greenOffset={8}
          blueOffset={16}
       
       
        >
          <input
            ref={ref}
            className={`w-full bg-transparent border-none outline-none px-4 py-3 text-white ${className}`}
            style={{
              fontSize: '16px',
              fontWeight: 400,
            }}
            {...props}
          />
        </GlassSurface>
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
            className="block text-sm font-medium mb-2"
            style={{ 
              color: 'rgba(255, 255, 255, 0.9)',
              textShadow: '0 1px 2px rgba(0, 0, 0, 0.3)'
            }}
          >
            {label}
          </label>
        )}
        <GlassSurface
          width="100%"
          height="auto"
          borderRadius={12}
          borderWidth={0.08}
          brightness={60}
          opacity={0.4}
          blur={25}
          displace={1.5}
          backgroundOpacity={0.1}
          saturation={1.4}
          distortionScale={-200}
          redOffset={0}
          greenOffset={8}
          blueOffset={16}
          xChannel="R"
          yChannel="G"
          mixBlendMode="screen"
          style={{
            boxShadow: `
              0 2px 10px rgba(0, 0, 0, 0.1),
              inset 0 1px 0 rgba(255, 255, 255, 0.15),
              inset 0 -1px 0 rgba(0, 0, 0, 0.1)
            `,
          }}
        >
          <select
            ref={ref}
            className={`w-full bg-transparent border-none outline-none px-4 py-3 text-white ${className}`}
            style={{
              fontSize: '16px',
              fontWeight: 400,
              appearance: 'none',
              WebkitAppearance: 'none',
              MozAppearance: 'none',
              backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8' fill='none'%3E%3Cpath d='M1 1.5L6 6.5L11 1.5' stroke='rgba(255,255,255,0.7)' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E")`,
              backgroundRepeat: 'no-repeat',
              backgroundPosition: 'right 12px center',
              paddingRight: '36px',
            }}
            {...props}
          >
            {children}
          </select>
        </GlassSurface>
        {error && (
          <span className="text-red-400 text-sm mt-1 block">{error}</span>
        )}
      </div>
    );
  }
);

GlassSelect.displayName = 'GlassSelect';

export default GlassField;
