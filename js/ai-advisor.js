/**
 * BerryPulse Wellness Tracker - AI Health & Target Advisor
 * Personalized clinical & AI-powered recommendations for Calories, Protein, Macros,
 * Hydration (fl oz), Sleep, and Exercise based on age, weight, height, sex, and weight loss goals.
 */

const BerryPulseAIAdvisor = {
  STORAGE_KEY_PROFILE: 'berrypulse_user_profile',
  currentRecommendations: null,

  // Default baseline profile
  defaultProfile: {
    age: 28,
    gender: 'female',
    weight: 155,
    weightUnit: 'lbs', // 'lbs' or 'kg'
    heightFt: 5,
    heightIn: 7,
    heightCm: 170,
    heightUnit: 'ft', // 'ft' or 'cm'
    goal: 'lose_weight', // 'lose_weight', 'lose_weight_fast', 'maintain', 'build_muscle'
    activityLevel: 'moderate' // 'sedentary', 'light', 'moderate', 'very_active'
  },

  init: function () {
    this.bindEvents();
  },

  bindEvents: function () {
    // Listen for custom trigger events
    window.addEventListener('berrypulse:open-ai-advisor', () => this.openModal());
  },

  getProfileKey: function () {
    const userId = (window.BerryPulseAuth && BerryPulseAuth.getCurrentUserId()) || 'usr_courtney';
    return `${this.STORAGE_KEY_PROFILE}_${userId}`;
  },

  getProfile: function () {
    try {
      const key = this.getProfileKey();
      const saved = localStorage.getItem(key) || localStorage.getItem(this.STORAGE_KEY_PROFILE);
      if (saved) {
        return Object.assign({}, this.defaultProfile, JSON.parse(saved));
      }
    } catch (e) {
      console.warn('Failed to load user profile from storage', e);
    }
    return Object.assign({}, this.defaultProfile);
  },

  saveProfile: function (profile) {
    try {
      const key = this.getProfileKey();
      localStorage.setItem(key, JSON.stringify(profile));
      if (!window.BerryPulseStorage || !BerryPulseStorage.state) {
        if (window.BerryPulseStorage && BerryPulseStorage.init) BerryPulseStorage.init();
      }
      if (window.BerryPulseStorage && BerryPulseStorage.state) {
        if (!BerryPulseStorage.state.userProfile) BerryPulseStorage.state.userProfile = {};
        Object.assign(BerryPulseStorage.state.userProfile, profile);
        BerryPulseStorage.save();
      }
    } catch (e) {
      console.warn('Failed to save user profile', e);
    }
  },

  openModal: function () {
    const modal = document.getElementById('ai-advisor-modal');
    if (!modal) return;

    this.populateFormFromProfile();
    modal.classList.remove('hidden');
    modal.classList.add('flex');
    modal.style.display = 'flex';

    // Run initial calculation with current inputs
    this.generateRecommendations();
  },

  closeModal: function () {
    const modal = document.getElementById('ai-advisor-modal');
    if (modal) {
      modal.classList.add('hidden');
      modal.classList.remove('flex');
      modal.style.display = 'none';
    }
  },

  populateFormFromProfile: function () {
    const p = this.getProfile();

    const ageInput = document.getElementById('ai-input-age');
    const weightInput = document.getElementById('ai-input-weight');
    const heightFtInput = document.getElementById('ai-input-height-ft');
    const heightInInput = document.getElementById('ai-input-height-in');
    const heightCmInput = document.getElementById('ai-input-height-cm');
    const goalSelect = document.getElementById('ai-select-goal');
    const activitySelect = document.getElementById('ai-select-activity');

    if (ageInput) ageInput.value = p.age || 28;
    if (weightInput) weightInput.value = p.weight || 155;
    if (heightFtInput) heightFtInput.value = p.heightFt || 5;
    if (heightInInput) heightInInput.value = p.heightIn || 7;
    if (heightCmInput) heightCmInput.value = p.heightCm || 170;
    if (goalSelect) goalSelect.value = p.goal || 'lose_weight';
    if (activitySelect) activitySelect.value = p.activityLevel || 'moderate';

    this.setGender(p.gender || 'female');
    this.setWeightUnit(p.weightUnit || 'lbs');
    this.setHeightUnit(p.heightUnit || 'ft');
  },

  currentGender: 'female',
  currentWeightUnit: 'lbs',
  currentHeightUnit: 'ft',

  setGender: function (gender) {
    this.currentGender = gender;
    const btnFemale = document.getElementById('ai-gender-female-btn');
    const btnMale = document.getElementById('ai-gender-male-btn');

    if (btnFemale && btnMale) {
      if (gender === 'female') {
        btnFemale.className = 'flex-1 py-2 rounded-xl text-xs font-bold bg-pink-600 text-white shadow-md transition border border-pink-500/50';
        btnMale.className = 'flex-1 py-2 rounded-xl text-xs font-semibold bg-berry-900/60 text-berry-300 hover:text-white transition border border-berry-700/40';
      } else {
        btnMale.className = 'flex-1 py-2 rounded-xl text-xs font-bold bg-pink-600 text-white shadow-md transition border border-pink-500/50';
        btnFemale.className = 'flex-1 py-2 rounded-xl text-xs font-semibold bg-berry-900/60 text-berry-300 hover:text-white transition border border-berry-700/40';
      }
    }
  },

  setWeightUnit: function (unit) {
    this.currentWeightUnit = unit;
    const btnLbs = document.getElementById('ai-weight-unit-lbs');
    const btnKg = document.getElementById('ai-weight-unit-kg');
    const label = document.getElementById('ai-weight-unit-label');

    if (btnLbs && btnKg) {
      if (unit === 'lbs') {
        btnLbs.className = 'px-2.5 py-1 text-xs font-bold rounded-lg bg-pink-600 text-white transition';
        btnKg.className = 'px-2.5 py-1 text-xs font-medium rounded-lg text-berry-300 hover:text-white transition';
        if (label) label.textContent = 'lbs';
      } else {
        btnKg.className = 'px-2.5 py-1 text-xs font-bold rounded-lg bg-pink-600 text-white transition';
        btnLbs.className = 'px-2.5 py-1 text-xs font-medium rounded-lg text-berry-300 hover:text-white transition';
        if (label) label.textContent = 'kg';
      }
    }
  },

  setHeightUnit: function (unit) {
    this.currentHeightUnit = unit;
    const btnFt = document.getElementById('ai-height-unit-ft');
    const btnCm = document.getElementById('ai-height-unit-cm');
    const panelFt = document.getElementById('ai-height-ft-panel');
    const panelCm = document.getElementById('ai-height-cm-panel');

    if (btnFt && btnCm && panelFt && panelCm) {
      if (unit === 'ft') {
        btnFt.className = 'px-2.5 py-1 text-xs font-bold rounded-lg bg-pink-600 text-white transition';
        btnCm.className = 'px-2.5 py-1 text-xs font-medium rounded-lg text-berry-300 hover:text-white transition';
        panelFt.classList.remove('hidden');
        panelCm.classList.add('hidden');
      } else {
        btnCm.className = 'px-2.5 py-1 text-xs font-bold rounded-lg bg-pink-600 text-white transition';
        btnFt.className = 'px-2.5 py-1 text-xs font-medium rounded-lg text-berry-300 hover:text-white transition';
        panelFt.classList.add('hidden');
        panelCm.classList.remove('hidden');
      }
    }
  },

  /**
   * Scientific Clinical Calculation Engine (Mifflin-St Jeor + ACSM + Sports Nutrition Guidelines)
   */
  calculateRecommendations: function (profile) {
    const age = Math.max(15, Math.min(100, parseInt(profile.age, 10) || 28));
    const isMale = (profile.gender === 'male');

    // 1. Convert weight to kg and lbs
    let weightLbs = parseFloat(profile.weight) || 155;
    let weightKg = weightLbs;
    if (profile.weightUnit === 'kg') {
      weightKg = parseFloat(profile.weight) || 70;
      weightLbs = weightKg * 2.20462;
    } else {
      weightKg = weightLbs * 0.45359237;
    }

    // 2. Convert height to cm
    let heightCm = 170;
    if (profile.heightUnit === 'cm') {
      heightCm = parseFloat(profile.heightCm) || 170;
    } else {
      const ft = parseInt(profile.heightFt, 10) || 5;
      const inch = parseInt(profile.heightIn, 10) || 7;
      heightCm = (ft * 12 + inch) * 2.54;
    }

    // 3. Mifflin-St Jeor Basal Metabolic Rate (BMR)
    let bmr = (10 * weightKg) + (6.25 * heightCm) - (5 * age);
    bmr += isMale ? 5 : -161;
    bmr = Math.round(bmr);

    // 4. Physical Activity Multiplier -> Total Daily Energy Expenditure (TDEE)
    const activityMultipliers = {
      sedentary: 1.2,
      light: 1.375,
      moderate: 1.55,
      very_active: 1.725
    };
    const actMult = activityMultipliers[profile.activityLevel] || 1.55;
    const tdee = Math.round(bmr * actMult);

    // 5. Target Calories based on Goal (Lose Weight vs Maintain vs Build Muscle)
    let calorieDelta = 0;
    let goalDescription = '';
    let goalPill = '';

    switch (profile.goal) {
      case 'lose_weight_fast':
        calorieDelta = -700; // ~1.4 lbs/week
        goalDescription = 'Aggressive Fat Loss (700 kcal deficit)';
        goalPill = '⚡ Rapid Deficit';
        break;
      case 'lose_weight':
        calorieDelta = -450; // ~0.9 - 1.0 lb/week sustainable fat loss
        goalDescription = 'Sustainable Fat Loss (450 kcal deficit)';
        goalPill = '📉 Fat Loss';
        break;
      case 'build_muscle':
        calorieDelta = 300; // Lean muscle surplus
        goalDescription = 'Lean Muscle Hypertrophy (+300 kcal surplus)';
        goalPill = '💪 Lean Bulk';
        break;
      case 'maintain':
      default:
        calorieDelta = 0;
        goalDescription = 'Body Recomposition & Weight Maintenance';
        goalPill = '⚖️ Maintenance';
        break;
    }

    let targetCalories = tdee + calorieDelta;
    // Clinical safe floors: 1200 kcal female, 1500 kcal male
    const minCaloriesFloor = isMale ? 1500 : 1200;
    if (targetCalories < minCaloriesFloor) {
      targetCalories = minCaloriesFloor;
    }

    // 6. Protein Target (g)
    // Sparing lean mass during deficit requires higher protein per lb
    let proteinPerLb = 0.85;
    if (profile.goal === 'lose_weight' || profile.goal === 'lose_weight_fast') {
      proteinPerLb = 1.0; // 1.0 g per lb during caloric deficit
    } else if (profile.goal === 'build_muscle') {
      proteinPerLb = 1.05; // 1.05 g per lb for muscle protein synthesis
    } else {
      proteinPerLb = 0.85; // 0.85 g per lb for maintenance
    }
    const proteinGrams = Math.round(weightLbs * proteinPerLb);

    // 7. Healthy Fats (g) -> 26-28% of total calories (9 kcal/g)
    const fatPct = 0.27;
    const fatCalories = targetCalories * fatPct;
    const fatGrams = Math.max(40, Math.round(fatCalories / 9));

    // 8. Carbohydrates (g) -> Remaining calories (4 kcal/g)
    const proteinCalories = proteinGrams * 4;
    const remainingCaloriesForCarbs = Math.max(80, targetCalories - proteinCalories - (fatGrams * 9));
    const carbsGrams = Math.round(remainingCaloriesForCarbs / 4);

    // 9. Dietary Fiber (g) -> 14g per 1,000 kcal
    const fiberGrams = Math.round((targetCalories / 1000) * 14);

    // 10. Hydration Target in Fluid Ounces (fl oz)
    // Baseline: Body weight in lbs * 0.55 fl oz + activity compensation + deficit metabolic flush
    let waterOz = Math.round(weightLbs * 0.55);
    if (profile.activityLevel === 'sedentary') waterOz += 8;
    else if (profile.activityLevel === 'light') waterOz += 16;
    else if (profile.activityLevel === 'moderate') waterOz += 24;
    else if (profile.activityLevel === 'very_active') waterOz += 32;

    if (profile.goal.includes('lose_weight')) {
      waterOz += 10; // Extra water to flush metabolic byproducts of lipolysis and curb false hunger
    }
    // Round to clean 4-oz increment
    waterOz = Math.round(waterOz / 4) * 4;
    if (waterOz < 64) waterOz = 64; // Minimum 0.5 gallon

    // 11. Sleep Target (Hours)
    let sleepHours = 8.0;
    if (profile.goal.includes('lose_weight') || profile.activityLevel === 'very_active') {
      sleepHours = 8.5; // Essential for regulating ghrelin & leptin and protecting metabolic rate
    } else if (profile.goal === 'build_muscle') {
      sleepHours = 8.5; // Growth hormone release peaks during deep sleep
    }

    // 12. Exercise & Movement Targets
    let activeCalories = 500; // Move Ring
    let exerciseMins = 30;
    let steps = 10000;

    switch (profile.activityLevel) {
      case 'sedentary':
        activeCalories = 400;
        exerciseMins = 30;
        steps = 8000;
        break;
      case 'light':
        activeCalories = 500;
        exerciseMins = 30;
        steps = 9500;
        break;
      case 'moderate':
        activeCalories = 620;
        exerciseMins = 45;
        steps = 11000;
        break;
      case 'very_active':
        activeCalories = 780;
        exerciseMins = 60;
        steps = 13500;
        break;
    }

    if (profile.goal.includes('lose_weight')) {
      activeCalories += 50; // Slight boost to move ring to assist deficit
    }

    // 13. Personalized Coach Rationale & Insights
    const coachInsights = this.generateCoachInsights({
      profile,
      bmr,
      tdee,
      targetCalories,
      calorieDelta,
      proteinGrams,
      proteinPerLb,
      carbsGrams,
      fatGrams,
      fiberGrams,
      waterOz,
      sleepHours,
      activeCalories,
      exerciseMins,
      steps,
      weightLbs: Math.round(weightLbs)
    });

    return {
      profile,
      bmr,
      tdee,
      calories: targetCalories,
      calorieDelta,
      goalDescription,
      goalPill,
      protein: proteinGrams,
      proteinPerLb: proteinPerLb.toFixed(2),
      carbs: carbsGrams,
      fat: fatGrams,
      fiber: fiberGrams,
      waterOz: waterOz,
      sleepHours: sleepHours,
      activeCalories: activeCalories,
      exerciseMins: exerciseMins,
      steps: steps,
      coachInsights
    };
  },

  generateCoachInsights: function (data) {
    const { profile, bmr, tdee, targetCalories, calorieDelta, proteinGrams, proteinPerLb, waterOz, sleepHours, activeCalories, weightLbs } = data;
    const isWeightLoss = profile.goal.includes('lose_weight');

    let nutritionNote = '';
    if (isWeightLoss) {
      nutritionNote = `With your BMR at **${bmr.toLocaleString()} kcal** and maintenance TDEE at **${tdee.toLocaleString()} kcal**, your **${targetCalories.toLocaleString()} kcal target** creates a precise ${Math.abs(calorieDelta)} kcal deficit. We dialed your protein to **${proteinGrams}g (${proteinPerLb}g/lb of body weight)**: when in a caloric deficit, high protein is clinically proven to protect against muscle catabolism, boost the thermic effect of food (TEF), and keep you satiated.`;
    } else if (profile.goal === 'build_muscle') {
      nutritionNote = `With a maintenance TDEE of **${tdee.toLocaleString()} kcal**, your **${targetCalories.toLocaleString()} kcal target** provides a controlled lean bulk surplus (+${calorieDelta} kcal). At **${proteinGrams}g protein**, your muscles have optimal amino acid availability for post-workout protein synthesis without excessive fat storage.`;
    } else {
      nutritionNote = `Your **${targetCalories.toLocaleString()} kcal target** perfectly balances your daily energy expenditure (${tdee.toLocaleString()} kcal). Setting protein at **${proteinGrams}g** maintains lean muscle density, promotes healthy blood glucose stability, and sustains all-day cognitive focus.`;
    }

    const waterNote = `Aim for **${waterOz} fl oz** (~${(waterOz / 16.9).toFixed(1)} standard bottles). Hydration is critical for lipolysis (cellular fat breakdown), kidney filtration, and preventing false hunger cues that often mimic thirst.`;

    const sleepNote = `Prioritize **${sleepHours} hours** of restorative sleep. Caloric restriction and active training elevate cortisol; sleeping at least 8+ hours optimizes human growth hormone (HGH) release and balances hunger hormones ghrelin and leptin.`;

    const workoutNote = `Aim to close your Apple Move ring at **${activeCalories} kcal** with **${data.exerciseMins} mins** of dedicated movement and **${data.steps.toLocaleString()} steps**. We recommend a weekly split of 3-4 days of resistance training with 2 days of Zone 2 cardio (brisk incline walking or cycling) for cardiovascular longevity.`;

    return {
      nutritionNote,
      waterNote,
      sleepNote,
      workoutNote
    };
  },

  /**
   * Reads the current inputs from the modal form and re-computes recommendations
   */
  generateRecommendations: function () {
    const ageInput = document.getElementById('ai-input-age');
    const weightInput = document.getElementById('ai-input-weight');
    const heightFtInput = document.getElementById('ai-input-height-ft');
    const heightInInput = document.getElementById('ai-input-height-in');
    const heightCmInput = document.getElementById('ai-input-height-cm');
    const goalSelect = document.getElementById('ai-select-goal');
    const activitySelect = document.getElementById('ai-select-activity');

    const age = (ageInput ? parseInt(ageInput.value, 10) : 0) || 28;
    const weight = (weightInput ? parseFloat(weightInput.value) : 0) || 155;
    const heightFt = (heightFtInput ? parseInt(heightFtInput.value, 10) : 0) || 5;
    const heightIn = (heightInInput ? parseInt(heightInInput.value, 10) : 0) || 7;
    const heightCm = (heightCmInput ? parseFloat(heightCmInput.value) : 0) || 170;
    const goal = (goalSelect ? goalSelect.value : '') || 'lose_weight';
    const activityLevel = (activitySelect ? activitySelect.value : '') || 'moderate';

    const profile = {
      age,
      gender: this.currentGender,
      weight,
      weightUnit: this.currentWeightUnit,
      heightFt,
      heightIn,
      heightCm,
      heightUnit: this.currentHeightUnit,
      goal,
      activityLevel
    };

    const recs = this.calculateRecommendations(profile);
    this.currentRecommendations = recs;
    this.renderRecommendationsUI(recs);

    // Save profile to local storage for permanence
    this.saveProfile(profile);

    // If Gemini API key is configured, optionally enrich with live Gemini generative commentary
    if (window.BerryPulseAI && BerryPulseAI.getApiKey()) {
      this.enrichWithGemini(recs);
    }
  },

  renderRecommendationsUI: function (recs) {
    const resultsContainer = document.getElementById('ai-advisor-results');
    if (!resultsContainer) return;

    // Display metric numbers
    const calsEl = document.getElementById('rec-calories-val');
    const proteinEl = document.getElementById('rec-protein-val');
    const carbsEl = document.getElementById('rec-carbs-val');
    const fatEl = document.getElementById('rec-fat-val');
    const fiberEl = document.getElementById('rec-fiber-val');
    const waterEl = document.getElementById('rec-water-val');
    const sleepEl = document.getElementById('rec-sleep-val');
    const moveEl = document.getElementById('rec-move-val');
    const exerciseEl = document.getElementById('rec-exercise-val');
    const stepsEl = document.getElementById('rec-steps-val');

    if (calsEl) calsEl.textContent = recs.calories.toLocaleString();
    if (proteinEl) proteinEl.textContent = `${recs.protein}g`;
    if (carbsEl) carbsEl.textContent = `${recs.carbs}g`;
    if (fatEl) fatEl.textContent = `${recs.fat}g`;
    if (fiberEl) fiberEl.textContent = `${recs.fiber}g`;
    if (waterEl) waterEl.textContent = `${recs.waterOz} oz`;
    if (sleepEl) sleepEl.textContent = `${recs.sleepHours} hrs`;
    if (moveEl) moveEl.textContent = `${recs.activeCalories} kcal`;
    if (exerciseEl) exerciseEl.textContent = `${recs.exerciseMins} min`;
    if (stepsEl) stepsEl.textContent = `${recs.steps.toLocaleString()}`;

    // Update goal pill and TDEE badge
    const badgeEl = document.getElementById('rec-goal-badge');
    if (badgeEl) {
      badgeEl.textContent = recs.goalPill;
    }

    const tdeeEl = document.getElementById('rec-tdee-info');
    if (tdeeEl) {
      tdeeEl.innerHTML = `BMR: <span class="text-white font-semibold">${recs.bmr.toLocaleString()}</span> kcal • Maintenance TDEE: <span class="text-white font-semibold">${recs.tdee.toLocaleString()}</span> kcal`;
    }

    // Macro percentages
    const macroBarP = document.getElementById('rec-macro-bar-protein');
    const macroBarC = document.getElementById('rec-macro-bar-carbs');
    const macroBarF = document.getElementById('rec-macro-bar-fat');
    const totalMacroCal = (recs.protein * 4) + (recs.carbs * 4) + (recs.fat * 9);
    const pctP = Math.round(((recs.protein * 4) / totalMacroCal) * 100);
    const pctC = Math.round(((recs.carbs * 4) / totalMacroCal) * 100);
    const pctF = 100 - pctP - pctC;

    if (macroBarP) macroBarP.style.width = `${pctP}%`;
    if (macroBarC) macroBarC.style.width = `${pctC}%`;
    if (macroBarF) macroBarF.style.width = `${pctF}%`;

    const macroLabelP = document.getElementById('rec-macro-label-protein');
    const macroLabelC = document.getElementById('rec-macro-label-carbs');
    const macroLabelF = document.getElementById('rec-macro-label-fat');
    if (macroLabelP) macroLabelP.textContent = `${pctP}%`;
    if (macroLabelC) macroLabelC.textContent = `${pctC}%`;
    if (macroLabelF) macroLabelF.textContent = `${pctF}%`;

    // Coach insights
    const insightNutrition = document.getElementById('ai-insight-nutrition');
    const insightWater = document.getElementById('ai-insight-water');
    const insightSleep = document.getElementById('ai-insight-sleep');
    const insightWorkout = document.getElementById('ai-insight-workout');

    if (insightNutrition) insightNutrition.innerHTML = this.markdownToHtml(recs.coachInsights.nutritionNote);
    if (insightWater) insightWater.innerHTML = this.markdownToHtml(recs.coachInsights.waterNote);
    if (insightSleep) insightSleep.innerHTML = this.markdownToHtml(recs.coachInsights.sleepNote);
    if (insightWorkout) insightWorkout.innerHTML = this.markdownToHtml(recs.coachInsights.workoutNote);

    resultsContainer.classList.remove('hidden');
  },

  markdownToHtml: function (text) {
    if (!text) return '';
    return text
      .replace(/\*\*(.*?)\*\*/g, '<strong class="text-white font-bold">$1</strong>')
      .replace(/\*(.*?)\*/g, '<em class="text-pink-300">$1</em>');
  },

  /**
   * Applies the calculated recommendations directly to active BerryPulse goals
   */
  applyRecommendationsToGoals: function () {
    if (!this.currentRecommendations) {
      this.generateRecommendations();
    }
    const recs = this.currentRecommendations;
    if (!recs) return;

    if (!window.BerryPulseStorage || !BerryPulseStorage.state) {
      if (window.BerryPulseStorage && BerryPulseStorage.init) BerryPulseStorage.init();
    }
    if (!window.BerryPulseStorage || !BerryPulseStorage.state) return;

    if (!BerryPulseStorage.state.goals) {
      BerryPulseStorage.state.goals = {};
    }

    const goals = BerryPulseStorage.state.goals;
    goals.calories = recs.calories;
    goals.proteinGrams = recs.protein;
    goals.carbsGrams = recs.carbs;
    goals.fatGrams = recs.fat;
    goals.fiberGrams = recs.fiber;
    goals.waterOz = recs.waterOz;
    goals.waterMl = Math.round(recs.waterOz * 29.5735);
    goals.sleepHours = recs.sleepHours;
    goals.activeCalories = recs.activeCalories;
    goals.exerciseMins = recs.exerciseMins;
    goals.steps = recs.steps;

    // Synchronize to current active day record
    const dayData = BerryPulseStorage.getActiveDayData ? BerryPulseStorage.getActiveDayData() : null;
    if (dayData) {
      if (dayData.nutrition) dayData.nutrition.dailyGoalCalories = goals.calories;
      if (dayData.water) {
        dayData.water.goalOz = goals.waterOz;
        dayData.water.goalMl = goals.waterMl;
      }
      if (dayData.activity && dayData.activity.rings) {
        if (dayData.activity.rings.move) dayData.activity.rings.move.goal = goals.activeCalories;
        if (dayData.activity.rings.exercise) dayData.activity.rings.exercise.goal = goals.exerciseMins;
      }
    }

    // Save changes
    BerryPulseStorage.save();

    // Re-render all views immediately
    if (window.BerryPulseNutrition) BerryPulseNutrition.render();
    if (window.BerryPulseWater) BerryPulseWater.render();
    if (window.BerryPulseAppleWatch) BerryPulseAppleWatch.render();
    if (window.BerryPulseSleep) BerryPulseSleep.render();
    if (window.BerryPulseMindfulness) BerryPulseMindfulness.render();
    if (window.BerryPulseCharts) BerryPulseCharts.renderAll();

    // Close modal
    this.closeModal();

    if (window.BerryPulseApp && BerryPulseApp.showToast) {
      BerryPulseApp.showToast(`✨ AI Targets Applied! ${recs.calories} kcal • ${recs.protein}g Protein • ${recs.waterOz} oz Water`);
    }
  },

  /**
   * Optional Gemini API enrichment if API key is stored
   */
  enrichWithGemini: async function (recs) {
    if (!window.BerryPulseAI || typeof BerryPulseAI.getApiKey !== 'function') return;
    const key = BerryPulseAI.getApiKey();
    if (!key) return;

    const banner = document.getElementById('ai-gemini-live-badge');
    if (banner) {
      banner.textContent = '✨ Gemini AI Connected & Analyzing...';
      banner.className = 'text-[11px] text-pink-400 font-semibold flex items-center gap-1.5 animate-pulse';
    }

    try {
      const prompt = `As an elite clinical sports dietitian and wellness coach, provide 2 short, impactful bullet points of personalized advice for someone with:
Age: ${recs.profile.age}, Sex: ${recs.profile.gender}, Weight: ${recs.profile.weight} ${recs.profile.weightUnit}, Goal: ${recs.goalDescription}.
Calculated Targets: ${recs.calories} kcal, ${recs.protein}g protein, ${recs.waterOz} fl oz water, ${recs.sleepHours} hrs sleep, ${recs.activeCalories} kcal active burn.
Keep response concise, motivating, and evidence-based.`;

      const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${key}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }]
        })
      });

      if (!res.ok) throw new Error('Gemini API call failed');
      const data = await res.json();
      const aiText = data?.candidates?.[0]?.content?.parts?.[0]?.text;

      if (aiText) {
        const geminiBox = document.getElementById('ai-gemini-extra-insights');
        if (geminiBox) {
          geminiBox.innerHTML = `
            <div class="p-3.5 rounded-2xl bg-gradient-to-r from-purple-900/40 to-pink-900/40 border border-pink-500/40 mt-3">
              <span class="text-xs font-bold text-pink-300 block mb-1">✨ Gemini AI Personalized Coaching Note</span>
              <div class="text-xs text-berry-200/90 leading-relaxed">${this.markdownToHtml(aiText)}</div>
            </div>
          `;
          geminiBox.classList.remove('hidden');
        }
      }

      if (banner) {
        banner.textContent = '✨ Powered by Gemini 1.5 Flash';
        banner.className = 'text-[11px] text-emerald-400 font-semibold flex items-center gap-1.5';
      }
    } catch (err) {
      console.warn('Gemini live enrichment failed, built-in clinical engine remains active', err);
      if (banner) {
        banner.textContent = '⚡ Powered by Built-In Clinical Intelligence Engine';
        banner.className = 'text-[11px] text-berry-400 font-medium flex items-center gap-1.5';
      }
    }
  }
};

// Global hook
window.BerryPulseAIAdvisor = BerryPulseAIAdvisor;

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    BerryPulseAIAdvisor.init();
  });
} else {
  BerryPulseAIAdvisor.init();
}

if (typeof module !== 'undefined') {
  module.exports = BerryPulseAIAdvisor;
}
