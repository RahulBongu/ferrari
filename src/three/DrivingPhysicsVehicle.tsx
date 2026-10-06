import React, { useRef, useEffect, Suspense } from "react";
import * as THREE from "three";
import { useFrame, useThree } from "@react-three/fiber";
import type { Vehicle } from "../types/vehicle";
import type { DrivingControlsState } from "../types/driving";
import { useTestDriveStore } from "../store/testDriveStore";
import { engineAudio } from "../utils/engineAudio";
import { VehicleModel } from "./VehicleModel";
import { ProceduralFerrariModel } from "./ProceduralFerrariModel";

interface DrivingPhysicsVehicleProps {
  vehicle: Vehicle;
  controls: DrivingControlsState;
}

export const DrivingPhysicsVehicle: React.FC<DrivingPhysicsVehicleProps> = ({
  vehicle,
  controls,
}) => {
  const { camera } = useThree();
  const carRef = useRef<THREE.Group>(null);
  const brakeLightLeftRef = useRef<THREE.PointLight>(null);
  const brakeLightRightRef = useRef<THREE.PointLight>(null);

  // Driving physics state stored in refs for 60fps mutability
  const position = useRef(new THREE.Vector3(0, 0, 0));
  const velocity = useRef(0); // m/s
  const heading = useRef(0); // radians (0 = along +Z axis)
  const steeringAngle = useRef(0); // -maxSteer to +maxSteer
  const currentGear = useRef<number | "N" | "R">(1);
  const currentRpm = useRef(vehicle.testDrive.idleRpm || 950);
  const distanceTraveled = useRef(0);
  const prevGear = useRef<number | "N" | "R">(1);

  const isPaused = useTestDriveStore((state) => state.isPaused);
  const soundEnabled = useTestDriveStore((state) => state.soundEnabled);
  const updateTelemetry = useTestDriveStore((state) => state.updateTelemetry);

  const profile = vehicle.testDrive;
  const maxSpeedKmh = profile.maxSpeed || 320;
  const maxSpeedMs = maxSpeedKmh / 3.6;
  const maxGears = profile.gears || 6;
  const revLimit = profile.revLimit || 8500;
  const idleRpm = profile.idleRpm || 950;

  // Reset or adjust physics baseline when car changes
  useEffect(() => {
    currentRpm.current = idleRpm;
  }, [vehicle.id, idleRpm]);

  useFrame((_, delta) => {
    if (isPaused) return;

    // Cap delta to prevent physics explosion on tab-switching
    const dt = Math.min(delta, 0.033);

    // 1. Steering Input & Smoothing (Dr. Driving precision control)
    const maxSteerAngle = 0.52;
    const steerSpeed = 4.0;
    let targetSteer = 0;
    if (controls.steerLeft) targetSteer += maxSteerAngle;
    if (controls.steerRight) targetSteer -= maxSteerAngle;

    // High speed steering sensitivity attenuation (stability)
    const speedRatio = Math.abs(velocity.current) / maxSpeedMs;
    const speedSteerFactor = Math.max(0.32, 1 - speedRatio * 0.52);
    targetSteer *= speedSteerFactor;

    steeringAngle.current = THREE.MathUtils.lerp(
      steeringAngle.current,
      targetSteer,
      steerSpeed * dt
    );

    // 2. Throttle, Braking & Acceleration Dynamics tailored to specific car specs
    const accelBase = (profile.acceleration || 1.2) * 8.6; // m/s^2 based on vehicle horsepower
    const brakeForce = (profile.braking || 1.3) * 14.5;
    const dragCoeff = 0.0022;
    const rollingResistance = 0.75;

    let throttleValue = 0;
    let brakeValue = 0;

    if (controls.throttle) {
      throttleValue = 1;
      if (velocity.current < maxSpeedMs) {
        // Torque curve tapering at the top end of vehicle speed
        const torqueMult = Math.max(0.32, 1 - (velocity.current / maxSpeedMs) * 0.68);
        velocity.current += accelBase * torqueMult * dt;
      }
    } else if (controls.brake) {
      brakeValue = 1;
      if (velocity.current > 0.5) {
        velocity.current -= brakeForce * dt;
        if (velocity.current < 0) velocity.current = 0;
      } else {
        // Reverse gear
        currentGear.current = "R";
        velocity.current -= (accelBase * 0.35) * dt;
        if (velocity.current < -10) velocity.current = -10; // ~36 km/h reverse limit
      }
    } else {
      // Natural deceleration / rolling resistance
      if (velocity.current > 0) {
        velocity.current = Math.max(0, velocity.current - (rollingResistance + velocity.current * dragCoeff) * dt);
      } else if (velocity.current < 0) {
        velocity.current = Math.min(0, velocity.current + rollingResistance * dt);
      }
    }

    if (controls.handbrake) {
      velocity.current = THREE.MathUtils.lerp(velocity.current, 0, 5.5 * dt);
    }

    // 3. Dr. Driving Straight Path Kinematics
    position.current.z += velocity.current * dt;

    // Lateral lane maneuver
    const lateralSpeed = 8.5;
    const forwardRollFactor = Math.min(1.0, Math.max(0.2, Math.abs(velocity.current) / 5.5));
    position.current.x += -steeringAngle.current * lateralSpeed * forwardRollFactor * dt;

    // Road boundary containment (-8.2m to +8.2m)
    const roadBoundary = 8.2;
    if (position.current.x > roadBoundary) {
      position.current.x = roadBoundary;
    } else if (position.current.x < -roadBoundary) {
      position.current.x = -roadBoundary;
    }

    // Gentle Dr. Driving yaw body tilt into lane change
    const targetYaw = -steeringAngle.current * 0.25;
    heading.current = THREE.MathUtils.lerp(heading.current, targetYaw, 11 * dt);

    distanceTraveled.current += Math.abs(velocity.current) * dt;

    // 4. Automatic Transmission & Engine RPM Dynamics
    const currentSpeedKmh = Math.abs(velocity.current) * 3.6;

    if (velocity.current >= -0.1) {
      const speedFraction = currentSpeedKmh / maxSpeedKmh;
      const targetGearCalc = Math.min(
        maxGears,
        Math.max(1, Math.floor(speedFraction * (maxGears - 0.45)) + 1)
      );
      currentGear.current = targetGearCalc;

      const gearMinSpeed = ((targetGearCalc - 1) / maxGears) * maxSpeedKmh;
      const gearMaxSpeed = (targetGearCalc / maxGears) * maxSpeedKmh;
      const gearSpeedRatio = Math.max(
        0,
        Math.min(1, (currentSpeedKmh - gearMinSpeed) / Math.max(1, gearMaxSpeed - gearMinSpeed))
      );

      const targetRpm = idleRpm + gearSpeedRatio * (revLimit - idleRpm) + (controls.throttle ? 320 : -220);
      currentRpm.current = THREE.MathUtils.lerp(
        currentRpm.current,
        Math.max(idleRpm, Math.min(revLimit, targetRpm)),
        9 * dt
      );

      // Gear shift audio pop detection
      if (prevGear.current !== currentGear.current) {
        prevGear.current = currentGear.current;
        engineAudio.triggerShiftPop();
      }
    } else {
      currentGear.current = "R";
      currentRpm.current = idleRpm + (Math.abs(currentSpeedKmh) / 36) * 3000;
    }

    // 5. Update 3D Transform of Car
    if (carRef.current) {
      carRef.current.position.copy(position.current);
      carRef.current.rotation.y = heading.current;

      // Chassis pitch on acceleration & dive on braking
      const pitchTarget = controls.throttle ? -0.016 : controls.brake ? 0.026 : 0;
      const rollTarget = -steeringAngle.current * (velocity.current / maxSpeedMs) * 0.08;
      carRef.current.rotation.x = THREE.MathUtils.lerp(carRef.current.rotation.x, pitchTarget, 6 * dt);
      carRef.current.rotation.z = THREE.MathUtils.lerp(carRef.current.rotation.z, rollTarget, 6 * dt);
    }

    // Brake lights intensity
    const brakeIntensity = brakeValue > 0 ? 3.5 : 0.4;
    if (brakeLightLeftRef.current) brakeLightLeftRef.current.intensity = brakeIntensity;
    if (brakeLightRightRef.current) brakeLightRightRef.current.intensity = brakeIntensity;

    // 6. STRICTLY 3RD-PERSON CHASE CAMERA ONLY (Dr. Driving Pursuit Mode)
    const carPos = position.current;
    const isFormula = vehicle.type === "FORMULA";

    // Dynamic chase camera with speed FOV expansion and subtle high-speed tactile shake
    const followDist = isFormula ? 6.1 : 6.6;
    const followHeight = 2.25 + (currentSpeedKmh / maxSpeedKmh) * 0.4;
    const speedRatioNorm = Math.min(1, currentSpeedKmh / maxSpeedKmh);
    const shake = currentSpeedKmh > 230 ? (speedRatioNorm - 0.7) * (Math.random() - 0.5) * 0.03 : 0;

    const targetCamX = carPos.x * 0.72 + shake;
    const targetCamY = carPos.y + followHeight;
    const targetCamZ = carPos.z - followDist;

    camera.position.lerp(new THREE.Vector3(targetCamX, targetCamY, targetCamZ), 12 * dt);

    // Dynamic FOV boost as speed surges
    const persCam = camera as THREE.PerspectiveCamera;
    if (persCam.isPerspectiveCamera) {
      const targetFov = 62 + speedRatioNorm * 13;
      persCam.fov = THREE.MathUtils.lerp(persCam.fov, targetFov, 4 * dt);
      persCam.updateProjectionMatrix();
    }

    // Look down the runway ahead of the car
    const lookTarget = new THREE.Vector3(
      carPos.x * 0.85,
      carPos.y + 0.95,
      carPos.z + 24
    );
    camera.lookAt(lookTarget);

    // 7. Engine Sound Synthesis (dynamically tuned to car type, RPM, throttle and speed)
    if (soundEnabled) {
      engineAudio.update(currentRpm.current, throttleValue, currentSpeedKmh, vehicle.type, brakeValue);
    }

    // 8. Push real-time telemetry to store for the Dr. Driving Speedometer HUD
    updateTelemetry({
      speedKmh: Math.round(currentSpeedKmh),
      rpm: Math.round(currentRpm.current),
      gear: currentGear.current,
      throttle: throttleValue,
      brake: brakeValue,
      steeringAngle: steeringAngle.current / maxSteerAngle,
      lateralG: parseFloat((((velocity.current ** 2) / 25) * Math.sign(steeringAngle.current) * 0.1).toFixed(2)),
      distanceTraveledMeters: Math.round(distanceTraveled.current),
    });
  });

  return (
    <group ref={carRef}>
      {/* Ferrari Vehicle 3D Model with Instant Procedural Fallback */}
      <Suspense
        fallback={
          <ProceduralFerrariModel
            color={vehicle.type === "FORMULA" ? "#ff1010" : "#e60000"}
            type={vehicle.type}
          />
        }
      >
        <VehicleModel vehicle={vehicle} />
      </Suspense>

      {/* Front Headlight Light Cones */}
      <spotLight
        position={[-0.7, 0.5, 2.2]}
        target-position={[-0.7, 0, 30]}
        angle={0.45}
        penumbra={0.6}
        intensity={2.8}
        color="#ffffff"
        distance={70}
      />
      <spotLight
        position={[0.7, 0.5, 2.2]}
        target-position={[0.7, 0, 30]}
        angle={0.45}
        penumbra={0.6}
        intensity={2.8}
        color="#ffffff"
        distance={70}
      />

      {/* Rear Taillights / Brake Lights */}
      <pointLight
        ref={brakeLightLeftRef}
        position={[-0.65, 0.55, -2.2]}
        intensity={0.4}
        color="#ff1111"
        distance={6}
      />
      <pointLight
        ref={brakeLightRightRef}
        position={[0.65, 0.55, -2.2]}
        intensity={0.4}
        color="#ff1111"
        distance={6}
      />
    </group>
  );
};
