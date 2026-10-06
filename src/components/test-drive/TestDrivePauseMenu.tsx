import React from "react";
import { useNavigate } from "react-router-dom";
import { Play, RotateCcw, Camera, LogOut } from "lucide-react";
import { useTestDriveStore } from "../../store/testDriveStore";

interface TestDrivePauseMenuProps {
  vehicleSlug: string;
}

export const TestDrivePauseMenu: React.FC<TestDrivePauseMenuProps> = ({ vehicleSlug }) => {
  const navigate = useNavigate();
  const isPaused = useTestDriveStore((state) => state.isPaused);
  const setIsPaused = useTestDriveStore((state) => state.setIsPaused);
  const toggleCameraMode = useTestDriveStore((state) => state.toggleCameraMode);
  const resetTestDrive = useTestDriveStore((state) => state.resetTestDrive);

  if (!isPaused) return null;

  const handleResume = () => {
    setIsPaused(false);
  };

  const handleRestart = () => {
    resetTestDrive();
    setIsPaused(false);
  };

  const handleChangeCamera = () => {
    toggleCameraMode();
  };

  const handleExit = () => {
    setIsPaused(false);
    navigate(`/garage/${vehicleSlug}`);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-6 select-none animate-in fade-in duration-200">
      <div className="bg-[#0e0e14] border border-white/20 p-8 sm:p-10 max-w-sm w-full text-center shadow-2xl">
        <span className="w-2.5 h-2.5 bg-[#d40000] rotate-45 inline-block mb-3" />
        <h2 className="font-display font-black text-3xl uppercase tracking-[0.2em] text-white mb-1">
          PAUSED
        </h2>
        <p className="font-mono-tech text-[10px] text-white/40 uppercase tracking-widest mb-8">
          SIMULATION TEMPORARILY SUSPENDED
        </p>

        <div className="flex flex-col gap-3 font-mono-tech text-xs uppercase tracking-widest font-bold">
          {/* RESUME */}
          <button
            onClick={handleResume}
            className="flex items-center justify-center gap-3 py-3 px-6 bg-[#d40000] hover:bg-[#b50000] text-white transition-colors cursor-pointer"
          >
            <Play className="w-4 h-4 fill-white" />
            <span>RESUME</span>
          </button>

          {/* RESTART DRIVE */}
          <button
            onClick={handleRestart}
            className="flex items-center justify-center gap-3 py-3 px-6 bg-white/5 hover:bg-white/10 border border-white/10 text-white transition-colors cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
            <span>RESTART DRIVE</span>
          </button>

          {/* CHANGE CAMERA */}
          <button
            onClick={handleChangeCamera}
            className="flex items-center justify-center gap-3 py-3 px-6 bg-white/5 hover:bg-white/10 border border-white/10 text-white transition-colors cursor-pointer"
          >
            <Camera className="w-4 h-4 text-[#d40000]" />
            <span>CHANGE CAMERA</span>
          </button>

          {/* EXIT TEST DRIVE */}
          <button
            onClick={handleExit}
            className="flex items-center justify-center gap-3 py-3 px-6 bg-white/5 hover:bg-white/10 border border-white/10 text-white/60 hover:text-white transition-colors cursor-pointer mt-2"
          >
            <LogOut className="w-4 h-4" />
            <span>EXIT TEST DRIVE</span>
          </button>
        </div>
      </div>
    </div>
  );
};
