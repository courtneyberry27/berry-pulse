/**
 * BerryPulse Wellness Tracker - Storage & State Management
 */

const BerryPulseStorage = {
  STORAGE_KEY: 'berrypulse_app_state_v1',
  state: null,
  activeDate: new Date().toISOString().split('T')[0],

  getTodayString: function() {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  },

  isFutureDate: function(dateKey) {
    const todayStr = this.getTodayString();
    return (dateKey || this.activeDate) > todayStr;
  },

  sanitizeFutureDates: function() {
    if (!this.state || !this.state.history) return;
    const todayStr = this.getTodayString();
    let modified = false;
    Object.keys(this.state.history).forEach(dateKey => {
      if (dateKey > todayStr) {
        const entry = this.state.history[dateKey];
        if (entry && entry.sleep && !entry.sleep.isUserManuallySaved && entry.sleep.durationHours > 0) {
          entry.sleep = {
            bedtime: '',
            wakeTime: '',
            durationHours: 0,
            quality: 'Not recorded yet',
            qualityRating: 0,
            source: 'None',
            lastSyncedAt: null,
            restingHeartRate: 0,
            respiratoryRate: 0,
            stages: { deepPct: 0, remPct: 0, lightPct: 0, awakePct: 0 },
            tags: []
          };
          modified = true;
        }
      }
    });
    if (modified) {
      try {
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.state));
      } catch (e) {}
    }
  },

  // Initialize storage
  init: function() {
    this.activeDate = this.getTodayString();
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        this.state = JSON.parse(stored);
        if (this.state && this.state.goals) {
          if (!this.state.goals.waterOz) {
            this.state.goals.waterOz = Math.round((this.state.goals.waterMl || 2800) / 29.5735) || 96;
          }
          if (!this.state.goals.proteinGrams) {
            this.state.goals.proteinGrams = 140;
          }
        }
        this.sanitizeFutureDates();
      } else {
        this.state = BerryPulseData.generateInitialData();
        this.save();
      }
    } catch (e) {
      console.warn('BerryPulse: Error loading from localStorage, using initial seed', e);
      this.state = BerryPulseData.generateInitialData();
    }

    // Ensure today's entry exists
    this.ensureDateEntry(this.activeDate);
    return this.state;
  },

  // Save current state to localStorage
  save: function() {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.state));
      window.dispatchEvent(new CustomEvent('berrypulse:data-updated', { detail: { date: this.activeDate } }));
    } catch (e) {
      console.error('Failed to save to localStorage', e);
    }
  },

  // Ensure that a given date key has default structure
  ensureDateEntry: function(dateKey) {
    if (!this.state.history) {
      this.state.history = {};
    }
    const isFuture = this.isFutureDate(dateKey);

    if (!this.state.history[dateKey]) {
      this.state.history[dateKey] = {
        date: dateKey,
        water: {
          intakeOz: 0,
          intakeMl: 0,
          goalOz: (this.state.goals && this.state.goals.waterOz) || 96,
          goalMl: (this.state.goals && this.state.goals.waterMl) || 2800,
          logs: []
        },
        sleep: isFuture ? {
          bedtime: '',
          wakeTime: '',
          durationHours: 0,
          quality: 'Not recorded yet',
          qualityRating: 0,
          source: 'None',
          lastSyncedAt: null,
          restingHeartRate: 0,
          respiratoryRate: 0,
          stages: { deepPct: 0, remPct: 0, lightPct: 0, awakePct: 0 },
          tags: []
        } : {
          bedtime: '23:00',
          wakeTime: '07:00',
          durationHours: 8.0,
          quality: 'Good',
          qualityRating: 4,
          stages: { deepPct: 20, remPct: 25, lightPct: 45, awakePct: 10 },
          tags: ['Cool Room']
        },
        activity: {
          appleWatchSynced: false,
          appleWatchModel: null,
          lastSyncedAt: null,
          rings: {
            move: { current: 0, goal: (this.state.goals && this.state.goals.activeCalories) || 550 },
            exercise: { current: 0, goal: (this.state.goals && this.state.goals.exerciseMins) || 30 },
            stand: { current: 0, goal: (this.state.goals && this.state.goals.standHours) || 12 }
          },
          steps: 0,
          distanceKm: 0,
          avgHeartRate: 70,
          workouts: []
        },
        nutrition: {
          dailyGoalCalories: (this.state.goals && this.state.goals.calories) || 2200,
          meals: {
            breakfast: [],
            lunch: [],
            dinner: [],
            snacks: []
          }
        },
        mindfulness: {
          targetMinutes: (this.state.goals && this.state.goals.mindfulnessMins) || 15,
          completedMinutes: 0,
          mood: 'Calm',
          moodEmoji: '🧘',
          gratitudeJournal: '',
          sessions: []
        },
        habitsStatus: {}
      };
      this.save();
    } else if (isFuture) {
      const existing = this.state.history[dateKey];
      if (existing && existing.sleep && !existing.sleep.isUserManuallySaved && existing.sleep.durationHours > 0) {
        existing.sleep = {
          bedtime: '',
          wakeTime: '',
          durationHours: 0,
          quality: 'Not recorded yet',
          qualityRating: 0,
          source: 'None',
          lastSyncedAt: null,
          restingHeartRate: 0,
          respiratoryRate: 0,
          stages: { deepPct: 0, remPct: 0, lightPct: 0, awakePct: 0 },
          tags: []
        };
        this.save();
      }
    }
    return this.state.history[dateKey];
  },

  // Get data for currently selected date
  getActiveDayData: function() {
    return this.ensureDateEntry(this.activeDate);
  },

  // Get data for specific date
  getDayData: function(dateKey) {
    return this.ensureDateEntry(dateKey);
  },

  // Set active date
  setActiveDate: function(dateKey) {
    this.activeDate = dateKey;
    this.ensureDateEntry(dateKey);
    window.dispatchEvent(new CustomEvent('berrypulse:date-changed', { detail: { date: dateKey } }));
  },

  // Get array of past N days sorted chronologically
  getHistoryArray: function(daysCount = 7) {
    const list = [];
    const base = new Date(this.activeDate);
    for (let i = daysCount - 1; i >= 0; i--) {
      const d = new Date(base);
      d.setDate(base.getDate() - i);
      const key = d.toISOString().split('T')[0];
      list.push(this.getDayData(key));
    }
    return list;
  },

  // Export all data as JSON download
  exportData: function() {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(this.state, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `berrypulse-backup-${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  },

  // Import JSON backup
  importData: function(jsonContent) {
    try {
      const parsed = JSON.parse(jsonContent);
      if (parsed && parsed.history) {
        this.state = parsed;
        this.save();
        window.location.reload();
        return { success: true };
      } else {
        throw new Error('Invalid BerryPulse backup format');
      }
    } catch (e) {
      return { success: false, error: e.message };
    }
  },

  // Reset to sample seed data
  resetToSampleData: function() {
    this.state = BerryPulseData.generateInitialData();
    this.save();
    window.location.reload();
  },

  // Clear all data to fresh empty state
  clearAllData: function() {
    localStorage.removeItem(this.STORAGE_KEY);
    this.state = {
      version: 1,
      userProfile: { name: 'Courtney', streakDays: 0, weightKg: 68, heightCm: 172 },
      goals: { ...BerryPulseData.defaultGoals },
      habits: BerryPulseData.defaultHabits.map(h => ({ ...h, streak: 0, completed: false })),
      history: {}
    };
    this.ensureDateEntry(this.activeDate);
    this.save();
    window.location.reload();
  }
};

if (typeof module !== 'undefined') {
  module.exports = BerryPulseStorage;
}
