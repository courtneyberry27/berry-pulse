/**
 * BerryPulse Wellness Tracker - Mindfulness & Breathwork Module
 */

const BerryPulseMindfulness = {
  breathingInterval: null,
  breathingSeconds: 0,
  breathingPhase: 'ready', // 'inhale', 'hold1', 'exhale', 'hold2'
  currentTechnique: 'box', // 'box' (4-4-4-4) or 'relax' (4-7-8)
  isRunning: false,
  totalSessionSeconds: 0,
  audioCtx: null,

  init: function() {
    this.bindEvents();
    this.render();
  },

  bindEvents: function() {
    window.addEventListener('berrypulse:date-changed', () => this.render());
    window.addEventListener('berrypulse:data-updated', () => this.render());

    // Gratitude autosave on input
    const gratitudeInput = document.getElementById('mindfulness-gratitude-input');
    if (gratitudeInput) {
      gratitudeInput.addEventListener('input', (e) => {
        const dayData = BerryPulseStorage.getActiveDayData();
        if (!dayData.mindfulness) dayData.mindfulness = {};
        dayData.mindfulness.gratitudeJournal = e.target.value;
        BerryPulseStorage.save();
      });
    }
  },

  render: function() {
    const dayData = BerryPulseStorage.getActiveDayData();
    const mind = dayData.mindfulness || {
      targetMinutes: 15,
      completedMinutes: 15,
      mood: 'Calm & Centered',
      moodEmoji: '🧘',
      gratitudeJournal: ''
    };

    const targetMins = (BerryPulseStorage.state && BerryPulseStorage.state.goals && BerryPulseStorage.state.goals.mindfulnessMins) || mind.targetMinutes || 15;
    const completedMins = mind.completedMinutes || 0;
    const pct = Math.min(100, Math.round((completedMins / targetMins) * 100));

    // Elements
    const completedEl = document.getElementById('mindfulness-completed-mins');
    const targetEl = document.getElementById('mindfulness-target-mins');
    const pctEl = document.getElementById('mindfulness-pct');
    const progressBar = document.getElementById('mindfulness-progress-bar');
    const gratitudeInput = document.getElementById('mindfulness-gratitude-input');
    const moodEl = document.getElementById('mindfulness-current-mood');

    if (completedEl) completedEl.textContent = `${completedMins} min`;
    if (targetEl) targetEl.textContent = `${targetMins} min`;
    if (pctEl) pctEl.textContent = `${pct}%`;
    if (progressBar) progressBar.style.width = `${pct}%`;
    if (gratitudeInput && !gratitudeInput.matches(':focus')) {
      gratitudeInput.value = mind.gratitudeJournal || '';
    }
    if (moodEl) moodEl.textContent = `${mind.moodEmoji || '🧘'} ${mind.mood || 'Calm'}`;

    // Mood chips highlight
    const chips = document.querySelectorAll('.mood-chip-btn');
    chips.forEach(chip => {
      const moodVal = chip.dataset.mood;
      if (moodVal === mind.mood) {
        chip.classList.add('bg-purple-600', 'text-white', 'border-purple-400');
        chip.classList.remove('bg-berry-900/40', 'text-berry-300');
      } else {
        chip.classList.remove('bg-purple-600', 'text-white', 'border-purple-400');
        chip.classList.add('bg-berry-900/40', 'text-berry-300');
      }
    });
  },

  setMood: function(mood, emoji) {
    const dayData = BerryPulseStorage.getActiveDayData();
    if (!dayData.mindfulness) dayData.mindfulness = {};
    dayData.mindfulness.mood = mood;
    dayData.mindfulness.moodEmoji = emoji;
    BerryPulseStorage.save();
    BerryPulseApp.showToast(`Logged mood: ${emoji} ${mood}`);
  },

  // Synthesize serene singing bowl chime with Web Audio API
  playChime: function(freq = 432) {
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!this.audioCtx) {
        this.audioCtx = new AudioContext();
      }
      if (this.audioCtx.state === 'suspended') {
        this.audioCtx.resume();
      }

      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, this.audioCtx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(freq * 0.98, this.audioCtx.currentTime + 1.8);

      gain.gain.setValueAtTime(0.001, this.audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.25, this.audioCtx.currentTime + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.0001, this.audioCtx.currentTime + 2.2);

      osc.connect(gain);
      gain.connect(this.audioCtx.destination);

      osc.start();
      osc.stop(this.audioCtx.currentTime + 2.3);
    } catch (e) {
      // Audio autoplay policy fallback
    }
  },

  // Open the breathing visualizer modal
  openBreathingModal: function() {
    const modal = document.getElementById('breathing-modal');
    if (modal) {
      modal.classList.remove('hidden');
      modal.classList.add('flex');
    }
  },

  closeBreathingModal: function() {
    if (this.isRunning) {
      this.stopBreathing();
    }
    const modal = document.getElementById('breathing-modal');
    if (modal) {
      modal.classList.add('hidden');
      modal.classList.remove('flex');
    }
  },

  setBreathingTechnique: function(type) {
    if (this.isRunning) this.stopBreathing();
    this.currentTechnique = type;

    const btnBox = document.getElementById('btn-technique-box');
    const btnRelax = document.getElementById('btn-technique-relax');

    if (type === 'box') {
      if (btnBox) btnBox.classList.add('bg-pink-600', 'text-white');
      if (btnRelax) btnRelax.classList.remove('bg-pink-600', 'text-white');
    } else {
      if (btnRelax) btnRelax.classList.add('bg-pink-600', 'text-white');
      if (btnBox) btnBox.classList.remove('bg-pink-600', 'text-white');
    }
  },

  toggleBreathingSession: function() {
    if (this.isRunning) {
      this.stopBreathing();
    } else {
      this.startBreathing();
    }
  },

  startBreathing: function() {
    this.isRunning = true;
    this.totalSessionSeconds = 0;
    this.playChime(528);

    const toggleBtn = document.getElementById('btn-breathing-toggle');
    if (toggleBtn) toggleBtn.textContent = 'Pause Session';

    let phaseIndex = 0;
    let phaseSeconds = 0;

    // Phases:
    // Box: Inhale (4s), Hold (4s), Exhale (4s), Hold (4s)
    // 4-7-8: Inhale (4s), Hold (7s), Exhale (8s)
    const phases = this.currentTechnique === 'box'
      ? [
          { name: 'Inhale...', duration: 4, scale: 'scale-125', text: 'Inhale deeply through your nose' },
          { name: 'Hold...', duration: 4, scale: 'scale-125', text: 'Gently retain your breath' },
          { name: 'Exhale...', duration: 4, scale: 'scale-75', text: 'Smoothly release through mouth' },
          { name: 'Hold empty...', duration: 4, scale: 'scale-75', text: 'Rest before next breath' }
        ]
      : [
          { name: 'Inhale (4s)...', duration: 4, scale: 'scale-125', text: 'Breathe in calmly' },
          { name: 'Hold (7s)...', duration: 7, scale: 'scale-125', text: 'Hold with stillness' },
          { name: 'Exhale (8s)...', duration: 8, scale: 'scale-75', text: 'Slow, soothing whoosh out' }
        ];

    const orb = document.getElementById('breathing-orb');
    const phaseLabel = document.getElementById('breathing-phase-label');
    const instructionLabel = document.getElementById('breathing-instruction-label');
    const timerLabel = document.getElementById('breathing-timer-label');

    const updatePhase = () => {
      const current = phases[phaseIndex];
      if (phaseLabel) phaseLabel.textContent = current.name;
      if (instructionLabel) instructionLabel.textContent = current.text;
      if (orb) {
        orb.className = `w-44 h-44 rounded-full bg-gradient-to-tr from-pink-500 via-purple-600 to-indigo-500 shadow-2xl shadow-purple-500/50 flex items-center justify-center transition-all duration-[4000ms] ease-in-out ${current.scale}`;
      }
      this.playChime(phaseIndex === 0 ? 528 : (phaseIndex === 2 ? 396 : 432));
    };

    updatePhase();

    this.breathingInterval = setInterval(() => {
      phaseSeconds++;
      this.totalSessionSeconds++;

      const current = phases[phaseIndex];
      const remainingInPhase = current.duration - phaseSeconds;

      if (timerLabel) {
        const mins = Math.floor(this.totalSessionSeconds / 60);
        const secs = this.totalSessionSeconds % 60;
        timerLabel.textContent = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
      }

      if (phaseSeconds >= current.duration) {
        phaseSeconds = 0;
        phaseIndex = (phaseIndex + 1) % phases.length;
        updatePhase();
      }
    }, 1000);
  },

  stopBreathing: function() {
    clearInterval(this.breathingInterval);
    this.isRunning = false;

    const toggleBtn = document.getElementById('btn-breathing-toggle');
    if (toggleBtn) toggleBtn.textContent = 'Start Guided Session';

    const orb = document.getElementById('breathing-orb');
    if (orb) orb.className = 'w-44 h-44 rounded-full bg-gradient-to-tr from-pink-500 via-purple-600 to-indigo-500 shadow-2xl shadow-purple-500/50 flex items-center justify-center transition-all duration-700 ease-in-out scale-100';

    // If session was longer than 30s, log minutes to today's mindfulness
    const sessionMinutes = Math.max(1, Math.round(this.totalSessionSeconds / 60));
    if (this.totalSessionSeconds >= 30) {
      const dayData = BerryPulseStorage.getActiveDayData();
      if (!dayData.mindfulness) dayData.mindfulness = {};
      dayData.mindfulness.completedMinutes = (dayData.mindfulness.completedMinutes || 0) + sessionMinutes;
      if (!dayData.mindfulness.sessions) dayData.mindfulness.sessions = [];

      dayData.mindfulness.sessions.push({
        type: this.currentTechnique === 'box' ? 'Box Breathing' : '4-7-8 Relaxing Breath',
        minutes: sessionMinutes,
        completedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      });

      BerryPulseStorage.save();
      BerryPulseApp.showToast(`✨ Completed ${sessionMinutes} min breathwork session! Logged to daily goals.`);
    }
  }
};

window.BerryPulseMindfulness = BerryPulseMindfulness;

if (typeof module !== 'undefined') {
  module.exports = BerryPulseMindfulness;
}
