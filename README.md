# 🍇 BerryPulse - Modern Wellness & Health Tracker

**BerryPulse** is an all-in-one wellness dashboard designed with a luxurious berry aesthetic, intuitive glassmorphic UI, and rich features for tracking daily habits, Apple Watch physical activity, nutrition & calories with automatic database population, hydration, sleep hygiene, and guided mindfulness.

---

## 🌟 Key Features

### 1. ✨ AI Nutrition Intelligence & Calories Tracker
- **✨ Natural Language AI Food Scanner**: Enter complex descriptions (e.g. *"2 scrambled eggs with avocado and sourdough toast"*, *"Iced oat milk matcha latte with 2 pumps vanilla"*, *"Grilled salmon with quinoa and broccoli"*).
- **Dual-Engine AI Architecture**:
  - **🧠 Built-in Smart Neural AI Engine**: On-device NLP semantic parsing and nutrient aggregation that works 100% offline with zero API key or setup needed!
  - **✨ Cloud Google Gemini API**: Direct connection to **Gemini 3.8 Flash** via your Google Gemini API key for deep generative reasoning and recipe analysis.
- **AI Metabolic Insights**: Generates dietary feedback, component identification, and confidence ratings for each meal.
- **Portion Multiplier**: Adjust portion size (0.5x, 1.0x, 1.5x, 2.0x) with real-time recalculation of all nutrients prior to logging.
- **Meal Sections**: Built-in sections for **Breakfast**, **Lunch**, **Dinner**, **Snacks & Berries**, plus custom meal categories.
- **Food Catalog Fallback**: Includes a preloaded catalog of whole foods and snacks.
- **Macronutrient Progress**: Real-time progress bars and donut distribution chart.

### 2. ⌚ Apple Watch & Physical Activity
- **Apple Activity Rings**: Realistic SVG **Move** (Active Calories), **Exercise** (Mins), and **Stand** (Hours) rings that animate dynamically.
- **Live Watch Sync Simulation**: Realistic Apple Watch Ultra 2 / Series 9 pairing status, battery indicator, and one-click sync.
- **Apple Health Data Import**: Import official Apple Health export files (`export.xml` or JSON) to populate real-world workouts and step counts.
- **Manual Workout Logging**: Log 10+ sports (Running, Cycling, HIIT, Strength, Swimming, Yoga, etc.) with automatic MET-based calorie estimation, intensity levels, heart rate, and distance.

### 3. ✅ Customizable Daily Habits
- **Category Filtering**: Filter by *Body*, *Mind*, *Movement*, *Nutrition*, and *Sleep*.
- **Streak Tracking**: Live streak counter (`🔥 7-day streak`) with automatic day-by-day recalculation.
- **Custom Habit Creator**: Add new habits with custom emojis, frequency goals, and categories.
- **Celebration Particle Effect**: Full confetti celebration when all habits for the day are accomplished!

### 4. 💧 Water Intake & Hydration
- **Interactive Fluid Bottle**: Animated fluid wave level that fills up dynamically with hydration progress.
- **Quick-Log Buttons**: Instant `+250 ml (Glass)`, `+500 ml (Bottle)`, `+750 ml`, custom amount, and undo controls.
- **Hydration Log**: Detailed timestamped record of today's water intake.

### 5. 🌙 Sleep Tracker & Recovery (3-Way Integration)
- **⌚ Connect with Apple Watch**:
  - Live simulation of Apple Watch Ultra / Series 9 Sleep Tracking sensor stream.
  - One-click **"Sync Sleep from Apple Watch"** populates exact Deep, Core, and REM sleep stages, time in bed vs asleep, sleeping resting heart rate (52 BPM), and wrist temperature fluctuations.
- **🍏 Connect with Apple Health**:
  - Direct file uploader for Apple Health `export.xml` or JSON records.
  - Automatically parses official `HKCategoryTypeIdentifierSleepAnalysis` records (`HKCategoryValueSleepAnalysisAsleepDeep`, `HKCategoryValueSleepAnalysisAsleepREM`, `HKCategoryValueSleepAnalysisAsleepCore`, `HKCategoryValueSleepAnalysisAwake`).
- **✍️ Manual Entry**:
  - Bedtime and Wake Time inputs with automatic midnight-crossing duration calculation.
  - Customizable stage percentage inputs (Deep %, REM %, Core %, Awake %) and 5-tier quality ratings (*Deep & Restorative 😴*, *Good 😊*, *Fair 😐*, *Poor 🥱*, *Terrible 😫*).
  - Sleep hygiene and environment tags (*Cool Room (67°F)*, *No Screens 45m*, *Dark Mask*, *White Noise*, *No Caffeine > 2pm*, *Magnesium*).

