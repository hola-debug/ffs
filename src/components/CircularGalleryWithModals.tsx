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

export default function CircularGalleryWithModals({
  bend = 3,
  textColor = '#ffffff',
  borderRadius = 0.05,
  font = 'bold 30px Figtree',
  scrollSpeed = 2,
  scrollEase = 0.05,
  onCardClick
}: CircularGalleryWithModalsProps) {

  // Define gallery items with their corresponding modals
  const galleryItems = [
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
  ];

  const handleCardClickInternal = (link: string) => {
    const modalId = link.replace('#', '');
    onCardClick?.(modalId);
  };

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
