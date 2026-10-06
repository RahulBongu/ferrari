import React from "react";
import { Link } from "react-router-dom";
import { ArrowUpRight, Plus, Check } from "lucide-react";
import type { Vehicle } from "../../types/vehicle";
import { VehicleImage } from "../common/VehicleImage";
import { useComparisonStore } from "../../store/comparisonStore";

interface VehicleCardProps {
  vehicle: Vehicle;
  featured?: boolean;
}

export const VehicleCard: React.FC<VehicleCardProps> = ({ vehicle, featured = false }) => {
  const addVehicle = useComparisonStore((state) => state.addVehicle);
  const removeVehicle = useComparisonStore((state) => state.removeVehicle);
  const isInComparison = useComparisonStore((state) => state.isInComparison(vehicle.slug));

  const handleCompareClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (isInComparison) {
      removeVehicle(vehicle.slug);
    } else {
      addVehicle(vehicle.slug);
    }
  };

  return (
    <Link
      to={`/garage/${vehicle.slug}`}
      className={`group relative flex flex-col justify-end overflow-hidden border border-white/10 hover:border-[#d40000]/60 transition-all duration-500 bg-[#0d0d12] ${
        featured ? "md:col-span-2 md:row-span-2 min-h-[440px] md:min-h-[560px]" : "min-h-[360px]"
      }`}
    >
      {/* Background Image / Vehicle Photography */}
      <div className="absolute inset-0 z-0 overflow-hidden">
        <VehicleImage
          src={vehicle.heroImage}
          alt={vehicle.name}
          vehicle={vehicle}
          className="w-full h-full object-cover group-hover:scale-105 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform duration-700 brightness-90 group-hover:brightness-100"
        />
        {/* Cinematic gradient overlays */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#070709] via-[#070709]/50 to-transparent opacity-95 group-hover:opacity-85 transition-opacity" />
        <div className="absolute inset-0 bg-radial-gradient from-transparent to-[#070709]/80" />
      </div>

      {/* Top Header inside Card */}
      <div className="absolute top-0 left-0 right-0 p-6 z-10 flex items-start justify-between">
        <div className="flex flex-col">
          <span className="font-mono-tech text-[10px] tracking-[0.25em] text-[#d40000] uppercase font-bold">
            {vehicle.category}
          </span>
          {vehicle.year && (
            <span className="font-mono-tech text-xs tracking-widest text-white/40 mt-0.5">
              {vehicle.year}
            </span>
          )}
        </div>

        {/* Quick Compare Button */}
        <button
          onClick={handleCompareClick}
          title={isInComparison ? "Remove from comparison" : "Add to comparison"}
          style={{ color: "#ffffff" }}
          className={`flex items-center gap-1.5 px-3 py-1 text-[10px] font-mono-tech tracking-wider uppercase rounded border transition-all shadow-md !text-white cursor-pointer ${
            isInComparison
              ? "bg-[#d40000] border-[#d40000] !text-white"
              : "bg-black/70 backdrop-blur-md border-white/30 !text-white hover:border-[#d40000]"
          }`}
        >
          {isInComparison ? (
            <>
              <Check className="w-3 h-3 !text-white" />
              <span className="!text-white font-bold">COMPARING</span>
            </>
          ) : (
            <>
              <Plus className="w-3 h-3 !text-white" />
              <span className="!text-white font-bold">COMPARE</span>
            </>
          )}
        </button>
      </div>

      {/* Bottom Content Area - permanently white text over car photography */}
      <div className="relative z-10 p-6 md:p-8 flex flex-col justify-end vehicle-card-text">
        {/* Vehicle Name - permanently pure white */}
        <h3
          style={{ color: "#ffffff" }}
          className={`font-display font-black uppercase !text-white tracking-wide transition-transform duration-500 group-hover:-translate-y-1 drop-shadow-md ${
            featured ? "text-3xl md:text-5xl" : "text-2xl md:text-3xl"
          }`}
        >
          {vehicle.name}
        </h3>

        {/* Tagline / Subtitle */}
        {vehicle.tagline && (
          <p
            style={{ color: "rgba(255, 255, 255, 0.75)" }}
            className="text-xs !text-white/75 line-clamp-1 mt-1 font-sans"
          >
            {vehicle.tagline}
          </p>
        )}

        {/* Micro Telemetry Bar */}
        <div className="mt-4 pt-4 border-t border-white/15 flex items-center justify-between">
          <div className="flex items-center gap-4 sm:gap-6">
            <div>
              <span
                style={{ color: "rgba(255, 255, 255, 0.5)" }}
                className="block font-mono-tech text-[9px] uppercase tracking-widest !text-white/50"
              >
                TOP SPEED
              </span>
              <span
                style={{ color: "#ffffff" }}
                className="font-mono-tech text-xs !text-white font-bold"
              >
                {vehicle.topSpeed || "—"}
              </span>
            </div>

            <div>
              <span
                style={{ color: "rgba(255, 255, 255, 0.5)" }}
                className="block font-mono-tech text-[9px] uppercase tracking-widest !text-white/50"
              >
                0-100
              </span>
              <span
                style={{ color: "#ffffff" }}
                className="font-mono-tech text-xs !text-white font-bold"
              >
                {vehicle.zeroToHundred || "—"}
              </span>
            </div>
          </div>

          {/* VIEW CTA with subtle arrow icon */}
          <div className="flex items-center gap-1 font-mono-tech text-xs uppercase tracking-widest text-[#d40000] group-hover:text-white transition-colors">
            <span>VIEW</span>
            <ArrowUpRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </div>
        </div>
      </div>
    </Link>
  );
};
