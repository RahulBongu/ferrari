import React, { Suspense, useState, useRef, useEffect } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";
import { RotateCw, RefreshCw, Maximize, Eye } from "lucide-react";
import { StudioEnvironment } from "./StudioEnvironment";
import { VehicleModel } from "./VehicleModel";
import type { Vehicle } from "../types/vehicle";
import { Loader } from "../components/common/Loader";

interface VehicleViewerProps {
  vehicle: Vehicle;
}

export const VehicleViewer: React.FC<VehicleViewerProps> = ({ vehicle }) => {
  const [autoRotate, setAutoRotate] = useState(true);
  const [userDisabledSpin, setUserDisabledSpin] = useState(false);
  const [wireframe, setWireframe] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const controlsRef = useRef<OrbitControlsImpl>(null);
  const idleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Resume slow auto-spin when untouched
  const handleInteractionStart = () => {
    if (idleTimerRef.current) {
      clearTimeout(idleTimerRef.current);
      idleTimerRef.current = null;
    }
    setAutoRotate(false);
  };

  const handleInteractionEnd = () => {
    if (userDisabledSpin) return;
    if (idleTimerRef.current) {
      clearTimeout(idleTimerRef.current);
    }
    // Resume auto-spin after 1.5 seconds of no interaction
    idleTimerRef.current = setTimeout(() => {
      setAutoRotate(true);
    }, 1500);
  };

  useEffect(() => {
    return () => {
      if (idleTimerRef.current) {
        clearTimeout(idleTimerRef.current);
      }
    };
  }, []);

  const handleResetCamera = () => {
    if (controlsRef.current) {
      controlsRef.current.reset();
      controlsRef.current.object.position.set(5, 2.5, 6);
      controlsRef.current.target.set(0, 0.45, 0);
      controlsRef.current.update();
    }
    handleInteractionEnd();
  };

  const handleToggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
    }
  };

  const setCameraView = (type: "TOP" | "SIDE" | "FRONT" | "BOTTOM" | "3D") => {
    handleInteractionStart();
    if (!controlsRef.current) return;
    const controls = controlsRef.current;
    if (type === "TOP") {
      controls.object.position.set(0.001, 7.8, 0.001);
      controls.target.set(0, 0.45, 0);
    } else if (type === "SIDE") {
      controls.object.position.set(7.5, 0.6, 0);
      controls.target.set(0, 0.45, 0);
    } else if (type === "FRONT") {
      controls.object.position.set(0, 0.6, 7.5);
      controls.target.set(0, 0.45, 0);
    } else if (type === "BOTTOM") {
      // Direct view from underneath looking up at chassis, floor tray, and diffusers
      controls.object.position.set(0.001, -6.5, 0.001);
      controls.target.set(0, 0.45, 0);
    } else {
      controls.object.position.set(5, 2.5, 6);
      controls.target.set(0, 0.45, 0);
    }
    controls.update();
    handleInteractionEnd();
  };

  const toggleAutoRotate = () => {
    if (autoRotate) {
      setUserDisabledSpin(true);
      setAutoRotate(false);
    } else {
      setUserDisabledSpin(false);
      setAutoRotate(true);
    }
  };

  return (
    <section className="py-16 border-t border-white/10 dark:border-white/10 light:border-zinc-200">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
        <div>
          <span className="font-mono-tech text-[10px] uppercase tracking-[0.3em] text-[#d40000] font-bold block mb-1">
            360° INTERACTIVE STUDIO
          </span>
          <h2 className="font-display font-black text-3xl sm:text-4xl uppercase text-white dark:text-white light:!text-black tracking-wide">
            3D VEHICLE INSPECTION
          </h2>
          <p className="font-sans text-xs text-white/50 dark:text-white/50 light:!text-zinc-800 max-w-xl mt-1">
            Rotate, zoom, and inspect Maranello aerodynamic surfacing from top, side, front, and bottom angles in real-time.
          </p>
        </div>

        {/* Controls Toolbar with Camera Angle Presets */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Quick View Angle Buttons */}
          <div className="flex items-center gap-1 bg-white/5 dark:bg-white/5 light:bg-zinc-100 p-1 rounded border border-white/10 dark:border-white/10 light:border-zinc-300">
            <button
              onClick={() => setCameraView("3D")}
              className="px-2.5 py-1 rounded text-[10px] font-mono-tech uppercase tracking-wider text-white/80 dark:text-white/80 light:!text-black font-semibold hover:text-white dark:hover:text-white light:hover:text-[#d40000] hover:bg-white/10 light:hover:bg-zinc-200 transition-colors cursor-pointer"
            >
              3D
            </button>
            <button
              onClick={() => setCameraView("TOP")}
              className="px-2.5 py-1 rounded text-[10px] font-mono-tech uppercase tracking-wider text-white/80 dark:text-white/80 light:!text-black font-semibold hover:text-white dark:hover:text-white light:hover:text-[#d40000] hover:bg-white/10 light:hover:bg-zinc-200 transition-colors cursor-pointer"
            >
              TOP VIEW
            </button>
            <button
              onClick={() => setCameraView("SIDE")}
              className="px-2.5 py-1 rounded text-[10px] font-mono-tech uppercase tracking-wider text-white/80 dark:text-white/80 light:!text-black font-semibold hover:text-white dark:hover:text-white light:hover:text-[#d40000] hover:bg-white/10 light:hover:bg-zinc-200 transition-colors cursor-pointer"
            >
              SIDE VIEW
            </button>
            <button
              onClick={() => setCameraView("FRONT")}
              className="px-2.5 py-1 rounded text-[10px] font-mono-tech uppercase tracking-wider text-white/80 dark:text-white/80 light:!text-black font-semibold hover:text-white dark:hover:text-white light:hover:text-[#d40000] hover:bg-white/10 light:hover:bg-zinc-200 transition-colors cursor-pointer"
            >
              FRONT VIEW
            </button>
            <button
              onClick={() => setCameraView("BOTTOM")}
              className="px-2.5 py-1 rounded text-[10px] font-mono-tech uppercase tracking-wider bg-[#d40000]/10 hover:bg-[#d40000] text-[#d40000] hover:text-white transition-colors cursor-pointer font-bold"
              title="Inspect undercarriage, floor tray & diffusers"
            >
              BOTTOM VIEW
            </button>
          </div>

          {/* Auto Rotate Toggle */}
          <button
            onClick={toggleAutoRotate}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded font-mono-tech text-xs tracking-wider uppercase border transition-all cursor-pointer ${
              autoRotate
                ? "bg-[#d40000] border-[#d40000] text-white"
                : "bg-white/5 dark:bg-white/5 light:bg-zinc-100 border-white/10 dark:border-white/10 light:border-zinc-300 text-white/70 dark:text-white/70 light:!text-black font-semibold hover:text-white dark:hover:text-white"
            }`}
            title={autoRotate ? "Auto-spin active (pauses on interaction)" : "Auto-spin paused"}
          >
            <RotateCw className={`w-3.5 h-3.5 ${autoRotate ? "animate-spin" : ""}`} />
            <span>{autoRotate ? "AUTO-SPIN" : "SPIN PAUSED"}</span>
          </button>

          {/* Wireframe Toggle */}
          <button
            onClick={() => setWireframe(!wireframe)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded font-mono-tech text-xs tracking-wider uppercase border transition-all cursor-pointer ${
              wireframe
                ? "bg-white/20 border-white text-white"
                : "bg-white/5 dark:bg-white/5 light:bg-zinc-100 border-white/10 dark:border-white/10 light:border-zinc-300 text-white/70 dark:text-white/70 light:!text-black font-semibold hover:text-white dark:hover:text-white"
            }`}
          >
            <Eye className="w-3.5 h-3.5" />
            <span>WIREFRAME</span>
          </button>

          {/* Reset View */}
          <button
            onClick={handleResetCamera}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded font-mono-tech text-xs tracking-wider uppercase bg-white/5 dark:bg-white/5 light:bg-zinc-100 border border-white/10 dark:border-white/10 light:border-zinc-300 text-white/70 dark:text-white/70 light:!text-black font-semibold hover:text-white dark:hover:text-white transition-colors cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>RESET</span>
          </button>

          {/* Fullscreen */}
          <button
            onClick={handleToggleFullscreen}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded font-mono-tech text-xs tracking-wider uppercase bg-white/5 dark:bg-white/5 light:bg-zinc-100 border border-white/10 dark:border-white/10 light:border-zinc-300 text-white/70 dark:text-white/70 light:!text-black font-semibold hover:text-white dark:hover:text-white transition-colors cursor-pointer"
          >
            <Maximize className="w-3.5 h-3.5" />
            <span>FULLSCREEN</span>
          </button>
        </div>
      </div>

      {/* 3D Canvas Container - White Studio Presentation */}
      <div
        ref={containerRef}
        onWheel={handleInteractionStart}
        className={`relative w-full rounded-lg border border-white/15 dark:border-white/15 light:border-zinc-300 bg-white shadow-2xl overflow-hidden ${
          isFullscreen ? "fixed inset-0 z-50 rounded-none border-none" : "h-[480px] sm:h-[620px]"
        }`}
      >
        <Suspense
          fallback={
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-white text-center">
              <Loader scale={0.55} label="LOADING 3D VEHICLE..." />
            </div>
          }
        >
          <Canvas
            shadows
            camera={{ position: [5, 2.5, 6], fov: 42 }}
            gl={{ antialias: true, powerPreference: "high-performance" }}
          >
            <StudioEnvironment backgroundColor="#ffffff" />
            <VehicleModel vehicle={vehicle} wireframe={wireframe} />
            <OrbitControls
              ref={controlsRef}
              target={[0, 0.45, 0]}
              autoRotate={autoRotate}
              autoRotateSpeed={0.8}
              enablePan={true}
              minDistance={1.8}
              maxDistance={15}
              minPolarAngle={0}
              maxPolarAngle={Math.PI - 0.05}
              dampingFactor={0.05}
              onStart={handleInteractionStart}
              onEnd={handleInteractionEnd}
            />
          </Canvas>
        </Suspense>

        {/* Ambient Overlay Controls Prompt */}
        <div className="absolute bottom-4 left-4 pointer-events-none hidden sm:flex items-center gap-3 text-[10px] font-mono-tech text-zinc-600 uppercase tracking-widest bg-white/90 backdrop-blur-md px-3.5 py-2 rounded border border-zinc-200 shadow-sm">
          <span>DRAG : ROTATE</span>
          <span>&middot;</span>
          <span>SCROLL : ZOOM</span>
          <span>&middot;</span>
          <span>FULL 360° &amp; BOTTOM SPHERE</span>
        </div>

        {/* Brand Model Badge */}
        <div className="absolute top-4 right-4 pointer-events-none font-mono-tech text-[10px] text-zinc-700 tracking-[0.2em] uppercase bg-white/90 backdrop-blur-md px-3.5 py-1.5 rounded border border-zinc-200 shadow-sm font-bold">
          {vehicle.name} &middot; WHITE STUDIO
        </div>
      </div>
    </section>
  );
};
