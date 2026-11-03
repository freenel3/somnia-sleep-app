/**
 * SOMNIA: Sleepy AI — Neuro-Circadian Coach & 100% Sleep Quality Engine 2026
 * Supports dual-mode reasoning:
 * 1. Live LLM API (GPT-6.1 Sol, Claude Sonnet 5.5, Gemini 4 Argon via Tooken Club Prime or OpenAI/OpenRouter)
 * 2. Deterministic high-speed offline somnologist engine
 * Full telemetry context injection from Redmi Watch 5 Active & Mi Fitness.
 */

class SleepyAIEngine {
  constructor() {
    this.DEFAULT_BASE_URL = 'https://tooken.club/v1';
    this.DEFAULT_API_KEY = 'tc_live_c92f1bb1b585959d7e72f06cb687401a84e7bb25d2d3eea5';
    this.DEFAULT_MODEL = 'gpt-6.1-sol';

    this.loadConfig();

    this.chatHistory = [
      {
        sender: 'sleepy',
        text: 'Привет! Я Слипи — твой персональный ИИ-сомнолог 2026. Я подключен к твоим часам Redmi Watch 5 Active и Mi Fitness. Вижу твои фазы глубокого (N3) и быстрого (REM) сна, пульс покоя и HRV. Спрашивай о разборе ночи, причинах усталости или как разогнать качество сна до 100%!',
        time: 'Сейчас'
      }
    ];
  }

  loadConfig() {
    this.mode = localStorage.getItem('somnia_ai_mode') || 'live'; // 'live' or 'offline'
    this.baseUrl = localStorage.getItem('somnia_llm_base_url') || this.DEFAULT_BASE_URL;
    this.apiKey = localStorage.getItem('somnia_llm_api_key') || this.DEFAULT_API_KEY;
    this.model = localStorage.getItem('somnia_llm_model') || this.DEFAULT_MODEL;
  }

  saveConfig(newConfig) {
    if (newConfig.mode) {
      this.mode = newConfig.mode;
      localStorage.setItem('somnia_ai_mode', this.mode);
    }
    if (newConfig.baseUrl !== undefined) {
      this.baseUrl = newConfig.baseUrl.trim();
      localStorage.setItem('somnia_llm_base_url', this.baseUrl);
    }
    if (newConfig.apiKey !== undefined) {
      this.apiKey = newConfig.apiKey.trim();
      localStorage.setItem('somnia_llm_api_key', this.apiKey);
    }
    if (newConfig.model !== undefined) {
      this.model = newConfig.model.trim();
      localStorage.setItem('somnia_llm_model', this.model);
    }
  }

