/**
 * SOMNIA Vagus-Activation Breathwork Controller
 * Powers interactive animated visual ring, phase timings, audio chimes, and state machine.
 */
class BreathworkEngine {
  constructor() {
    this.isActive = false;
    this.currentProtocol = '478';
    this.stepIndex = 0;
    this.stepTimeRemaining = 0;
    this.cycleCount = 0;
    this.intervalId = null;
    this.onTick = null;
    this.onPhaseChange = null;

    this.protocols = {
      '478': {
        name: '4-7-8 Вейла',
        tagline: 'Включение парасимпатической нервной системы',
        steps: [
          { phase: 'Вдох', duration: 4, action: 'inhale', text: 'Медленно вдыхайте через нос' },
          { phase: 'Задержка', duration: 7, action: 'hold', text: 'Удерживайте воздух, расслабьте плечи' },
          { phase: 'Выдох', duration: 8, action: 'exhale', text: 'Плавный полный выдох через рот' },
        ],
        description: 'Классический метод д-ра Эндрю Вейла. Замедляет пульс за счет задержки и длинного выдоха.',
      },
      'box': {
        name: 'Box Breathing (Квадрат)',
        tagline: 'Мгновенное снятие тревожности и стресса',
        steps: [
          { phase: 'Вдох', duration: 4, action: 'inhale', text: 'Глубокий вдох через нос' },
          { phase: 'Задержка', duration: 4, action: 'hold', text: 'Задержка с наполненными легкими' },
          { phase: 'Выдох', duration: 4, action: 'exhale', text: 'Спокойный равномерный выдох' },
          { phase: 'Задержка', duration: 4, action: 'hold', text: 'Задержка на пустых легких' },
        ],
        description: 'Техника спецназа Navy SEALs для стабилизации давления и подавления паники.',
      },
      'sigh': {
        name: 'Физиологический вздох',
        tagline: 'Снижение уровня кортизола за 3 цикла (Huberman)',
        steps: [
          { phase: 'Вдох', duration: 3, action: 'inhale', text: 'Глубокий вдох через нос' },
          { phase: 'Довдох', duration: 1.5, action: 'inhale-extra', text: 'Резкий довдох верхушками легких' },
          { phase: 'Длинный выдох', duration: 6, action: 'exhale', text: 'Медленный выдох через расслабленные губы' },
        ],
        description: 'Лаборатория Стэнфорда: повторное раскрытие спавшихся альвеол и сброс избыточного CO2.',
      },
      'coherent': {
        name: 'Когерентное дыхание',
        tagline: 'Синхронизация вариабельности сердечного ритма (HRV)',
        steps: [
          { phase: 'Вдох', duration: 5.5, action: 'inhale', text: 'Мягкий плавный вдох' },
          { phase: 'Выдох', duration: 5.5, action: 'exhale', text: 'Мягкий плавный выдох' },
        ],
        description: 'Частота 0.1 Гц (5.5 вдохов в минуту) вводит сердце и мозг в состояние биологического резонанса.',
      },
    };
  }

  setProtocol(id) {
    if (this.protocols[id]) {
      this.currentProtocol = id;
      this.reset();
    }
  }

  start(onTick, onPhaseChange) {
    this.initAudio();
    this.isActive = true;
    this.stepIndex = 0;
    this.cycleCount = 1;
    this.onTick = onTick;
    this.onPhaseChange = onPhaseChange;

    const protocol = this.protocols[this.currentProtocol];
    this.currentStep = protocol.steps[0];
    this.stepTimeRemaining = this.currentStep.duration;

    this.notifyPhase();
    this.playToneForPhase(this.currentStep.action);

    this.intervalId = setInterval(() => {
      this.stepTimeRemaining -= 0.1;
      if (this.stepTimeRemaining <= 0.05) {
        this.nextStep();
      } else {
        if (this.onTick) {
          const progress = 1 - (this.stepTimeRemaining / this.currentStep.duration);
          this.onTick(this.stepTimeRemaining, progress, this.cycleCount);
        }
      }
    }, 100);
  }

  nextStep() {
    const protocol = this.protocols[this.currentProtocol];
    this.stepIndex++;
    if (this.stepIndex >= protocol.steps.length) {
      this.stepIndex = 0;
      this.cycleCount++;
    }

    this.currentStep = protocol.steps[this.stepIndex];
    this.stepTimeRemaining = this.currentStep.duration;

    this.notifyPhase();
    this.playToneForPhase(this.currentStep.action);
  }

  notifyPhase() {
    if (this.onPhaseChange) {
      this.onPhaseChange(this.currentStep, this.cycleCount);
    }
  }

  playToneForPhase(action) {
    if (window.somniaAudio) {
      if (action.includes('inhale')) {
        window.somniaAudio.playChime(432, 1.8);
      } else if (action === 'hold') {
        window.somniaAudio.playChime(528, 1.2);
      } else if (action === 'exhale') {
        window.somniaAudio.playChime(396, 2.2);
      }
    }
  }

  stop() {
    this.isActive = false;
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  reset() {
    this.stop();
    this.stepIndex = 0;
    this.cycleCount = 0;
    this.stepTimeRemaining = 0;
  }

  initAudio() {
    if (window.somniaAudio) {
      window.somniaAudio.initContext();
    }
  }
}

window.breathworkEngine = new BreathworkEngine();
