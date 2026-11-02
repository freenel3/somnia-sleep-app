/**
 * SOMNIA Web Audio Procedural Sound Engine 2026
 * Generates pure procedural brown noise, rain, ocean waves, and binaural delta/theta beats.
 * Zero external audio files required. 100% offline & royalty-free.
 * 
 * Includes 24/7 Background Audio Keepalive (sub-audible LSB dither loop),
 * MediaSession API integration for Android lockscreen playback,
 * Screen WakeLock, and robust AudioContext auto-resume on screen lock/unlock.
 */
class SomniaAudioEngine {
  constructor() {
    this.ctx = null;
    this.masterGain = null;
    this.timerId = null;
    this.fadeTimerId = null;
    this.isPlaying = false;
    this.wakeLock = null;
    this.keepAliveAudio = null;
    this._subAudibleURI = null;
    this._lifecycleHooked = false;

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

  // --- Sub-Audible KeepAlive Mechanism (Prevents Android Chrome Doze sleep) ---
  _generateSubAudibleWavURI() {
    if (this._subAudibleURI) return this._subAudibleURI;
    const sampleRate = 8000;
    const numSamples = 1600; // 0.2s of sub-audible 1 LSB dither (keeps Android DSP HAL awake)
    const buffer = new ArrayBuffer(44 + numSamples * 2);
    const view = new DataView(buffer);

    const writeString = (offset, str) => {
      for (let i = 0; i < str.length; i++) view.setUint8(offset + i, str.charCodeAt(i));
    };

    writeString(0, 'RIFF');
    view.setUint32(4, 36 + numSamples * 2, true);
    writeString(8, 'WAVE');
    writeString(12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true); // PCM
    view.setUint16(22, 1, true); // Mono
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * 2, true);
    view.setUint16(32, 2, true); // Block align
    view.setUint16(34, 16, true); // Bits per sample
    writeString(36, 'data');
    view.setUint32(40, numSamples * 2, true);

    let offset = 44;
    for (let i = 0; i < numSamples; i++) {
      const sample = (i % 2 === 0) ? 1 : -1;
      view.setInt16(offset, sample, true);
      offset += 2;
    }

    const blob = new Blob([buffer], { type: 'audio/wav' });
    this._subAudibleURI = URL.createObjectURL(blob);
    return this._subAudibleURI;
  }

  _ensureKeepAliveElement() {
    if (!this.keepAliveAudio) {
      const audio = document.createElement('audio');
      audio.setAttribute('loop', 'true');
      audio.setAttribute('playsinline', 'true');
      audio.setAttribute('webkit-playsinline', 'true');
      audio.setAttribute('preload', 'auto');
      audio.style.position = 'fixed';
      audio.style.width = '1px';
      audio.style.height = '1px';
      audio.style.opacity = '0.001';
      audio.style.pointerEvents = 'none';
      audio.style.top = '-9999px';
      audio.src = this._generateSubAudibleWavURI();
      document.body.appendChild(audio);
      this.keepAliveAudio = audio;
    }
    return this.keepAliveAudio;
  }

  async startBackgroundKeepAlive() {
    const audio = this._ensureKeepAliveElement();
    try {
      if (audio.paused) {
        await audio.play();
      }
    } catch (e) {
      console.warn('[SomniaAudio] Keepalive play deferred until gesture:', e);
    }
    this._initMediaSession();
    this.requestWakeLock();
  }

  stopBackgroundKeepAlive() {
    if (this.keepAliveAudio && !this.keepAliveAudio.paused) {
      try {
        this.keepAliveAudio.pause();
      } catch (e) {}
    }
    if ('mediaSession' in navigator) {
      navigator.mediaSession.playbackState = 'paused';
    }
    this.releaseWakeLock();
  }

