import { motion } from 'framer-motion';
import GlassSurface from '../GlassSurface';

interface ConfirmationToastProps {
    message: string;
    onConfirm: () => void;
    onCancel: () => void;
}

export function ConfirmationToast({ message, onConfirm, onCancel }: ConfirmationToastProps) {
    return (
        <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{
                opacity: 0,
                scale: 0.85,
                y: -20,
                transition: {
                    duration: 0.3,
                    ease: [0.4, 0, 1, 1]
                }
            }}
            transition={{
                type: 'spring',
                stiffness: 300,
                damping: 25,
                opacity: { duration: 0.2 }
            }}
            className="max-w-md mx-auto pointer-events-auto"
        >
            <GlassSurface
                width="100%"
                height="auto"
                borderRadius={16}
                brightness={40}
                opacity={0.95}
                blur={15}
                displace={8}
                distortionScale={-160}
                redOffset={10}
                greenOffset={8}
                blueOffset={12}
                mixBlendMode="screen"
                className="shadow-[0_0_30px_rgba(239,68,68,0.15)] relative overflow-hidden"
            >
                <div className="flex flex-col w-full px-4 py-3 gap-3">
                    {/* Message */}
                    <p className="text-white/95 text-sm font-medium text-center leading-relaxed">
                        {message}
                    </p>

                    {/* Buttons */}
                    <div className="flex gap-2 justify-center">
                        <button
                            onClick={onCancel}
                            className="px-4 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white/90 text-sm font-medium transition-colors"
                        >
                            Cancelar
                        </button>
                        <button
                            onClick={onConfirm}
                            className="px-4 py-1.5 rounded-lg bg-red-500/80 hover:bg-red-500 text-white text-sm font-medium transition-colors"
                        >
                            Eliminar
                        </button>
                    </div>
                </div>
            </GlassSurface>
        </motion.div>
    );
}
