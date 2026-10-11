/**
 * BerryPulse Wellness Tracker - Storage & State Management
 */

const BerryPulseStorage = {
  STORAGE_PREFIX: 'berrypulse_user_data_v1_',
  LEGACY_STORAGE_KEY: 'berrypulse_app_state_v1',
  state: null,
  activeDate: new Date().toISOString().split('T')[0],

  getTodayString: function () {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  },

  isFutureDate: function (dateKey) {
    const todayStr = this.getTodayString();
    return (dateKey || this.activeDate) > todayStr;
  },

  getStorageKey: function (userId) {
    const id = userId || (window.BerryPulseAuth && BerryPulseAuth.getCurrentUserId()) || 'usr_courtney';
    return this.STORAGE_PREFIX + id;
  },

  sanitizeFutureDates: function () {
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
        localStorage.setItem(this.getStorageKey(), JSON.stringify(this.state));
      } catch (e) { }
    }
  },

  // Seed tailored initial data for a specific user partition
  seedUserPartition: function (userId, options = {}) {
    let customOpts = {};
    if (userId === 'usr_alex') {
      customOpts = {
        name: 'Alex',
        streakDays: 12,
        weightKg: 73,
        heightCm: 180,
        goals: {
          calories: 2500,
          proteinGrams: 160,
          carbsGrams: 310,
          fatGrams: 65,
          fiberGrams: 38,
          waterOz: 110,
          waterMl: 3250,
          sleepHours: 8.5,
          mindfulnessMins: 10,
          activeCalories: 750,
          exerciseMins: 45,
          standHours: 12,
          steps: 13500
        },
        habits: [
          { id: 'h-alex-1', name: 'Morning 5K Trail Run', category: 'fitness', streak: 12, targetDays: 5, completed: true, icon: '🏃' },
          { id: 'h-alex-2', name: 'Post-Run Foam Rolling', category: 'recovery', streak: 8, targetDays: 7, completed: true, icon: '🧘' },
          { id: 'h-alex-3', name: 'Electrolyte Hydration (110 oz)', category: 'hydration', streak: 15, targetDays: 7, completed: false, icon: '💧' },
          { id: 'h-alex-4', name: 'Core Stability Circuit', category: 'fitness', streak: 6, targetDays: 4, completed: false, icon: '🏋️' }
        ]
      };
    } else if (userId === 'usr_jordan') {
      customOpts = {
        name: 'Jordan',
        streakDays: 18,
        weightKg: 61,
        heightCm: 167,
        goals: {
          calories: 1950,
          proteinGrams: 125,
          carbsGrams: 230,
          fatGrams: 55,
          fiberGrams: 35,
          waterOz: 85,
          waterMl: 2500,
          sleepHours: 8.0,
          mindfulnessMins: 25,
          activeCalories: 450,
          exerciseMins: 35,
          standHours: 12,
          steps: 9000
        },
        habits: [
          { id: 'h-jordan-1', name: '20-min Morning Meditation', category: 'mindfulness', streak: 18, targetDays: 7, completed: true, icon: '🧘' },
          { id: 'h-jordan-2', name: 'Ceremonial Matcha Green Tea', category: 'nutrition', streak: 14, targetDays: 7, completed: true, icon: '🍵' },
          { id: 'h-jordan-3', name: 'Vinyasa Sun Salutations', category: 'fitness', streak: 10, targetDays: 5, completed: false, icon: '☀️' },
          { id: 'h-jordan-4', name: 'Digital Sunset (No Screens 9pm)', category: 'sleep', streak: 5, targetDays: 7, completed: false, icon: '🌙' }
        ]
      };
    } else if (userId === 'usr_courtney') {
      customOpts = {
        name: 'Courtney',
        streakDays: 7,
        weightKg: 68,
        heightCm: 172,
        goals: {
          calories: 2200,
          proteinGrams: 140,
          carbsGrams: 220,
          fatGrams: 65,
          fiberGrams: 35,
          waterOz: 96,
          waterMl: 2800,
          sleepHours: 8.0,
          mindfulnessMins: 15,
          activeCalories: 550,
          exerciseMins: 30,
          standHours: 12,
          steps: 10000
        }
      };
    } else {
      const acc = window.BerryPulseAuth ? BerryPulseAuth.getAccountById(userId) : null;
      customOpts = {
        name: (acc && acc.displayName) || options.displayName || 'Wellness User',
        streakDays: 1,
        weightKg: 68,
        heightCm: 172,
        goals: {
          calories: options.startingGoalCalories || 2050,
          proteinGrams: options.startingProteinGrams || 135,
          carbsGrams: 220,
          fatGrams: 60,
          fiberGrams: 30,
          waterOz: 90,
          waterMl: 2660,
          sleepHours: 8.0,
          mindfulnessMins: 15,
          activeCalories: 500,
          exerciseMins: 30,
          standHours: 12,
          steps: 10000
        }
      };
    }

    const data = BerryPulseData.generateInitialData(customOpts);
    try {
      localStorage.setItem(this.getStorageKey(userId), JSON.stringify(data));
    } catch (e) { }
    return data;
  },

  // Initialize storage for active user
  init: function () {
    this.activeDate = this.getTodayString();
    const currentUserId = (window.BerryPulseAuth && BerryPulseAuth.getCurrentUserId()) || 'usr_courtney';

    // Migrate legacy storage if present
    try {
      const legacy = localStorage.getItem(this.LEGACY_STORAGE_KEY);
      if (legacy && !localStorage.getItem(this.getStorageKey('usr_courtney'))) {
        localStorage.setItem(this.getStorageKey('usr_courtney'), legacy);
      }
    } catch (e) { }

    try {
      const key = this.getStorageKey(currentUserId);
      const stored = localStorage.getItem(key);
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
        this.state = this.seedUserPartition(currentUserId);
        this.save();
      }
    } catch (e) {
      console.warn('BerryPulse: Error loading from localStorage, using initial seed', e);
      this.state = this.seedUserPartition(currentUserId);
    }

    // Ensure today's entry exists
    this.ensureDateEntry(this.activeDate);
    return this.state;
  },

  // Switch to another user's isolated data partition
  switchUser: function (newUserId) {
    if (!newUserId) return;
    
    // Save current active user's state first
    this.save();

    const key = this.getStorageKey(newUserId);
    try {
      const stored = localStorage.getItem(key);
      if (stored) {
        this.state = JSON.parse(stored);
      } else {
        this.state = this.seedUserPartition(newUserId);
      }
    } catch (e) {
      this.state = this.seedUserPartition(newUserId);
    }

    this.sanitizeFutureDates();
    this.ensureDateEntry(this.activeDate);
    this.save();

    window.dispatchEvent(new CustomEvent('berrypulse:user-switched', { detail: { userId: newUserId } }));

    // Re-render all views and modules
    try {
      if (window.BerryPulseApp) {
        BerryPulseApp.updateHeaderDateDisplay();
        BerryPulseApp.renderDailyRings();
        BerryPulseApp.renderOverviewDashboard();
        BerryPulseApp.renderDailySummaryBar();
      }
      if (window.BerryPulseNutrition) BerryPulseNutrition.render();
      if (window.BerryPulseWater) BerryPulseWater.render();
      if (window.BerryPulseAppleWatch) BerryPulseAppleWatch.render();
      if (window.BerryPulseHabits) BerryPulseHabits.render();
      if (window.BerryPulseActivity) BerryPulseActivity.render();
      if (window.BerryPulseSleep) BerryPulseSleep.render();
      if (window.BerryPulseMindfulness) BerryPulseMindfulness.render();
      if (window.BerryPulseCharts) BerryPulseCharts.renderAll();
      if (window.BerryPulseAIAdvisor) BerryPulseAIAdvisor.populateFormFromProfile();
    } catch (err) {
      console.warn('Error re-rendering views on user switch:', err);
    }
  },

  // Save current state to localStorage for active user
  save: function() {
    try {
      if (!this.state) return;
      const key = this.getStorageKey();
      localStorage.setItem(key, JSON.stringify(this.state));
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

    // Reset to sample seed data for current active user
    resetToSampleData: function() {
      const currentUserId = (window.BerryPulseAuth && BerryPulseAuth.getCurrentUserId()) || 'usr_courtney';
      this.state = this.seedUserPartition(currentUserId);
      this.save();
      window.location.reload();
    },

    // Clear active user data partition to fresh empty state
    clearAllData: function() {
      const key = this.getStorageKey();
      localStorage.removeItem(key);
      const acc = window.BerryPulseAuth ? BerryPulseAuth.getCurrentUser() : null;
      this.state = {
        version: 1,
        userProfile: { name: (acc && acc.displayName) || 'User', streakDays: 0, weightKg: 68, heightCm: 172 },
        goals: { ...BerryPulseData.defaultGoals },
        habits: BerryPulseData.defaultHabits.map(h => ({ ...h, streak: 0, completed: false })),
        history: {}
      };
      this.ensureDateEntry(this.activeDate);
      this.save();
      window.location.reload();
    }
  };

  window.BerryPulseStorage = BerryPulseStorage;

  if(typeof module !== 'undefined') {
    module.exports = BerryPulseStorage;
}
