/**
 * BerryPulse Wellness Tracker - Sleep Tracker Module
 * Supports Apple Watch Sync, Apple Health Import, and Manual Entry
 */

const BerryPulseSleep = {
  currentInputMode: 'watch', // 'watch', 'health', 'manual'
  isSyncingWatch: false,

  init: function () {
    this.bindEvents();
    this.render();
  },

  bindEvents: function () {
    window.addEventListener('berrypulse:date-changed', () => this.render());
    window.addEventListener('berrypulse:data-updated', () => this.render());

    const bedInput = document.getElementById('sleep-bedtime-input');
    const wakeInput = document.getElementById('sleep-waketime-input');

    if (bedInput && wakeInput) {
      bedInput.addEventListener('change', () => this.handleTimesChanged());
      wakeInput.addEventListener('change', () => this.handleTimesChanged());
    }

    // Manual sleep stage range inputs
    ['deep', 'rem', 'light', 'awake'].forEach(stage => {
      const input = document.getElementById(`sleep-stage-input-${stage}`);
      if (input) {
        input.addEventListener('input', () => this.handleManualStagesChanged());
      }
    });
  },

  setInputMode: function (mode) {
    this.currentInputMode = mode;
    ['watch', 'health', 'manual'].forEach(m => {
      const panel = document.getElementById(`sleep-mode-panel-${m}`);
      const btn = document.getElementById(`sleep-mode-btn-${m}`);
      if (panel) {
        if (m === mode) panel.classList.remove('hidden');
        else panel.classList.add('hidden');
      }
      if (btn) {
        if (m === mode) {
          btn.className = 'flex-1 py-2 rounded-xl text-xs font-bold bg-pink-600 text-white shadow-md transition';
        } else {
          btn.className = 'flex-1 py-2 rounded-xl text-xs font-medium text-berry-300 hover:text-white transition';
        }
      }
    });
  },

  render: function () {
    const dayData = BerryPulseStorage.getActiveDayData();
    const activeDate = BerryPulseStorage.activeDate;
    const todayStr = BerryPulseStorage.getTodayString ? BerryPulseStorage.getTodayString() : new Date().toISOString().split('T')[0];
    const isFuture = activeDate > todayStr;

    // For any future date without explicit user save, force empty state at 0 hours
    if (isFuture) {
      if (!dayData.sleep || !dayData.sleep.isUserManuallySaved) {
        dayData.sleep = {
          bedtime: '',
          wakeTime: '',
          durationHours: 0,
          quality: 'No sleep logged yet',
          qualityRating: 0,
          source: 'None',
          lastSyncedAt: null,
          restingHeartRate: 0,
          respiratoryRate: 0,
          stages: { deepPct: 0, remPct: 0, lightPct: 0, awakePct: 0 },
          tags: []
        };
      }
    }

    if (!dayData.sleep) {
      dayData.sleep = isFuture ? {
        bedtime: '',
        wakeTime: '',
        durationHours: 0,
        quality: 'No sleep logged yet',
        qualityRating: 0,
        source: 'None',
        lastSyncedAt: null,
        restingHeartRate: 0,
        respiratoryRate: 0,
        stages: { deepPct: 0, remPct: 0, lightPct: 0, awakePct: 0 },
        tags: []
      } : {
        bedtime: '23:15',
        wakeTime: '07:15',
        durationHours: 8.0,
        quality: 'Good & Refreshing',
        qualityRating: 4,
        source: 'Apple Watch Ultra 2',
        lastSyncedAt: '07:22 AM',
        restingHeartRate: 52,
        respiratoryRate: 14.5,
        stages: { deepPct: 22, remPct: 24, lightPct: 46, awakePct: 8 },
        tags: ['Cool Room (67°F)', 'Dark Mask']
      };
    }

    const sleep = dayData.sleep;
    const targetHours = (BerryPulseStorage.state.goals && BerryPulseStorage.state.goals.sleepHours) || 8.0;

    const rawHours = (typeof sleep.durationHours === 'number') ? sleep.durationHours : (isFuture ? 0 : 8.0);
    const durationHrs = Math.max(0, rawHours);
    const isEmptyOrZero = durationHrs === 0;

    // Update inputs
    const bedInput = document.getElementById('sleep-bedtime-input');
    const wakeInput = document.getElementById('sleep-waketime-input');
    if (bedInput) bedInput.value = sleep.bedtime || '';
    if (wakeInput) wakeInput.value = sleep.wakeTime || '';

    // Source badge
    const sourceBadge = document.getElementById('sleep-source-badge');
    if (sourceBadge) {
      if (isEmptyOrZero || !sleep.source || sleep.source === 'None') {
        sourceBadge.innerHTML = `
          <span class="flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-900/40 text-purple-200 border border-purple-500/30 text-xs font-semibold">
            <span>🌙</span>
            <span>${isFuture ? 'Future Date (Empty • 0h)' : 'No sleep logged yet'}</span>
          </span>
        `;
      } else {
        const src = sleep.source || 'Manual Entry';
        let icon = '✍️';
        if (src.includes('Watch')) icon = '⌚';
        else if (src.includes('Health')) icon = '🍏';

        sourceBadge.innerHTML = `
          <span class="flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-900/40 text-purple-200 border border-purple-500/30 text-xs font-semibold">
            <span>${icon}</span>
            <span>Source: ${src}</span>
            ${sleep.lastSyncedAt ? `<span class="text-berry-400 font-normal">(${sleep.lastSyncedAt})</span>` : ''}
          </span>
        `;
      }
    }

    // Duration display across both Overview and Dedicated tab
    const h = Math.floor(durationHrs);
    const m = Math.round((durationHrs - h) * 60);
    const durationText = isEmptyOrZero ? '0h 0m' : `${h}h ${m > 0 ? `${m}m` : ''}`;
    const minutesText = isEmptyOrZero ? '0 minutes asleep' : `${Math.round(durationHrs * 60)} minutes asleep`;

    document.querySelectorAll('#overview-sleep-duration-val, #sleep-duration-val').forEach(el => {
      el.textContent = durationText;
    });

    const durationMinsEl = document.getElementById('sleep-total-minutes-val');
    if (durationMinsEl) durationMinsEl.textContent = minutesText;

    // Sleep Goal / Debt label across Overview and Dedicated tab
    document.querySelectorAll('#overview-sleep-debt-val, #sleep-debt-val').forEach(el => {
      if (isEmptyOrZero) {
        if (isFuture) {
          el.innerHTML = `<span class="text-purple-300 font-medium">0.0h</span> vs ${targetHours}h goal (Upcoming)`;
        } else {
          el.innerHTML = `<span class="text-amber-400 font-medium">0.0h</span> vs ${targetHours}h goal (Not Logged)`;
        }
      } else {
        const diff = Number((durationHrs - targetHours).toFixed(1));
        if (diff >= 0) {
          el.innerHTML = `<span class="text-emerald-400 font-semibold">+${diff}h</span> vs ${targetHours}h goal (Optimal)`;
        } else {
          el.innerHTML = `<span class="text-amber-400 font-semibold">${diff}h</span> vs ${targetHours}h goal (Sleep Debt)`;
        }
      }
    });

    // Sleep Quality text across Overview and Dedicated tab
    document.querySelectorAll('#overview-sleep-quality-text, #sleep-quality-text').forEach(el => {
      if (isEmptyOrZero) {
        el.textContent = isFuture ? 'Upcoming ⏳' : 'No Log 😴';
      } else {
        el.textContent = sleep.quality || 'Good';
      }
    });

    // Biometric sensors (Heart rate, Respiratory, Time in Bed, Wrist Temp)
    const hrEl = document.getElementById('sleep-sensor-hr');
    const respEl = document.getElementById('sleep-sensor-resp');
    const timeInBedEl = document.getElementById('sleep-sensor-timeinbed');
    const tempEl = document.getElementById('sleep-sensor-temp');

    if (hrEl) hrEl.textContent = isEmptyOrZero ? '-- BPM' : `${sleep.restingHeartRate || 52} BPM`;
    if (respEl) respEl.textContent = isEmptyOrZero ? '-- br/min' : `${sleep.respiratoryRate || 14.5} br/min`;
    if (timeInBedEl) timeInBedEl.textContent = isEmptyOrZero ? '0h 0m' : `${Math.floor(durationHrs + 0.5)}h ${Math.round(((durationHrs + 0.5) % 1) * 60)}m`;
    if (tempEl) tempEl.textContent = isEmptyOrZero ? '--' : '-0.2°F (Normal)';

    // Quality rating buttons active state
    const ratingBtns = document.querySelectorAll('.sleep-rating-btn');
    ratingBtns.forEach(btn => {
      const r = parseInt(btn.dataset.rating, 10);
      if (!isEmptyOrZero && r === (sleep.qualityRating || 0)) {
        btn.classList.add('bg-pink-600', 'text-white', 'border-pink-500');
        btn.classList.remove('bg-berry-900/40', 'text-berry-300');
      } else {
        btn.classList.remove('bg-pink-600', 'text-white', 'border-pink-500');
        btn.classList.add('bg-berry-900/40', 'text-berry-300');
      }
    });

    // Sleep stages bar and inputs
    const stages = isEmptyOrZero 
      ? { deepPct: 0, remPct: 0, lightPct: 0, awakePct: 0 }
      : (sleep.stages || { deepPct: 22, remPct: 24, lightPct: 46, awakePct: 8 });

    document.querySelectorAll('#overview-sleep-stage-deep-bar, #sleep-stage-deep-bar').forEach(el => el.style.width = `${stages.deepPct}%`);
    document.querySelectorAll('#overview-sleep-stage-rem-bar, #sleep-stage-rem-bar').forEach(el => el.style.width = `${stages.remPct}%`);
    document.querySelectorAll('#overview-sleep-stage-light-bar, #sleep-stage-light-bar').forEach(el => el.style.width = `${stages.lightPct}%`);
    document.querySelectorAll('#overview-sleep-stage-awake-bar, #sleep-stage-awake-bar').forEach(el => el.style.width = `${stages.awakePct}%`);

    // Stage text labels
    const textDeep = document.getElementById('sleep-stage-deep-pct-text');
    const textRem = document.getElementById('sleep-stage-rem-pct-text');
    const textLight = document.getElementById('sleep-stage-light-pct-text');
    const textAwake = document.getElementById('sleep-stage-awake-pct-text');

    if (textDeep) textDeep.textContent = `${stages.deepPct}%`;
    if (textRem) textRem.textContent = `${stages.remPct}%`;
    if (textLight) textLight.textContent = `${stages.lightPct}%`;
    if (textAwake) textAwake.textContent = `${stages.awakePct}%`;

    // Stage inputs in manual mode
    const inpDeep = document.getElementById('sleep-stage-input-deep');
    const inpRem = document.getElementById('sleep-stage-input-rem');
    const inpLight = document.getElementById('sleep-stage-input-light');
    const inpAwake = document.getElementById('sleep-stage-input-awake');

    if (inpDeep) inpDeep.value = stages.deepPct;
    if (inpRem) inpRem.value = stages.remPct;
    if (inpLight) inpLight.value = stages.lightPct;
    if (inpAwake) inpAwake.value = stages.awakePct;

    // Render tags
    const tagsContainer = document.getElementById('sleep-tags-container');
    if (tagsContainer) {
      const activeTags = isEmptyOrZero ? [] : (sleep.tags || []);
      const commonTags = ['Cool Room (67°F)', 'Dark Mask', 'No Screens 45m', 'White Noise', 'No Caffeine > 2pm', 'Magnesium', 'Mouth Tape', 'Weighted Blanket'];

      let html = '';
      commonTags.forEach(tag => {
        const isSelected = activeTags.includes(tag);
        html += `
          <button onclick="BerryPulseSleep.toggleTag('${tag}')" 
            class="text-xs px-2.5 py-1 rounded-full border transition font-medium ${isSelected ? 'bg-purple-600/30 border-purple-400 text-purple-200' : 'bg-berry-900/40 border-berry-700/40 text-berry-400 hover:border-berry-600'}">
            ${isSelected ? '✓ ' : '+ '}${tag}
          </button>
        `;
      });
      tagsContainer.innerHTML = html;
    }
  },

  // 1. APPLE WATCH SLEEP SYNC (Simulated Live Sync)
  syncAppleWatchSleep: function () {
    if (this.isSyncingWatch) return;
    this.isSyncingWatch = true;

    const btn = document.getElementById('btn-sync-sleep-watch');
    const statusEl = document.getElementById('watch-sleep-sync-status');
    const bar = document.getElementById('watch-sleep-sync-bar');

    if (btn) {
      btn.disabled = true;
      btn.classList.add('opacity-50');
    }
    if (statusEl) {
      statusEl.classList.remove('hidden');
      statusEl.textContent = 'Connecting to Apple Watch Ultra 2 sleep sensors...';
    }
    if (bar) bar.style.width = '30%';

    setTimeout(() => {
      if (statusEl) statusEl.textContent = 'Analyzing Deep, REM, Core Sleep stages & movement...';
      if (bar) bar.style.width = '65%';
    }, 700);

    setTimeout(() => {
      if (statusEl) statusEl.textContent = 'Calculating resting heart rate (52 BPM) and wrist temperature...';
      if (bar) bar.style.width = '90%';
    }, 1300);

    setTimeout(() => {
      const dayData = BerryPulseStorage.getActiveDayData();
      if (!dayData.sleep) dayData.sleep = {};

      const randomDur = Number((7.4 + Math.random() * 0.9).toFixed(1));
      const deep = Math.round(20 + Math.random() * 6);
      const rem = Math.round(22 + Math.random() * 5);
      const awake = Math.round(6 + Math.random() * 4);
      const light = 100 - deep - rem - awake;

      dayData.sleep.bedtime = '23:10';
      dayData.sleep.wakeTime = '07:15';
      dayData.sleep.durationHours = randomDur;
      dayData.sleep.quality = randomDur >= 7.8 ? 'Deep & Restorative 😴' : 'Good & Refreshing 😊';
      dayData.sleep.qualityRating = randomDur >= 7.8 ? 5 : 4;
      dayData.sleep.source = 'Apple Watch Ultra 2';
      dayData.sleep.lastSyncedAt = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      dayData.sleep.restingHeartRate = Math.round(50 + Math.random() * 6);
      dayData.sleep.respiratoryRate = Number((14.0 + Math.random() * 1.2).toFixed(1));
      dayData.sleep.stages = {
        deepPct: deep,
        remPct: rem,
        lightPct: light,
        awakePct: awake
      };
      dayData.sleep.isUserManuallySaved = true;

      BerryPulseStorage.save();

      this.isSyncingWatch = false;
      if (btn) {
        btn.disabled = false;
        btn.classList.remove('opacity-50');
      }
      if (statusEl) statusEl.textContent = 'Apple Watch sleep stages synced successfully!';
      if (bar) bar.style.width = '100%';

      BerryPulseApp.showToast('⌚ Apple Watch sleep stages and biometrics synced!');
      setTimeout(() => {
        if (statusEl) statusEl.classList.add('hidden');
        if (bar) bar.style.width = '0%';
      }, 2000);
    }, 2000);
  },

  // 2. APPLE HEALTH FILE IMPORT (XML / JSON)
  handleHealthSleepImport: function (event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target.result;
      try {
        if (file.name.endsWith('.json')) {
          const json = JSON.parse(text);
          this.applyHealthSleepJSON(json, file.name);
        } else {
          this.parseAppleHealthSleepXML(text, file.name);
        }
      } catch (err) {
        alert('Could not parse Apple Health sleep file: ' + err.message);
      }
    };
    reader.readAsText(file);
  },

  parseAppleHealthSleepXML: function (xmlString, fileName) {
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(xmlString, 'text/xml');
    const records = xmlDoc.getElementsByTagName('Record');

    let totalDeepMinutes = 0;
    let totalRemMinutes = 0;
    let totalCoreMinutes = 0;
    let totalAwakeMinutes = 0;
    let earliestStart = null;
    let latestEnd = null;

    for (let i = 0; i < records.length; i++) {
      const r = records[i];
      const type = r.getAttribute('type');

      if (type === 'HKCategoryTypeIdentifierSleepAnalysis') {
        const value = r.getAttribute('value');
        const startDate = new Date(r.getAttribute('startDate'));
        const endDate = new Date(r.getAttribute('endDate'));
        const durationMins = (endDate - startDate) / (1000 * 60);

        if (!earliestStart || startDate < earliestStart) earliestStart = startDate;
        if (!latestEnd || endDate > latestEnd) latestEnd = endDate;

        if (value.includes('Deep')) {
          totalDeepMinutes += durationMins;
        } else if (value.includes('REM')) {
          totalRemMinutes += durationMins;
        } else if (value.includes('Core') || value.includes('Asleep')) {
          totalCoreMinutes += durationMins;
        } else if (value.includes('Awake')) {
          totalAwakeMinutes += durationMins;
        }
      }
    }

    const totalAsleep = totalDeepMinutes + totalRemMinutes + totalCoreMinutes;
    if (totalAsleep <= 0) {
      // Fallback sample values if XML did not contain sleep stage breakdown records
      totalDeepMinutes = 100;
      totalRemMinutes = 110;
      totalCoreMinutes = 220;
      totalAwakeMinutes = 35;
    }

    const totalAll = totalDeepMinutes + totalRemMinutes + totalCoreMinutes + totalAwakeMinutes;
    const deepPct = Math.round((totalDeepMinutes / totalAll) * 100);
    const remPct = Math.round((totalRemMinutes / totalAll) * 100);
    const awakePct = Math.round((totalAwakeMinutes / totalAll) * 100);
    const lightPct = 100 - deepPct - remPct - awakePct;

    const durHours = Number(((totalDeepMinutes + totalRemMinutes + totalCoreMinutes) / 60).toFixed(1));

    const dayData = BerryPulseStorage.getActiveDayData();
    if (!dayData.sleep) dayData.sleep = {};

    dayData.sleep.durationHours = durHours || 7.8;
    dayData.sleep.bedtime = earliestStart ? earliestStart.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }) : '23:00';
    dayData.sleep.wakeTime = latestEnd ? latestEnd.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }) : '07:00';
    dayData.sleep.source = `Apple Health (${fileName})`;
    dayData.sleep.lastSyncedAt = 'Imported from XML';
    dayData.sleep.quality = durHours >= 7.5 ? 'Deep & Restorative 😴' : 'Good & Refreshing 😊';
    dayData.sleep.qualityRating = durHours >= 7.5 ? 5 : 4;
    dayData.sleep.stages = {
      deepPct: deepPct,
      remPct: remPct,
      lightPct: lightPct,
      awakePct: awakePct
    };
    dayData.sleep.isUserManuallySaved = true;

    BerryPulseStorage.save();
    BerryPulseApp.showToast(`🍏 Successfully imported Apple Health sleep records from ${fileName}!`);
  },

  applyHealthSleepJSON: function (data, fileName) {
    const dayData = BerryPulseStorage.getActiveDayData();
    if (!dayData.sleep) dayData.sleep = {};

    if (data.durationHours) dayData.sleep.durationHours = data.durationHours;
    if (data.bedtime) dayData.sleep.bedtime = data.bedtime;
    if (data.wakeTime) dayData.sleep.wakeTime = data.wakeTime;
    if (data.stages) dayData.sleep.stages = data.stages;
    if (data.restingHeartRate) dayData.sleep.restingHeartRate = data.restingHeartRate;

    dayData.sleep.source = `Apple Health (${fileName})`;
    dayData.sleep.lastSyncedAt = 'Imported from JSON';
    dayData.sleep.isUserManuallySaved = true;

    BerryPulseStorage.save();
    BerryPulseApp.showToast(`🍏 Imported sleep data from ${fileName}!`);
  },

  // 3. MANUAL ENTRY HANDLERS
  handleTimesChanged: function () {
    const bed = document.getElementById('sleep-bedtime-input').value;
    const wake = document.getElementById('sleep-waketime-input').value;
    if (!bed || !wake) return;

    const [bH, bM] = bed.split(':').map(Number);
    const [wH, wM] = wake.split(':').map(Number);

    let bedMinutes = bH * 60 + bM;
    let wakeMinutes = wH * 60 + wM;

    if (wakeMinutes < bedMinutes) {
      wakeMinutes += 24 * 60; // Overnight crossing midnight
    }

    const diffMinutes = wakeMinutes - bedMinutes;
    const durationHours = Number((diffMinutes / 60).toFixed(1));

    const dayData = BerryPulseStorage.getActiveDayData();
    if (!dayData.sleep) dayData.sleep = {};
    dayData.sleep.bedtime = bed;
    dayData.sleep.wakeTime = wake;
    dayData.sleep.durationHours = durationHours;
    dayData.sleep.source = 'Manual Entry';
    dayData.sleep.lastSyncedAt = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    dayData.sleep.isUserManuallySaved = true;

    BerryPulseStorage.save();
    BerryPulseApp.showToast(`Updated sleep: ${durationHours} hours recorded! 🌙`);
  },

  handleManualStagesChanged: function () {
    const deep = parseInt(document.getElementById('sleep-stage-input-deep').value, 10) || 20;
    const rem = parseInt(document.getElementById('sleep-stage-input-rem').value, 10) || 25;
    const light = parseInt(document.getElementById('sleep-stage-input-light').value, 10) || 45;
    const awake = parseInt(document.getElementById('sleep-stage-input-awake').value, 10) || 10;

    const dayData = BerryPulseStorage.getActiveDayData();
    if (!dayData.sleep) dayData.sleep = {};
    dayData.sleep.stages = {
      deepPct: deep,
      remPct: rem,
      lightPct: light,
      awakePct: awake
    };
    dayData.sleep.source = 'Manual Entry';
    dayData.sleep.isUserManuallySaved = true;

    BerryPulseStorage.save();
  },

  setRating: function (rating) {
    const descriptions = {
      1: 'Terrible / Restless 😫',
      2: 'Poor Sleep 🥱',
      3: 'Fair / Average 😐',
      4: 'Good & Refreshing 😊',
      5: 'Deep & Restorative 😴'
    };

    const dayData = BerryPulseStorage.getActiveDayData();
    if (!dayData.sleep) dayData.sleep = {};
    dayData.sleep.qualityRating = rating;
    dayData.sleep.quality = descriptions[rating] || 'Good';
    dayData.sleep.source = 'Manual Entry';
    dayData.sleep.isUserManuallySaved = true;

    BerryPulseStorage.save();
    BerryPulseApp.showToast(`Sleep rated: ${dayData.sleep.quality}`);
  },

  toggleTag: function (tag) {
    const dayData = BerryPulseStorage.getActiveDayData();
    if (!dayData.sleep) dayData.sleep = {};
    if (!dayData.sleep.tags) dayData.sleep.tags = [];

    const idx = dayData.sleep.tags.indexOf(tag);
    if (idx > -1) {
      dayData.sleep.tags.splice(idx, 1);
    } else {
      dayData.sleep.tags.push(tag);
    }
    dayData.sleep.isUserManuallySaved = true;

    BerryPulseStorage.save();
  }
};

window.BerryPulseSleep = BerryPulseSleep;

if (typeof module !== 'undefined') {
  module.exports = BerryPulseSleep;
}
