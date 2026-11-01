/**
 * SOMNIA 2026 - Main Application Controller
 * Connects Audio Engine, Sleep Twin, Breathwork, and Tracker into a seamless UI.
 */

document.addEventListener('DOMContentLoaded', () => {
  initAmbientCanvas();
  initTabs();
  initAutopilot();
  initSleepTwin();
  initBreathworkUI();
  initCyclesAndNaps();
  initTrackerUI();
  initMelatoninShield();
  startClock();
  initArgonModules();
  initTwinSubtabs();
  initSleepyCourseUI();
  initMiFitSyncUI();
  initSleepyAICoachUI();
});

// =====================================================================
// 1. ATMOSPHERIC CANVAS (Subtle Deep Space Drifting Stars)
// =====================================================================
function initAmbientCanvas() {
  const canvas = document.getElementById('ambient-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  let width = (canvas.width = window.innerWidth);
  let height = (canvas.height = window.innerHeight);

  window.addEventListener('resize', () => {
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;
  });

  const stars = Array.from({ length: 70 }, () => ({
    x: Math.random() * width,
    y: Math.random() * height,
    radius: Math.random() * 1.5 + 0.3,
    alpha: Math.random(),
    speed: Math.random() * 0.005 + 0.002,
  }));

  function animate() {
    ctx.clearRect(0, 0, width, height);
    for (let star of stars) {
      star.alpha += star.speed;
      if (star.alpha > 1 || star.alpha < 0) star.speed = -star.speed;
      ctx.beginPath();
      ctx.arc(star.x, star.y, star.radius, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(168, 85, 247, ${Math.abs(star.alpha) * 0.5})`;
      ctx.fill();
    }
    requestAnimationFrame(animate);
  }
  animate();
}

// =====================================================================
// 2. NATIVE HAPTICS & SYNCHRONIZED TAB NAVIGATION (2026)
// =====================================================================
const Haptics = {
  selection: () => {
    if ('vibrate' in navigator) try { navigator.vibrate(10); } catch(e){}
  },
  light: () => {
    if ('vibrate' in navigator) try { navigator.vibrate(16); } catch(e){}
  },
  medium: () => {
    if ('vibrate' in navigator) try { navigator.vibrate(28); } catch(e){}
  },
  success: () => {
    if ('vibrate' in navigator) try { navigator.vibrate([15, 50, 20]); } catch(e){}
  }
};
window.Haptics = Haptics;

function initTabs() {
  const allTriggers = document.querySelectorAll('.nav-tab-btn, .bottom-nav-item, .chip-btn');
  const tabContents = document.querySelectorAll('.tab-content');
  const bottomItems = document.querySelectorAll('.bottom-nav-item');
  const topBtns = document.querySelectorAll('.nav-tab-btn');
  const chipBtns = document.querySelectorAll('.chip-btn');

  function activateTab(targetId) {
    Haptics.selection();

    // 1. Activate tab section
    tabContents.forEach(c => c.classList.remove('active'));
    const targetContent = document.getElementById(targetId);
    if (targetContent) {
      targetContent.classList.add('active');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      if (targetId === 'tab-course' && window.sleepyCourse) {
        renderCourseUI();
      }
      if (targetId === 'tab-ai' && window.sleepyAI) {
        renderSleepyAICoach();
      }
      if (targetId === 'tab-watch' && window.miFitSync) {
        renderWatchTelemetry();
      }
      if (targetId === 'tab-tracker' && window.sleepTracker) {
        window.sleepTracker.renderSvgChart('sleep-chart-box');
      }
    }

    // 2. Sync Top Desktop Tabs
    topBtns.forEach(b => {
      b.classList.toggle('active', b.getAttribute('data-tab') === targetId);
    });

    // 3. Sync Companion Sub-chips
    chipBtns.forEach(b => {
      b.classList.toggle('active', b.getAttribute('data-tab') === targetId);
    });

    // 4. Map companion desktop sub-tabs to primary bottom 5 tabs
    let primaryBottomTab = targetId;
    if (['tab-caffeine', 'tab-nsdr', 'tab-isochronic', 'tab-cycles', 'tab-tracker'].includes(targetId)) {
      primaryBottomTab = 'tab-twin';
    } else if (targetId === 'tab-sunrise') {
      primaryBottomTab = 'tab-breath';
    }

    bottomItems.forEach(b => {
      b.classList.toggle('active', b.getAttribute('data-tab') === primaryBottomTab);
    });
  }

  allTriggers.forEach(btn => {
    btn.addEventListener('click', (e) => {
      const targetId = btn.getAttribute('data-tab');
      if (targetId) activateTab(targetId);
    });
  });
}

// =====================================================================
// 3. NIGHT AUTOPILOT (1-Click Cocoon Mode)
// =====================================================================
function initAutopilot() {
  const btnAutopilot = document.getElementById('btn-autopilot');
  const brownSlider = document.getElementById('slider-brown');
  const rainSlider = document.getElementById('slider-rain');
  const deltaSlider = document.getElementById('slider-delta');
  const timerSelect = document.getElementById('select-timer');

  let isAutopilotOn = false;

  btnAutopilot.addEventListener('click', () => {
    if (!isAutopilotOn) {
      // Start Autopilot: Brown Noise (45%) + Rain (30%) + Delta 2Hz (25%)
      window.somniaAudio.startBrownNoise(parseFloat(brownSlider.value));
      window.somniaAudio.startRain(parseFloat(rainSlider.value));
      window.somniaAudio.startBinaural(216, 2.0, parseFloat(deltaSlider.value));

      const timerMins = parseInt(timerSelect.value, 10);
      if (timerMins > 0) {
        window.somniaAudio.setSleepTimer(timerMins, () => {
          isAutopilotOn = false;
          updateButtonState();
        });
      }

      isAutopilotOn = true;
    } else {
      window.somniaAudio.stopAll();
      isAutopilotOn = false;
    }
    updateButtonState();
  });

  function updateButtonState() {
    if (isAutopilotOn) {
      btnAutopilot.classList.add('playing');
      btnAutopilot.innerHTML = '<span>⏸️</span> Остановить Автопилот';
    } else {
      btnAutopilot.classList.remove('playing');
      btnAutopilot.innerHTML = '<span>🚀</span> Запустить Автопилот Сна';
    }
  }

  // Volume sliders
  brownSlider.addEventListener('input', (e) => {
    window.somniaAudio.setBrownVolume(parseFloat(e.target.value));
  });
  rainSlider.addEventListener('input', (e) => {
    window.somniaAudio.setRainVolume(parseFloat(e.target.value));
  });
  deltaSlider.addEventListener('input', (e) => {
    window.somniaAudio.setBinauralVolume(parseFloat(e.target.value));
  });

  // Track toggles
  document.querySelectorAll('.track-toggle').forEach(btn => {
    btn.addEventListener('click', () => {
      const track = btn.getAttribute('data-track');
      const isMuted = btn.classList.toggle('muted');
      if (track === 'brown') {
        if (isMuted) window.somniaAudio.stopBrownNoise();
        else window.somniaAudio.startBrownNoise(parseFloat(brownSlider.value));
      } else if (track === 'rain') {
        if (isMuted) window.somniaAudio.stopRain();
        else window.somniaAudio.startRain(parseFloat(rainSlider.value));
      } else if (track === 'delta') {
        if (isMuted) window.somniaAudio.stopBinaural();
        else window.somniaAudio.startBinaural(216, 2.0, parseFloat(deltaSlider.value));
      }
    });
  });
}

// =====================================================================
// 4. SLEEP TWIN PREDICTOR
// =====================================================================
function initSleepTwin() {
  const inputs = {
    caffeineMg: document.getElementById('twin-caffeine-mg'),
    caffeineHoursAgo: document.getElementById('twin-caffeine-hours'),
    screenMinutesBeforeBed: document.getElementById('twin-screen-mins'),
    roomTempCelsius: document.getElementById('twin-room-temp'),
    alcoholDrinks: document.getElementById('twin-alcohol-drinks'),
  };

  const scoreVal = document.getElementById('twin-score-num');
  const scoreLabel = document.getElementById('twin-score-label');
  const insightsList = document.getElementById('twin-insights-list');
  const gaugeBox = document.getElementById('twin-gauge');

  function recalculate() {
    const data = {
      caffeineMg: parseFloat(inputs.caffeineMg.value) || 0,
      caffeineHoursAgo: parseFloat(inputs.caffeineHoursAgo.value) || 0,
      screenMinutesBeforeBed: parseFloat(inputs.screenMinutesBeforeBed.value) || 0,
      roomTempCelsius: parseFloat(inputs.roomTempCelsius.value) || 19,
      alcoholDrinks: parseFloat(inputs.alcoholDrinks.value) || 0,
    };

    const res = window.sleepEngine.predictSleepScore(data);

    scoreVal.textContent = res.score;
    scoreLabel.textContent = res.qualityLabel;
    gaugeBox.style.setProperty('--pct', `${res.score * 3.6}deg`);

    insightsList.innerHTML = res.insights
      .map(i => `<li style="font-size: 13px; color: var(--text-secondary); margin-bottom: 6px; line-height: 1.4;">${i}</li>`)
      .join('');
  }

  Object.values(inputs).forEach(input => {
    if (input) input.addEventListener('input', recalculate);
  });

  recalculate();
}

// =====================================================================
// 5. BREATHWORK CONTROLLER
// =====================================================================
function initBreathworkUI() {
  const ring = document.getElementById('breath-ring');
  const phaseText = document.getElementById('breath-phase');
  const timerText = document.getElementById('breath-timer');
  const instructText = document.getElementById('breath-instruction');
  const btnToggle = document.getElementById('btn-breath-toggle');
  const cycleCountBadge = document.getElementById('breath-cycle-badge');

  // Protocol switches
  document.querySelectorAll('.btn-protocol').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.btn-protocol').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const proto = btn.getAttribute('data-proto');
      window.breathworkEngine.setProtocol(proto);
      instructText.textContent = window.breathworkEngine.protocols[proto].description;
      resetDisplay();
    });
  });

  btnToggle.addEventListener('click', () => {
    if (window.breathworkEngine.isActive) {
      window.breathworkEngine.stop();
      btnToggle.textContent = '▶️ Начать практику';
      resetDisplay();
    } else {
      btnToggle.textContent = '⏹️ Завершить практику';
      window.breathworkEngine.start(
        (remTime, progress, cycle) => {
          timerText.textContent = Math.ceil(remTime) + 'с';
          cycleCountBadge.textContent = `Цикл: ${cycle}`;

          const action = window.breathworkEngine.currentStep.action;
          let scale = 1.0;
          if (action.includes('inhale')) {
            scale = 1.0 + progress * 0.7; // Expands to 1.7x
          } else if (action === 'hold') {
            scale = 1.7; // Stays expanded
          } else if (action === 'exhale') {
            scale = 1.7 - progress * 0.7; // Contracts back to 1.0x
          }
          ring.style.transform = `scale(${scale})`;
        },
        (step, cycle) => {
          phaseText.textContent = step.phase;
          instructText.textContent = step.text;
          cycleCountBadge.textContent = `Цикл: ${cycle}`;
        }
      );
    }
  });

  function resetDisplay() {
    ring.style.transform = 'scale(1.0)';
    phaseText.textContent = 'Готовность';
    timerText.textContent = '0с';
  }
}

// =====================================================================
// 6. CYCLES & NASA NAP STATION
// =====================================================================
function initCyclesAndNaps() {
  const wakeTimeInput = document.getElementById('calc-wake-time');
  const bedtimesContainer = document.getElementById('bedtimes-results');
  const napsContainer = document.getElementById('naps-grid');

  function updateBedtimes() {
    const val = wakeTimeInput.value || '07:30';
    const bedtimes = window.sleepEngine.calculateBedtimes(val);

    bedtimesContainer.innerHTML = bedtimes
      .map(b => `
        <div class="cycle-card ${b.isRecommended ? 'highlight' : ''}">
          <div style="font-size: 11px; font-weight: 700; color: ${b.isRecommended ? 'var(--accent-cyan)' : 'var(--text-muted)'}; text-transform: uppercase;">${b.label}</div>
          <div class="cycle-time">${b.bedtime}</div>
          <div class="cycle-duration">${b.cycles} циклов (${b.totalHours} ч)</div>
        </div>
      `)
      .join('');
  }

  if (wakeTimeInput) {
    wakeTimeInput.addEventListener('change', updateBedtimes);
    updateBedtimes();
  }

  // Populate NASA Naps
  if (napsContainer) {
    const protocols = window.sleepEngine.getNapProtocols();
    napsContainer.innerHTML = protocols
      .map(p => `
        <div class="cycle-card">
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <span style="font-weight: 700; font-size: 14px; color: #FFFFFF;">${p.name}</span>
            <span style="font-size: 11px; padding: 2px 6px; background: rgba(56, 189, 248, 0.2); border-radius: 8px; color: var(--accent-cyan);">${p.duration} мин</span>
          </div>
          <div style="font-size: 11px; color: var(--text-secondary); margin: 6px 0;">${p.benefits}</div>
          <button class="btn-nap-start" data-mins="${p.duration}" style="width: 100%; margin-top: 8px; padding: 8px; border: 1px solid var(--border-glow); background: rgba(99, 102, 241, 0.2); color: #FFF; border-radius: 8px; cursor: pointer; font-size: 12px; font-weight: 600;">Включить Nap</button>
        </div>
      `)
      .join('');

    document.querySelectorAll('.btn-nap-start').forEach(btn => {
      btn.addEventListener('click', () => {
        const mins = parseInt(btn.getAttribute('data-mins'), 10);
        window.somniaAudio.startBrownNoise(0.4);
        window.somniaAudio.startRain(0.3);
        window.somniaAudio.setSleepTimer(mins, () => {
          alert(`⏰ Ваша сессия ${mins} мин завершена! Просыпайтесь бодрым.`);
        });
        alert(`⏱️ Режим сна на ${mins} мин запущен с таймером и мягким звуком!`);
      });
    });
  }
}

// =====================================================================
// 7. TRACKER & DREAM STUDIO
// =====================================================================
function initTrackerUI() {
  const form = document.getElementById('dream-log-form');
  const debtBox = document.getElementById('debt-summary-box');
  const questsContainer = document.getElementById('quests-container');

  function updateDebtSummary() {
    const debt = window.sleepTracker.calculateSleepDebt();
    if (debtBox) {
      debtBox.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
          <span style="font-size: 13px; color: var(--text-secondary);">Сонный долг (за 7 дней):</span>
          <span style="font-size: 16px; font-weight: 800; color: ${debt.debtHours > 3 ? 'var(--accent-rose)' : 'var(--accent-emerald)'};">${debt.debtHours > 0 ? `+${debt.debtHours} ч дефицита` : `${debt.debtHours} ч (норма)`}</span>
        </div>
        <div style="font-size: 11px; color: var(--text-muted);">${debt.status}</div>
      `;
    }
  }

  function renderQuests() {
    if (!questsContainer) return;
    const quests = window.sleepTracker.getDailyQuests();
    questsContainer.innerHTML = quests
      .map(q => `
        <div class="quest-item ${q.done ? 'done' : ''}" data-id="${q.id}">
          <input type="checkbox" class="quest-check" ${q.done ? 'checked' : ''} />
          <span style="font-size: 13px; color: var(--text-secondary);">${q.text}</span>
        </div>
      `)
      .join('');

    questsContainer.querySelectorAll('.quest-item').forEach(el => {
      el.addEventListener('click', () => {
        const qid = el.getAttribute('data-id');
        window.sleepTracker.toggleQuest(qid);
        renderQuests();
      });
    });
  }

  if (form) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const hours = document.getElementById('log-hours').value;
      const score = document.getElementById('log-quality').value;
      const notes = document.getElementById('log-dream-notes').value;
      const isLucid = document.getElementById('log-is-lucid').checked;

      window.sleepTracker.addLog({
        durationHours: hours,
        qualityScore: score,
        dreamNotes: notes,
        isLucid,
      });

      form.reset();
      updateDebtSummary();
      window.sleepTracker.renderSvgChart('sleep-chart-box');
      alert('✨ Запись о сне и сновидении успешно сохранена!');
    });
  }

  updateDebtSummary();
  renderQuests();
  window.sleepTracker.renderSvgChart('sleep-chart-box');
}

