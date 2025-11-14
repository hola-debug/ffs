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
      image: '/AGGREGAR INGRESO.png',
      link: '#agregar-ingreso'
    },
    {
      image: '/AGRREGAR CUENTAS.png',
      link: '#agregar-cuentas'
    },
    {
      image: '/AYUDA.png',
      link: '#ayuda'
    },
    {
      image: '/CREAR BOLSAS.png',
      link: '#crear-bolsas'
    },
    {
      image: '/NUEVO GASTO.png',
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