  getConfig() {
    return {
      mode: this.mode,
      baseUrl: this.baseUrl,
      apiKey: this.apiKey,
      model: this.model,
      isDefaultKey: this.apiKey === this.DEFAULT_API_KEY
    };
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
   * Build System Prompt for Live LLM, injecting deep telemetry from Redmi Watch & Mi Fitness
   */
  buildSystemPrompt() {
    const tel = window.miFitSync ? window.miFitSync.telemetry : {};
    const sqi = this.calculateSQI(tel);
    const totalH = Math.floor((tel.totalMinutes || 468) / 60);
    const totalM = (tel.totalMinutes || 468) % 60;
    const deepH = Math.floor((tel.deepMinutes || 98) / 60);
    const deepM = (tel.deepMinutes || 98) % 60;
    const remH = Math.floor((tel.remMinutes || 94) / 60);
    const remM = (tel.remMinutes || 94) % 60;
    const deepPct = (((tel.deepMinutes || 98) / (tel.totalMinutes || 468)) * 100).toFixed(1);
    const remPct = (((tel.remMinutes || 94) / (tel.totalMinutes || 468)) * 100).toFixed(1);

    // Multi-day history summary
    let historySummary = 'Нет доступной истории';
    if (window.miFitSync && window.miFitSync.history && window.miFitSync.history.length > 0) {
      historySummary = window.miFitSync.history.slice(0, 5).map(h => 
        `- ${h.date} (${h.dayOfWeek}): всего ${Math.floor(h.totalMinutes/60)}ч ${h.totalMinutes%60}м, N3: ${h.deepMinutes}м, REM: ${h.remMinutes}м, пульс: ${h.restingHR} bpm, отбой: ${h.bedtime || '?'}`
      ).join('\n');
    }

    const currentDay = window.sleepyCourse ? window.sleepyCourse.currentDay : 1;

    return `Ты — «Слипи», бескомпромиссный, элитный научный ИИ-сомнолог и биохакер 2026 года в приложении SOMNIA.
Ты работаешь с реальной телеметрией пользователя с часов Redmi Watch 5 Active BD98 (через синхронизацию Mi Fitness / Health Connect).

ТЕКУЩИЕ РЕАЛЬНЫЕ МЕТРИКИ С ЧАСОВ ПОЛЬЗОВАТЕЛЯ ЗА ПОСЛЕДНЮЮ НОЧЬ:
- Всего сон: ${totalH}ч ${totalM}м (${tel.totalMinutes || 468} мин)
- Глубокий сон (N3): ${deepH}ч ${deepM}м (${deepPct}%, оптимум 20-25%)
- Быстрый сон (REM): ${remH}ч ${remM}м (${remPct}%, оптимум 20-25%)
- Ночной пульс покоя: ${tel.restingHR || 52} уд/мин (норма Dipping -10..-15%)
- Вариабельность HRV: ${tel.hrvRmssd || 68} мс
- Время засыпания (латентность): ${tel.latencyMinutes || 14} мин
- Время отбоя: ${tel.bedtime || '23:30'}, пробуждение: ${tel.waketime || '07:18'}
- Индекс качества сна (SQI): ${sqi} / 100%
- Текущий день 30-дневного курса «Слипи»: День ${currentDay} из 30

ИСТОРИЯ ЗА ПОСЛЕДНИЕ ДНИ:
${historySummary}

ТВОЙ СТИЛЬ ОБЩЕНИЯ И ПРАВИЛА:
1. Говори на живом, уверенном, экспертном русском языке. Никаких слащавых шаблонов поддержки и корпоративной воды.
2. Объясняй физиологические механизмы: аденозиновое давление (Process S), мелатонин/кортизол (Process C), глимфатическая очистка мозга в фазе N3, парасимпатический тонус блуждающего нерва (HRV), ночное замедление пульса (Dipping).
3. Если пользователь спрашивает про свои ошибки ("где я накосячил", "почему я разбит", "разбор"):
   - Четко назови причину на основе его цифр (например, если глубокий сон <20% — объясни почему соматотропин не выделился; если пульс выше 55 — почему сердечно-сосудистая система не отдыхала).
   - Дай жесткий пошаговый протокол на вечер (температурный душ, стоп кофеина за 8ч, свет 10 000 K утром, дыхание 4-7-8).
4. ЕСЛИ ПОЛЬЗОВАТЕЛЬ ПИШЕТ СВОИ РЕАЛЬНЫЕ ЦИФРЫ СНА (например: "я сегодня спал 6.5 часов, глубокий сон 55 мин, пульс 64"):
   - Проанализируй именно их!
   - В самом конце ответа добавь скрытую команду калибровки в формате:
     [CALIBRATE: {"total": 390, "deep": 55, "rem": 70, "hr": 64}]
     (где total, deep, rem в минутах, hr в уд/мин). SOMNIA автоматически распарсит этот тег и обновит дашборд!
5. Держи ответ емким, плотным и максимально прикладным.`;
  }

  /**
   * Async Master Dispatcher: Uses Live LLM if online/enabled, falls back to deterministic engine
   */
  async getAIResponse(promptText) {
    if (this.mode === 'live' && this.apiKey) {
      try {
        const liveAnswer = await this.callLiveLLM(promptText);
        if (liveAnswer && liveAnswer.trim()) {
          return liveAnswer;
        }
      } catch (err) {
        console.warn('[SleepyAI] Live LLM failed, falling back to local engine:', err);
        const fallback = this.respondToPrompt(promptText);
        return `${fallback}\n\n*(⚡ Ответ локального сомнолога: сервер API временно недоступен или проверяется сеть)*`;
      }
    }

    // Deterministic offline response
    return this.respondToPrompt(promptText);
  }

  /**
   * Call Live LLM API via fetch
   */
  async callLiveLLM(promptText) {
    const systemPrompt = this.buildSystemPrompt();

    // Contextual message history (last 4 turns)
    const recentMessages = this.chatHistory.slice(-4).map(m => ({
      role: m.sender === 'user' ? 'user' : 'assistant',
      content: m.text
    }));

    const messages = [
      { role: 'system', content: systemPrompt },
      ...recentMessages,
      { role: 'user', content: promptText }
    ];

    const endpoint = this.baseUrl.replace(/\/+$/, '') + '/chat/completions';

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 20000); // 20s timeout

    const res = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`
      },
      body: JSON.stringify({
        model: this.model,
        messages: messages,
        temperature: 0.7,
        max_tokens: 850
      }),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!res.ok) {
      const errBody = await res.text().catch(() => '');
      throw new Error(`HTTP ${res.status}: ${errBody.slice(0, 150)}`);
    }

    const data = await res.json();
    let text = data.choices && data.choices[0] && data.choices[0].message
      ? data.choices[0].message.content
      : '';

    // Check for inline calibration command [CALIBRATE: {...}]
    const calibMatch = text.match(/\[CALIBRATE:\s*(\{.*?\})\]/);
    if (calibMatch) {
      try {
        const calibData = JSON.parse(calibMatch[1]);
        if (window.miFitSync) {
          const patch = {};
          if (calibData.total) patch.totalMinutes = Number(calibData.total);
          if (calibData.deep) patch.deepMinutes = Number(calibData.deep);
          if (calibData.rem) patch.remMinutes = Number(calibData.rem);
          if (calibData.hr) patch.restingHR = Number(calibData.hr);

          window.miFitSync.updateSelectedDayMetrics(patch);
          if (typeof renderWatchTelemetry === 'function') renderWatchTelemetry();
        }
        // Remove tag from user-facing text
        text = text.replace(calibMatch[0], '').trim();
      } catch (e) {
        console.warn('[SleepyAI] Could not parse calibration tag:', e);
      }
    }

    return text;
  }

  /**
   * Deterministic Offline Assistant (Fast fallback without network)
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
        `Во вкладке «⌚ Часы» ты можешь нажать «Ввести точные данные» или загрузить файл выгрузки из приложения Mi Fitness. Somnia мгновенно рассчитает точный SQI и покажет, где теряются драгоценные проценты сна!`;
    }

    // Default expert response
    return `💡 Анализ сна по курсу «Слипи»: Твой текущий показатель качества ${sqi}%. Сон строится на двух законах — аденозиновом давлении (Process S) и циркадных фазах (Process C). Охлади комнату, используй 4-7-8 дыхание перед сном и отметь сегодняшний урок в курсе!`;
  }
}

window.sleepyAI = new SleepyAIEngine();
