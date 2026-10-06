/**
 * ExplodedSoundManager.ts
 * Premium cinematic Web Audio API sound-design engine for the Ferrari exploded-view scrolling experience.
 *
 * Architecture:
 * SoundManager
 * ├── ambience           (Subtle 5–10% low-frequency mechanical presence)
 * ├── componentWhoosh    (Small component 15–25% aerodynamic air sweep)
 * ├── mechanicalClick    (Precision 25–40% titanium/metallic lock & latch)
 * ├── heavyPanelMove     (Large component 20–35% deep structural mass movement)
 * ├── engineReveal       (Impressive 35–50% restrained V12 mechanical rumble & resonance)
 * └── finalSettle        (Authoritative 50–60% staggered micro-locks & sub-bass tail)
 *
 * Engineering Features:
 * - Velocity-mapped continuous air whoosh & micro-servo pitch modulation (no audio spam)
 * - Anti-spam hysteresis window & 140ms cooldown gating
 * - Bidirectional milestone response (forward explosion & reverse reassembly docking)
 * - Browser autoplay unlocking across desktop, tablet, and mobile
 * - Session-persisted sound toggle (SOUND ON / SOUND OFF)
 * - Single reusable AudioContext with procedural synthesis + preloaded sample buffer
 */

import { getAssetUrl } from "../utils/assetUrl";

export class SoundManager {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private isMuted: boolean = false;

  // Global Ambience Layer (5–10% level)
  private ambienceOsc1: OscillatorNode | null = null;
  private ambienceOsc2: OscillatorNode | null = null;
  private ambienceFilter: BiquadFilterNode | null = null;
  private ambienceGain: GainNode | null = null;
  private isAmbienceActive: boolean = false;

  // Velocity-driven Continuous Motion Layer
  private noiseBuffer: AudioBuffer | null = null;
  private preloadedSampleBuffer: AudioBuffer | null = null;
  private motionSource: AudioBufferSourceNode | null = null;
  private motionFilter: BiquadFilterNode | null = null;
  private motionGain: GainNode | null = null;
  private servoOsc: OscillatorNode | null = null;
  private servoGain: GainNode | null = null;

  // Engine Reveal Layer (35–50% level: 6.3L naturally aspirated V12 & HY-KERS)
  private engineOsc1: OscillatorNode | null = null;
  private engineOsc2: OscillatorNode | null = null;
  private engineResonanceFilter: BiquadFilterNode | null = null;
  private engineLowpassFilter: BiquadFilterNode | null = null;
  private engineGain: GainNode | null = null;
  private isEngineActive: boolean = false;

  // Milestone Tracking with Hysteresis & Bidirectional Logic
  private lastTriggerTime: number = 0;
  private lastProgress: number = 0;
  private milestoneStates: { [key: string]: boolean } = {
    aeroCanards: false,     // Milestone 1: ~0.12 (Aero splitter & canards)
    wheelAssemblies: false, // Milestone 2: ~0.28 (Carbon-ceramic wheels & suspension)
    butterflyDoors: false,  // Milestone 3: ~0.48 (Dihedral doors & monocoque panels)
    engineReveal: false,    // Milestone 4: ~0.68 (V12 engine & HY-KERS uncoupling)
    finalSettle: false,     // Milestone 5: ~0.93 (Full expanded structural matrix)
  };

  constructor() {
    const saved = typeof window !== "undefined" ? sessionStorage.getItem("ferrari_sound_enabled") : null;
    this.isMuted = saved === "false";
  }

  /**
   * Initializes the single AudioContext and creates procedural synthesis graphs.
   */
  public init(): void {
    if (this.ctx || typeof window === "undefined") return;

    try {
      const AudioContextClass =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioContextClass) return;

      this.ctx = new AudioContextClass();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : 1, this.ctx.currentTime);
      this.masterGain.connect(this.ctx.destination);

      this.createNoiseBuffer();
      this.preloadSampleBuffer();
      this.setupGlobalAmbience();
      this.setupMotionLayer();
      this.setupEngineLayer();

