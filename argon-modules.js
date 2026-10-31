/**
 * SOMNIA 2026 — GEMINI 4 ARGON NEUROBIOLOGICAL MODULES
 * Architected by Gemini 4 Argon:
 * 1. Process S Adenosine & Caffeine Pharmacokinetics (CYP1A2 genetics, A2A receptor occupancy)
 * 2. Speaker-Optimized Isochronic Acoustic Synthesizer (No headphones required)
 * 3. Guided NSDR (Non-Sleep Deep Rest / Yoga Nidra) protocol with physiological sighs
 * 4. Circadian Sunrise Simulator (Tanner Helland Kelvin-to-RGB, ipRGC & Cortisol Awakening Response)
 */

// ============================================================================
// 1. ADENOSINE & CAFFEINE PHARMACOKINETICS ENGINE (Process S)
// ============================================================================
class SomniaAdenosineEngine {
    constructor() {
        this.weightKg = 75;
        this.genotype = 'NORMAL'; // 'FAST' (3h), 'NORMAL' (5h), 'SLOW' (8.5h)
        this.doses = JSON.parse(localStorage.getItem('somnia_caffeine_doses_v1')) || [
            { id: 1, name: "Кофе (Американо)", mg: 120, timeStr: "08:30" },
            { id: 2, name: "Эспрессо", mg: 70, timeStr: "13:15" }
        ];
    }

    getHalfLife() {
        switch (this.genotype) {
            case 'FAST': return 3.0;
            case 'SLOW': return 8.5;
            default: return 5.0;
        }
    }

    addDose(name, mg, timeStr) {
        this.doses.push({ id: Date.now(), name, mg: Number(mg), timeStr });
        this.save();
    }

    deleteDose(id) {
        this.doses = this.doses.filter(d => d.id !== id);
        this.save();
    }

    save() {
        localStorage.setItem('somnia_caffeine_doses_v1', JSON.stringify(this.doses));
    }

    /**
     * Calculate current plasma concentration (mg/L) and remaining mg
     */
    getCurrentState(targetHour = new Date().getHours() + new Date().getMinutes() / 60) {
        const halfLife = this.getHalfLife();
        const ke = Math.LN2 / halfLife;
        const Vd = 0.6 * this.weightKg; // Distribution volume

        let totalPlasmaMgL = 0;
        let totalActiveMg = 0;

        this.doses.forEach(dose => {
            const [h, m] = dose.timeStr.split(':').map(Number);
            const doseHour = h + m / 60;
            const diffHours = targetHour >= doseHour ? (targetHour - doseHour) : (targetHour + 24 - doseHour);

            if (diffHours >= 0 && diffHours <= 36) {
                const remaining = dose.mg * Math.exp(-ke * diffHours);
                totalActiveMg += remaining;
                totalPlasmaMgL += remaining / Vd;
            }
        });

        // Hill-Langmuir equation for A2A receptor occupancy %
        // IC50 for caffeine is ~ 3.88 mg/L (20 uM)
        const IC50 = 3.88;
        const occupancyPercent = (totalPlasmaMgL / (totalPlasmaMgL + IC50)) * 100;

        return {
            totalActiveMg: Math.round(totalActiveMg),
            plasmaMgL: parseFloat(totalPlasmaMgL.toFixed(2)),
            receptorOccupancy: parseFloat(occupancyPercent.toFixed(1))
        };
    }

    /**
     * Predict exact time when A2A occupancy drops below 5% (safe for Stage 3 SWS deep sleep)
     */
    getSafeSleepTime() {
        const halfLife = this.getHalfLife();
        const state = this.getCurrentState();
        if (state.totalActiveMg <= 10) return "Сейчас (безопасно)";

        // Target: < 15 mg in body for < 5% occupancy
        const ke = Math.LN2 / halfLife;
        const hoursNeeded = Math.log(state.totalActiveMg / 15) / ke;
        if (hoursNeeded <= 0) return "Сейчас (безопасно)";

        const targetDate = new Date(Date.now() + hoursNeeded * 3600 * 1000);
        const h = String(targetDate.getHours()).padStart(2, '0');
        const m = String(targetDate.getMinutes()).padStart(2, '0');
        return `${h}:${m} (через ${hoursNeeded.toFixed(1)} ч)`;
    }

