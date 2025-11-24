import { motion } from 'motion/react';
import { Suspense, useEffect, useState } from 'react';
import BlurText from '../BlurText';
import Beams from '../Beams';

type FFSPreloaderProps = {
  allowExit?: boolean;
  onFinish?: () => void;
};

// Apple-inspired easing curves
// These create the signature smooth, natural feel of Apple animations
const appleEasing = 'easeInOut'; // Smooth, refined transitions
const appleSpring = [0.16, 1, 0.3, 1] as const; // Gentle spring effect

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
      exit={{
        opacity: 0,
        scale: 0.98, // Subtle scale for Apple-like exit
        filter: 'blur(8px)' // Gentle blur on exit
      }}
      transition={{
        duration: 0.6,
        ease: appleEasing
      }}
    >
      {/* Animated Beams Background */}
      {showBeams && (
        <motion.div
          className="absolute inset-0 pointer-events-none"
          style={{ zIndex: 0 }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{
            duration: 1.4,
            ease: appleEasing,
            delay: 0.1
          }}
        >
          <Suspense fallback={<div className="h-full w-full bg-black" />}>
            <Beams
              beamNumber={1}
              beamHeight={1000}
              beamWidth={1000}
              speed={1.8} // Slightly slower for elegance
              noiseIntensity={1.8}
              scale={0.85}
              rotation={360}
              lightColor="#6f75ff"
            />
          </Suspense>
        </motion.div>
      )}

      {/* Ambient Gradient Orbs */}
      <motion.div
        className="pointer-events-none absolute inset-0 opacity-40 blur-3xl"
        aria-hidden
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.4 }}
        transition={{
          duration: 1.2,
          ease: appleEasing,
          delay: 0.2
        }}
      >
        {/* Blue orb - top left */}
        <motion.div
          className="absolute -left-20 top-10 h-64 w-64 rounded-full bg-[#2f7cff]"
          animate={{
            y: [0, -25, 0],
            opacity: [0.3, 0.55, 0.3],
            scale: [1, 1.05, 1]
          }}
          transition={{
            duration: 6,
            repeat: Infinity,
            ease: appleEasing
          }}
        />

        {/* Purple orb - bottom right */}
        <motion.div
          className="absolute right-[-40px] bottom-10 h-72 w-72 rounded-full bg-[#5b2dff]"
          animate={{
            y: [0, 35, 0],
            x: [0, -20, 0],
            opacity: [0.25, 0.6, 0.25],
            scale: [1, 1.08, 1]
          }}
          transition={{
            duration: 7,
            repeat: Infinity,
            ease: appleEasing
          }}
        />
      </motion.div>

      {/* Radial Gradient Overlay */}
      <motion.div
        className="absolute inset-0 pointer-events-none"
        initial={{ opacity: 0 }}
        animate={{ opacity: [0.12, 0.28, 0.12] }}
        transition={{
          duration: 9,
          repeat: Infinity,
          ease: appleEasing,
          delay: 0.6
        }}
        style={{
          background: 'radial-gradient(circle at 20% 20%, rgba(96,165,250,0.25), transparent 60%)'
        }}
        aria-hidden
      />

      {/* Main Logo Text */}
      <motion.div
        className="relative z-10"
        initial={{
          opacity: 0,
          scale: 0.92,
          y: 10
        }}
        animate={{
          opacity: 1,
          scale: 1,
          y: 0
        }}
        transition={{
          duration: 1,
          ease: appleSpring,
          delay: 0.4
        }}
      >
        <BlurText
          text="F F S"
          animateBy="letters"
          delay={180} // Slightly slower for elegance
          direction="top"
          className="text-6xl font-bold font-monda tracking-[1.5rem] sm:text-8xl md:text-9xl"
          stepDuration={0.5} // Smoother letter transitions
        />
      </motion.div>

      {/* Subtle bottom accent */}
      <motion.div
        className="absolute bottom-12 left-1/2 -translate-x-1/2"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: [0, 0.4, 0], y: 0 }}
        transition={{
          duration: 2.5,
          ease: appleEasing,
          delay: 1.2,
          repeat: Infinity,
          repeatDelay: 0.5
        }}
      >
        <div className="h-1 w-16 rounded-full bg-gradient-to-r from-transparent via-blue-400/50 to-transparent" />
      </motion.div>
    </motion.div>
  );
}
