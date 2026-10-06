import React, { useRef, useEffect, useState, useCallback } from "react";
import { Loader } from "../common/Loader";
import { ChevronDown } from "lucide-react";
import { getAssetUrl } from "../../utils/assetUrl";

const TOTAL_FRAMES = 240;

export const ExplodedViewSection: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [loadedCount, setLoadedCount] = useState(0);
  const [isReady, setIsReady] = useState(false);
  const [currentFrameIndex, setCurrentFrameIndex] = useState(0);

  const imagesRef = useRef<HTMLImageElement[]>([]);
  const targetProgressRef = useRef(0);
  const currentProgressRef = useRef(0);
  const animationFrameIdRef = useRef<number | null>(null);
  const scrollAudioRef = useRef<HTMLAudioElement | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);
  const finalThrottleTriggeredRef = useRef<boolean>(false);
  const scrollStopTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const fadeIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const isPlayingAudioRef = useRef<boolean>(false);

  // Initialize explode_scroll.mp3 audio
  useEffect(() => {
    const audio = new Audio(getAssetUrl("/assets/audio/explode_scroll.mp3"));
    audio.preload = "auto";
    audio.loop = true;
    audio.volume = 0;
    scrollAudioRef.current = audio;

    return () => {
      if (scrollStopTimeoutRef.current) {
        clearTimeout(scrollStopTimeoutRef.current);
      }
      if (fadeIntervalRef.current) {
        clearInterval(fadeIntervalRef.current);
      }
      audio.pause();
      audio.src = "";
      scrollAudioRef.current = null;
      if (audioCtxRef.current) {
        audioCtxRef.current.close().catch(() => {});
        audioCtxRef.current = null;
      }
    };
  }, []);

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
    // Draw directly to 4K canvas dimensions (3840x2160)
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
      // Immediately render frame 0
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

  // Scroll listener to update timeline progress and handle scroll sound
  useEffect(() => {
    let lastScrollProgress = -1;

    const initWebAudio = () => {
      if (audioCtxRef.current || !scrollAudioRef.current) return;
      try {
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        if (AudioCtx) {
          const ctx = new AudioCtx();
          const source = ctx.createMediaElementSource(scrollAudioRef.current);
          const gainNode = ctx.createGain();
          gainNode.gain.value = 2.8; // High volume amplification boost (280%)
          source.connect(gainNode);
          gainNode.connect(ctx.destination);
          audioCtxRef.current = ctx;
          gainNodeRef.current = gainNode;
        }
      } catch {
        // Fallback to standard audio element if context blocked
      }
    };

    const stopAudio = () => {
      const audio = scrollAudioRef.current;
      if (!audio) return;
      if (fadeIntervalRef.current) clearInterval(fadeIntervalRef.current);

      let vol = audio.volume;
      fadeIntervalRef.current = setInterval(() => {
        vol = Math.max(0, vol - 0.08);
        if (audio) audio.volume = vol;
        if (vol <= 0) {
          if (fadeIntervalRef.current) clearInterval(fadeIntervalRef.current);
          fadeIntervalRef.current = null;
          isPlayingAudioRef.current = false;
          if (audio) {
            audio.pause();
            audio.playbackRate = 1.0;
          }
        }
      }, 40);
    };

    // Continuous engine audio during explode scroll: sustained full sound without stutter
    const playContinuousScrollAudio = () => {
      const audio = scrollAudioRef.current;
      if (!audio) return;

      initWebAudio();
      if (audioCtxRef.current && audioCtxRef.current.state === "suspended") {
        audioCtxRef.current.resume().catch(() => {});
      }

      if (gainNodeRef.current) {
        gainNodeRef.current.gain.value = 2.8;
      }

      if (fadeIntervalRef.current) {
        clearInterval(fadeIntervalRef.current);
        fadeIntervalRef.current = null;
      }

      audio.volume = 1.0;
      audio.playbackRate = 1.0;
      audio.loop = true;

      if (!isPlayingAudioRef.current || audio.paused) {
        isPlayingAudioRef.current = true;
        audio.play().catch(() => {});
      }

      // Sustained 1.5s playback so wheel pauses do NOT chop the sound into "stopping stopping"
      if (scrollStopTimeoutRef.current) {
        clearTimeout(scrollStopTimeoutRef.current);
      }
      scrollStopTimeoutRef.current = setTimeout(() => {
        stopAudio();
      }, 1500);
    };

    // Full throttle roar on final scroll moving out of explode view: plays full sound completely
    const playFullThrottleRoar = () => {
      const audio = scrollAudioRef.current;
      if (!audio) return;

      initWebAudio();
      if (audioCtxRef.current && audioCtxRef.current.state === "suspended") {
        audioCtxRef.current.resume().catch(() => {});
      }

      if (gainNodeRef.current) {
        gainNodeRef.current.gain.value = 3.2; // Maximum volume boost (320%)
      }

      if (fadeIntervalRef.current) {
        clearInterval(fadeIntervalRef.current);
        fadeIntervalRef.current = null;
      }

      if (scrollStopTimeoutRef.current) {
        clearTimeout(scrollStopTimeoutRef.current);
        scrollStopTimeoutRef.current = null;
      }

      audio.volume = 1.0;
      audio.playbackRate = 1.25;
      audio.loop = false; // Plays the full sample without stopping or chopping
      audio.play().catch(() => {});
      isPlayingAudioRef.current = true;
    };

    const handleScroll = () => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const totalScrollable = containerRef.current.offsetHeight - window.innerHeight;

      if (totalScrollable <= 0) return;

      const scrolled = -rect.top;
      const progress = Math.max(0, Math.min(1, scrolled / totalScrollable));
      targetProgressRef.current = progress;

      // Only play while actively inside the explode scroll section
      const isInsideExplodeSection = scrolled >= 0 && scrolled <= totalScrollable;

      if (isInsideExplodeSection) {
        // Final scroll approaching exit: trigger full throttle roar
        if (progress >= 0.88) {
          if (!finalThrottleTriggeredRef.current) {
            finalThrottleTriggeredRef.current = true;
            playFullThrottleRoar();
          }
        } else {
          finalThrottleTriggeredRef.current = false;
          // Smooth continuous audio while scrubbing
          if (lastScrollProgress !== -1 && Math.abs(progress - lastScrollProgress) > 0.0002) {
            playContinuousScrollAudio();
          }
        }
      } else {
        // Moving downwards from explode view into the garage showroom
        if (scrolled > totalScrollable && !finalThrottleTriggeredRef.current && lastScrollProgress > 0.8) {
          finalThrottleTriggeredRef.current = true;
          playFullThrottleRoar();
        } else if (scrolled < 0) {
          stopAudio();
          finalThrottleTriggeredRef.current = false;
        }
      }

      lastScrollProgress = progress;
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();

    return () => {
      window.removeEventListener("scroll", handleScroll);
      stopAudio();
    };
  }, []);

  // Animation loop with micro-lerp for ultra-smooth scrubbing
  useEffect(() => {
    let lastRenderedFrame = -1;

    const loop = () => {
      // Subtle damping for buttery smooth motion without delay
      currentProgressRef.current += (targetProgressRef.current - currentProgressRef.current) * 0.25;

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
    };
  }, [renderFrame]);

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
      className="relative w-full bg-[#070709] select-none"
      style={{ height: "380vh" }} // 3.8 viewports of scroll distance for smooth scrubbing
    >
      {/* Sticky 100vh Viewport Stage with ample top clearance for navbar */}
      <div className="sticky top-0 left-0 w-full h-screen overflow-hidden flex flex-col justify-between px-6 sm:px-12 pt-24 sm:pt-28 pb-8 pointer-events-none">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 z-10">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="w-2.5 h-2.5 bg-[#d40000] rotate-45" />
              <span className="font-mono-tech text-[10px] sm:text-xs tracking-[0.3em] uppercase text-[#d40000] font-bold">
                ENGINEERING EXPLODED VIEW
              </span>
            </div>
            <h2 className="font-display font-black text-3xl sm:text-5xl uppercase tracking-wider text-[#d40000] drop-shadow-[0_0_30px_rgba(212,0,0,0.5)]">
              FERRARI LAFERRARI
            </h2>
            <p className="font-mono-tech text-[11px] tracking-widest !text-black font-extrabold uppercase mt-1">
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

        {/* Scroll Down Guide Capsule Button: Located ABOVE the car, compact & refined */}
        {currentFrameIndex < 35 && (
          <div className="absolute top-[23%] sm:top-[25%] left-1/2 -translate-x-1/2 -translate-y-1/2 z-20 pointer-events-auto transition-all duration-500 animate-in fade-in">
            <button
              onClick={() => {
                window.scrollBy({ top: window.innerHeight * 0.9, behavior: "smooth" });
              }}
              className="group relative flex items-center gap-2 px-3.5 sm:px-4 py-1.5 rounded-full bg-black/80 backdrop-blur-md border border-[#d40000] shadow-[0_0_15px_rgba(212,0,0,0.55),inset_0_0_10px_rgba(212,0,0,0.2)] hover:shadow-[0_0_25px_rgba(212,0,0,0.85)] hover:scale-105 active:scale-95 transition-all cursor-pointer"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-[#d40000] shadow-[0_0_6px_#d40000] shrink-0" />
              <span className="font-mono-tech text-[10px] sm:text-[11px] tracking-[0.2em] uppercase font-bold text-white !text-white drop-shadow-sm">
                SCROLL DOWN
              </span>
              <ChevronDown className="w-3.5 h-3.5 text-white !text-white animate-bounce shrink-0" />
            </button>
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

          {/* Scroll Guide & Component Analysis in Red with Pure White Text */}
          <div className="bg-[#d40000] text-white border border-[#d40000] px-5 py-2.5 rounded shadow-2xl flex items-center gap-3">
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
