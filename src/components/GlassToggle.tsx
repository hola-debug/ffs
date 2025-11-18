import { ButtonHTMLAttributes } from 'react';

interface GlassToggleProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  label: string;
  value: boolean;
  onChange: (nextValue: boolean) => void;
  activeLabel?: string;
  inactiveLabel?: string;
  descriptionOn?: string;
  descriptionOff?: string;
  className?: string;
}

const baseButtonClasses =
  'w-full text-left rounded-[20px] border px-5 py-4 transition-all flex items-center justify-between';

export const GlassToggle = ({
  label,
  value,
  onChange,
  activeLabel,
  inactiveLabel,
  descriptionOn,
  descriptionOff,
  className = '',
  ...buttonProps
}: GlassToggleProps) => {
  const handleToggle = () => {
    onChange(!value);
  };

  const textLabel = value ? activeLabel || label : inactiveLabel || label;
  const description = value ? descriptionOn : descriptionOff;

  return (
    <button
      type="button"
      onClick={handleToggle}
      className={`${baseButtonClasses} ${
        value
          ? 'border-[#67F690] bg-black/70 text-white shadow-[0_20px_45px_rgba(0,0,0,0.65)]'
          : 'border-white/12 bg-black/40 text-white/70 hover:border-white/30'
      } ${className}`}
      {...buttonProps}
    >
      <div>
        <p className="font-monda text-[11px] tracking-[0.35em] uppercase">{textLabel}</p>
        {description && (
          <p className="font-roboto text-[11px] text-white/60 mt-1">
            {description}
          </p>
        )}
      </div>
      <span
        className={`ml-3 flex h-7 w-12 items-center rounded-full border px-1 transition-all ${
          value
            ? 'bg-[#67F690] border-[#67F690] justify-end text-black shadow-[0_0_15px_rgba(103,246,144,0.45)]'
            : 'bg-black/20 border-white/15 justify-start text-white/60'
        }`}
      >
        <span className="h-5 w-5 rounded-full bg-white/90" />
      </span>
    </button>
  );
};

export default GlassToggle;
