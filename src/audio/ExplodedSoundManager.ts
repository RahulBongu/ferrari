/**
 * ExplodedSoundManager.ts
 * Continuous mechanical mouse-wheel scroll audio engine for the Ferrari exploded-view animation.
 *
 * Audio Asset:
 * public/assets/audio/uploaded_scroll_sound.mp3 (exact uploaded audio file)
 *
 * Core Audio Behavior:
 * 1. Single Reusable Looping Source:
 *    - Uses the exact uploaded file as a seamless continuous loop (AudioBufferSourceNode with loop = true).
 *    - Zero restarts while scrolling is active; zero overlapping audio instances.
 * 2. Velocity-Driven Dynamic Volume:
 *    - Stationary (no scrolling): 0% (inaudible silence).
 *    - Very slow scrolling: 10–15% (0.10–0.15).
 *    - Normal scrolling: 25–40% (0.25–0.40).
 *    - Fast scrolling: 45–60% (0.45–0.60).
 *    - Very fast scrolling: 60–70% maximum (0.60–0.70).
 * 3. Tactile Response & Envelope:
 *    - 20–40ms smooth micro-fade on scroll start.
 *    - Smooth continuous parameter interpolation during scrolling.
 *    - 80–140ms fast fade-out to complete silence when scrolling pauses.
 * 4. Web Audio Lifecycle & Autoplay:
 *    - Preloads and decodes the audio asset once.
 *    - Automatically unlocks AudioContext on first interaction (wheel, scroll, touch, mouse).
 *    - Single clean master output chain (source -> gainNode -> masterGain -> destination).
 */

import { getAssetUrl } from "../utils/assetUrl";

export class FerrariScrollSound {
  private ctx: AudioContext | null = null;
  private audioBuffer: AudioBuffer | null = null;
  private masterGain: GainNode | null = null;
  private gainNode: GainNode | null = null;
  private sourceNode: AudioBufferSourceNode | null = null;

  private isMuted: boolean = false;
  private isPlaying: boolean = false;
  private stopTimer: ReturnType<typeof setTimeout> | null = null;
  private isLoading: boolean = false;

  // Velocity threshold below which the user is considered stationary
  private readonly VELOCITY_THRESHOLD = 0.003;

  constructor() {
    const saved = typeof window !== "undefined" ? sessionStorage.getItem("ferrari_sound_enabled") : null;
    this.isMuted = saved === "false";

    if (typeof window !== "undefined") {
      this.init();
    }
  }

  /**
   * Initializes AudioContext, master gain node, and attaches global interaction unlock handlers.
   */
  public init(): void {
    if (this.ctx || typeof window === "undefined") return;

    try {
      const AudioContextClass =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioContextClass) return;

      this.ctx = new AudioContextClass();

      // Master gain for user mute / unmute toggle
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : 1.0, this.ctx.currentTime);

      // Velocity-driven smooth gain node
      this.gainNode = this.ctx.createGain();
      this.gainNode.gain.setValueAtTime(0, this.ctx.currentTime);

      // Clean, uncolored signal path preserving the uploaded audio asset's exact acoustics
      this.gainNode.connect(this.masterGain);
      this.masterGain.connect(this.ctx.destination);

      this.preloadAudio();

