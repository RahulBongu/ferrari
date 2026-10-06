export type VehicleType = "ROAD" | "HYPERCAR" | "RACE" | "FORMULA";

export interface VehicleDimensions {
  length?: string;
  width?: string;
  height?: string;
  wheelbase?: string;
}

export interface VehicleDrivingProfile {
  enabled: boolean;
  maxSpeed: number; // in km/h
  acceleration: number; // responsive multiplier
  braking: number;
  steering: number;
  grip: number;
  mass: number; // in kg
  gears: number;
  revLimit?: number; // RPM max
  idleRpm?: number;
}

export interface Vehicle {
  id: string;
  name: string;
  slug: string;
  type: VehicleType;
  year?: number;
  category: string;
  tagline?: string;
  description?: string;

  heroImage: string;
  thumbnail: string;
  gallery: string[];
  model3D?: string;

  // Specifications
  engine?: string;
  engineType?: string;
  displacement?: string;
  cylinders?: string;
  power?: string;
  torque?: string;
  transmission?: string;
  driveType?: string;
  zeroToHundred?: string;
  zeroToTwoHundred?: string;
  topSpeed?: string;
  weight?: string;

  dimensions?: VehicleDimensions;

  technology?: string[];
  aerodynamics?: string[];
  interiorFeatures?: string[];
  exteriorFeatures?: string[];
  colors?: string[];

  testDrive: VehicleDrivingProfile;
}
