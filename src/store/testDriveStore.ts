import { create } from "zustand";
import type { CameraMode, VehicleTelemetry } from "../types/driving";

interface TestDriveStore {
  cameraMode: CameraMode;
  isPaused: boolean;
  soundEnabled: boolean;
  telemetry: VehicleTelemetry;
  setCameraMode: (mode: CameraMode) => void;
  toggleCameraMode: () => void;
  setIsPaused: (paused: boolean) => void;
  togglePause: () => void;
  setSoundEnabled: (enabled: boolean) => void;
  toggleSound: () => void;
  updateTelemetry: (telemetry: Partial<VehicleTelemetry>) => void;
  resetTestDrive: () => void;
}

const initialTelemetry: VehicleTelemetry = {
  speedKmh: 0,
  rpm: 950,
  gear: "N",
  throttle: 0,
  brake: 0,
  steeringAngle: 0,
  lateralG: 0,
  distanceTraveledMeters: 0,
  driveTimeSeconds: 0,
};

export const useTestDriveStore = create<TestDriveStore>((set) => ({
  cameraMode: "THIRD_PERSON",
  isPaused: false,
  soundEnabled: true,
  telemetry: initialTelemetry,

  setCameraMode: (mode) => set({ cameraMode: mode }),
  toggleCameraMode: () =>
    set((state) => ({
      cameraMode: state.cameraMode === "DRIVER_POV" ? "THIRD_PERSON" : "DRIVER_POV",
    })),

  setIsPaused: (paused) => set({ isPaused: paused }),
  togglePause: () => set((state) => ({ isPaused: !state.isPaused })),

  setSoundEnabled: (enabled) => set({ soundEnabled: enabled }),
  toggleSound: () => set((state) => ({ soundEnabled: !state.soundEnabled })),

  updateTelemetry: (partial) =>
    set((state) => ({
      telemetry: { ...state.telemetry, ...partial },
    })),

  resetTestDrive: () =>
    set({
      telemetry: initialTelemetry,
      isPaused: false,
    }),
}));
