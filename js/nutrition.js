/**
 * BerryPulse Wellness Tracker - Calories & Nutrition Module
 */

const BerryPulseNutrition = {
  currentMealTarget: 'breakfast',
  selectedFoodItem: null,
  servingMultiplier: 1.0,

  init: function() {
    this.bindEvents();
    this.render();
  },

  bindEvents: function() {
    // Listen for storage date change or data updates
    window.addEventListener('berrypulse:date-changed', () => this.render());
    window.addEventListener('berrypulse:data-updated', () => this.render());

    // Search input listener
    const searchInput = document.getElementById('food-search-input');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => this.handleSearch(e.target.value));
    }

    // Serving multiplier listener
    const multiplierInput = document.getElementById('food-serving-multiplier');
    if (multiplierInput) {
      multiplierInput.addEventListener('input', (e) => {
        const val = parseFloat(e.target.value) || 1;
        this.servingMultiplier = Math.max(0.1, val);
        this.updateModalPreview();
      });
    }

    // AI prompt enter key listener
    const aiInput = document.getElementById('ai-food-prompt-input');
    if (aiInput) {
      aiInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          this.triggerAIAnalysis();
        }
      });
    }
  },

  // Render current day's nutrition
  render: function() {
    const dayData = BerryPulseStorage.getActiveDayData();
    const nutrition = dayData.nutrition || { dailyGoalCalories: 2200, meals: { breakfast: [], lunch: [], dinner: [], snacks: [] } };
    const goals = BerryPulseStorage.state.goals || BerryPulseData.defaultGoals;
    const activity = dayData.activity || {};
    const burnedCalories = (activity.rings && activity.rings.move) ? activity.rings.move.current : (activity.workouts ? activity.workouts.reduce((s, w) => s + (w.calories || 0), 0) : 0);

    // Compute totals across all meals
    let totalCalories = 0;
    let totalProtein = 0;
    let totalCarbs = 0;
    let totalFat = 0;
    let totalFiber = 0;

    const meals = nutrition.meals || {};
    Object.keys(meals).forEach(mealKey => {
      const items = meals[mealKey] || [];
      items.forEach(item => {
        totalCalories += (item.calories || 0);
        totalProtein += (item.protein || 0);
        totalCarbs += (item.carbs || 0);
        totalFat += (item.fat || 0);
        totalFiber += (item.fiber || 0);
      });
    });

    // Resolve goal calories (priority: state.goals.calories -> dayData.nutrition.dailyGoalCalories -> default 2200)
    let goalCalories = 2200;
    if (goals && typeof goals.calories !== 'undefined' && goals.calories !== null) {
      goalCalories = parseInt(goals.calories, 10) || 2200;
    } else if (nutrition && typeof nutrition.dailyGoalCalories !== 'undefined') {
      goalCalories = parseInt(nutrition.dailyGoalCalories, 10) || 2200;
    }

    const caloriesRemaining = goalCalories - totalCalories;
    const netCalories = totalCalories - burnedCalories;

    // Update Overview calorie summary elements
    const elemConsumed = document.getElementById('nutrition-consumed-cal');
    const elemGoal = document.getElementById('nutrition-goal-cal');
    const elemBurned = document.getElementById('nutrition-burned-cal');
    const elemNet = document.getElementById('nutrition-net-cal');
    const elemRemaining = document.getElementById('nutrition-remaining-cal');
    const elemRemainingLabel = document.getElementById('nutrition-remaining-label');
    const elemCalProgress = document.getElementById('nutrition-cal-progress-bar');

    if (elemConsumed) elemConsumed.textContent = Math.round(totalCalories).toLocaleString();
    if (elemGoal) elemGoal.textContent = Math.round(goalCalories).toLocaleString();
    if (elemBurned) elemBurned.textContent = Math.round(burnedCalories).toLocaleString();
    if (elemNet) elemNet.textContent = Math.round(netCalories).toLocaleString();

    const roundedRemaining = Math.round(caloriesRemaining) === 0 ? 0 : Math.round(caloriesRemaining);

    if (elemRemaining) {
      elemRemaining.textContent = roundedRemaining.toLocaleString();
      if (roundedRemaining >= 0) {
        elemRemaining.className = 'text-lg font-bold text-pink-400';
        if (elemRemainingLabel) {
          elemRemainingLabel.textContent = 'calories left';
          elemRemainingLabel.className = 'text-[11px] text-berry-300/70 block';
        }
      } else {
        elemRemaining.className = 'text-lg font-bold text-rose-400';
        if (elemRemainingLabel) {
          elemRemainingLabel.textContent = 'calories remaining';
          elemRemainingLabel.className = 'text-[11px] text-rose-400 font-semibold block';
        }
      }
    }

    if (elemCalProgress) {
      const pct = Math.min(100, Math.round((totalCalories / (goalCalories || 1)) * 100));
      elemCalProgress.style.width = `${pct}%`;
      elemCalProgress.className = `h-2.5 rounded-full transition-all duration-500 ${totalCalories > goalCalories ? 'bg-rose-500' : 'bg-gradient-to-r from-rose-500 to-pink-500'}`;
    }

    // Update Dedicated Nutrition Tab elements (if present)
    const tabGoalEl = document.getElementById('tab-nutrition-goal-cal');
    const tabConsumedEl = document.getElementById('tab-nutrition-consumed-cal');
    const tabRemainingEl = document.getElementById('tab-nutrition-remaining-cal');
    const tabRemainingLabel = document.getElementById('tab-nutrition-remaining-label');
    const tabBurnedEl = document.getElementById('tab-nutrition-burned-cal');

    if (tabGoalEl) tabGoalEl.textContent = Math.round(goalCalories).toLocaleString();
    if (tabConsumedEl) tabConsumedEl.textContent = Math.round(totalCalories).toLocaleString();
    if (tabBurnedEl) tabBurnedEl.textContent = `${Math.round(burnedCalories).toLocaleString()} kcal`;
    if (tabRemainingEl) {
      tabRemainingEl.textContent = roundedRemaining.toLocaleString();
      if (roundedRemaining >= 0) {
        tabRemainingEl.className = 'text-xl font-extrabold text-emerald-400';
        if (tabRemainingLabel) {
          tabRemainingLabel.textContent = 'Calories Left';
          tabRemainingLabel.className = 'text-[11px] text-emerald-300 block font-medium';
        }
      } else {
        tabRemainingEl.className = 'text-xl font-extrabold text-rose-400';
        if (tabRemainingLabel) {
          tabRemainingLabel.textContent = 'Calories Left';
          tabRemainingLabel.className = 'text-[11px] text-rose-400 font-semibold block';
        }
      }
    }

    // Macro Bars
    this.updateMacroBar('protein', totalProtein, goals.proteinGrams || 140, 'g');
    this.updateMacroBar('carbs', totalCarbs, goals.carbsGrams || 220, 'g');
    this.updateMacroBar('fat', totalFat, goals.fatGrams || 65, 'g');
    this.updateMacroBar('fiber', totalFiber, goals.fiberGrams || 35, 'g');

    // Render individual meal sections
    this.renderMealSection('breakfast', 'Breakfast', '🍳', meals.breakfast || []);
    this.renderMealSection('lunch', 'Lunch', '🥗', meals.lunch || []);
    this.renderMealSection('dinner', 'Dinner', '🍲', meals.dinner || []);
    this.renderMealSection('snacks', 'Snacks & Berries', '🍓', meals.snacks || []);

    // Render custom meals if any
    const customContainer = document.getElementById('custom-meals-container');
    if (customContainer) {
      customContainer.innerHTML = '';
      Object.keys(meals).forEach(key => {
        if (!['breakfast', 'lunch', 'dinner', 'snacks'].includes(key)) {
          const capitalized = key.charAt(0).toUpperCase() + key.slice(1);
          const mealEl = document.createElement('div');
          mealEl.className = 'meal-block bg-berry-900/40 rounded-2xl p-4 border border-berry-700/30';
          mealEl.id = `meal-section-${key}`;
          customContainer.appendChild(mealEl);
          this.renderMealSection(key, capitalized, '🍽️', meals[key]);
        }
      });
    }
  },

  updateMacroBar: function(macro, current, goal, unit) {
    const valEl = document.getElementById(`macro-${macro}-val`);
    const ovValEl = document.getElementById(`overview-macro-${macro}-val`);
    const barEl = document.getElementById(`macro-${macro}-bar`);
    if (valEl) {
      valEl.textContent = `${Math.round(current)}${unit} / ${goal}${unit}`;
    }
    if (ovValEl) {
      ovValEl.textContent = `${Math.round(current)}${unit}`;
    }
    if (barEl) {
      const pct = Math.min(100, Math.round((current / (goal || 1)) * 100));
      barEl.style.width = `${pct}%`;
    }
  },

  renderMealSection: function(mealKey, title, emoji, items) {
    const container = document.getElementById(`meal-items-${mealKey}`);
    const totalEl = document.getElementById(`meal-cals-${mealKey}`);
    if (!container) return;

    let mealCals = 0;
    let mealProtein = 0;
    let mealCarbs = 0;
    let mealFat = 0;

    if (items.length === 0) {
      container.innerHTML = `
        <div class="text-center py-4 text-berry-300/50 text-sm">
          <span>No foods logged yet. Click "+ Add Food" to search.</span>
        </div>
      `;
    } else {
      let html = '';
      items.forEach((item, idx) => {
        mealCals += (item.calories || 0);
        mealProtein += (item.protein || 0);
        mealCarbs += (item.carbs || 0);
        mealFat += (item.fat || 0);

        html += `
          <div class="flex items-center justify-between p-2.5 rounded-xl hover:bg-berry-800/40 transition group border border-transparent hover:border-berry-700/30">
            <div class="flex items-center gap-3">
              <span class="text-xl p-1.5 rounded-lg bg-berry-800/60">${item.icon || '🫐'}</span>
              <div>
                <p class="font-medium text-berry-100 text-sm leading-tight">${item.name}</p>
                <p class="text-xs text-berry-300/70">
                  ${item.serving || '1 serving'} • <span class="text-pink-400 font-semibold">${Math.round(item.calories)} kcal</span>
                  <span class="ml-1 text-slate-400">(P: ${Math.round(item.protein || 0)}g, C: ${Math.round(item.carbs || 0)}g, F: ${Math.round(item.fat || 0)}g)</span>
                </p>
              </div>
            </div>
            <button onclick="BerryPulseNutrition.deleteFoodItem('${mealKey}', ${idx})" 
              class="opacity-0 group-hover:opacity-100 text-berry-400 hover:text-rose-400 p-1.5 rounded-lg hover:bg-rose-500/10 transition"
              title="Remove food item">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
            </button>
          </div>
        `;
      });
      container.innerHTML = html;
    }

    if (totalEl) {
      totalEl.innerHTML = `<span class="font-bold text-pink-400">${Math.round(mealCals)}</span> <span class="text-xs text-berry-300/70">kcal</span>`;
    }
  },

  // Open the search and log modal
  openAddModal: function(mealKey) {
    this.currentMealTarget = mealKey;
    this.selectedFoodItem = null;
    this.servingMultiplier = 1.0;

    const modal = document.getElementById('food-search-modal');
    const targetMealTitle = document.getElementById('modal-target-meal-name');
    const searchInput = document.getElementById('food-search-input');
    const multiplierInput = document.getElementById('food-serving-multiplier');
    const previewContainer = document.getElementById('food-preview-details');

    if (targetMealTitle) {
      targetMealTitle.textContent = mealKey.toUpperCase();
    }
    if (multiplierInput) {
      multiplierInput.value = 1.0;
    }
    if (previewContainer) {
      previewContainer.classList.add('hidden');
    }
    if (searchInput) {
      searchInput.value = '';
      setTimeout(() => searchInput.focus(), 100);
    }

    // Populate default suggestions (popular berries & healthy options)
    this.handleSearch('');

    if (modal) {
      modal.classList.remove('hidden');
      modal.classList.add('flex');
      modal.style.display = 'flex';
    }
  },

  closeAddModal: function() {
    const modal = document.getElementById('food-search-modal');
    if (modal) {
      modal.classList.add('hidden');
      modal.classList.remove('flex');
      modal.style.display = 'none';
    }
  },

  // Handle instant fuzzy search
  handleSearch: function(query) {
    const resultsContainer = document.getElementById('food-search-results');
    if (!resultsContainer) return;

    const trimmed = query.trim().toLowerCase();
    let matches = [];

    if (trimmed.length === 0) {
      // Show top favorites & berries
      matches = BerryPulseData.foodDatabase.slice(0, 10);
    } else {
      matches = BerryPulseData.foodDatabase.filter(food => {
        return food.name.toLowerCase().includes(trimmed) || 
               food.category.toLowerCase().includes(trimmed);
      });
    }

    let html = '';
    if (matches.length === 0) {
      html = `
        <div class="p-6 text-center text-berry-300">
          <p class="font-medium">No foods found for "${query}"</p>
          <p class="text-xs mt-1 text-berry-400/80">Try another keyword, or click below to add a custom food item.</p>
          <button onclick="BerryPulseNutrition.switchToCustomFoodMode('${query}')" class="mt-4 px-4 py-2 bg-pink-600 hover:bg-pink-500 text-white rounded-xl text-sm font-semibold transition">
            ➕ Add "${query}" as Custom Food
          </button>
        </div>
      `;
    } else {
      matches.forEach(item => {
        html += `
          <div onclick="BerryPulseNutrition.selectFoodItem('${item.id}')" 
            class="food-search-item flex items-center justify-between p-3 rounded-xl hover:bg-berry-800/80 cursor-pointer border border-transparent hover:border-pink-500/30 transition">
            <div class="flex items-center gap-3">
              <span class="text-2xl">${item.icon || '🫐'}</span>
              <div>
                <p class="font-semibold text-berry-100 text-sm">${item.name}</p>
                <p class="text-xs text-berry-300/70">${item.servingSize} • <span class="text-pink-400 font-bold">${item.calories} kcal</span></p>
              </div>
            </div>
            <div class="text-right text-xs text-berry-300/80">
              <span>P: ${item.protein}g | C: ${item.carbs}g | F: ${item.fat}g</span>
            </div>
          </div>
        `;
      });
    }

    resultsContainer.innerHTML = html;
  },

  // Trigger AI Nutrition Analysis
  triggerAIAnalysis: async function(overridePrompt = null) {
    const inputEl = document.getElementById('ai-food-prompt-input');
    const query = overridePrompt || (inputEl ? inputEl.value.trim() : '');

    if (!query) {
      alert('Please enter a meal or food description for the AI to analyze.');
      return;
    }

    const statusEl = document.getElementById('ai-analyzing-status');
    const previewContainer = document.getElementById('food-preview-details');
    const analyzeBtn = document.getElementById('btn-analyze-ai');

    if (statusEl) {
      statusEl.classList.remove('hidden');
      statusEl.innerHTML = `
        <div class="flex items-center justify-center gap-2 text-xs text-pink-300 font-semibold py-3 animate-pulse">
          <svg class="animate-spin h-4 w-4 text-pink-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
          <span>BerryPulse AI is calculating nutrition & portion breakdown for "${query}"...</span>
        </div>
      `;
    }
    if (analyzeBtn) {
      analyzeBtn.disabled = true;
      analyzeBtn.classList.add('opacity-50');
    }
    if (previewContainer) {
      previewContainer.classList.add('hidden');
    }

    try {
      const aiResult = await BerryPulseAI.analyzeFoodQuery(query);
      this.selectedFoodItem = {
        id: `ai-${Date.now()}`,
        name: aiResult.name,
        category: aiResult.category || 'AI Analysis',
        servingSize: aiResult.serving || '1 portion',
        calories: aiResult.calories,
        protein: aiResult.protein,
        carbs: aiResult.carbs,
        fat: aiResult.fat,
        fiber: aiResult.fiber,
        icon: aiResult.icon || '✨',
        aiInsights: aiResult.aiInsights,
        ingredients: aiResult.ingredients,
        aiEngine: aiResult.aiEngine,
        isAiGenerated: true
      };

      this.updateModalPreview();

      if (statusEl) {
        statusEl.innerHTML = `
          <div class="flex items-center justify-between text-[11px] px-3 py-1.5 rounded-xl bg-purple-950/50 border border-purple-500/30 text-purple-200">
            <span class="flex items-center gap-1 font-semibold">✨ ${aiResult.aiEngine || 'AI Model'}</span>
            <span class="text-emerald-400 font-medium">Confidence: ${aiResult.confidenceScore || 95}%</span>
          </div>
        `;
      }
    } catch (err) {
      alert('AI Analysis error: ' + err.message);
      if (statusEl) statusEl.classList.add('hidden');
    } finally {
      if (analyzeBtn) {
        analyzeBtn.disabled = false;
        analyzeBtn.classList.remove('opacity-50');
      }
    }
  },

  populateAiPreset: function(text) {
    const inputEl = document.getElementById('ai-food-prompt-input');
    if (inputEl) {
      inputEl.value = text;
      this.triggerAIAnalysis(text);
    }
  },

  // Select item from list to adjust portion
  selectFoodItem: function(itemId) {
    const item = BerryPulseData.foodDatabase.find(f => f.id === itemId);
    if (!item) return;

    this.selectedFoodItem = item;
    this.updateModalPreview();
  },

  updateModalPreview: function() {
    const previewContainer = document.getElementById('food-preview-details');
    if (!previewContainer || !this.selectedFoodItem) return;

    previewContainer.classList.remove('hidden');

    const m = this.servingMultiplier;
    const item = this.selectedFoodItem;

    const calcCal = Math.round(item.calories * m);
    const calcProtein = (item.protein * m).toFixed(1);
    const calcCarbs = (item.carbs * m).toFixed(1);
    const calcFat = (item.fat * m).toFixed(1);
    const calcFiber = (item.fiber * m).toFixed(1);

    document.getElementById('preview-food-name').textContent = item.name;
    document.getElementById('preview-food-icon').textContent = item.icon || '🫐';
    document.getElementById('preview-food-cals').textContent = `${calcCal} kcal`;
    document.getElementById('preview-food-serving').textContent = `${item.servingSize || item.serving} × ${m}`;
    document.getElementById('preview-macro-protein').textContent = `${calcProtein}g`;
    document.getElementById('preview-macro-carbs').textContent = `${calcCarbs}g`;
    document.getElementById('preview-macro-fat').textContent = `${calcFat}g`;
    document.getElementById('preview-macro-fiber').textContent = `${calcFiber}g`;

    // Render AI insights and ingredients if present
    const aiBox = document.getElementById('preview-ai-details');
    if (aiBox) {
      if (item.isAiGenerated) {
        aiBox.classList.remove('hidden');
        let ingredientsHtml = '';
        if (item.ingredients && item.ingredients.length > 0) {
          ingredientsHtml = `
            <div class="mt-2 flex flex-wrap gap-1">
              ${item.ingredients.map(ing => `<span class="text-[10px] px-2 py-0.5 rounded-full bg-berry-950 border border-berry-700/60 text-berry-200">${ing}</span>`).join('')}
            </div>
          `;
        }

        aiBox.innerHTML = `
          <div class="p-2.5 rounded-xl bg-purple-950/40 border border-purple-500/20 text-xs">
            <span class="text-pink-300 font-bold flex items-center gap-1">
              <span>✨ AI Nutritional Analysis:</span>
            </span>
            <p class="text-berry-200/90 text-[11px] mt-1 leading-relaxed">${item.aiInsights || 'Analyzed ingredients & macronutrient density.'}</p>
            ${ingredientsHtml}
          </div>
        `;
      } else {
        aiBox.classList.add('hidden');
      }
    }
  },

  // Add the selected item to current meal
  confirmAddFood: function() {
    if (!this.selectedFoodItem) return;

    const m = this.servingMultiplier;
    const base = this.selectedFoodItem;

    const dayData = BerryPulseStorage.getActiveDayData();
    if (!dayData.nutrition.meals[this.currentMealTarget]) {
      dayData.nutrition.meals[this.currentMealTarget] = [];
    }

    const newItem = {
      id: `${base.id}-${Date.now()}`,
      name: base.name,
      icon: base.icon,
      serving: `${base.servingSize} (×${m})`,
      calories: Math.round(base.calories * m),
      protein: Number((base.protein * m).toFixed(1)),
      carbs: Number((base.carbs * m).toFixed(1)),
      fat: Number((base.fat * m).toFixed(1)),
      fiber: Number((base.fiber * m).toFixed(1))
    };

    dayData.nutrition.meals[this.currentMealTarget].push(newItem);
    BerryPulseStorage.save();
    this.closeAddModal();

    BerryPulseApp.showToast(`Added ${base.name} to ${this.currentMealTarget}! 🫐`);
  },

  deleteFoodItem: function(mealKey, index) {
    const dayData = BerryPulseStorage.getActiveDayData();
    if (dayData.nutrition.meals[mealKey]) {
      const removed = dayData.nutrition.meals[mealKey].splice(index, 1);
      BerryPulseStorage.save();
      if (removed.length > 0) {
        BerryPulseApp.showToast(`Removed ${removed[0].name}`);
      }
    }
  },

  // Custom food addition
  switchToCustomFoodMode: function(initialName = '') {
    const customModal = document.getElementById('custom-food-modal');
    if (customModal) {
      document.getElementById('custom-food-name').value = initialName;
      document.getElementById('custom-food-cals').value = '';
      document.getElementById('custom-food-protein').value = '';
      document.getElementById('custom-food-carbs').value = '';
      document.getElementById('custom-food-fat').value = '';
      document.getElementById('custom-food-serving').value = '1 serving';
      this.closeAddModal();
      customModal.classList.remove('hidden');
      customModal.classList.add('flex');
    }
  },

  closeCustomFoodModal: function() {
    const customModal = document.getElementById('custom-food-modal');
    if (customModal) {
      customModal.classList.add('hidden');
      customModal.classList.remove('flex');
    }
  },

  saveCustomFood: function() {
    const name = document.getElementById('custom-food-name').value.trim();
    const cals = parseInt(document.getElementById('custom-food-cals').value, 10) || 0;
    const protein = parseFloat(document.getElementById('custom-food-protein').value) || 0;
    const carbs = parseFloat(document.getElementById('custom-food-carbs').value) || 0;
    const fat = parseFloat(document.getElementById('custom-food-fat').value) || 0;
    const serving = document.getElementById('custom-food-serving').value.trim() || '1 serving';

    if (!name) {
      alert('Please enter a food name');
      return;
    }

    const dayData = BerryPulseStorage.getActiveDayData();
    if (!dayData.nutrition.meals[this.currentMealTarget]) {
      dayData.nutrition.meals[this.currentMealTarget] = [];
    }

    const newItem = {
      id: `custom-${Date.now()}`,
      name: name,
      icon: '🥗',
      serving: serving,
      calories: cals,
      protein: protein,
      carbs: carbs,
      fat: fat,
      fiber: 0
    };

    dayData.nutrition.meals[this.currentMealTarget].push(newItem);
    BerryPulseStorage.save();
    this.closeCustomFoodModal();
    BerryPulseApp.showToast(`Added custom item "${name}"!`);
  },

  // Prompt to create a new custom meal section (e.g. Pre-workout)
  addCustomMealSection: function() {
    const name = prompt('Enter new meal section name (e.g., Pre-Workout Snack, Post-Workout Smoothie):');
    if (!name || !name.trim()) return;

    const key = name.trim().toLowerCase().replace(/[^a-z0-9]/g, '_');
    const dayData = BerryPulseStorage.getActiveDayData();
    if (!dayData.nutrition.meals) dayData.nutrition.meals = {};
    if (dayData.nutrition.meals[key]) {
      alert('This meal section already exists!');
      return;
    }

    dayData.nutrition.meals[key] = [];
    BerryPulseStorage.save();
    BerryPulseApp.showToast(`Added meal category "${name}"!`);
  }
};

window.BerryPulseNutrition = BerryPulseNutrition;

if (typeof module !== 'undefined') {
  module.exports = BerryPulseNutrition;
}
