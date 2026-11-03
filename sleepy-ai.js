/**
 * SOMNIA: Sleepy AI — Neuro-Circadian Coach & 100% Sleep Quality Engine
 * Calculates deterministic SQI (0-100%), performs Gap Analysis,
 * generates the 3-step Daily Recipe to 100%, and powers conversational AI advice.
 */

class SleepyAIEngine {
  constructor() {
    this.chatHistory = [
      {
        sender: 'sleepy',
        text: 'Привет! Я Слипи — твой персональный ИИ-сомнолог. Я анализирую показатели с твоих часов Redmi / Mi Fitness, веду тебя по 30-дневному курсу и подсказываю точные шаги, чтобы твой сон работал на 100%. Нажми быстрый вопрос внизу или напиши мне!',
        time: 'Сейчас'
      }
    ];
  }

  /**
   * Deterministic Sleep Quality Index (SQI) Calculation: 0 to 100%
   */
  calculateSQI(telemetry) {
    if (!telemetry || !telemetry.totalMinutes) return 78;

    const total = telemetry.totalMinutes;
    const deepPercent = (telemetry.deepMinutes / total) * 100;
    const remPercent = (telemetry.remMinutes / total) * 100;

    // Subindex 1: Phase Architecture (Target: Deep 20-22%, REM 20-24%)
    const deepScore = Math.max(0, Math.min(100, 100 - Math.abs(deepPercent - 21) * 4));
    const remScore = Math.max(0, Math.min(100, 100 - Math.abs(remPercent - 22) * 4));
    const s1 = 0.5 * deepScore + 0.5 * remScore;

    // Subindex 2: Sleep Continuity & Fragmentation
    const awakeMin = telemetry.awakeMinutes || 25;
    const s2 = Math.max(20, Math.min(100, 100 - awakeMin * 1.5));

    // Subindex 3: Autonomic Balance & HRV (Target: RMSSD 65-80ms)
    const hrv = telemetry.hrvRmssd || 65;
    const s3 = Math.max(30, Math.min(100, (hrv / 70) * 90));

    // Subindex 4: Hemodynamic Resting Heart Rate Drop (Target: 48-56 bpm)
    const hr = telemetry.restingHR || 54;
    let s4 = 100;
    if (hr > 56) s4 = Math.max(30, 100 - (hr - 56) * 3);
    else if (hr < 45) s4 = 95;

    // Subindex 5: Sleep Latency (Target: 10-20 min)
    const latency = telemetry.latencyMinutes || 15;
    const s5 = Math.max(25, Math.min(100, 100 - Math.abs(latency - 15) * 3));

    // Weighted Total: w1=0.25, w2=0.20, w3=0.20, w4=0.15, w5=0.20
    const sqi = Math.round(s1 * 0.25 + s2 * 0.20 + s3 * 0.20 + s4 * 0.15 + s5 * 0.20);
    return Math.max(40, Math.min(100, sqi));
  }

