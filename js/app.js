/**
 * BerryPulse Wellness Tracker - Main Application Coordinator
 */

const BerryPulseApp = {
  currentTab: 'overview',

  init: function() {
    // 1. Initialize Storage first
    BerryPulseStorage.init();

    // 2. Initialize Sub-modules
    if (typeof BerryPulseAI !== 'undefined') BerryPulseAI.init();
    BerryPulseNutrition.init();
    BerryPulseHabits.init();
    BerryPulseActivity.init();
    BerryPulseAppleWatch.init();
    BerryPulseWater.init();
    BerryPulseSleep.init();
    BerryPulseMindfulness.init();
    BerryPulseCharts.init();
    if (window.BerryPulseAIAdvisor) BerryPulseAIAdvisor.init();

    // 3. Bind Global Application Events
    this.bindGlobalEvents();
    this.updateHeaderDateDisplay();
    this.setupConfettiCanvas();

    console.log('🍇 BerryPulse initialized successfully!');
  },

  bindGlobalEvents: function() {
    // Tab switching
    const tabButtons = document.querySelectorAll('[data-tab-target]');
    tabButtons.forEach(btn => {
      btn.addEventListener('click', (e) => {
        const target = btn.dataset.tabTarget;
        this.switchTab(target);
      });
    });

    // Date navigation
    const btnPrevDay = document.getElementById('btn-prev-day');
    const btnNextDay = document.getElementById('btn-next-day');
    const btnToday = document.getElementById('btn-today');
    const datePickerInput = document.getElementById('global-date-picker');

    if (btnPrevDay) {
      btnPrevDay.addEventListener('click', () => this.shiftActiveDate(-1));
    }
    if (btnNextDay) {
      btnNextDay.addEventListener('click', () => this.shiftActiveDate(1));
    }
    if (btnToday) {
      btnToday.addEventListener('click', () => {
        const todayStr = new Date().toISOString().split('T')[0];
        BerryPulseStorage.setActiveDate(todayStr);
        this.updateHeaderDateDisplay();
      });
    }
    if (datePickerInput) {
      datePickerInput.value = BerryPulseStorage.activeDate;
      datePickerInput.addEventListener('change', (e) => {
        if (e.target.value) {
          BerryPulseStorage.setActiveDate(e.target.value);
          this.updateHeaderDateDisplay();
        }
      });
    }

    // Modal background click to close
    document.querySelectorAll('.modal-backdrop').forEach(modal => {
      modal.addEventListener('click', (e) => {
        if (e.target === modal) {
          modal.classList.add('hidden');
          modal.classList.remove('flex');
        }
      });
    });
  },

  switchTab: function(tabId) {
    this.currentTab = tabId;

    // Update nav button states using dedicated tab-active / tab-inactive classes
    document.querySelectorAll('[data-tab-target]').forEach(btn => {
      const isTarget = btn.dataset.tabTarget === tabId;
      if (isTarget) {
        btn.classList.add('tab-active');
        btn.classList.remove('tab-inactive');
      } else {
        btn.classList.remove('tab-active');
        btn.classList.add('tab-inactive');
      }
    });

    // Toggle tab view containers
    document.querySelectorAll('.tab-view-content').forEach(view => {
      if (view.id === `view-${tabId}`) {
        view.classList.remove('hidden');
      } else {
        view.classList.add('hidden');
      }
    });

    // Re-render corresponding module views immediately upon switching
    if (tabId === 'habits') {
      BerryPulseHabits.render();
    } else if (tabId === 'nutrition') {
      BerryPulseNutrition.render();
    } else if (tabId === 'activity') {
      BerryPulseActivity.render();
      BerryPulseAppleWatch.render();
    } else if (tabId === 'water') {
      BerryPulseWater.render();
    } else if (tabId === 'sleep') {
      BerryPulseSleep.render();
    } else if (tabId === 'mindfulness') {
      BerryPulseMindfulness.render();
    } else if (tabId === 'analytics' || tabId === 'overview') {
      BerryPulseSleep.render();
      setTimeout(() => BerryPulseCharts.renderAll(), 50);
    }

    window.scrollTo({ top: 0, behavior: 'smooth' });
  },

  shiftActiveDate: function(offsetDays) {
    const cur = new Date(BerryPulseStorage.activeDate + 'T12:00:00');
    cur.setDate(cur.getDate() + offsetDays);
    const newKey = cur.toISOString().split('T')[0];
    BerryPulseStorage.setActiveDate(newKey);
    this.updateHeaderDateDisplay();
  },

  updateHeaderDateDisplay: function() {
    const activeKey = BerryPulseStorage.activeDate;
    const todayKey = new Date().toISOString().split('T')[0];

    const displayEl = document.getElementById('header-active-date-text');
    const pickerInput = document.getElementById('global-date-picker');
    const todayBtn = document.getElementById('btn-today');

    const d = new Date(activeKey + 'T12:00:00');
    const options = { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' };
    const formatted = d.toLocaleDateString('en-US', options);

    if (displayEl) {
      if (activeKey === todayKey) {
        displayEl.innerHTML = `<span class="text-pink-400 font-bold">Today</span>, ${formatted.split(',')[1]}`;
        if (todayBtn) todayBtn.classList.add('opacity-40', 'cursor-not-allowed');
      } else {
        displayEl.textContent = formatted;
        if (todayBtn) todayBtn.classList.remove('opacity-40', 'cursor-not-allowed');
      }
    }

    if (pickerInput) {
      pickerInput.value = activeKey;
    }
  },

  showToast: function(message, duration = 3000) {
    const toast = document.getElementById('app-toast-notification');
    const textEl = document.getElementById('app-toast-text');
    if (!toast || !textEl) return;

    textEl.innerHTML = message;
    toast.classList.remove('translate-y-24', 'opacity-0');
    toast.classList.add('translate-y-0', 'opacity-100');

    clearTimeout(this._toastTimeout);
    this._toastTimeout = setTimeout(() => {
      toast.classList.add('translate-y-24', 'opacity-0');
      toast.classList.remove('translate-y-0', 'opacity-100');
    }, duration);
  },

  // Pure JavaScript particle confetti celebration
  setupConfettiCanvas: function() {
    this.canvas = document.getElementById('confetti-canvas');
    if (this.canvas) {
      this.ctx = this.canvas.getContext('2d');
      this.resizeCanvas();
      window.addEventListener('resize', () => this.resizeCanvas());
    }
  },

  resizeCanvas: function() {
    if (!this.canvas) return;
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
  },

  triggerConfetti: function() {
    if (!this.canvas || !this.ctx) return;
    this.resizeCanvas();

    const colors = ['#f43f5e', '#ec4899', '#a855f7', '#38bdf8', '#10b981', '#fbbf24'];
    const particles = [];
    const count = 75;

    for (let i = 0; i < count; i++) {
      particles.push({
        x: window.innerWidth * (0.3 + Math.random() * 0.4),
        y: window.innerHeight * 0.4,
        vx: (Math.random() - 0.5) * 14,
        vy: (Math.random() - 1.2) * 12,
        size: Math.random() * 7 + 4,
        color: colors[Math.floor(Math.random() * colors.length)],
        rotation: Math.random() * 360,
        rotationSpeed: (Math.random() - 0.5) * 10,
        opacity: 1
      });
    }

    let frame = 0;
    const animate = () => {
      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
      let alive = false;

      particles.forEach(p => {
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.35; // Gravity
        p.rotation += p.rotationSpeed;
        p.opacity -= 0.012;

        if (p.opacity > 0) {
          alive = true;
          this.ctx.save();
          this.ctx.translate(p.x, p.y);
          this.ctx.rotate((p.rotation * Math.PI) / 180);
          this.ctx.fillStyle = p.color;
          this.ctx.globalAlpha = Math.max(0, p.opacity);
          this.ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 1.4);
          this.ctx.restore();
        }
      });

      frame++;
      if (alive && frame < 120) {
        requestAnimationFrame(animate);
      } else {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
      }
    };

    requestAnimationFrame(animate);
  },

  // Settings & Goals modal
  openSettingsModal: function() {
    const modal = document.getElementById('settings-modal');
    if (!modal) return;

    const goals = BerryPulseStorage.state.goals || BerryPulseData.defaultGoals;
    document.getElementById('goal-calories-input').value = goals.calories || 2200;
    const proteinInput = document.getElementById('goal-protein-input');
    if (proteinInput) proteinInput.value = goals.proteinGrams || 140;
    document.getElementById('goal-water-input').value = goals.waterOz || (goals.waterMl ? Math.round(goals.waterMl / 29.5735) : 96);
    document.getElementById('goal-sleep-input').value = goals.sleepHours || 8.0;
    document.getElementById('goal-mindfulness-input').value = goals.mindfulnessMins || 15;
    document.getElementById('goal-active-cal-input').value = goals.activeCalories || 550;

    modal.classList.remove('hidden');
    modal.classList.add('flex');
  },

  closeSettingsModal: function() {
    const modal = document.getElementById('settings-modal');
    if (modal) {
      modal.classList.add('hidden');
      modal.classList.remove('flex');
    }
  },

  saveSettings: function() {
    if (!BerryPulseStorage.state.goals) {
      BerryPulseStorage.state.goals = {};
    }
    const goals = BerryPulseStorage.state.goals;
    goals.calories = parseInt(document.getElementById('goal-calories-input').value, 10) || 2200;
    const proteinInput = document.getElementById('goal-protein-input');
    if (proteinInput) goals.proteinGrams = parseInt(proteinInput.value, 10) || 140;
    goals.waterOz = parseInt(document.getElementById('goal-water-input').value, 10) || 96;
    goals.waterMl = Math.round(goals.waterOz * 29.5735);
    goals.sleepHours = parseFloat(document.getElementById('goal-sleep-input').value) || 8.0;
    goals.mindfulnessMins = parseInt(document.getElementById('goal-mindfulness-input').value, 10) || 15;
    goals.activeCalories = parseInt(document.getElementById('goal-active-cal-input').value, 10) || 550;

    // Synchronize goals directly to active day record as well
    const dayData = BerryPulseStorage.getActiveDayData();
    if (dayData.nutrition) dayData.nutrition.dailyGoalCalories = goals.calories;
    if (dayData.water) {
      dayData.water.goalOz = goals.waterOz;
      dayData.water.goalMl = goals.waterMl;
    }
    if (dayData.activity && dayData.activity.rings) {
      if (dayData.activity.rings.move) dayData.activity.rings.move.goal = goals.activeCalories;
    }
    if (dayData.mindfulness) dayData.mindfulness.targetMinutes = goals.mindfulnessMins;

    BerryPulseStorage.save();

    // Re-render all views immediately so changes reflect everywhere
    if (window.BerryPulseNutrition) BerryPulseNutrition.render();
    if (window.BerryPulseWater) BerryPulseWater.render();
    if (window.BerryPulseAppleWatch) BerryPulseAppleWatch.render();
    if (window.BerryPulseSleep) BerryPulseSleep.render();
    if (window.BerryPulseMindfulness) BerryPulseMindfulness.render();
    if (window.BerryPulseCharts) BerryPulseCharts.renderAll();

    this.closeSettingsModal();
    this.showToast('Wellness targets updated successfully! 🎯');
  }
};

// Auto-run on DOM ready
document.addEventListener('DOMContentLoaded', () => {
  BerryPulseApp.init();
});

if (typeof module !== 'undefined') {
  module.exports = BerryPulseApp;
}
