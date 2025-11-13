import { ReactNode } from 'react';

interface BaseCardProps {
  title?: string;
  className?: string;
  children: ReactNode;
  variant?: 'default' | 'primary' | 'success' | 'warning' | 'danger' | 'gradient' | 'solid';
  onClick?: () => void;
}

const variantStyles = {
  default: 'bg-gray-900',
  primary: 'bg-blue-900',
  success: 'bg-green-900',
  warning: 'bg-yellow-900',
  danger: 'bg-red-900',
  gradient: 'bg-gradient-to-br from-blue-900 to-blue-800',
  solid: 'bg-black',
};

export function BaseCard({ 
  title, 
  className = '', 
  children, 
  variant = 'default',
  onClick
}: BaseCardProps) {
  const variantClass = variantStyles[variant];

  return (
    <div 
      onClick={onClick}
      className={`${variantClass} rounded-lg p-2 sm:p-6 shadow-lg min-w-0 w-full box-border overflow-hidden ${className}`}
    >
      {title && <h2 className="text-xs sm:text-lg font-semibold mb-1 sm:mb-4 truncate">{title}</h2>}
      {children}
    </div>
  );
}