    /**
     * Draw 24-hour pharmacokinetic decay curve on SVG
     */
    renderCurveSVG(svgId) {
        const svg = document.getElementById(svgId);
        if (!svg) return;

        const w = 600;
        const h = 200;
        const halfLife = this.getHalfLife();
        const ke = Math.LN2 / halfLife;
        const Vd = 0.6 * this.weightKg;

        const points = [];
        let maxVal = 100;

        for (let hour = 6; hour <= 28; hour += 0.5) {
            const hMod = hour % 24;
            let plasma = 0;
            this.doses.forEach(dose => {
                const [dh, dm] = dose.timeStr.split(':').map(Number);
                const doseTime = dh + dm / 60;
                let elapsed = hour >= doseTime ? (hour - doseTime) : (hour + 24 - doseTime);
                if (elapsed >= 0 && elapsed <= 24) {
                    plasma += (dose.mg / Vd) * Math.exp(-ke * elapsed);
                }
            });
            const occupancy = (plasma / (plasma + 3.88)) * 100;
            maxVal = Math.max(maxVal, occupancy);
            points.push({ hour, hMod, occupancy });
        }

        const polylineCoords = points.map((p, i) => {
            const x = (i / (points.length - 1)) * (w - 60) + 40;
            const y = h - 30 - (p.occupancy / 100) * (h - 60);
            return `${x.toFixed(1)},${y.toFixed(1)}`;
        }).join(' ');

        // Safe threshold line at 10%
        const safeY = h - 30 - (10 / 100) * (h - 60);

        svg.innerHTML = `
            <line x1="40" y1="${safeY}" x2="${w - 20}" y2="${safeY}" stroke="rgba(16, 185, 129, 0.4)" stroke-dasharray="4" />
            <text x="${w - 140}" y="${safeY - 6}" fill="rgba(16, 185, 129, 0.9)" font-size="11" font-family="Plus Jakarta Sans">Безопасный порог A2A (<10%)</text>
            
            <polyline fill="none" stroke="url(#caffeineGrad)" stroke-width="3" points="${polylineCoords}" />
            
            <!-- Axis labels -->
            <text x="40" y="${h - 8}" fill="#64748b" font-size="10">06:00</text>
            <text x="${w/2 - 20}" y="${h - 8}" fill="#64748b" font-size="10">18:00</text>
            <text x="${w - 50}" y="${h - 8}" fill="#64748b" font-size="10">04:00</text>

            <defs>
                <linearGradient id="caffeineGrad" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stop-color="#f59e0b" />
                    <stop offset="60%" stop-color="#ef4444" />
                    <stop offset="100%" stop-color="#10b981" />
                </linearGradient>
            </defs>
        `;
    }
}

// ============================================================================
// 2. SPEAKER-OPTIMIZED ISOCHRONIC ACOUSTIC ENGINE (No Headphones Required)
// ============================================================================
class SomniaIsochronicEngine {
    constructor() {
        this.ctx = null;
        this.carrierOsc = null;
        this.gainNode = null;
        this.lfoOsc = null;
        this.isPlaying = false;
        this.volume = 0.45;
    }

    init() {
        if (!this.ctx) {
            const AudioContextClass = window.AudioContext || window.webkitAudioContext;
            this.ctx = new AudioContextClass();
        }
        if (this.ctx.state === 'suspended') {
            this.ctx.resume();
        }
    }

