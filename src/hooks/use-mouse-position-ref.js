import { useRef, useEffect } from "react";

export function useMousePositionRef(containerRef) {
  const positionRef = useRef({ x: 0, y: 0 });
  const clientRef = useRef(null);

  useEffect(() => {
    const container = containerRef?.current;
    if (!container) return;

    const recalc = () => {
      if (!clientRef.current) return;
      const rect = container.getBoundingClientRect();
      positionRef.current = {
        x: clientRef.current.x - (rect.left + rect.width / 2),
        y: clientRef.current.y - (rect.top + rect.height / 2),
      };
    };

    const handleMouseMove = (e) => {
      clientRef.current = { x: e.clientX, y: e.clientY };
      recalc();
    };

    const handleScroll = () => recalc();

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("scroll", handleScroll);
    };
  }, [containerRef]);

  return positionRef;
}