// =====================================================================
// 8. MELATONIN SHIELD (630nm Monochromatic Ruby Mode)
// =====================================================================
function initMelatoninShield() {
  const btnShield = document.getElementById('btn-melatonin-shield');
  if (!btnShield) return;

  btnShield.addEventListener('click', () => {
    const isActive = document.body.classList.toggle('melatonin-shield');
    btnShield.classList.toggle('active', isActive);
  });
}

function startClock() {
  const clockEl = document.getElementById('shield-clock');
  function tick() {
    const now = new Date();
    const hh = String(now.getHours()).padStart(2, '0');
    const mm = String(now.getMinutes()).padStart(2, '0');
    if (clockEl) clockEl.textContent = `${hh}:${mm}`;
  }
  setInterval(tick, 1000);
  tick();
}


// =====================================================================
// 9. GEMINI 4 ARGON NEUROBIOLOGICAL MODULES CONTROLLER
// =====================================================================
function initArgonModules() {
  if (!window.somniaAdenosine) return;

  // --- 1. Caffeine & Adenosine Controller ---
  const activeMgEl = document.getElementById('caffeine-active-mg');
  const occupancyEl = document.getElementById('caffeine-occupancy');
  const safeTimeEl = document.getElementById('caffeine-safe-time');
  const genotypeSelect = document.getElementById('caffeine-genotype-select');
  const dosesListEl = document.getElementById('caffeine-doses-list');
  const btnAddDose = document.getElementById('btn-add-dose');
  const doseNameInput = document.getElementById('new-dose-name');
  const doseMgInput = document.getElementById('new-dose-mg');
  const doseTimeInput = document.getElementById('new-dose-time');

  // Set default time to current HH:MM
  if (doseTimeInput) {
    const now = new Date();
    doseTimeInput.value = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
  }

  function updateCaffeineUI() {
    const state = window.somniaAdenosine.getCurrentState();
    if (activeMgEl) activeMgEl.textContent = `${state.totalActiveMg} мг`;
    if (occupancyEl) {
      occupancyEl.textContent = `${state.receptorOccupancy}%`;
      occupancyEl.style.color = state.receptorOccupancy > 25 ? '#F43F5E' : (state.receptorOccupancy > 10 ? '#F59E0B' : '#10B981');
    }
    if (safeTimeEl) safeTimeEl.textContent = window.somniaAdenosine.getSafeSleepTime();

    // Render Doses
    if (dosesListEl) {
      dosesListEl.innerHTML = window.somniaAdenosine.doses.map(d => `
        <div class="dose-pill">
          <span>☕ ${d.name} (${d.mg} мг) в ${d.timeStr}</span>
          <span class="dose-delete" data-id="${d.id}">✕</span>
        </div>
      `).join('');

      dosesListEl.querySelectorAll('.dose-delete').forEach(btn => {
        btn.addEventListener('click', (e) => {
          const id = Number(e.target.getAttribute('data-id'));
          window.somniaAdenosine.deleteDose(id);
          updateCaffeineUI();
        });
      });
    }

    // Render Curve
    window.somniaAdenosine.renderCurveSVG('caffeine-svg-curve');
  }

  if (genotypeSelect) {
    genotypeSelect.addEventListener('change', (e) => {
      window.somniaAdenosine.genotype = e.target.value;
      updateCaffeineUI();
    });
  }

  if (btnAddDose) {
    btnAddDose.addEventListener('click', () => {
      const name = doseNameInput.value.trim() || 'Кофе';
      const mg = Number(doseMgInput.value) || 80;
      const time = doseTimeInput.value || '12:00';
      window.somniaAdenosine.addDose(name, mg, time);
      doseNameInput.value = '';
      updateCaffeineUI();
    });
  }

  updateCaffeineUI();

  // --- 2. NSDR Session Controller ---
  const btnNsdrStart = document.getElementById('btn-nsdr-start');
  const btnNsdrPause = document.getElementById('btn-nsdr-pause');
  const nsdrStageTitle = document.getElementById('nsdr-stage-title');
  const nsdrPromptText = document.getElementById('nsdr-prompt-text');
  const nsdrTimerDisplay = document.getElementById('nsdr-timer-display');
  const nsdrProgressFill = document.getElementById('nsdr-progress-fill');

  if (window.somniaNSDR) {
    window.somniaNSDR.onStepChange = (step) => {
      if (nsdrStageTitle) nsdrStageTitle.textContent = step.title;
      if (nsdrPromptText) nsdrPromptText.textContent = step.prompt;
    };

    window.somniaNSDR.onTick = (remaining, total) => {
      const mm = String(Math.floor(remaining / 60)).padStart(2, '0');
      const ss = String(remaining % 60).padStart(2, '0');
      if (nsdrTimerDisplay) nsdrTimerDisplay.textContent = `${mm}:${ss}`;

      const pct = Math.max(0, Math.min(100, ((total - remaining) / total) * 100));
      if (nsdrProgressFill) nsdrProgressFill.style.width = `${pct}%`;
    };

    if (btnNsdrStart) {
      btnNsdrStart.addEventListener('click', () => {
        if (!window.somniaNSDR.isRunning) {
          window.somniaNSDR.start();
          btnNsdrStart.textContent = '⏸ Идёт сессия NSDR';
        } else {
          window.somniaNSDR.pause();
          btnNsdrStart.textContent = '▶ Продолжить NSDR';
        }
      });
    }

    if (btnNsdrPause) {
      btnNsdrPause.addEventListener('click', () => {
        window.somniaNSDR.pause();
        if (btnNsdrStart) btnNsdrStart.textContent = '▶ Возобновить NSDR';
      });
    }
  }

  // --- 3. Speaker Isochronic Controller ---
  const isochronicPresets = document.querySelectorAll('.isochronic-preset');
  const btnToggleIsochronic = document.getElementById('btn-toggle-isochronic');
  const sliderIsochronicVol = document.getElementById('slider-isochronic-vol');
  const isochronicVolLabel = document.getElementById('isochronic-vol-label');

  let activeCarrier = 136.1;
  let activePulse = 2.0;

  isochronicPresets.forEach(preset => {
    preset.addEventListener('click', () => {
      isochronicPresets.forEach(p => p.classList.remove('active'));
      preset.classList.add('active');
      activeCarrier = Number(preset.getAttribute('data-carrier'));
      activePulse = Number(preset.getAttribute('data-pulse'));

      if (window.somniaIsochronic && window.somniaIsochronic.isPlaying) {
        window.somniaIsochronic.start(activeCarrier, activePulse);
      }
    });
  });

  if (sliderIsochronicVol) {
    sliderIsochronicVol.addEventListener('input', (e) => {
      const val = parseFloat(e.target.value);
      if (window.somniaIsochronic) window.somniaIsochronic.setVolume(val);
      if (isochronicVolLabel) isochronicVolLabel.textContent = `${Math.round(val * 100)}%`;
    });
  }

  if (btnToggleIsochronic) {
    btnToggleIsochronic.addEventListener('click', () => {
      if (!window.somniaIsochronic) return;
      if (window.somniaIsochronic.isPlaying) {
        window.somniaIsochronic.stop();
        btnToggleIsochronic.textContent = '▶ Включить изохроны на динамике';
        btnToggleIsochronic.classList.remove('btn-danger-shield');
        btnToggleIsochronic.classList.add('btn-autopilot');
      } else {
        window.somniaIsochronic.start(activeCarrier, activePulse);
        btnToggleIsochronic.textContent = '⏹ Остановить изохроны';
        btnToggleIsochronic.classList.remove('btn-autopilot');
        btnToggleIsochronic.classList.add('btn-danger-shield');
      }
    });
  }

  // --- 4. Circadian Sunrise Controller ---
  const btnSunrisePreview = document.getElementById('btn-sunrise-preview');
  const btnSunriseFullscreen = document.getElementById('btn-sunrise-fullscreen');
  const sunrisePreviewBox = document.getElementById('sunrise-preview-box');
  const sunriseKelvinVal = document.getElementById('sunrise-kelvin-val');
  const sunriseStageLbl = document.getElementById('sunrise-stage-lbl');

  const sunriseFullscreenOverlay = document.getElementById('sunriseFullscreenOverlay');
  const sunriseFullscreenKelvin = document.getElementById('sunriseFullscreenKelvin');
  const btnExitSunrise = document.getElementById('btn-exit-sunrise');

  function updateSunriseVisuals(frame, targetBox, kelvinEl) {
    const { r, g, b } = frame.rgb;
    if (targetBox) {
      targetBox.style.backgroundColor = `rgb(${r}, ${g}, ${b})`;
      targetBox.style.color = frame.progress > 0.4 ? '#05060A' : '#FFFFFF';
    }
    if (kelvinEl) kelvinEl.textContent = `${frame.kelvin} K`;
    if (sunriseStageLbl) {
      if (frame.kelvin < 2200) sunriseStageLbl.textContent = 'Глубокий рубиновый свет зари (0% меланопсина)';
      else if (frame.kelvin < 4000) sunriseStageLbl.textContent = 'Тёплый янтарный восход (Мягкое снижение мелатонина)';
      else sunriseStageLbl.textContent = 'Дневной синий спектр D65 (Запуск кортизола и бодрости)';
    }
  }

  if (btnSunrisePreview && window.somniaSunrise) {
    btnSunrisePreview.addEventListener('click', () => {
      btnSunrisePreview.disabled = true;
      btnSunrisePreview.textContent = '🌅 Идёт рассвет...';

      window.somniaSunrise.startSimulation(20, (frame) => {
        updateSunriseVisuals(frame, sunrisePreviewBox, sunriseKelvinVal);
      }, () => {
        btnSunrisePreview.disabled = false;
        btnSunrisePreview.textContent = '⚡ Тестовый рассвет (20 секунд)';
        if (window.somniaAudio) window.somniaAudio.triggerSingingBowl(432);
      });
    });
  }

  if (btnSunriseFullscreen && window.somniaSunrise) {
    btnSunriseFullscreen.addEventListener('click', () => {
      if (sunriseFullscreenOverlay) {
        sunriseFullscreenOverlay.style.display = 'flex';
        try { document.documentElement.requestFullscreen(); } catch(e) {}
      }

      window.somniaSunrise.startSimulation(30, (frame) => {
        updateSunriseVisuals(frame, sunriseFullscreenOverlay, sunriseFullscreenKelvin);
      }, () => {
        if (window.somniaAudio) window.somniaAudio.triggerSingingBowl(432);
      });
    });
  }

  if (btnExitSunrise) {
    btnExitSunrise.addEventListener('click', () => {
      if (window.somniaSunrise) window.somniaSunrise.stop();
      if (sunriseFullscreenOverlay) sunriseFullscreenOverlay.style.display = 'none';
      try { if (document.fullscreenElement) document.exitFullscreen(); } catch(e) {}
    });
  }
}

