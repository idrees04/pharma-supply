'use client';
import { motion } from 'framer-motion';

interface SparkParticlesProps {
    x: number;
    y: number;
}

const PARTICLE_COUNT = 8;

export const SparkParticles = ({ x, y }: SparkParticlesProps) => {
    return (
        <div
            style={{
                position: 'absolute',
                left: x,
                top: y,
                pointerEvents: 'none',
            }}
        >
            {/* Central core particle */}
            <motion.div
                initial={{ scale: 0, opacity: 0.8 }}
                animate={{ scale: 1.5, opacity: 0 }}
                transition={{ duration: 0.4, ease: "easeOut" }}
                style={{
                    width: '6px',
                    height: '6px',
                    borderRadius: '50%',
                    backgroundColor: 'hsl(var(--primary))',
                    position: 'absolute',
                    transform: 'translate(-50%, -50%)',
                }}
            />

            {[...Array(PARTICLE_COUNT)].map((_, i) => {
                // Randomize direction and distance
                const angle = (i * (360 / PARTICLE_COUNT)) + (Math.random() * 20 - 10);
                const distance = 40 + Math.random() * 40;
                const targetX = Math.cos((angle * Math.PI) / 180) * distance;
                const targetY = Math.sin((angle * Math.PI) / 180) * distance;

                return (
                    <motion.div
                        key={i}
                        initial={{ scale: 0, opacity: 0.8, x: 0, y: 0 }}
                        animate={{
                            scale: [0, 1, 0.5],
                            opacity: 0,
                            x: targetX,
                            y: targetY,
                        }}
                        transition={{
                            duration: 0.7,
                            ease: "easeOut",
                        }}
                        style={{
                            width: '4px',
                            height: '4px',
                            borderRadius: '50%',
                            backgroundColor: 'hsl(var(--primary))',
                            position: 'absolute',
                            transform: 'translate(-50%, -50%)',
                        }}
                    />
                );
            })}
        </div>
    );
};
