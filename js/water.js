/**
 * BerryPulse Wellness Tracker - Water & Hydration Tracker Module (Fluid Ounces - oz)
 */

const BerryPulseWater = {
  init: function() {
    this.bindEvents();
    this.render();
  },

  bindEvents: function() {
    window.addEventListener('berrypulse:date-changed', () => this.render());
    window.addEventListener('berrypulse:data-updated', () => this.render());
  },

  // Helper to resolve water state and ensure fluid ounces (oz)
  getWaterState: function() {
    const dayData = BerryPulseStorage.getActiveDayData();
    if (!dayData.water) {
      dayData.water = { intakeOz: 0, intakeMl: 0, logs: [] };
    }

    const goals = (BerryPulseStorage.state && BerryPulseStorage.state.goals) || {};
    // Priority: Settings goal in oz -> dayData goal in oz -> converted from ml -> default 96 oz
    const goalOz = goals.waterOz || dayData.water.goalOz || (goals.waterMl ? Math.round(goals.waterMl / 29.5735) : 96);
    
    // Intake in oz: prefer intakeOz; if only intakeMl exists, convert
    let intakeOz = 0;
    if (typeof dayData.water.intakeOz === 'number') {
      intakeOz = dayData.water.intakeOz;
    } else if (typeof dayData.water.intakeMl === 'number') {
      intakeOz = Math.round(dayData.water.intakeMl / 29.5735);
      dayData.water.intakeOz = intakeOz;
    }

    return { dayData, water: dayData.water, goalOz, intakeOz };
  },

  render: function() {
    const { water, goalOz, intakeOz } = this.getWaterState();
    const pct = goalOz > 0 ? Math.min(100, Math.round((intakeOz / goalOz) * 100)) : 0;
    const rem = Math.max(0, goalOz - intakeOz);

    // Update Overview card elements
    const ovIntakeEl = document.getElementById('overview-water-intake-val');
    const ovGoalEl = document.getElementById('overview-water-goal-val');
    const ovPctEl = document.getElementById('overview-water-pct-val');
    const ovRemainingEl = document.getElementById('overview-water-remaining-val');
    const ovWaveEl = document.getElementById('overview-water-bottle-wave');

    if (ovIntakeEl) ovIntakeEl.textContent = `${intakeOz} oz`;
    if (ovGoalEl) ovGoalEl.textContent = `${goalOz} oz`;
    if (ovPctEl) ovPctEl.textContent = `${pct}%`;
    if (ovRemainingEl) {
      ovRemainingEl.textContent = rem > 0 ? `${rem} oz remaining to target` : '🎉 Daily hydration goal achieved!';
    }
    if (ovWaveEl) ovWaveEl.style.height = `${pct}%`;

    // Update Dedicated Hydration Tab elements
    const intakeEl = document.getElementById('water-intake-val');
    const goalEl = document.getElementById('water-goal-val');
    const pctEl = document.getElementById('water-pct-val');
    const remainingEl = document.getElementById('water-remaining-val');
    const waveEl = document.getElementById('water-bottle-wave');
    const logsContainer = document.getElementById('water-logs-list');

    if (intakeEl) intakeEl.textContent = `${intakeOz}`;
    if (goalEl) goalEl.textContent = `/ ${goalOz} oz`;
    if (pctEl) pctEl.textContent = `${pct}%`;
    if (remainingEl) {
      remainingEl.textContent = rem > 0 ? `${rem} oz remaining to target` : '🎉 Daily hydration goal achieved!';
    }
    if (waveEl) waveEl.style.height = `${pct}%`;

    // Render log entries in fluid ounces
    if (logsContainer) {
      const logs = water.logs || [];
      if (logs.length === 0) {
        logsContainer.innerHTML = `<span class="text-xs text-berry-300/50">No water logged yet today.</span>`;
      } else {
        let html = '';
        logs.slice().reverse().forEach((log, revIdx) => {
          const originalIdx = logs.length - 1 - revIdx;
          const amt = log.amount > 100 ? Math.round(log.amount / 29.5735) : log.amount;
          html += `
            <div class="flex items-center justify-between text-xs py-1.5 px-2.5 rounded-lg bg-berry-900/40 border border-berry-800/40 group">
              <span class="text-cyan-300 font-semibold">+${amt} oz</span>
              <span class="text-berry-300/70">${log.label || 'Water'} (${log.time})</span>
              <button onclick="BerryPulseWater.deleteLog(${originalIdx})" class="opacity-0 group-hover:opacity-100 text-berry-400 hover:text-rose-400 font-bold px-1" title="Delete log">×</button>
            </div>
          `;
        });
        logsContainer.innerHTML = html;
      }
    }
  },

  addWater: function(amountOz, label = 'Water') {
    const { dayData, water, goalOz, intakeOz } = this.getWaterState();
    const prevIntake = intakeOz;
    const newIntake = prevIntake + amountOz;

    water.intakeOz = Math.max(0, newIntake);
    water.intakeMl = Math.round(water.intakeOz * 29.5735);
    if (!water.logs) water.logs = [];

    const now = new Date();
    const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    water.logs.push({
      time: timeStr,
      amount: amountOz,
      label: label
    });

    BerryPulseStorage.save();

    if (prevIntake < goalOz && newIntake >= goalOz) {
      BerryPulseApp.triggerConfetti();
      BerryPulseApp.showToast(`🌊 Hydration Hero! You reached your goal of ${goalOz} oz!`);
    } else {
      BerryPulseApp.showToast(`Logged +${amountOz} oz water! 💧`);
    }
  },

  undoWater: function(amountOz = 8) {
    const { dayData, water, intakeOz } = this.getWaterState();
    water.intakeOz = Math.max(0, intakeOz - amountOz);
    water.intakeMl = Math.round(water.intakeOz * 29.5735);
    if (water.logs && water.logs.length > 0) {
      water.logs.pop();
    }
    BerryPulseStorage.save();
    BerryPulseApp.showToast(`Removed ${amountOz} oz`);
  },

  deleteLog: function(index) {
    const { dayData, water } = this.getWaterState();
    if (water.logs && water.logs[index]) {
      const removed = water.logs.splice(index, 1);
      if (removed.length > 0) {
        const amt = removed[0].amount > 100 ? Math.round(removed[0].amount / 29.5735) : removed[0].amount;
        water.intakeOz = Math.max(0, (water.intakeOz || 0) - amt);
        water.intakeMl = Math.round(water.intakeOz * 29.5735);
        BerryPulseStorage.save();
      }
    }
  },

  promptCustomWater: function() {
    const input = prompt('Enter custom water amount in fluid ounces (e.g. 12):', '12');
    if (!input) return;
    const amount = parseFloat(input);
    if (!isNaN(amount) && amount > 0) {
      this.addWater(Math.round(amount), 'Custom intake');
    }
  },

  editDailyGoal: function() {
    const { goalOz } = this.getWaterState();
    const input = prompt('Set daily hydration goal (fluid ounces / oz):', goalOz);
    if (!input) return;
    const newGoal = parseInt(input, 10);
    if (!isNaN(newGoal) && newGoal >= 16) {
      if (!BerryPulseStorage.state.goals) BerryPulseStorage.state.goals = {};
      BerryPulseStorage.state.goals.waterOz = newGoal;
      BerryPulseStorage.state.goals.waterMl = Math.round(newGoal * 29.5735);
      const dayData = BerryPulseStorage.getActiveDayData();
      if (dayData.water) {
        dayData.water.goalOz = newGoal;
        dayData.water.goalMl = Math.round(newGoal * 29.5735);
      }
      BerryPulseStorage.save();
      this.render();
      BerryPulseApp.showToast(`Updated daily water goal to ${newGoal} oz! 💧`);
    }
  }
};

window.BerryPulseWater = BerryPulseWater;

if (typeof module !== 'undefined') {
  module.exports = BerryPulseWater;
}
