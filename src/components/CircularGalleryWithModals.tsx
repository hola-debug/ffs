import { memo, useCallback, useMemo } from 'react';
import CircularGallery from './CircularGallery';

interface CircularGalleryWithModalsProps {
  bend?: number;
  textColor?: string;
  borderRadius?: number;
  font?: string;
  scrollSpeed?: number;
  scrollEase?: number;
  onCardClick?: (modalId: string) => void;
}

function CircularGalleryWithModals({
  bend = 3,
  textColor = '#ffffff',
  borderRadius = 0.05,
  font = 'bold 30px Figtree',
  scrollSpeed = 2,
  scrollEase = 0.05,
  onCardClick
}: CircularGalleryWithModalsProps) {

  // Memoize gallery items to prevent recreation
  const galleryItems = useMemo(() => [
    {
      image: '/AGGREGAR INGRESO.webp',
      link: '#agregar-ingreso'
    },
    {
      image: '/AGRREGAR CUENTAS.webp',
      link: '#agregar-cuentas'
    },
    {
      image: '/AYUDA.webp',
      link: '#ayuda'
    },
    {
      image: '/CREAR BOLSAS.webp',
      link: '#crear-bolsas'
    },
    {
      image: '/NUEVO GASTO.webp',
      link: '#nuevo-gasto'
    }
  ], []);

  const handleCardClickInternal = useCallback((link: string) => {
    const modalId = link.replace('#', '');
    onCardClick?.(modalId);
  }, [onCardClick]);

  return (
    <CircularGallery
      items={galleryItems}
      bend={bend}
      textColor={textColor}
      borderRadius={borderRadius}
      font={font}
      scrollSpeed={scrollSpeed}
      scrollEase={scrollEase}
      onCardClick={handleCardClickInternal}
    />
  );
}

export default memo(CircularGalleryWithModals);
