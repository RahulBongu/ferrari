/**
 * ExplodedSoundManager.ts
 * Ferrari continuous mouse-wheel / mechanical scrolling sound system.
 *
 * Audio Asset:
 * public/assets/audio/ferrari_scroll_mousewheel_continuous.mp3
 *
 * Core Behavior:
 * 1. USER IS NOT SCROLLING:
 *    - Completely silent
 *    - No background ambience
 *    - No looping sound
 * 2. USER STARTS SCROLLING:
 *    - Immediately activates the continuous scroll sound (20–40ms fade-in)
 * 3. USER CONTINUES SCROLLING:
 *    - Keeps the same audio continuously playing (loop = true)
 *    - Never restarts repeatedly; seamless uninterrupted mechanical texture
 * 4. AUDIO INTENSITY FOLLOWS SCROLL VELOCITY:
 *    - Velocity mapped smoothly to volume (0.05 to 0.32) and playbackRate (0.95 to 1.18)
 * 5. PARALLEL WITH EXPLODED ANIMATION:
 *    - Driven by the exact same animation damping progress and velocity as the car
 * 6. STOPPING THE SCROLL:
 *    - Smooth fade-out over 80–140ms when velocity falls below threshold
 * 7. PERFORMANCE & AUTOPLAY:
 *    - Single AudioContext, single preloaded AudioBuffer, zero memory leaks
 *    - Unlocks automatically on initial user interaction (wheel, touch, click, keydown)
 */

import { getAssetUrl } from "../utils/assetUrl";

export class FerrariScrollSound {
  private ctx: AudioContext | null = null;
  private audioBuffer: AudioBuffer | null = null;
  private masterGain: GainNode | null = null;
  private gainNode: GainNode | null = null;
  private filterNode: BiquadFilterNode | null = null;
  private sourceNode: AudioBufferSourceNode | null = null;

  private isMuted: boolean = false;
  private isPlaying: boolean = false;
  private isScrollingActive: boolean = false;
  private isLoading: boolean = false;
  private stopTimer: ReturnType<typeof setTimeout> | null = null;

  constructor() {
    const saved = typeof window !== "undefined" ? sessionStorage.getItem("ferrari_sound_enabled") : null;
    this.isMuted = saved === "false";

    if (typeof window !== "undefined") {
      this.init();
    }
  }

  /**
   * Initializes AudioContext, audio graph, and preloads the continuous audio buffer once.
   */
  public init(): void {
    if (this.ctx || typeof window === "undefined") return;

    try {
      const AudioContextClass =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioContextClass) return;

      this.ctx = new AudioContextClass();

      // Master gain for user sound toggle (SOUND ON / SOUND OFF)
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : 1.0, this.ctx.currentTime);
      this.masterGain.connect(this.ctx.destination);

      // Dynamic gain node for velocity-based volume modulation
      this.gainNode = this.ctx.createGain();
      this.gainNode.gain.setValueAtTime(0, this.ctx.currentTime);

      // Lowpass filter for mechanical notch shaping based on speed
      this.filterNode = this.ctx.createBiquadFilter();
      this.filterNode.type = "lowpass";
      this.filterNode.frequency.setValueAtTime(2600, this.ctx.currentTime);
      this.filterNode.Q.setValueAtTime(1.8, this.ctx.currentTime);

      this.filterNode.connect(this.gainNode);
      this.gainNode.connect(this.masterGain);

      this.preloadAudio();

      // Global unlock listeners across all common browser interaction events
      const unlock = () => {
        if (!this.ctx) {
          this.init();
        }
        if (this.ctx && this.ctx.state === "suspended") {
          this.ctx.resume().catch(() => {});
        }
      };