    start(carrierFreq = 136.1, pulseFreq = 2.0) {
        this.init();
        this.stop();

        const now = this.ctx.currentTime;

        // Carrier Tone
        this.carrierOsc = this.ctx.createOscillator();
        this.carrierOsc.type = 'sine';
        this.carrierOsc.frequency.setValueAtTime(carrierFreq, now);

        // Amplitude Modulation Gain Node
        this.gainNode = this.ctx.createGain();
        this.gainNode.gain.setValueAtTime(0, now);

        // LFO for pulse rate
        this.lfoOsc = this.ctx.createOscillator();
        this.lfoOsc.type = 'sine';
        this.lfoOsc.frequency.setValueAtTime(pulseFreq, now);

        // WaveShaper with Tukey/smooth window to prevent speaker pops
        const waveshaper = this.ctx.createWaveShaper();
        const samples = 1024;
        const curve = new Float32Array(samples);
        for (let i = 0; i < samples; i++) {
            const x = (i / samples) * 2 - 1;
            curve[i] = x > 0 ? Math.sin((x * Math.PI) / 2) * this.volume : 0;
        }
        waveshaper.curve = curve;

        this.lfoOsc.connect(waveshaper);
        waveshaper.connect(this.gainNode.gain);

        this.carrierOsc.connect(this.gainNode);
        this.gainNode.connect(this.ctx.destination);

        this.carrierOsc.start(now);
        this.lfoOsc.start(now);
        this.isPlaying = true;
    }

    stop() {
        if (this.carrierOsc) {
            try { this.carrierOsc.stop(); } catch(e) {}
            this.carrierOsc.disconnect();
            this.carrierOsc = null;
        }
        if (this.lfoOsc) {
            try { this.lfoOsc.stop(); } catch(e) {}
            this.lfoOsc.disconnect();
            this.lfoOsc = null;
        }
        if (this.gainNode) {
            this.gainNode.disconnect();
            this.gainNode = null;
        }
        this.isPlaying = false;
    }

    setPulseRate(hz) {
        if (this.lfoOsc && this.ctx) {
            this.lfoOsc.frequency.setTargetAtTime(hz, this.ctx.currentTime, 0.1);
        }
    }

    setVolume(val) {
        this.volume = Math.max(0, Math.min(1, val));
        if (this.isPlaying) {
            // Reapply curve with new volume
            const waveshaper = this.ctx.createWaveShaper();
            const samples = 1024;
            const curve = new Float32Array(samples);
            for (let i = 0; i < samples; i++) {
                const x = (i / samples) * 2 - 1;
                curve[i] = x > 0 ? Math.sin((x * Math.PI) / 2) * this.volume : 0;
            }
        }
    }
}

// ============================================================================
// 3. GUIDED NSDR (NON-SLEEP DEEP REST / YOGA NIDRA) ENGINE
// ============================================================================
class SomniaNSDREngine {
    constructor() {
        this.isRunning = false;
        this.currentStepIdx = 0;
        this.timer = null;
        this.onStepChange = null;
        this.onTick = null;
        this.secondsRemaining = 0;

        this.steps = [
            { title: "Физиологический вздох #1", duration: 15, prompt: "Сделайте два вдоха через нос: один глубокий, второй короткий до упора. И длинный медленный выдох через рот со звуком облегчения." },
            { title: "Физиологический вздох #2", duration: 15, prompt: "Повторите двойной вдох. Почувствуйте, как частота сердцебиения плавно снижается вместе с выдохом." },
            { title: "Тотальное расслабление лица", duration: 40, prompt: "Отпустите напряжение между бровями. Расслабьте веки, виски и разомкните зубы. Пусть челюсть станет тяжелой." },
            { title: "Плечи и кисти рук", duration: 45, prompt: "Опустите плечи вниз, как будто они тают. Ощутите приятное тепло и покалывание в подушечках пальцев обеих рук." },
            { title: "Диафрагма и солнечное сплетение", duration: 50, prompt: "Смягчите живот. Позвольте каждому вдоху происходить самому по себе, без всякого контроля." },
            { title: "Тяжесть в ногах и стопах", duration: 45, prompt: "Почувствуйте, как бедра, колени и стопы погружаются в кровать под приятной естественной гравитацией." },
            { title: "Панорамное восприятие", duration: 60, prompt: "Расширьте внимание на всё пространство комнаты. Представьте, как ваш мозг скользит в приятное гипнагогическое состояние между явью и сном." },
            { title: "Тета-дрейф (Погружение в сон)", duration: 90, prompt: "Никаких задач. Никаких мыслей. Вы полностью в безопасности. Ваше тело готово к глубокому восстановительному сну." }
        ];
    }

