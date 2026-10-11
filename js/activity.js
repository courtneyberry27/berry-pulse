/**
 * BerryPulse Wellness Tracker - Physical Activity & Manual Workout Logger
 */

const BerryPulseActivity = {
  init: function() {
    this.bindEvents();
    this.render();
  },

  bindEvents: function() {
    window.addEventListener('berrypulse:date-changed', () => this.render());
    window.addEventListener('berrypulse:data-updated', () => this.render());

    // Auto-calculate calories on workout form input changes
    const typeSelect = document.getElementById('workout-type-select');
    const durationInput = document.getElementById('workout-duration-input');
    if (typeSelect && durationInput) {
      typeSelect.addEventListener('change', () => this.autoEstimateCalories());
      durationInput.addEventListener('input', () => this.autoEstimateCalories());
    }
  },

  render: function() {
    const dayData = BerryPulseStorage.getActiveDayData();
    const workouts = (dayData.activity && dayData.activity.workouts) ? dayData.activity.workouts : [];

    const container = document.getElementById('workouts-list-container');
    const totalWorkoutCalsEl = document.getElementById('activity-total-workout-cals');
    const totalWorkoutTimeEl = document.getElementById('activity-total-workout-mins');

    if (!container) return;

    let totalCals = 0;
    let totalMins = 0;

    if (workouts.length === 0) {
      container.innerHTML = `
        <div class="text-center py-6 text-berry-300/50 text-sm">
          <p>No workouts recorded for this day.</p>
          <button onclick="BerryPulseActivity.openWorkoutModal()" class="mt-2 text-pink-400 hover:text-pink-300 font-medium">
            + Log a Workout manually
          </button>
        </div>
      `;
    } else {
      let html = '';
      workouts.forEach((w, idx) => {
        totalCals += (w.calories || 0);
        totalMins += (w.durationMins || 0);

        html += `
          <div class="flex items-center justify-between p-3.5 rounded-xl bg-berry-900/40 border border-berry-700/30 hover:border-berry-600/50 transition group">
            <div class="flex items-center gap-3">
              <span class="text-2xl p-2 rounded-xl bg-berry-800/60">${w.icon || '🏃'}</span>
              <div>
                <div class="flex items-center gap-2">
                  <h4 class="font-bold text-berry-100 text-sm">${w.type}</h4>
                  <span class="text-[10px] uppercase font-semibold px-2 py-0.5 rounded-full ${w.intensity === 'Peak' ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30' : 'bg-berry-800 text-berry-300'}">${w.intensity || 'Moderate'}</span>
                  ${w.source ? `<span class="text-[10px] text-slate-400">via ${w.source}</span>` : ''}
                </div>
                <p class="text-xs text-berry-300/80 mt-0.5">
                  <span class="font-semibold text-pink-400">${w.durationMins} mins</span> • 
                  <span class="font-semibold text-rose-400">${w.calories} kcal</span>
                  ${w.distanceKm ? ` • <span>${w.distanceKm} km</span>` : ''}
                  ${w.avgHeartRate ? ` • <span>${w.avgHeartRate} avg bpm</span>` : ''}
                </p>
                ${w.notes ? `<p class="text-[11px] text-berry-400 italic mt-0.5">"${w.notes}"</p>` : ''}
              </div>
            </div>

            <button onclick="BerryPulseActivity.deleteWorkout(${idx})"
              class="opacity-0 group-hover:opacity-100 p-2 text-berry-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition" title="Delete workout">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
            </button>
          </div>
        `;
      });
      container.innerHTML = html;
    }

    if (totalWorkoutCalsEl) totalWorkoutCalsEl.textContent = `${totalCals} kcal`;
    if (totalWorkoutTimeEl) totalWorkoutTimeEl.textContent = `${totalMins} mins`;
  },

  openWorkoutModal: function() {
    const modal = document.getElementById('workout-modal');
    if (modal) {
      this.populateWorkoutTypes();
      document.getElementById('workout-duration-input').value = '30';
      document.getElementById('workout-distance-input').value = '';
      document.getElementById('workout-notes-input').value = '';
      this.autoEstimateCalories();
      modal.classList.remove('hidden');
      modal.classList.add('flex');
    }
  },

  closeWorkoutModal: function() {
    const modal = document.getElementById('workout-modal');
    if (modal) {
      modal.classList.add('hidden');
      modal.classList.remove('flex');
    }
  },

  populateWorkoutTypes: function() {
    const select = document.getElementById('workout-type-select');
    if (!select || select.children.length > 0) return;

    BerryPulseData.workoutTypes.forEach(t => {
      const opt = document.createElement('option');
      opt.value = t.id;
      opt.textContent = `${t.icon} ${t.name}`;
      select.appendChild(opt);
    });
  },

  autoEstimateCalories: function() {
    const select = document.getElementById('workout-type-select');
    const durationInput = document.getElementById('workout-duration-input');
    const caloriesInput = document.getElementById('workout-calories-input');

    if (!select || !durationInput || !caloriesInput) return;

    const selectedType = BerryPulseData.workoutTypes.find(t => t.id === select.value) || BerryPulseData.workoutTypes[0];
    const durationMins = parseFloat(durationInput.value) || 0;
    const userWeightKg = (BerryPulseStorage.state.userProfile && BerryPulseStorage.state.userProfile.weightKg) || 68;

    // MET formula: Calories = MET * weight_kg * (mins / 60)
    const estimated = Math.round(selectedType.met * userWeightKg * (durationMins / 60));
    caloriesInput.value = estimated > 0 ? estimated : 150;
  },

  saveWorkout: function() {
    const typeSelect = document.getElementById('workout-type-select');
    const durationInput = document.getElementById('workout-duration-input');
    const caloriesInput = document.getElementById('workout-calories-input');
    const distanceInput = document.getElementById('workout-distance-input');
    const intensitySelect = document.getElementById('workout-intensity-select');
    const notesInput = document.getElementById('workout-notes-input');

    const workoutObj = BerryPulseData.workoutTypes.find(t => t.id === typeSelect.value) || BerryPulseData.workoutTypes[0];
    const durationMins = parseInt(durationInput.value, 10) || 0;
    const calories = parseInt(caloriesInput.value, 10) || 0;
    const distanceKm = parseFloat(distanceInput.value) || null;
    const intensity = intensitySelect ? intensitySelect.value : 'Moderate';
    const notes = notesInput ? notesInput.value.trim() : '';

    if (durationMins <= 0) {
      alert('Please enter a valid workout duration');
      return;
    }

    const dayData = BerryPulseStorage.getActiveDayData();
    if (!dayData.activity.workouts) dayData.activity.workouts = [];

    const newWorkout = {
      id: `w-${Date.now()}`,
      type: workoutObj.name,
      icon: workoutObj.icon,
      durationMins: durationMins,
      calories: calories,
      distanceKm: distanceKm,
      intensity: intensity,
      notes: notes,
      source: 'Manual Entry',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    dayData.activity.workouts.push(newWorkout);

    // Update Apple Activity Rings to reflect this workout
    dayData.activity.rings.move.current = (dayData.activity.rings.move.current || 0) + calories;
    dayData.activity.rings.exercise.current = (dayData.activity.rings.exercise.current || 0) + durationMins;

    BerryPulseStorage.save();
    this.closeWorkoutModal();
    BerryPulseApp.showToast(`Logged ${workoutObj.name}: ${durationMins}m, ${calories} kcal! 🏃`);
  },

  deleteWorkout: function(index) {
    const dayData = BerryPulseStorage.getActiveDayData();
    if (dayData.activity.workouts) {
      const removed = dayData.activity.workouts.splice(index, 1);
      if (removed.length > 0) {
        // Adjust rings
        dayData.activity.rings.move.current = Math.max(0, (dayData.activity.rings.move.current || 0) - (removed[0].calories || 0));
        dayData.activity.rings.exercise.current = Math.max(0, (dayData.activity.rings.exercise.current || 0) - (removed[0].durationMins || 0));
        BerryPulseStorage.save();
        BerryPulseApp.showToast(`Removed ${removed[0].type}`);
      }
    }
  }
};

window.BerryPulseActivity = BerryPulseActivity;

if (typeof module !== 'undefined') {
  module.exports = BerryPulseActivity;
}
