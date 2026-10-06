import React from "react";
import { Link } from "react-router-dom";
import { X, Layers, ArrowRight } from "lucide-react";
import { useComparisonStore } from "../../store/comparisonStore";
import { getVehicleBySlug } from "../../data/vehicles";

export const ComparisonTray: React.FC = () => {
  const selectedSlugs = useComparisonStore((state) => state.selectedSlugs);
  const isTrayOpen = useComparisonStore((state) => state.isTrayOpen);
  const removeVehicle = useComparisonStore((state) => state.removeVehicle);
  const clearSelection = useComparisonStore((state) => state.clearSelection);
  const toggleTray = useComparisonStore((state) => state.toggleTray);

  if (selectedSlugs.length === 0 || !isTrayOpen) {
    return null;
  }

  const selectedVehicles = selectedSlugs
    .map((slug) => getVehicleBySlug(slug))
    .filter(Boolean);

  const canCompare = selectedVehicles.length >= 2;

  return (
    <aside aria-label="Vehicle comparison dock" className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 w-[95%] max-w-3xl subtle-glass bg-[#0d0d14]/95 border border-white/20 p-4 shadow-2xl rounded-lg backdrop-blur-xl animate-in fade-in slide-in-from-bottom-4 duration-300">
      <div className="flex items-center justify-between mb-3 border-b border-white/10 pb-2">
        <div className="flex items-center gap-2">
          <Layers className="w-4 h-4 text-[#d40000]" />
          <span className="font-mono-tech text-xs uppercase tracking-widest text-white font-bold">
            COMPARE SELECTION ({selectedVehicles.length} / 3)
          </span>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => clearSelection()}
            className="text-[10px] font-mono-tech tracking-wider text-white/50 hover:text-white uppercase transition-colors"
          >
            CLEAR ALL
          </button>
          <button
            onClick={() => toggleTray(false)}
            className="p-1 rounded text-white/50 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Selected vehicle badges */}
        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          {selectedVehicles.map((car) => (
            <div
              key={car!.slug}
              className="flex items-center gap-2 bg-white/5 border border-white/10 px-3 py-1.5 rounded"
            >
              <div className="w-2 h-2 rounded-full bg-[#d40000]" />
              <span className="font-display font-bold text-xs uppercase tracking-wider text-white">
                {car!.name}
              </span>
              <button
                onClick={() => removeVehicle(car!.slug)}
                className="text-white/40 hover:text-white transition-colors ml-1"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}

          {selectedVehicles.length < 3 && (
            <div className="px-3 py-1.5 border border-dashed border-white/20 rounded font-mono-tech text-[10px] tracking-wider text-white/40 uppercase">
              + ADD {3 - selectedVehicles.length} MORE
            </div>
          )}
        </div>

        {/* CTA */}
        <div className="w-full sm:w-auto flex justify-end">
          {canCompare ? (
            <Link
              to="/compare"
              className="flex items-center gap-2 bg-[#d40000] hover:bg-[#b50000] text-white px-5 py-2 rounded text-xs font-mono-tech font-bold tracking-widest uppercase transition-all shadow-[0_0_20px_rgba(212,0,0,0.4)]"
            >
              <span>COMPARE NOW</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          ) : (
            <span className="font-mono-tech text-[10px] tracking-wider text-white/50 uppercase">
              SELECT AT LEAST 2 VEHICLES
            </span>
          )}
        </div>
      </div>
    </aside>
  );
};
