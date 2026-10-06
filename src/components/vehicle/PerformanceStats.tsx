import React from "react";
import type { Vehicle } from "../../types/vehicle";

interface PerformanceStatsProps {
  vehicle: Vehicle;
}

export const PerformanceStats: React.FC<PerformanceStatsProps> = ({ vehicle }) => {
  return (
    <section className="py-16 border-t border-white/10">
      <div className="mb-8">
        <span className="font-mono-tech text-[10px] uppercase tracking-[0.3em] text-[#d40000] font-bold block mb-1">
          ENGINEERING METRICS
        </span>
        <h2 className="font-display font-black text-3xl sm:text-4xl uppercase text-white dark:text-white light:!text-black tracking-wide">
          PERFORMANCE BENCHMARKS
        </h2>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Power Card */}
        <div className="bg-[#0c0c11] border border-white/10 p-8 flex flex-col justify-between dark-card-content shadow-lg">
          <div>
            <span className="font-mono-tech text-[10px] tracking-[0.25em] !text-white/60 uppercase block mb-2">
              POWER OUTPUT
            </span>
            <div className="font-display text-4xl sm:text-5xl font-black !text-white">
              {vehicle.power || "—"}
            </div>
          </div>
          <div className="mt-8 pt-4 border-t border-white/10 font-mono-tech text-[10px] !text-white/40 uppercase tracking-widest">
            {vehicle.engineType || "OFFICIAL DYNO VERIFICATION"}
          </div>
        </div>

        {/* Torque Card */}
        <div className="bg-[#0c0c11] border border-white/10 p-8 flex flex-col justify-between dark-card-content shadow-lg">
          <div>
            <span className="font-mono-tech text-[10px] tracking-[0.25em] !text-white/60 uppercase block mb-2">
              MAX TORQUE
            </span>
            <div className="font-display text-4xl sm:text-5xl font-black !text-white">
              {vehicle.torque || "—"}
            </div>
          </div>
          <div className="mt-8 pt-4 border-t border-white/10 font-mono-tech text-[10px] !text-white/40 uppercase tracking-widest">
            OPTIMAL RPM CURVE
          </div>
        </div>

        {/* 0-100 Card */}
        <div className="bg-[#0c0c11] border border-white/10 p-8 flex flex-col justify-between dark-card-content shadow-lg">
          <div>
            <span className="font-mono-tech text-[10px] tracking-[0.25em] !text-white/60 uppercase block mb-2">
              0–100 KM/H
            </span>
            <div className="font-display text-4xl sm:text-5xl font-black !text-white">
              {vehicle.zeroToHundred || "—"}
            </div>
          </div>
          <div className="mt-8 pt-4 border-t border-white/10 font-mono-tech text-[10px] !text-white/40 uppercase tracking-widest">
            LAUNCH CONTROL ACTIVE
          </div>
        </div>

        {/* Top Speed Card */}
        <div className="bg-[#0c0c11] border border-white/10 p-8 flex flex-col justify-between dark-card-content shadow-lg">
          <div>
            <span className="font-mono-tech text-[10px] tracking-[0.25em] !text-white/60 uppercase block mb-2">
              TOP SPEED
            </span>
            <div className="font-display text-4xl sm:text-5xl font-black !text-white">
              {vehicle.topSpeed || "—"}
            </div>
          </div>
          <div className="mt-8 pt-4 border-t border-white/10 font-mono-tech text-[10px] !text-white/40 uppercase tracking-widest">
            AERODYNAMIC TERMINAL VELOCITY
          </div>
        </div>
      </div>
    </section>
  );
};
