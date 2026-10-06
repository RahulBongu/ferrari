import React from "react";
import { ContactShadows, Environment } from "@react-three/drei";

export const StudioEnvironment: React.FC<{
  backgroundColor?: string;
  underLight?: boolean;
}> = ({ backgroundColor = "#ffffff", underLight = true }) => {
  return (
    <>
      {/* Pristine High-Key Studio Background Color */}
      <color attach="background" args={[backgroundColor]} />

      {/* Realistic PBR Automotive Studio Reflections */}
      <Environment preset="city" environmentIntensity={1.4} />

      {/* Studio High-Key Ambient Light for Saturated Paint */}
      <ambientLight intensity={1.3} color="#ffffff" />

      {/* Main Overhead Studio Softbox Light */}
      <directionalLight
        position={[0, 16, 0]}
        intensity={2.8}
        color="#ffffff"
      />

      {/* Controlled Key Light (Cool white automotive studio light) */}
      <directionalLight
        position={[10, 14, 10]}
        intensity={3.2}
        castShadow
        shadow-bias={-0.0001}
        shadow-mapSize={[2048, 2048]}
      />

      {/* Rim light (Sharp rear highlight to sculpt car contours) */}
      <directionalLight
        position={[-12, 12, -10]}
        intensity={2.8}
        color="#ffffff"
      />

      {/* Front Nose & Surfacing Key Light */}
      <directionalLight
        position={[0, 6, 12]}
        intensity={2.5}
        color="#ffffff"
      />

      {/* Undercarriage Up-Light so bottom of chassis is brightly visible */}
      {underLight && (
        <directionalLight
          position={[0, -8, 0]}
          intensity={1.8}
          color="#f4f4f5"
        />
      )}

      {/* Subtle Ferrari Red Accent Reflector */}
      <pointLight position={[0, 1.0, -3.5]} intensity={1.2} color="#d40000" distance={8} />

      {/* Underfloor Soft Contact Shadows under tires without blocking bottom view */}
      <ContactShadows
        position={[0, 0.01, 0]}
        opacity={0.4}
        scale={16}
        blur={2}
        far={4}
        color="#18181b"
      />
    </>
  );
};
