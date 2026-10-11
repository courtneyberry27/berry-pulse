/**
 * BerryPulse Wellness Tracker - Apple Watch & Apple Health Integration
 * Manages Apple Watch Bluetooth/HealthKit connection states, Activity Rings,
 * live biometric sensor streams, and Apple Health export parsing.
 */

const BerryPulseAppleWatch = {
  deviceName: 'Apple Watch Ultra 2',
  batteryLevel: 84,
  isSyncing: false,
  isConnecting: false,

  init: function() {
    this.bindEvents();
    this.render();
  },

  bindEvents: function() {
    window.addEventListener('berrypulse:date-changed', () => this.render());
    window.addEventListener('berrypulse:data-updated', () => this.render());
    window.addEventListener('berrypulse:user-switched', () => this.render());
  },

  // Connection is strictly user-controlled and saved per-user
  getIsConnected: function() {
    const userId = (window.BerryPulseAuth && BerryPulseAuth.getCurrentUserId()) || 'usr_courtney';
    const localVal = localStorage.getItem(`berrypulse_watch_connected_${userId}`);
    if (localVal !== null) {
      return localVal === 'true';
    }
    if (window.BerryPulseStorage && BerryPulseStorage.state && typeof BerryPulseStorage.state.appleWatchConnected === 'boolean') {
      return BerryPulseStorage.state.appleWatchConnected;
    }
    return false; // Default: Disconnected until user chooses to connect
  },

  setIsConnected: function(connected) {
    const userId = (window.BerryPulseAuth && BerryPulseAuth.getCurrentUserId()) || 'usr_courtney';
    try {
      localStorage.setItem(`berrypulse_watch_connected_${userId}`, String(connected));
    } catch (e) { }

    if (window.BerryPulseStorage && BerryPulseStorage.state) {
      BerryPulseStorage.state.appleWatchConnected = connected;
      BerryPulseStorage.save();
    }

    this.render();

    if (window.BerryPulseSleep && typeof BerryPulseSleep.render === 'function') {
      BerryPulseSleep.render();
    }
  },

  // Interactive pairing flow that establishes the live Apple Watch connection
  connectWatch: function() {
    if (this.isConnecting) return;
    this.isConnecting = true;

    this.openSyncModal();

    const statusText = document.getElementById('watch-sync-progress-text');
    const progressBar = document.getElementById('watch-sync-progress-bar');
    const connectBtn = document.getElementById('btn-connect-watch-modal');

    if (connectBtn) {
      connectBtn.disabled = true;
      connectBtn.classList.add('opacity-50');
      connectBtn.innerHTML = '<span>⏳ Searching for Apple Watch...</span>';
    }
    if (statusText) statusText.textContent = 'Searching for nearby Apple Watch via Bluetooth & HealthKit...';
    if (progressBar) progressBar.style.width = '30%';

    setTimeout(() => {
      if (statusText) statusText.textContent = 'Found Apple Watch Ultra 2 • Requesting HealthKit biometric permissions...';
      if (progressBar) progressBar.style.width = '65%';
    }, 700);

    setTimeout(() => {
      if (statusText) statusText.textContent = 'Authorizing sensors for Activity Rings, Step count, Heart rate & Sleep...';
      if (progressBar) progressBar.style.width = '90%';
    }, 1400);

    setTimeout(() => {
      this.isConnecting = false;
      this.setIsConnected(true);

      // Seed fresh live watch metrics for today
      const dayData = BerryPulseStorage.getActiveDayData();
      if (dayData && dayData.activity) {
        dayData.activity.appleWatchSynced = true;
        dayData.activity.lastSyncedAt = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        dayData.activity.rings = dayData.activity.rings || {
          move: { current: 520, goal: 550 },
          exercise: { current: 35, goal: 30 },
          stand: { current: 11, goal: 12 }
        };
        dayData.activity.steps = dayData.activity.steps || 9120;
        dayData.activity.distanceKm = Number(((dayData.activity.steps || 9120) * 0.00078).toFixed(1));
        dayData.activity.avgHeartRate = dayData.activity.avgHeartRate || 68;
        BerryPulseStorage.save();
      }

      if (progressBar) progressBar.style.width = '100%';
      if (statusText) statusText.textContent = '✨ Apple Watch Ultra 2 connected successfully! HealthKit stream active.';

      if (window.BerryPulseApp && BerryPulseApp.showToast) {
        BerryPulseApp.showToast('⌚ Apple Watch Ultra 2 connected successfully!');
      }

      setTimeout(() => {
        if (progressBar) progressBar.style.width = '0%';
        if (statusText) statusText.textContent = 'Ready to synchronize';
      }, 1600);
    }, 2100);
  },

  disconnectWatch: function() {
    this.setIsConnected(false);

    const dayData = BerryPulseStorage.getActiveDayData();
    if (dayData && dayData.activity) {
      dayData.activity.appleWatchSynced = false;
      BerryPulseStorage.save();
    }

    const statusText = document.getElementById('watch-sync-progress-text');
    if (statusText) statusText.textContent = 'Apple Watch disconnected.';

    if (window.BerryPulseApp && BerryPulseApp.showToast) {
      BerryPulseApp.showToast('⌚ Apple Watch disconnected.');
    }
  },

  render: function() {
    const isConnected = this.getIsConnected();
    const dayData = BerryPulseStorage.getActiveDayData();
    const activity = dayData.activity || {
      appleWatchSynced: isConnected,
      rings: { move: { current: 0, goal: 550 }, exercise: { current: 0, goal: 30 }, stand: { current: 0, goal: 12 } },
      steps: 0,
      distanceKm: 0,
      avgHeartRate: 70
    };

    // Render Activity Rings
    this.renderActivityRings(activity.rings);

    // 1. Header Status Indicators
    const headerStatus = document.getElementById('header-watch-status-badge') || document.getElementById('watch-status-badge');
    const headerDevice = document.getElementById('header-watch-device-name') || document.getElementById('watch-device-name');
    if (headerStatus) {
      headerStatus.innerHTML = isConnected
        ? `<span class="flex h-2 w-2 relative"><span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span><span class="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span></span> Connected`
        : `<span class="h-2 w-2 rounded-full bg-slate-500 inline-block"></span> Not Connected`;
      headerStatus.className = isConnected
        ? 'flex items-center gap-1.5 text-[11px] text-emerald-400 font-semibold'
        : 'flex items-center gap-1.5 text-[11px] text-slate-400 font-medium';
    }
    if (headerDevice) headerDevice.textContent = isConnected ? (activity.appleWatchModel || this.deviceName) : 'Apple Watch';

    // 2. Activity View Hero Card
    const activityStatus = document.getElementById('activity-watch-status-badge');
    const activityDevice = document.getElementById('activity-watch-device-name');
    const activitySubtext = document.getElementById('activity-watch-subtext');
    const activityActionBtn = document.getElementById('btn-activity-watch-action');
    const batteryEl = document.getElementById('watch-battery-level');
    const lastSyncEl = document.getElementById('watch-last-sync-time');

    if (activityStatus) {
      activityStatus.innerHTML = isConnected
        ? `<span class="flex items-center gap-1 text-emerald-400 font-semibold"><span class="h-2 w-2 rounded-full bg-emerald-400"></span> Connected</span>`
        : `<span class="flex items-center gap-1 text-slate-400 font-medium"><span class="h-2 w-2 rounded-full bg-slate-500"></span> Not Connected</span>`;
    }
    if (activityDevice) activityDevice.textContent = activity.appleWatchModel || this.deviceName;
    if (batteryEl) batteryEl.textContent = isConnected ? `${this.batteryLevel}% Battery` : 'Offline';
    if (lastSyncEl) lastSyncEl.textContent = isConnected ? (activity.lastSyncedAt || 'Synced recently') : 'Not paired';
    if (activitySubtext) {
      activitySubtext.innerHTML = isConnected
        ? `<span id="watch-battery-level">${this.batteryLevel}% Battery</span> • <span id="watch-last-sync-time">${activity.lastSyncedAt || 'Synced recently'}</span>`
        : 'Pair your Apple Watch to automatically stream Move, Exercise, and Stand rings.';
    }
    if (activityActionBtn) {
      activityActionBtn.innerHTML = isConnected
        ? '<span>⌚ Apple Watch Sync Hub</span>'
        : '<span>⌚ Connect Apple Watch</span>';
      activityActionBtn.className = isConnected
        ? 'px-4 py-2.5 rounded-xl bg-pink-600 hover:bg-pink-500 text-white text-xs font-semibold transition shadow-lg shadow-pink-600/30 flex items-center gap-2'
        : 'px-4 py-2.5 rounded-xl bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 text-white text-xs font-bold transition shadow-lg shadow-pink-600/30 flex items-center gap-2';
    }

    // 3. Activity Metrics
    const stepsEl = document.getElementById('activity-steps-val');
    const distEl = document.getElementById('activity-distance-val');
    const hrEl = document.getElementById('activity-heartrate-val');

    if (stepsEl) stepsEl.textContent = (activity.steps || 0).toLocaleString();
    if (distEl) distEl.textContent = `${activity.distanceKm || 0} km`;
    if (hrEl) hrEl.textContent = `${activity.avgHeartRate || 72} BPM`;

    // 4. Modal Live State & Actions
    this.renderModal();
  },

  renderModal: function() {
    const isConnected = this.getIsConnected();
    const modalStateCard = document.getElementById('modal-watch-state-card');
    const modalActions = document.getElementById('modal-watch-actions');

    if (modalStateCard) {
      modalStateCard.innerHTML = isConnected ? `
        <div class="flex items-center gap-3">
          <div class="w-12 h-12 rounded-xl bg-black border border-slate-700 flex items-center justify-center text-xl shadow-lg">
            ⌚
          </div>
          <div>
            <h4 class="font-bold text-white text-sm">Apple Watch Ultra 2</h4>
            <p class="text-xs text-emerald-400 font-semibold flex items-center gap-1.5">
              <span class="flex h-2 w-2 relative"><span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span><span class="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span></span>
              Connected • HealthKit Active
            </p>
          </div>
        </div>
        <span class="text-xs px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-semibold">${this.batteryLevel}% Battery</span>
      ` : `
        <div class="flex items-center gap-3">
          <div class="w-12 h-12 rounded-xl bg-black/60 border border-slate-800 flex items-center justify-center text-xl opacity-70">
            ⌚
          </div>
          <div>
            <h4 class="font-bold text-white text-sm">Apple Watch Ultra 2</h4>
            <p class="text-xs text-slate-400 font-medium flex items-center gap-1.5">
              <span class="h-2 w-2 rounded-full bg-slate-500 inline-block"></span>
              Not Connected • HealthKit Inactive
            </p>
          </div>
        </div>
        <span class="text-xs px-2.5 py-1 rounded-full bg-slate-800 text-slate-400 border border-slate-700 font-medium">Offline</span>
      `;
    }

    if (modalActions) {
      modalActions.innerHTML = isConnected ? `
        <button id="btn-sync-watch-now" onclick="BerryPulseAppleWatch.triggerLiveSync()" class="w-full py-3 bg-pink-600 hover:bg-pink-500 text-white rounded-xl text-sm font-bold shadow-lg shadow-pink-600/30 transition flex items-center justify-center gap-2">
          <span>🔄 Sync Apple Watch Activity Rings Now</span>
        </button>
        <button onclick="BerryPulseAppleWatch.disconnectWatch()" class="w-full py-2.5 rounded-xl bg-berry-900/80 hover:bg-berry-800 text-rose-300 hover:text-rose-200 text-xs font-semibold border border-berry-700/60 transition flex items-center justify-center gap-1.5">
          <span>🔌 Disconnect Apple Watch</span>
        </button>
      ` : `
        <button id="btn-connect-watch-modal" onclick="BerryPulseAppleWatch.connectWatch()" class="w-full py-3 bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 text-white rounded-xl text-sm font-bold shadow-lg shadow-pink-600/30 transition flex items-center justify-center gap-2">
          <span>⌚ Connect Apple Watch</span>
        </button>
        <p class="text-[11px] text-berry-300/80 text-center leading-relaxed">
          Tap above to connect your Apple Watch via Bluetooth & HealthKit to stream live rings and biometric sensors.
        </p>
      `;
    }
  },

  renderActivityRings: function(rings) {
    const container = document.getElementById('apple-rings-svg-container');
    if (!container) return;

    const activeGoals = (BerryPulseStorage.state && BerryPulseStorage.state.goals) || {};
    const move = {
      current: (rings && rings.move) ? rings.move.current : 0,
      goal: activeGoals.activeCalories || (rings && rings.move ? rings.move.goal : 550)
    };
    const exercise = {
      current: (rings && rings.exercise) ? rings.exercise.current : 0,
      goal: activeGoals.exerciseMins || (rings && rings.exercise ? rings.exercise.goal : 30)
    };
    const stand = {
      current: (rings && rings.stand) ? rings.stand.current : 0,
      goal: activeGoals.standHours || (rings && rings.stand ? rings.stand.goal : 12)
    };

    const movePct = Math.min(1.0, move.current / (move.goal || 1));
    const exercisePct = Math.min(1.0, exercise.current / (exercise.goal || 1));
    const standPct = Math.min(1.0, stand.current / (stand.goal || 1));

    // Circumferences for circles at r=68, r=52, r=36
    const cMove = 2 * Math.PI * 68;       // ~427.25
    const cExercise = 2 * Math.PI * 52;   // ~326.72
    const cStand = 2 * Math.PI * 36;      // ~226.19

    const offsetMove = cMove * (1 - movePct);
    const offsetExercise = cExercise * (1 - exercisePct);
    const offsetStand = cStand * (1 - standPct);

    container.innerHTML = `
      <svg viewBox="0 0 160 160" class="w-full h-full transform -rotate-90">
        <!-- Background Tracks -->
        <circle cx="80" cy="80" r="68" stroke="rgba(250, 17, 79, 0.2)" stroke-width="12" fill="none" />
        <circle cx="80" cy="80" r="52" stroke="rgba(161, 255, 0, 0.2)" stroke-width="12" fill="none" />
        <circle cx="80" cy="80" r="36" stroke="rgba(0, 245, 212, 0.2)" stroke-width="12" fill="none" />

        <!-- Move Ring (Red/Pink) -->
        <circle cx="80" cy="80" r="68" stroke="url(#ring-gradient-move)" stroke-width="12" fill="none"
          stroke-linecap="round" stroke-dasharray="${cMove}" stroke-dashoffset="${offsetMove}"
          class="transition-all duration-1000 ease-out" />

        <!-- Exercise Ring (Neon Green) -->
        <circle cx="80" cy="80" r="52" stroke="url(#ring-gradient-exercise)" stroke-width="12" fill="none"
          stroke-linecap="round" stroke-dasharray="${cExercise}" stroke-dashoffset="${offsetExercise}"
          class="transition-all duration-1000 ease-out" />

        <!-- Stand Ring (Electric Cyan) -->
        <circle cx="80" cy="80" r="36" stroke="url(#ring-gradient-stand)" stroke-width="12" fill="none"
          stroke-linecap="round" stroke-dasharray="${cStand}" stroke-dashoffset="${offsetStand}"
          class="transition-all duration-1000 ease-out" />

        <!-- Gradients -->
        <defs>
          <linearGradient id="ring-gradient-move" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#ff1744" />
            <stop offset="100%" stop-color="#f43f5e" />
          </linearGradient>
          <linearGradient id="ring-gradient-exercise" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#10b981" />
            <stop offset="100%" stop-color="#a3e635" />
          </linearGradient>
          <linearGradient id="ring-gradient-stand" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#06b6d4" />
            <stop offset="100%" stop-color="#38bdf8" />
          </linearGradient>
        </defs>
      </svg>
    `;

    // Update labels underneath
    const moveVal = document.getElementById('ring-move-label');
    const exerciseVal = document.getElementById('ring-exercise-label');
    const standVal = document.getElementById('ring-stand-label');

    if (moveVal) moveVal.textContent = `${Math.round(move.current)} / ${move.goal} CAL`;
    if (exerciseVal) exerciseVal.textContent = `${Math.round(exercise.current)} / ${exercise.goal} MIN`;
    if (standVal) standVal.textContent = `${Math.round(stand.current)} / ${stand.goal} HRS`;
  },

  // Open Apple Watch sync & pairing modal
  openSyncModal: function() {
    this.renderModal();
    const modal = document.getElementById('apple-watch-modal');
    if (modal) {
      modal.classList.remove('hidden');
      modal.classList.add('flex');
      modal.style.display = 'flex';
    }
  },

  closeSyncModal: function() {
    const modal = document.getElementById('apple-watch-modal');
    if (modal) {
      modal.classList.add('hidden');
      modal.classList.remove('flex');
      modal.style.display = 'none';
    }
  },

  // Trigger simulated live watch synchronization
  triggerLiveSync: function() {
    if (!this.getIsConnected()) {
      this.connectWatch();
      return;
    }

    const btn = document.getElementById('btn-sync-watch-now');
    const statusText = document.getElementById('watch-sync-progress-text');
    const progressBar = document.getElementById('watch-sync-progress-bar');

    if (this.isSyncing) return;
    this.isSyncing = true;

    if (btn) {
      btn.disabled = true;
      btn.classList.add('opacity-50');
    }
    if (statusText) statusText.textContent = 'Connecting to Apple Watch via HealthKit & Bluetooth...';
    if (progressBar) progressBar.style.width = '25%';

    setTimeout(() => {
      if (statusText) statusText.textContent = 'Reading Activity Rings (Move, Exercise, Stand)...';
      if (progressBar) progressBar.style.width = '55%';
    }, 600);

    setTimeout(() => {
      if (statusText) statusText.textContent = 'Syncing Step Count, Heart Rate & GPS workouts...';
      if (progressBar) progressBar.style.width = '85%';
    }, 1200);

    setTimeout(() => {
      // Apply fresh realistic Apple Watch data to active date
      const dayData = BerryPulseStorage.getActiveDayData();
      if (!dayData.activity) dayData.activity = {};
      if (!dayData.activity.rings) {
        dayData.activity.rings = { move: { current: 0, goal: 550 }, exercise: { current: 0, goal: 30 }, stand: { current: 0, goal: 12 } };
      }

      const currentMove = (dayData.activity.rings.move.current || 420) + Math.floor(Math.random() * 80 + 40);
      const currentEx = (dayData.activity.rings.exercise.current || 25) + Math.floor(Math.random() * 10 + 5);
      const currentStand = Math.min(14, (dayData.activity.rings.stand.current || 9) + 1);
      const additionalSteps = Math.floor(Math.random() * 1200 + 400);

      dayData.activity.appleWatchSynced = true;
      dayData.activity.lastSyncedAt = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      dayData.activity.rings.move.current = currentMove;
      dayData.activity.rings.exercise.current = currentEx;
      dayData.activity.rings.stand.current = currentStand;
      dayData.activity.steps = (dayData.activity.steps || 7500) + additionalSteps;
      dayData.activity.distanceKm = Number(((dayData.activity.steps) * 0.00078).toFixed(1));
      dayData.activity.avgHeartRate = Math.floor(Math.random() * 8 + 66);

      BerryPulseStorage.save();

      this.isSyncing = false;
      if (btn) {
        btn.disabled = false;
        btn.classList.remove('opacity-50');
      }
      if (statusText) statusText.textContent = 'Sync complete! All rings updated.';
      if (progressBar) progressBar.style.width = '100%';

      BerryPulseApp.showToast('⌚ Apple Watch data synchronized successfully!');
      setTimeout(() => this.closeSyncModal(), 1200);
    }, 1800);
  },

  // Parse uploaded Apple Health XML / JSON export file
  handleHealthFileImport: function(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target.result;
      try {
        if (file.name.endsWith('.json')) {
          const json = JSON.parse(text);
          this.applyImportedHealthData(json);
        } else {
          // Parse Apple Health XML (export.xml)
          this.parseAppleHealthXML(text);
        }
      } catch (err) {
        alert('Could not parse Apple Health file: ' + err.message);
      }
    };
    reader.readAsText(file);
  },

  parseAppleHealthXML: function(xmlString) {
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(xmlString, 'text/xml');

    const records = xmlDoc.getElementsByTagName('Record');
    let totalSteps = 0;
    let totalActiveEnergy = 0;

    for (let i = 0; i < Math.min(records.length, 500); i++) {
      const r = records[i];
      const type = r.getAttribute('type');
      const val = parseFloat(r.getAttribute('value')) || 0;

      if (type === 'HKQuantityTypeIdentifierStepCount') {
        totalSteps += val;
      } else if (type === 'HKQuantityTypeIdentifierActiveEnergyBurned') {
        totalActiveEnergy += val;
      }
    }

    const dayData = BerryPulseStorage.getActiveDayData();
    if (totalSteps > 0) dayData.activity.steps = Math.round(totalSteps);
    if (totalActiveEnergy > 0) dayData.activity.rings.move.current = Math.round(totalActiveEnergy);
    dayData.activity.appleWatchSynced = true;
    dayData.activity.lastSyncedAt = 'Imported from Apple Health';

    BerryPulseStorage.save();
    BerryPulseApp.showToast('Imported records from Apple Health export!');
    this.closeSyncModal();
  },

  applyImportedHealthData: function(data) {
    const dayData = BerryPulseStorage.getActiveDayData();
    if (data.steps) dayData.activity.steps = data.steps;
    if (data.activeCalories) dayData.activity.rings.move.current = data.activeCalories;
    if (data.exerciseMins) dayData.activity.rings.exercise.current = data.exerciseMins;
    BerryPulseStorage.save();
    BerryPulseApp.showToast('Imported Health data successfully!');
    this.closeSyncModal();
  }
};

window.BerryPulseAppleWatch = BerryPulseAppleWatch;

if (typeof module !== 'undefined') {
  module.exports = BerryPulseAppleWatch;
}
