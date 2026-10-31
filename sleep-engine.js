/**
 * SOMNIA Circadian & Neuro-Biology Engine
 * Implements evidence-based calculations: Caffeine pharmacokinetics, Circadian Phase,
 * Core Body Temp Nadir, 90-min Ultradian Cycles, and Sleep Twin Predictive Score.
 */
class SleepEngine {
  constructor() {
    this.CAFFEINE_HALF_LIFE_HOURS = 5.0; // Average human clearance
    this.AVG_SLEEP_LATENCY_MINS = 14;   // Healthy latency
    this.CYCLE_MINUTES = 90;            // Ultradian sleep cycle
  }

  /**
   * Calculates residual caffeine in bloodstream using exponential decay.
   * C(t) = C0 * (0.5)^(hoursPassed / 5.0)
   */
  calculateResidualCaffeine(initialMg, hoursPassed) {
    if (initialMg <= 0 || hoursPassed < 0) return 0;
    const residual = initialMg * Math.pow(0.5, hoursPassed / this.CAFFEINE_HALF_LIFE_HOURS);
    return Math.round(residual * 10) / 10;
  }

  /**
   * Estimates Adenosine receptor occupancy % based on residual caffeine.
   */
  getAdenosineBlockage(residualMg) {
    if (residualMg <= 5) return 0;
    // ~100mg blocks ~50% of A1/A2A receptors
    const blockage = Math.min(85, (residualMg / 100) * 50);
    return Math.round(blockage);
  }

  /**
   * Calculate Sleep Twin Recovery Score (0-100%)
   * Combines physiological factors into an actionable forecast.
   */
  predictSleepScore(inputs) {
    const {
      caffeineMg = 0,
      caffeineHoursAgo = 8,
      screenMinutesBeforeBed = 30,
      roomTempCelsius = 19,
      alcoholDrinks = 0,
      exerciseHoursAgo = 6,
    } = inputs;

    let score = 100;
    const insights = [];

    // 1. Caffeine Penalty
    const residualCaffeine = this.calculateResidualCaffeine(caffeineMg, caffeineHoursAgo);
    if (residualCaffeine > 35) {
      const penalty = Math.min(25, Math.round((residualCaffeine - 35) * 0.6));
      score -= penalty;
      insights.push(`☕ Остаточный кофеин: ${residualCaffeine} мг блокирует ~${this.getAdenosineBlockage(residualCaffeine)}% аденозиновых рецепторов. Снизит глубину дельта-сна (SWS).`);
    } else if (residualCaffeine > 0) {
      insights.push(`✅ Кофеин очищен (остаток ${residualCaffeine} мг) — рецепторы свободны для сонливости.`);
    }

    // 2. Blue Light Screen Penalty (Melatonin Phase Delay)
    if (screenMinutesBeforeBed > 20) {
      const delayMin = Math.round(screenMinutesBeforeBed * 0.7);
      const penalty = Math.min(20, Math.round(screenMinutesBeforeBed * 0.25));
      score -= penalty;
      insights.push(`📱 Синий спектр: задержка выработки мелатонина на ~${delayMin} мин. Включите Melatonin Shield.`);
    } else {
      insights.push(`🌙 Идеальная световая гигиена — естественный выброс мелатонина в норме.`);
    }

    // 3. Room Temperature (Thermal Nadir)
    // Optimal sleep ambient temp: 17°C - 19.5°C
    if (roomTempCelsius > 22) {
      const penalty = Math.min(18, Math.round((roomTempCelsius - 22) * 4));
      score -= penalty;
      insights.push(`🌡️ Жарко (${roomTempCelsius}°C): телу тяжело сбросить 1°C для глубокого сна. Проветрите до 18-19°C.`);
    } else if (roomTempCelsius < 15) {
      score -= 8;
      insights.push(`🥶 Слишком прохладно (${roomTempCelsius}°C): мышечный тонус может нарушить фазы REM.`);
    } else {
      insights.push(`❄️ Оптимальная температура (${roomTempCelsius}°C) для быстрого перехода в стадию N3.`);
    }

    // 4. Alcohol Penalty (REM suppression)
    if (alcoholDrinks > 0) {
      const penalty = Math.min(30, alcoholDrinks * 12);
      score -= penalty;
      insights.push(`🍷 Алкоголь (${alcoholDrinks} порц.): фрагментация 2-й половины ночи и подавление REM-фаз.`);
    }

    // 5. Late Exercise
    if (exerciseHoursAgo < 2 && exerciseHoursAgo > 0) {
      score -= 10;
      insights.push(`⚡ Тренировка <2ч назад: повышенный кортизол и частота сердечных сокращений (HRV снижен).`);
    }

    score = Math.max(10, Math.min(100, Math.round(score)));

    return {
      score,
      residualCaffeine,
      insights,
      qualityLabel: score >= 85 ? 'Идеальное (Deep Regenerative)' : score >= 70 ? 'Хорошее (Stable Rest)' : score >= 50 ? 'Умеренное (Light/Fragmented)' : 'Требует коррекции (High Inertia)',
    };
  }

