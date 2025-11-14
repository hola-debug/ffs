import { AnimatePresence, motion } from 'motion/react';
import { Suspense, useEffect, useState } from 'react';
import BlurText from '../BlurText';
import Beams from '../Beams';

type FFSPreloaderProps = {
  allowExit?: boolean;
  onFinish?: () => void;
};

const letters = [
  { char: 'F', launch: { x: -160, y: -40, scale: 1.7, opacity: 0, rotateZ: -12 } },
  { char: 'F', launch: { x: 0, y: -190, scale: 2.4, opacity: 0, rotateZ: 0 } },
  { char: 'S', launch: { x: 160, y: -40, scale: 1.7, opacity: 0, rotateZ: 12 } }
];

const shards = [
  { id: 'shard-1', x: -220, y: -90, rotate: -28, delay: 0, scale: 1.2 },
  { id: 'shard-2', x: 160, y: -110, rotate: 18, delay: 0.04, scale: 1 },
  { id: 'shard-3', x: -120, y: 30, rotate: -12, delay: 0.08, scale: 1 },
  { id: 'shard-4', x: 140, y: 60, rotate: 14, delay: 0.12, scale: 1.1 },
  { id: 'shard-5', x: -40, y: -30, rotate: 2, delay: 0.1, scale: 1.4 },
  { id: 'shard-6', x: 200, y: 10, rotate: 26, delay: 0.16, scale: 0.9 }
];

const easing = [0.16, 1, 0.3, 1];

