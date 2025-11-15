import { motion } from 'motion/react';
import { Suspense, useEffect, useState } from 'react';
import BlurText from '../BlurText';
import Beams from '../Beams';

type FFSPreloaderProps = {
  allowExit?: boolean;
  onFinish?: () => void;
};

const easing = [0.16, 1, 0.3, 1];

export default function FFSPreloader({ allowExit = false, onFinish }: FFSPreloaderProps) {
  const [showBeams, setShowBeams] = useState(false);

  useEffect(() => {
    setShowBeams(true);
  }, []);

  useEffect(() => {
    if (allowExit) {
      onFinish?.();
    }
  }, [allowExit, onFinish]);

  return (
    <motion.div 
      className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-gradient-to-br from-[#05060a] via-[#0a0f1c] to-[#020409] text-white"
      initial={{ opacity: 1 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
    >
      {showBeams && (
        <motion.div 
          className="absolute inset-0 pointer-events-none" 
          style={{ zIndex: 0 }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1.2, ease: 'easeIn' }}
        >
          <Suspense fallback={<div className="h-full w-full bg-black" />}>
            <Beams
              beamNumber={1}
              beamHeight={1000}
              beamWidth={1000}
              speed={2}
              noiseIntensity={2}
              scale={0.8}
              rotation={360}
              lightColor="#6f75ff"
            />
          </Suspense>
        </motion.div>
      )}

      <motion.div 
        className="pointer-events-none absolute inset-0 opacity-40 blur-3xl" 
        aria-hidden
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.4 }}
        transition={{ duration: 1, ease: 'easeIn' }}
      >
        <motion.div
          className="absolute -left-20 top-10 h-64 w-64 rounded-full bg-[#2f7cff]"
          animate={{ y: [0, -20, 0], opacity: [0.35, 0.6, 0.35] }}
          transition={{ duration: 5.4, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          className="absolute right-[-40px] bottom-10 h-72 w-72 rounded-full bg-[#5b2dff]"
          animate={{ y: [0, 30, 0], x: [0, -15, 0], opacity: [0.3, 0.65, 0.3] }}
          transition={{ duration: 6.2, repeat: Infinity, ease: 'easeInOut' }}
        />
      </motion.div>

      <motion.div
        className="absolute inset-0 pointer-events-none"
        initial={{ opacity: 0 }}
        animate={{ opacity: [0.15, 0.3, 0.15] }}
        transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut', delay: 0.5 }}
        style={{
          background: 'radial-gradient(circle at 20% 20%, rgba(96,165,250,0.3), transparent 55%)'
        }}
        aria-hidden
      />

      <motion.div
        className="relative z-10"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.8, ease: easing, delay: 0.3 }}
      >
        <BlurText
          text="F F S"
          animateBy="letters"
          delay={160}
          direction="top"
          className="text-6xl font-semibold tracking-[1.5rem] sm:text-8xl md:text-9xl"
          stepDuration={0.42}
        />
      </motion.div>

      <motion.p
        className="relative z-20 mt-12 text-sm uppercase tracking-[0.45em] text-white/60"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8, duration: 0.6 }}
      >
        iniciando experiencia
      </motion.p>
    </motion.div>
  );
}
