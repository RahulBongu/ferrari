import React, { useState } from "react";
import { Pause, Volume2, VolumeX, ChevronDown, RotateCcw } from "lucide-react";
import { useTestDriveStore } from "../../store/testDriveStore";
import { vehicles } from "../../data/vehicles";
import type { Vehicle } from "../../types/vehicle";
import type { DrivingControlsState } from "../../types/driving";

interface TestDriveHUDProps {
  vehicle: Vehicle;
  setVirtualControl: (key: keyof DrivingControlsState, value: boolean) => void;
  onSelectVehicle?: (newVehicle: Vehicle) => void;
}

export const TestDriveHUD: React.FC<TestDriveHUDProps> = ({
  vehicle,
  setVirtualControl,
  onSelectVehicle,
}) => {
  const telemetry = useTestDriveStore((state) => state.telemetry);
  const togglePause = useTestDriveStore((state) => state.togglePause);
  const soundEnabled = useTestDriveStore((state) => state.soundEnabled);
  const toggleSound = useTestDriveStore((state) => state.toggleSound);

  const [carSelectorOpen, setCarSelectorOpen] = useState(false);
  const [isGasPressed, setIsGasPressed] = useState(false);
  const [isBrakePressed, setIsBrakePressed] = useState(false);

  const profile = vehicle.testDrive;
  const maxSpeed = profile.maxSpeed || 320;
  const revLimit = profile.revLimit || 8500;

  // Dr. Driving Analog Speedometer Needle Calculation (-135deg to +135deg)
  const speedRatio = Math.min(1, Math.max(0, telemetry.speedKmh / maxSpeed));
  const needleRotationDeg = -135 + speedRatio * 270;

  // RPM percentage
  const rpmRatio = Math.min(1, Math.max(0, telemetry.rpm / revLimit));

  // Steering wheel visual rotation angle (-45deg to +45deg)
  const steerWheelAngle = telemetry.steeringAngle * 45;

  return (
    <div className="absolute inset-0 pointer-events-none select-none flex flex-col justify-between p-3 sm:p-6 z-20 overflow-hidden font-sans">
      {/* ======================================================== */}
      {/* 1. TOP HEADER BAR: VEHICLE BADGE, DISTANCE, AND ACTIONS */}
      {/* ======================================================== */}
      <div className="flex items-start justify-between gap-4 pointer-events-auto">
        {/* Left: Active Vehicle & Car Switcher */}
        <div className="relative">
          <div
            onClick={() => onSelectVehicle && setCarSelectorOpen(!carSelectorOpen)}
            className={`flex items-center gap-3 bg-black/80 backdrop-blur-md px-4 py-2.5 rounded-xl border border-white/20 shadow-xl transition-all ${
              onSelectVehicle ? "cursor-pointer hover:border-[#d40000]" : ""
            }`}
          >
            <div className="w-2.5 h-2.5 bg-[#d40000] rotate-45" />
            <div>
              <div className="flex items-center gap-2">
                <span className="font-display font-black text-lg sm:text-2xl uppercase tracking-wider text-white">
                  {vehicle.name}
                </span>
                {onSelectVehicle && (
                  <ChevronDown className="w-4 h-4 text-white/60 hover:text-white transition-transform" />
                )}
              </div>
              <div className="flex items-center gap-2 font-mono-tech text-[10px] text-white/50 uppercase tracking-widest">
                <span className="text-[#d40000] font-bold">
                  {vehicle.type === "FORMULA" ? "F1 PURSUIT" : vehicle.type === "RACE" ? "GT RACE" : "MANETTINO: RACE"}
                </span>
                <span>&middot;</span>
                <span>3RD-PERSON CHASE</span>
                <span>&middot;</span>
                <span className="text-white/80">{vehicle.power ? vehicle.power.split("@")[0] : `${maxSpeed} KM/H`}</span>
              </div>
            </div>
          </div>

          {/* Car Selector Dropdown Drawer */}
          {carSelectorOpen && onSelectVehicle && (
            <div className="absolute top-full left-0 mt-2 w-80 sm:w-96 max-h-[70vh] overflow-y-auto bg-black/95 backdrop-blur-2xl border border-white/20 rounded-xl p-3 shadow-2xl z-50">
              <div className="flex items-center justify-between pb-2 mb-2 border-b border-white/10">
                <span className="font-mono-tech text-[10px] uppercase tracking-widest text-[#d40000] font-bold">
                  SWITCH FERRARI (15 AVAILABLE)
                </span>
                <span className="font-mono-tech text-[9px] text-white/40">INSTANT SWAP</span>
              </div>
              <div className="grid grid-cols-1 gap-1.5">
                {vehicles.map((v) => (
                  <button
                    key={v.id}
                    onClick={() => {
                      onSelectVehicle(v);
                      setCarSelectorOpen(false);
                    }}
                    className={`flex items-center gap-3 p-2 rounded-lg border text-left transition-all ${
                      v.slug === vehicle.slug
                        ? "bg-[#d40000]/20 border-[#d40000]"
                        : "bg-white/5 border-white/10 hover:border-white/30 hover:bg-white/10"
                    }`}
                  >
                    <img
                      src={v.heroImage}
                      alt={v.name}
                      className="w-14 h-9 object-cover rounded bg-black/50"
                    />
                    <div className="flex-1">
                      <span className="font-display font-bold text-xs uppercase block text-white">
                        {v.name}
                      </span>
                      <span className="font-mono-tech text-[9px] text-white/50 uppercase">
                        {v.category} &middot; {v.testDrive.maxSpeed} KM/H
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Center: Dr. Driving Straight Runway Progress */}
        <div className="hidden md:flex flex-col items-center gap-1 bg-black/80 backdrop-blur-md px-5 py-2 rounded-full border border-white/20 shadow-xl">
          <div className="flex items-center justify-between w-64 lg:w-80 font-mono-tech text-[10px] tracking-widest text-white/70 uppercase">
            <span>0M</span>
            <span className="text-[#d40000] font-bold">{telemetry.distanceTraveledMeters} M / 3,000 M</span>
            <span>FINISH 3KM</span>
          </div>
          <div className="w-full h-1.5 bg-white/15 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-[#d40000] via-amber-400 to-emerald-400 transition-all duration-75"
              style={{ width: `${Math.min(100, (telemetry.distanceTraveledMeters / 3000) * 100)}%` }}
            />
          </div>
        </div>

        {/* Right: Sound & Pause Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={toggleSound}
            className="p-2.5 rounded-xl bg-black/80 backdrop-blur-md border border-white/20 hover:border-white/40 text-white transition-all shadow-lg cursor-pointer"
            title="Toggle Engine Audio"
          >
            {soundEnabled ? (
              <Volume2 className="w-4 h-4 text-[#d40000]" />
            ) : (
              <VolumeX className="w-4 h-4 text-white/40" />
            )}
          </button>

          <button
            onClick={togglePause}
            className="p-2.5 rounded-xl bg-black/80 backdrop-blur-md border border-white/20 hover:border-white/40 text-white transition-all shadow-lg cursor-pointer"
            title="Pause [ESC]"
          >
            <Pause className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* ======================================================== */}
      {/* 2. DR. DRIVING AUTHENTIC BOTTOM DASHBOARD & SPEEDOMETER */}
      {/* ======================================================== */}
      <div className="w-full pointer-events-auto flex items-end justify-between gap-2 sm:gap-6 pt-4">
        {/* ====================================================== */}
        {/* LEFT: DR. DRIVING STEERING WHEEL & BRAKE PEDAL */}
        {/* ====================================================== */}
        <div className="flex items-end gap-3 sm:gap-6">
          {/* Dr. Driving Rotary Steering Wheel */}
          <div className="flex flex-col items-center">
            <div
              className="relative w-24 h-24 sm:w-32 sm:h-32 rounded-full border-4 border-zinc-700 bg-zinc-900/90 shadow-[0_0_25px_rgba(0,0,0,0.8)] flex items-center justify-center transition-transform duration-75 select-none"
              style={{ transform: `rotate(${steerWheelAngle}deg)` }}
            >
              {/* Outer wheel grip texture */}
              <div className="absolute inset-1 rounded-full border-2 border-zinc-800" />
              {/* Center 3-spoke hub */}
              <div className="absolute w-full h-3 bg-zinc-800" />
              <div className="absolute h-full w-3 bg-zinc-800 bottom-0" style={{ height: "50%" }} />
              {/* Center Prancing Horse Yellow Emblem */}
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-[#ffcc00] border-2 border-amber-600 flex items-center justify-center shadow-md z-10">
                <span className="font-display font-black text-black text-[10px] sm:text-xs">SF</span>
              </div>
            </div>

            {/* Left / Right steering tap buttons */}
            <div className="flex items-center gap-2 mt-2">
              <button
                onPointerDown={() => setVirtualControl("steerLeft", true)}
                onPointerUp={() => setVirtualControl("steerLeft", false)}
                onPointerLeave={() => setVirtualControl("steerLeft", false)}
                className="px-3 py-1.5 rounded-lg bg-black/70 hover:bg-[#d40000] border border-white/20 text-white font-mono-tech text-xs uppercase font-bold transition-all shadow-md active:scale-95"
              >
                &larr; A
              </button>
              <button
                onPointerDown={() => setVirtualControl("steerRight", true)}
                onPointerUp={() => setVirtualControl("steerRight", false)}
                onPointerLeave={() => setVirtualControl("steerRight", false)}
                className="px-3 py-1.5 rounded-lg bg-black/70 hover:bg-[#d40000] border border-white/20 text-white font-mono-tech text-xs uppercase font-bold transition-all shadow-md active:scale-95"
              >
                D &rarr;
              </button>
            </div>
          </div>

          {/* Dr. Driving Metallic Brake Pedal */}
          <div className="flex flex-col items-center">
            <button
              onPointerDown={() => {
                setIsBrakePressed(true);
                setVirtualControl("brake", true);
              }}
              onPointerUp={() => {
                setIsBrakePressed(false);
                setVirtualControl("brake", false);
              }}
              onPointerLeave={() => {
                setIsBrakePressed(false);
                setVirtualControl("brake", false);
              }}
              className={`w-16 sm:w-20 h-20 sm:h-24 rounded-lg border-2 border-zinc-600 bg-gradient-to-b from-zinc-700 via-zinc-800 to-zinc-950 flex flex-col items-center justify-center text-white shadow-2xl transition-all cursor-pointer ${
                isBrakePressed || telemetry.brake > 0
                  ? "scale-95 brightness-125 border-amber-500 shadow-[0_0_20px_rgba(245,158,11,0.6)] translate-y-1"
                  : "hover:border-zinc-400"
              }`}
              title="Brake / Reverse [S / ↓]"
            >
              {/* Rubber Tread Lines */}
              <div className="w-10 sm:w-12 h-1 bg-zinc-900 rounded-full mb-1 shadow-inner" />
              <div className="w-10 sm:w-12 h-1 bg-zinc-900 rounded-full mb-1 shadow-inner" />
              <div className="w-10 sm:w-12 h-1 bg-zinc-900 rounded-full mb-2 shadow-inner" />
              <span className="font-mono-tech text-[10px] sm:text-xs font-black tracking-widest text-zinc-300 uppercase">
                BRAKE
              </span>
            </button>
            <span className="font-mono-tech text-[9px] text-white/40 mt-1 uppercase">S / &darr;</span>
          </div>
        </div>

        {/* ====================================================== */}
        {/* CENTER: DR. DRIVING SPEEDOMETER DIAL & GEAR CLUSTER */}
        {/* ====================================================== */}
        <div className="flex flex-col items-center">
          {/* Main Circular Speedometer Gauge */}
          <div className="relative w-36 h-36 sm:w-48 sm:h-48 rounded-full bg-gradient-to-b from-zinc-900 via-black to-zinc-950 border-4 border-zinc-700 shadow-[0_0_40px_rgba(0,0,0,0.9)] flex items-center justify-center">
            {/* Speedometer Outer Ring Tick Marks & Speed Numbers */}
            <svg className="absolute inset-0 w-full h-full p-2" viewBox="0 0 200 200">
              {/* Background Arc */}
              <circle
                cx="100"
                cy="100"
                r="82"
                fill="none"
                stroke="#27272a"
                strokeWidth="10"
                strokeDasharray="386"
                strokeDashoffset="100"
                transform="rotate(135 100 100)"
              />
              {/* Active Colored Speed Arc */}
              <circle
                cx="100"
                cy="100"
                r="82"
                fill="none"
                stroke={speedRatio > 0.85 ? "#ff1801" : speedRatio > 0.5 ? "#f59e0b" : "#d40000"}
                strokeWidth="10"
                strokeDasharray="386"
                strokeDashoffset={386 - speedRatio * 286}
                strokeLinecap="round"
                transform="rotate(135 100 100)"
                className="transition-all duration-75"
              />
            </svg>

            {/* Analog Needle */}
            <div
              className="absolute inset-0 flex items-center justify-center transition-transform duration-75 pointer-events-none"
              style={{ transform: `rotate(${needleRotationDeg}deg)` }}
            >
              {/* Needle pointer */}
              <div
                className="w-1.5 h-16 sm:h-22 bg-gradient-to-t from-red-600 to-white rounded-full shadow-[0_0_10px_#ff0000] -translate-y-8 sm:-translate-y-11"
              />
            </div>

            {/* Center Dial Hub & Digital Speed Readout */}
            <div className="relative w-22 h-22 sm:w-28 sm:h-28 rounded-full bg-black/90 border border-zinc-700 flex flex-col items-center justify-center z-10 shadow-inner">
              <span className="font-mono-tech text-[8px] sm:text-[9px] tracking-widest text-zinc-400 uppercase">
                SPEED
              </span>
              <div className="font-display font-black text-3xl sm:text-5xl text-white tracking-tighter leading-none my-0.5">
                {telemetry.speedKmh}
              </div>
              <span className="font-mono-tech text-[9px] sm:text-[10px] tracking-widest text-[#d40000] font-black uppercase">
                KM/H
              </span>
            </div>

            {/* RPM LED Arc at the bottom of the dial */}
            <div className="absolute bottom-2 inset-x-6 flex flex-col items-center gap-0.5 z-10">
              <div className="w-16 sm:w-20 h-1 bg-zinc-800 rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all duration-75 ${
                    rpmRatio > 0.85 ? "bg-[#ff1801]" : rpmRatio > 0.65 ? "bg-amber-400" : "bg-emerald-400"
                  }`}
                  style={{ width: `${rpmRatio * 100}%` }}
                />
              </div>
              <div className="flex items-center gap-1 font-mono-tech text-[8px] text-zinc-400">
                <span>RPM:</span>
                <span className="font-bold text-white tracking-wider">{telemetry.rpm}</span>
              </div>
            </div>
          </div>

          {/* Dr. Driving Gear Selector Strip: P R N D / 1..7 */}
          <div className="flex items-center gap-1 sm:gap-2 mt-2 bg-black/85 backdrop-blur-md px-3 sm:px-4 py-1.5 rounded-full border border-white/15 shadow-lg">
            {["R", "1", "2", "3", "4", "5", "6", "7"].map((gearLabel) => {
              const isCurrent =
                (gearLabel === "R" && telemetry.gear === "R") ||
                String(telemetry.gear) === gearLabel;
              return (
                <span
                  key={gearLabel}
                  className={`px-2 py-0.5 rounded text-[10px] sm:text-xs font-mono-tech font-black transition-all ${
                    isCurrent
                      ? "bg-[#d40000] text-white shadow-[0_0_10px_rgba(212,0,0,0.8)] scale-110"
                      : "text-zinc-500"
                  }`}
                >
                  {gearLabel}
                </span>
              );
            })}
          </div>
        </div>

        {/* ====================================================== */}
        {/* RIGHT: DR. DRIVING ACCELERATOR / GAS PEDAL */}
        {/* ====================================================== */}
        <div className="flex flex-col items-center">
          <button
            onPointerDown={() => {
              setIsGasPressed(true);
              setVirtualControl("throttle", true);
            }}
            onPointerUp={() => {
              setIsGasPressed(false);
              setVirtualControl("throttle", false);
            }}
            onPointerLeave={() => {
              setIsGasPressed(false);
              setVirtualControl("throttle", false);
            }}
            className={`w-16 sm:w-20 h-28 sm:h-34 rounded-xl border-2 border-zinc-600 bg-gradient-to-b from-zinc-700 via-zinc-800 to-zinc-950 flex flex-col items-center justify-between py-3 text-white shadow-2xl transition-all cursor-pointer ${
              isGasPressed || telemetry.throttle > 0
                ? "scale-95 brightness-125 border-[#d40000] shadow-[0_0_25px_rgba(212,0,0,0.7)] translate-y-1.5"
                : "hover:border-zinc-400"
            }`}
            title="Accelerate / Gas [W / ↑]"
          >
            {/* Drilled Metal Grip Holes */}
            <div className="flex gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-black shadow-inner" />
              <div className="w-2.5 h-2.5 rounded-full bg-black shadow-inner" />
            </div>
            <div className="flex gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-black shadow-inner" />
              <div className="w-2.5 h-2.5 rounded-full bg-black shadow-inner" />
            </div>
            <div className="flex gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-black shadow-inner" />
              <div className="w-2.5 h-2.5 rounded-full bg-black shadow-inner" />
            </div>
            <span className="font-mono-tech text-[10px] sm:text-xs font-black tracking-widest text-[#d40000] uppercase">
              GAS
            </span>
          </button>
          <span className="font-mono-tech text-[9px] text-white/40 mt-1 uppercase">W / &uarr;</span>
        </div>
      </div>

      {/* ======================================================== */}
      {/* 3. FINISH RUN BANNER */}
      {/* ======================================================== */}
      {telemetry.distanceTraveledMeters >= 3000 && (
        <div className="absolute inset-0 z-50 bg-black/90 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center pointer-events-auto animate-in zoom-in-95 duration-500">
          <span className="w-3 h-3 bg-[#d40000] rotate-45 mb-4 animate-ping" />
          <h2 className="font-display font-black text-4xl sm:text-6xl uppercase tracking-[0.2em] text-white">
            PROVING RUN FINISHED!
          </h2>
          <span className="font-mono-tech text-xs tracking-widest text-[#d40000] uppercase mt-2">
            3,000-METER STRAIGHT HIGH-SPEED RUN COMPLETE IN {vehicle.name}
          </span>
          <div className="my-6 p-4 bg-white/5 border border-white/10 rounded-lg font-mono-tech text-sm flex gap-8">
            <div>
              <span className="block text-[10px] text-white/40 uppercase">TERMINAL SPEED</span>
              <span className="text-3xl font-bold text-white">{telemetry.speedKmh} KM/H</span>
            </div>
            <div>
              <span className="block text-[10px] text-white/40 uppercase">DISTANCE</span>
              <span className="text-3xl font-bold text-[#d40000]">3,000 M</span>
            </div>
          </div>
          <button
            onClick={() => window.location.reload()}
            className="flex items-center gap-2 px-8 py-3.5 bg-[#d40000] hover:bg-[#b50000] text-white font-mono-tech text-xs uppercase tracking-widest font-bold rounded shadow-[0_0_25px_rgba(212,0,0,0.5)] transition-all cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
            <span>RESTART RUN</span>
          </button>
        </div>
      )}
    </div>
  );
};