export default function FFSPreloader({ allowExit = false, onFinish }: FFSPreloaderProps) {
  const [phase, setPhase] = useState<'intro' | 'launch' | 'burst' | 'shatter'>('intro');
  const [shatterTriggered, setShatterTriggered] = useState(false);
  const [showBeams, setShowBeams] = useState(false);

  useEffect(() => {
    setShowBeams(true);
  }, []);

  useEffect(() => {
    if (phase !== 'launch') return;
    const timer = setTimeout(() => setPhase('burst'), 1150);
    return () => clearTimeout(timer);
  }, [phase]);

  useEffect(() => {
    if (phase !== 'burst' || !allowExit || shatterTriggered) return;
    const timer = setTimeout(() => {
      setShatterTriggered(true);
      setPhase('shatter');
    }, 380);
    return () => clearTimeout(timer);
  }, [phase, allowExit, shatterTriggered]);

  useEffect(() => {
    if (phase !== 'shatter') return;
    const timer = setTimeout(() => {
      onFinish?.();
    }, 900);
    return () => clearTimeout(timer);
  }, [phase, onFinish]);

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-gradient-to-br from-[#05060a] via-[#0a0f1c] to-[#020409] text-white">
      {showBeams && (
        <div className="absolute inset-0 -z-10 pointer-events-none">
          <Suspense fallback={<div className="h-full w-full bg-black" />}>
            <Beams
              beamNumber={14}
              beamHeight={18}
              beamWidth={1.6}
              speed={2.25}
              noiseIntensity={1.35}
              scale={0.22}
              rotation={-12}
              lightColor="#6f75ff"
            />
          </Suspense>
        </div>
      )}

      <div className="pointer-events-none absolute inset-0 opacity-40 blur-3xl" aria-hidden>
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
      </div>

      <motion.div
        className="absolute inset-0 pointer-events-none"
        initial={{ opacity: 0 }}
        animate={{ opacity: [0.15, 0.3, 0.15] }}
        transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
        style={{
          background: 'radial-gradient(circle at 20% 20%, rgba(96,165,250,0.3), transparent 55%)'
        }}
        aria-hidden
      />

      <AnimatePresence mode="wait">
        {phase === 'intro' && (
          <motion.div
            key="intro"
            initial={{ opacity: 0, scale: 0.94 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.6, ease: easing }}
            className="relative z-10"
          >
            <BlurText
              text="F F S"
              animateBy="letters"
              delay={160}
              direction="top"
              className="text-6xl font-semibold tracking-[1.5rem] sm:text-7xl"
              stepDuration={0.42}
              onAnimationComplete={() => setPhase('launch')}
            />
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {phase === 'launch' && (
          <motion.div
            key="launch"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, scale: 1.1 }}
            transition={{ duration: 0.45 }}
            className="relative z-20 h-32 w-72"
            style={{ perspective: '1200px' }}
          >
            {letters.map((letter, index) => (
              <motion.span
                key={`${letter.char}-${index}`}
                className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-6xl font-semibold tracking-[1rem] sm:text-7xl"
                initial={{ x: 0, y: 0, scale: 1, opacity: 1, rotateX: 0, rotateY: 0, rotateZ: 0 }}
                animate={{
                  ...letter.launch,
                  rotateX: -18,
                  rotateY: index === 0 ? -18 : index === 2 ? 18 : 0,
                  boxShadow: '0px 25px 60px rgba(10, 13, 40, 0.6)'
                }}
                transition={{
                  duration: 1.25,
                  ease: easing,
                  delay: index * 0.05
                }}
                style={{
                  textShadow: '0 18px 45px rgba(0,0,0,0.5)'
                }}
              >
                {letter.char}
              </motion.span>
            ))}

            <motion.div
              className="absolute inset-0 mx-auto flex items-center justify-center"
              initial={{ opacity: 0 }}
              animate={{ opacity: [0, 0.8, 0], scale: [0.9, 1.3, 1.9] }}
              transition={{ duration: 1.1, ease: 'easeOut' }}
            >
              <div className="h-28 w-28 rounded-full border border-white/20 blur-sm" />
            </motion.div>
            <motion.div
              className="absolute inset-0"
              initial={{ opacity: 0 }}
              animate={{ opacity: [0, 0.65, 0], scale: [0.6, 1.4, 2.05] }}
              transition={{ duration: 1.2, ease: easing }}
              style={{
                background:
                  'radial-gradient(circle, rgba(124, 58, 237, 0.25) 35%, rgba(15, 6, 25, 0) 70%)'
              }}
            />
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {phase === 'burst' && (
          <motion.div
            key="burst"
            className="relative z-30 h-32 w-72"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.35 }}
          >
            <motion.div
              className="absolute left-1/2 top-1/2 h-8 w-8 -translate-x-1/2 -translate-y-1/2 rounded-full bg-gradient-to-r from-white via-[#a5b4fc] to-transparent"
              initial={{ scale: 0, opacity: 0.9 }}
              animate={{ scale: [0, 3.2, 9], opacity: [0.9, 0.5, 0] }}
              transition={{
                duration: 1.2,
                ease: easing,
                repeat: allowExit ? 0 : Infinity,
                repeatDelay: 0.7
              }}
            />
            <motion.div
              className="absolute left-1/2 top-1/2 h-3 w-36 -translate-x-1/2 -translate-y-1/2 rounded-full bg-gradient-to-r from-transparent via-white to-transparent blur"
              initial={{ scaleX: 0, opacity: 0 }}
              animate={{ scaleX: [0, 1, 1.9], opacity: [0, 1, 0] }}
              transition={{
                duration: 0.9,
                ease: easing,
                repeat: allowExit ? 0 : Infinity,
                repeatDelay: 0.65
              }}
            />
            <motion.div
              className="absolute inset-0"
              initial={{ opacity: 0 }}
              animate={{ opacity: [0, 0.7, 0], scale: [1, 1.4, 2] }}
              transition={{
                duration: 1.05,
                ease: easing,
                repeat: allowExit ? 0 : Infinity,
                repeatDelay: 0.75
              }}
              style={{
                background:
                  'radial-gradient(circle, rgba(250, 250, 250, 0.4), rgba(3, 4, 8, 0))'
              }}
            />
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {phase === 'shatter' && (
          <motion.div
            key="shatter"
            className="relative z-40 h-48 w-full max-w-xl"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            {shards.map(shard => (
              <motion.div
                key={shard.id}
                className="absolute left-1/2 top-1/2 h-10 w-28 -translate-x-1/2 -translate-y-1/2 rounded-2xl bg-gradient-to-r from-white/90 via-white/60 to-transparent shadow-xl"
                initial={{ scale: 0.7, opacity: 0.85, x: 0, y: 0, rotate: 0 }}
                animate={{
                  x: shard.x,
                  y: shard.y,
                  rotate: shard.rotate,
                  scale: shard.scale,
                  opacity: [0.85, 0.6, 0]
                }}
                transition={{ duration: 0.9, ease: 'easeInOut', delay: shard.delay }}
              />
            ))}
            <motion.div
              className="absolute inset-0"
              initial={{ opacity: 0 }}
              animate={{ opacity: [0, 0.85, 0], scale: [1, 1.15, 1.4] }}
              transition={{ duration: 0.9, ease: easing }}
              style={{
                background: 'radial-gradient(circle, rgba(5, 6, 10, 0), rgba(5, 6, 10, 1))'
              }}
            />
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {phase === 'shatter' && (
          <motion.div
            key="shatter-overlay"
            className="absolute inset-0 bg-gradient-to-b from-[#020308]/0 via-[#01020a]/80 to-[#010104]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 1 }}
            transition={{ duration: 0.8, ease: easing }}
          />
        )}
      </AnimatePresence>

      <motion.p
        className="relative z-20 mt-12 text-sm uppercase tracking-[0.45em] text-white/60"
        initial={{ opacity: 0 }}
        animate={{ opacity: phase === 'shatter' ? 0 : 1 }}
        transition={{ delay: 0.4, duration: 0.8 }}
      >
        iniciando experiencia
      </motion.p>
    </div>
  );
}
