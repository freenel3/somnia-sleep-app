/**
 * SOMNIA Sleep Tracker, Dream Studio & Circadian Habit Engine
 * Stores entries in LocalStorage with zero external dependencies.
 */
class SleepTracker {
  constructor() {
    this.STORAGE_KEY_LOGS = 'somnia_sleep_logs_v1';
    this.STORAGE_KEY_QUESTS = 'somnia_daily_quests_v1';
    this.TARGET_HOURS = 8.0;
  }

  getLogs() {
    try {
      const raw = localStorage.getItem(this.STORAGE_KEY_LOGS);
      return raw ? JSON.parse(raw) : this.getSeedLogs();
    } catch (e) {
      return this.getSeedLogs();
    }
  }

  saveLogs(logs) {
    localStorage.setItem(this.STORAGE_KEY_LOGS, JSON.stringify(logs));
  }

  addLog(entry) {
    const logs = this.getLogs();
    const newEntry = {
      id: Date.now().toString(),
      date: entry.date || new Date().toISOString().split('T')[0],
      durationHours: parseFloat(entry.durationHours) || 7.5,
      qualityScore: parseInt(entry.qualityScore, 10) || 80,
      isLucid: !!entry.isLucid,
      dreamNotes: entry.dreamNotes || '',
      factors: entry.factors || [],
    };
    logs.unshift(newEntry);
    this.saveLogs(logs);
    return newEntry;
  }

  deleteLog(id) {
    const logs = this.getLogs().filter(l => l.id !== id);
    this.saveLogs(logs);
  }

  /**
   * Calculates Sleep Debt over the last 7 days.
   * Sleep Debt = (7 * TargetHours) - Sum(actualHours)
   */
  calculateSleepDebt() {
    const logs = this.getLogs().slice(0, 7);
    if (logs.length === 0) return { debtHours: 0, status: 'Нет данных' };

    const totalActual = logs.reduce((acc, log) => acc + log.durationHours, 0);
    const expected = logs.length * this.TARGET_HOURS;
    const diff = Math.round((expected - totalActual) * 10) / 10;

    let status = 'Оптимально (В балансе)';
    if (diff > 5) status = 'Критический сонный долг (Высокий кортизол)';
    else if (diff > 2) status = 'Умеренный дефицит (Снижение реакции)';
    else if (diff < -2) status = 'Профицит (Отличный резерв)';

    return {
      debtHours: diff,
      actualHours: Math.round(totalActual * 10) / 10,
      daysCount: logs.length,
      status,
    };
  }

  /**
   * Generates dynamic SVG chart of recent sleep durations
   */
  renderSvgChart(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;

    const logs = this.getLogs().slice(0, 7).reverse();
    if (logs.length === 0) {
      container.innerHTML = '<div class="empty-state">Нет записей для графика</div>';
      return;
    }

    const width = 320;
    const height = 110;
    const padding = 20;

    const maxH = 10;
    const minH = 4;

    const points = logs.map((log, idx) => {
      const x = padding + (idx * ((width - padding * 2) / Math.max(1, logs.length - 1)));
      const normalizedY = (log.durationHours - minH) / (maxH - minH);
      const y = height - padding - (normalizedY * (height - padding * 2));
      return { x, y, hours: log.durationHours, date: log.date.slice(5) };
    });

    const polylinePoints = points.map(p => `${p.x},${p.y}`).join(' ');

    const svg = `
      <svg viewBox="0 0 ${width} ${height}" class="chart-svg">
        <defs>
          <linearGradient id="sleepGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="#818CF8" stop-opacity="0.8"/>
            <stop offset="100%" stop-color="#38BDF8" stop-opacity="0.1"/>
          </linearGradient>
        </defs>
        <!-- Target 8h guideline -->
        <line x1="${padding}" y1="${height - padding - ((8 - minH) / (maxH - minH)) * (height - padding * 2)}" 
              x2="${width - padding}" y2="${height - padding - ((8 - minH) / (maxH - minH)) * (height - padding * 2)}" 
              stroke="rgba(255,255,255,0.15)" stroke-dasharray="4" stroke-width="1"/>
        <text x="${width - padding - 40}" y="${height - padding - ((8 - minH) / (maxH - minH)) * (height - padding * 2) - 4}" 
              fill="rgba(255,255,255,0.3)" font-size="9">Цель 8.0ч</text>
        
        <!-- Trend Line -->
        <polyline fill="none" stroke="#6366F1" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" points="${polylinePoints}" />
        
        <!-- Dots -->
        ${points.map(p => `
          <circle cx="${p.x}" cy="${p.y}" r="4.5" fill="#38BDF8" stroke="#0F172A" stroke-width="2"/>
          <text x="${p.x}" y="${p.y - 8}" text-anchor="middle" fill="#E2E8F0" font-size="9" font-weight="600">${p.hours}ч</text>
          <text x="${p.x}" y="${height - 4}" text-anchor="middle" fill="rgba(255,255,255,0.4)" font-size="8">${p.date}</text>
        `).join('')}
      </svg>
    `;

    container.innerHTML = svg;
  }

  getDailyQuests() {
    const today = new Date().toISOString().split('T')[0];
    const raw = localStorage.getItem(this.STORAGE_KEY_QUESTS);
    let state = raw ? JSON.parse(raw) : {};

    if (state.date !== today) {
      state = {
        date: today,
        quests: [
          { id: 'sun', text: 'Утренний свет 10-15 мин в глаза (Huberman Anchor)', done: false },
          { id: 'caffeine', text: 'Отказ от кофеина за 9-10 часов до сна', done: false },
          { id: 'temp', text: 'Проветривание спальни до 18-19.5°C', done: false },
          { id: 'screen', text: 'Активация Melatonin Shield за 45 мин до сна', done: false },
          { id: 'shower', text: 'Теплый душ за 90 мин до сна (сброс температуры)', done: false },
        ]
      };
      localStorage.setItem(this.STORAGE_KEY_QUESTS, JSON.stringify(state));
    }
    return state.quests;
  }

  toggleQuest(questId) {
    const today = new Date().toISOString().split('T')[0];
    const quests = this.getDailyQuests().map(q => {
      if (q.id === questId) return { ...q, done: !q.done };
      return q;
    });
    localStorage.setItem(this.STORAGE_KEY_QUESTS, JSON.stringify({ date: today, quests }));
    return quests;
  }

  getSeedLogs() {
    return [
      { id: '1', date: '2026-10-24', durationHours: 7.0, qualityScore: 78, isLucid: false, dreamNotes: 'Сон про полет над ночным городом.' },
      { id: '2', date: '2026-10-25', durationHours: 6.5, qualityScore: 65, isLucid: false, dreamNotes: 'Беспокойный сон, поздно выпил кофе.' },
      { id: '3', date: '2026-10-26', durationHours: 8.0, qualityScore: 92, isLucid: true, dreamNotes: 'Осознанный сон! Управлял гравитацией.' },
      { id: '4', date: '2026-10-27', durationHours: 7.5, qualityScore: 84, isLucid: false, dreamNotes: 'Глубокий спокойный сон после 4-7-8.' },
      { id: '5', date: '2026-10-28', durationHours: 6.0, qualityScore: 58, isLucid: false, dreamNotes: 'Дедлайн, проснулся раньше будильника.' },
      { id: '6', date: '2026-10-29', durationHours: 8.5, qualityScore: 95, isLucid: false, dreamNotes: 'Полный отдых после тренировки.' },
    ];
  }
}

window.sleepTracker = new SleepTracker();
