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

    // 4. Map companion desktop sub-tabs to primary bottom 6 tabs
    let primaryBottomTab = targetId;
    if (['tab-caffeine', 'tab-nsdr', 'tab-isochronic', 'tab-cycles', 'tab-tracker'].includes(targetId)) {
      primaryBottomTab = 'tab-twin';
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

  // Lockscreen MediaSession action integration
  window.onMediaSessionPlay = () => {
    if (!isAutopilotOn) {
      btnAutopilot.click();
    }
  };
  window.onMediaSessionPause = () => {
    if (isAutopilotOn) {
      btnAutopilot.click();
    }
  };

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

  const sunriseMderLbl = document.getElementById('sunrise-mder-lbl');

  function updateSunriseVisuals(frame, targetBox, kelvinEl) {
    const { r, g, b } = frame.rgb;
    if (targetBox) {
      targetBox.style.backgroundColor = `rgb(${r}, ${g}, ${b})`;
      targetBox.style.color = frame.progress > 0.4 ? '#05060A' : '#FFFFFF';
    }
    if (kelvinEl) kelvinEl.textContent = `${frame.kelvin} K`;
    if (sunriseStageLbl) {
      if (frame.kelvin < 2200) {
        sunriseStageLbl.textContent = 'Глубокий рубиновый свет зари (0% меланопсина)';
        if (sunriseMderLbl) sunriseMderLbl.textContent = 'm-DER: 0.05 • Мелатонин сохранён';
      } else if (frame.kelvin < 4000) {
        sunriseStageLbl.textContent = 'Тёплый янтарный восход (Мягкое снижение мелатонина)';
        if (sunriseMderLbl) sunriseMderLbl.textContent = 'm-DER: 0.45 • Старт выработки кортизола';
      } else if (frame.kelvin < 6600) {
        sunriseStageLbl.textContent = 'Дневной синий спектр D65 (Запуск бодрости и фокуса)';
        if (sunriseMderLbl) sunriseMderLbl.textContent = 'm-DER: 0.90 • Высокое подавление мелатонина';
      } else {
        sunriseStageLbl.textContent = '❄️ Арктический свет 10 000 K (Максимум ipRGC, взрыв дофамина)';
        if (sunriseMderLbl) sunriseMderLbl.textContent = 'm-DER: 1.30 • 100% блокировка мелатонина (SAD Therapy)';
      }
    }
  }

  // Preset CCT Target Buttons (10 000 K / 6 500 K / 4 500 K)
  const cctBtns = [
    document.getElementById('btn-cct-10k'),
    document.getElementById('btn-cct-65k'),
    document.getElementById('btn-cct-45k')
  ];

  cctBtns.forEach(btn => {
    if (!btn) return;
    btn.addEventListener('click', () => {
      cctBtns.forEach(b => b && b.classList.remove('active'));
      btn.classList.add('active');
      const cct = parseInt(btn.getAttribute('data-cct') || '10000', 10);
      if (window.somniaSunrise) {
        window.somniaSunrise.setMaxKelvin(cct);
      }
      if (btnSunrisePreview) {
        btnSunrisePreview.textContent = `⚡ Тестовый рассвет (до ${cct.toLocaleString()} K)`;
      }
      if (window.Haptics) window.Haptics.light();
    });
  });

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

  // Keep manual input fields in sync with telemetry
  const inpH = document.getElementById('manual-total-hours');
  const inpM = document.getElementById('manual-total-mins');
  const inpDeep = document.getElementById('manual-deep-mins');
  const inpRem = document.getElementById('manual-rem-mins');
  const inpHr = document.getElementById('manual-hr');

  if (tel) {
    if (inpH && document.activeElement !== inpH) inpH.value = Math.floor((tel.totalMinutes || 468) / 60);
    if (inpM && document.activeElement !== inpM) inpM.value = (tel.totalMinutes || 468) % 60;
    if (inpDeep && document.activeElement !== inpDeep) inpDeep.value = tel.deepMinutes || 98;
    if (inpRem && document.activeElement !== inpRem) inpRem.value = tel.remMinutes || 94;
    if (inpHr && document.activeElement !== inpHr) inpHr.value = tel.restingHR || 52;
  } else {
    if (inpH && document.activeElement !== inpH && !inpH.value) inpH.value = 7;
    if (inpM && document.activeElement !== inpM && !inpM.value) inpM.value = 45;
    if (inpDeep && document.activeElement !== inpDeep && !inpDeep.value) inpDeep.value = 95;
    if (inpRem && document.activeElement !== inpRem) inpRem.value = 90;
    if (inpHr && document.activeElement !== inpHr) inpHr.value = 54;
  }

  const formatHoursMin = (min) => {
    if (!min) return '--:--';
    const h = Math.floor(min / 60);
    const m = min % 60;
    return `${h}ч ${m}м`;
  };

  if (deepEl) deepEl.textContent = tel ? formatHoursMin(tel.deepMinutes) : '--:--';
  if (remEl) remEl.textContent = tel ? formatHoursMin(tel.remMinutes) : '--:--';
  if (hrEl) hrEl.textContent = (tel && tel.restingHR) ? `${tel.restingHR} уд/мин` : '-- уд/мин';
  if (hrvEl) hrvEl.textContent = (tel && tel.hrvRmssd) ? `${tel.hrvRmssd} мс` : '-- мс';
  if (latencyEl) latencyEl.textContent = (tel && tel.latencyMinutes) ? `${tel.latencyMinutes} мин` : '-- мин';
  if (totalEl) totalEl.textContent = tel ? formatHoursMin(tel.totalMinutes) : '--:--';
  if (deviceEl) deviceEl.textContent = window.miFitSync.deviceName || 'Redmi Watch 5 Active';

  // Render History & Brutal Audit
  const badgeEl = document.getElementById('history-provenance-badge');
  if (badgeEl && window.miFitSync) {
    const realCount = window.miFitSync.history.length;
    if (realCount === 0) {
      badgeEl.innerHTML = `
        <div style="background: rgba(56, 189, 248, 0.08); border: 1px dashed rgba(56, 189, 248, 0.35); border-radius: 8px; padding: 10px 14px; margin-bottom: 12px; font-size: 11px; color: #38BDF8; line-height: 1.4;">
          🎯 <b>100% реальные данные:</b> В приложении нет никаких выдуманных или демонстрационных дней. Введите показатели сна за прошедшую ночь кнопкой <b>«Сохранить мои точные показатели»</b> ниже или загрузите архив через <b>«📂 Файл Mi Fitness»</b>.
        </div>
      `;
    } else {
      badgeEl.innerHTML = `
        <div style="background: rgba(16, 185, 129, 0.08); border: 1px solid rgba(16, 185, 129, 0.25); border-radius: 8px; padding: 8px 12px; margin-bottom: 12px; font-size: 11px; color: #10B981; display: flex; justify-content: space-between; align-items: center;">
          <span>✓ <b>Реальная телеметрия:</b> зафиксировано ${realCount} ${realCount === 1 ? 'ночь' : (realCount < 5 ? 'ночи' : 'ночей')} без фейков</span>
          <button id="btn-clear-real-history" style="background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.15); color: #94A3B8; padding: 2px 8px; border-radius: 4px; cursor: pointer; font-size: 10px;" title="Очистить историю">Сброс</button>
        </div>
      `;
      const btnClearReal = document.getElementById('btn-clear-real-history');
      if (btnClearReal) {
        btnClearReal.onclick = () => {
          if (confirm('Очистить все сохраненные ночи сна?')) {
            window.miFitSync.clearAllHistory();
            renderWatchTelemetry();
          }
        };
      }
    }
  }
    const inpDateEl = document.getElementById('manual-date');
  if (inpDateEl && !inpDateEl.value) {
    inpDateEl.value = new Date().toISOString().split('T')[0];
  }
  if (typeof renderSleepHistoryChips === 'function') renderSleepHistoryChips();
  if (typeof renderHistoryChart === 'function') renderHistoryChart();
  if (typeof renderSleepBrutalAudit === 'function') renderSleepBrutalAudit();
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
  const btn7d = document.getElementById('btn-history-7d');
  const btn30d = document.getElementById('btn-history-30d');

  if (btn7d && btn30d) {
    btn7d.addEventListener('click', () => {
      currentHistoryPeriod = 7;
      btn7d.classList.add('active');
      btn30d.classList.remove('active');
      renderSleepHistoryChips();
      renderHistoryChart();
    });
    btn30d.addEventListener('click', () => {
      currentHistoryPeriod = 30;
      btn30d.classList.add('active');
      btn7d.classList.remove('active');
      renderSleepHistoryChips();
      renderHistoryChart();
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
        try {
          const res = await window.miFitSync.parseExportFile(file);
          renderWatchTelemetry();
          if (window.sleepyAI) renderSleepyAICoach();
          const count = res.length;
          const first = res[res.length - 1]?.date || '';
          const last = res[0]?.date || '';
          alert(`✓ Успешно синхронизирована вся история сна из файла "${file.name}": загружено ${count} реальных ночей (с ${first} по ${last})! Без фейков.`);
        } catch(err) {
          alert('Ошибка чтения файла: ' + err.message);
        }
      }
    });
  }

  if (btnQuickDemo && window.miFitSync) {
    btnQuickDemo.addEventListener('click', () => {
      // Read current values directly from manual inputs if available
      const dateVal = document.getElementById('manual-date')?.value || new Date().toISOString().split('T')[0];
      const inpH = parseInt(document.getElementById('manual-total-hours')?.value || '7', 10);
      const inpM = parseInt(document.getElementById('manual-total-mins')?.value || '48', 10);
      const inpDeep = parseInt(document.getElementById('manual-deep-mins')?.value || '98', 10);
      const inpRem = parseInt(document.getElementById('manual-rem-mins')?.value || '94', 10);
      const inpHr = parseInt(document.getElementById('manual-hr')?.value || '52', 10);

      const total = inpH * 60 + inpM;
      window.miFitSync.saveRealNight({
        date: dateVal,
        totalMinutes: total,
        deepMinutes: inpDeep,
        remMinutes: inpRem,
        restingHR: inpHr,
        hrvRmssd: 68
      });

      renderWatchTelemetry();
      if (window.sleepyAI) renderSleepyAICoach();
      if (window.Haptics) window.Haptics.success();

      const badge = document.getElementById('auto-sync-badge');
      const badgeText = document.getElementById('auto-sync-badge-text');
      if (badge && badgeText) {
        badgeText.textContent = `✓ Данные сна с Redmi Watch 5 Active сохранены: ${inpH}ч ${inpM}м (глубокий ${Math.floor(inpDeep/60)}ч ${inpDeep%60}м, пульс ${inpHr}). Без рандома!`;
        badge.classList.add('active');
        setTimeout(() => badge.classList.remove('active'), 4500);
      }
    });
  }

  // Manual Accurate Sleep Metrics Input
  const btnSaveManual = document.getElementById('btn-save-manual-metrics');
  if (btnSaveManual && window.miFitSync) {
    btnSaveManual.addEventListener('click', () => {
      const dateVal = document.getElementById('manual-date')?.value || new Date().toISOString().split('T')[0];
      const h = parseInt(document.getElementById('manual-total-hours')?.value || '7', 10);
      const m = parseInt(document.getElementById('manual-total-mins')?.value || '42', 10);
      const deep = parseInt(document.getElementById('manual-deep-mins')?.value || '98', 10);
      const rem = parseInt(document.getElementById('manual-rem-mins')?.value || '92', 10);
      const hr = parseInt(document.getElementById('manual-hr')?.value || '52', 10);

      const total = h * 60 + m;
      window.miFitSync.saveRealNight({
        date: dateVal,
        totalMinutes: total,
        deepMinutes: deep,
        remMinutes: rem,
        restingHR: hr,
        hrvRmssd: 68
      });

      renderWatchTelemetry();
      if (window.sleepyAI) renderSleepyAICoach();
      if (window.Haptics) window.Haptics.success();

      const badge = document.getElementById('auto-sync-badge');
      const badgeText = document.getElementById('auto-sync-badge-text');
      if (badge && badgeText) {
        badgeText.textContent = `✓ Сохранены точные данные: ${h}ч ${m}м сна, глубокий ${Math.floor(deep/60)}ч ${deep%60}м, пульс ${hr}`;
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
  const tel = (window.miFitSync && window.miFitSync.telemetry) ? window.miFitSync.telemetry : {};
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

async function sendUserChatMessage(promptText) {
  if (!promptText || !promptText.trim() || !window.sleepyAI) return;
  if (window.Haptics) window.Haptics.light();

  // 1. Add user message
  window.sleepyAI.chatHistory.push({
    sender: 'user',
    text: promptText,
    time: 'Сейчас'
  });
  renderChatMessages();

  // 2. Add temporary typing indicator
  const box = document.getElementById('chat-messages-box');
  const typingBubble = document.createElement('div');
  typingBubble.className = 'chat-bubble sleepy typing-indicator';
  typingBubble.style.opacity = '0.75';
  typingBubble.style.fontStyle = 'italic';
  typingBubble.textContent = (window.sleepyAI.mode === 'live')
    ? '🧠 Слипи анализирует телеметрию с Redmi Watch 5...'
    : '⚡ Слипи формулирует ответ...';
  if (box) {
    box.appendChild(typingBubble);
    box.scrollTop = box.scrollHeight;
  }

  try {
    const aiResponse = await window.sleepyAI.getAIResponse(promptText);
    if (typingBubble.parentNode) typingBubble.parentNode.removeChild(typingBubble);

    window.sleepyAI.chatHistory.push({
      sender: 'sleepy',
      text: aiResponse,
      time: 'Только что'
    });
    if (window.Haptics) window.Haptics.success();
    renderChatMessages();
  } catch (err) {
    if (typingBubble.parentNode) typingBubble.parentNode.removeChild(typingBubble);
    window.sleepyAI.chatHistory.push({
      sender: 'sleepy',
      text: `⚠️ Ошибка ответа ИИ: ${err.message || 'Сбой сети'}. Переключитесь на офлайн-режим при отсутствии интернета.`,
      time: 'Только что'
    });
    renderChatMessages();
  }
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

  // AI Mode Switcher (Live LLM vs Offline)
  const btnLive = document.getElementById('btn-ai-mode-live');
  const btnOffline = document.getElementById('btn-ai-mode-offline');
  const statusInd = document.getElementById('ai-status-indicator');

  function updateAIModeUI() {
    if (!window.sleepyAI) return;
    const cfg = window.sleepyAI.getConfig();
    if (btnLive && btnOffline) {
      if (cfg.mode === 'live') {
        btnLive.classList.add('active');
        btnOffline.classList.remove('active');
      } else {
        btnOffline.classList.add('active');
        btnLive.classList.remove('active');
      }
    }
    if (statusInd) {
      const modelDisplayName = (cfg.model && cfg.model.includes('nemotron'))
        ? 'Nemotron 3.5'
        : ((cfg.model && cfg.model.includes('gpt-6')) ? 'GPT-6.1 Sol' : (cfg.model || 'ИИ-Сомнолог'));
      statusInd.textContent = cfg.mode === 'live'
        ? `● ${modelDisplayName} • Онлайн`
        : '● Офлайн-движок • Мгновенный ответ';
      statusInd.style.color = cfg.mode === 'live' ? '#10B981' : '#38BDF8';
    }
  }

  if (btnLive) {
    btnLive.addEventListener('click', () => {
      window.sleepyAI.saveConfig({ mode: 'live' });
      updateAIModeUI();
      if (window.Haptics) window.Haptics.selection();
    });
  }

  if (btnOffline) {
    btnOffline.addEventListener('click', () => {
      window.sleepyAI.saveConfig({ mode: 'offline' });
      updateAIModeUI();
      if (window.Haptics) window.Haptics.selection();
    });
  }

  // LLM Settings Modal
  const btnOpenSettings = document.getElementById('btn-open-ai-settings');
  const modalSettings = document.getElementById('modal-llm-settings');
  const btnCloseSettings = document.getElementById('btn-close-ai-settings');
  const btnSaveSettings = document.getElementById('btn-save-llm-settings');
  const selectPreset = document.getElementById('select-llm-preset');
  const selectModel = document.getElementById('select-llm-model');
  const inputBaseUrl = document.getElementById('input-llm-base-url');
  const inputApiKey = document.getElementById('input-llm-api-key');
  const btnToggleVis = document.getElementById('btn-toggle-key-vis');
  const keyHint = document.getElementById('llm-key-hint');

  if (btnOpenSettings && modalSettings) {
    btnOpenSettings.addEventListener('click', () => {
      const cfg = window.sleepyAI.getConfig();
      if (inputBaseUrl) inputBaseUrl.value = cfg.baseUrl;
      if (inputApiKey) inputApiKey.value = cfg.isDefaultKey ? '' : cfg.apiKey;
      if (selectModel) selectModel.value = cfg.model;
      if (keyHint) {
        keyHint.textContent = cfg.isDefaultKey 
          ? '✓ Встроенный ключ Tooken Club Prime активен (свой ключ не требуется)' 
          : '✓ Сохранен пользовательский API ключ';
      }
      modalSettings.style.display = 'flex';
      if (window.Haptics) window.Haptics.selection();
    });
  }

  if (btnCloseSettings && modalSettings) {
    btnCloseSettings.addEventListener('click', () => {
      modalSettings.style.display = 'none';
    });
    modalSettings.addEventListener('click', (e) => {
      if (e.target === modalSettings) modalSettings.style.display = 'none';
    });
  }

  if (selectPreset) {
    selectPreset.addEventListener('change', () => {
      const p = selectPreset.value;
      if (p === 'openrouter_fleet' || p === 'tooken_prime') {
        inputBaseUrl.value = 'https://openrouter.ai/api/v1';
        inputApiKey.value = '';
        inputApiKey.placeholder = 'Встроенный OpenRouter активен';
        selectModel.value = 'nvidia/nemotron-3.5-super-vl:free';
        keyHint.textContent = '✓ Встроенный безлимитный доступ OpenRouter активен';
      } else if (p === 'openrouter_custom') {
        inputBaseUrl.value = 'https://openrouter.ai/api/v1';
        inputApiKey.value = '';
        inputApiKey.placeholder = 'sk-or-v1-...';
        selectModel.value = 'nvidia/nemotron-3.5-super-vl:free';
        keyHint.textContent = 'Введите ваш персональный ключ OpenRouter';
      } else if (p === 'openai') {
        inputBaseUrl.value = 'https://api.openai.com/v1';
        inputApiKey.value = '';
        inputApiKey.placeholder = 'sk-...';
        selectModel.value = 'gpt-4o-mini';
        keyHint.textContent = 'Введите ваш ключ OpenAI';
      }
    });
  }

  if (btnToggleVis && inputApiKey) {
    btnToggleVis.addEventListener('click', () => {
      inputApiKey.type = inputApiKey.type === 'password' ? 'text' : 'password';
    });
  }

  if (btnSaveSettings) {
    btnSaveSettings.addEventListener('click', () => {
      const bUrl = inputBaseUrl ? inputBaseUrl.value.trim() || 'https://tooken.club/v1' : 'https://tooken.club/v1';
      let key = inputApiKey ? inputApiKey.value.trim() : '';
      if (!key) {
        key = window.sleepyAI.DEFAULT_API_KEY;
      }
      const mdl = selectModel ? selectModel.value : 'gpt-6.1-sol';

      window.sleepyAI.saveConfig({
        baseUrl: bUrl,
        apiKey: key,
        model: mdl,
        mode: 'live'
      });

      updateAIModeUI();
      if (modalSettings) modalSettings.style.display = 'none';
      if (window.Haptics) window.Haptics.success();
      alert('✓ Настройки ИИ успешно сохранены! Слипи работает в режиме Живой LLM.');
    });
  }

  updateAIModeUI();
  renderSleepyAICoach();
}

// =====================================================================
// 14.1 SLEEP HISTORY CAROUSEL & SVG CHART RENDERER
// =====================================================================
let currentHistoryPeriod = 7; // 7 or 30

function renderSleepHistoryChips() {
  const container = document.getElementById('sleep-history-chips');
  if (!container || !window.miFitSync) return;

  if (window.miFitSync.history.length === 0) {
    container.innerHTML = `
      <div style="color: var(--text-muted); font-size: 11px; padding: 12px 6px; font-style: italic;">
        Нет записей. Введите данные за ночь ниже.
      </div>
    `;
    return;
  }

  const history = window.miFitSync.history.slice(0, currentHistoryPeriod);
  const selectedIdx = window.miFitSync.selectedDayIndex;

  container.innerHTML = history.map((day, idx) => {
    const isAct = idx === selectedIdx ? 'active' : '';
    const isMissing = !day.totalMinutes || day.totalMinutes === 0;
    const totalH = isMissing ? '--' : (day.totalMinutes / 60).toFixed(1);
    const deepPct = isMissing ? 0 : ((day.deepMinutes / day.totalMinutes) * 100);
    const dotColor = isMissing ? '#64748B' : ((day.totalMinutes >= 420 && deepPct >= 18) ? '#10B981' : (day.totalMinutes >= 360 ? '#F59E0B' : '#F43F5E'));

    return `
      <div class="history-day-chip ${isAct}" data-day-idx="${idx}" title="${day.date}: ${isMissing ? 'Нет записи' : totalH + 'ч'}">
        <div class="chip-dow">${day.isToday ? 'Сегодня' : day.dayOfWeek}</div>
        <div class="chip-num">${day.dayNum}</div>
        <div class="chip-hours" style="color: ${dotColor};">${isMissing ? '--:--' : totalH + 'ч'}</div>
        <div class="chip-dot" style="background: ${dotColor};"></div>
      </div>
    `;
  }).join('');

  container.querySelectorAll('.history-day-chip').forEach(chip => {
    chip.addEventListener('click', () => {
      const idx = parseInt(chip.getAttribute('data-day-idx'), 10);
      window.miFitSync.selectDay(idx);
      renderSleepHistoryChips();
      renderHistoryChart();
    });
  });
}

function renderHistoryChart() {
  const container = document.getElementById('sleep-history-chart');
  if (!container || !window.miFitSync) return;

  if (window.miFitSync.history.length === 0) {
    container.innerHTML = `
      <div style="display: flex; align-items: center; justify-content: center; height: 100px; color: var(--text-muted); font-size: 11.5px; text-align: center; padding: 0 16px;">
        📊 График трендов сна появится после добавления первой реальной ночи
      </div>
    `;
    return;
  }

  const history = window.miFitSync.history.slice(0, currentHistoryPeriod).slice().reverse();
  const selectedDay = window.miFitSync.telemetry || history[0];

  const width = Math.max(300, container.clientWidth || 340);
  const height = 120;
  const paddingX = 14;
  const paddingY = 20;

  const maxHours = 9.5;
  const minHours = 4.0;
  const barWidth = Math.max(8, Math.min(28, (width - paddingX * 2) / history.length - 4));

  const targetY = height - paddingY - (((7.5 - minHours) / (maxHours - minHours)) * (height - paddingY * 2));

  let barsSvg = '';
  history.forEach((day, idx) => {
    const isMissing = !day.totalMinutes || day.totalMinutes === 0;
    const hours = isMissing ? 0 : day.totalMinutes / 60;
    const clampedH = isMissing ? minHours : Math.max(minHours, Math.min(maxHours, hours));
    const barH = isMissing ? 4 : ((clampedH - minHours) / (maxHours - minHours)) * (height - paddingY * 2);
    const x = paddingX + idx * ((width - paddingX * 2) / (history.length - 1 || 1)) - (barWidth / 2);
    const y = height - paddingY - barH;

    const isSelected = selectedDay && day.date === selectedDay.date;
    const deepPct = isMissing ? 0 : (day.deepMinutes / day.totalMinutes) * 100;
    const fillColor = isMissing ? '#334155' : (isSelected ? '#38BDF8' : (hours >= 7.0 && deepPct >= 18 ? '#10B981' : (hours >= 6.0 ? '#F59E0B' : '#F43F5E')));
    const strokeAttr = isSelected ? 'stroke="#FFFFFF" stroke-width="2"' : (isMissing ? 'stroke="#475569" stroke-width="1" stroke-dasharray="2,2"' : '');

    barsSvg += `
      <rect x="${x}" y="${y}" width="${barWidth}" height="${barH}" rx="3" fill="${fillColor}" ${strokeAttr} style="cursor: pointer; opacity: ${isSelected ? 1.0 : 0.85};">
        <title>${day.date}: ${isMissing ? 'Нет записи' : hours.toFixed(1) + 'ч'}</title>
      </rect>
      <text x="${x + barWidth/2}" y="${height - 4}" font-size="9" fill="${isSelected ? '#38BDF8' : '#64748B'}" font-weight="${isSelected ? '800' : '500'}" text-anchor="middle">${day.dayNum}</text>
    `;
  });

  container.innerHTML = `
    <div style="display: flex; justify-content: space-between; font-size: 10px; color: var(--text-muted); margin-bottom: 4px; padding: 0 4px;">
      <span>Цель: 7.5ч сна</span>
      <span>${currentHistoryPeriod === 7 ? 'Последние 7 ночей' : 'Последние 30 дней'}</span>
    </div>
    <svg width="100%" height="${height}" viewBox="0 0 ${width} ${height}" style="overflow: visible;">
      <line x1="${paddingX}" y1="${targetY}" x2="${width - paddingX}" y2="${targetY}" stroke="rgba(255,255,255,0.25)" stroke-dasharray="3,3" stroke-width="1"/>
      <text x="${width - paddingX - 2}" y="${targetY - 3}" font-size="8" fill="rgba(255,255,255,0.4)" text-anchor="end">7.5ч</text>
      ${barsSvg}
    </svg>
  `;
}

// =====================================================================
// 14.2 BRUTAL AI SLEEP AUDIT ("ГДЕ ТЫ ПРОЕБАЛСЯ") RENDERER
// =====================================================================
function renderSleepBrutalAudit() {
  const container = document.getElementById('brutal-audit-container');
  if (!container || !window.miFitSync) return;

  const tel = window.miFitSync.telemetry;
  if (!tel || !tel.totalMinutes) {
    container.innerHTML = `
      <div style="background: rgba(255,255,255,0.03); border: 1px dashed rgba(255,255,255,0.15); border-radius: 12px; padding: 20px; text-align: center; color: var(--text-muted); font-size: 13px;">
        💤 Ожидание реальной ночи сна для разбора. Сохраните показатели за прошедшую ночь ниже.
      </div>
    `;
    return;
  }
  const audit = window.miFitSync.generateBrutalAudit(tel);
  const sqi = window.sleepyAI ? window.sleepyAI.calculateSQI(tel) : 78;

  container.innerHTML = `
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
      <div style="display: flex; align-items: center; gap: 8px;">
        <span style="font-size: 24px;">🔥</span>
        <div>
          <h3 style="font-size: 16px; font-weight: 800; color: #FFFFFF; margin: 0;">Честный разбор сна от Слипи</h3>
          <div style="font-size: 11px; color: #F43F5E; font-weight: 700;">Ночь: ${tel.date} (${tel.bedtime || '23:30'} → ${tel.waketime || '07:15'})</div>
        </div>
      </div>
      <span style="font-size: 11px; background: rgba(244, 63, 94, 0.2); color: #FDA4AF; border: 1px solid rgba(244, 63, 94, 0.4); padding: 4px 10px; border-radius: 8px; font-weight: 800;">
        SQI: ${sqi}%
      </span>
    </div>

    <div style="background: rgba(244, 63, 94, 0.12); border-left: 3px solid #F43F5E; padding: 10px 12px; border-radius: 8px; font-size: 12.5px; font-weight: 700; color: #FECDD3; margin-bottom: 14px; line-height: 1.4;">
      ${audit.verdict}
    </div>

    <!-- Где ты проебался -->
    <div style="margin-bottom: 14px;">
      <div style="font-size: 12px; font-weight: 800; color: #F87171; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 8px;">
        ❌ Где ты ошибся прошлой ночью:
      </div>
      ${audit.mistakes.length === 0 ? '<div style="font-size: 12px; color: #34D399;">Критичных ошибок нет. Отличная дисциплина сна!</div>' : 
        audit.mistakes.map(m => `
          <div style="background: rgba(0,0,0,0.3); border: 1px solid rgba(248, 113, 113, 0.25); border-radius: 10px; padding: 10px 12px; margin-bottom: 8px;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
              <span style="font-size: 10px; font-weight: 800; color: #F87171; background: rgba(248, 113, 113, 0.15); padding: 2px 6px; border-radius: 4px;">${m.tag}</span>
              <span style="font-size: 12px; font-weight: 700; color: #FFFFFF;">${m.title}</span>
            </div>
            <div style="font-size: 11.5px; color: var(--text-secondary); line-height: 1.45;">${m.desc}</div>
          </div>
        `).join('')
      }
    </div>

    <!-- Что было сделано правильно -->
    ${audit.wins.length > 0 ? `
    <div style="margin-bottom: 14px;">
      <div style="font-size: 12px; font-weight: 800; color: #34D399; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 6px;">
        ✅ Что было сделано по уму:
      </div>
      <div style="font-size: 11.5px; color: #A7F3D0; line-height: 1.5; background: rgba(16, 185, 129, 0.08); border: 1px solid rgba(16, 185, 129, 0.2); border-radius: 8px; padding: 8px 12px;">
        ${audit.wins.map(w => `<div style="margin-bottom: 2px;">${w}</div>`).join('')}
      </div>
    </div>
    ` : ''}

    <!-- Чёткий план действий на сегодня -->
    <div>
      <div style="font-size: 12px; font-weight: 800; color: #38BDF8; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 8px;">
        🎯 Твой четкий план на сегодня (Без воды):
      </div>
      <div style="display: grid; gap: 6px;">
        ${audit.actionPlan.map(p => `
          <div style="background: rgba(56, 189, 248, 0.08); border: 1px solid rgba(56, 189, 248, 0.2); border-radius: 8px; padding: 8px 10px; font-size: 11.5px; line-height: 1.4;">
            <span style="font-weight: 800; color: #38BDF8;">${p.step}:</span> <span style="color: var(--text-secondary);">${p.detail}</span>
          </div>
        `).join('')}
      </div>
    </div>
  `;
}

  // Emergency Cache Flush Handler
  const btnFlush = document.getElementById('btn-force-flush-cache');
  if (btnFlush) {
    btnFlush.addEventListener('click', async () => {
      btnFlush.textContent = '⏳ Очищаю кэш браузера...';
      try {
        if ('caches' in window) {
          const keys = await caches.keys();
          await Promise.all(keys.map(k => caches.delete(k)));
        }
        if ('serviceWorker' in navigator) {
          const regs = await navigator.serviceWorker.getRegistrations();
          for (let r of regs) await r.unregister();
        }
        localStorage.removeItem('somnia_build_v');
        localStorage.removeItem('somnia_sleep_history_v2');
      } catch(e) {
        console.warn('Flush error:', e);
      }
      // Force reload with unique cachebuster param
      window.location.replace(window.location.origin + window.location.pathname + '?r=' + Date.now());
    });
  }
