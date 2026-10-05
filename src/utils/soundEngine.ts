// Procedural Web Audio API Sound Engine for BABU CAR RACING
// Zero external copyrighted audio files — 100% original procedural synthesis

class SoundEngine {
  private ctx: AudioContext | null = null;
  private musicOsc: OscillatorNode | null = null;
  private musicGain: GainNode | null = null;
  private musicTimer: number | null = null;
  private engineOsc: OscillatorNode | null = null;
  private engineGain: GainNode | null = null;

  public musicEnabled = true;
  public sfxEnabled = true;
  public engineEnabled = true;

  public musicVolume = 0.35;
  public sfxVolume = 0.7;
  public engineVolume = 0.45;

  private ensureContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  public playClick() {
    if (!this.sfxEnabled) return;
    const ctx = this.ensureContext();
    if (!ctx) return;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(520, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.06);

    gain.gain.setValueAtTime(0.15 * this.sfxVolume, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.06);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.065);
  }

  public playCountdown(isGo: boolean) {
    if (!this.sfxEnabled) return;
    const ctx = this.ensureContext();
    if (!ctx) return;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sawtooth';
    const freq = isGo ? 880 : 440;
    const dur = isGo ? 0.35 : 0.18;
    osc.frequency.setValueAtTime(freq, ctx.currentTime);
    if (isGo) {
      osc.frequency.exponentialRampToValueAtTime(1180, ctx.currentTime + dur);
    }

    gain.gain.setValueAtTime(0.25 * this.sfxVolume, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + dur);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + dur + 0.01);
  }

  public playCoinPickup() {
    if (!this.sfxEnabled) return;
    const ctx = this.ensureContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(987.77, now); // B5
    osc.frequency.setValueAtTime(1318.51, now + 0.06); // E6

    gain.gain.setValueAtTime(0.22 * this.sfxVolume, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.23);
  }

  public playNitro() {
    if (!this.sfxEnabled) return;
    const ctx = this.ensureContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(140, now);
    osc.frequency.exponentialRampToValueAtTime(560, now + 0.38);

    gain.gain.setValueAtTime(0.25 * this.sfxVolume, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.4);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.41);
  }

  public playBrake() {
    if (!this.sfxEnabled) return;
    const ctx = this.ensureContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(320, now);
    osc.frequency.linearRampToValueAtTime(180, now + 0.14);

    gain.gain.setValueAtTime(0.14 * this.sfxVolume, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.16);
  }

  public playCollision() {
    if (!this.sfxEnabled) return;
    const ctx = this.ensureContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'square';
    osc.frequency.setValueAtTime(120, now);
    osc.frequency.exponentialRampToValueAtTime(45, now + 0.22);

    gain.gain.setValueAtTime(0.32 * this.sfxVolume, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.24);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.25);
  }

  public playLevelUnlock() {
    if (!this.sfxEnabled) return;
    this.playArpeggio([523.25, 659.25, 783.99, 1046.5], 0.09);
  }

  public playReward() {
    if (!this.sfxEnabled) return;
    this.playArpeggio([587.33, 739.99, 880, 1174.66], 0.08);
  }

  public playVictory(isChampionship = false) {
    if (!this.sfxEnabled) return;
    if (isChampionship) {
      this.playArpeggio([523.25, 659.25, 783.99, 1046.5, 1318.51, 1567.98], 0.11);
    } else {
      this.playArpeggio([440, 554.37, 659.25, 880], 0.1);
    }
  }

  public playDefeat() {
    if (!this.sfxEnabled) return;
    this.playArpeggio([392.0, 349.23, 329.63, 261.63], 0.14);
  }

  private playArpeggio(notes: number[], stepTime: number) {
    const ctx = this.ensureContext();
    if (!ctx) return;
    const now = ctx.currentTime;

    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now + idx * stepTime);

      gain.gain.setValueAtTime(0.22 * this.sfxVolume, now + idx * stepTime);
      gain.gain.exponentialRampToValueAtTime(0.001, now + (idx + 1) * stepTime + 0.12);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + idx * stepTime);
      osc.stop(now + (idx + 1) * stepTime + 0.14);
    });
  }

  // Continuous engine sound during race
  public startEngine() {
    if (!this.engineEnabled) return;
    const ctx = this.ensureContext();
    if (!ctx) return;

    this.stopEngine();
    this.engineOsc = ctx.createOscillator();
    this.engineGain = ctx.createGain();

    this.engineOsc.type = 'sawtooth';
    this.engineOsc.frequency.setValueAtTime(65, ctx.currentTime);
    this.engineGain.gain.setValueAtTime(0.08 * this.engineVolume, ctx.currentTime);

    this.engineOsc.connect(this.engineGain);
    this.engineGain.connect(ctx.destination);
    this.engineOsc.start();
  }

  public updateEngine(speedRatio: number, isNitro: boolean) {
    if (!this.engineEnabled || !this.engineOsc || !this.engineGain || !this.ctx) {
      if (!this.engineEnabled && this.engineOsc) this.stopEngine();
      return;
    }
    const baseFreq = 60 + speedRatio * 170 + (isNitro ? 55 : 0);
    this.engineOsc.frequency.setTargetAtTime(baseFreq, this.ctx.currentTime, 0.05);
    const targetGain = (0.06 + speedRatio * 0.08) * this.engineVolume;
    this.engineGain.gain.setTargetAtTime(targetGain, this.ctx.currentTime, 0.05);
  }

  public stopEngine() {
    if (this.engineOsc) {
      try {
        this.engineOsc.stop();
        this.engineOsc.disconnect();
      } catch {
        // ignore
      }
      this.engineOsc = null;
    }
    if (this.engineGain) {
      try {
        this.engineGain.disconnect();
      } catch {
        // ignore
      }
      this.engineGain = null;
    }
  }

  // Original procedural synth bassline pulse for menu/race music
  public startMusic() {
    if (!this.musicEnabled) return;
    if (this.musicTimer !== null) return;

    const notes = [110, 110, 130.81, 146.83, 110, 164.81, 146.83, 130.81];
    let step = 0;

    this.musicTimer = window.setInterval(() => {
      if (!this.musicEnabled) return;
      const ctx = this.ensureContext();
      if (!ctx || ctx.state !== 'running') return;

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      const freq = notes[step % notes.length];
      step++;

      osc.frequency.setValueAtTime(freq, ctx.currentTime);
      gain.gain.setValueAtTime(0.07 * this.musicVolume, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.22);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.23);
    }, 260);
  }

  public stopMusic() {
    if (this.musicTimer !== null) {
      clearInterval(this.musicTimer);
      this.musicTimer = null;
    }
  }
}

export const soundEngine = new SoundEngine();
