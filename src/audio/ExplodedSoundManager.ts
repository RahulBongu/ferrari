/**
 * ExplodedSoundManager.ts
 * Premium cinematic Web Audio API sound-design engine for the Ferrari exploded-view scrolling experience.
 *
 * Sound design direction:
 * 1. Global subtle low-frequency mechanical ambience (5-10% level).
 * 2. Velocity-mapped aerodynamic whoosh & servo sweeps.
 * 3. Discrete component whooshes (small vs heavy panels).
 * 4. Precision metallic locks and titanium clicks on milestone docking.
 * 5. Deep, restrained high-performance V12 engine mechanical reveal (35-45% level).
 * 6. Final exploded configuration settling sequence with cinematic sub-bass tail.
 * 7. Anti-spam hysteresis, velocity gating, and session-persisted sound toggle.
 */

class ExplodedSoundManager {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private isMuted: boolean = false;

  // Ambience Layer
  private ambienceOsc1: OscillatorNode | null = null;
  private ambienceOsc2: OscillatorNode | null = null;
  private ambienceGain: GainNode | null = null;
  private isAmbienceActive: boolean = false;

  // Velocity-driven Continuous Motion Layer
  private noiseBuffer: AudioBuffer | null = null;
  private motionSource: AudioBufferSourceNode | null = null;
  private motionFilter: BiquadFilterNode | null = null;
  private motionGain: GainNode | null = null;
  private servoOsc: OscillatorNode | null = null;
  private servoGain: GainNode | null = null;

  // Engine Reveal Layer (Phase 4: 6.3L V12 & HY-KERS)
  private engineOsc1: OscillatorNode | null = null;
  private engineOsc2: OscillatorNode | null = null;
  private engineFilter: BiquadFilterNode | null = null;
  private engineGain: GainNode | null = null;
  private isEngineActive: boolean = false;

  // Milestone tracking with hysteresis
  private lastTriggerTime: number = 0;
  private milestoneStates: { [key: string]: boolean } = {
    aeroCanards: false,   // ~Frame 28  (0.12)
    wheelAssemblies: false, // ~Frame 68  (0.28)
    butterflyDoors: false,  // ~Frame 116 (0.48)
    engineReveal: false,    // ~Frame 162 (0.68)
    finalSettle: false,     // ~Frame 226 (0.94)
  };

  constructor() {
    const saved = typeof window !== "undefined" ? sessionStorage.getItem("ferrari_sound_enabled") : null;
    this.isMuted = saved === "false";
  }

  /**
   * Initializes AudioContext and generates procedural synthesis buffers.
   */
  public init(): void {
    if (this.ctx || typeof window === "undefined") return;

    try {
      const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioContextClass) return;

      this.ctx = new AudioContextClass();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : 1, this.ctx.currentTime);
      this.masterGain.connect(this.ctx.destination);

      this.createNoiseBuffer();
      this.setupGlobalAmbience();
      this.setupMotionLayer();
      this.setupEngineLayer();

      // Listen for initial user gesture to unlock AudioContext
      const unlock = () => {
        if (!this.ctx) return;
        if (this.ctx.state === "suspended") {
          this.ctx.resume().catch(() => {});
        }
        window.removeEventListener("click", unlock);
        window.removeEventListener("touchstart", unlock);
        window.removeEventListener("wheel", unlock);
      };

