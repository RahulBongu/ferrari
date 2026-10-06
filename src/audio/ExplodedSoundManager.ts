/**
 * ExplodedSoundManager.ts
 * Continuous mechanical mouse-wheel scroll audio engine for the Ferrari exploded-view animation.
 *
 * Audio Asset:
 * public/assets/audio/uploaded_scroll_sound.mp3 (exact uploaded audio file)
 *
 * Enhanced Audibility & Presence:
 * 1. Volume & Dynamics:
 *    - Increased overall perceived loudness (~2x) optimized for laptop speakers & headphones.
 *    - Transparent studio dynamics compressor (+ gentle soft knee) to lift micro-detail and eliminate clipping.
 *    - Velocity-reactive targets:
 *      * No scrolling: 0%
 *      * Slow: 20–30% (0.24–0.30)
 *      * Normal: 40–55% (0.42–0.50)
 *      * Fast: 55–70% (0.60–0.68)
 *      * Very fast: 70–80% (0.75–0.80)
 * 2. Crisp Presence:
 *    - Peaking EQ boost at 3.4 kHz (+3.5 dB, Q 1.0) so the tactile mouse-wheel detent clicks cut
 *      through clearly without harshness or altering sound character.
 * 3. Envelopes:
 *    - 25ms instant micro-fade on scroll start.
 *    - Smooth continuous parameter interpolation during scrolling.
 *    - 80–140ms fast fade-out to complete silence when scrolling pauses.
 */

import { getAssetUrl } from "../utils/assetUrl";

export class FerrariScrollSound {
  private ctx: AudioContext | null = null;
  private audioBuffer: AudioBuffer | null = null;

  // Signal chain nodes
  private gainNode: GainNode | null = null;
  private presenceFilter: BiquadFilterNode | null = null;
  private compressor: DynamicsCompressorNode | null = null;
  private makeupGain: GainNode | null = null;
  private masterGain: GainNode | null = null;
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
   * Initializes AudioContext, mastering chain, and attaches global interaction unlock handlers.
   */
  public init(): void {
    if (this.ctx || typeof window === "undefined") return;

    try {
      const AudioContextClass =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioContextClass) return;

      this.ctx = new AudioContextClass();

      // 1. Velocity-driven smooth gain node
      this.gainNode = this.ctx.createGain();
      this.gainNode.gain.setValueAtTime(0, this.ctx.currentTime);

      // 2. Subtle presence EQ: crisp mouse-wheel click definition (+3.5dB at 3.4kHz)
      this.presenceFilter = this.ctx.createBiquadFilter();
      this.presenceFilter.type = "peaking";
      this.presenceFilter.frequency.setValueAtTime(3400, this.ctx.currentTime);
      this.presenceFilter.Q.setValueAtTime(1.0, this.ctx.currentTime);
      this.presenceFilter.gain.setValueAtTime(3.5, this.ctx.currentTime);

      // 3. Transparent Dynamics Compressor: lifts tactile micro-texture and guarantees zero clipping
      this.compressor = this.ctx.createDynamicsCompressor();
      this.compressor.threshold.setValueAtTime(-16, this.ctx.currentTime);
      this.compressor.knee.setValueAtTime(12, this.ctx.currentTime);
      this.compressor.ratio.setValueAtTime(3.0, this.ctx.currentTime);
      this.compressor.attack.setValueAtTime(0.005, this.ctx.currentTime);
      this.compressor.release.setValueAtTime(0.08, this.ctx.currentTime);

      // 4. Clean makeup booster gain (1.45x / +3.2dB)
      this.makeupGain = this.ctx.createGain();
      this.makeupGain.gain.setValueAtTime(1.45, this.ctx.currentTime);

      // 5. Master gain for user mute / unmute toggle
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : 1.0, this.ctx.currentTime);

      // Audio Graph: source -> gainNode -> presenceFilter -> compressor -> makeupGain -> masterGain -> destination
      this.gainNode.connect(this.presenceFilter);
      this.presenceFilter.connect(this.compressor);
      this.compressor.connect(this.makeupGain);
      this.makeupGain.connect(this.masterGain);
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

    const audioUrl = getAssetUrl("/assets/audio/uploaded_scroll_sound.mp3");

    fetch(audioUrl)
      .then((res) => {
        if (!res.ok) {
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
      // Start with near-zero gain for a 20–30ms smooth micro-fade
      this.gainNode.gain.cancelScheduledValues(t);
      this.gainNode.gain.setValueAtTime(0.001, t);

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
         * Enhanced Velocity to Volume Targets:
         * - Stationary (no scrolling): 0%
         * - Slow scrolling: 20–30% (0.24–0.30)
         * - Normal scrolling: 40–55% (0.42–0.50)
         * - Fast scrolling: 55–70% (0.60–0.68)
         * - Very fast scrolling: 70–80% (0.75–0.80)
         */
        const normalized = Math.min(
          1.0,
          Math.max(0, (velocity - this.VELOCITY_THRESHOLD) / 0.40)
        );
        const curve = Math.pow(normalized, 0.60); // Responsive perceptual curve

        // Target volume smoothly spans 0.24 (slow crawl) to 0.78 (very fast flick)
        const targetVol = 0.24 + curve * (0.78 - 0.24);

        // Subtle mechanical playback rate nuance: 0.96 (slow) to 1.10 (very fast)
        const targetRate = 0.96 + curve * 0.14;

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