      // Transparently unlock AudioContext on any legitimate user interaction
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
      // AudioContext unavailable or restricted in this environment
    }
  }

  /**
   * Preloads and decodes the uploaded audio asset once.
   */
  private preloadAudio(): void {
    if (!this.ctx || this.audioBuffer || this.isLoading) return;
    this.isLoading = true;

    // Use the uploaded audio asset file
    const audioUrl = getAssetUrl("/assets/audio/uploaded_scroll_sound.mp3");

    fetch(audioUrl)
      .then((res) => {
        if (!res.ok) {
          // Fallback to a.mp3 (identical file copy) if needed
          return fetch(getAssetUrl("/assets/audio/a.mp3")).then((r) => r.arrayBuffer());
        }
        return res.arrayBuffer();
      })
      .then((arrayBuffer) => {
        if (!this.ctx) return;
        return this.ctx.decodeAudioData(arrayBuffer);
      })
      .then((decoded) => {
        if (decoded && this.ctx) {
          this.audioBuffer = decoded;
        }
      })
      .catch((err) => {
        console.warn("Failed to preload uploaded scroll sound:", err);
      })
      .finally(() => {
        this.isLoading = false;
      });
  }

  /**
   * Guarantees the AudioContext is active and running.
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
   * Starts the continuous seamless looping audio source node.
   * Ensures exactly one source node exists at any time.
   */
  private startLoop(): void {
    if (!this.ctx || !this.audioBuffer || !this.gainNode) return;

    // Guard: never create multiple or overlapping instances
    if (this.isPlaying && this.sourceNode) return;

    try {
      // Clean up previous dead node if any
      if (this.sourceNode) {
        try {
          this.sourceNode.stop();
          this.sourceNode.disconnect();
        } catch {}
        this.sourceNode = null;
      }

      const source = this.ctx.createBufferSource();
      source.buffer = this.audioBuffer;
      source.loop = true; // Seamless gapless loop
      source.connect(this.gainNode);

      const t = this.ctx.currentTime;
      // Start with near-zero gain for a 20–40ms smooth micro-fade
      this.gainNode.gain.cancelScheduledValues(t);
      this.gainNode.gain.setValueAtTime(0.0001, t);

      source.start(0);

      this.sourceNode = source;
      this.isPlaying = true;

      source.onended = () => {
        if (this.sourceNode === source) {
          this.isPlaying = false;
          this.sourceNode = null;
        }
      };
    } catch {
      // Audio start error handling
    }
  }

  /**
   * Updates the audio engine on every animation/scroll frame.
   *
   * @param velocity Current scroll velocity derived from Ferrari animation progress
   * @param _direction Scroll direction (1 = forward, -1 = reverse)
   * @param _progress Current animation progress (0.0 to 1.0)
   */
  public update(velocity: number, _direction: number = 1, _progress: number = 0): void {
    this.ensureUnlocked();
    if (!this.ctx || this.isMuted || !this.audioBuffer) return;

    const t = this.ctx.currentTime;

    if (velocity > this.VELOCITY_THRESHOLD) {
      // Cancel any pending stop/fade-out timer
      if (this.stopTimer !== null) {
        clearTimeout(this.stopTimer);
        this.stopTimer = null;
      }

      // If not currently playing, start the seamless loop immediately
      if (!this.isPlaying || !this.sourceNode) {
        this.startLoop();
      }

      if (this.isPlaying && this.gainNode && this.sourceNode) {
        /**
         * Velocity to Volume Curve (Strictly adhering to specifications):
         * - No scrolling: 0%
         * - Very slow: 10–15% (0.10–0.15)
         * - Normal: 25–40% (0.25–0.40)
         * - Fast: 45–60% (0.45–0.60)
         * - Very fast: 60–70% maximum (0.60–0.70)
         */
        const normalized = Math.min(
          1.0,
          Math.max(0, (velocity - this.VELOCITY_THRESHOLD) / 0.45)
        );
        const curve = Math.pow(normalized, 0.65); // Natural perceptual curve

        // Volume range: 0.12 (very slow crawl) to 0.68 (very fast flick)
        const targetVol = 0.12 + curve * (0.68 - 0.12);

        // Subtle mechanical playback rate nuance: 0.96 (slow) to 1.12 (very fast)
        const targetRate = 0.96 + curve * 0.16;

        // Smooth continuous interpolation avoiding any abrupt jumps
        this.gainNode.gain.cancelScheduledValues(t);
        this.gainNode.gain.setTargetAtTime(targetVol, t, 0.035);

        this.sourceNode.playbackRate.cancelScheduledValues(t);
        this.sourceNode.playbackRate.setTargetAtTime(targetRate, t, 0.045);
      }
    } else {
      // User has paused or stopped scrolling: smoothly fade out
      this.fadeToSilence();
    }
  }

  /**
   * Compatibility wrapper for callers providing (progress, velocity).
   */
  public updateScroll(progress: number, velocity: number): void {
    this.update(velocity, 1, progress);
  }

  /**
   * Smoothly fades the audio out over 80–140ms when scrolling pauses, then stops the source.
   */
  public fadeToSilence(): void {
    if (!this.isPlaying || !this.ctx || !this.gainNode) return;

    const t = this.ctx.currentTime;
    this.gainNode.gain.cancelScheduledValues(t);
    // Smooth 80–120ms fade-out curve (reaches <0.001 within ~100ms)
    this.gainNode.gain.setTargetAtTime(0, t, 0.045);

    if (this.stopTimer === null) {
      this.stopTimer = setTimeout(() => {
        this.stopLoop();
        this.stopTimer = null;
      }, 130);
    }
  }

  /**
   * Fully stops and releases the source node once completely silent.
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
  }

  /**
   * Immediate stop when navigating away or leaving the exploded-view section.
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

  // Pure no-ops: strictly prevent any extra whooshes, clicks, ambient beds, or parts audio
  public startAmbience(): void {}
  public stopAmbience(): void {}
  public componentWhoosh(): void {}
  public mechanicalClick(): void {}
  public heavyPanelMove(): void {}
  public engineReveal(): void {}
  public finalSettle(): void {}

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
      this.masterGain.gain.setTargetAtTime(enabled ? 1.0 : 0.0, t, 0.03);
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