      // Listen for initial user gesture to unlock AudioContext across desktop & mobile
      const unlock = () => {
        if (!this.ctx) return;
        if (this.ctx.state === "suspended") {
          this.ctx.resume().catch(() => {});
        }
        window.removeEventListener("click", unlock);
        window.removeEventListener("pointerdown", unlock);
        window.removeEventListener("touchstart", unlock);
        window.removeEventListener("touchend", unlock);
        window.removeEventListener("keydown", unlock);
        window.removeEventListener("wheel", unlock);
      };

      window.addEventListener("click", unlock, { passive: true, once: true });
      window.addEventListener("pointerdown", unlock, { passive: true, once: true });
      window.addEventListener("touchstart", unlock, { passive: true, once: true });
      window.addEventListener("touchend", unlock, { passive: true, once: true });
      window.addEventListener("keydown", unlock, { passive: true, once: true });
      window.addEventListener("wheel", unlock, { passive: true, once: true });
    } catch {
      // AudioContext unavailable or restricted
    }
  }

  /**
   * Guarantees AudioContext is running on user interaction.
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
   * Session-persisted sound toggle.
   */
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
   * Preloads real recorded studio audio buffer as an organic texture layer (non-blocking).
   */
  private preloadSampleBuffer(): void {
    if (!this.ctx || typeof fetch === "undefined") return;
    try {
      fetch(getAssetUrl("/assets/audio/explode_scroll.mp3"))
        .then((res) => (res.ok ? res.arrayBuffer() : null))
        .then((buf) => {
          if (buf && this.ctx) {
            this.ctx.decodeAudioData(
              buf,
              (decoded) => {
                this.preloadedSampleBuffer = decoded;
              },
              () => {}
            );
          }
        })
        .catch(() => {});
    } catch {
      // Fallback seamlessly to pure procedural synthesis
    }
  }

  /**
   * Generates a 2-second looped pink/brownian noise buffer for velvety aerodynamic air whooshes.
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
   * 1. GLOBAL AMBIENCE
   * Extremely subtle low-frequency mechanical ambience (5–10% level).
   * 48Hz sine + 96Hz subtle triangle filtered at 105Hz lowpass.
   */
  private setupGlobalAmbience(): void {
    if (!this.ctx || !this.masterGain) return;

    const osc1 = this.ctx.createOscillator();
    const osc2 = this.ctx.createOscillator();
    const filter = this.ctx.createBiquadFilter();
    const gain = this.ctx.createGain();

    osc1.type = "sine";
    osc1.frequency.value = 48;

    osc2.type = "triangle";
    osc2.frequency.value = 96;

    filter.type = "lowpass";
    filter.frequency.value = 105;
    filter.Q.value = 1.1;

    gain.gain.setValueAtTime(0, this.ctx.currentTime);

    osc1.connect(filter);
    osc2.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);

    osc1.start();
    osc2.start();

    this.ambienceOsc1 = osc1;
    this.ambienceOsc2 = osc2;
    this.ambienceFilter = filter;
    this.ambienceGain = gain;
  }

  /**
   * Ambience public controller (accepts boolean or starts directly).
   */
  public ambience(enable: boolean = true): void {
    if (enable) {
      this.startAmbience();
    } else {
      this.stopAmbience();
    }
  }

  public startAmbience(): void {
    if (!this.ctx || !this.ambienceGain || this.isAmbienceActive) return;
    this.ensureUnlocked();
    const t = this.ctx.currentTime;
    this.ambienceGain.gain.cancelScheduledValues(t);
    // Sophisticated 6.5% level (5–10% recommended): technical acoustic presence
    this.ambienceGain.gain.setTargetAtTime(0.065, t, 0.6);
    this.ambienceFilter?.frequency.setTargetAtTime(105, t, 0.5);
    this.isAmbienceActive = true;
  }

  public stopAmbience(): void {
    if (!this.ctx || !this.ambienceGain || !this.isAmbienceActive) return;
    const t = this.ctx.currentTime;
    this.ambienceGain.gain.cancelScheduledValues(t);
    this.ambienceGain.gain.setTargetAtTime(0, t, 0.35);
    this.ambienceFilter?.frequency.setTargetAtTime(60, t, 0.35);
    this.isAmbienceActive = false;
  }

  /**
   * Continuous Motion Layer: dynamic aerodynamic bandpass noise + micro-servo sweep.
   */
  private setupMotionLayer(): void {
    if (!this.ctx || !this.noiseBuffer || !this.masterGain) return;

    const noiseSource = this.ctx.createBufferSource();
    noiseSource.buffer = this.noiseBuffer;
    noiseSource.loop = true;

    const filter = this.ctx.createBiquadFilter();
    filter.type = "bandpass";
    filter.frequency.value = 320;
    filter.Q.value = 2.0;

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0, this.ctx.currentTime);

    // Micro servo undertone
    const servo = this.ctx.createOscillator();
    const servoG = this.ctx.createGain();
    servo.type = "triangle";
    servo.frequency.value = 200;
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
   * 5. ENGINE REVEAL LAYER
   * Impressive low-frequency mechanical rumble (35–50% level).
   * Naturally aspirated 6.3L V12 firing texture + metallic valvetrain acoustic resonance.
   */
  private setupEngineLayer(): void {
    if (!this.ctx || !this.masterGain) return;

    const osc1 = this.ctx.createOscillator();
    const osc2 = this.ctx.createOscillator();
    const lowpass = this.ctx.createBiquadFilter();
    const resonance = this.ctx.createBiquadFilter();
    const gain = this.ctx.createGain();

    osc1.type = "sawtooth";
    osc1.frequency.value = 42; // Low mechanical V12 pulse

    osc2.type = "triangle";
    osc2.frequency.value = 84; // 1st harmonic

    // Warm acoustic engine housing filter
    lowpass.type = "lowpass";
    lowpass.frequency.value = 160;
    lowpass.Q.value = 2.4;

    // Metallic valvetrain / machined aluminum block resonance
    resonance.type = "peaking";
    resonance.frequency.value = 420;
    resonance.gain.value = 5.0;
    resonance.Q.value = 3.5;

    gain.gain.setValueAtTime(0, this.ctx.currentTime);

    osc1.connect(lowpass);
    osc2.connect(lowpass);
    lowpass.connect(resonance);
    resonance.connect(gain);
    gain.connect(this.masterGain);

    osc1.start();
    osc2.start();

    this.engineOsc1 = osc1;
    this.engineOsc2 = osc2;
    this.engineLowpassFilter = lowpass;
    this.engineResonanceFilter = resonance;
    this.engineGain = gain;
  }

  /**
   * 3. SCROLL SYNCHRONIZATION & VELOCITY MAPPING
   * Main per-frame scroll update: maps velocity and progress to sound synthesis.
   * Prevents audio spam via smooth continuous parameter ramping.
   */
  public updateScroll(progress: number, velocity: number): void {
    if (!this.ctx || this.isMuted) return;
    this.ensureUnlocked();

    const t = this.ctx.currentTime;
    const clampedVel = Math.min(0.06, Math.max(0, velocity));
    const velNormalized = clampedVel / 0.06; // 0.0 to 1.0

    // Detect scroll direction (forward vs reverse)
    const isReverse = progress < this.lastProgress - 0.001;

    // 1. Modulate continuous motion whoosh & servo sweep (no audio spam)
    if (this.motionGain && this.motionFilter && this.servoGain && this.servoOsc) {
      if (velNormalized > 0.02) {
        // Active motion: scale volume between 0 and 0.22 (15-22% level)
        const targetVol = Math.min(0.22, velNormalized * 0.26);
        // Pitch ramps smoothly with velocity (slow = lower pitch, fast = higher pitch)
        const targetFreq = 240 + velNormalized * 720; // 240Hz to 960Hz
        const targetQ = 1.5 + velNormalized * 1.8;

        this.motionGain.gain.cancelScheduledValues(t);
        this.motionGain.gain.setTargetAtTime(targetVol, t, 0.05);

        this.motionFilter.frequency.cancelScheduledValues(t);
        this.motionFilter.frequency.setTargetAtTime(targetFreq, t, 0.07);

        this.motionFilter.Q.cancelScheduledValues(t);
        this.motionFilter.Q.setTargetAtTime(targetQ, t, 0.07);

        // Subtle micro-servo pitch modulation
        this.servoGain.gain.cancelScheduledValues(t);
        this.servoGain.gain.setTargetAtTime(velNormalized * 0.032, t, 0.05);
        this.servoOsc.frequency.setTargetAtTime(170 + velNormalized * 190, t, 0.06);
      } else {
        // Standstill: gently decay motion layer
        this.motionGain.gain.setTargetAtTime(0, t, 0.12);
        this.servoGain.gain.setTargetAtTime(0, t, 0.1);
      }
    }

    // 2. Engine Reveal (Phase 4: progress 0.58 to 0.88)
    this.engineReveal(progress, velNormalized);

    // 3. Milestone Detection with Hysteresis & Cooldown
    this.checkMilestones(progress, velNormalized, isReverse);

    this.lastProgress = progress;
  }

  /**
   * 5. ENGINE REVEAL
   * Controlled mechanical V12 idle and metallic acoustic rumble (35–50% level).
   */
  public engineReveal(progressOrIntensity: number = 0.72, velocity: number = 0.2): void {
    if (!this.ctx || !this.engineGain || !this.engineLowpassFilter || !this.engineOsc1) return;

    const t = this.ctx.currentTime;
    const progress = progressOrIntensity;

    // Active zone: progress 0.58 to 0.88 (peaked at ~0.73)
    if (progress >= 0.58 && progress <= 0.88) {
      const center = 0.73;
      const dist = Math.abs(progress - center);
      const intensity = Math.max(0, 1 - dist / 0.15);

      // Level: 35–45% restrained luxury automotive mechanical rumble
      const engineLevel = intensity * (0.28 + velocity * 0.14);
      const cutoff = 130 + intensity * 230; // 130Hz to 360Hz

      this.engineGain.gain.cancelScheduledValues(t);
      this.engineGain.gain.setTargetAtTime(engineLevel, t, 0.08);

      this.engineLowpassFilter.frequency.cancelScheduledValues(t);
      this.engineLowpassFilter.frequency.setTargetAtTime(cutoff, t, 0.08);

      this.engineResonanceFilter?.gain.setTargetAtTime(3.0 + intensity * 4.0, t, 0.08);

      // Subtle mechanical RPM resonance fluctuation matching motion
      this.engineOsc1.frequency.setTargetAtTime(42 + velocity * 14, t, 0.08);
      this.isEngineActive = true;
    } else if (this.isEngineActive) {
      this.engineGain.gain.setTargetAtTime(0, t, 0.24);
      this.isEngineActive = false;
    }
  }

  /**
   * Evaluates milestone component separations and triggers discrete precision SFX.
   * Handles bidirectional movements (forward explosion vs reverse reassembly).
   */
  private checkMilestones(progress: number, velNormalized: number, isReverse: boolean): void {
    const now = typeof performance !== "undefined" ? performance.now() : Date.now();
    const timeSinceLast = now - this.lastTriggerTime;

    // Minimum cooldown: 130ms between discrete component locks to prevent acoustic clutter
    if (timeSinceLast < 130) return;

    // Hysteresis window: must move +/- 0.038 to re-arm milestone
    const resetMargin = 0.038;

    // Milestone 1: Front Splitter & Aerodynamic Canards (~0.12)
    if (progress >= 0.12 && !this.milestoneStates.aeroCanards) {
      this.milestoneStates.aeroCanards = true;
      this.lastTriggerTime = now;
      this.componentWhoosh(velNormalized);
      setTimeout(() => this.mechanicalClick("light"), 90);
    } else if (progress < 0.12 - resetMargin) {
      if (this.milestoneStates.aeroCanards && isReverse) {
        // Reverse reassembly docking click
        this.mechanicalClick("light");
      }
      this.milestoneStates.aeroCanards = false;
    }

    // Milestone 2: Active Wheels & Carbon-Ceramic Brakes (~0.28)
    if (progress >= 0.28 && !this.milestoneStates.wheelAssemblies) {
      this.milestoneStates.wheelAssemblies = true;
      this.lastTriggerTime = now;
      this.heavyPanelMove(velNormalized);
      setTimeout(() => this.mechanicalClick("heavy"), 110);
    } else if (progress < 0.28 - resetMargin) {
      if (this.milestoneStates.wheelAssemblies && isReverse) {
        this.mechanicalClick("heavy");
      }
      this.milestoneStates.wheelAssemblies = false;
    }

    // Milestone 3: Dihedral Butterfly Doors & Monocoque Cockpit (~0.48)
    if (progress >= 0.48 && !this.milestoneStates.butterflyDoors) {
      this.milestoneStates.butterflyDoors = true;
      this.lastTriggerTime = now;
      this.heavyPanelMove(velNormalized);
      setTimeout(() => this.mechanicalClick("heavy"), 130);
    } else if (progress < 0.48 - resetMargin) {
      if (this.milestoneStates.butterflyDoors && isReverse) {
        this.mechanicalClick("heavy");
      }
      this.milestoneStates.butterflyDoors = false;
    }

    // Milestone 4: V12 Engine & HY-KERS Mount Separation (~0.68)
    if (progress >= 0.68 && !this.milestoneStates.engineReveal) {
      this.milestoneStates.engineReveal = true;
      this.lastTriggerTime = now;
      this.playEngineArrivalPulse();
      setTimeout(() => this.mechanicalClick("heavy"), 140);
    } else if (progress < 0.68 - resetMargin) {
      if (this.milestoneStates.engineReveal && isReverse) {
        this.mechanicalClick("heavy");
      }
      this.milestoneStates.engineReveal = false;
    }

    // Milestone 5: Full Expanded Structural Matrix Final Settle (~0.93)
    if (progress >= 0.93 && !this.milestoneStates.finalSettle) {
      this.milestoneStates.finalSettle = true;
      this.lastTriggerTime = now;
      this.finalSettle();
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
   * 2. COMPONENT WHOOSH (Small Components: vents, ducts, trim, suspension)
   * Light aerodynamic whoosh + titanium presence (Level: 15–25%).
   */
  public componentWhoosh(velocity: number = 0.2): void {
    if (!this.ctx || this.isMuted || !this.noiseBuffer || !this.masterGain) return;
    const t = this.ctx.currentTime;

    // Optional subtle layer from preloaded sample buffer
    if (this.preloadedSampleBuffer) {
      try {
        const sampleSource = this.ctx.createBufferSource();
        const sampleGain = this.ctx.createGain();
        sampleSource.buffer = this.preloadedSampleBuffer;
        sampleGain.gain.setValueAtTime(0.08, t);
        sampleGain.gain.exponentialRampToValueAtTime(0.0001, t + 0.28);
        sampleSource.connect(sampleGain);
        sampleGain.connect(this.masterGain);
        sampleSource.start(t, 0.2, 0.28);
      } catch {}
    }

    const source = this.ctx.createBufferSource();
    source.buffer = this.noiseBuffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = "bandpass";
    filter.frequency.setValueAtTime(420, t);
    filter.frequency.exponentialRampToValueAtTime(780, t + 0.12);
    filter.frequency.exponentialRampToValueAtTime(320, t + 0.22);
    filter.Q.value = 2.8;

    const gain = this.ctx.createGain();
    // Level: 18-22% (within 15–25% specification)
    const targetGain = Math.min(0.24, 0.15 + velocity * 0.09);
    gain.gain.setValueAtTime(0.001, t);
    gain.gain.exponentialRampToValueAtTime(targetGain, t + 0.08);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.24);

    source.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);

    source.start(t);
    source.stop(t + 0.25);
  }

  // Alias for backward compatibility
  public playSmallComponentWhoosh(vel: number): void {
    this.componentWhoosh(vel);
  }

  /**
   * 4. HEAVY PANEL MOVE (Large Components: hood, doors, wheels, body panels, engine cover)
   * Deeper displacement + carbon-fiber mass friction (Level: 20–35%).
   */
  public heavyPanelMove(velocity: number = 0.2): void {
    if (!this.ctx || this.isMuted || !this.noiseBuffer || !this.masterGain) return;
    const t = this.ctx.currentTime;

    const source = this.ctx.createBufferSource();
    source.buffer = this.noiseBuffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.setValueAtTime(180, t);
    filter.frequency.exponentialRampToValueAtTime(360, t + 0.14);
    filter.frequency.exponentialRampToValueAtTime(140, t + 0.32);
    filter.Q.value = 1.9;

    const gain = this.ctx.createGain();
    // Level: 24–30% (within 20–35% specification)
    const targetGain = Math.min(0.32, 0.21 + velocity * 0.13);
    gain.gain.setValueAtTime(0.001, t);
    gain.gain.exponentialRampToValueAtTime(targetGain, t + 0.10);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.34);

    source.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);

    source.start(t);
    source.stop(t + 0.35);
  }

  // Alias for backward compatibility
  public playHeavyPanelMove(vel: number): void {
    this.heavyPanelMove(vel);
  }

  /**
   * 2 & 4. MECHANICAL CLICK / LOCK
   * Precision metallic latch click: ultra-short transient + resonant ring (Level: 25–40%).
   * Models high-tolerance automotive assembly, strictly avoids arcade beeps.
   */
  public mechanicalClick(type: "light" | "heavy" = "light"): void {
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
    filter.Q.value = type === "light" ? 11 : 7.5;

    // Level: 26–34% (within 25–40% specification)
    const clickGain = type === "light" ? 0.27 : 0.34;
    gain.gain.setValueAtTime(clickGain, t);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + (type === "light" ? 0.045 : 0.075));

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);

    osc.start(t);
    osc.stop(t + 0.08);
  }

  // Alias for backward compatibility
  public playMechanicalClick(type: "light" | "heavy"): void {
    this.mechanicalClick(type);
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
    osc.frequency.setValueAtTime(54, t);
    osc.frequency.exponentialRampToValueAtTime(38, t + 0.34);

    filter.type = "lowpass";
    filter.frequency.value = 200;
    filter.Q.value = 2.8;

    gain.gain.setValueAtTime(0.001, t);
    gain.gain.exponentialRampToValueAtTime(0.38, t + 0.08); // 38% level
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.44);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);

    osc.start(t);
    osc.stop(t + 0.45);
  }

  /**
   * 6. FINAL EXPLODED VIEW SETTLE
   * Staggered precision micro-locks + cinematic sub-bass tail (Level: maximum 50–60%).
   */
  public finalSettle(): void {
    if (!this.ctx || this.isMuted || !this.masterGain) return;

    // Staggered precision locking sequence
    this.mechanicalClick("heavy");
    setTimeout(() => this.mechanicalClick("light"), 90);
    setTimeout(() => this.mechanicalClick("light"), 170);

    // Subtle cinematic sub-bass tail (60Hz sinking to 26Hz over 0.65s)
    const t = this.ctx.currentTime + 0.05;
    const subOsc = this.ctx.createOscillator();
    const subFilter = this.ctx.createBiquadFilter();
    const subGain = this.ctx.createGain();

    subOsc.type = "sine";
    subOsc.frequency.setValueAtTime(60, t);
    subOsc.frequency.exponentialRampToValueAtTime(26, t + 0.65);

    subFilter.type = "lowpass";
    subFilter.frequency.value = 85;

    // Level: 49% (within 50–60% maximum level)
    subGain.gain.setValueAtTime(0.001, t);
    subGain.gain.exponentialRampToValueAtTime(0.49, t + 0.12);
    subGain.gain.exponentialRampToValueAtTime(0.0001, t + 0.70);

    subOsc.connect(subFilter);
    subFilter.connect(subGain);
    subGain.connect(this.masterGain);

    subOsc.start(t);
    subOsc.stop(t + 0.72);
  }

  // Alias for backward compatibility
  public playFinalSettle(): void {
    this.finalSettle();
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

export const soundManager = new SoundManager();
export const explodedSoundManager = soundManager;
