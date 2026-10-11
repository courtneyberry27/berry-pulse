/**
 * BerryPulse Wellness Tracker - Apple Watch & Apple Health Integration
 */

const BerryPulseAppleWatch = {
  isConnected: true,
  deviceName: 'Apple Watch Ultra 2',
  batteryLevel: 84,
  isSyncing: false,

  init: function() {
    this.bindEvents();
    this.render();
  },

  bindEvents: function() {
    window.addEventListener('berrypulse:date-changed', () => this.render());
    window.addEventListener('berrypulse:data-updated', () => this.render());
  },

  render: function() {
    const dayData = BerryPulseStorage.getActiveDayData();
    const activity = dayData.activity || {
      appleWatchSynced: true,
      rings: { move: { current: 480, goal: 550 }, exercise: { current: 35, goal: 30 }, stand: { current: 10, goal: 12 } },
      steps: 8940,
      distanceKm: 6.8,
      avgHeartRate: 68
    };

    // Render Apple Activity Rings (Move, Exercise, Stand)
    this.renderActivityRings(activity.rings);

    // Update status indicators
    const statusBadge = document.getElementById('watch-status-badge');
    const deviceNameEl = document.getElementById('watch-device-name');
    const batteryEl = document.getElementById('watch-battery-level');
    const lastSyncEl = document.getElementById('watch-last-sync-time');

    if (statusBadge) {
      statusBadge.innerHTML = this.isConnected 
        ? `<span class="flex h-2 w-2 relative"><span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span><span class="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span></span> Connected`
        : `<span class="h-2 w-2 rounded-full bg-slate-500 inline-block"></span> Paired (Idle)`;
    }
    if (deviceNameEl) deviceNameEl.textContent = activity.appleWatchModel || this.deviceName;
    if (batteryEl) batteryEl.textContent = `${this.batteryLevel}% Battery`;
    if (lastSyncEl) lastSyncEl.textContent = activity.lastSyncedAt || 'Synced 12m ago';

    // Update metrics
    const stepsEl = document.getElementById('activity-steps-val');
    const distEl = document.getElementById('activity-distance-val');
    const hrEl = document.getElementById('activity-heartrate-val');

    if (stepsEl) stepsEl.textContent = (activity.steps || 0).toLocaleString();
    if (distEl) distEl.textContent = `${activity.distanceKm || 0} km`;
    if (hrEl) hrEl.textContent = `${activity.avgHeartRate || 72} BPM`;
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
    const modal = document.getElementById('apple-watch-modal');
    if (modal) {
      modal.classList.remove('hidden');
      modal.classList.add('flex');
    }
  },

  closeSyncModal: function() {
    const modal = document.getElementById('apple-watch-modal');
    if (modal) {
      modal.classList.add('hidden');
      modal.classList.remove('flex');
    }
  },

  // Trigger simulated live watch synchronization
  triggerLiveSync: function() {
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
    }, 700);

    setTimeout(() => {
      if (statusText) statusText.textContent = 'Syncing Step Count, Heart Rate & GPS workouts...';
      if (progressBar) progressBar.style.width = '85%';
    }, 1400);

    setTimeout(() => {
      // Apply fresh realistic Apple Watch data to active date
      const dayData = BerryPulseStorage.getActiveDayData();
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
    }, 2100);
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

    // Extract step records and workout records
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