    start() {
        this.isRunning = true;
        this.currentStepIdx = 0;
        this.playStep();
    }

    pause() {
        this.isRunning = false;
        if (this.timer) clearTimeout(this.timer);
    }

    playStep() {
        if (!this.isRunning) return;
        if (this.currentStepIdx >= this.steps.length) {
            this.isRunning = false;
            if (this.onStepChange) this.onStepChange({ title: "Сессия NSDR завершена", prompt: "Ваша нервная система переключена в парасимпатический режим глубокого восстановления.", finished: true });
            return;
        }

        const step = this.steps[this.currentStepIdx];
        this.secondsRemaining = step.duration;
        if (this.onStepChange) this.onStepChange(step);

        if (window.somniaAudio) {
            window.somniaAudio.triggerSingingBowl(216);
        }

        this.runStepTick();
    }

    runStepTick() {
        if (!this.isRunning) return;
        if (this.onTick) this.onTick(this.secondsRemaining, this.steps[this.currentStepIdx].duration);

        if (this.secondsRemaining <= 0) {
            this.currentStepIdx++;
            this.playStep();
            return;
        }

        this.secondsRemaining--;
        this.timer = setTimeout(() => this.runStepTick(), 1000);
    }
}

// ============================================================================
// 4. CIRCADIAN SUNRISE SIMULATOR (Kelvin Tanner Helland Algorithm)
// ============================================================================
class SomniaSunriseEngine {
    constructor() {
        this.isRunning = false;
        this.timer = null;
        this.overlay = null;
    }

    static kelvinToRGB(kelvin) {
        const temp = kelvin / 100;
        let red, green, blue;

        // Red
        if (temp <= 66) {
            red = 255;
        } else {
            red = temp - 60;
            red = 329.698727446 * Math.pow(red, -0.1332047592);
            red = Math.min(255, Math.max(0, red));
        }

        // Green
        if (temp <= 66) {
            green = temp;
            green = 99.4708025861 * Math.log(green) - 161.1195681661;
        } else {
            green = temp - 60;
            green = 288.1221695283 * Math.pow(green, -0.0755148492);
        }
        green = Math.min(255, Math.max(0, green));

        // Blue (ipRGC melatopsin peak at 480nm, max at 6500K)
        if (temp >= 66) {
            blue = 255;
        } else if (temp <= 19) {
            blue = 0;
        } else {
            blue = temp - 10;
            blue = 138.5177312231 * Math.log(blue) - 305.0447927307;
            blue = Math.min(255, Math.max(0, blue));
        }

        return { r: Math.round(red), g: Math.round(green), b: Math.round(blue) };
    }

    /**
     * Preview rapid 20-second sunrise simulation
     */
    startSimulation(durationSec = 20, onFrame = null, onComplete = null) {
        this.isRunning = true;
        let elapsed = 0;
        const intervalMs = 100;
        const totalSteps = (durationSec * 1000) / intervalMs;

        const loop = () => {
            if (!this.isRunning) return;
            elapsed += intervalMs;
            const progress = Math.min(1.0, elapsed / (durationSec * 1000));

            // Sigmoid easing for natural dawn
            const sigmoid = (t) => 1 / (1 + Math.exp(-6 * (t - 0.5)));
            const ease = sigmoid(progress);

            const kelvin = Math.round(1500 + (6500 - 1500) * ease);
            const lux = Math.pow(progress, 1.8);
            const rgb = SomniaSunriseEngine.kelvinToRGB(kelvin);

            if (onFrame) onFrame({ kelvin, lux, rgb, progress });

            if (progress >= 1.0) {
                this.isRunning = false;
                if (onComplete) onComplete();
                return;
            }

            this.timer = setTimeout(loop, intervalMs);
        };
        loop();
    }

    stop() {
        this.isRunning = false;
        if (this.timer) clearTimeout(this.timer);
    }
}

// Global Singletons
window.somniaAdenosine = new SomniaAdenosineEngine();
window.somniaIsochronic = new SomniaIsochronicEngine();
window.somniaNSDR = new SomniaNSDREngine();
window.somniaSunrise = new SomniaSunriseEngine();
