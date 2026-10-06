import React, { useRef, useEffect, useState, useCallback } from "react";
import { Loader } from "../common/Loader";
import { ChevronDown, Volume2, VolumeX } from "lucide-react";
import { getAssetUrl } from "../../utils/assetUrl";
import { soundManager, explodedSoundManager } from "../../audio/ExplodedSoundManager";

const TOTAL_FRAMES = 240;

export const ExplodedViewSection: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [loadedCount, setLoadedCount] = useState(0);
  const [isReady, setIsReady] = useState(false);
  const [currentFrameIndex, setCurrentFrameIndex] = useState(0);
  const [isSoundActive, setIsSoundActive] = useState<boolean>(() => explodedSoundManager.isSoundEnabled());

  const imagesRef = useRef<HTMLImageElement[]>([]);
  const targetProgressRef = useRef(0);
  const currentProgressRef = useRef(0);
  const animationFrameIdRef = useRef<number | null>(null);

  // Toggle interactive sound design
  const toggleSound = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    const nextState = !isSoundActive;
    setIsSoundActive(nextState);
    soundManager.setSoundEnabled(nextState);
    if (nextState) {
      soundManager.ensureUnlocked();
      soundManager.startAmbience();
    } else {
      soundManager.stopAmbience();
      soundManager.stopMotion();
    }
  };

  // Render frame on 4K canvas (3840x2160)
  const renderFrame = useCallback((frameIdx: number): boolean => {
    const canvas = canvasRef.current;
    if (!canvas) return false;
    const ctx = canvas.getContext("2d");
    if (!ctx) return false;

    const img = imagesRef.current[frameIdx];
    if (!img || !img.complete || img.naturalWidth === 0) {
      const baseImg = imagesRef.current[0];
      if (baseImg && baseImg.complete && baseImg.naturalWidth > 0) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = "high";
        ctx.drawImage(baseImg, 0, 0, canvas.width, canvas.height);
      }
      return false;
    }

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    return true;
  }, []);

  // Preload all 240 frames
  useEffect(() => {
    let isCancelled = false;
    const images: HTMLImageElement[] = new Array(TOTAL_FRAMES);
    let loaded = 0;

    // Load first frame with top priority
    const firstImg = new Image();
    firstImg.src = getAssetUrl("/assets/exploded/frame-0001.jpg");
    firstImg.onload = () => {
      if (isCancelled) return;
      loaded++;
      setLoadedCount(1);
      setIsReady(true);
      renderFrame(0);
    };
    firstImg.onerror = () => {
      if (isCancelled) return;
      loaded++;
      setLoadedCount(1);
      setIsReady(true);
    };
    images[0] = firstImg;

    // Load remaining frames
    for (let i = 2; i <= TOTAL_FRAMES; i++) {
      const img = new Image();
      const padNum = i.toString().padStart(4, "0");
      img.src = getAssetUrl(`/assets/exploded/frame-${padNum}.jpg`);

      img.onload = () => {
        if (isCancelled) return;
        loaded++;
        setLoadedCount(loaded);
        if (loaded >= 10) {
          setIsReady(true);
        }
      };

      img.onerror = () => {
        if (isCancelled) return;
        loaded++;
        setLoadedCount(loaded);
      };

      images[i - 1] = img;
    }

    imagesRef.current = images;

    return () => {
      isCancelled = true;
    };
  }, [renderFrame]);

  // Set initial 4K canvas resolution and render frame 0
  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas) {
      canvas.width = 3840;
      canvas.height = 2160;
      renderFrame(0);
    }
  }, [renderFrame]);

  // Scroll listener to update timeline progress and handle audio zone
  useEffect(() => {
    const handleScroll = () => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const totalScrollable = containerRef.current.offsetHeight - window.innerHeight;

      if (totalScrollable <= 0) return;

      const scrolled = -rect.top;
      const progress = Math.max(0, Math.min(1, scrolled / totalScrollable));
      targetProgressRef.current = progress;

      // Only activate ambience while within or adjacent to the exploded section
      const isInsideExplodeSection = scrolled >= -80 && scrolled <= totalScrollable + 80;
      if (isInsideExplodeSection) {
        soundManager.ensureUnlocked();
        if (isSoundActive) {
          soundManager.startAmbience();
        }
      } else {
        soundManager.stopAmbience();
        soundManager.stopMotion();
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();

    return () => {
      window.removeEventListener("scroll", handleScroll);
      soundManager.stopAmbience();
      soundManager.stopMotion();
    };
  }, [isSoundActive]);

  // Animation loop with refined mechanical damping and velocity audio calculation
  useEffect(() => {
    let lastRenderedFrame = -1;
    let lastProgressForVel = 0;
    let lastTime = performance.now();
    let stopMotionTimer: ReturnType<typeof setTimeout> | null = null;

    const loop = () => {
      // Slower, weighted mechanical damping (0.18) for tactile inertia without latency
      currentProgressRef.current += (targetProgressRef.current - currentProgressRef.current) * 0.18;

      const now = performance.now();
      const dt = Math.max(1, now - lastTime);
      const velocity = Math.abs(currentProgressRef.current - lastProgressForVel) / (dt / 1000);
      lastProgressForVel = currentProgressRef.current;
      lastTime = now;

      // Synchronize sound design system to scroll progress and velocity immediately
      if (isSoundActive) {
        soundManager.updateScroll(currentProgressRef.current, velocity);
      }

      if (velocity < 0.003) {
        if (!stopMotionTimer) {
          stopMotionTimer = setTimeout(() => {
            soundManager.stopMotion();
            stopMotionTimer = null;
          }, 90);
        }
      } else if (stopMotionTimer) {
        clearTimeout(stopMotionTimer);
        stopMotionTimer = null;
      }

      const frameIdx = Math.max(
        0,
        Math.min(TOTAL_FRAMES - 1, Math.round(currentProgressRef.current * (TOTAL_FRAMES - 1)))
      );

      if (frameIdx !== lastRenderedFrame || lastRenderedFrame === -1) {
        const rendered = renderFrame(frameIdx);
        if (rendered) {
          lastRenderedFrame = frameIdx;
        }
        setCurrentFrameIndex(frameIdx);
      }

      animationFrameIdRef.current = requestAnimationFrame(loop);
    };

    animationFrameIdRef.current = requestAnimationFrame(loop);

    return () => {
      if (animationFrameIdRef.current) {
        cancelAnimationFrame(animationFrameIdRef.current);
      }
      if (stopMotionTimer) {
        clearTimeout(stopMotionTimer);
      }
      soundManager.stopMotion();
      soundManager.stopAmbience();
    };
  }, [renderFrame, isSoundActive]);

  // Dynamic engineering phase label
  const getPhaseLabel = (frame: number) => {
    if (frame < 40) return "1. ASSEMBLED AERODYNAMIC CHASSIS";
    if (frame < 90) return "2. ACTIVE AERODYNAMICS & WHEEL CELLS";
    if (frame < 140) return "3. DIHEDRAL DOORS & COCKPIT MONOCOQUE";
    if (frame < 190) return "4. 6.3L NATURALLY ASPIRATED V12 & HY-KERS";
    return "5. FULLY EXPANDED STRUCTURAL MATRIX";
  };

  const progressPercent = Math.round((currentFrameIndex / (TOTAL_FRAMES - 1)) * 100);

  return (
    <div
      ref={containerRef}
      onClick={() => soundManager.ensureUnlocked()}
      onTouchStart={() => soundManager.ensureUnlocked()}
      className="relative w-full bg-[#070709] select-none"
      style={{ height: "560vh" }} // 5.6 viewports of scroll distance: slower, physical, deliberate exploration
    >
      {/* Sticky 100vh Viewport Stage with ample top clearance for navbar */}
      <div className="sticky top-0 left-0 w-full h-screen overflow-hidden flex flex-col justify-between px-6 sm:px-12 pt-24 sm:pt-28 pb-8 pointer-events-none">
        {/* Top Header */}
        <div className="z-10 w-full flex flex-col gap-1 sm:gap-2">
          {/* Top Line: ENGINEERING EXPLODED VIEW (left) --- SCROLL DOWN (center/in between) --- SOUND TOGGLE (right) */}
          <div className="w-full flex items-center justify-between gap-3 pointer-events-auto">
            {/* Left: Engineering Exploded View */}
            <div className="flex items-center gap-2 shrink-0">
              <span className="w-2.5 h-2.5 bg-[#d40000] rotate-45 shrink-0" />
              <span className="font-mono-tech text-[10px] sm:text-xs tracking-[0.25em] sm:tracking-[0.3em] uppercase text-[#d40000] font-bold whitespace-nowrap">
                ENGINEERING EXPLODED VIEW
              </span>
            </div>

            {/* In Between: SCROLL DOWN indicator (open, unclickable, red, text-[10px], elevated higher) */}
            <div
              className={`pointer-events-none select-none transition-opacity duration-300 -translate-y-1 sm:-translate-y-1.5 ${
                currentFrameIndex < 35 ? "opacity-100" : "opacity-0"
              }`}
            >
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 bg-[#d40000] rotate-45 shrink-0 shadow-[0_0_8px_#d40000]" />
                <span
                  style={{ color: "#d40000" }}
                  className="font-mono-tech text-[10px] tracking-widest uppercase font-bold text-[#d40000] !text-[#d40000] drop-shadow-[0_0_12px_rgba(212,0,0,0.6)] whitespace-nowrap"
                >
                  SCROLL DOWN
                </span>
                <ChevronDown
                  style={{ color: "#d40000" }}
                  className="w-3 h-3 text-[#d40000] !text-[#d40000] animate-bounce shrink-0"
                />
              </div>
            </div>

            {/* Right: Minimalist Premium Audio Toggle Button - guaranteed white in both light and dark modes */}
            <button
              onClick={toggleSound}
              aria-label={isSoundActive ? "Mute interactive engineering audio" : "Enable interactive engineering audio"}
              style={{ color: "#ffffff" }}
              className="always-white flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-black/85 backdrop-blur-md border border-white/25 hover:border-[#d40000] shadow-[0_0_15px_rgba(0,0,0,0.6)] hover:shadow-[0_0_20px_rgba(212,0,0,0.4)] transition-all cursor-pointer pointer-events-auto group !text-white shrink-0"
            >
              {isSoundActive ? (
                <>
                  <Volume2 className="w-3.5 h-3.5 text-[#d40000]" />
                  <span
                    style={{ color: "#ffffff" }}
                    className="font-mono-tech text-[10px] tracking-[0.2em] uppercase font-bold !text-white"
                  >
                    SOUND ON
                  </span>
                  <span className="flex items-end gap-0.5 h-2.5 ml-0.5">
                    <span className="w-0.5 h-2 bg-[#d40000] animate-pulse" />
                    <span className="w-0.5 h-3 bg-[#d40000] animate-pulse delay-75" />
                    <span className="w-0.5 h-1.5 bg-[#d40000] animate-pulse delay-150" />
                  </span>
                </>
              ) : (
                <>
                  <VolumeX className="w-3.5 h-3.5 !text-white" style={{ color: "#ffffff" }} />
                  <span
                    style={{ color: "#ffffff" }}
                    className="font-mono-tech text-[10px] tracking-[0.2em] uppercase font-bold !text-white"
                  >
                    SOUND OFF
                  </span>
                </>
              )}
            </button>
          </div>

          {/* Car Name & Subtitle */}
          <div className="pointer-events-auto">
            <h2 className="font-display font-black text-3xl sm:text-5xl uppercase tracking-wider text-[#d40000] drop-shadow-[0_0_30px_rgba(212,0,0,0.5)]">
              FERRARI LAFERRARI
            </h2>
            <p
              style={{ color: "#000000" }}
              className="font-mono-tech text-[11px] tracking-widest uppercase font-bold mt-1 !text-black"
            >
              SCROLL DOWN TO EXPLODE &middot; SCROLL UP TO REASSEMBLE
            </p>
          </div>
        </div>

        {/* Full-Screen 4K Canvas Stage matching the total laptop screen */}
        <div className="absolute inset-0 w-full h-full flex items-center justify-center z-0 overflow-hidden">
          {/* Instant Assembled Static Backdrop: guarantees ZERO black flash */}
          <img
            src={getAssetUrl("/assets/exploded/frame-0001.jpg")}
            alt="Ferrari Exploded View Assembled"
            className="absolute inset-0 w-full h-full object-cover pointer-events-none -z-10"
          />
          <canvas
            ref={canvasRef}
            width={3840}
            height={2160}
            className="w-full h-full object-cover pointer-events-none"
          />
        </div>

        {/* Loading Indicator until initial sequence is ready */}
        {!isReady && (
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-black/90 backdrop-blur-xl border border-white/15 p-8 rounded-2xl text-center z-20 pointer-events-auto shadow-2xl flex flex-col items-center">
            <Loader scale={0.55} label="PRELOADING ENGINEERING SEQUENCE" />
            <span className="font-mono-tech text-[11px] text-white/60 mt-2 block tracking-wider">
              {loadedCount} / {TOTAL_FRAMES} FRAMES ({Math.round((loadedCount / TOTAL_FRAMES) * 100)}%)
            </span>
          </div>
        )}

        {/* Bottom Status & Progress Bar */}
        <div className="flex items-end justify-between z-10 gap-4">
          {/* Progress Timeline */}
          <div className="flex flex-col gap-1 w-48 sm:w-72">
            <div className="flex justify-between font-mono-tech text-[10px] tracking-widest uppercase">
              <span className="explode-red-stat font-bold !text-[#d40000]">
                FRAME {((currentFrameIndex + 1).toString()).padStart(3, "0")} / 240
              </span>
              <span className="explode-red-stat font-bold !text-[#d40000]">
                {progressPercent}%
              </span>
            </div>
            <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
              <div
                className="h-full bg-[#d40000] transition-all duration-75"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>

          {/* Scroll Guide & Component Analysis in Red with Pure White Text - aligned to the right side of the page */}
          <div className="bg-[#d40000] text-white border border-[#d40000] px-5 py-2.5 rounded shadow-2xl flex items-center gap-3 ml-auto -mr-4 sm:-mr-8 lg:-mr-10">
            <span className="w-2.5 h-2.5 bg-white rotate-45 shrink-0" />
            <div>
              <span className="font-mono-tech text-[9px] uppercase tracking-widest text-white/90 block leading-tight">
                SCROLL GUIDE &middot; COMPONENT ANALYSIS
              </span>
              <span className="font-mono-tech text-xs uppercase font-bold text-white tracking-wider leading-tight">
                {getPhaseLabel(currentFrameIndex)}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
