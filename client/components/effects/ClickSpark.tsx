'use client';
import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { SparkParticles } from './SparkParticles';

interface Spark {
    id: number;
    x: number;
    y: number;
}

export const ClickSpark = () => {
    const [sparks, setSparks] = useState<Spark[]>([]);

    useEffect(() => {
        const handleClick = (e: MouseEvent) => {
            // Ignore clicks if user prefers reduced motion
            if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

            const newSpark: Spark = {
                id: Date.now() + Math.random(),
                x: e.clientX,
                y: e.clientY,
            };

            setSparks((prev) => [...prev, newSpark]);

            // Auto-remove after animation duration (slightly longer than 700ms to be safe)
            setTimeout(() => {
                setSparks((prev) => prev.filter((s) => s.id !== newSpark.id));
            }, 1000);
        };

        // Use mousedown for more immediate feedback
        window.addEventListener('mousedown', handleClick);
        return () => window.removeEventListener('mousedown', handleClick);
    }, []);

    // Ensure this only runs on the client
    if (typeof document === 'undefined') return null;

    return createPortal(
        <div
            style={{
                position: 'fixed',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                pointerEvents: 'none',
                zIndex: 99999,
                overflow: 'hidden',
            }}
        >
            {sparks.map((spark) => (
                <SparkParticles key={spark.id} x={spark.x} y={spark.y} />
            ))}
        </div>,
        document.body
    );
};
