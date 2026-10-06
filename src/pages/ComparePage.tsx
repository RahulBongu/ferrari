import React, { useState } from "react";
import { Link } from "react-router-dom";
import { X, Plus, RefreshCw, Car } from "lucide-react";
import { vehicles, getVehicleBySlug } from "../data/vehicles";
import { useComparisonStore } from "../store/comparisonStore";
import { VehicleImage } from "../components/common/VehicleImage";

export const ComparePage: React.FC = () => {
  const selectedSlugs = useComparisonStore((state) => state.selectedSlugs);
  const addVehicle = useComparisonStore((state) => state.addVehicle);
  const removeVehicle = useComparisonStore((state) => state.removeVehicle);
  const swapVehicle = useComparisonStore((state) => state.swapVehicle);
  const setVehicles = useComparisonStore((state) => state.setVehicles);

  const [selectorOpen, setSelectorOpen] = useState(false);
  const [swappingSlug, setSwappingSlug] = useState<string | null>(null);

  const comparedVehicles = selectedSlugs
    .map((slug) => getVehicleBySlug(slug))
    .filter(Boolean);

  const handleOpenAddModal = () => {
    setSwappingSlug(null);
    setSelectorOpen(true);
  };

  const handleOpenSwapModal = (slug: string) => {
    setSwappingSlug(slug);
    setSelectorOpen(true);
  };

  const handleSelectCar = (slug: string) => {
    if (swappingSlug) {
      swapVehicle(swappingSlug, slug);
    } else {
      addVehicle(slug);
    }
    setSelectorOpen(false);
    setSwappingSlug(null);
  };

  const handleResetDefault = () => {
    setVehicles(["288-gto", "laferrari"]);
  };

  return (
    <div className="min-h-screen bg-[#070709] dark:bg-[#070709] light:bg-[#f6f7f9] pt-24 pb-28 px-4 sm:px-6 lg:px-12 max-w-7xl mx-auto text-white dark:text-white light:text-zinc-900 transition-colors">
      {/* Top Header */}
      <section className="mb-12 border-b border-white/10 dark:border-white/10 light:border-zinc-300 pb-8 flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="w-2 h-2 bg-[#d40000] rotate-45" />
            <span className="font-mono-tech text-[10px] uppercase tracking-[0.3em] text-[#d40000] font-bold">
              BENCHMARK ANALYSIS
            </span>
          </div>
          <h1 className="font-display font-black text-4xl sm:text-6xl uppercase tracking-tight text-white dark:text-white light:text-zinc-950">
            FERRARI COMPARISON
          </h1>
          <p className="font-sans text-xs sm:text-sm text-white/50 dark:text-white/50 light:text-zinc-600 max-w-xl mt-1">
            Side-by-side engineering alignment. Compare performance parameters, powertrain architecture, and dimensions.
          </p>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-3">
          {comparedVehicles.length < 3 && (
            <button
              onClick={handleOpenAddModal}
              className="flex items-center gap-2 px-4 py-2.5 bg-[#d40000] hover:bg-[#b50000] text-white rounded font-mono-tech text-xs uppercase tracking-wider font-bold transition-all shadow-[0_0_15px_rgba(212,0,0,0.3)] cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>ADD VEHICLE ({comparedVehicles.length}/3)</span>
            </button>
          )}

          {comparedVehicles.length === 0 && (
            <button
              onClick={handleResetDefault}
              className="flex items-center gap-2 px-4 py-2.5 bg-white/10 hover:bg-white/20 border border-white/20 rounded font-mono-tech text-xs uppercase tracking-wider text-white transition-colors cursor-pointer"
            >
              <RefreshCw className="w-4 h-4 text-[#d40000]" />
              <span>LOAD PRESETS</span>
            </button>
          )}
        </div>
      </section>

      {/* Vehicle Cards Header Row */}
      <div className="grid gap-6 mb-12 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
        {comparedVehicles.map((car) => (
          <div
            key={car!.slug}
            className="relative bg-[#0d0d14] dark:bg-[#0d0d14] light:bg-white border border-white/10 dark:border-white/10 light:border-zinc-200 p-6 rounded-lg flex flex-col justify-between shadow-lg transition-all"
          >
            {/* Remove button */}
            <button
              onClick={() => removeVehicle(car!.slug)}
              title={`Remove ${car!.name} from comparison`}
              className="absolute top-4 right-4 p-2 rounded-full bg-zinc-200 dark:bg-black/70 hover:!bg-[#d40000] !text-black dark:!text-white hover:!text-white transition-all z-10 cursor-pointer shadow-md border border-zinc-300 dark:border-white/10 group"
            >
              <X className="w-4 h-4 !text-black dark:!text-white group-hover:!text-white" />
            </button>

            {/* Car Image */}
            <div className="relative h-44 sm:h-52 w-full overflow-hidden mb-4 bg-black/40 rounded">
              <VehicleImage
                src={car!.heroImage}
                alt={car!.name}
                vehicle={car!}
                className="w-full h-full object-cover"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="font-mono-tech text-[10px] tracking-widest text-[#d40000] uppercase font-bold">
                  {car!.category}
                </span>
                {car!.year && (
                  <span className="font-mono-tech text-[10px] text-white/40 dark:text-white/40 light:text-zinc-500 font-bold">
                    {car!.year}
                  </span>
                )}
              </div>
              <h2 className="font-display font-black text-2xl sm:text-3xl uppercase tracking-wide text-white dark:text-white light:text-zinc-900">
                {car!.name}
              </h2>
            </div>

            {/* Actions */}
            <div className="mt-6 pt-4 border-t border-white/10 dark:border-white/10 light:border-zinc-200 flex items-center justify-between gap-2">
              <button
                onClick={() => handleOpenSwapModal(car!.slug)}
                className="flex items-center gap-1.5 font-mono-tech text-xs tracking-wider uppercase text-white/70 dark:text-white/70 light:text-zinc-600 hover:text-[#d40000] transition-colors cursor-pointer"
                title="Swap with another Ferrari"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>SWAP CAR</span>
              </button>

              <Link
                to={`/garage/${car!.slug}`}
                className="font-mono-tech text-xs tracking-wider uppercase text-[#d40000] hover:text-white dark:hover:text-white light:hover:text-black font-bold"
              >
                SPECS &rarr;
              </Link>
            </div>
          </div>
        ))}

        {/* Empty Slot Card for adding a car if less than 3 */}
        {comparedVehicles.length < 3 && (
          <div
            onClick={handleOpenAddModal}
            className="border-2 border-dashed border-white/20 dark:border-white/20 light:border-zinc-300 hover:border-[#d40000] rounded-lg p-8 flex flex-col items-center justify-center text-center group cursor-pointer transition-all min-h-[300px] bg-white/[0.02] dark:bg-white/[0.02] light:bg-zinc-50 hover:bg-[#d40000]/5"
          >
            <div className="w-14 h-14 rounded-full bg-white/5 dark:bg-white/5 light:bg-zinc-200 group-hover:bg-[#d40000] flex items-center justify-center text-white/60 dark:text-white/60 light:text-zinc-700 group-hover:text-white transition-all mb-4 shadow-inner">
              <Plus className="w-7 h-7" />
            </div>
            <span className="font-display font-black text-xl uppercase tracking-wider text-white dark:text-white light:text-zinc-800 group-hover:text-[#d40000] transition-colors">
              ADD A FERRARI
            </span>
            <p className="font-sans text-xs text-white/40 dark:text-white/40 light:text-zinc-500 max-w-xs mt-2">
              Select any of the 15 Maranello icons to conduct side-by-side aerodynamic and engineering comparison.
            </p>
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleOpenAddModal();
              }}
              className="mt-6 px-4 py-2 bg-white/10 dark:bg-white/10 light:bg-zinc-200 group-hover:bg-[#d40000] text-white dark:text-white light:text-zinc-800 group-hover:text-white rounded font-mono-tech text-[10px] uppercase tracking-widest font-bold transition-all"
            >
              CHOOSE MODEL
            </button>
          </div>
        )}
      </div>

      {/* Comparison Tables by Category */}
      {comparedVehicles.length > 0 ? (
        <div className="space-y-12">
          {/* 1. PERFORMANCE */}
          <section className="bg-[#0b0b10] dark:bg-[#0b0b10] light:bg-white border border-white/10 dark:border-white/10 light:border-zinc-200 p-6 sm:p-8 rounded-lg shadow-lg">
            <h3 className="font-mono-tech text-xs uppercase tracking-[0.25em] text-[#d40000] font-bold mb-6 pb-3 border-b border-white/10 dark:border-white/10 light:border-zinc-200">
              1. PERFORMANCE DYNAMICS
            </h3>
            <div className="space-y-4">
              <ComparisonRow
                label="POWER OUTPUT"
                values={comparedVehicles.map((c) => c!.power || "—")}
              />
              <ComparisonRow
                label="MAX TORQUE"
                values={comparedVehicles.map((c) => c!.torque || "—")}
              />
              <ComparisonRow
                label="0–100 KM/H"
                values={comparedVehicles.map((c) => c!.zeroToHundred || "—")}
              />
              <ComparisonRow
                label="0–200 KM/H"
                values={comparedVehicles.map((c) => c!.zeroToTwoHundred || "—")}
              />
              <ComparisonRow
                label="OFFICIAL TOP SPEED"
                values={comparedVehicles.map((c) => c!.topSpeed || "—")}
                highlightNumeric
                numericValues={comparedVehicles.map((c) => {
                  const match = (c!.topSpeed || "").match(/\d+/);
                  return match ? parseInt(match[0], 10) : 300;
                })}
              />
            </div>
          </section>

          {/* 2. ENGINE & POWERTRAIN */}
          <section className="bg-[#0b0b10] dark:bg-[#0b0b10] light:bg-white border border-white/10 dark:border-white/10 light:border-zinc-200 p-6 sm:p-8 rounded-lg shadow-lg">
            <h3 className="font-mono-tech text-xs uppercase tracking-[0.25em] text-[#d40000] font-bold mb-6 pb-3 border-b border-white/10 dark:border-white/10 light:border-zinc-200">
              2. ENGINE & POWERTRAIN
            </h3>
            <div className="space-y-4">
              <ComparisonRow
                label="ENGINE TYPE"
                values={comparedVehicles.map((c) => c!.engineType || "SPECIFICATION PENDING")}
              />
              <ComparisonRow
                label="DISPLACEMENT"
                values={comparedVehicles.map((c) => c!.displacement || "SPECIFICATION PENDING")}
              />
              <ComparisonRow
                label="CYLINDERS"
                values={comparedVehicles.map((c) => c!.cylinders || "SPECIFICATION PENDING")}
              />
              <ComparisonRow
                label="ENGINE CONFIGURATION"
                values={comparedVehicles.map((c) => c!.engine || "SPECIFICATION PENDING")}
              />
            </div>
          </section>

          {/* 3. TRANSMISSION & DRIVETRAIN */}
          <section className="bg-[#0b0b10] dark:bg-[#0b0b10] light:bg-white border border-white/10 dark:border-white/10 light:border-zinc-200 p-6 sm:p-8 rounded-lg shadow-lg">
            <h3 className="font-mono-tech text-xs uppercase tracking-[0.25em] text-[#d40000] font-bold mb-6 pb-3 border-b border-white/10 dark:border-white/10 light:border-zinc-200">
              3. TRANSMISSION & DRIVETRAIN
            </h3>
            <div className="space-y-4">
              <ComparisonRow
                label="GEARBOX"
                values={comparedVehicles.map((c) => c!.transmission || "SPECIFICATION PENDING")}
              />
              <ComparisonRow
                label="DRIVE TYPE"
                values={comparedVehicles.map((c) => c!.driveType || "SPECIFICATION PENDING")}
              />
              <ComparisonRow
                label="FORWARD RATIOS"
                values={comparedVehicles.map((c) => `${c!.testDrive.gears} SPEEDS`)}
              />
              <ComparisonRow
                label="REDLINE LIMIT"
                values={comparedVehicles.map((c) => `${c!.testDrive.revLimit || 8500} RPM`)}
                highlightNumeric
                numericValues={comparedVehicles.map((c) => c!.testDrive.revLimit || 8500)}
              />
            </div>
          </section>

          {/* 4. MASS & DIMENSIONS */}
          <section className="bg-[#0b0b10] dark:bg-[#0b0b10] light:bg-white border border-white/10 dark:border-white/10 light:border-zinc-200 p-6 sm:p-8 rounded-lg shadow-lg">
            <h3 className="font-mono-tech text-xs uppercase tracking-[0.25em] text-[#d40000] font-bold mb-6 pb-3 border-b border-white/10 dark:border-white/10 light:border-zinc-200">
              4. MASS & DIMENSIONS
            </h3>
            <div className="space-y-4">
              <ComparisonRow
                label="OFFICIAL KERB WEIGHT"
                values={comparedVehicles.map((c) => c!.weight || "—")}
                highlightNumeric
                numericValues={comparedVehicles.map((c) => c!.testDrive.mass)}
                invertHighlight
              />
              <ComparisonRow
                label="LENGTH"
                values={comparedVehicles.map((c) => c!.dimensions?.length || "—")}
              />
              <ComparisonRow
                label="WIDTH"
                values={comparedVehicles.map((c) => c!.dimensions?.width || "—")}
              />
              <ComparisonRow
                label="HEIGHT"
                values={comparedVehicles.map((c) => c!.dimensions?.height || "—")}
              />
            </div>
          </section>
        </div>
      ) : (
        <div className="py-20 text-center border border-dashed border-white/20 rounded-lg">
          <Car className="w-12 h-12 text-[#d40000] mx-auto mb-4" />
          <h3 className="font-display font-black text-2xl uppercase tracking-wider text-white">
            NO VEHICLES IN COMPARISON
          </h3>
          <p className="font-sans text-xs text-white/50 max-w-md mx-auto mt-2 mb-6">
            Add at least two Ferraris to view comprehensive side-by-side mechanical and track performance metrics.
          </p>
          <button
            onClick={handleResetDefault}
            className="px-6 py-3 bg-[#d40000] hover:bg-[#b50000] text-white rounded font-mono-tech text-xs uppercase tracking-widest font-bold cursor-pointer"
          >
            LOAD 288 GTO VS LAFERRARI
          </button>
        </div>
      )}

      {/* Modal / Selector Dialog to add or swap vehicle */}
      {selectorOpen && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-200">
          <div className="bg-[#0e0e14] dark:bg-[#0e0e14] light:bg-white border border-white/20 dark:border-white/20 light:border-zinc-300 p-6 sm:p-8 max-w-3xl w-full max-h-[85vh] overflow-y-auto rounded-lg shadow-2xl">
            <div className="flex items-center justify-between pb-4 border-b border-white/10 dark:border-white/10 light:border-zinc-200 mb-6">
              <div>
                <span className="font-mono-tech text-[10px] tracking-widest uppercase text-[#d40000] font-bold block mb-1">
                  {swappingSlug ? "REPLACE VEHICLE" : "ADD VEHICLE"}
                </span>
                <h3 className="font-display font-black text-2xl sm:text-3xl uppercase tracking-wider text-white dark:text-white light:text-zinc-950">
                  {swappingSlug
                    ? `SWAP WITH NEW MODEL`
                    : "SELECT VEHICLE TO COMPARE"}
                </h3>
              </div>
              <button
                onClick={() => setSelectorOpen(false)}
                className="p-2 rounded-full bg-zinc-200 dark:bg-white/10 hover:bg-[#d40000] dark:hover:bg-[#d40000] !text-black dark:!text-white hover:!text-white cursor-pointer transition-colors"
              >
                <X className="w-5 h-5 !text-black dark:!text-white" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {vehicles.map((v) => {
                const isSelected = selectedSlugs.includes(v.slug);
                return (
                  <button
                    key={v.id}
                    disabled={isSelected}
                    onClick={() => handleSelectCar(v.slug)}
                    className={`flex flex-col p-3 border rounded text-left transition-all ${
                      isSelected
                        ? "bg-white/5 border-white/10 opacity-40 cursor-not-allowed"
                        : "bg-white/5 dark:bg-white/5 light:bg-zinc-50 border-white/10 dark:border-white/10 light:border-zinc-200 hover:border-[#d40000] hover:bg-white/10 cursor-pointer group"
                    }`}
                  >
                    <div className="h-24 w-full rounded overflow-hidden bg-black/40 mb-2 relative">
                      <img
                        src={v.heroImage}
                        alt={v.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      />
                      {isSelected && (
                        <div className="absolute inset-0 bg-black/60 flex items-center justify-center font-mono-tech text-[10px] uppercase tracking-wider text-[#d40000] font-bold">
                          CURRENTLY COMPARED
                        </div>
                      )}
                    </div>
                    <span className="font-display font-bold text-sm uppercase block text-white dark:text-white light:text-zinc-900 group-hover:text-[#d40000] transition-colors">
                      {v.name}
                    </span>
                    <span className="font-mono-tech text-[10px] text-white/40 dark:text-white/40 light:text-zinc-500 uppercase mt-0.5">
                      {v.category} {v.year ? `· ${v.year}` : ""}
                    </span>
                    <span className="font-mono-tech text-[10px] text-[#d40000] uppercase font-bold mt-1">
                      {v.power ? v.power.split("@")[0] : `${v.testDrive.maxSpeed} KM/H`}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const ComparisonRow: React.FC<{
  label: string;
  values: string[];
  highlightNumeric?: boolean;
  numericValues?: number[];
  invertHighlight?: boolean;
}> = ({ label, values, highlightNumeric, numericValues, invertHighlight }) => {
  let bestIdx = -1;
  if (highlightNumeric && numericValues && numericValues.length > 0) {
    if (invertHighlight) {
      const min = Math.min(...numericValues);
      bestIdx = numericValues.indexOf(min);
    } else {
      const max = Math.max(...numericValues);
      bestIdx = numericValues.indexOf(max);
    }
  }

  const gridColsClass =
    values.length === 3
      ? "grid-cols-3"
      : values.length === 2
      ? "grid-cols-2"
      : "grid-cols-1";

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between py-3 border-b border-white/5 dark:border-white/5 light:border-zinc-200 gap-2">
      <span className="font-mono-tech text-xs tracking-widest text-white/40 dark:text-white/40 light:text-zinc-500 uppercase sm:w-1/3">
        {label}
      </span>
      <div className={`grid gap-4 sm:w-2/3 ${gridColsClass}`}>
        {values.map((val, idx) => (
          <div key={idx} className="flex flex-col">
            <span
              className={`font-mono-tech text-xs uppercase font-medium ${
                highlightNumeric && bestIdx === idx
                  ? "text-[#d40000] font-bold"
                  : "text-white dark:text-white light:text-zinc-900"
              }`}
            >
              {val}
            </span>
            {highlightNumeric && numericValues && (
              <div className="w-full h-1 bg-white/10 dark:bg-white/10 light:bg-zinc-200 mt-1 rounded-full overflow-hidden">
                <div
                  className={`h-full ${
                    bestIdx === idx ? "bg-[#d40000]" : "bg-white/30 dark:bg-white/30 light:bg-zinc-400"
                  }`}
                  style={{
                    width: `${Math.min(
                      100,
                      (numericValues[idx] / Math.max(...numericValues)) * 100
                    )}%`,
                  }}
                />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
