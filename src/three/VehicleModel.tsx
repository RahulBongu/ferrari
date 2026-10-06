import React, { useState, useEffect } from "react";
import * as THREE from "three";
import { useGLTF } from "@react-three/drei";
import { ProceduralFerrariModel } from "./ProceduralFerrariModel";
import type { Vehicle } from "../types/vehicle";

interface VehicleModelProps {
  vehicle: Vehicle;
  wireframe?: boolean;
}

const GLBModel: React.FC<{ url: string; wireframe?: boolean }> = ({ url, wireframe }) => {
  const gltf = useGLTF(url);
  const clonedScene = React.useMemo(() => {
    const scene = gltf.scene.clone(true);

    // Compute bounding box strictly from renderable meshes
    const box = new THREE.Box3();
    scene.traverse((obj) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const mesh = obj as any;
      if (mesh.isMesh && mesh.geometry) {
        box.expandByObject(mesh);
      }
    });

    if (box.isEmpty()) {
      box.setFromObject(scene);
    }

    const size = new THREE.Vector3();
    box.getSize(size);
    const center = new THREE.Vector3();
    box.getCenter(center);

    // Normalize vehicle length/width to standard 4.8 Three.js units
    const maxDim = Math.max(size.x, size.y, size.z);
    const targetDim = 4.8;
    const scale = maxDim > 0 ? targetDim / maxDim : 1;

    // Apply scale and center at origin on showroom floor
    scene.scale.setScalar(scale);
    scene.position.x = -center.x * scale;
    scene.position.y = -box.min.y * scale; // Wheels grounded at y = 0
    scene.position.z = -center.z * scale;

    return scene;
  }, [gltf.scene]);

  // Traverse and enhance materials for brilliant colors and double-sided visibility from bottom
  useEffect(() => {
    if (!clonedScene) return;
    clonedScene.traverse((child) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const mesh = child as any;
      if (mesh.isMesh && mesh.material) {
        mesh.castShadow = true;
        mesh.receiveShadow = true;

        const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
        mats.forEach((mat: THREE.Material) => {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const stdMat = mat as any;
          stdMat.wireframe = !!wireframe;
          // Set DoubleSide so bottom of chassis, undercarriage and panels are fully visible from below
          stdMat.side = THREE.DoubleSide;
          if (stdMat.envMapIntensity !== undefined) {
            stdMat.envMapIntensity = 1.4;
          }
          if (stdMat.roughness !== undefined && stdMat.roughness > 0.8) {
            stdMat.roughness = 0.5; // Prevent overly dull paint
          }
        });
      }
    });
  }, [clonedScene, wireframe]);

  return <primitive object={clonedScene} />;
};

class GLBErrorBoundary extends React.Component<
  { fallback: React.ReactNode; children: React.ReactNode },
  { hasError: boolean }
> {
  constructor(props: { fallback: React.ReactNode; children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  componentDidCatch(err: unknown) {
    console.warn("Failed to parse GLB 3D model, falling back to procedural Ferrari model:", err);
  }
  render() {
    if (this.state.hasError) {
      return this.props.fallback;
    }
    return this.props.children;
  }
}

export const VehicleModel: React.FC<VehicleModelProps> = ({ vehicle, wireframe = false }) => {
  const [modelAvailable, setModelAvailable] = useState<boolean>(true);

  useEffect(() => {
    if (!vehicle.model3D) {
      setModelAvailable(false);
      return;
    }
    let isMounted = true;
    fetch(vehicle.model3D, { method: "HEAD" })
      .then((res) => {
        const contentType = res.headers.get("content-type") || "";
        const contentLength = Number(res.headers.get("content-length") || "0");
        if (isMounted) {
          // If server explicitly responds with 404/html or a tiny Git LFS text pointer (< 300 bytes)
          if (!res.ok || contentType.includes("text/html") || (contentLength > 0 && contentLength < 300)) {
            setModelAvailable(false);
          } else {
            setModelAvailable(true);
          }
        }
      })
      .catch(() => {
        // If HEAD request fails, let GLBErrorBoundary attempt loading directly
        if (isMounted) {
          setModelAvailable(true);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [vehicle.model3D]);

  const proceduralFallback = (
    <ProceduralFerrariModel
      color={vehicle.type === "FORMULA" ? "#ff1010" : "#e60000"}
      wireframe={wireframe}
      type={vehicle.type}
    />
  );

  if (modelAvailable && vehicle.model3D) {
    return (
      <GLBErrorBoundary fallback={proceduralFallback}>
        <GLBModel url={vehicle.model3D} wireframe={wireframe} />
      </GLBErrorBoundary>
    );
  }

  // Fallback to high-detail procedural 3D model with bright, saturated Ferrari paint
  return proceduralFallback;
};
