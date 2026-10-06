/**
 * ExplodedSoundManager.ts
 * Continuous mechanical mouse-wheel scroll audio engine for the Ferrari exploded-view animation.
 *
 * Audio Asset:
 * public/assets/audio/uploaded_scroll_sound.mp3 (exact uploaded audio file)
 *
 * Core Audio Behavior:
 * 1. STRICT ACTIVE SCROLL SYNCHRONIZATION:
 *    - Sound is active ONLY during physical scrolling (mouse wheel, trackpad, touch drag).
 *    - Instant 20–30ms fade-in when scrolling begins.
 *    - Continuous uninterrupted looping while scrolling is sustained.
 *    - Volume smoothly scales with scroll velocity (quiet on slow, crisp and full on fast).
 * 2. ABSOLUTE SILENCE ON STOP:
 *    - When scrolling ceases (no scroll delta for 50–80ms), volume immediately ramps to zero
 *      and the audio node is completely stopped and disconnected.
 *    - ZERO background idling, zero lingering noise, zero mouse-hover or animation-loop triggers.
 * 3. Mastering & Presence:
 *    - Crisp presence peaking EQ (+3.5 dB at 3.4 kHz) brings out tactile mouse detents.
 *    - Transparent dynamics compressor for rich body and anti-clipping protection.
 *    - Clean post-compressor makeup gain (+3.2 dB) ensuring clarity on laptop speakers and headphones.
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
  private isLoading: boolean = false;
  private stopTimeoutId: ReturnType<typeof setTimeout> | null = null;

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

      // 1. Velocity-driven dynamic gain node
      this.gainNode = this.ctx.createGain();
      this.gainNode.gain.setValueAtTime(0, this.ctx.currentTime);

      // 2. Crisp Presence EQ: brings out mechanical detent clicks (+3.5dB at 3.4kHz)
      this.presenceFilter = this.ctx.createBiquadFilter();
      this.presenceFilter.type = "peaking";
      this.presenceFilter.frequency.setValueAtTime(3400, this.ctx.currentTime);
      this.presenceFilter.Q.setValueAtTime(1.0, this.ctx.currentTime);
      this.presenceFilter.gain.setValueAtTime(3.5, this.ctx.currentTime);

      // 3. Transparent Dynamics Compressor: prevents digital clipping and adds body
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

      // Unlock AudioContext on user interaction
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
      // AudioContext unavailable
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
  private startLoop(initialVolume: number): void {
    if (!this.ctx || !this.audioBuffer || !this.gainNode) return;

    // Never create duplicate or overlapping nodes
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
      source.loop = true; // Seamless loop
      source.connect(this.gainNode);

      const t = this.ctx.currentTime;
      // Immediate 20-30ms fade-in to target volume
      this.gainNode.gain.cancelScheduledValues(t);
      this.gainNode.gain.setValueAtTime(0.001, t);
      this.gainNode.gain.linearRampToValueAtTime(initialVolume, t + 0.025);

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
   * Called strictly when ACTIVE SCROLLING occurs.
   *
   * @param normalizedVelocity Normalized scroll velocity (0.0 to 1.0)
   * @param _direction Scroll direction (1 = forward, -1 = reverse)
   */
  public onScroll(normalizedVelocity: number, _direction: number = 1): void {
    this.ensureUnlocked();
    if (!this.ctx || this.isMuted || !this.audioBuffer) return;

    // Clear any pending stop timeout
    if (this.stopTimeoutId !== null) {
      clearTimeout(this.stopTimeoutId);
      this.stopTimeoutId = null;
    }

    const t = this.ctx.currentTime;
    const norm = Math.min(1.0, Math.max(0, normalizedVelocity));
    const curve = Math.pow(norm, 0.60);

    /**
     * Volume targets strictly matching specifications:
     * - Slow: 20–30% (0.24–0.30)
     * - Normal: 40–55% (0.42–0.50)
     * - Fast: 55–70% (0.60–0.68)
     * - Very fast: 70–80% (0.75–0.80)
     */
    const targetVol = 0.24 + curve * (0.78 - 0.24);
    const targetRate = 0.96 + curve * 0.14;

    if (!this.isPlaying || !this.sourceNode) {
      this.startLoop(targetVol);
    } else {
      if (this.gainNode) {
        this.gainNode.gain.cancelScheduledValues(t);
        this.gainNode.gain.setTargetAtTime(targetVol, t, 0.025);
      }
      if (this.sourceNode) {
        this.sourceNode.playbackRate.cancelScheduledValues(t);
        this.sourceNode.playbackRate.setTargetAtTime(targetRate, t, 0.035);
      }
    }
  }

  /**
   * Called immediately when user stops scrolling.
   * Brings volume to 0 and stops/releases audio source for absolute silence.
   */
  public onScrollStop(): void {
    if (!this.isPlaying) return;

    if (this.stopTimeoutId !== null) {
      clearTimeout(this.stopTimeoutId);
      this.stopTimeoutId = null;
    }

    if (this.ctx && this.gainNode) {
      const t = this.ctx.currentTime;
      this.gainNode.gain.cancelScheduledValues(t);
      // Fast 20ms micro-ramp down to 0 to eliminate pops while stopping immediately
      this.gainNode.gain.setValueAtTime(this.gainNode.gain.value, t);
      this.gainNode.gain.linearRampToValueAtTime(0, t + 0.02);
    }

    this.stopTimeoutId = setTimeout(() => {
      try {
        if (this.sourceNode) {
          this.sourceNode.stop();
          this.sourceNode.disconnect();
          this.sourceNode = null;
        }
      } catch {}
      this.isPlaying = false;
      this.stopTimeoutId = null;
    }, 25);
  }

  /**
   * Compatibility adapter: maps (velocity, direction, progress) to onScroll/onScrollStop.
   */
  public update(velocity: number, direction: number = 1, _progress: number = 0): void {
    if (velocity > 0.003) {
      const norm = Math.min(1.0, Math.max(0, (velocity - 0.003) / 0.40));
      this.onScroll(norm, direction);
    } else {
      this.onScrollStop();
    }
  }

  public updateScroll(progress: number, velocity: number): void {
    this.update(velocity, 1, progress);
  }

  public fadeToSilence(): void {
    this.onScrollStop();
  }

  public stop(): void {
    this.onScrollStop();
  }

  public stopMotion(): void {
    this.onScrollStop();
  }

  // Pure no-ops: strictly prevent any extra audio triggers
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
      this.masterGain.gain.setTargetAtTime(enabled ? 1.0 : 0.0, t, 0.02);
    }
    if (!enabled) {
      this.onScrollStop();
    }
  }

  public isSoundEnabled(): boolean {
    return !this.isMuted;
  }

  /**
   * Cleanup on component unmount.
   */
  public destroy(): void {
    this.onScrollStop();
    if (this.ctx) {
      this.ctx.close().catch(() => {});
      this.ctx = null;
    }
  }
}

export const soundManager = new FerrariScrollSound();
export const explodedSoundManager = soundManager;
export const SoundManager = FerrariScrollSound;
