/**
 * BerryPulse Wellness Tracker - Interactive Charts & Analytics Engine
 * Pure SVG & Canvas rendering engine with interactive hover tooltips (zero external dependencies required)
 */

const BerryPulseCharts = {
  currentRangeDays: 7,

  init: function () {
    this.bindEvents();
    this.renderAll();
  },

  bindEvents: function () {
    window.addEventListener('berrypulse:date-changed', () => this.renderAll());
    window.addEventListener('berrypulse:data-updated', () => this.renderAll());
    window.addEventListener('resize', () => this.renderAll());
  },

  setRange: function (days) {
    this.currentRangeDays = days;
    const btn7 = document.getElementById('chart-range-7');
    const btn14 = document.getElementById('chart-range-14');

    if (btn7) {
      if (days === 7) {
        btn7.classList.add('bg-pink-600', 'text-white');
        btn7.classList.remove('bg-berry-900/40', 'text-berry-300');
      } else {
        btn7.classList.remove('bg-pink-600', 'text-white');
        btn7.classList.add('bg-berry-900/40', 'text-berry-300');
      }
    }
    if (btn14) {
      if (days === 14) {
        btn14.classList.add('bg-pink-600', 'text-white');
        btn14.classList.remove('bg-berry-900/40', 'text-berry-300');
      } else {
        btn14.classList.remove('bg-pink-600', 'text-white');
        btn14.classList.add('bg-berry-900/40', 'text-berry-300');
      }
    }

    this.renderAll();
  },

  renderAll: function () {
    this.renderCalorieActivityChart();
    this.renderSleepTrendChart();
    this.renderMacroDonutChart();
    this.renderHydrationChart();
  },

  // 1. Calories Intake vs Burned Multi-Bar Chart
  renderCalorieActivityChart: function () {
    const container = document.getElementById('chart-calorie-activity-container');
    if (!container) return;

    const history = BerryPulseStorage.getHistoryArray(this.currentRangeDays);
    const width = container.clientWidth || 500;
    const height = 220;
    const padding = { top: 25, right: 20, bottom: 35, left: 45 };

    const chartW = width - padding.left - padding.right;
    const chartH = height - padding.top - padding.bottom;

    // Collect max values
    let maxVal = 2600;
    const series = history.map(day => {
      let consumed = 0;
      if (day.nutrition && day.nutrition.meals) {
        Object.values(day.nutrition.meals).forEach(meal => {
          meal.forEach(item => consumed += (item.calories || 0));
        });
      }
      const burned = (day.activity && day.activity.rings && day.activity.rings.move) ? day.activity.rings.move.current : 400;
      maxVal = Math.max(maxVal, consumed, burned);

      const d = new Date(day.date + 'T12:00:00');
      const dayLabel = d.toLocaleDateString([], { weekday: 'short' });
      return { date: day.date, label: dayLabel, consumed: Math.round(consumed), burned: Math.round(burned) };
    });

    const goals = (BerryPulseStorage.state && BerryPulseStorage.state.goals) || {};
    const goalCal = parseInt(goals.calories, 10) || 2200;
    maxVal = Math.max(maxVal, goalCal);
    maxVal = Math.ceil((maxVal * 1.1) / 500) * 500;

    const goalY = padding.top + chartH - ((goalCal / maxVal) * chartH);

    const barGroupWidth = chartW / series.length;
    const barWidth = Math.min(22, (barGroupWidth - 10) / 2);

    let barsSvg = '';
    series.forEach((s, idx) => {
      const groupX = padding.left + (idx * barGroupWidth) + (barGroupWidth / 2);
      const hConsumed = (s.consumed / maxVal) * chartH;
      const hBurned = (s.burned / maxVal) * chartH;

      const yConsumed = padding.top + chartH - hConsumed;
      const yBurned = padding.top + chartH - hBurned;

      const xConsumed = groupX - barWidth - 2;
      const xBurned = groupX + 2;

      barsSvg += `
        <g class="chart-group cursor-pointer group" data-tooltip="${s.label} (${s.date})&#10;Consumed: ${s.consumed} kcal&#10;Active Burn: ${s.burned} kcal">
          <!-- Consumed Bar (Pink) -->
          <rect x="${xConsumed}" y="${yConsumed}" width="${barWidth}" height="${hConsumed}" rx="4"
            fill="url(#grad-consumed)" class="hover:opacity-80 transition-all duration-300" />
          
          <!-- Burned Bar (Rose/Red) -->
          <rect x="${xBurned}" y="${yBurned}" width="${barWidth}" height="${hBurned}" rx="4"
            fill="url(#grad-burned)" class="hover:opacity-80 transition-all duration-300" />

          <!-- X-Axis Label -->
          <text x="${groupX}" y="${height - 10}" fill="#94a3b8" font-size="11" text-anchor="middle" font-weight="500">${s.label}</text>
        </g>
      `;
    });

    // Y-Axis grid lines
    let gridSvg = '';
    const steps = 4;
    for (let i = 0; i <= steps; i++) {
      const yVal = Math.round((maxVal / steps) * i);
      const yPos = padding.top + chartH - ((yVal / maxVal) * chartH);
      gridSvg += `
        <line x1="${padding.left}" y1="${yPos}" x2="${width - padding.right}" y2="${yPos}" stroke="rgba(255,255,255,0.06)" stroke-dasharray="3 3" />
        <text x="${padding.left - 8}" y="${yPos + 4}" fill="#64748b" font-size="10" text-anchor="end">${yVal}</text>
      `;
    }

    container.innerHTML = `
      <svg width="100%" height="${height}" viewBox="0 0 ${width} ${height}" class="overflow-visible">
        <defs>
          <linearGradient id="grad-consumed" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stop-color="#ec4899" />
            <stop offset="100%" stop-color="#be185d" />
          </linearGradient>
          <linearGradient id="grad-burned" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stop-color="#f43f5e" />
            <stop offset="100%" stop-color="#9f1239" />
          </linearGradient>
        </defs>
        ${gridSvg}
        <!-- Calorie Target Line -->
        <line x1="${padding.left}" y1="${goalY}" x2="${width - padding.right}" y2="${goalY}" stroke="#ec4899" stroke-dasharray="3 3" stroke-opacity="0.6" />
        <text x="${width - padding.right - 2}" y="${goalY - 4}" fill="#ec4899" font-size="9" text-anchor="end">Target (${goalCal.toLocaleString()} kcal)</text>
        ${barsSvg}
      </svg>
    `;

    this.attachSvgTooltips(container);
  },

  // 2. Sleep Duration Trend Chart with Target Line
  renderSleepTrendChart: function () {
    const container = document.getElementById('chart-sleep-trend-container');
    if (!container) return;

    const history = BerryPulseStorage.getHistoryArray(this.currentRangeDays);
    const width = container.clientWidth || 400;
    const height = 180;
    const padding = { top: 20, right: 20, bottom: 30, left: 35 };

    const chartW = width - padding.left - padding.right;
    const chartH = height - padding.top - padding.bottom;
    const goals = (BerryPulseStorage.state && BerryPulseStorage.state.goals) || {};
    const targetHours = (typeof goals.sleepHours === 'number') ? goals.sleepHours : 8.0;
    const maxVal = Math.max(10.0, targetHours + 2);

    let points = [];
    let barsSvg = '';

    history.forEach((day, idx) => {
      const dur = (day.sleep && typeof day.sleep.durationHours === 'number') ? day.sleep.durationHours : 0;
      const d = new Date(day.date + 'T12:00:00');
      const label = d.toLocaleDateString([], { weekday: 'narrow' });

      const x = padding.left + (idx * (chartW / (history.length - 1 || 1)));
      const y = padding.top + chartH - ((dur / maxVal) * chartH);

      points.push({ x, y, dur, label, quality: (day.sleep && day.sleep.quality) || 'No data', date: day.date });
    });

    // Generate smooth SVG curve path
    let pathD = '';
    points.forEach((p, i) => {
      if (i === 0) pathD += `M ${p.x} ${p.y}`;
      else {
        const prev = points[i - 1];
        const cpX1 = prev.x + (p.x - prev.x) / 2;
        const cpX2 = cpX1;
        pathD += ` C ${cpX1} ${prev.y}, ${cpX2} ${p.y}, ${p.x} ${p.y}`;
      }
    });

    // Target sleep line
    const targetY = padding.top + chartH - ((targetHours / maxVal) * chartH);

    let dotsSvg = '';
    points.forEach(p => {
      dotsSvg += `
        <g class="chart-group cursor-pointer group" data-tooltip="${p.label} (${p.date})&#10;Sleep: ${p.dur} hrs&#10;Quality: ${p.quality}">
          <circle cx="${p.x}" cy="${p.y}" r="4.5" fill="#a855f7" stroke="#3b0764" stroke-width="2" class="hover:scale-125 transition-transform" />
          <text x="${p.x}" y="${height - 8}" fill="#94a3b8" font-size="10" text-anchor="middle">${p.label}</text>
        </g>
      `;
    });

    container.innerHTML = `
      <svg width="100%" height="${height}" viewBox="0 0 ${width} ${height}">
        <defs>
          <linearGradient id="sleep-line-grad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stop-color="#c084fc" />
            <stop offset="100%" stop-color="#818cf8" />
          </linearGradient>
        </defs>

        <!-- Goal Line -->
        <line x1="${padding.left}" y1="${targetY}" x2="${width - padding.right}" y2="${targetY}" stroke="#10b981" stroke-dasharray="4 4" stroke-opacity="0.6" />
        <text x="${width - padding.right - 2}" y="${targetY - 5}" fill="#10b981" font-size="9" text-anchor="end">Goal (${targetHours}h)</text>

        <!-- Trend Line -->
        <path d="${pathD}" fill="none" stroke="url(#sleep-line-grad)" stroke-width="3" stroke-linecap="round" />
        ${dotsSvg}
      </svg>
    `;

    this.attachSvgTooltips(container);
  },

  // 3. Macronutrient Donut Chart
  renderMacroDonutChart: function () {
    const container = document.getElementById('chart-macro-donut-container');
    if (!container) return;

    const dayData = BerryPulseStorage.getActiveDayData();
    let p = 0, c = 0, f = 0, totalCal = 0;

    if (dayData.nutrition && dayData.nutrition.meals) {
      Object.values(dayData.nutrition.meals).forEach(meal => {
        meal.forEach(item => {
          p += (item.protein || 0);
          c += (item.carbs || 0);
          f += (item.fat || 0);
          totalCal += (item.calories || 0);
        });
      });
    }

    // Convert to calories: protein 4kcal/g, carbs 4kcal/g, fat 9kcal/g
    const calP = p * 4;
    const calC = c * 4;
    const calF = f * 9;
    const totalMacroCal = calP + calC + calF || 1;

    const pctP = Math.round((calP / totalMacroCal) * 100);
    const pctC = Math.round((calC / totalMacroCal) * 100);
    const pctF = 100 - pctP - pctC;

    const r = 48;
    const circ = 2 * Math.PI * r; // ~301.59

    const offsetP = circ * (1 - (pctP / 100));
    const strokeP = circ * (pctP / 100);

    const strokeC = circ * (pctC / 100);
    const strokeF = circ * (pctF / 100);

    const rotP = -90;
    const rotC = rotP + (pctP * 3.6);
    const rotF = rotC + (pctC * 3.6);

    container.innerHTML = `
      <div class="flex items-center justify-center gap-6">
        <div class="relative w-36 h-36 flex items-center justify-center">
          <svg viewBox="0 0 120 120" class="w-full h-full transform -rotate-90">
            <!-- Background circle -->
            <circle cx="60" cy="60" r="${r}" stroke="rgba(255,255,255,0.06)" stroke-width="14" fill="none" />

            <!-- Protein Arc (Rose) -->
            <circle cx="60" cy="60" r="${r}" stroke="#f43f5e" stroke-width="14" fill="none"
              stroke-dasharray="${strokeP} ${circ}" stroke-dashoffset="0"
              class="transition-all duration-700" />

            <!-- Carbs Arc (Amber) -->
            <circle cx="60" cy="60" r="${r}" stroke="#f59e0b" stroke-width="14" fill="none"
              stroke-dasharray="${strokeC} ${circ}" stroke-dashoffset="${-strokeP}"
              class="transition-all duration-700" />

            <!-- Fat Arc (Cyan) -->
            <circle cx="60" cy="60" r="${r}" stroke="#06b6d4" stroke-width="14" fill="none"
              stroke-dasharray="${strokeF} ${circ}" stroke-dashoffset="${-(strokeP + strokeC)}"
              class="transition-all duration-700" />
          </svg>
          <div class="absolute text-center">
            <span class="text-xs text-berry-300 block">Total</span>
            <span class="text-lg font-bold text-white block leading-tight">${Math.round(totalCal)}</span>
            <span class="text-[10px] text-pink-400 block font-semibold">kcal</span>
          </div>
        </div>

        <div class="space-y-2 text-xs">
          <div class="flex items-center gap-2">
            <span class="w-3 h-3 rounded-full bg-rose-500"></span>
            <span class="text-berry-200">Protein:</span>
            <span class="font-bold text-white">${Math.round(p)}g (${pctP}%)</span>
          </div>
          <div class="flex items-center gap-2">
            <span class="w-3 h-3 rounded-full bg-amber-500"></span>
            <span class="text-berry-200">Carbs:</span>
            <span class="font-bold text-white">${Math.round(c)}g (${pctC}%)</span>
          </div>
          <div class="flex items-center gap-2">
            <span class="w-3 h-3 rounded-full bg-cyan-500"></span>
            <span class="text-berry-200">Fats:</span>
            <span class="font-bold text-white">${Math.round(f)}g (${pctF}%)</span>
          </div>
        </div>
      </div>
    `;
  },

  // 4. Hydration 7-Day Bar Chart
  renderHydrationChart: function () {
    const container = document.getElementById('chart-hydration-container');
    if (!container) return;

    const history = BerryPulseStorage.getHistoryArray(this.currentRangeDays);
    const width = container.clientWidth || 400;
    const height = 180;
    const padding = { top: 20, right: 20, bottom: 30, left: 40 };

    const chartW = width - padding.left - padding.right;
    const chartH = height - padding.top - padding.bottom;
    const goals = (BerryPulseStorage.state && BerryPulseStorage.state.goals) || {};
    const goalOz = goals.waterOz || 96;
    const maxVal = Math.max(Math.round(goalOz * 1.35), 120);

    const barW = Math.min(26, (chartW / history.length) - 8);

    let bars = '';
    history.forEach((day, idx) => {
      let oz = 0;
      if (day.water) {
        if (typeof day.water.intakeOz === 'number') oz = day.water.intakeOz;
        else if (typeof day.water.intakeMl === 'number') oz = Math.round(day.water.intakeMl / 29.5735);
      }
      const h = (oz / maxVal) * chartH;
      const x = padding.left + (idx * (chartW / history.length)) + 4;
      const y = padding.top + chartH - h;

      const d = new Date(day.date + 'T12:00:00');
      const label = d.toLocaleDateString([], { weekday: 'narrow' });

      bars += `
        <g class="chart-group cursor-pointer group" data-tooltip="${d.toLocaleDateString([], { weekday: 'short' })}: ${oz} oz">
          <rect x="${x}" y="${y}" width="${barW}" height="${h}" rx="5" fill="url(#water-chart-grad)"
            class="hover:opacity-80 transition-all duration-300" />
          <text x="${x + (barW / 2)}" y="${height - 8}" fill="#94a3b8" font-size="10" text-anchor="middle">${label}</text>
        </g>
      `;
    });

    const goalY = padding.top + chartH - ((goalOz / maxVal) * chartH);

    container.innerHTML = `
      <svg width="100%" height="${height}" viewBox="0 0 ${width} ${height}">
        <defs>
          <linearGradient id="water-chart-grad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stop-color="#38bdf8" />
            <stop offset="100%" stop-color="#0284c7" />
          </linearGradient>
        </defs>

        <!-- Goal line -->
        <line x1="${padding.left}" y1="${goalY}" x2="${width - padding.right}" y2="${goalY}" stroke="#38bdf8" stroke-dasharray="3 3" stroke-opacity="0.5" />
        <text x="${width - padding.right - 2}" y="${goalY - 4}" fill="#38bdf8" font-size="9" text-anchor="end">${goalOz} oz Goal</text>

        ${bars}
      </svg>
    `;

    this.attachSvgTooltips(container);
  },

  // Interactive Hover Tooltip handler
  attachSvgTooltips: function (container) {
    const tooltip = document.getElementById('chart-global-tooltip');
    if (!tooltip) return;

    const groups = container.querySelectorAll('.chart-group');
    groups.forEach(g => {
      g.addEventListener('mouseenter', (e) => {
        const text = g.getAttribute('data-tooltip');
        if (!text) return;
        tooltip.innerHTML = text.replace(/\n/g, '<br/>');
        tooltip.classList.remove('hidden');
      });

      g.addEventListener('mousemove', (e) => {
        tooltip.style.left = `${e.clientX + 14}px`;
        tooltip.style.top = `${e.clientY - 30}px`;
      });

      g.addEventListener('mouseleave', () => {
        tooltip.classList.add('hidden');
      });
    });
  }
};

if (typeof module !== 'undefined') {
  module.exports = BerryPulseCharts;
}
