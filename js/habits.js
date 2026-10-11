/**
 * BerryPulse Wellness Tracker - Customizable Daily Habits Module
 */

const BerryPulseHabits = {
  currentCategoryFilter: 'all',

  init: function () {
    this.bindEvents();
    this.render();
  },

  bindEvents: function () {
    window.addEventListener('berrypulse:date-changed', () => this.render());
    window.addEventListener('berrypulse:data-updated', () => this.render());
  },

  setFilter: function (category) {
    this.currentCategoryFilter = category;
    document.querySelectorAll('[data-habit-filter]').forEach(btn => {
      const isMatch = (btn.dataset.habitFilter || '').toLowerCase() === category.toLowerCase();
      if (isMatch) {
        btn.className = 'habit-filter-btn px-3.5 py-1.5 rounded-xl text-xs font-bold bg-pink-600 text-white shadow-md border border-pink-500 transition';
      } else {
        btn.className = 'habit-filter-btn px-3.5 py-1.5 rounded-xl text-xs font-medium bg-berry-900 text-berry-300 hover:text-white border border-berry-700/40 transition';
      }
    });
    this.render();
  },

  renderHabitCard: function (habit, isDone) {
    return `
      <div class="habit-card relative group p-4 rounded-2xl transition-all duration-300 border ${isDone ? 'bg-gradient-to-br from-berry-900/60 to-pink-950/30 border-pink-500/40 shadow-lg shadow-pink-900/20' : 'bg-berry-900/30 border-berry-700/30 hover:border-berry-600/50'}">
        <div class="flex items-start justify-between gap-3">
          <div class="flex items-center gap-3 cursor-pointer flex-1" onclick="BerryPulseHabits.toggleHabit('${habit.id}')">
            <div class="habit-checkbox w-7 h-7 rounded-xl flex items-center justify-center transition-all ${isDone ? 'bg-gradient-to-br from-pink-500 to-rose-600 text-white shadow-md shadow-pink-500/30 scale-105' : 'border-2 border-berry-600/60 bg-berry-950/50 hover:border-pink-400'}">
              ${isDone ? '<svg class="w-4 h-4 stroke-[3]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"></path></svg>' : ''}
            </div>
            <div>
              <div class="flex items-center gap-2">
                <span class="text-lg">${habit.icon || '✨'}</span>
                <h4 class="font-semibold text-sm ${isDone ? 'line-through text-berry-300/80' : 'text-berry-100'}">${habit.name}</h4>
              </div>
              <div class="flex items-center gap-2 mt-1">
                <span class="text-[11px] font-medium px-2 py-0.5 rounded-full bg-berry-800/60 text-berry-300">${habit.category || 'General'}</span>
                <span class="text-[11px] text-amber-400 flex items-center gap-1 font-medium">
                  🔥 ${habit.streak || 0} day streak
                </span>
              </div>
            </div>
          </div>

          <div class="opacity-0 group-hover:opacity-100 transition flex items-center gap-1">
            <button onclick="BerryPulseHabits.deleteHabit('${habit.id}')" 
              class="p-1.5 rounded-lg text-berry-400 hover:text-rose-400 hover:bg-rose-500/10 transition" title="Delete habit">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
            </button>
          </div>
        </div>
      </div>
    `;
  },

  render: function () {
    const dayData = BerryPulseStorage.getActiveDayData();
    const habits = BerryPulseStorage.state.habits || [];
    const habitsStatus = dayData.habitsStatus || {};

    const overviewContainer = document.getElementById('habits-overview-list-container') || document.getElementById('habits-list-container');
    const dedicatedContainer = document.getElementById('habits-dedicated-list-container');
    const progressEl = document.getElementById('habits-completion-pct');
    const countEl = document.getElementById('habits-completion-count');
    const progressBar = document.getElementById('habits-progress-bar');

    let completedCount = 0;
    const totalCount = habits.length;

    habits.forEach(h => {
      if (habitsStatus[h.id] === true) {
        completedCount++;
      }
    });

    const pct = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

    if (progressEl) progressEl.textContent = `${pct}%`;
    if (countEl) countEl.textContent = `${completedCount} of ${totalCount} completed`;
    if (progressBar) progressBar.style.width = `${pct}%`;

    // 1. Render Dedicated Habits Tab Container (filtered by category)
    if (dedicatedContainer) {
      const filteredHabits = habits.filter(h => {
        if (this.currentCategoryFilter === 'all') return true;
        return (h.category || '').toLowerCase() === this.currentCategoryFilter.toLowerCase();
      });

        if (filteredHabits.length === 0) {
          dedicatedContainer.innerHTML = `
          <div class="text-center py-8 text-berry-300/60 col-span-full">
            <p class="text-base font-medium">No habits in this category yet.</p>
            <button onclick="BerryPulseHabits.openAddModal()" class="mt-3 px-4 py-2 bg-pink-600 hover:bg-pink-500 text-white rounded-xl text-sm font-semibold transition">
              + Create a Habit
            </button>
          </div>
        `;
        } else {
          dedicatedContainer.innerHTML = filteredHabits.map(h => this.renderHabitCard(h, habitsStatus[h.id] === true)).join('');
        }
      }

    // 2. Render Overview Dashboard Container (all habits)
    if (overviewContainer) {
      if (habits.length === 0) {
        overviewContainer.innerHTML = `
          < div class="text-center py-6 text-berry-300/60 text-sm" >
            <p>No habits configured.</p>
            <button onclick="BerryPulseHabits.openAddModal()" class="mt-2 text-pink-400 hover:underline">+ Add Habit</button>
          </div >
        `;
      } else {
  overviewContainer.innerHTML = habits.map(h => this.renderHabitCard(h, habitsStatus[h.id] === true)).join('');
}
    }
  },

toggleHabit: function(habitId) {
  const dayData = BerryPulseStorage.getActiveDayData();
  if (!dayData.habitsStatus) dayData.habitsStatus = {};

  const currentlyDone = dayData.habitsStatus[habitId] === true;
  dayData.habitsStatus[habitId] = !currentlyDone;

  // Update streak on the habit object
  const habit = BerryPulseStorage.state.habits.find(h => h.id === habitId);
  if (habit) {
    if (!currentlyDone) {
      habit.streak = (habit.streak || 0) + 1;
    } else {
      habit.streak = Math.max(0, (habit.streak || 1) - 1);
    }
  }

  BerryPulseStorage.save();

  // Check if all are complete
  const habits = BerryPulseStorage.state.habits;
  const allDone = habits.length > 0 && habits.every(h => dayData.habitsStatus[h.id] === true);
  if (allDone && !currentlyDone) {
    BerryPulseApp.triggerConfetti();
    BerryPulseApp.showToast('🎉 Incredible! All daily habits completed today!');
  } else if (!currentlyDone) {
    BerryPulseApp.showToast(`Completed: ${habit ? habit.name : 'Habit'}! 🔥`);
  }
},

openAddModal: function() {
  const modal = document.getElementById('new-habit-modal');
  if (modal) {
    document.getElementById('new-habit-name').value = '';
    document.getElementById('new-habit-category').value = 'Body';
    document.getElementById('new-habit-icon').value = '🌟';
    document.getElementById('new-habit-frequency').value = 'Daily';
    modal.classList.remove('hidden');
    modal.classList.add('flex');
  }
},

closeAddModal: function() {
  const modal = document.getElementById('new-habit-modal');
  if (modal) {
    modal.classList.add('hidden');
    modal.classList.remove('flex');
  }
},

saveNewHabit: function() {
  const name = document.getElementById('new-habit-name').value.trim();
  const category = document.getElementById('new-habit-category').value;
  const icon = document.getElementById('new-habit-icon').value.trim() || '✨';
  const frequency = document.getElementById('new-habit-frequency').value;

  if (!name) {
    alert('Please enter a habit name');
    return;
  }

  const newHabit = {
    id: `h-${Date.now()}`,
    name: name,
    category: category,
    icon: icon,
    targetFrequency: frequency,
    streak: 0,
    completed: false,
    reminderTime: '08:00'
  };

  BerryPulseStorage.state.habits.push(newHabit);
  BerryPulseStorage.save();
  this.closeAddModal();
  BerryPulseApp.showToast(`Created new habit: "${name}"!`);
},

deleteHabit: function(habitId) {
  const habit = BerryPulseStorage.state.habits.find(h => h.id === habitId);
  if (!habit) return;

  if (confirm(`Are you sure you want to delete "${habit.name}"?`)) {
    BerryPulseStorage.state.habits = BerryPulseStorage.state.habits.filter(h => h.id !== habitId);
    BerryPulseStorage.save();
    BerryPulseApp.showToast(`Deleted "${habit.name}"`);
  }
}
};

window.BerryPulseHabits = BerryPulseHabits;

if (typeof module !== 'undefined') {
  module.exports = BerryPulseHabits;
}
