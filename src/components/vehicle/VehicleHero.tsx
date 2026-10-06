import React from "react";
import { Layers, Box } from "lucide-react";
import type { Vehicle } from "../../types/vehicle";
import { VehicleImage } from "../common/VehicleImage";
import { useComparisonStore } from "../../store/comparisonStore";

interface VehicleHeroProps {
  vehicle: Vehicle;
  onScrollToViewer: () => void;
}

export const VehicleHero: React.FC<VehicleHeroProps> = ({ vehicle, onScrollToViewer }) => {
  const addVehicle = useComparisonStore((state) => state.addVehicle);
  const isInComparison = useComparisonStore((state) => state.isInComparison(vehicle.slug));

  return (
    <section className="relative min-h-[90vh] flex flex-col justify-end pt-28 pb-16 overflow-hidden hero-dark-overlay always-white">
      {/* Background Hero Image */}
      <div className="absolute inset-0 z-0">
        <VehicleImage
          src={vehicle.heroImage}
          alt={vehicle.name}
          vehicle={vehicle}
          priority
          className="w-full h-full object-cover brightness-75 scale-100"
        />
        {/* Layered cinematic gradients */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#070709] via-[#070709]/60 to-black/40" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#070709] via-transparent to-transparent" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-12 flex flex-col justify-end">
        {/* Header Badges */}
        <div className="flex items-center gap-3 mb-4">
          <span className="w-2.5 h-2.5 bg-[#d40000] rotate-45" />
          <span className="font-mono-tech text-xs uppercase tracking-[0.3em] !text-[#d40000] font-bold">
            {vehicle.category}
          </span>
          {vehicle.year && (
            <span className="font-mono-tech text-xs tracking-widest !text-white/60">
              &middot; {vehicle.year}
            </span>
          )}
        </div>

        {/* Oversized Vehicle Name */}
        <h1 className="font-display font-black text-5xl sm:text-7xl md:text-8xl lg:text-9xl uppercase tracking-tight !text-white leading-none drop-shadow-lg">
          {vehicle.name}
        </h1>

        {/* Tagline */}
        {vehicle.tagline && (
          <p className="font-sans text-base sm:text-xl !text-white/75 max-w-2xl mt-4 font-light">
            {vehicle.tagline}
          </p>
        )}

        {/* Key Statistics Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 my-10 pt-8 border-t border-white/20 max-w-4xl">
          <div>
            <span className="block font-mono-tech text-[10px] tracking-[0.25em] !text-white/50 uppercase mb-1">
              POWER
            </span>
            <span className="font-display text-3xl sm:text-4xl font-extrabold !text-white">
              {vehicle.power || "—"}
            </span>
          </div>

          <div>
            <span className="block font-mono-tech text-[10px] tracking-[0.25em] !text-white/50 uppercase mb-1">
              0–100 KM/H
            </span>
            <span className="font-display text-3xl sm:text-4xl font-extrabold !text-white">
              {vehicle.zeroToHundred || "—"}
            </span>
          </div>

          <div>
            <span className="block font-mono-tech text-[10px] tracking-[0.25em] !text-white/50 uppercase mb-1">
              TOP SPEED
            </span>
            <span className="font-display text-3xl sm:text-4xl font-extrabold !text-white">
              {vehicle.topSpeed || "—"}
            </span>
          </div>

          <div>
            <span className="block font-mono-tech text-[10px] tracking-[0.25em] !text-white/50 uppercase mb-1">
              WEIGHT
            </span>
            <span className="font-display text-3xl sm:text-4xl font-extrabold !text-white">
              {vehicle.weight || "—"}
            </span>
          </div>
        </div>

        {/* Action CTAs */}
        <div className="flex flex-wrap items-center gap-4">
          {/* 3D Inspect Jump */}
          <button
            onClick={onScrollToViewer}
            className="flex items-center gap-2 bg-[#d40000] hover:bg-[#b50000] text-white px-8 py-3.5 rounded font-mono-tech text-xs tracking-[0.2em] uppercase font-bold transition-all shadow-[0_0_25px_rgba(212,0,0,0.4)] hover:scale-105 cursor-pointer"
          >
            <Box className="w-4 h-4 text-white" />
            <span>3D INSPECTION</span>
          </button>

          {/* Add to Compare */}
          <button
            onClick={() => addVehicle(vehicle.slug)}
            className={`flex items-center gap-2 px-6 py-3.5 rounded font-mono-tech text-xs tracking-[0.2em] uppercase border transition-all ${
              isInComparison
                ? "bg-white/10 border-[#d40000] text-white"
                : "bg-white/5 border-white/20 text-white/70 hover:text-white"
            }`}
          >
            <Layers className="w-4 h-4 text-[#d40000]" />
            <span>{isInComparison ? "IN COMPARISON" : "ADD TO COMPARE"}</span>
          </button>
        </div>
      </div>
    </section>
  );
};