// =====================================================================
// 12. SLEEP SANCTUARY SUB-TABS (Overview, Course 30, AI 100%, Watch)
// =====================================================================
function initTwinSubtabs() {
  const chipButtons = document.querySelectorAll('[data-twin-sub]');
  const subpanels = document.querySelectorAll('.twin-subpanel');

  chipButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const targetSub = btn.getAttribute('data-twin-sub');
      if (window.Haptics) window.Haptics.selection();

      chipButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      subpanels.forEach(p => {
        p.style.display = (p.id === targetSub) ? (targetSub === 'sub-twin-course' ? 'flex' : 'flex') : 'none';
      });

      if (targetSub === 'sub-twin-course' && window.sleepyCourse) {
        renderCourseUI();
      } else if (targetSub === 'sub-twin-ai' && window.sleepyAI) {
        renderSleepyAICoach();
      } else if (targetSub === 'sub-twin-watch' && window.miFitSync) {
        renderWatchTelemetry();
      }
    });
  });
}

// =====================================================================
// 13. SLEEPY 30-DAY COURSE CONTROLLER
// =====================================================================
function renderCourseUI() {
  if (!window.sleepyCourse) return;
  const course = window.sleepyCourse;
  const stats = course.getProgressStats();

  // 1. Header Stats
  const badge = document.getElementById('course-progress-badge');
  const bar = document.getElementById('course-bar-fill');
  const completedText = document.getElementById('course-completed-text');
  const percentText = document.getElementById('course-percent-text');

  if (badge) badge.textContent = `День ${course.currentDay} / 30`;
  if (bar) bar.style.width = `${Math.max(5, stats.percent)}%`;
  if (completedText) completedText.textContent = `Завершено: ${stats.completed} из 30 дней`;
  if (percentText) percentText.textContent = `${stats.percent}% пройдено`;

  // 2. Days Strip
  const strip = document.getElementById('days-scroll-strip');
  if (strip) {
    strip.innerHTML = '';
    SLEEPY_COURSE_DATA.forEach(d => {
      const chip = document.createElement('div');
      chip.className = `day-chip ${course.currentDay === d.day ? 'active' : ''} ${course.completedDays.has(d.day) ? 'completed' : ''}`;
      chip.innerHTML = `
        <span style="font-size: 10px; font-weight: 700; opacity: 0.7;">Ф${d.phase}</span>
        <span style="font-size: 14px; font-weight: 800;">${d.day}</span>
        <span style="font-size: 9px;">${course.completedDays.has(d.day) ? '✓' : '•'}</span>
      `;
      chip.addEventListener('click', () => {
        course.selectDay(d.day);
        renderCourseUI();
      });
      strip.appendChild(chip);
    });
  }

  // 3. Active Lesson Card
  const activeDay = course.getDay(course.currentDay);
  const phasePill = document.getElementById('lesson-phase-pill');
  const dayNum = document.getElementById('lesson-day-number');
  const title = document.getElementById('lesson-title');
  const focus = document.getElementById('lesson-focus');
  const task = document.getElementById('lesson-task');
  const fact = document.getElementById('lesson-fact');
  const hack = document.getElementById('lesson-hack');
  const btnComplete = document.getElementById('btn-complete-day');

  const phaseNames = {
    1: 'Фаза 1: Стабилизация биоритмов',
    2: 'Фаза 2: Архитектура глубокого сна',
    3: 'Фаза 3: ВНС, HRV и торможение ЦНС',
    4: 'Фаза 4: 100% Мастер сна'
  };

  if (phasePill) phasePill.textContent = phaseNames[activeDay.phase] || `Фаза ${activeDay.phase}`;
  if (dayNum) dayNum.textContent = `День ${activeDay.day} из 30`;
  if (title) title.textContent = activeDay.title;
  if (focus) focus.textContent = `Фокус: ${activeDay.focus}`;
  if (task) task.textContent = activeDay.task;
  if (fact) fact.textContent = activeDay.fact;
  if (hack) hack.textContent = activeDay.hack;

  if (btnComplete) {
    const isDone = course.completedDays.has(activeDay.day);
    btnComplete.textContent = isDone ? '✓ День выполнен (Отметить еще раз)' : '✅ Отметить день как выполненный';
    btnComplete.style.background = isDone ? 'linear-gradient(135deg, #059669, #10B981)' : '';
  }
}