  /**
   * 90-Minute Ultradian Cycles Calculator
   * Given wake-up time, calculate best bedtime options (4, 5, 6 cycles)
   */
  calculateBedtimes(wakeTimeString) {
    const [hours, minutes] = wakeTimeString.split(':').map(Number);
    const wakeDate = new Date();
    wakeDate.setHours(hours, minutes, 0, 0);

    const cycles = [6, 5, 4, 3]; // 9h, 7.5h, 6h, 4.5h
    return cycles.map(count => {
      const totalMinutes = count * this.CYCLE_MINUTES + this.AVG_SLEEP_LATENCY_MINS;
      const bedDate = new Date(wakeDate.getTime() - totalMinutes * 60 * 1000);
      const hh = String(bedDate.getHours()).padStart(2, '0');
      const mm = String(bedDate.getMinutes()).padStart(2, '0');
      return {
        cycles: count,
        totalHours: (count * 1.5).toFixed(1),
        bedtime: `${hh}:${mm}`,
        label: count === 5 ? '⭐ Золотой стандарт (7.5 ч)' : count === 6 ? 'Глубокое восстановление (9 ч)' : count === 4 ? 'Быстрый минимум (6 ч)' : 'Авральный режим (4.5 ч)',
        isRecommended: count === 5,
      };
    });
  }

  /**
   * Calculate wake-up times if going to bed RIGHT NOW
   */
  calculateWakeTimesNow() {
    const now = new Date();
    const cycles = [3, 4, 5, 6];
    return cycles.map(count => {
      const totalMinutes = count * this.CYCLE_MINUTES + this.AVG_SLEEP_LATENCY_MINS;
      const wakeDate = new Date(now.getTime() + totalMinutes * 60 * 1000);
      const hh = String(wakeDate.getHours()).padStart(2, '0');
      const mm = String(wakeDate.getMinutes()).padStart(2, '0');
      return {
        cycles: count,
        totalHours: (count * 1.5).toFixed(1),
        wakeTime: `${hh}:${mm}`,
        label: count === 5 ? '⭐ Золотой стандарт (7.5 ч)' : count === 6 ? 'Идеальное восстановление (9 ч)' : count === 4 ? 'Свежее утро (6 ч)' : 'Короткий сон (4.5 ч)',
        isRecommended: count === 5,
      };
    });
  }

  /**
   * NASA Ames Nap Protocols
   */
  getNapProtocols() {
    return [
      {
        id: 'power',
        name: 'Power Nap',
        duration: 20,
        stages: 'N1 + N2 (Лёгкий сон)',
        benefits: 'Моментальная перезагрузка префронтальной коры, 0% сонной инерции',
        desc: 'Идеально для полуденной усталости. Предотвращает вход в глубокий дельта-сон.',
      },
      {
        id: 'nasa',
        name: 'NASA Ames Protocol',
        duration: 26,
        badge: 'NASA Tested',
        stages: 'N2 Оптимизированный',
        benefits: '+34% к когнитивной работоспособности, +54% к внимательности',
        desc: 'Знаменитый протокол космического агентства для военных пилотов и астронавтов.',
      },
      {
        id: 'slowwave',
        name: 'Slow-Wave Boost',
        duration: 60,
        stages: 'N3 (Глубокий медленный сон)',
        benefits: 'Консолидация фактологической памяти, обучение, мышечный релакс',
        desc: 'Может вызвать легкую сонливость на 10-15 мин после звонка, но очищает мозг от токсинов.',
      },
      {
        id: 'full',
        name: 'Full Ultradian Cycle',
        duration: 90,
        stages: 'Полный цикл: N1-N3 + REM',
        benefits: 'Эмоциональный сброс, креативность, решение неразрешимых задач',
        desc: 'Полный цикл без разрыва фаз — просыпаетесь на выходе из REM-фазы бодрым.',
      },
    ];
  }
}

window.sleepEngine = new SleepEngine();