  /**
   * Gap Analysis: Pinpoint exact biological reasons why sleep is not 100%
   */
  getGapAnalysis(telemetry, sqi) {
    const gaps = [];

    const total = telemetry.totalMinutes || 460;
    const deepPercent = ((telemetry.deepMinutes || 90) / total) * 100;
    const remPercent = ((telemetry.remMinutes || 85) / total) * 100;
    const hr = telemetry.restingHR || 54;
    const hrv = telemetry.hrvRmssd || 65;

    if (deepPercent < 18) {
      gaps.push({
        title: 'Дефицит фазы глубокого сна (N3)',
        loss: Math.round((18 - deepPercent) * 1.8) + '%',
        cause: 'Повышенная температура тела перед сном или поздний приём пищи (инсулин блокирует соматотропин).',
        remedy: 'Охлади спальню до 19-20°C, надень свободные носки для вазодилатации и закончи ужин за 3 часа до сна.'
      });
    }

    if (hr > 55) {
      gaps.push({
        title: 'Недостаточное ночное падение пульса (Non-Dipping)',
        loss: Math.round((hr - 55) * 1.5) + '%',
        cause: 'Остаточный кофеин в крови или симпатический гипертонус из-за экранов и вечернего кортизола.',
        remedy: 'Жёсткая отсечка кофеина за 8 часов до сна и 5 минут дыхания 4-7-8 перед подушкой.'
      });
    }

    if (remPercent < 18) {
      gaps.push({
        title: 'Урезанная фаза сновидений (REM)',
        loss: '6%',
        cause: 'Преждевременный резкий подъем по будильнику посреди 90-минутного ультрадианного цикла.',
        remedy: 'Синхронизируй будильник кратно 1.5 часам (7.5ч или 9ч сна) через модуль «90-мин Циклы».'
      });
    }

    if (hrv < 60) {
      gaps.push({
        title: 'Сниженная вариабельность пульса (HRV)',
        loss: '8%',
        cause: 'Физическое или нервное переутомление. Парасимпатическая система не успевает восстановиться.',
        remedy: '20 минут сессия NSDR (Йога-Нидра) и 2-3 капли масла лаванды на край подушки.'
      });
    }

    if (gaps.length === 0) {
      gaps.push({
        title: 'Филигранная калибровка ритма',
        loss: `${100 - sqi}%`,
        cause: 'Небольшой циркадный дрейф времени отхода ко сну (±20 минут).',
        remedy: 'Зафиксируй утреннюю инсоляцию: 10 минут прямого дневного света сразу после пробуждения.'
      });
    }

    return gaps;
  }

  /**
   * Actionable 3-Step Daily Recipe to hit 100% Sleep Quality
   */
  getRoadmapTo100(telemetry, currentDayNumber) {
    const sqi = this.calculateSQI(telemetry);
    const day = window.sleepyCourse ? window.sleepyCourse.getDay(currentDayNumber) : null;

    const step1 = {
      tag: '🔥 Главный рычаг дня',
      title: 'Температурный сброс ядра тела',
      desc: 'Теплый душ 10 мин за 50 минут до сна + свободные носки в постели. Это ускорит засыпание на 36% и добавит +20 минут глубокого сна.'
    };

    const step2 = {
      tag: `📚 Из курса «Слипи» (День ${currentDayNumber})`,
      title: day ? day.title : 'Дисциплина двух будильников',
      desc: day ? day.task : 'Установи предупреждающий будильник за 1.5ч и основной за 1ч до сна.'
    };

    const step3 = {
      tag: '🧬 Биохимический якорь',
      title: 'Кофеиновый дедлайн и 2 киви',
      desc: 'Стоп кофеин за 8 часов до сна. За 1 час до отбоя съешь 2 спелых киви (природный серотонин увеличит время сна на 13%).'
    };

    const forecast = Math.min(100, sqi + 14);

    return {
      currentSqi: sqi,
      forecastSqi: forecast,
      steps: [step1, step2, step3]
    };
  }