function initSleepyCourseUI() {
  const btnComplete = document.getElementById('btn-complete-day');
  if (btnComplete && window.sleepyCourse) {
    btnComplete.addEventListener('click', () => {
      window.sleepyCourse.completeDay(window.sleepyCourse.currentDay);
      renderCourseUI();
      // Also update Sleepy AI recommendations
      if (window.sleepyAI) renderSleepyAICoach();
    });
  }
}

// =====================================================================
// 14. MI FITNESS & REDMI WATCH CONTROLLER
// =====================================================================
function renderWatchTelemetry() {
  if (!window.miFitSync) return;
  const tel = window.miFitSync.telemetry;

  const deepEl = document.getElementById('telemetry-deep');
  const remEl = document.getElementById('telemetry-rem');
  const hrEl = document.getElementById('telemetry-hr');
  const hrvEl = document.getElementById('telemetry-hrv');
  const latencyEl = document.getElementById('telemetry-latency');
  const totalEl = document.getElementById('telemetry-total');
  const deviceEl = document.getElementById('watch-device-name');

  const formatHoursMin = (min) => {
    const h = Math.floor(min / 60);
    const m = min % 60;
    return `${h}ч ${m}м`;
  };

  if (deepEl) deepEl.textContent = formatHoursMin(tel.deepMinutes);
  if (remEl) remEl.textContent = formatHoursMin(tel.remMinutes);
  if (hrEl) hrEl.textContent = `${tel.restingHR} уд/мин`;
  if (hrvEl) hrvEl.textContent = `${tel.hrvRmssd} мс`;
  if (latencyEl) latencyEl.textContent = `${tel.latencyMinutes} мин`;
  if (totalEl) totalEl.textContent = formatHoursMin(tel.totalMinutes);
  if (deviceEl) deviceEl.textContent = window.miFitSync.deviceName || 'Redmi Watch 5 Active';
}

