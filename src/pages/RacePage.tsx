import React, { useState, useEffect, Suspense } from "react";
import { Canvas } from "@react-three/fiber";
import { vehicles } from "../data/vehicles";
import { useDrivingControls } from "../hooks/useDrivingControls";
import { TestDriveEnvironment } from "../three/TestDriveEnvironment";
import { DrivingPhysicsVehicle } from "../three/DrivingPhysicsVehicle";
import { TestDriveHUD } from "../components/test-drive/TestDriveHUD";
import { TestDrivePauseMenu } from "../components/test-drive/TestDrivePauseMenu";
import { useTestDriveStore } from "../store/testDriveStore";
import { engineAudio } from "../utils/engineAudio";
import type { Vehicle } from "../types/vehicle";

export const RacePage: React.FC = () => {
  // Default to race champion F1 2019 or first race machine, allow selecting any of the 15 Ferraris
  const defaultCar =
    vehicles.find((v) => v.id === "f1-2019") ||
    vehicles.find((v) => v.id === "296-gt3") ||
    vehicles[0];

  const [activeVehicle, setActiveVehicle] = useState<Vehicle>(defaultCar);
  const [isEntering, setIsEntering] = useState(true);

  const { controls, setVirtualControl } = useDrivingControls();
  const togglePause = useTestDriveStore((state) => state.togglePause);
  const soundEnabled = useTestDriveStore((state) => state.soundEnabled);
  const resetTestDrive = useTestDriveStore((state) => state.resetTestDrive);

  // Transition intro on car switch
  useEffect(() => {
    resetTestDrive();
    const timer = setTimeout(() => {
      setIsEntering(false);
    }, 900);
    return () => clearTimeout(timer);
  }, [activeVehicle.slug, resetTestDrive]);

  // Audio lifecycle & user gesture activation
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

  return (
    <div className="fixed inset-0 w-screen h-screen overflow-hidden bg-[#070709] select-none">
      {/* Cinematic Transition Overlay */}
      {isEntering && (
        <div className="absolute inset-0 z-50 bg-[#070709]/85 backdrop-blur-md pointer-events-none flex flex-col items-center justify-center text-center p-6 animate-out fade-out duration-500">
          <span className="w-3.5 h-3.5 bg-[#e10600] rotate-45 mb-4 animate-ping" />
          <h2 className="font-display font-black text-4xl sm:text-7xl uppercase tracking-[0.25em] text-white">
            SCUDERIA RACE ARENA
          </h2>
          <span className="font-mono-tech text-xs tracking-[0.4em] text-[#e10600] uppercase mt-2 font-bold">
            DRIVING {activeVehicle.name} &middot; 3RD-PERSON PURSUIT MODE
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
        onSelectVehicle={(newCar) => {
          setIsEntering(true);
          setActiveVehicle(newCar);
        }}
      />

      {/* ESC Pause Dialog */}
      <TestDrivePauseMenu vehicleSlug={activeVehicle.slug} />
    </div>
  );
};
