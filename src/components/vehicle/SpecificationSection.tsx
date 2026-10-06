import React from "react";
import type { Vehicle } from "../../types/vehicle";
import { Gauge, Cpu, Sliders, Ruler, ShieldCheck } from "lucide-react";

interface SpecificationSectionProps {
  vehicle: Vehicle;
}

export const SpecificationSection: React.FC<SpecificationSectionProps> = ({ vehicle }) => {
  return (
    <section className="py-16 border-t border-white/10">
      <div className="mb-12">
        <span className="font-mono-tech text-[10px] uppercase tracking-[0.3em] text-[#d40000] font-bold block mb-1">
          TECHNICAL SPECS
        </span>
        <h2 className="font-display font-black text-3xl sm:text-4xl uppercase text-white dark:text-white light:!text-black tracking-wide">
          SPECIFICATIONS & ARCHITECTURE
        </h2>
        <p className="font-sans text-xs text-white/50 dark:text-white/50 light:!text-zinc-700 max-w-xl mt-1">
          Factory parameters categorized by powertrain, dynamics, dimensional footprint, and aerodynamic systems.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* 1. ENGINE & POWERTRAIN */}
        <div className="bg-[#0b0b10] border border-white/10 p-6 sm:p-8 dark-card-content">
          <div className="flex items-center gap-3 mb-6 pb-3 border-b border-white/10">
            <Cpu className="w-5 h-5 text-[#d40000]" />
            <h3 className="font-mono-tech text-xs tracking-[0.2em] uppercase font-bold text-white">
              ENGINE & POWERTRAIN
            </h3>
          </div>
          <div className="space-y-4 font-mono-tech text-xs">
            <div className="flex justify-between py-2 border-b border-white/5">
              <span className="text-white/40 uppercase">ENGINE CONFIGURATION</span>
              <span className="text-white font-medium text-right">{vehicle.engine || "SPECIFICATION PENDING"}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-white/5">
              <span className="text-white/40 uppercase">INDUCTION TYPE</span>
              <span className="text-white font-medium text-right">{vehicle.engineType || "SPECIFICATION PENDING"}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-white/5">
              <span className="text-white/40 uppercase">DISPLACEMENT</span>
              <span className="text-white font-medium text-right">{vehicle.displacement || "SPECIFICATION PENDING"}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-white/5">
              <span className="text-white/40 uppercase">CYLINDERS</span>
              <span className="text-white font-medium text-right">{vehicle.cylinders || "SPECIFICATION PENDING"}</span>
            </div>
          </div>
        </div>

        {/* 2. TRANSMISSION & DRIVETRAIN */}
        <div className="bg-[#0b0b10] border border-white/10 p-6 sm:p-8 dark-card-content">
          <div className="flex items-center gap-3 mb-6 pb-3 border-b border-white/10">
            <Sliders className="w-5 h-5 text-[#d40000]" />
            <h3 className="font-mono-tech text-xs tracking-[0.2em] uppercase font-bold text-white">
              TRANSMISSION & DRIVETRAIN
            </h3>
          </div>
          <div className="space-y-4 font-mono-tech text-xs">
            <div className="flex justify-between py-2 border-b border-white/5">
              <span className="text-white/40 uppercase">GEARBOX TYPE</span>
              <span className="text-white font-medium text-right">{vehicle.transmission || "SPECIFICATION PENDING"}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-white/5">
              <span className="text-white/40 uppercase">DRIVE CONFIGURATION</span>
              <span className="text-white font-medium text-right">{vehicle.driveType || "SPECIFICATION PENDING"}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-white/5">
              <span className="text-white/40 uppercase">SIMULATED GEARS</span>
              <span className="text-white font-medium text-right">{vehicle.testDrive.gears} FORWARD RATIOS</span>
            </div>
            <div className="flex justify-between py-2 border-b border-white/5">
              <span className="text-white/40 uppercase">REV LIMIT CEILING</span>
              <span className="text-white font-medium text-right">{vehicle.testDrive.revLimit || 8500} RPM</span>
            </div>
          </div>
        </div>

        {/* 3. PERFORMANCE DYNAMICS */}
        <div className="bg-[#0b0b10] border border-white/10 p-6 sm:p-8 dark-card-content">
          <div className="flex items-center gap-3 mb-6 pb-3 border-b border-white/10">
            <Gauge className="w-5 h-5 text-[#d40000]" />
            <h3 className="font-mono-tech text-xs tracking-[0.2em] uppercase font-bold text-white">
              PERFORMANCE DYNAMICS
            </h3>
          </div>
          <div className="space-y-4 font-mono-tech text-xs">
            <div className="flex justify-between py-2 border-b border-white/5">
              <span className="text-white/40 uppercase">POWER</span>
              <span className="text-white font-medium text-right">{vehicle.power || "—"}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-white/5">
              <span className="text-white/40 uppercase">TORQUE</span>
              <span className="text-white font-medium text-right">{vehicle.torque || "—"}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-white/5">
              <span className="text-white/40 uppercase">ACCELERATION 0–100 KM/H</span>
              <span className="text-white font-medium text-right">{vehicle.zeroToHundred || "—"}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-white/5">
              <span className="text-white/40 uppercase">ACCELERATION 0–200 KM/H</span>
              <span className="text-white font-medium text-right">{vehicle.zeroToTwoHundred || "—"}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-white/5">
              <span className="text-white/40 uppercase">TOP SPEED</span>
              <span className="text-white font-medium text-right">{vehicle.topSpeed || "—"}</span>
            </div>
          </div>
        </div>

        {/* 4. DIMENSIONS & WEIGHT */}
        <div className="bg-[#0b0b10] border border-white/10 p-6 sm:p-8 dark-card-content">
          <div className="flex items-center gap-3 mb-6 pb-3 border-b border-white/10">
            <Ruler className="w-5 h-5 text-[#d40000]" />
            <h3 className="font-mono-tech text-xs tracking-[0.2em] uppercase font-bold text-white">
              DIMENSIONS & MASS
            </h3>
          </div>
          <div className="space-y-4 font-mono-tech text-xs">
            <div className="flex justify-between py-2 border-b border-white/5">
              <span className="text-white/40 uppercase">KERB WEIGHT</span>
              <span className="text-white font-medium text-right">{vehicle.weight || "—"}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-white/5">
              <span className="text-white/40 uppercase">OVERALL LENGTH</span>
              <span className="text-white font-medium text-right">{vehicle.dimensions?.length || "—"}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-white/5">
              <span className="text-white/40 uppercase">OVERALL WIDTH</span>
              <span className="text-white font-medium text-right">{vehicle.dimensions?.width || "—"}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-white/5">
              <span className="text-white/40 uppercase">OVERALL HEIGHT</span>
              <span className="text-white font-medium text-right">{vehicle.dimensions?.height || "—"}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-white/5">
              <span className="text-white/40 uppercase">WHEELBASE</span>
              <span className="text-white font-medium text-right">{vehicle.dimensions?.wheelbase || "—"}</span>
            </div>
          </div>
        </div>
      </div>

      {/* 5. TECHNOLOGY & INNOVATIONS */}
      {((vehicle.technology && vehicle.technology.length > 0) ||
        (vehicle.aerodynamics && vehicle.aerodynamics.length > 0)) && (
        <div className="mt-8 bg-[#0b0b10] border border-white/10 p-6 sm:p-8 dark-card-content">
          <div className="flex items-center gap-3 mb-6 pb-3 border-b border-white/10">
            <ShieldCheck className="w-5 h-5 text-[#d40000]" />
            <h3 className="font-mono-tech text-xs tracking-[0.2em] uppercase font-bold text-white">
              AERODYNAMIC INNOVATIONS & MOTORSPORT SYSTEMS
            </h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {vehicle.aerodynamics?.map((aero, i) => (
              <div key={`aero-${i}`} className="flex items-start gap-3 p-3 bg-white/5 border border-white/5">
                <span className="w-1.5 h-1.5 bg-[#d40000] rotate-45 mt-1.5 shrink-0" />
                <span className="font-mono-tech text-xs text-white/90">{aero}</span>
              </div>
            ))}
            {vehicle.technology?.map((tech, i) => (
              <div key={`tech-${i}`} className="flex items-start gap-3 p-3 bg-white/5 border border-white/5">
                <span className="w-1.5 h-1.5 bg-white/40 rotate-45 mt-1.5 shrink-0" />
                <span className="font-mono-tech text-xs text-white/90">{tech}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
};
