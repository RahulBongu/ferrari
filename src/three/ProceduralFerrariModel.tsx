import React, { useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";

interface ProceduralFerrariModelProps {
  color?: string;
  wireframe?: boolean;
  type?: string;
}

export const ProceduralFerrariModel: React.FC<ProceduralFerrariModelProps> = ({
  color = "#d40000",
  wireframe = false,
  type = "ROAD",
}) => {
  const groupRef = useRef<THREE.Group>(null);

  // Gentle idle suspension breathing
  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.position.y = Math.sin(state.clock.elapsedTime * 2) * 0.01 + 0.35;
    }
  });

  const bodyMat = new THREE.MeshPhysicalMaterial({
    color: color,
    metalness: 0.15,
    roughness: 0.08,
    clearcoat: 1.0,
    clearcoatRoughness: 0.03,
    wireframe: wireframe,
    side: THREE.DoubleSide,
  });

  const carbonMat = new THREE.MeshStandardMaterial({
    color: "#222228",
    metalness: 0.3,
    roughness: 0.5,
    wireframe: wireframe,
    side: THREE.DoubleSide,
  });

  const glassMat = new THREE.MeshStandardMaterial({
    color: "#0a0a0f",
    metalness: 0.95,
    roughness: 0.05,
    transparent: true,
    opacity: 0.85,
    wireframe: wireframe,
  });

  const wheelMat = new THREE.MeshStandardMaterial({
    color: "#111114",
    metalness: 0.3,
    roughness: 0.7,
  });

  const rimMat = new THREE.MeshStandardMaterial({
    color: "#e2e8f0",
    metalness: 0.9,
    roughness: 0.2,
  });

  const isFormula = type === "FORMULA";

  if (isFormula) {
    return (
      <group ref={groupRef} position={[0, 0.25, 0]}>
        {/* F1 Monocoque Chassis */}
        <mesh position={[0, 0.15, 0]} material={bodyMat} castShadow>
          <boxGeometry args={[0.7, 0.35, 4.2]} />
        </mesh>
        {/* Front Nosecone */}
        <mesh position={[0, 0.05, 2.2]} material={bodyMat} castShadow>
          <coneGeometry args={[0.3, 1.2, 4]} />
        </mesh>
        {/* Front Wing */}
        <mesh position={[0, -0.05, 2.4]} material={carbonMat} castShadow>
          <boxGeometry args={[1.8, 0.04, 0.5]} />
        </mesh>
        {/* Rear Wing */}
        <mesh position={[0, 0.6, -1.8]} material={carbonMat} castShadow>
          <boxGeometry args={[1.4, 0.25, 0.3]} />
        </mesh>
        {/* Halo Protection */}
        <mesh position={[0, 0.45, 0.1]} material={carbonMat}>
          <torusGeometry args={[0.3, 0.04, 8, 16, Math.PI]} />
        </mesh>
        {/* F1 Exposed Wheels */}
        {[-0.95, 0.95].map((x, i) => (
          <React.Fragment key={i}>
            <mesh position={[x, 0.08, 1.4]} rotation={[0, 0, Math.PI / 2]} material={wheelMat} castShadow>
              <cylinderGeometry args={[0.33, 0.33, 0.35, 24]} />
            </mesh>
            <mesh position={[x, 0.12, -1.3]} rotation={[0, 0, Math.PI / 2]} material={wheelMat} castShadow>
              <cylinderGeometry args={[0.36, 0.36, 0.45, 24]} />
            </mesh>
          </React.Fragment>
        ))}
      </group>
    );
  }

  return (
    <group ref={groupRef} position={[0, 0.35, 0]}>
      {/* Lower Main Hull / Wedge Chassis */}
      <mesh position={[0, 0.05, 0]} material={bodyMat} castShadow receiveShadow>
        <boxGeometry args={[1.9, 0.35, 4.4]} />
      </mesh>

      {/* Aerodynamic Full-Length Undertray & Diffuser Floor (Bottom View) */}
      <mesh position={[0, -0.11, 0]} material={carbonMat} receiveShadow>
        <boxGeometry args={[1.86, 0.02, 4.3]} />
      </mesh>

      {/* Aerodynamic Cockpit Glass Canopy */}
      <mesh position={[0, 0.38, -0.2]} material={glassMat} castShadow>
        <boxGeometry args={[1.35, 0.42, 2.0]} />
      </mesh>

      {/* Front Hood Slope */}
      <mesh position={[0, 0.12, 1.3]} rotation={[-0.2, 0, 0]} material={bodyMat} castShadow>
        <boxGeometry args={[1.82, 0.22, 1.6]} />
      </mesh>

      {/* Rear Engine Deck */}
      <mesh position={[0, 0.18, -1.4]} rotation={[0.08, 0, 0]} material={bodyMat} castShadow>
        <boxGeometry args={[1.85, 0.28, 1.5]} />
      </mesh>

      {/* Front Splitter / Carbon Ground Effects */}
      <mesh position={[0, -0.1, 2.22]} material={carbonMat} castShadow>
        <boxGeometry args={[1.92, 0.06, 0.35]} />
      </mesh>

      {/* Rear Aerodynamic Diffuser */}
      <mesh position={[0, -0.05, -2.22]} material={carbonMat} castShadow>
        <boxGeometry args={[1.88, 0.15, 0.3]} />
      </mesh>

      {/* Rear Wing / Spoiler for Track & Hypercars */}
      {(type === "RACE" || type === "HYPERCAR") && (
        <group position={[0, 0.52, -2.0]}>
          <mesh material={carbonMat} castShadow>
            <boxGeometry args={[1.8, 0.04, 0.4]} />
          </mesh>
          <mesh position={[-0.5, -0.2, 0]} material={carbonMat}>
            <boxGeometry args={[0.04, 0.4, 0.1]} />
          </mesh>
          <mesh position={[0.5, -0.2, 0]} material={carbonMat}>
            <boxGeometry args={[0.04, 0.4, 0.1]} />
          </mesh>
        </group>
      )}

      {/* Headlights (Cool white LED) */}
      <mesh position={[-0.65, 0.18, 2.15]} rotation={[-0.2, 0, 0]}>
        <boxGeometry args={[0.35, 0.08, 0.1]} />
        <meshBasicMaterial color="#ffffff" />
      </mesh>
      <mesh position={[0.65, 0.18, 2.15]} rotation={[-0.2, 0, 0]}>
        <boxGeometry args={[0.35, 0.08, 0.1]} />
        <meshBasicMaterial color="#ffffff" />
      </mesh>

      {/* Taillights (Classic Ferrari Twin Round or Horizontal LED) */}
      <mesh position={[-0.65, 0.15, -2.21]}>
        <cylinderGeometry args={[0.1, 0.1, 0.05, 16]} />
        <meshBasicMaterial color="#ff1111" />
      </mesh>
      <mesh position={[0.65, 0.15, -2.21]}>
        <cylinderGeometry args={[0.1, 0.1, 0.05, 16]} />
        <meshBasicMaterial color="#ff1111" />
      </mesh>

      {/* 4 Wheels and Rims */}
      {[
        [-0.98, 1.35],
        [0.98, 1.35],
        [-0.98, -1.3],
        [0.98, -1.3],
      ].map(([x, z], idx) => (
        <group key={idx} position={[x, -0.05, z]}>
          {/* Tire */}
          <mesh rotation={[0, 0, Math.PI / 2]} material={wheelMat} castShadow>
            <cylinderGeometry args={[0.34, 0.34, 0.3, 24]} />
          </mesh>
          {/* Rim */}
          <mesh rotation={[0, 0, Math.PI / 2]} material={rimMat}>
            <cylinderGeometry args={[0.22, 0.22, 0.32, 12]} />
          </mesh>
        </group>
      ))}
    </group>
  );
};
