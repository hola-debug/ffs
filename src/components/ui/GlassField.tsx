import React from 'react';
import GlassSurface, { GlassSurfaceProps } from '../GlassSurface';

type GlassFieldProps = Omit<GlassSurfaceProps, 'children'> & {
  children: React.ReactNode;
};

export default function GlassField({
  children,
  className = '',
  innerClassName = '',
  innerStyle = {},
  style = {},
  width = '100%',
  height = 'auto',
  borderRadius = 18,
  borderWidth = 0.08,
  brightness = 18,
  opacity = 0.95,
  blur = 18,
  displace = 0.8,
  backgroundOpacity = 0.35,
  saturation = 1.4,
  distortionScale = -140,
  ...rest
}: GlassFieldProps) {
  return (
    <GlassSurface
      width={width}
      height={height}
      borderRadius={borderRadius}
      borderWidth={borderWidth}
      brightness={brightness}
      opacity={opacity}
      blur={blur}
      displace={displace}
      backgroundOpacity={backgroundOpacity}
      saturation={saturation}
      distortionScale={distortionScale}
      className={`w-full ${className}`.trim()}
      style={{
        border: '1px solid rgba(255, 255, 255, 0.18)',
        boxShadow: `
          0 20px 45px rgba(3, 7, 18, 0.45),
          0 2px 8px rgba(255, 255, 255, 0.1),
          inset 0 1px 0 rgba(255, 255, 255, 0.25),
          inset 0 -1px 0 rgba(15, 23, 42, 0.45)
        `,
        ...style
      }}
      innerClassName={`w-full ${innerClassName}`.trim()}
      innerStyle={{
        width: '100%',
        padding: '12px 16px',
        ...innerStyle
      }}
      {...rest}
    >
      {children}
    </GlassSurface>
  );
}
