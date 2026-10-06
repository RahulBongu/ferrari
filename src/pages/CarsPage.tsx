import React, { useState, useRef, useEffect, Suspense } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, Center, useGLTF } from "@react-three/drei";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";
import { vehicles } from "../data/vehicles";
import type { Vehicle } from "../types/vehicle";
import { StudioEnvironment } from "../three/StudioEnvironment";
import { VehicleModel } from "../three/VehicleModel";
import { Link } from "react-router-dom";
import { X, Layers, Compass, ArrowRight, RotateCw, RefreshCw, Info, Eye } from "lucide-react";
import { useComparisonStore } from "../store/comparisonStore";
import { Loader } from "../components/common/Loader";
import { getAssetUrl } from "../utils/assetUrl";

// Rotating 3D Ferrari Logo component
const Ferrari3DLogo: React.FC = () => {
  const gltf = useGLTF(getAssetUrl("/assets/models/ferrari_logo.glb"));
  const scene = React.useMemo(() => gltf.scene.clone(true), [gltf.scene]);
  return (
    <primitive
      object={scene}
      scale={2.2}
      position={[0, 0, 0]}
    />
  );
};

// 360 Full Widescreen Interactive Studio Modal
const Showroom360Modal: React.FC<{
  vehicle: Vehicle;
  onClose: () => void;
}> = ({ vehicle, onClose }) => {
  const controlsRef = useRef<OrbitControlsImpl>(null);
  const [autoRotate, setAutoRotate] = useState(true);
  const [userDisabledSpin, setUserDisabledSpin] = useState(false);
  const [showSpecsPanel, setShowSpecsPanel] = useState(false);
  const idleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const addVehicle = useComparisonStore((state) => state.addVehicle);
  const isInComparison = useComparisonStore((state) => state.isInComparison(vehicle.slug));

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
    idleTimerRef.current = setTimeout(() => {
      setAutoRotate(true);
    }, 1500);
  };

  useEffect(() => {
    return () => {
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    };
  }, []);

  const setView = (type: "3D" | "TOP" | "SIDE" | "FRONT" | "BOTTOM") => {
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
      // Look straight up from below at undercarriage and diffusers
      controls.object.position.set(0.001, -6.5, 0.001);
      controls.target.set(0, 0.45, 0);
    } else {
      controls.object.position.set(5, 2.5, 6);
      controls.target.set(0, 0.45, 0);
    }
    controls.update();
    handleInteractionEnd();
  };

  const handleReset = () => {
    if (controlsRef.current) {
      controlsRef.current.reset();
      controlsRef.current.object.position.set(5, 2.5, 6);
      controlsRef.current.target.set(0, 0.45, 0);
      controlsRef.current.update();
    }
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
    <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-2xl flex items-center justify-center p-2 sm:p-4 md:p-6 animate-in fade-in duration-200">
      <div
        onWheel={handleInteractionStart}
        className="relative w-full max-w-7xl aspect-[16/9] max-h-[92vh] bg-white rounded-2xl shadow-[0_0_60px_rgba(0,0,0,0.8)] border border-white/20 overflow-hidden flex flex-col"
      >
        {/* Full 3D Studio Canvas */}
        <Suspense
          fallback={
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-white text-center">
              <Loader scale={0.55} label={`LOADING ${vehicle.name}...`} />
            </div>
          }
        >
          <Canvas
            shadows
            camera={{ position: [5, 2.5, 6], fov: 42 }}
            gl={{ antialias: true, powerPreference: "high-performance" }}
          >
            <StudioEnvironment backgroundColor="#ffffff" />
            <VehicleModel vehicle={vehicle} />
            <OrbitControls
              ref={controlsRef}
              target={[0, 0.45, 0]}
              autoRotate={autoRotate}
              autoRotateSpeed={0.8}
              enablePan={true}
              minDistance={1.8}
              maxDistance={15}
              minPolarAngle={0}
              maxPolarAngle={Math.PI - 0.05} // Full 180° spherical orbit
              dampingFactor={0.05}
              onStart={handleInteractionStart}
              onEnd={handleInteractionEnd}
            />
          </Canvas>
        </Suspense>

        {/* TOP HUD BAR */}
        <div className="absolute top-0 inset-x-0 p-4 sm:p-6 flex items-start justify-between pointer-events-none z-20 bg-gradient-to-b from-white/90 via-white/40 to-transparent">
          <div className="pointer-events-auto">
            <div className="flex items-center gap-2 mb-1">
              <span className="w-2.5 h-2.5 bg-[#d40000] rotate-45" />
              <span className="font-mono-tech text-[11px] tracking-widest text-[#d40000] uppercase font-bold">
                {vehicle.category} {vehicle.year ? `· ${vehicle.year}` : ""}
              </span>
            </div>
            <h2 className="font-display font-black text-2xl sm:text-4xl uppercase tracking-tight text-zinc-950">
              {vehicle.name}
            </h2>
          </div>

          {/* Right Toolbar */}
          <div className="pointer-events-auto flex items-center gap-2">
            <div className="hidden sm:flex items-center gap-1 bg-white/95 backdrop-blur-md p-1.5 rounded-lg border border-zinc-300 shadow-md">
              <button
                onClick={() => setView("3D")}
                className="px-3 py-1 rounded text-[11px] font-mono-tech uppercase tracking-wider !text-black font-bold hover:bg-zinc-200 transition-colors cursor-pointer"
              >
                3D
              </button>
              <button
                onClick={() => setView("TOP")}
                className="px-3 py-1 rounded text-[11px] font-mono-tech uppercase tracking-wider !text-black font-bold hover:bg-zinc-200 transition-colors cursor-pointer"
              >
                TOP
              </button>
              <button
                onClick={() => setView("SIDE")}
                className="px-3 py-1 rounded text-[11px] font-mono-tech uppercase tracking-wider !text-black font-bold hover:bg-zinc-200 transition-colors cursor-pointer"
              >
                SIDE
              </button>
              <button
                onClick={() => setView("FRONT")}
                className="px-3 py-1 rounded text-[11px] font-mono-tech uppercase tracking-wider !text-black font-bold hover:bg-zinc-200 transition-colors cursor-pointer"
              >
                FRONT
              </button>
              <button
                onClick={() => setView("BOTTOM")}
                className="px-3 py-1 rounded text-[11px] font-mono-tech uppercase tracking-wider bg-[#d40000]/15 hover:bg-[#d40000] !text-[#d40000] hover:!text-white transition-colors cursor-pointer font-bold"
                title="View bottom undercarriage & diffusers"
              >
                BOTTOM VIEW
              </button>
            </div>

            <button
              onClick={toggleAutoRotate}
              className={`p-2.5 rounded-lg border text-xs font-mono-tech transition-all cursor-pointer shadow-md ${
                autoRotate
                  ? "bg-[#d40000] border-[#d40000] !text-white"
                  : "bg-white/95 border-zinc-300 !text-black hover:bg-zinc-100"
              }`}
              title={autoRotate ? "Auto-spin active (pauses on interaction)" : "Auto-spin paused"}
            >
              <RotateCw className={`w-4 h-4 ${autoRotate ? "animate-spin" : ""}`} />
            </button>

            <button
              onClick={handleReset}
              className="p-2.5 rounded-lg bg-white/95 border border-zinc-300 !text-black hover:bg-zinc-100 shadow-md transition-colors cursor-pointer"
              title="Reset view"
            >
              <RefreshCw className="w-4 h-4" />
            </button>

            <button
              onClick={() => setShowSpecsPanel(!showSpecsPanel)}
              className={`p-2.5 rounded-lg border text-xs font-mono-tech transition-all cursor-pointer shadow-md ${
                showSpecsPanel
                  ? "bg-black border-black !text-white"
                  : "bg-white/95 border-zinc-300 !text-black hover:bg-zinc-100"
              }`}
              title="Toggle specifications"
            >
              <Info className="w-4 h-4" />
            </button>

            <button
              onClick={onClose}
              className="p-2.5 rounded-lg bg-black !text-white hover:bg-[#d40000] transition-colors cursor-pointer shadow-md"
              title="Close inspection"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* BOTTOM HUD BAR */}
        <div className="absolute bottom-0 inset-x-0 p-4 sm:p-6 flex flex-col sm:flex-row sm:items-end justify-between gap-4 pointer-events-none z-20 bg-gradient-to-t from-black/60 via-transparent to-transparent">
          <div className="pointer-events-auto flex items-center gap-2 sm:gap-4 bg-black/90 backdrop-blur-md px-5 py-3 rounded-xl border border-white/20 shadow-xl dark-card-content">
            <div>
              <span className="font-mono-tech text-[8px] uppercase tracking-widest !text-white/60 block">TOP SPEED</span>
              <span className="font-mono-tech text-xs sm:text-sm font-bold !text-white">
                {vehicle.topSpeed || "—"}
              </span>
            </div>
            <div className="w-[1px] h-6 bg-white/20" />
            <div>
              <span className="font-mono-tech text-[8px] uppercase tracking-widest !text-white/60 block">POWER</span>
              <span className="font-mono-tech text-xs sm:text-sm font-bold !text-[#d40000]">
                {vehicle.power ? vehicle.power.split("@")[0] : "—"}
              </span>
            </div>
            <div className="w-[1px] h-6 bg-white/20" />
            <div>
              <span className="font-mono-tech text-[8px] uppercase tracking-widest !text-white/60 block">0–100 KM/H</span>
              <span className="font-mono-tech text-xs sm:text-sm font-bold !text-white">
                {vehicle.zeroToHundred || "—"}
              </span>
            </div>
            <div className="w-[1px] h-6 bg-white/20" />
            <div>
              <span className="font-mono-tech text-[8px] uppercase tracking-widest !text-white/60 block">WEIGHT</span>
              <span className="font-mono-tech text-xs sm:text-sm font-bold !text-white">
                {vehicle.weight || "—"}
              </span>
            </div>
          </div>

          <div className="pointer-events-auto flex items-center gap-2.5">
            <button
              onClick={() => addVehicle(vehicle.slug)}
              className="px-4 py-2.5 rounded-lg bg-black/85 backdrop-blur-md border border-white/20 hover:border-[#d40000] !text-white font-mono-tech text-xs uppercase tracking-wider font-bold transition-all shadow-lg hover:shadow cursor-pointer flex items-center gap-1.5"
            >
              <Layers className="w-4 h-4 text-[#d40000]" />
              <span className="!text-white">{isInComparison ? "IN COMPARISON" : "ADD TO COMPARE"}</span>
            </button>

            {/* Changed Dossier button to SPECS */}
            <Link
              to={`/garage/${vehicle.slug}`}
              className="px-5 py-2.5 rounded-lg bg-[#d40000] hover:bg-[#b50000] !text-white font-mono-tech text-xs uppercase tracking-wider font-bold transition-colors shadow-lg flex items-center gap-1.5"
            >
              <span className="!text-white">SPECS</span>
              <ArrowRight className="w-3.5 h-3.5 !text-white" />
            </Link>
          </div>
        </div>

        {/* SLIDE-OVER SPECIFICATIONS DRAWER */}
        {showSpecsPanel && (
          <div className="absolute inset-y-0 right-0 w-full sm:w-96 bg-zinc-950/95 backdrop-blur-xl border-l border-white/20 p-6 text-white z-30 overflow-y-auto animate-in slide-in-from-right duration-300">
            <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-4">
              <span className="font-mono-tech text-xs uppercase tracking-widest text-[#d40000] font-bold">
                FACTORY SPECIFICATIONS
              </span>
              <button
                onClick={() => setShowSpecsPanel(false)}
                className="p-1 rounded text-white/60 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="font-sans text-xs text-white/80 leading-relaxed mb-6">
              {vehicle.description}
            </p>

            <div className="space-y-3 font-mono-tech text-xs">
              <div className="p-2.5 bg-white/5 rounded border border-white/5">
                <span className="text-[9px] uppercase tracking-widest text-white/40 block">ENGINE</span>
                <span className="text-white font-bold">{vehicle.engine || "FACTORY SPEC"}</span>
              </div>
              <div className="p-2.5 bg-white/5 rounded border border-white/5">
                <span className="text-[9px] uppercase tracking-widest text-white/40 block">TRANSMISSION</span>
                <span className="text-white font-bold">{vehicle.transmission || "F1 DUAL-CLUTCH"}</span>
              </div>
              <div className="p-2.5 bg-white/5 rounded border border-white/5">
                <span className="text-[9px] uppercase tracking-widest text-white/40 block">DRIVE TYPE</span>
                <span className="text-white font-bold">{vehicle.driveType || "RWD"}</span>
              </div>
              {vehicle.dimensions && (
                <div className="p-2.5 bg-white/5 rounded border border-white/5">
                  <span className="text-[9px] uppercase tracking-widest text-white/40 block">DIMENSIONS</span>
                  <span className="text-white font-bold">
                    {vehicle.dimensions.length} &times; {vehicle.dimensions.width} &times; {vehicle.dimensions.height}
                  </span>
                </div>
              )}
            </div>

            {vehicle.technology && vehicle.technology.length > 0 && (
              <div className="mt-6">
                <span className="font-mono-tech text-[10px] uppercase tracking-widest text-[#d40000] font-bold block mb-2">
                  AERODYNAMICS &amp; INNOVATION
                </span>
                <div className="space-y-1.5">
                  {vehicle.technology.map((tech, i) => (
                    <div key={i} className="flex items-center gap-2 text-[11px] font-sans text-white/70">
                      <span className="w-1.5 h-1.5 bg-[#d40000] rotate-45 shrink-0" />
                      <span>{tech}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export const CarsPage: React.FC = () => {
  const [isLogoExpanded, setIsLogoExpanded] = useState(false);
  const [inspectVehicle, setInspectVehicle] = useState<Vehicle | null>(null);

  return (
    <div className="min-h-screen bg-[#070709] dark:bg-[#070709] light:bg-[#f6f7f9] text-white dark:text-white light:text-zinc-900 pt-24 pb-28 px-4 sm:px-6 lg:px-12 max-w-7xl mx-auto transition-colors">
      {/* ========================================================= */}
      {/* 1. TOP: FERRARI LOGO (CROPPED WITH RED SHADE) */}
      {/* ========================================================= */}
      <section className="mb-20 flex flex-col items-center text-center border-b border-white/10 pb-16">
        {/* Ferrari Logo Emblem - Cropped on left & right, surrounded with red shade */}
        <div className="relative mb-6 flex items-center justify-center group">
          <div className="absolute inset-0 bg-[#d40000]/45 blur-3xl rounded-full scale-125 pointer-events-none -z-10" />
          <img
            src={getAssetUrl("/assets/photos/ferrari_shield.png")}
            alt="Scuderia Ferrari Emblem"
            className="h-44 sm:h-52 w-auto object-contain filter drop-shadow-[0_0_25px_rgba(212,0,0,0.85)] drop-shadow-[0_0_50px_rgba(212,0,0,0.45)] group-hover:scale-105 transition-transform duration-300"
          />
        </div>

        {/* Headings */}
        <span className="font-mono-tech text-xs tracking-[0.35em] uppercase text-[#d40000] font-bold mb-2">
          THE PRANCING HORSE &middot; CAVALLINO RAMPANTE
        </span>
        <h1 className="font-display font-black text-4xl sm:text-6xl md:text-7xl uppercase tracking-tight !text-[#d40000] drop-shadow-[0_0_35px_rgba(212,0,0,0.45)] max-w-3xl">
          SCUDERIA FERRARI
        </h1>
        <p className="scuderia-desc font-sans text-xs sm:text-sm text-black dark:text-white/70 light:!text-black max-w-2xl mt-3 tracking-wide">
          Founded in 1929 by Enzo Ferrari in Modena, Maranello represents the relentless pursuit of motorsport supremacy and pure automotive emotion.
        </p>

        {/* VISIT HERITAGE Button */}
        <button
          onClick={() => setIsLogoExpanded(!isLogoExpanded)}
          className="mt-6 flex items-center gap-2.5 px-8 py-3.5 bg-[#d40000] hover:bg-[#b50000] text-white font-mono-tech text-xs uppercase tracking-[0.25em] font-bold transition-all shadow-[0_0_25px_rgba(212,0,0,0.4)] hover:scale-105 cursor-pointer rounded"
        >
          <Compass className="w-4 h-4" />
          <span>{isLogoExpanded ? "CLOSE EMBLEM STUDIO" : "VISIT FERRARI HERITAGE"}</span>
        </button>

        {/* Expanded 3D Logo Viewer & Chronicle */}
        {isLogoExpanded && (
          <div className="w-full mt-12 bg-[#0c0c12] dark:bg-[#0c0c12] light:bg-white border border-white/15 dark:border-white/15 light:border-zinc-300 p-6 sm:p-10 rounded-lg animate-in fade-in duration-500 text-left shadow-xl">
            <div className="flex items-center justify-between pb-4 border-b border-white/10 dark:border-white/10 light:border-zinc-200 mb-6">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 bg-[#d40000] rotate-45" />
                <span className="font-mono-tech text-xs uppercase tracking-widest text-[#d40000] font-bold">
                  INTERACTIVE 3D EMBLEM & CHRONICLE
                </span>
              </div>
              <button
                onClick={() => setIsLogoExpanded(false)}
                className="p-1 rounded text-white/50 hover:text-white dark:text-white/50 light:text-zinc-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="relative w-full h-[360px] sm:h-[460px] bg-[#070709] rounded border border-white/10 overflow-hidden mb-8">
              <Suspense
                fallback={
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Loader scale={0.45} label="LOADING 3D EMBLEM..." />
                  </div>
                }
              >
                <Canvas shadows camera={{ position: [0, 0, 5], fov: 45 }}>
                  <ambientLight intensity={1.2} />
                  <spotLight position={[5, 10, 5]} intensity={3.0} castShadow />
                  <pointLight position={[-4, -2, 2]} intensity={2.0} color="#d40000" />
                  <Center>
                    <Ferrari3DLogo />
                  </Center>
                  <OrbitControls
                    autoRotate
                    autoRotateSpeed={2}
                    enablePan={false}
                    minDistance={3}
                    maxDistance={8}
                  />
                </Canvas>
              </Suspense>

              <div className="absolute bottom-3 right-3 font-mono-tech text-[10px] tracking-widest text-white/40 uppercase bg-black/40 px-3 py-1 rounded">
                DRAG TO ROTATE &middot; SCROLL TO ZOOM
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-4">
              <div>
                <h3 className="font-mono-tech text-xs uppercase tracking-widest font-bold text-[#d40000] mb-2">
                  THE FOUNDER &amp; ORIGINS
                </h3>
                <p className="font-sans text-xs text-white/70 dark:text-white/70 light:text-zinc-600 leading-relaxed">
                  Enzo Ferrari was an Alfa Romeo test driver and race manager who formed Scuderia Ferrari in 1929 to prepare gentlemen racers. In 1947, from Maranello, the first true Ferrari automobile — the 1.5-litre V12 125 S — took to the Piacenza circuit, igniting the winningest motorsport dynasty in history.
                </p>
              </div>

              <div>
                <h3 className="font-mono-tech text-xs uppercase tracking-widest font-bold text-[#d40000] mb-2">
                  THE CAVALLINO RAMPANTE
                </h3>
                <p className="font-sans text-xs text-white/70 dark:text-white/70 light:text-zinc-600 leading-relaxed">
                  The black prancing horse on a canary yellow field (the civic color of Modena) was personally given to Enzo Ferrari by the Countess Paolina Baracca, mother of Italian World War I flying ace Francesco Baracca: <em>"Put my son's prancing horse upon your cars; it will bring you good fortune."</em>
                </p>
              </div>

              <div>
                <h3 className="font-mono-tech text-xs uppercase tracking-widest font-bold text-[#d40000] mb-2">
                  THE RACING SOUL
                </h3>
                <p className="font-sans text-xs text-white/70 dark:text-white/70 light:text-zinc-600 leading-relaxed">
                  Ferrari remains the sole team to have contested every Formula One World Championship season since its inception in 1950, securing a record 16 Constructors' titles and 15 Drivers' championships. Every road car created in Maranello is an undiluted byproduct of Grand Prix engineering.
                </p>
              </div>
            </div>
          </div>
        )}
      </section>

      {/* ========================================================= */}
      {/* 2. 5 ROWS WITH 3 CARS IN EACH ROW (15 ICONS) */}
      {/* ========================================================= */}
      <section>
        <div className="flex items-center justify-between mb-10 pb-4 border-b border-white/10 dark:border-white/10 light:border-zinc-300">
          <div>
            <span className="font-mono-tech text-[10px] uppercase tracking-[0.3em] text-[#d40000] font-bold block mb-1">
              MARANELLO CHASSIS COLLECTION
            </span>
            <h2 className="font-display font-black text-3xl sm:text-5xl uppercase text-white dark:text-white light:text-zinc-950">
              5 SERIES &middot; 15 ICONS
            </h2>
          </div>
          <div className="font-mono-tech text-xs tracking-widest text-[#d40000] font-bold uppercase hidden sm:block">
            CLICK ANY VEHICLE TO OPEN 360° STUDIO
          </div>
        </div>

        {/* 3-Column Grid for 15 Cars: Entire card is clickable to open 360 studio */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {vehicles.map((car) => (
            <div
              key={car.id}
              onClick={() => setInspectVehicle(car)}
              className="bg-[#0c0c12] dark:bg-[#0c0c12] light:bg-white border border-white/10 dark:border-white/10 light:border-zinc-200 hover:border-[#d40000] rounded-lg overflow-hidden flex flex-col justify-between transition-all duration-300 group hover:shadow-[0_0_30px_rgba(212,0,0,0.25)] shadow-md cursor-pointer hover:-translate-y-1"
            >
              {/* Photo with 360 Badge Overlay - stays white on photo */}
              <div className="relative h-56 w-full overflow-hidden bg-black/60">
                <img
                  src={car.heroImage}
                  alt={car.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-80" />


                {car.year && (
                  <div className="absolute top-3 right-3 bg-black/75 backdrop-blur-md px-2.5 py-1 rounded text-[10px] font-mono-tech !text-white font-bold">
                    {car.year}
                  </div>
                )}

                {/* Instruction Badge: TAP TO VIEW 360° */}
                <div className="absolute bottom-3 inset-x-3 flex items-center justify-center pointer-events-none">
                  <div
                    style={{ backgroundColor: "#000000" }}
                    className="group-hover:!bg-[#d40000] !text-white px-3.5 py-1.5 rounded-full font-mono-tech text-[10px] uppercase tracking-widest font-bold flex items-center gap-1.5 transition-all shadow-xl border border-white/20 group-hover:border-[#d40000]"
                  >
                    <Eye className="w-3.5 h-3.5 !text-white" />
                    <span className="!text-white">TAP TO VIEW 360°</span>
                  </div>
                </div>
              </div>

              {/* Card Body - white in dark mode, black in light mode */}
              <div className="p-6 flex-1 flex flex-col justify-between bg-[#0c0c12] dark:bg-[#0c0c12] light:bg-white">
                <div>
                  <span className="font-mono-tech text-[10px] uppercase tracking-widest text-[#d40000] font-bold block mb-1">
                    {car.category}
                  </span>
                  <h3 className="font-display font-black text-2xl uppercase tracking-wide text-white dark:text-white light:!text-zinc-950 group-hover:text-[#d40000] transition-colors">
                    {car.name}
                  </h3>
                  {car.tagline && (
                    <p className="font-sans text-xs text-white/60 dark:text-white/60 light:!text-zinc-600 line-clamp-2 mt-2">
                      {car.tagline}
                    </p>
                  )}
                </div>

                {/* Specs Strip */}
                <div className="mt-6 pt-4 border-t border-white/10 dark:border-white/10 light:border-zinc-200 flex items-center justify-between font-mono-tech text-xs">
                  <div>
                    <span className="text-[9px] uppercase tracking-widest text-white/40 dark:text-white/40 light:!text-zinc-500 block">TOP SPEED</span>
                    <span className="text-white dark:text-white light:!text-zinc-950 font-bold">{car.topSpeed || "—"}</span>
                  </div>
                  <div>
                    <span className="text-[9px] uppercase tracking-widest text-white/40 dark:text-white/40 light:!text-zinc-500 block">POWER</span>
                    <span className="text-[#d40000] font-bold">{car.power ? car.power.split("@")[0] : "—"}</span>
                  </div>
                  <div>
                    <span className="text-[9px] uppercase tracking-widest text-white/40 dark:text-white/40 light:!text-zinc-500 block">WEIGHT</span>
                    <span className="text-white dark:text-white light:!text-zinc-950 font-bold">{car.weight || "—"}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ========================================================= */}
      {/* 3. 360 SHOWROOM INSPECTION MODAL */}
      {/* ========================================================= */}
      {inspectVehicle && (
        <Showroom360Modal
          vehicle={inspectVehicle}
          onClose={() => setInspectVehicle(null)}
        />
      )}
    </div>
  );
};