  /**
   * Conversational Assistant: Answers sleep questions with scientific depth and empathy
   */
  respondToPrompt(prompt) {
    const lower = prompt.toLowerCase();
    const tel = window.miFitSync ? window.miFitSync.telemetry : {};
    const sqi = this.calculateSQI(tel);

    if (lower.includes('ошиб') || lower.includes('проеб') || lower.includes('разбор') || lower.includes('почему') || lower.includes('плохо') || lower.includes('разбит') || lower.includes('сон')) {
      const audit = window.miFitSync ? window.miFitSync.generateBrutalAudit() : null;
      if (audit) {
        const mistakesText = audit.mistakes.map(m => "• " + m.tag + ": " + m.title + "\n  " + m.desc).join("\n\n");
        const winsText = audit.wins.map(w => "• " + w).join("\n");
        const planText = audit.actionPlan.map(p => "• " + p.step + ": " + p.detail).join("\n");

        return "🔥 Честный разбор твоей ночи (" + (tel.date || 'Сегодня') + "):\n\n" +
          "📊 Вердикт: " + audit.verdict + "\n\n" +
          (audit.mistakes.length > 0 ? "❌ Главные ошибки:\n" + mistakesText + "\n\n" : "") +
          (audit.wins.length > 0 ? "✅ Что сделано правильно:\n" + winsText + "\n\n" : "") +
          "🎯 Что делать прямо сейчас:\n" + planText;
      }
    }

    if (lower.includes('100%') || lower.includes('наладить') || lower.includes('план')) {
      return `🎯 Чтобы разогнать твой сон до 100% (сейчас твой расчетный SQI ${sqi}%):\n\n` +
        `1. Оптимизируй температуру: горячий душ за 45 мин до сна + носки для вазодилатации (добавит +25 минут к глубокому сну).\n` +
        `2. Жёстко отсекай кофеин за 8-10 часов до отбоя — это снизит ночной пульс на 4-6 уд/мин.\n` +
        `3. Проходи по 1 дню курса «Слипи» — там заложены проверенные микропривычки, которые перепрошивают ЦНС навсегда. Твой план на сегодня уже в карточке выше!`;
    }

    if (lower.includes('не могу уснуть') || lower.includes('бессонниц') || lower.includes('кручусь')) {
      return `🌙 Главный закон из курса «Слипи»: перестань бороться со сном и заставлять себя уснуть!\n\n` +
        `• Не смотри на часы (это моментально вбрасывает кортизол).\n` +
        `• Включи режим «🫁 Вагус» или «🧘 NSDR Нидра» — переключи фокус с мыслей на тело.\n` +
        `• Если прошло больше 20 минут в постели — встань при неярком янтарном свете, выпей глоток воды и почитай скучную бумажную книгу, пока не накатит первая зевота.`;
    }

    if (lower.includes('кофе') || lower.includes('энергетик')) {
      return `☕ Кофеин блокирует аденозиновые рецепторы усталости. Период полувыведения — от 5 до 7 часов!\n\n` +
        `Если ты выпил эспрессо в 16:00, к полуночи в крови всё ещё циркулирует 25-50% дозы. Мозг может уснуть, но дельта-волны глубокого сна (SWS) будут подавлены, а ночной пульс покоя останется высоким. Всегда держи дедлайн за 8-10 часов до сна!`;
    }

    if (lower.includes('ночн') || lower.includes('смен') || lower.includes('после смены')) {
      return `🕶 Протокол для сменщика из базы знаний «Слипи»:\n\n` +
        `1. По пути домой надевай темные поляризационные очки ЕЩЁ В ЗДАНИИ, чтобы утренний свет не сбил начавшийся синтез мелатонина.\n` +
        `2. Дома: тотальный Blackout (маска на глаза + беруши).\n` +
        `3. Не наедайся тяжелым завтраком — легкий перекус (овсянка/банан/киви).\n` +
        `4. Спи одним блоком 5-6 часов, а вечером при необходимости сделай Power Nap ровно на 20 минут.`;
    }

    if (lower.includes('часы') || lower.includes('mi fitness') || lower.includes('redmi')) {
      return `⌚ Твои часы Redmi Watch 5 Active передают данные о фазах Deep, Light, REM и пульсе покоя.\n\n` +
        `Во вкладке «⌚ Mi Fitness» ты можешь нажать «🔗 Подключить часы по Bluetooth» или загрузить файл выгрузки из приложения Mi Fitness. Somnia мгновенно рассчитает точный SQI и покажет, где теряются драгоценные проценты сна!`;
    }

    // Default expert response
    return `💡 Анализ сна по курсу «Слипи»: Твой текущий показатель качества ${sqi}%. Сон строится на двух законах — аденозиновом давлении (Process S) и циркадных фазах (Process C). Охлади комнату, используй 4-7-8 дыхание перед сном и отметь сегодняшний урок в курсе!`;
  }
}

window.sleepyAI = new SleepyAIEngine();
