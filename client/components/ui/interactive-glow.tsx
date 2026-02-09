import React, { useRef } from "react";
import { useMousePosition } from "@/hooks/use-mouse-position";
import { cn } from "@/lib/utils";

interface InteractiveGlowProps {
    children: React.ReactNode;
    className?: string;
    glowColor?: string; // e.g., "rgba(59, 130, 246, 0.15)"
    glowSize?: number; // Radial gradient radius in pixels
}

/**
 * InteractiveGlow Component
 *
 * A reusable wrapper that adds a cursor-reactive "spotlight" glow effect.
 * Uses hardware acceleration and CSS variables for smooth performance.
 *
 * @example
 * <InteractiveGlow>
 *   <Card>Content</Card>
 * </InteractiveGlow>
 */
export const InteractiveGlow: React.FC<InteractiveGlowProps> = ({
    children,
    className,
    glowColor = "rgba(var(--primary), 0.1)", // Default to theme primary
    glowSize = 400,
}) => {
    const containerRef = useRef<HTMLDivElement>(null);
    useMousePosition(containerRef);

    return (
        <div
            ref={containerRef}
            className={cn(
                "relative overflow-hidden group/glow rounded-xl",
                className
            )}
        >
            {/* Spotlight Layer */}
            <div
                className="pointer-events-none absolute -inset-px opacity-0 group-hover/glow:opacity-100 transition-opacity duration-500 rounded-xl"
                style={{
                    background: `radial-gradient(${glowSize}px circle at var(--mouse-x) var(--mouse-y), ${glowColor}, transparent 80%)`,
                }}
            />

            {/* Content Layer */}
            <div className="relative z-10">{children}</div>
        </div>
    );
};
