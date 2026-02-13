import { useEffect, useRef } from "react";

/**
 * useMousePosition Hook
 *
 * Tracks the mouse position relative to a target element.
 * Updates CSS variables directly on the element for high performance (no re-renders).
 */
export function useMousePosition(ref: React.RefObject<HTMLElement>) {
    const requestRef = useRef<number>();

    useEffect(() => {
        const target = ref.current;
        if (!target) return;

        const handleMouseMove = (e: MouseEvent) => {
            if (requestRef.current) {
                cancelAnimationFrame(requestRef.current);
            }

            requestRef.current = requestAnimationFrame(() => {
                const rect = target.getBoundingClientRect();
                const x = e.clientX - rect.left;
                const y = e.clientY - rect.top;

                target.style.setProperty("--mouse-x", `${x}px`);
                target.style.setProperty("--mouse-y", `${y}px`);
            });
        };

        target.addEventListener("mousemove", handleMouseMove);

        return () => {
            target.removeEventListener("mousemove", handleMouseMove);
            if (requestRef.current) {
                cancelAnimationFrame(requestRef.current);
            }
        };
    }, [ref]);
}
