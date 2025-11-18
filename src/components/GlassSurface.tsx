import type { CSSProperties, ReactNode } from 'react';

export interface GlassSurfaceProps {
  children?: ReactNode;
  width?: number | string;
  height?: number | string;
  borderRadius?: number;
  borderWidth?: number;
  brightness?: number;
  opacity?: number;
  blur?: number;
  displace?: number;
  backgroundOpacity?: number;
  saturation?: number;
  distortionScale?: number;
  redOffset?: number;
  greenOffset?: number;
  blueOffset?: number;
  xChannel?: 'R' | 'G' | 'B';
  yChannel?: 'R' | 'G' | 'B';
  mixBlendMode?:
    | 'normal'
    | 'multiply'
    | 'screen'
    | 'overlay'
    | 'darken'
    | 'lighten'
    | 'color-dodge'
    | 'color-burn'
    | 'hard-light'
    | 'soft-light'
    | 'difference'
    | 'exclusion'
    | 'hue'
    | 'saturation'
    | 'color'
    | 'luminosity'
    | 'plus-darker'
    | 'plus-lighter';
  className?: string;
  style?: CSSProperties;
}

/**
 * Keeps the same API as the previous glass implementation but renders
 * a simple, flat surface so we can iterate on a new design system
 * without touching every consumer.
 */
const GlassSurface = ({
  children,
  width = '100%',
  height = 'auto',
  borderRadius = 16,
  className = '',
  style = {}
}: GlassSurfaceProps) => {
  const resolvedStyle: CSSProperties = {
    width: typeof width === 'number' ? `${width}px` : width,
    height: typeof height === 'number' ? `${height}px` : height,
    borderRadius,
    ...style,
  };

  const baseClass = 'rounded-2xl border border-white/10 bg-neutral-950/90 text-white shadow-[0_15px_35px_rgba(0,0,0,0.35)]';

  return (
    <div className={`${baseClass} ${className}`.trim()} style={resolvedStyle}>
      {children}
    </div>
  );
};

export default GlassSurface;