  _initMediaSession() {
    if (!('mediaSession' in navigator)) return;

    try {
      navigator.mediaSession.metadata = new MediaMetadata({
        title: 'SOMNIA • Нейро-Кокон Сна',
        artist: 'Коричневый шум & Дельта 2.0 Гц',
        album: 'Циркадный автопилот засыпания 2026',
        artwork: [
          { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png' }
        ]
      });

      const handlers = [
        ['play', () => {
          this.resumeAudioContext();
          if (window.onMediaSessionPlay) window.onMediaSessionPlay();
        }],
        ['pause', () => {
          this.stopAll();
          if (window.onMediaSessionPause) window.onMediaSessionPause();
        }],
        ['stop', () => {
          this.stopAll();
          if (window.onMediaSessionPause) window.onMediaSessionPause();
        }]
      ];

      handlers.forEach(([action, handler]) => {
        try {
          navigator.mediaSession.setActionHandler(action, handler);
        } catch (e) {}
      });

      navigator.mediaSession.playbackState = 'playing';
    } catch (e) {
      console.warn('[SomniaAudio] MediaSession init error:', e);
    }
  }

  async requestWakeLock() {
    if ('wakeLock' in navigator && !this.wakeLock) {
      try {
        this.wakeLock = await navigator.wakeLock.request('screen');
        this.wakeLock.addEventListener('release', () => {
          this.wakeLock = null;
        });
      } catch (err) {
        // May fail if low battery or tab in background, keepalive audio handles that
      }
    }
  }

  releaseWakeLock() {
    if (this.wakeLock) {
      try {
        this.wakeLock.release();
      } catch (e) {}
      this.wakeLock = null;
    }
  }

  _setupLifecycleHooks() {
    if (this._lifecycleHooked) return;
    this._lifecycleHooked = true;

    // 1. Visibility Change (Screen off/on or app switch)
    document.addEventListener('visibilitychange', () => {
      if (this.isPlaying) {
        this.resumeAudioContext();
        if (this.keepAliveAudio && this.keepAliveAudio.paused) {
          this.keepAliveAudio.play().catch(() => {});
        }
        if (!document.hidden) {
          this.requestWakeLock();
        }
      }
    });

    // 2. AudioContext statechange
    if (this.ctx) {
      this.ctx.onstatechange = () => {
        if (this.isPlaying && this.ctx.state === 'suspended') {
          this.ctx.resume().catch(() => {});
        }
      };
    }

    // 3. User interaction unlocker
    const unlock = () => {
      if (this.isPlaying && this.ctx && this.ctx.state === 'suspended') {
        this.ctx.resume().catch(() => {});
      }
    };
    ['touchstart', 'touchend', 'click'].forEach(evt => {
      document.addEventListener(evt, unlock, { passive: true });
    });
  }

  initContext() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      this.ctx = new AudioCtx({ latencyHint: 'playback' });
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(0.8, this.ctx.currentTime);
      this.masterGain.connect(this.ctx.destination);
      this._setupLifecycleHooks();
    }
    this.resumeAudioContext();
  }

  resumeAudioContext() {
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
  }

  checkActiveSounds() {
    const hasActive = !!(this.nodes.brownNoise || this.nodes.rainSource || this.nodes.binauralLeft);
    if (!hasActive) {
      this.isPlaying = false;
      this.stopBackgroundKeepAlive();
    }
    return hasActive;
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
    this.startBackgroundKeepAlive();
  }

  stopBrownNoise() {
    if (this.nodes.brownNoise) {
      try { this.nodes.brownNoise.stop(); } catch(e){}
      this.nodes.brownNoise.disconnect();
      this.nodes.brownNoise = null;
      this.nodes.brownGain = null;
    }
    this.checkActiveSounds();
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
    this.startBackgroundKeepAlive();
  }

  stopRain() {
    if (this.nodes.rainSource) {
      try { this.nodes.rainSource.stop(); } catch(e){}
      this.nodes.rainSource.disconnect();
      this.nodes.rainSource = null;
      this.nodes.rainGain = null;
    }
    this.checkActiveSounds();
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
    this.startBackgroundKeepAlive();
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
    this.checkActiveSounds();
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

  // Singing bowl chime for sunrise / wake
  triggerSingingBowl(freq = 432) {
    this.playChime(freq, 3.5);
  }

  // --- Sleep Timer with 60s Fade Out (Background Doze resilient) ---
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
    this.stopBackgroundKeepAlive();
  }
}

window.somniaAudio = new SomniaAudioEngine();
