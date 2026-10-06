import React, { useState, useRef, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Volume2, VolumeX } from "lucide-react";

// Trim first 5 seconds from start; begins from 5.0s onwards
const START_TIME = 5.0;

export const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const [isTransitioning, setIsTransitioning] = useState(false);

  // Sound starts ON by default unless user previously turned it off in session
  const [isSoundOn, setIsSoundOn] = useState<boolean>(() => {
    try {
      const pref = sessionStorage.getItem("ferrari_landing_sound_preference");
      if (pref === "off") return false;
      return true;
    } catch {
      return true;
    }
  });

  const videoRef = useRef<HTMLVideoElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const fadeAnimationRef = useRef<number | null>(null);

  // Smooth audio volume fade using requestAnimationFrame
  const fadeVolume = useCallback((targetVolume: number, duration = 700, onComplete?: () => void) => {
    const aud = audioRef.current;
    if (!aud) return;
    if (fadeAnimationRef.current) {
      cancelAnimationFrame(fadeAnimationRef.current);
    }

    const startVolume = aud.volume;
    const startTime = performance.now();

    const step = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(1, elapsed / duration);
      // Smooth sinusoidal easing curve for natural audio ramping
      const eased = 0.5 - 0.5 * Math.cos(Math.PI * progress);
      aud.volume = Math.max(0, Math.min(1, startVolume + (targetVolume - startVolume) * eased));

      if (progress < 1) {
        fadeAnimationRef.current = requestAnimationFrame(step);
      } else {
        aud.volume = targetVolume;
        if (targetVolume === 0) {
          aud.pause();
          aud.muted = true;
        }
        onComplete?.();
      }
    };

    fadeAnimationRef.current = requestAnimationFrame(step);
  }, []);

  // Smoothly enable sound and fade in
  const enableSound = useCallback(() => {
    const aud = audioRef.current;
    const vid = videoRef.current;
    if (!aud) return;

    try {
      aud.muted = false;
      aud.volume = 0;
      if (vid && vid.readyState >= 1) {
        aud.currentTime = Math.max(START_TIME, vid.currentTime);
      } else {
        aud.currentTime = START_TIME;
      }

      const playPromise = aud.play();
      if (playPromise) {
        playPromise
          .then(() => {
            fadeVolume(1.0, 700);
            setIsSoundOn(true);
            try {
              sessionStorage.setItem("ferrari_landing_sound_preference", "on");
            } catch {}
          })
          .catch(() => {
            // Browser autoplay policy prevented unmuted playback without prior interaction
            setIsSoundOn(false);
          });
      }
    } catch {
      setIsSoundOn(false);
    }
  }, [fadeVolume]);

  // Smoothly disable sound and fade out
  const disableSound = useCallback(() => {
    setIsSoundOn(false);
    try {
      sessionStorage.setItem("ferrari_landing_sound_preference", "off");
    } catch {}
    fadeVolume(0, 400);
  }, [fadeVolume]);

  // Toggle button handler
  const toggleSound = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (isSoundOn) {
      disableSound();
    } else {
      enableSound();
    }
  };

  // Intentional click anywhere on landing page to unlock sound if currently off
  const handlePageClick = () => {
    if (!isSoundOn && !isTransitioning) {
      enableSound();
    }
  };

  // Page mount: reliably start video, and attempt sound on by default
  useEffect(() => {
    const vid = videoRef.current;
    if (vid) {
      try {
        if (vid.readyState >= 1 && vid.currentTime < START_TIME) {
          vid.currentTime = START_TIME;
        }
        vid.play().catch(() => {});
      } catch {}
    }

    // Default ON: try to start sound on load
    try {
      const savedPref = sessionStorage.getItem("ferrari_landing_sound_preference");
      if (savedPref !== "off") {
        enableSound();
      }
    } catch {
      enableSound();
    }

    return () => {
      if (fadeAnimationRef.current) {
        cancelAnimationFrame(fadeAnimationRef.current);
      }
    };
  }, [enableSound]);

  const handleVideoLoadedMetadata = () => {
    const vid = videoRef.current;
    if (vid) {
      if (vid.currentTime < START_TIME) {
        vid.currentTime = START_TIME;
      }
      vid.play().catch(() => {});
    }
  };

  const handleTimeUpdate = () => {
    const vid = videoRef.current;
    const aud = audioRef.current;
    if (!vid) return;

    // Never play before START_TIME (5.0s)
    try {
      if (vid.currentTime < START_TIME) {
        vid.currentTime = START_TIME;
      }
    } catch {}

    // Keep audio in exact parallel lockstep with video when active
    if (aud && isSoundOn && !aud.paused) {
      try {
        if (aud.readyState >= 1 && Math.abs(aud.currentTime - vid.currentTime) > 0.08) {
          aud.currentTime = vid.currentTime;
        }
      } catch {}
    }
  };

  const handleVideoSeeking = () => {
    if (audioRef.current && videoRef.current) {
      try {
        if (audioRef.current.readyState >= 1) {
          audioRef.current.currentTime = Math.max(START_TIME, videoRef.current.currentTime);
        }
      } catch {}
    }
  };

  const handleVideoEnded = () => {
    // Synchronous loop from START_TIME (5.0s)
    if (videoRef.current) {
      try {
        videoRef.current.currentTime = START_TIME;
        videoRef.current.play().catch(() => {});
      } catch {}
    }
    if (audioRef.current) {
      try {
        audioRef.current.currentTime = START_TIME;
        if (isSoundOn) {
          audioRef.current.play().catch(() => {});
        }
      } catch {}
    }
  };

  const handleEnterGarage = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsTransitioning(true);

    // When clicking Enter Garage, unlock and play engine audio for cinematic transition
    const aud = audioRef.current;
    const vid = videoRef.current;
    if (aud) {
      try {
        aud.muted = false;
        aud.volume = 1.0;
        if (vid && vid.readyState >= 1) {
          aud.currentTime = Math.max(START_TIME, vid.currentTime);
        }
        aud.play().catch(() => {});
      } catch {}
    }

    setTimeout(() => {
      if (aud) {
        aud.pause();
      }
      navigate("/garage");
    }, 750);
  };

  return (
    <main
      onClick={handlePageClick}
      className={`fixed inset-0 w-screen h-screen overflow-hidden bg-[#070709] select-none flex flex-col justify-end items-start transition-all duration-700 cursor-default ${
        isTransitioning ? "opacity-0 scale-105 pointer-events-none" : "opacity-100 scale-100"
      }`}
    >
      {/* Background Video (Autoplays muted immediately from 5s onwards, 100% compliant) */}
      <video
        ref={videoRef}
        autoPlay
        muted
        playsInline
        preload="auto"
        disablePictureInPicture
        controlsList="nodownload nofullscreen noremoteplayback nopictureinpicture"
        onContextMenu={(e) => e.preventDefault()}
        onLoadedMetadata={handleVideoLoadedMetadata}
        onTimeUpdate={handleTimeUpdate}
        onSeeking={handleVideoSeeking}
        onEnded={handleVideoEnded}
        className="absolute inset-0 w-full h-full object-cover z-0 pointer-events-none"
      >
        <source src="/assets/videos/landing.webm#t=5" type="video/webm" />
        <source src="/assets/videos/landing.mp4#t=5" type="video/mp4" />
      </video>

      {/* Soundtrack Audio (Fades in smoothly upon SOUND ON or click) */}
      <audio
        ref={audioRef}
        playsInline
        preload="auto"
        src="/assets/audio/landing.m4a#t=5"
      />

      {/* Neutral Clean Cinematic Vignette */}
      <div className="absolute inset-0 z-0 bg-gradient-to-t from-[#070709] via-transparent to-[#070709]/50 opacity-80 pointer-events-none" />
      <div className="absolute inset-0 z-0 bg-gradient-to-tr from-[#070709]/95 via-[#070709]/30 to-transparent pointer-events-none" />

      {/* Top Right Header: Subtle Premium Sound Toggle & Instruction */}
      <div className="absolute top-6 right-6 z-20 flex items-center gap-3">
        {!isSoundOn && (
          <div
            onClick={(e) => {
              e.stopPropagation();
              enableSound();
            }}
            className="flex items-center gap-2 bg-[#d40000] text-white px-3.5 py-1.5 rounded-full text-[11px] font-mono-tech uppercase tracking-wider animate-bounce shadow-[0_0_25px_rgba(212,0,0,0.65)] cursor-pointer hover:bg-[#b50000] transition-all"
            title="Click to activate audio"
          >
            <Volume2 className="w-3.5 h-3.5 animate-pulse" />
            <span>CLICK FOR SOUND</span>
          </div>
        )}
        <button
          onClick={toggleSound}
          className="flex items-center gap-2.5 px-4 py-2 rounded bg-black/60 backdrop-blur-md border border-white/15 hover:border-[#d40000] text-white font-mono-tech text-xs uppercase tracking-wider transition-all duration-300 cursor-pointer shadow-lg hover:scale-105"
          title={isSoundOn ? "Mute audio" : "Enable soundtrack"}
        >
          {isSoundOn ? (
            <>
              <Volume2 className="w-4 h-4 text-[#d40000]" />
              <span className="font-bold text-white tracking-widest">SOUND ON</span>
              <span className="w-1.5 h-1.5 rounded-full bg-[#d40000] animate-ping" />
            </>
          ) : (
            <>
              <VolumeX className="w-4 h-4 text-white/50" />
              <span className="text-white/60 hover:text-white tracking-widest">SOUND OFF</span>
            </>
          )}
        </button>
      </div>

      {/* Minimalist Cinematic UI Placed at Bottom-Left */}
      <div className="relative z-10 flex flex-col items-start text-left p-8 sm:p-12 md:p-16 lg:p-20 max-w-4xl">
        {/* Minimal Maranello Monogram Bar */}
        <div className="w-12 h-[3px] bg-[#d40000] mb-4 tracking-widest opacity-90" />

        {/* Brand Title with subtle red shade highlighting only the word FERRARI */}
        <div className="relative inline-block my-1">
          {/* Focused red glow aura directly hugging the letters of FERRARI */}
          <div className="absolute inset-0 -inset-x-8 -inset-y-4 bg-[#d40000]/35 blur-2xl rounded-full pointer-events-none -z-10" />
          <h1
            style={{
              textShadow: "0 0 30px rgba(212, 0, 0, 0.75), 0 0 60px rgba(212, 0, 0, 0.35)",
            }}
            className="relative font-display font-black text-5xl sm:text-6xl md:text-7xl lg:text-8xl tracking-[0.2em] sm:tracking-[0.25em] uppercase text-white drop-shadow-2xl leading-none"
          >
            FERRARI
          </h1>
        </div>

        <p className="font-mono-tech text-xs sm:text-sm md:text-base tracking-[0.4em] sm:tracking-[0.5em] text-white/70 uppercase mt-2 mb-8">
          DIGITAL GARAGE
        </p>

        {/* CTA: ENTER GARAGE - Permanently pure black */}
        <button
          onClick={handleEnterGarage}
          style={{ backgroundColor: "#000000", color: "#ffffff" }}
          className="group relative px-8 sm:px-10 py-3.5 sm:py-4 font-mono-tech text-xs sm:text-sm tracking-[0.3em] uppercase !text-white overflow-hidden border border-white/30 hover:border-[#d40000] transition-all duration-500 hover:scale-105 hover:tracking-[0.4em] hover:shadow-[0_0_35px_rgba(212,0,0,0.45)] !bg-black cursor-pointer"
        >
          {/* Animated red corner accents */}
          <span className="absolute top-0 left-0 w-2 h-2 border-t-2 border-l-2 border-[#d40000] transition-all group-hover:w-full group-hover:h-full group-hover:opacity-20" />
          <span className="absolute bottom-0 right-0 w-2 h-2 border-b-2 border-r-2 border-[#d40000] transition-all group-hover:w-full group-hover:h-full group-hover:opacity-20" />

          <span className="relative z-10 flex items-center gap-3">
            ENTER GARAGE
          </span>
        </button>

        {/* Instruction banner shown every time sound is off */}
        {!isSoundOn && (
          <div
            onClick={(e) => {
              e.stopPropagation();
              enableSound();
            }}
            className="mt-4 flex items-center gap-2.5 px-3.5 py-1.5 rounded bg-black/80 backdrop-blur-md border border-[#d40000]/60 text-white font-mono-tech text-[10px] sm:text-[11px] uppercase tracking-wider cursor-pointer hover:border-[#d40000] transition-all shadow-lg animate-pulse"
          >
            <span className="w-2 h-2 rounded-full bg-[#d40000] animate-ping" />
            <span className="text-[#d40000] font-bold">AUDIO OFF:</span>
            <span className="text-white/90">CLICK ANYWHERE OR ENTER GARAGE TO UNMUTE ENGINE SOUND</span>
          </div>
        )}

        {/* Bottom author credit styled identically to FERRARI heading aura & DIGITAL GARAGE text size */}
        <div className="mt-8 flex flex-col sm:flex-row sm:items-center gap-2 font-mono-tech">
          <div className="relative inline-block">
            {/* Red shade aura just like the word ferrari above */}
            <div className="absolute inset-0 -inset-x-6 -inset-y-3 bg-[#d40000]/45 blur-xl rounded-full pointer-events-none -z-10" />
            <span
              style={{
                textShadow: "0 0 25px rgba(212, 0, 0, 0.9), 0 0 50px rgba(212, 0, 0, 0.5)",
              }}
              className="relative font-mono-tech font-black text-xs sm:text-sm md:text-base tracking-[0.4em] sm:tracking-[0.5em] text-white !text-white uppercase drop-shadow-2xl"
            >
              RAHUL BONGU
            </span>
          </div>
          <span className="text-[10px] sm:text-xs tracking-[0.3em] text-white/50 uppercase">
            &middot; ARCHIVE &middot; 15 VEHICLE EDITIONS
          </span>
        </div>
      </div>
    </main>
  );
};
