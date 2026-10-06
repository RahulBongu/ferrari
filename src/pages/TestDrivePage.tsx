import React, { useState, useEffect, Suspense } from "react";
import { useParams, Link } from "react-router-dom";
import { Canvas } from "@react-three/fiber";
import { getVehicleBySlug, vehicles } from "../data/vehicles";
import { useDrivingControls } from "../hooks/useDrivingControls";
import { TestDriveEnvironment } from "../three/TestDriveEnvironment";
import { DrivingPhysicsVehicle } from "../three/DrivingPhysicsVehicle";
import { TestDriveHUD } from "../components/test-drive/TestDriveHUD";
import { TestDrivePauseMenu } from "../components/test-drive/TestDrivePauseMenu";
import { useTestDriveStore } from "../store/testDriveStore";
import { engineAudio } from "../utils/engineAudio";
import { ArrowLeft } from "lucide-react";
import type { Vehicle } from "../types/vehicle";

export const TestDrivePage: React.FC = () => {
  const { vehicleId } = useParams<{ vehicleId: string }>();
  const initialVehicle = getVehicleBySlug(vehicleId || "") || vehicles[0];
  const [activeVehicle, setActiveVehicle] = useState<Vehicle>(initialVehicle);
  const [isEntering, setIsEntering] = useState(true);

  const { controls, setVirtualControl } = useDrivingControls();
  const togglePause = useTestDriveStore((state) => state.togglePause);
  const soundEnabled = useTestDriveStore((state) => state.soundEnabled);
  const resetTestDrive = useTestDriveStore((state) => state.resetTestDrive);

  // Sync route param with vehicle
  useEffect(() => {
    const v = getVehicleBySlug(vehicleId || "");
    if (v) setActiveVehicle(v);
  }, [vehicleId]);

  // Transition intro
  useEffect(() => {
    resetTestDrive();
    const timer = setTimeout(() => {
      setIsEntering(false);
    }, 1000);
    return () => clearTimeout(timer);
  }, [activeVehicle.slug, resetTestDrive]);

  // Audio lifecycle & automatic user gesture unlock
  useEffect(() => {
    const unlockAudio = () => {
      if (soundEnabled) {
        engineAudio.start();
      }
    };

    unlockAudio();
    window.addEventListener("pointerdown", unlockAudio, { once: true });

    return () => {
      window.removeEventListener("pointerdown", unlockAudio);
      engineAudio.stop();
    };
  }, [soundEnabled]);

  // Global hotkeys for ESC (pause)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        togglePause();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [togglePause]);

  if (!activeVehicle) {
    return (
      <div className="min-h-screen bg-[#070709] flex flex-col items-center justify-center text-center px-6 text-white">
        <h1 className="font-display font-black text-4xl uppercase mb-2">VEHICLE NOT FOUND</h1>
        <Link to="/garage" className="flex items-center gap-2 text-xs font-mono-tech text-[#d40000] uppercase">
          <ArrowLeft className="w-4 h-4" />
          <span>RETURN TO GARAGE</span>
        </Link>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 w-screen h-screen overflow-hidden bg-[#070709] select-none">
      {/* Cinematic Transition Overlay */}
      {isEntering && (
        <div className="absolute inset-0 z-50 bg-[#070709]/80 backdrop-blur-sm pointer-events-none flex flex-col items-center justify-center text-center p-6 animate-out fade-out duration-500">
          <span className="w-3 h-3 bg-[#d40000] rotate-45 mb-4 animate-ping" />
          <h2 className="font-display font-black text-4xl sm:text-6xl uppercase tracking-[0.25em] text-white">
            ENTERING 3RD-PERSON PURSUIT
          </h2>
          <span className="font-mono-tech text-xs tracking-[0.4em] text-[#d40000] uppercase mt-2">
            INITIALIZING {activeVehicle.name} &middot; MARANELLO DYNAMICS
          </span>
        </div>
      )}

      {/* 3D Canvas Driving Simulation - STRICTLY 3RD PERSON CHASE CAMERA */}
      <Canvas
        shadows
        camera={{ position: [0, 2.3, -6.6], fov: 62 }}
        gl={{ antialias: true, powerPreference: "high-performance" }}
        className="w-full h-full"
      >
        <TestDriveEnvironment />
        <Suspense fallback={null}>
          <DrivingPhysicsVehicle vehicle={activeVehicle} controls={controls} />
        </Suspense>
      </Canvas>

      {/* Dr. Driving Authentic Bottom Speedometer HUD with In-Game Car Switcher */}
      <TestDriveHUD
        vehicle={activeVehicle}
        setVirtualControl={setVirtualControl}
        onSelectVehicle={setActiveVehicle}
      />

      {/* ESC Pause Dialog */}
      <TestDrivePauseMenu vehicleSlug={activeVehicle.slug} />
    </div>
  );
};
