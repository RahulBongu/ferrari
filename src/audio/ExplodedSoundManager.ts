/**
 * ExplodedSoundManager.ts
 * Parallel audio synchronization engine for the Ferrari exploded-view scrolling experience.
 *
 * Audio Asset:
 * public/assets/audio/a.mp3 (3.456s technical exploded-view sound effect)
 *
 * Parallel Synchronization:
 * 1. Progress Alignment:
 *    - Exploded view progress (0.0 to 1.0) maps directly to the audio timeline (0.0s to 3.456s).
 * 2. Velocity-Mapped Playback Rate:
 *    - Scroll speed smoothly modulates the playbackRate so audio progress tracks the physical
 *      frame rendering in real time.
 * 3. Bidirectional Playback:
 *    - Scrolling down (exploding): plays forward along the audio timeline.
 *    - Scrolling up (reassembling): plays the reversed audio buffer parallel to reassembly.
 * 4. Silence on Rest:
 *    - When the user stops scrolling, the audio smoothly fades to zero and pauses.
 *    - When scrolling resumes, playback continues seamlessly from the current progress offset.
 * 5. Master Output Processing:
 *    - Low-shelf bass boost + studio dynamics compressor for punchy, clear automotive acoustics.
 */

import { getAssetUrl } from "../utils/assetUrl";

export class FerrariScrollSound {
  private ctx: AudioContext | null = null;
  private audioBufferForward: AudioBuffer | null = null;
  private audioBufferReverse: AudioBuffer | null = null;

  private masterGain: GainNode | null = null;
  private gainNode: GainNode | null = null;
  private bassFilter: BiquadFilterNode | null = null;
  private compressor: DynamicsCompressorNode | null = null;
  private sourceNode: AudioBufferSourceNode | null = null;

  private isMuted: boolean = false;
  private isPlaying: boolean = false;
  private currentDirection: number = 1; // 1 = forward (scroll down), -1 = reverse (scroll up)
  private playheadOffset: number = 0;   // In audio seconds (0.0 to duration)
  private playStartTimeCtx: number = 0;  // ctx.currentTime when source started
  private stopTimer: ReturnType<typeof setTimeout> | null = null;
  private isLoading: boolean = false;

  private readonly DURATION: number = 3.456; // a.mp3 duration in seconds

  constructor() {
    const saved = typeof window !== "undefined" ? sessionStorage.getItem("ferrari_sound_enabled") : null;
    this.isMuted = saved === "false";

    if (typeof window !== "undefined") {
      this.init();
    }
  }

  /**
   * Initializes AudioContext, mastering chain, and decodes both forward and reverse buffers.
   */
  public init(): void {
    if (this.ctx || typeof window === "undefined") return;

    try {
      const AudioContextClass =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioContextClass) return;

      this.ctx = new AudioContextClass();

      // Master output gain
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : 1.0, this.ctx.currentTime);

      // Dedicated Analog Bass Boost Shelf (+4.5dB at 115Hz for punchy mechanical depth)
      this.bassFilter = this.ctx.createBiquadFilter();
      this.bassFilter.type = "lowshelf";
      this.bassFilter.frequency.value = 115;
      this.bassFilter.gain.value = 4.5;

      // Studio Dynamics Compressor (prevents clipping, thickens bass, maximizes clarity)
      this.compressor = this.ctx.createDynamicsCompressor();
      this.compressor.threshold.setValueAtTime(-14, this.ctx.currentTime);
      this.compressor.knee.setValueAtTime(10, this.ctx.currentTime);
      this.compressor.ratio.setValueAtTime(4.0, this.ctx.currentTime);
      this.compressor.attack.setValueAtTime(0.003, this.ctx.currentTime);
      this.compressor.release.setValueAtTime(0.20, this.ctx.currentTime);

      // Velocity-modulated gain node
      this.gainNode = this.ctx.createGain();
      this.gainNode.gain.setValueAtTime(0, this.ctx.currentTime);