### 6. 🧘 Mindfulness & Guided Breathwork
- **Interactive Guided Breathing Visualizer**: Animated breathing orb with **Box Breathing (4-4-4-4)** and **4-7-8 Relaxing Breath** modes.
- **Tibetan Singing Bowl Chime**: Synthesized serene audio chimes via Web Audio API (zero audio files needed).
- **Daily Mood Check-In & Gratitude Journal**: Track your emotional state (*Joyful*, *Calm*, *Energetic*, *Anxious*, *Tired*) and daily gratitude reflections with autosave.

### 7. 📈 Interactive Analytics & Charts
- **Multi-Metric Analytics**: Interactive SVG charts with responsive hover tooltips.
- **Calories vs Activity Burn**: 7-Day / 14-Day side-by-side comparison.
- **Sleep Trend Curve**: Sleep hours over time with 8h goal benchmark line.
- **Macronutrient Donut Chart**: Visual distribution of Protein, Carbs, and Fats.
- **Hydration Consistency**: 7-Day water consumption consistency bars.

### 8. 💾 Local Storage & Data Persistence
- **Automatic Saving**: All user actions, habits, meals, workouts, and journal entries save instantly to browser `localStorage`.
- **Date Switcher**: Seamlessly navigate to past days or today to view history or log past entries.
- **Data Export & Import**: Backup your data to a clean JSON file or restore from a previous backup.
- **Sample Demo Data**: Preloaded with 7 full days of realistic wellness history for immediate exploration.

### 9. 🔐 Multi-User Authentication & Access Controls (10 Accounts)
- **10 Account Capacity**: Allows up to 10 user accounts with strict capacity enforcement and a visual slot progress indicator.
- **Data Partition Isolation**: Each user has a completely isolated data partition in `localStorage`. Logged-in users only see their own meals, calories, workouts, water logs, sleep stages, habits, and AI targets.
- **Role-Based Access Control (RBAC)**:
  - **👑 Administrator** (`admin`): Full access to wellness tracking plus exclusive access to the **Account & Access Control Manager** to add new accounts, change user roles, reset PINs/passwords, delete accounts, and view capacity.
  - **👤 Member** (`member`): Private access to personal wellness data. Protected against unauthorized access or account deletion by non-admins.
- **Authentication & Lock Screen**:
  - Secure PIN/password authentication with "Remember Me" session persistence.
  - Quick Profile Switcher with 1-click demo logins (`Courtney [Admin]`, `Alex [Member]`, `Jordan [Member]`, PIN: `1234`).
  - Interactive header profile chip showing current user avatar, name, and role badge with quick account dropdown.

---

## 🚀 Quick Start Guide

### Launching the Dashboard

1. In your terminal, navigate to the project directory:
   ```bash
   cd /Users/courtneyberry/.gemini/antigravity/scratch/berry-pulse
   ```

2. Start the local server:
   ```bash
   ./start.sh
   ```
   *(or run `python3 -m http.server 8080`)*

3. Open your browser and visit:
   ```
   http://localhost:8080
   ```
   *(You can also double-click `index.html` directly in macOS Finder to open it in Safari or Chrome!)*

---

## 📁 Project Architecture

```
berry-pulse/
├── index.html            # Main HTML5 application dashboard & modals
├── css/
│   └── styles.css        # Luxury berry theme, glassmorphism, wave animations
├── js/
│   ├── data.js           # 120+ food database, default habits, 7-day seed generator
│   ├── storage.js        # LocalStorage state manager, backup/restore
│   ├── nutrition.js      # Food search, serving multiplier, meal sections
│   ├── habits.js         # Daily habits tracker, streak logic, categories
│   ├── activity.js       # Manual workout logger, MET calorie calculator
│   ├── apple-watch.js    # Apple Watch simulation, SVG activity rings, XML parser
│   ├── water.js          # Water tracker with fluid wave bottle
│   ├── sleep.js          # Sleep calculator, quality ratings, sleep architecture
│   ├── mindfulness.js    # Guided breathing visualizer, Web Audio chime, journal
│   ├── charts.js         # Interactive SVG charts engine with hover tooltips
│   └── app.js            # Coordinator, tab router, date switcher, confetti
├── start.sh              # Bash launcher script
└── README.md             # Documentation
```
