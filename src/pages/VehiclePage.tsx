import React, { useRef } from "react";
import { useParams, Link } from "react-router-dom";
import { getVehicleBySlug } from "../data/vehicles";
import { VehicleHero } from "../components/vehicle/VehicleHero";
import { PerformanceStats } from "../components/vehicle/PerformanceStats";
import { VehicleGallery } from "../components/gallery/VehicleGallery";
import { VehicleViewer } from "../three/VehicleViewer";
import { SpecificationSection } from "../components/vehicle/SpecificationSection";
import { Layers, ArrowLeft } from "lucide-react";
import { useComparisonStore } from "../store/comparisonStore";

export const VehiclePage: React.FC = () => {
  const { vehicleId } = useParams<{ vehicleId: string }>();
  const vehicle = getVehicleBySlug(vehicleId || "");
  const viewerRef = useRef<HTMLDivElement>(null);
  const addVehicle = useComparisonStore((state) => state.addVehicle);
  const isInComparison = useComparisonStore((state) =>
    vehicle ? state.isInComparison(vehicle.slug) : false
  );

  const handleScrollToViewer = () => {
    viewerRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  if (!vehicle) {
    return (
      <div className="min-h-screen bg-[#070709] flex flex-col items-center justify-center text-center px-6">
        <span className="w-3 h-3 bg-[#d40000] rotate-45 mb-4" />
        <h1 className="font-display font-black text-4xl sm:text-5xl uppercase tracking-wider text-white mb-2">
          VEHICLE NOT FOUND
        </h1>
        <p className="font-mono-tech text-xs tracking-widest text-white/50 uppercase mb-8">
          THE SPECIFIED MARANELLO CHASSIS CANNOT BE LOCATED
        </p>
        <Link
          to="/garage"
          className="flex items-center gap-2 px-6 py-3 bg-[#d40000] text-white font-mono-tech text-xs uppercase tracking-widest font-bold hover:bg-[#b50000] transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>RETURN TO GARAGE</span>
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#070709] text-white">
      {/* 1. Hero Section */}
      <VehicleHero vehicle={vehicle} onScrollToViewer={handleScrollToViewer} />

      {/* Main Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12">
        {/* 2. Performance Section */}
        <PerformanceStats vehicle={vehicle} />

        {/* 3. Photo Gallery */}
        <VehicleGallery vehicle={vehicle} />

        {/* 4. 3D Studio Inspection */}
        <div ref={viewerRef}>
          <VehicleViewer vehicle={vehicle} />
        </div>

        {/* 5. Specifications & Architecture */}
        <SpecificationSection vehicle={vehicle} />

        {/* 6. Action Footer Banner: Compare & Archive */}
        <section className="py-16 my-12 border border-white/10 dark:border-white/10 light:border-zinc-200 bg-gradient-to-r from-[#0d0d14] via-[#14141e] to-[#0d0d14] dark:from-[#0d0d14] dark:via-[#14141e] dark:to-[#0d0d14] light:from-white light:via-zinc-50 light:to-white p-8 sm:p-12 rounded-lg flex flex-col lg:flex-row items-center justify-between gap-8 shadow-xl">
          <div>
            <span className="font-mono-tech text-xs uppercase tracking-[0.3em] text-[#d40000] font-bold block mb-2">
              BENCHMARK &amp; ARCHIVE
            </span>
            <h2 className="font-display font-black text-3xl sm:text-5xl uppercase text-white dark:text-white light:text-zinc-950 tracking-wide">
              ALIGN {vehicle.name}
            </h2>
            <p className="font-sans text-xs sm:text-sm text-white/60 dark:text-white/60 light:text-zinc-600 max-w-xl mt-2">
              Compare aerodynamics, powertrain architectures, acceleration curves, and chassis weights against any Maranello icon.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-4 shrink-0">
            <button
              onClick={() => addVehicle(vehicle.slug)}
              className={`flex items-center gap-2 px-8 py-4 rounded font-mono-tech text-xs uppercase tracking-[0.2em] font-bold border transition-all cursor-pointer ${
                isInComparison
                  ? "bg-[#d40000] border-[#d40000] text-white shadow-[0_0_20px_rgba(212,0,0,0.4)]"
                  : "bg-white/10 border-white/20 text-white hover:border-[#d40000]"
              }`}
            >
              <Layers className="w-4 h-4 text-white" />
              <span>{isInComparison ? "IN COMPARISON" : "ADD TO COMPARE"}</span>
            </button>

            <Link
              to="/compare"
              className="px-8 py-4 rounded font-mono-tech text-xs uppercase tracking-[0.2em] border border-white/20 hover:border-white text-white dark:text-white light:text-zinc-900 transition-colors"
            >
              <span>VIEW COMPARISONS &rarr;</span>
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
};
