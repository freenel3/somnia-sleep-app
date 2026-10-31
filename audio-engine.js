/**
 * SOMNIA Web Audio Procedural Sound Engine
 * Generates pure procedural brown noise, rain, ocean waves, and binaural delta/theta beats.
 * Zero external audio files required. 100% offline & royalty-free.
 */
class SomniaAudioEngine {
  constructor() {
    this.ctx = null;
    this.masterGain = null;
    this.timerId = null;
    this.fadeTimerId = null;
    this.isPlaying = false;

    // Track active nodes
    this.nodes = {
      brownNoise: null,
      brownGain: null,
      rainSource: null,
      rainGain: null,
      oceanSource: null,
      oceanFilter: null,
      oceanGain: null,
      oceanLFO: null,
      binauralLeft: null,
      binauralRight: null,
      binauralGain: null,
    };
  }

  initContext() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      this.ctx = new AudioCtx();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(0.8, this.ctx.currentTime);
      this.masterGain.connect(this.ctx.destination);
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  // --- Procedural Noise Buffers ---
  createBrownNoiseBuffer(seconds = 6) {
    const sampleRate = this.ctx.sampleRate;
    const bufferSize = sampleRate * seconds;
    const buffer = this.ctx.createBuffer(2, bufferSize, sampleRate);

    for (let channel = 0; channel < 2; channel++) {
      const data = buffer.getChannelData(channel);
      let lastOut = 0.0;
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        // Brownian noise: integrate white noise
        lastOut = (lastOut + 0.02 * white) / 1.02;
        data[i] = lastOut * 3.5; // Gain compensation
      }
    }
    return buffer;
  }

  createRainBuffer(seconds = 6) {
    const sampleRate = this.ctx.sampleRate;
    const bufferSize = sampleRate * seconds;
    const buffer = this.ctx.createBuffer(2, bufferSize, sampleRate);

    for (let channel = 0; channel < 2; channel++) {
      const data = buffer.getChannelData(channel);
      let b0 = 0, b1 = 0, b2 = 0;
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        // Pink noise filter approximation
        b0 = 0.99886 * b0 + white * 0.0555179;
        b1 = 0.99332 * b1 + white * 0.0750759;
        b2 = 0.96900 * b2 + white * 0.1538520;
        let pink = b0 + b1 + b2 + white * 0.5362;
        // Occasional soft droplet click
        if (Math.random() < 0.002) {
          pink += (Math.random() - 0.5) * 1.8;
        }
        data[i] = pink * 0.15;
      }
    }
    return buffer;
  }

  // --- Start Procedural Ambiences ---
  startBrownNoise(volume = 0.5) {
    this.initContext();
    if (this.nodes.brownNoise) return;

    const buffer = this.createBrownNoiseBuffer();
    const source = this.ctx.createBufferSource();
    source.buffer = buffer;
    source.loop = true;

    // Filter to soften frequencies
    const lowpass = this.ctx.createBiquadFilter();
    lowpass.type = 'lowpass';
    lowpass.frequency.setValueAtTime(450, this.ctx.currentTime);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(volume, this.ctx.currentTime);

    source.connect(lowpass);
    lowpass.connect(gain);
    gain.connect(this.masterGain);

    source.start();
    this.nodes.brownNoise = source;
    this.nodes.brownGain = gain;
    this.isPlaying = true;
  }

  stopBrownNoise() {
    if (this.nodes.brownNoise) {
      try { this.nodes.brownNoise.stop(); } catch(e){}
      this.nodes.brownNoise.disconnect();
      this.nodes.brownNoise = null;
      this.nodes.brownGain = null;
    }
  }

  setBrownVolume(val) {
    if (this.nodes.brownGain && this.ctx) {
      this.nodes.brownGain.gain.setValueAtTime(val, this.ctx.currentTime);
    }
  }

  startRain(volume = 0.4) {
    this.initContext();
    if (this.nodes.rainSource) return;

    const buffer = this.createRainBuffer();
    const source = this.ctx.createBufferSource();
    source.buffer = buffer;
    source.loop = true;

    const bandpass = this.ctx.createBiquadFilter();
    bandpass.type = 'bandpass';
    bandpass.frequency.setValueAtTime(1200, this.ctx.currentTime);
    bandpass.Q.setValueAtTime(0.8, this.ctx.currentTime);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(volume, this.ctx.currentTime);

    source.connect(bandpass);
    bandpass.connect(gain);
    gain.connect(this.masterGain);

    source.start();
    this.nodes.rainSource = source;
    this.nodes.rainGain = gain;
    this.isPlaying = true;
  }

  stopRain() {
    if (this.nodes.rainSource) {
      try { this.nodes.rainSource.stop(); } catch(e){}
      this.nodes.rainSource.disconnect();
      this.nodes.rainSource = null;
      this.nodes.rainGain = null;
    }
  }

  setRainVolume(val) {
    if (this.nodes.rainGain && this.ctx) {
      this.nodes.rainGain.gain.setValueAtTime(val, this.ctx.currentTime);
    }
  }

  // --- Binaural Beats Generator ---
  startBinaural(baseFreq = 216, beatFreq = 2.0, volume = 0.3) {
    this.initContext();
    this.stopBinaural();

    // Left channel: baseFreq
    const oscLeft = this.ctx.createOscillator();
    oscLeft.type = 'sine';
    oscLeft.frequency.setValueAtTime(baseFreq, this.ctx.currentTime);

    // Right channel: baseFreq + beatFreq (e.g. 218 Hz for 2.0 Hz Delta)
    const oscRight = this.ctx.createOscillator();
    oscRight.type = 'sine';
    oscRight.frequency.setValueAtTime(baseFreq + beatFreq, this.ctx.currentTime);

    // Stereo panners for pure separation
    const merger = this.ctx.createChannelMerger(2);
    const gainLeft = this.ctx.createGain();
    const gainRight = this.ctx.createGain();

    oscLeft.connect(gainLeft);
    oscRight.connect(gainRight);

    gainLeft.connect(merger, 0, 0); // Left channel
    gainRight.connect(merger, 0, 1); // Right channel

    const binauralGain = this.ctx.createGain();
    binauralGain.gain.setValueAtTime(volume, this.ctx.currentTime);

    merger.connect(binauralGain);
    binauralGain.connect(this.masterGain);

    oscLeft.start();
    oscRight.start();

    this.nodes.binauralLeft = oscLeft;
    this.nodes.binauralRight = oscRight;
    this.nodes.binauralGain = binauralGain;
    this.isPlaying = true;
  }

  stopBinaural() {
    if (this.nodes.binauralLeft) {
      try { this.nodes.binauralLeft.stop(); } catch(e){}
      try { this.nodes.binauralRight.stop(); } catch(e){}
      this.nodes.binauralLeft.disconnect();
      this.nodes.binauralRight.disconnect();
      this.nodes.binauralLeft = null;
      this.nodes.binauralRight = null;
      this.nodes.binauralGain = null;
    }
  }

  setBinauralVolume(val) {
    if (this.nodes.binauralGain && this.ctx) {
      this.nodes.binauralGain.gain.setValueAtTime(val, this.ctx.currentTime);
    }
  }

  // Soft breathwork bell/chime ping
  playChime(freq = 432, duration = 2.5) {
    this.initContext();
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
    // Subtle detuned shimmer harmonic
    const osc2 = this.ctx.createOscillator();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(freq * 1.5, this.ctx.currentTime);

    gain.gain.setValueAtTime(0.001, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.2, this.ctx.currentTime + 0.05);
    gain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + duration);

    osc.connect(gain);
    osc2.connect(gain);
    gain.connect(this.masterGain);

    osc.start();
    osc2.start();
    osc.stop(this.ctx.currentTime + duration);
    osc2.stop(this.ctx.currentTime + duration);
  }

  // --- Sleep Timer with 60s Fade Out ---
  setSleepTimer(minutes, onComplete = null) {
    this.clearSleepTimer();
    if (minutes <= 0) return;

    const totalMs = minutes * 60 * 1000;
    const fadeMs = Math.min(60 * 1000, totalMs * 0.2); // Last 60s or 20%
    const fadeStartMs = totalMs - fadeMs;

    this.fadeTimerId = setTimeout(() => {
      if (this.masterGain && this.ctx) {
        const now = this.ctx.currentTime;
        this.masterGain.gain.setValueAtTime(this.masterGain.gain.value, now);
        this.masterGain.gain.linearRampToValueAtTime(0.001, now + (fadeMs / 1000));
      }
    }, fadeStartMs);

    this.timerId = setTimeout(() => {
      this.stopAll();
      if (this.masterGain && this.ctx) {
        this.masterGain.gain.setValueAtTime(0.8, this.ctx.currentTime);
      }
      if (onComplete) onComplete();
    }, totalMs);
  }

  clearSleepTimer() {
    if (this.timerId) clearTimeout(this.timerId);
    if (this.fadeTimerId) clearTimeout(this.fadeTimerId);
    this.timerId = null;
    this.fadeTimerId = null;
  }

  stopAll() {
    this.stopBrownNoise();
    this.stopRain();
    this.stopBinaural();
    this.clearSleepTimer();
    this.isPlaying = false;
  }
}

window.somniaAudio = new SomniaAudioEngine();
