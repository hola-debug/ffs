import type { ComponentType } from 'react';
import {
  AcademicCapIcon,
  BanknotesIcon,
  BoltIcon,
  BuildingLibraryIcon,
  CreditCardIcon,
  DevicePhoneMobileIcon,
  GiftIcon,
  GlobeAmericasIcon,
  HeartIcon,
  HomeModernIcon,
  RocketLaunchIcon,
  ShoppingBagIcon,
  SparklesIcon,
  WalletIcon,
} from '@heroicons/react/24/outline';

type IconComponent = ComponentType<{ className?: string }>;

export interface PocketIconOption {
  id: string;
  label: string;
  Icon: IconComponent;
}

export const POCKET_ICON_OPTIONS: PocketIconOption[] = [
  { id: 'wallet', label: 'Control general', Icon: WalletIcon },
  { id: 'banknotes', label: 'Finanzas', Icon: BanknotesIcon },
  { id: 'credit-card', label: 'Suscripciones', Icon: CreditCardIcon },
  { id: 'shopping-bag', label: 'Compras', Icon: ShoppingBagIcon },
  { id: 'sparkles', label: 'Estilo de vida', Icon: SparklesIcon },
  { id: 'bolt', label: 'Servicios', Icon: BoltIcon },
  { id: 'home-modern', label: 'Hogar', Icon: HomeModernIcon },
  { id: 'gift', label: 'Regalos', Icon: GiftIcon },
  { id: 'rocket-launch', label: 'Proyectos', Icon: RocketLaunchIcon },
  { id: 'globe-americas', label: 'Viajes', Icon: GlobeAmericasIcon },
  { id: 'academic-cap', label: 'Educación', Icon: AcademicCapIcon },
  { id: 'device-phone-mobile', label: 'Tecnología', Icon: DevicePhoneMobileIcon },
  { id: 'building-library', label: 'Impuestos', Icon: BuildingLibraryIcon },
  { id: 'heart', label: 'Bienestar', Icon: HeartIcon },
];

const OPTION_MAP = POCKET_ICON_OPTIONS.reduce<Record<string, PocketIconOption>>((acc, option) => {
  acc[option.id] = option;
  return acc;
}, {});


interface PocketIconProps {
  iconId?: string | null;
  className?: string;
  fallbackClassName?: string;
}

export const PocketIcon = ({ iconId, className = 'w-8 h-8', fallbackClassName }: PocketIconProps) => {
  const option = iconId ? OPTION_MAP[iconId] : undefined;
  const Icon = option?.Icon;

  if (Icon) {
    return <Icon className={className} aria-hidden="true" />;
  }

  if (iconId) {
    return (
      <span className={fallbackClassName || className} aria-hidden="true">
        {iconId}
      </span>
    );
  }

  return <WalletIcon className={className} aria-hidden="true" />;
};

export const getPocketIconLabel = (iconId?: string | null) => {
  if (!iconId) return '';
  const option = OPTION_MAP[iconId];
  return option ? option.label : iconId;
};