function initMiFitSyncUI() {
  const btnBle = document.getElementById('btn-ble-connect');
  const toggleAutoSync = document.getElementById('toggle-mifit-autosync');

  if (toggleAutoSync && window.miFitSync) {
    toggleAutoSync.checked = window.miFitSync.autoSyncEnabled;
    toggleAutoSync.addEventListener('change', (e) => {
      window.miFitSync.setAutoSyncEnabled(e.target.checked);
    });
  }
  const fileUpload = document.getElementById('file-mifit-upload');
  const btnQuickDemo = document.getElementById('btn-quick-sync-demo');

  if (btnBle && window.miFitSync) {
    btnBle.addEventListener('click', async () => {
      try {
        btnBle.textContent = '⏳ Поиск часов...';
        const res = await window.miFitSync.connectBleWatch();
        btnBle.textContent = `✓ ${res.deviceName}`;
        renderWatchTelemetry();
        if (window.sleepyAI) renderSleepyAICoach();
      } catch (e) {
        btnBle.textContent = '🔗 Bluetooth BLE';
        alert('Bluetooth: ' + (e.message || 'Часы не найдены. Выберите экспорт файла или демо-синхронизацию.'));
      }
    });
  }

  if (fileUpload && window.miFitSync) {
    fileUpload.addEventListener('change', async (e) => {
      const file = e.target.files[0];
      if (file) {
        await window.miFitSync.parseExportFile(file);
        renderWatchTelemetry();
        if (window.sleepyAI) renderSleepyAICoach();
        alert(`✓ Файл ${file.name} успешно импортирован в Somnia! Телеметрия сна обновлена.`);
      }
    });
  }

  if (btnQuickDemo && window.miFitSync) {
    btnQuickDemo.addEventListener('click', () => {
      // Refresh with randomized slight variations to show live reactive updates
      const variation = Math.floor(Math.random() * 8) - 4;
      window.miFitSync.setCustomTelemetry({
        deepMinutes: 98 + variation,
        remMinutes: 92 - variation,
        restingHR: 52 + Math.floor(Math.random() * 3),
        hrvRmssd: 68 + variation,
        totalMinutes: 462
      });
      renderWatchTelemetry();
      if (window.sleepyAI) renderSleepyAICoach();
      if (window.Haptics) window.Haptics.success();

      const badge = document.getElementById('auto-sync-badge');
      const badgeText = document.getElementById('auto-sync-badge-text');
      if (badge && badgeText) {
        badgeText.textContent = '✓ Данные Redmi Watch 5 Active синхронизированы (Глубокий: ' + Math.floor(window.miFitSync.telemetry.deepMinutes/60) + 'ч ' + (window.miFitSync.telemetry.deepMinutes%60) + 'м, Пульс: ' + window.miFitSync.telemetry.restingHR + ' уд/мин)';
        badge.classList.add('visible');
        setTimeout(() => badge.classList.remove('visible'), 4000);
      }
    });
  }

  // Trigger Zero-Click Auto-Sync on Launch (1 sec after render)
  setTimeout(() => {
    if (window.miFitSync) {
      window.miFitSync.evaluateAutoSyncOnLaunch();
    }
  }, 1000);

  // Trigger Zero-Click Auto-Sync when returning to the app from Mi Fitness
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible' && window.miFitSync) {
      window.miFitSync.evaluateAutoSyncOnLaunch();
    }
  });
}