      // Node graph: source -> gainNode -> bassFilter -> compressor -> masterGain -> destination
      this.gainNode.connect(this.bassFilter);
      this.bassFilter.connect(this.compressor);
      this.compressor.connect(this.masterGain);
      this.masterGain.connect(this.ctx.destination);

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
   * Preloads a.mp3 once and builds the reverse buffer in memory for bidirectional scrubbing.
   */
  private preloadAudio(): void {
    if (!this.ctx || this.audioBufferForward || this.isLoading) return;
    this.isLoading = true;

    const audioUrl = getAssetUrl("/assets/audio/a.mp3");
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
        if (decoded && this.ctx) {
          this.audioBufferForward = decoded;
          this.audioBufferReverse = this.createReversedBuffer(this.ctx, decoded);
        }
      })
      .catch((err) => {
        console.warn("Failed to preload Ferrari exploded audio a.mp3:", err);
      })
      .finally(() => {
        this.isLoading = false;
      });
  }

  /**
   * Creates an exact reversed audio buffer for seamless reverse scrolling (reassembly).
   */
  private createReversedBuffer(ctx: AudioContext, buffer: AudioBuffer): AudioBuffer {
    const reversed = ctx.createBuffer(
      buffer.numberOfChannels,
      buffer.length,
      buffer.sampleRate
    );
    for (let c = 0; c < buffer.numberOfChannels; c++) {
      const src = buffer.getChannelData(c);
      const dest = reversed.getChannelData(c);
      const len = buffer.length;
      for (let i = 0, j = len - 1; i < len; i++, j--) {
        dest[i] = src[j];
      }
    }
    return reversed;
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
   * Main per-frame synchronization method:
   * Keeps audio playback position and playbackRate in exact parallel with scroll progress and velocity.
   */
  public update(
    velocity: number,
    direction: number = 1,
    progress: number = 0
  ): void {
    this.ensureUnlocked();
    if (!this.ctx || this.isMuted || !this.audioBufferForward) return;

    const t = this.ctx.currentTime;
    const VELOCITY_THRESHOLD = 0.002;
    const clampedProgress = Math.max(0, Math.min(1, progress));
    const targetAudioTime = clampedProgress * this.DURATION;
    const dir = direction >= 0 ? 1 : -1;

    if (velocity > VELOCITY_THRESHOLD) {
      // Clear pending stop timer
      if (this.stopTimer !== null) {
        clearTimeout(this.stopTimer);
        this.stopTimer = null;
      }

      // Calculate the current playhead time of the active source
      let currentAudioPosition = this.playheadOffset;
      if (this.isPlaying && this.sourceNode) {
        const elapsed = (t - this.playStartTimeCtx) * (this.sourceNode.playbackRate.value || 1);
        currentAudioPosition =
          this.currentDirection === 1
            ? this.playheadOffset + elapsed
            : this.playheadOffset - elapsed;
      }

      const drift = Math.abs(currentAudioPosition - targetAudioTime);
      const directionChanged = dir !== this.currentDirection;

      // If not playing, or direction changed, or drift is significant (>0.18s), start/realign node
      if (!this.isPlaying || directionChanged || drift > 0.18) {
        this.startAt(targetAudioTime, dir);
      }

      if (this.isPlaying && this.sourceNode && this.gainNode) {
        // Natural speed mapping: velocity is (deltaProgress / dt), progress speed * DURATION = rate
        // Typical scroll velocity is ~0.015 - 0.06; map smoothly between 0.6x and 2.2x
        const rawRate = (velocity * this.DURATION) / 0.12;
        // Subtle drift correction to pull playhead towards exact target time
        const syncCorrection = (targetAudioTime - currentAudioPosition) * (dir === 1 ? 1.5 : -1.5);
        const targetRate = Math.max(0.55, Math.min(2.4, rawRate + syncCorrection));

        // Volume scales naturally with velocity (0.18 on slow scroll up to 0.85 on fast scroll)
        const velNorm = Math.min(1.0, (velocity - VELOCITY_THRESHOLD) / 0.06);
        const targetVolume = 0.18 + Math.pow(velNorm, 0.75) * (0.85 - 0.18);

        this.sourceNode.playbackRate.cancelScheduledValues(t);
        this.sourceNode.playbackRate.setTargetAtTime(targetRate, t, 0.04);

        this.gainNode.gain.cancelScheduledValues(t);
        this.gainNode.gain.setTargetAtTime(targetVolume, t, 0.035);
      }
    } else {
      // User has stopped scrolling: fade out smoothly
      this.fadeToSilence();
    }
  }

  /**
   * Starts playback from a specific audio offset in seconds for a given direction.
   */
  private startAt(offsetSeconds: number, direction: number): void {
    if (!this.ctx || !this.gainNode) return;

    // Stop current source if active
    if (this.sourceNode) {
      try {
        this.sourceNode.stop();
        this.sourceNode.disconnect();
      } catch {}
      this.sourceNode = null;
    }

    const isForward = direction === 1;
    const buffer = isForward ? this.audioBufferForward : this.audioBufferReverse;
    if (!buffer) return;

    try {
      const source = this.ctx.createBufferSource();
      source.buffer = buffer;

      // For forward buffer: offset is offsetSeconds
      // For reverse buffer: offset is (DURATION - offsetSeconds)
      const bufferOffset = isForward
        ? Math.max(0, Math.min(this.DURATION - 0.02, offsetSeconds))
        : Math.max(0, Math.min(this.DURATION - 0.02, this.DURATION - offsetSeconds));

      source.connect(this.gainNode);

      const t = this.ctx.currentTime;
      // Smooth micro-fade to eliminate any pop or crackle (20ms)
      this.gainNode.gain.cancelScheduledValues(t);
      this.gainNode.gain.setValueAtTime(0.001, t);
      this.gainNode.gain.setTargetAtTime(0.35, t, 0.02);

      source.start(0, bufferOffset);

      this.sourceNode = source;
      this.isPlaying = true;
      this.currentDirection = direction;
      this.playheadOffset = offsetSeconds;
      this.playStartTimeCtx = t;

      // Auto-stop when buffer finishes
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
   * Compatibility adapter for callers providing (progress, velocity).
   */
  public updateScroll(progress: number, velocity: number): void {
    this.update(velocity, 1, progress);
  }

  /**
   * Smoothly fades audio towards zero over 50–90ms when user pauses scrolling.
   */
  public fadeToSilence(): void {
    if (!this.isPlaying || !this.ctx || !this.gainNode) return;

    const t = this.ctx.currentTime;
    this.gainNode.gain.cancelScheduledValues(t);
    this.gainNode.gain.setTargetAtTime(0, t, 0.05);

    if (this.stopTimer === null) {
      this.stopTimer = setTimeout(() => {
        this.stopLoop();
        this.stopTimer = null;
      }, 110);
    }
  }

  /**
   * Stops the active source node once fully silent.
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
   * Immediate stop when user leaves the section.
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
    // Explicitly no background ambience
  }

  public stopAmbience(): void {
    this.stop();
  }

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
