// High-fidelity Procedural Ferrari Engine & Powertrain Acoustic Synthesizer
class EngineAudioSynthesizer {
  private ctx: AudioContext | null = null;
  private osc1: OscillatorNode | null = null;
  private osc2: OscillatorNode | null = null;
  private osc3: OscillatorNode | null = null;
  private subOsc: OscillatorNode | null = null;
  private noiseNode: AudioBufferSourceNode | null = null;
  private noiseGain: GainNode | null = null;
  private filter: BiquadFilterNode | null = null;
  private exhaustFilter: BiquadFilterNode | null = null;
  private masterGain: GainNode | null = null;
  private isRunning: boolean = false;

  public init() {
    if (this.ctx) return;
    try {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext })
          .webkitAudioContext;
      this.ctx = new AudioCtx();
    } catch {
      // Web Audio not supported
    }
  }

  public start() {
    if (this.isRunning) return;
    this.init();
    if (!this.ctx) return;

    if (this.ctx.state === "suspended") {
      this.ctx.resume().catch(() => {});
    }

    const t = this.ctx.currentTime;

    // Master volume bus
    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.setValueAtTime(0.001, t);
    this.masterGain.gain.exponentialRampToValueAtTime(0.24, t + 0.2);
    this.masterGain.connect(this.ctx.destination);

    // Primary acoustic filter (engine combustion chamber and intake manifold)
    this.filter = this.ctx.createBiquadFilter();
    this.filter.type = "lowpass";
    this.filter.frequency.setValueAtTime(680, t);
    this.filter.Q.setValueAtTime(3.4, t);
    this.filter.connect(this.masterGain);

    // High-pass exhaust rasp filter (Maranello titanium inconel headers)
    this.exhaustFilter = this.ctx.createBiquadFilter();
    this.exhaustFilter.type = "bandpass";
    this.exhaustFilter.frequency.setValueAtTime(1400, t);
    this.exhaustFilter.Q.setValueAtTime(2.0, t);
    this.exhaustFilter.connect(this.masterGain);

    // 1. Primary cylinder firing pulses (sawtooth for aggressive Italian exhaust timbre)
    this.osc1 = this.ctx.createOscillator();
    this.osc1.type = "sawtooth";
    this.osc1.frequency.setValueAtTime(48, t);

    // 2. Second harmonic (creates the distinct Maranello singing pitch)
    this.osc2 = this.ctx.createOscillator();
    this.osc2.type = "sawtooth";
    this.osc2.frequency.setValueAtTime(96, t);

    // 3. Third harmonic (high rasp of high-RPM cam lift)
    this.osc3 = this.ctx.createOscillator();
    this.osc3.type = "triangle";
    this.osc3.frequency.setValueAtTime(192, t);

    // 4. Sub-bass rumble (deep chassis mechanical vibration)
    this.subOsc = this.ctx.createOscillator();
    this.subOsc.type = "sine";
    this.subOsc.frequency.setValueAtTime(32, t);

    this.osc1.connect(this.filter);
    this.osc2.connect(this.filter);
    this.osc3.connect(this.exhaustFilter);
    this.subOsc.connect(this.masterGain);

    this.osc1.start(t);
    this.osc2.start(t);
    this.osc3.start(t);
    this.subOsc.start(t);

    // 5. Intake rush & air displacement noise
    try {
      const bufferSize = this.ctx.sampleRate * 2;
      const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const output = noiseBuffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        output[i] = Math.random() * 2 - 1;
      }

      this.noiseNode = this.ctx.createBufferSource();
      this.noiseNode.buffer = noiseBuffer;
      this.noiseNode.loop = true;

      const noiseFilter = this.ctx.createBiquadFilter();
      noiseFilter.type = "bandpass";
      noiseFilter.frequency.setValueAtTime(1200, t);
      noiseFilter.Q.setValueAtTime(1.2, t);

      this.noiseGain = this.ctx.createGain();
      this.noiseGain.gain.setValueAtTime(0.015, t);

      this.noiseNode.connect(noiseFilter);
      noiseFilter.connect(this.noiseGain);
      this.noiseGain.connect(this.masterGain);

      this.noiseNode.start(t);
    } catch {
      // Noise buffer fallback
    }

    this.isRunning = true;
  }

  public update(
    rpm: number,
    throttle: number,
    speedKmh: number = 0,
    vehicleType: string = "ROAD",
    brake: number = 0
  ) {
    if (
      !this.isRunning ||
      !this.ctx ||
      !this.osc1 ||
      !this.osc2 ||
      !this.osc3 ||
      !this.subOsc ||
      !this.filter ||
      !this.exhaustFilter ||
      !this.masterGain
    ) {
      return;
    }

    const t = this.ctx.currentTime;

    // Formula 1 engine revs to 13,000+ RPM; V12/V8 have full-throated roar
    const basePitch =
      vehicleType === "FORMULA"
        ? (rpm / 60) * 2.85
        : vehicleType === "RACE"
        ? (rpm / 60) * 2.15
        : (rpm / 60) * 1.65;

    const baseFreq = Math.max(38, basePitch);

    // Smooth frequency transitions without clicks
    this.osc1.frequency.setTargetAtTime(baseFreq, t, 0.035);
    this.osc2.frequency.setTargetAtTime(baseFreq * 2.01, t, 0.035);
    this.osc3.frequency.setTargetAtTime(baseFreq * 3.02, t, 0.035);
    this.subOsc.frequency.setTargetAtTime(Math.max(26, baseFreq * 0.5), t, 0.035);

    // Exhaust resonance opening with throttle and speed
    const filterFreq = Math.min(
      8800,
      480 + (rpm / 8500) * 3900 + throttle * 1700 + (speedKmh / 350) * 900
    );
    this.filter.frequency.setTargetAtTime(filterFreq, t, 0.035);

    // Inconel exhaust rasp peaks at high revs
    const raspFreq = Math.min(6200, 1000 + (rpm / 9000) * 2800);
    this.exhaustFilter.frequency.setTargetAtTime(raspFreq, t, 0.035);

    // Dynamic throttle and speed volume
    const speedAirBoost = Math.min(0.09, (speedKmh / 350) * 0.09);
    const targetGain = 0.13 + throttle * 0.17 + (rpm / 9000) * 0.09 + speedAirBoost;
    this.masterGain.gain.setTargetAtTime(targetGain, t, 0.035);

    // Air and tire roar noise based on speed and braking
    if (this.noiseGain) {
      const tireBrakeScreech = brake > 0 && speedKmh > 35 ? 0.06 : 0;
      const airNoise = 0.012 + (speedKmh / 350) * 0.07 + throttle * 0.04 + tireBrakeScreech;
      this.noiseGain.gain.setTargetAtTime(airNoise, t, 0.04);
    }
  }

  public triggerShiftPop() {
    if (!this.ctx || !this.isRunning || !this.masterGain) return;
    try {
      const t = this.ctx.currentTime;
      // High-energy exhaust pop/crackle on gear shift
      const popOsc = this.ctx.createOscillator();
      const popGain = this.ctx.createGain();
      popOsc.type = "sawtooth";
      popOsc.frequency.setValueAtTime(180, t);
      popOsc.frequency.exponentialRampToValueAtTime(42, t + 0.07);

      popGain.gain.setValueAtTime(0.24, t);
      popGain.gain.exponentialRampToValueAtTime(0.001, t + 0.08);

      popOsc.connect(popGain);
      popGain.connect(this.masterGain);

      popOsc.start(t);
      popOsc.stop(t + 0.09);
    } catch {}
  }

  public stop() {
    if (!this.isRunning || !this.ctx || !this.masterGain) return;
    const t = this.ctx.currentTime;
    try {
      this.masterGain.gain.setValueAtTime(this.masterGain.gain.value, t);
      this.masterGain.gain.exponentialRampToValueAtTime(0.0001, t + 0.15);
    } catch {}

    setTimeout(() => {
      try {
        this.osc1?.stop();
        this.osc2?.stop();
        this.osc3?.stop();
        this.subOsc?.stop();
        this.noiseNode?.stop();
        this.osc1?.disconnect();
        this.osc2?.disconnect();
        this.osc3?.disconnect();
        this.subOsc?.disconnect();
      } catch {
        // Ignored
      }
      this.isRunning = false;
    }, 200);
  }
}

export const engineAudio = new EngineAudioSynthesizer();
