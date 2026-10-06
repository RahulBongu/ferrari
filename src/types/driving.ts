export type CameraMode = "DRIVER_POV" | "THIRD_PERSON";

export interface DrivingControlsState {
  throttle: boolean;
  brake: boolean;
  steerLeft: boolean;
  steerRight: boolean;
  handbrake: boolean;
}

export interface VehicleTelemetry {
  speedKmh: number;
  rpm: number;
  gear: number | "N" | "R";
  throttle: number; // 0 to 1
  brake: number; // 0 to 1
  steeringAngle: number; // -1 to 1
  lateralG: number;
  distanceTraveledMeters: number;
  driveTimeSeconds: number;
}
