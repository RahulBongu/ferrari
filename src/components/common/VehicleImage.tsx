import React, { useState } from "react";
import type { Vehicle } from "../../types/vehicle";

interface VehicleImageProps {
  src: string;
  alt: string;
  vehicle?: Vehicle;
  className?: string;
  priority?: boolean;
}

export const VehicleImage: React.FC<VehicleImageProps> = ({
  src,
  alt,
  vehicle,
  className = "",
}) => {
  const [hasError, setHasError] = useState(false);

  if (hasError || !src) {
    return (
      <div
        className={`relative overflow-hidden bg-gradient-to-br from-[#121217] via-[#0a0a0d] to-[#050508] border border-white/5 flex flex-col items-center justify-center p-6 text-center select-none ${className}`}
      >
        {/* Subtle grid backdrop */}
        <div
          className="absolute inset-0 opacity-[0.03] pointer-events-none"
          style={{
            backgroundImage:
              "linear-gradient(to right, #fff 1px, transparent 1px), linear-gradient(to bottom, #fff 1px, transparent 1px)",
            backgroundSize: "24px 24px",
          }}
        />

        {/* Ambient red halo */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-32 bg-[#d40000]/10 rounded-full blur-3xl pointer-events-none" />

        {/* Technical silhouette / icon */}
        <div className="relative z-10 flex flex-col items-center">
          <svg
            className="w-24 h-12 text-white/20 mb-3"
            viewBox="0 0 120 50"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.2"
          >
            {/* Streamlined supercar silhouette */}
            <path d="M 5 36 C 12 36, 16 34, 22 26 C 28 18, 42 12, 60 12 C 78 12, 88 18, 98 26 C 104 32, 110 36, 116 36 L 114 40 C 110 40, 106 38, 102 38 C 96 38, 92 42, 86 42 C 80 42, 76 38, 44 38 C 38 38, 34 42, 28 42 C 22 42, 18 38, 12 38 L 5 40 Z" />
            <circle cx="28" cy="38" r="6" stroke="currentColor" strokeWidth="1.5" />
            <circle cx="92" cy="38" r="6" stroke="currentColor" strokeWidth="1.5" />
            <path d="M 38 22 L 54 16 L 76 16 L 82 22 Z" stroke="currentColor" strokeWidth="1" strokeDasharray="2 2" />
          </svg>

          <span className="font-display text-xl uppercase tracking-wider text-white/80 font-bold">
            {vehicle?.name || alt}
          </span>
          <span className="font-mono-tech text-[10px] uppercase tracking-widest text-white/40 mt-1">
            PHOTOGRAPHY PENDING
          </span>
          <span className="font-mono-tech text-[9px] text-[#d40000]/70 mt-1">
            DROP ASSET INTO {src}
          </span>
        </div>
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      loading="lazy"
      onError={() => setHasError(true)}
      className={`object-cover transition-transform duration-700 ${className}`}
    />
  );
};
