import React, { useMemo } from "react";

export const ROAD_HALF_WIDTH = 10;
export const TRACK_LENGTH = 3000;

export const TestDriveEnvironment: React.FC = () => {
  // Generate straight track segments spanning -100 to 3000m
  const roadSegments = useMemo(() => {
    const segments = [];
    for (let z = -100; z <= TRACK_LENGTH; z += 25) {
      // Straight proving ground strip
      segments.push({ z, xOffset: 0 });
    }
    return segments;
  }, []);

  return (
    <group>
      {/* Sky & Atmospheric Fog */}
      <color attach="background" args={["#090910"]} />
      <fog attach="fog" args={["#090910", 60, 400]} />

      {/* Atmospheric Lighting */}
      <ambientLight intensity={0.5} color="#c0c7dc" />
      <directionalLight
        position={[40, 80, -20]}
        intensity={2.4}
        color="#fff4e8"
        castShadow
        shadow-mapSize={[2048, 2048]}
      />
      <directionalLight position={[-40, 30, 40]} intensity={1.0} color="#d40000" />

      {/* Main Ground / Proving Ground Terrain */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.1, 1400]} receiveShadow>
        <planeGeometry args={[500, 3400, 16, 16]} />
        <meshStandardMaterial color="#0b0b12" roughness={0.92} />
      </mesh>

      {/* Straight Runway Road Ribbon & Curbs */}
      {roadSegments.map((seg, i) => {
        if (i === roadSegments.length - 1) return null;
        const next = roadSegments[i + 1];
        const midZ = (seg.z + next.z) / 2;

        return (
          <group key={i} position={[0, 0, midZ]}>
            {/* Asphalt Surface */}
            <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
              <planeGeometry args={[ROAD_HALF_WIDTH * 2, 25.2]} />
              <meshStandardMaterial
                color="#131318"
                roughness={0.78}
                metalness={0.15}
              />
            </mesh>

            {/* Road Center Dashed Line */}
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.005, 0]}>
              <planeGeometry args={[0.3, 14]} />
              <meshBasicMaterial color="#ffffff" opacity={0.8} transparent />
            </mesh>

            {/* Left Lane Boundary Line */}
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[-4.5, 0.005, 0]}>
              <planeGeometry args={[0.15, 25.2]} />
              <meshBasicMaterial color="#ffffff" opacity={0.3} transparent />
            </mesh>

            {/* Right Lane Boundary Line */}
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[4.5, 0.005, 0]}>
              <planeGeometry args={[0.15, 25.2]} />
              <meshBasicMaterial color="#ffffff" opacity={0.3} transparent />
            </mesh>

            {/* Left Kerb Barrier */}
            <mesh position={[-ROAD_HALF_WIDTH, 0.35, 0]}>
              <boxGeometry args={[0.5, 0.7, 25.2]} />
              <meshStandardMaterial
                color={i % 2 === 0 ? "#d40000" : "#f0f0f0"}
                roughness={0.35}
              />
            </mesh>

            {/* Right Kerb Barrier */}
            <mesh position={[ROAD_HALF_WIDTH, 0.35, 0]}>
              <boxGeometry args={[0.5, 0.7, 25.2]} />
              <meshStandardMaterial
                color={i % 2 === 0 ? "#d40000" : "#f0f0f0"}
                roughness={0.35}
              />
            </mesh>

            {/* Track Light Poles every 100 meters */}
            {i % 4 === 0 && (
              <>
                <group position={[ROAD_HALF_WIDTH + 3, 0, 0]}>
                  <mesh position={[0, 6, 0]}>
                    <cylinderGeometry args={[0.15, 0.25, 12, 8]} />
                    <meshStandardMaterial color="#2a2a35" metalness={0.8} />
                  </mesh>
                  <pointLight position={[0, 11, 0]} intensity={1.5} color="#eef2ff" distance={45} />
                </group>
                <group position={[-ROAD_HALF_WIDTH - 3, 0, 0]}>
                  <mesh position={[0, 6, 0]}>
                    <cylinderGeometry args={[0.15, 0.25, 12, 8]} />
                    <meshStandardMaterial color="#2a2a35" metalness={0.8} />
                  </mesh>
                  <pointLight position={[0, 11, 0]} intensity={1.5} color="#eef2ff" distance={45} />
                </group>
              </>
            )}

            {/* Overhead Telemetry Speed-Trap Gantries every 200m */}
            {i % 8 === 0 && (
              <group position={[0, 5, 0]}>
                <mesh position={[0, 3, 0]}>
                  <boxGeometry args={[ROAD_HALF_WIDTH * 2 + 3, 0.7, 0.8]} />
                  <meshStandardMaterial color="#1f1f2a" metalness={0.85} roughness={0.25} />
                </mesh>
                <mesh position={[-ROAD_HALF_WIDTH - 1, -1, 0]}>
                  <cylinderGeometry args={[0.3, 0.3, 8, 8]} />
                  <meshStandardMaterial color="#1f1f2a" metalness={0.8} />
                </mesh>
                <mesh position={[ROAD_HALF_WIDTH + 1, -1, 0]}>
                  <cylinderGeometry args={[0.3, 0.3, 8, 8]} />
                  <meshStandardMaterial color="#1f1f2a" metalness={0.8} />
                </mesh>
                {/* Red warning beacon */}
                <pointLight position={[0, 2.6, 0]} intensity={2.5} color="#d40000" distance={20} />
              </group>
            )}
          </group>
        );
      })}

      {/* Starting Grid Line */}
      <mesh position={[0, 0.015, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[ROAD_HALF_WIDTH * 2, 2.5]} />
        <meshBasicMaterial color="#ffffff" />
      </mesh>

      {/* 400m Quarter-Mile Line */}
      <mesh position={[0, 0.015, 400]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[ROAD_HALF_WIDTH * 2, 2]} />
        <meshBasicMaterial color="#d40000" />
      </mesh>

      {/* 1000m 1KM Marker Line */}
      <mesh position={[0, 0.015, 1000]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[ROAD_HALF_WIDTH * 2, 3]} />
        <meshBasicMaterial color="#f59e0b" />
      </mesh>
    </group>
  );
};