      const unlockEvents = [
        "wheel",
        "scroll",
        "pointerdown",
        "mousedown",
        "touchstart",
        "touchend",
        "keydown",
      ];
      unlockEvents.forEach((evt) => {
        window.addEventListener(evt, unlock, { passive: true });
      });
    } catch {
      // AudioContext unavailable or restricted
    }
  }

  /**
   * Preloads the continuous mouse-wheel sound asset once into memory.
   */
  private preloadAudio(): void {
    if (!this.ctx || this.audioBuffer || this.isLoading) return;
    this.isLoading = true;

    const audioUrl = getAssetUrl("/assets/audio/ferrari_scroll_mousewheel_continuous.mp3");
    fetch(audioUrl)
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.arrayBuffer();
      })
      .then((arrayBuffer) => {
        if (!this.ctx) return;
        return this.ctx.decodeAudioData(arrayBuffer);
      })
      .then((decoded) => {
        if (decoded) {
          this.audioBuffer = decoded;
          // If user was already scrolling while asset loaded, start immediately
          if (this.isScrollingActive && !this.isPlaying && !this.isMuted) {
            this.startLoop();
          }
        }
      })
      .catch((err) => {
        console.warn("Failed to preload Ferrari scroll audio asset:", err);
      })
      .finally(() => {
        this.isLoading = false;
      });
  }

  /**
   * Guarantees AudioContext is created and running on user interaction.
   */
  public ensureUnlocked(): void {
    if (!this.ctx) {
      this.init();
    }
    if (this.ctx && this.ctx.state === "suspended") {
      this.ctx.resume().catch(() => {});
    }
  }

  /**
   * Starts the continuous looping audio source node with a very short fade-in (20–40 ms).
   * Crucial: Only called when starting; NEVER called repeatedly while already playing.
   */
  private startLoop(): void {
    if (!this.ctx || !this.audioBuffer || this.isPlaying || this.isMuted) return;

    try {
      const source = this.ctx.createBufferSource();
      source.buffer = this.audioBuffer;
      source.loop = true;
      source.loopStart = 0;
      source.loopEnd = this.audioBuffer.duration;

      source.playbackRate.setValueAtTime(1.0, this.ctx.currentTime);
      source.connect(this.filterNode!);

      const t = this.ctx.currentTime;
      this.gainNode!.gain.cancelScheduledValues(t);
      this.gainNode!.gain.setValueAtTime(0.001, t);
      this.gainNode!.gain.setTargetAtTime(0.08, t, 0.03); // Fast 30ms fade-in

      source.start(0);
      this.sourceNode = source;
      this.isPlaying = true;
    } catch {
      // Audio start error handling
    }
  }

  /**
   * Main per-frame update called by the animation loop.
   * Maps velocity and direction directly to volume, playback rate, and filter cutoff.
   */
  public update(
    velocity: number,
    direction: number = 1,
    _progress: number = 0
  ): void {
    this.ensureUnlocked();
    if (!this.ctx || this.isMuted) return;

    const t = this.ctx.currentTime;
    const VELOCITY_THRESHOLD = 0.002;
    const MAX_VELOCITY = 0.08;

    if (velocity > VELOCITY_THRESHOLD) {
      this.isScrollingActive = true;

      // Clear any pending fade-out/stop timer
      if (this.stopTimer !== null) {
        clearTimeout(this.stopTimer);
        this.stopTimer = null;
      }

      // If not currently playing, activate the continuous loop
      if (!this.isPlaying && this.audioBuffer) {
        this.startLoop();
      }

      if (this.isPlaying && this.gainNode && this.sourceNode && this.filterNode) {
        // Normalize velocity (0.0 to 1.0)
        const normalized = Math.min(
          1.0,
          Math.max(0, (velocity - VELOCITY_THRESHOLD) / (MAX_VELOCITY - VELOCITY_THRESHOLD))
        );
        const curve = Math.pow(normalized, 0.85);

        // Map velocity to master volume: 0.05 (very slow) to 0.32 (fast/energetic)
        const targetVol = 0.05 + curve * (0.32 - 0.05);

        // Map velocity to subtle playback rate: 0.95 to 1.18
        let targetRate = 0.95 + curve * 0.23;
        if (direction < 0) {
          targetRate *= 0.97; // Subtle reverse mechanical pitch nuance
        }

        // Map velocity to filter cutoff: 2200Hz to 4600Hz
        const targetCutoff = 2200 + curve * 2400;

        // Smooth non-robotic parameter interpolation
        this.gainNode.gain.cancelScheduledValues(t);
        this.gainNode.gain.setTargetAtTime(targetVol, t, 0.035);

        this.sourceNode.playbackRate.cancelScheduledValues(t);
        this.sourceNode.playbackRate.setTargetAtTime(targetRate, t, 0.045);

        this.filterNode.frequency.cancelScheduledValues(t);
        this.filterNode.frequency.setTargetAtTime(targetCutoff, t, 0.05);
      }
    } else {
      // Velocity below threshold: smoothly fade towards silence
      this.fadeToSilence();
    }
  }

  /**
   * Compatibility adapter for callers providing (progress, velocity).
   */
  public updateScroll(_progress: number, velocity: number): void {
    this.update(velocity, 1, _progress);
  }

  /**
   * Smoothly fades audio out over 80–140ms when scrolling pauses or ends.
   */
  public fadeToSilence(): void {
    if (!this.isPlaying || !this.ctx || !this.gainNode) return;

    const t = this.ctx.currentTime;
    this.gainNode.gain.cancelScheduledValues(t);
    this.gainNode.gain.setTargetAtTime(0, t, 0.065); // 80-140ms fade-out curve

    if (this.stopTimer === null) {
      this.stopTimer = setTimeout(() => {
        this.stopLoop();
        this.stopTimer = null;
      }, 150);
    }
  }

  /**
   * Fully stops and releases the source node when completely silent.
   */
  private stopLoop(): void {
    if (!this.isPlaying) return;
    try {
      if (this.sourceNode) {
        this.sourceNode.stop();
        this.sourceNode.disconnect();
        this.sourceNode = null;
      }
    } catch {}
    this.isPlaying = false;
    this.isScrollingActive = false;
  }

  /**
   * Immediate stop (when leaving the section or navigating away).
   */
  public stop(): void {
    if (this.stopTimer !== null) {
      clearTimeout(this.stopTimer);
      this.stopTimer = null;
    }
    this.fadeToSilence();
  }

  public stopMotion(): void {
    this.stop();
  }

  public startAmbience(): void {
    // Explicitly no background ambience per requirement 1
  }

  public stopAmbience(): void {
    this.stop();
  }

  public componentWhoosh(): void {
    // Explicitly no separate component sounds per creative requirement
  }

  public mechanicalClick(): void {
    // Explicitly no separate click sounds per creative requirement
  }

  public heavyPanelMove(): void {
    // Explicitly no separate component sounds per creative requirement
  }

  public engineReveal(): void {
    // Driven solely by continuous mechanical scroll stream
  }

  public finalSettle(): void {
    // Driven solely by continuous mechanical scroll stream
  }

  /**
   * Sound toggle controller (SOUND ON / SOUND OFF).
   */
  public setSoundEnabled(enabled: boolean): void {
    this.isMuted = !enabled;
    if (typeof window !== "undefined") {
      sessionStorage.setItem("ferrari_sound_enabled", enabled ? "true" : "false");
    }
    if (enabled) {
      this.ensureUnlocked();
    }
    if (this.ctx && this.masterGain) {
      const t = this.ctx.currentTime;
      this.masterGain.gain.cancelScheduledValues(t);
      this.masterGain.gain.setTargetAtTime(enabled ? 1.0 : 0.0, t, 0.04);
    }
    if (!enabled) {
      this.stop();
    }
  }

  public isSoundEnabled(): boolean {
    return !this.isMuted;
  }

  /**
   * Cleanup on component unmount.
   */
  public destroy(): void {
    this.stop();
    if (this.ctx) {
      this.ctx.close().catch(() => {});
      this.ctx = null;
    }
  }
}

export const soundManager = new FerrariScrollSound();
export const explodedSoundManager = soundManager;
export const SoundManager = FerrariScrollSound;
