import { cn } from "@/lib/utils";

export function GlowPortal({ className }) {
  return (
    <div className={cn("relative w-full h-[500px] flex items-center justify-center overflow-hidden", className)}>
      {/* Perspective grid floor */}
      <div
        className="absolute bottom-[15%] left-1/2 -translate-x-1/2 w-[800px] h-[400px]"
        style={{
          perspective: "400px",
        }}
      >
        <div
          className="absolute inset-0"
          style={{
            transform: "rotateX(60deg)",
            transformOrigin: "center top",
            backgroundImage: `
              linear-gradient(rgba(139, 92, 246, 0.15) 1px, transparent 1px),
              linear-gradient(90deg, rgba(139, 92, 246, 0.15) 1px, transparent 1px)
            `,
            backgroundSize: "60px 60px",
            maskImage: "radial-gradient(ellipse 70% 90% at 50% 0%, black 20%, transparent 70%)",
            WebkitMaskImage: "radial-gradient(ellipse 70% 90% at 50% 0%, black 20%, transparent 70%)",
          }}
        />
      </div>

      {/* Portal rectangle — the glowing doorway */}
      <div className="relative w-[280px] h-[220px] mt-[-40px]">
        {/* Outer glow */}
        <div
          className="absolute -inset-16 animate-pulse"
          style={{
            background: "radial-gradient(ellipse at 50% 80%, rgba(139, 92, 246, 0.25) 0%, transparent 60%)",
            animationDuration: "4s",
          }}
        />

        {/* Portal body */}
        <div
          className="absolute inset-0 rounded-sm"
          style={{
            background: `linear-gradient(to top,
              rgba(139, 92, 246, 0.9) 0%,
              rgba(167, 139, 250, 0.6) 20%,
              rgba(196, 181, 253, 0.3) 45%,
              rgba(139, 92, 246, 0.05) 75%,
              transparent 100%)`,
            boxShadow: `
              0 0 60px rgba(139, 92, 246, 0.4),
              0 0 120px rgba(139, 92, 246, 0.2),
              inset 0 -40px 60px rgba(139, 92, 246, 0.3)
            `,
          }}
        />

        {/* Inner bright core at bottom */}
        <div
          className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[90%] h-[8px] rounded-full"
          style={{
            background: "rgba(196, 181, 253, 0.9)",
            boxShadow: `
              0 0 20px rgba(196, 181, 253, 0.8),
              0 0 60px rgba(167, 139, 250, 0.6),
              0 0 100px rgba(139, 92, 246, 0.4)
            `,
          }}
        />

        {/* Light spill on floor */}
        <div
          className="absolute -bottom-4 left-1/2 -translate-x-1/2 w-[350px] h-[80px]"
          style={{
            background: "radial-gradient(ellipse at 50% 0%, rgba(139, 92, 246, 0.5) 0%, rgba(139, 92, 246, 0.15) 40%, transparent 70%)",
            filter: "blur(8px)",
          }}
        />

        {/* Reflection streak */}
        <div
          className="absolute -bottom-8 left-1/2 -translate-x-1/2 w-[500px] h-[120px]"
          style={{
            background: "radial-gradient(ellipse at 50% 0%, rgba(139, 92, 246, 0.2) 0%, transparent 60%)",
            filter: "blur(20px)",
          }}
        />
      </div>

      {/* Atmospheric haze */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: "radial-gradient(ellipse 60% 50% at 50% 45%, rgba(88, 28, 195, 0.08) 0%, transparent 70%)",
        }}
      />
    </div>
  );
}
