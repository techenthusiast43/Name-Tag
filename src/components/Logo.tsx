import React from "react";

interface LogoProps {
  size?: number;
  showGlow?: boolean;
  className?: string;
}

export const Logo: React.FC<LogoProps> = ({ size = 44, showGlow = true, className = "" }) => {
  return (
    <div
      className={`logo-container ${className}`}
      style={{
        position: "relative",
        width: size,
        height: size,
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
      }}
    >
      {/* Ambient Pulsing Glow */}
      {showGlow && (
        <div
          style={{
            position: "absolute",
            inset: "-4px",
            background: "radial-gradient(circle, rgba(0, 242, 254, 0.4) 0%, rgba(139, 92, 246, 0.2) 60%, transparent 80%)",
            borderRadius: "16px",
            filter: "blur(8px)",
            zIndex: 0,
            pointerEvents: "none",
          }}
        />
      )}

      {/* High-res Rendered Logo Image with fallback to vector */}
      <img
        src="/logo.png"
        alt="NameTag Logo"
        style={{
          width: "100%",
          height: "100%",
          objectFit: "cover",
          borderRadius: "12px",
          position: "relative",
          zIndex: 1,
          boxShadow: "0 0 20px rgba(0, 242, 254, 0.35)",
          border: "1px solid rgba(0, 242, 254, 0.3)",
          transition: "transform 0.2s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.2s ease",
        }}
        onError={(e) => {
          // Fallback to vector SVG if png fails
          (e.target as HTMLImageElement).src = "/logo.svg";
        }}
      />
    </div>
  );
};