// =====================================================================
// 15. SLEEPY AI 100% COACH & CHAT CONTROLLER
// =====================================================================
function renderSleepyAICoach() {
  if (!window.sleepyAI) return;
  const tel = window.miFitSync ? window.miFitSync.telemetry : {};
  const currentDay = window.sleepyCourse ? window.sleepyCourse.currentDay : 1;

  const sqi = window.sleepyAI.calculateSQI(tel);
  const roadmap = window.sleepyAI.getRoadmapTo100(tel, currentDay);
  const gaps = window.sleepyAI.getGapAnalysis(tel, sqi);

  // 1. SQI Display
  const sqiEl = document.getElementById('sqi-big-display');
  const forecastEl = document.getElementById('sqi-forecast-display');
  if (sqiEl) sqiEl.textContent = `${sqi}%`;
  if (forecastEl) forecastEl.textContent = `🔮 Прогноз на завтра: ${roadmap.forecastSqi}% при выполнении плана`;

  // 2. 3 Steps Roadmap
  const stepsContainer = document.getElementById('roadmap-steps-container');
  if (stepsContainer) {
    stepsContainer.innerHTML = '';
    roadmap.steps.forEach((s, idx) => {
      const card = document.createElement('div');
      card.className = 'roadmap-step-card';
      card.innerHTML = `
        <div style="font-size: 11px; font-weight: 700; color: #38BDF8;">${s.tag}</div>
        <div style="font-size: 14px; font-weight: 800; color: #FFFFFF;">Шаг ${idx + 1}: ${s.title}</div>
        <div style="font-size: 12px; color: var(--text-secondary); line-height: 1.4;">${s.desc}</div>
      `;
      stepsContainer.appendChild(card);
    });
  }

  // 3. Gaps Analysis
  const gapsContainer = document.getElementById('gaps-container');
  if (gapsContainer) {
    gapsContainer.innerHTML = '';
    gaps.forEach(g => {
      const card = document.createElement('div');
      card.className = 'gap-item-card';
      card.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <span style="font-size: 13px; font-weight: 800; color: #F43F5E;">⚠️ ${g.title}</span>
          <span style="font-size: 11px; font-weight: 800; color: #F43F5E; background: rgba(244, 63, 94, 0.15); padding: 2px 8px; border-radius: 8px;">-${g.loss}</span>
        </div>
        <div style="font-size: 11px; color: var(--text-muted);">${g.cause}</div>
        <div style="font-size: 12px; color: #F8FAFC; margin-top: 4px;"><b>Решение:</b> ${g.remedy}</div>
      `;
      gapsContainer.appendChild(card);
    });
  }

  // 4. Chat Messages Render
  renderChatMessages();
}

function renderChatMessages() {
  const box = document.getElementById('chat-messages-box');
  if (!box || !window.sleepyAI) return;
  box.innerHTML = '';

  window.sleepyAI.chatHistory.forEach(msg => {
    const bubble = document.createElement('div');
    bubble.className = `chat-bubble ${msg.sender}`;
    bubble.textContent = msg.text;
    box.appendChild(bubble);
  });

  box.scrollTop = box.scrollHeight;
}

function sendUserChatMessage(promptText) {
  if (!promptText || !promptText.trim() || !window.sleepyAI) return;
  if (window.Haptics) window.Haptics.light();

  // 1. Add user message
  window.sleepyAI.chatHistory.push({
    sender: 'user',
    text: promptText,
    time: 'Сейчас'
  });
  renderChatMessages();

  // 2. Generate Sleepy AI response
  setTimeout(() => {
    const aiResponse = window.sleepyAI.respondToPrompt(promptText);
    window.sleepyAI.chatHistory.push({
      sender: 'sleepy',
      text: aiResponse,
      time: 'Только что'
    });
    if (window.Haptics) window.Haptics.success();
    renderChatMessages();
  }, 350);
}

function initSleepyAICoachUI() {
  const inputEl = document.getElementById('input-chat-sleepy');
  const btnSend = document.getElementById('btn-send-sleepy');
  const quickBtns = document.querySelectorAll('.quick-prompt-btn');

  if (btnSend && inputEl) {
    btnSend.addEventListener('click', () => {
      const text = inputEl.value;
      inputEl.value = '';
      sendUserChatMessage(text);
    });

    inputEl.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        const text = inputEl.value;
        inputEl.value = '';
        sendUserChatMessage(text);
      }
    });
  }

  quickBtns.forEach(b => {
    b.addEventListener('click', () => {
      const prompt = b.getAttribute('data-ask');
      sendUserChatMessage(prompt);
    });
  });

  renderSleepyAICoach();
}
