import { useEffect, useState } from 'react';

/**
 * Hook to preload images before they are needed
 * Returns loading state
 */
export function useImagePreload(imageUrls: string[]): boolean {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!imageUrls.length) {
      setIsLoading(false);
      return;
    }

    let mounted = true;
    const imagePromises = imageUrls.map((url) => {
      return new Promise<void>((resolve, reject) => {
        const img = new Image();
        img.decoding = 'async';
        
        img.onload = () => resolve();
        img.onerror = () => reject(new Error(`Failed to load image: ${url}`));
        
        img.src = url;
      });
    });

    Promise.allSettled(imagePromises).then(() => {
      if (mounted) {
        setIsLoading(false);
      }
    });

    return () => {
      mounted = false;
    };
  }, [imageUrls.join(',')]);

  return isLoading;
}