      window.addEventListener("click", unlock, { passive: true, once: true });
      window.addEventListener("touchstart", unlock, { passive: true, once: true });
      window.addEventListener("wheel", unlock, { passive: true, once: true });
    } catch {
      // AudioContext unavailable or restricted
    }
  }

  public ensureUnlocked(): void {
    if (!this.ctx) {
      this.init();
    }
    if (this.ctx && this.ctx.state === "suspended") {
      this.ctx.resume().catch(() => {});
    }
  }

  public setSoundEnabled(enabled: boolean): void {
    this.isMuted = !enabled;
    if (typeof window !== "undefined") {
      sessionStorage.setItem("ferrari_sound_enabled", enabled ? "true" : "false");
    }
    if (this.ctx && this.masterGain) {
      const t = this.ctx.currentTime;
      this.masterGain.gain.cancelScheduledValues(t);
      this.masterGain.gain.setTargetAtTime(enabled ? 1.0 : 0.0, t, 0.04);
    }
    if (enabled) {
      this.ensureUnlocked();
    }
  }

  public isSoundEnabled(): boolean {
    return !this.isMuted;
  }

  /**
   * Generates a 2-second looped pink/brownian noise buffer for velvety aerodynamic whooshes.
   */
  private createNoiseBuffer(): void {
    if (!this.ctx) return;
    const sampleRate = this.ctx.sampleRate;
    const bufferSize = sampleRate * 2;
    const buffer = this.ctx.createBuffer(1, bufferSize, sampleRate);
    const data = buffer.getChannelData(0);

    let lastOut = 0.0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      // Brown/Pink filtration for smooth warm airflow texture
      lastOut = (lastOut + 0.02 * white) / 1.02;
      data[i] = lastOut * 3.5;
    }
    this.noiseBuffer = buffer;
  }

  /**
   * Global Ambience: 52Hz sine + 104Hz triangle filtered at 110Hz. (Level: ~6-8%)
   */
  private setupGlobalAmbience(): void {
    if (!this.ctx || !this.masterGain) return;

    const osc1 = this.ctx.createOscillator();
    const osc2 = this.ctx.createOscillator();
    const filter = this.ctx.createBiquadFilter();
    const gain = this.ctx.createGain();

    osc1.type = "sine";
    osc1.frequency.value = 52;

    osc2.type = "triangle";
    osc2.frequency.value = 104;

    filter.type = "lowpass";
    filter.frequency.value = 110;
    filter.Q.value = 1.2;

    gain.gain.setValueAtTime(0, this.ctx.currentTime);

    osc1.connect(filter);
    osc2.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);

    osc1.start();
    osc2.start();

    this.ambienceOsc1 = osc1;
    this.ambienceOsc2 = osc2;
    this.ambienceGain = gain;
  }

  /**
   * Continuous Motion Layer: dynamic bandpass noise + subtle servo oscillator.
   */
  private setupMotionLayer(): void {
    if (!this.ctx || !this.noiseBuffer || !this.masterGain) return;

    const noiseSource = this.ctx.createBufferSource();
    noiseSource.buffer = this.noiseBuffer;
    noiseSource.loop = true;

    const filter = this.ctx.createBiquadFilter();
    filter.type = "bandpass";
    filter.frequency.value = 350;
    filter.Q.value = 2.2;

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0, this.ctx.currentTime);

    // Micro servo undertone
    const servo = this.ctx.createOscillator();
    const servoG = this.ctx.createGain();
    servo.type = "triangle";
    servo.frequency.value = 220;
    servoG.gain.setValueAtTime(0, this.ctx.currentTime);

    noiseSource.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);

    servo.connect(servoG);
    servoG.connect(this.masterGain);

    noiseSource.start();
    servo.start();

    this.motionSource = noiseSource;
    this.motionFilter = filter;
    this.motionGain = gain;
    this.servoOsc = servo;
    this.servoGain = servoG;
  }

  /**
   * Engine Reveal Layer: 40Hz sub-harmonic engine rumble with high-order acoustic filter.
   */
  private setupEngineLayer(): void {
    if (!this.ctx || !this.masterGain) return;

    const osc1 = this.ctx.createOscillator();
    const osc2 = this.ctx.createOscillator();
    const filter = this.ctx.createBiquadFilter();
    const gain = this.ctx.createGain();

    osc1.type = "sawtooth";
    osc1.frequency.value = 42; // Low mechanical V12 pulse

    osc2.type = "triangle";
    osc2.frequency.value = 84; // 1st harmonic

    filter.type = "lowpass";
    filter.frequency.value = 160;
    filter.Q.value = 2.5;

    gain.gain.setValueAtTime(0, this.ctx.currentTime);

    osc1.connect(filter);
    osc2.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);

    osc1.start();
    osc2.start();

    this.engineOsc1 = osc1;
    this.engineOsc2 = osc2;
    this.engineFilter = filter;
    this.engineGain = gain;
  }

  /**
   * Activates global ambience when user is within the exploded section.
   */
  public startAmbience(): void {
    if (!this.ctx || !this.ambienceGain || this.isAmbienceActive) return;
    this.ensureUnlocked();
    const t = this.ctx.currentTime;
    this.ambienceGain.gain.cancelScheduledValues(t);
    // Subdued 7% level - subtle technical presence
    this.ambienceGain.gain.setTargetAtTime(0.07, t, 0.6);
    this.isAmbienceActive = true;
  }

  /**
   * Fades out global ambience when leaving the exploded section.
   */
  public stopAmbience(): void {
    if (!this.ctx || !this.ambienceGain || !this.isAmbienceActive) return;
    const t = this.ctx.currentTime;
    this.ambienceGain.gain.cancelScheduledValues(t);
    this.ambienceGain.gain.setTargetAtTime(0, t, 0.4);
    this.isAmbienceActive = false;
  }

  /**
   * Main per-frame scroll update: maps velocity and progress to sound synthesis.
   */
  public updateScroll(progress: number, velocity: number): void {
    if (!this.ctx || this.isMuted) return;
    this.ensureUnlocked();

    const t = this.ctx.currentTime;
    const clampedVel = Math.min(0.06, Math.max(0, velocity));
    const velNormalized = clampedVel / 0.06; // 0.0 to 1.0

    // 1. Modulate continuous motion whoosh & servo sweep
    if (this.motionGain && this.motionFilter && this.servoGain && this.servoOsc) {
      if (velNormalized > 0.02) {
        // Active motion: scale volume from 0 to 0.22 (22% level)
        const targetVol = Math.min(0.22, velNormalized * 0.28);
        const targetFreq = 260 + velNormalized * 750; // 260Hz to 1010Hz
        const targetQ = 1.6 + velNormalized * 1.8;

        this.motionGain.gain.cancelScheduledValues(t);
        this.motionGain.gain.setTargetAtTime(targetVol, t, 0.06);

        this.motionFilter.frequency.cancelScheduledValues(t);
        this.motionFilter.frequency.setTargetAtTime(targetFreq, t, 0.08);

        this.motionFilter.Q.cancelScheduledValues(t);
        this.motionFilter.Q.setTargetAtTime(targetQ, t, 0.08);

        // Subtle servo pitch modulation
        this.servoGain.gain.cancelScheduledValues(t);
        this.servoGain.gain.setTargetAtTime(velNormalized * 0.035, t, 0.05);
        this.servoOsc.frequency.setTargetAtTime(180 + velNormalized * 180, t, 0.06);
      } else {
        // Near standstill: gently decay
        this.motionGain.gain.setTargetAtTime(0, t, 0.12);
        this.servoGain.gain.setTargetAtTime(0, t, 0.1);
      }
    }

    // 2. Engine Reveal (Phase 4: progress 0.60 to 0.85)
    this.updateEngineRumble(progress, velNormalized);

    // 3. Milestone Detection with Hysteresis & Cooldown
    this.checkMilestones(progress, velNormalized);
  }

  /**
   * Gradually introduces the deep V12 engine mechanical texture as the engine uncouples.
   */
  private updateEngineRumble(progress: number, velNormalized: number): void {
    if (!this.ctx || !this.engineGain || !this.engineFilter || !this.engineOsc1) return;

    const t = this.ctx.currentTime;
    // Engine is revealed prominently between progress 0.58 and 0.85
    if (progress >= 0.58 && progress <= 0.88) {
      // Visibility curve peaked at ~0.74
      const center = 0.74;
      const dist = Math.abs(progress - center);
      const intensity = Math.max(0, 1 - dist / 0.16);

      // Level: 35-42% restrained luxury mechanical rumble
      const engineLevel = intensity * (0.28 + velNormalized * 0.14);
      const cutoff = 130 + intensity * 240; // 130Hz to 370Hz

      this.engineGain.gain.cancelScheduledValues(t);
      this.engineGain.gain.setTargetAtTime(engineLevel, t, 0.08);

      this.engineFilter.frequency.cancelScheduledValues(t);
      this.engineFilter.frequency.setTargetAtTime(cutoff, t, 0.08);

      // Gentle RPM fluctuation matching scroll movement
      this.engineOsc1.frequency.setTargetAtTime(40 + velNormalized * 16, t, 0.08);
      this.isEngineActive = true;
    } else if (this.isEngineActive) {
      this.engineGain.gain.setTargetAtTime(0, t, 0.25);
      this.isEngineActive = false;
    }
  }

  /**
   * Evaluates milestone component separations and triggers discrete precision SFX.
   */
  private checkMilestones(progress: number, velNormalized: number): void {
    const now = typeof performance !== "undefined" ? performance.now() : Date.now();
    const timeSinceLast = now - this.lastTriggerTime;

    // Minimum cooldown: 130ms between discrete component locks to prevent acoustic clutter
    if (timeSinceLast < 130) return;

    // Hysteresis window: must move +/- 0.035 to re-arm milestone
    const resetMargin = 0.04;

    // Milestone 1: Front Splitter & Aerodynamic Canards (~0.12)
    if (progress >= 0.12 && !this.milestoneStates.aeroCanards) {
      this.milestoneStates.aeroCanards = true;
      this.lastTriggerTime = now;
      this.playSmallComponentWhoosh(velNormalized);
      setTimeout(() => this.playMechanicalClick("light"), 90);
    } else if (progress < 0.12 - resetMargin) {
      this.milestoneStates.aeroCanards = false;
    }

    // Milestone 2: Active Wheels & Carbon-Ceramic Brakes (~0.28)
    if (progress >= 0.28 && !this.milestoneStates.wheelAssemblies) {
      this.milestoneStates.wheelAssemblies = true;
      this.lastTriggerTime = now;
      this.playHeavyPanelMove(velNormalized);
      setTimeout(() => this.playMechanicalClick("heavy"), 110);
    } else if (progress < 0.28 - resetMargin) {
      this.milestoneStates.wheelAssemblies = false;
    }

    // Milestone 3: Dihedral Butterfly Doors & Monocoque Cockpit (~0.48)
    if (progress >= 0.48 && !this.milestoneStates.butterflyDoors) {
      this.milestoneStates.butterflyDoors = true;
      this.lastTriggerTime = now;
      this.playHeavyPanelMove(velNormalized);
      setTimeout(() => this.playMechanicalClick("heavy"), 130);
    } else if (progress < 0.48 - resetMargin) {
      this.milestoneStates.butterflyDoors = false;
    }

    // Milestone 4: V12 Engine & HY-KERS Mount Separation (~0.68)
    if (progress >= 0.68 && !this.milestoneStates.engineReveal) {
      this.milestoneStates.engineReveal = true;
      this.lastTriggerTime = now;
      this.playEngineArrivalPulse();
      setTimeout(() => this.playMechanicalClick("heavy"), 150);
    } else if (progress < 0.68 - resetMargin) {
      this.milestoneStates.engineReveal = false;
    }

    // Milestone 5: Full Expanded Structural Matrix Final Settle (~0.93)
    if (progress >= 0.93 && !this.milestoneStates.finalSettle) {
      this.milestoneStates.finalSettle = true;
      this.lastTriggerTime = now;
      this.playFinalSettle();
    } else if (progress < 0.93 - resetMargin) {
      this.milestoneStates.finalSettle = false;
    }
  }

  /**
   * Halts motion layer when user stops scrolling.
   */
  public stopMotion(): void {
    if (!this.ctx || !this.motionGain) return;
    const t = this.ctx.currentTime;
    this.motionGain.gain.setTargetAtTime(0, t, 0.14);
    if (this.servoGain) {
      this.servoGain.gain.setTargetAtTime(0, t, 0.1);
    }
  }

  /**
   * Procedural small component movement: light aerodynamic whoosh + titanium presence.
   */
  public playSmallComponentWhoosh(vel: number): void {
    if (!this.ctx || this.isMuted || !this.noiseBuffer || !this.masterGain) return;
    const t = this.ctx.currentTime;

    const source = this.ctx.createBufferSource();
    source.buffer = this.noiseBuffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = "bandpass";
    filter.frequency.setValueAtTime(420, t);
    filter.frequency.exponentialRampToValueAtTime(780, t + 0.12);
    filter.frequency.exponentialRampToValueAtTime(320, t + 0.22);
    filter.Q.value = 3.0;

    const gain = this.ctx.createGain();
    // Level: 18-22%
    const targetGain = Math.min(0.22, 0.14 + vel * 0.1);
    gain.gain.setValueAtTime(0.001, t);
    gain.gain.exponentialRampToValueAtTime(targetGain, t + 0.08);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.24);

    source.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);

    source.start(t);
    source.stop(t + 0.25);
  }

  /**
   * Procedural heavy panel movement: deeper displacement + carbon-fiber friction.
   */
  public playHeavyPanelMove(vel: number): void {
    if (!this.ctx || this.isMuted || !this.noiseBuffer || !this.masterGain) return;
    const t = this.ctx.currentTime;

    const source = this.ctx.createBufferSource();
    source.buffer = this.noiseBuffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.setValueAtTime(190, t);
    filter.frequency.exponentialRampToValueAtTime(380, t + 0.14);
    filter.frequency.exponentialRampToValueAtTime(140, t + 0.32);
    filter.Q.value = 2.0;

    const gain = this.ctx.createGain();
    // Level: 24-30%
    const targetGain = Math.min(0.30, 0.20 + vel * 0.14);
    gain.gain.setValueAtTime(0.001, t);
    gain.gain.exponentialRampToValueAtTime(targetGain, t + 0.10);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.35);

    source.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);

    source.start(t);
    source.stop(t + 0.36);
  }

  /**
   * Precision metallic latch click: ultra-short transient + resonant ring.
   * Avoids sci-fi beeps; strictly models high-tolerance automotive assembly.
   */
  public playMechanicalClick(type: "light" | "heavy"): void {
    if (!this.ctx || this.isMuted || !this.masterGain) return;
    const t = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();

    osc.type = "sine";
    const freq = type === "light" ? 1750 : 920;
    osc.frequency.setValueAtTime(freq, t);
    osc.frequency.exponentialRampToValueAtTime(freq * 0.65, t + 0.045);

    filter.type = "bandpass";
    filter.frequency.value = freq;
    filter.Q.value = type === "light" ? 12 : 8;

    // Level: 25-35%
    const clickGain = type === "light" ? 0.26 : 0.34;
    gain.gain.setValueAtTime(clickGain, t);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + (type === "light" ? 0.045 : 0.075));

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);

    osc.start(t);
    osc.stop(t + 0.08);
  }

  /**
   * Engine Arrival Pulse: acoustic sub-resonance burst as V12 unlocks from chassis.
   */
  private playEngineArrivalPulse(): void {
    if (!this.ctx || this.isMuted || !this.masterGain) return;
    const t = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const filter = this.ctx.createBiquadFilter();
    const gain = this.ctx.createGain();

    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(55, t);
    osc.frequency.exponentialRampToValueAtTime(38, t + 0.35);

    filter.type = "lowpass";
    filter.frequency.value = 210;
    filter.Q.value = 3.0;

    gain.gain.setValueAtTime(0.001, t);
    gain.gain.exponentialRampToValueAtTime(0.38, t + 0.08); // 38% level
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.45);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);

    osc.start(t);
    osc.stop(t + 0.46);
  }

  /**
   * Final Exploded Configuration Settle: staggered precision micro-locks + cinematic sub-bass tail.
   */
  public playFinalSettle(): void {
    if (!this.ctx || this.isMuted || !this.masterGain) return;

    // Staggered settling sequence
    this.playMechanicalClick("heavy");
    setTimeout(() => this.playMechanicalClick("light"), 90);
    setTimeout(() => this.playMechanicalClick("light"), 170);

    // Cinematic sub-bass tail (62Hz down to 28Hz)
    const t = this.ctx.currentTime + 0.05;
    const subOsc = this.ctx.createOscillator();
    const subFilter = this.ctx.createBiquadFilter();
    const subGain = this.ctx.createGain();

    subOsc.type = "sine";
    subOsc.frequency.setValueAtTime(62, t);
    subOsc.frequency.exponentialRampToValueAtTime(28, t + 0.65);

    subFilter.type = "lowpass";
    subFilter.frequency.value = 85;

    // Maximum 48% level - deep, cinematic, authoritative
    subGain.gain.setValueAtTime(0.001, t);
    subGain.gain.exponentialRampToValueAtTime(0.48, t + 0.12);
    subGain.gain.exponentialRampToValueAtTime(0.0001, t + 0.70);

    subOsc.connect(subFilter);
    subFilter.connect(subGain);
    subGain.connect(this.masterGain);

    subOsc.start(t);
    subOsc.stop(t + 0.72);
  }

  /**
   * Cleanup and resource disposal.
   */
  public destroy(): void {
    this.stopAmbience();
    this.stopMotion();
    try {
      this.ambienceOsc1?.stop();
      this.ambienceOsc2?.stop();
      this.motionSource?.stop();
      this.servoOsc?.stop();
      this.engineOsc1?.stop();
      this.engineOsc2?.stop();
    } catch {
      // Ignore if nodes are already stopped
    }
    if (this.ctx) {
      this.ctx.close().catch(() => {});
      this.ctx = null;
    }
  }
}

export const explodedSoundManager = new ExplodedSoundManager();
