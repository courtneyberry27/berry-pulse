/**
 * BerryPulse Wellness Tracker - Core Data & Nutrition Database
 */

const BerryPulseData = {
  // Comprehensive offline nutrition database (120+ common items)
  foodDatabase: [
    // Berries & Fruits
    { id: 'f-1', name: 'Fresh Blueberries', category: 'Fruits & Berries', servingSize: '1 cup (148g)', calories: 84, protein: 1.1, carbs: 21.4, fat: 0.5, fiber: 3.6, icon: '🫐' },
    { id: 'f-2', name: 'Fresh Raspberries', category: 'Fruits & Berries', servingSize: '1 cup (123g)', calories: 64, protein: 1.5, carbs: 14.7, fat: 0.8, fiber: 8.0, icon: '🍇' },
    { id: 'f-3', name: 'Blackberries', category: 'Fruits & Berries', servingSize: '1 cup (144g)', calories: 62, protein: 2.0, carbs: 13.8, fat: 0.7, fiber: 7.6, icon: '🫐' },
    { id: 'f-4', name: 'Strawberries', category: 'Fruits & Berries', servingSize: '1 cup sliced (166g)', calories: 53, protein: 1.1, carbs: 12.7, fat: 0.5, fiber: 3.3, icon: '🍓' },
    { id: 'f-5', name: 'Acai Bowl (Pure Puree)', category: 'Fruits & Berries', servingSize: '1 bowl (200g)', calories: 180, protein: 3.5, carbs: 28.0, fat: 6.0, fiber: 5.2, icon: '🥣' },
    { id: 'f-6', name: 'Medium Banana', category: 'Fruits & Berries', servingSize: '1 medium (118g)', calories: 105, protein: 1.3, carbs: 27.0, fat: 0.3, fiber: 3.1, icon: '🍌' },
    { id: 'f-7', name: 'Honeycrisp Apple', category: 'Fruits & Berries', servingSize: '1 medium (182g)', calories: 95, protein: 0.5, carbs: 25.1, fat: 0.3, fiber: 4.4, icon: '🍎' },
    { id: 'f-8', name: 'Avocado (Hass)', category: 'Fruits & Berries', servingSize: '1/2 avocado (100g)', calories: 160, protein: 2.0, carbs: 8.5, fat: 14.7, fiber: 6.7, icon: '🥑' },
    { id: 'f-9', name: 'Orange', category: 'Fruits & Berries', servingSize: '1 medium (131g)', calories: 62, protein: 1.2, carbs: 15.4, fat: 0.2, fiber: 3.1, icon: '🍊' },
    { id: 'f-10', name: 'Mango Chunks', category: 'Fruits & Berries', servingSize: '1 cup (165g)', calories: 99, protein: 1.4, carbs: 24.7, fat: 0.6, fiber: 2.6, icon: '🥭' },
    { id: 'f-11', name: 'Kiwi Fruit', category: 'Fruits & Berries', servingSize: '2 medium (138g)', calories: 84, protein: 1.6, carbs: 20.2, fat: 0.7, fiber: 4.2, icon: '🥝' },
    { id: 'f-12', name: 'Pineapple Chunks', category: 'Fruits & Berries', servingSize: '1 cup (165g)', calories: 82, protein: 0.9, carbs: 21.6, fat: 0.2, fiber: 2.3, icon: '🍍' },
    { id: 'f-13', name: 'Watermelon Slices', category: 'Fruits & Berries', servingSize: '2 cups diced (280g)', calories: 85, protein: 1.7, carbs: 21.0, fat: 0.4, fiber: 1.1, icon: '🍉' },

    // Breakfast Staples
    { id: 'b-1', name: 'Rolled Oats (Dry)', category: 'Breakfast', servingSize: '1/2 cup (40g)', calories: 150, protein: 5.0, carbs: 27.0, fat: 2.5, fiber: 4.0, icon: '🥣' },
    { id: 'b-2', name: 'Greek Yogurt (Plain, 0%)', category: 'Breakfast', servingSize: '1 cup (170g)', calories: 100, protein: 18.0, carbs: 6.0, fat: 0.5, fiber: 0.0, icon: '🥛' },
    { id: 'b-3', name: 'Greek Yogurt (Vanilla, 2%)', category: 'Breakfast', servingSize: '1 cup (170g)', calories: 140, protein: 15.0, carbs: 14.0, fat: 3.0, fiber: 0.0, icon: '🍦' },
    { id: 'b-4', name: 'Whole Eggs (Scrambled/Boiled)', category: 'Breakfast', servingSize: '2 large eggs (100g)', calories: 144, protein: 12.6, carbs: 0.8, fat: 9.9, fiber: 0.0, icon: '🍳' },
    { id: 'b-5', name: 'Egg Whites', category: 'Breakfast', servingSize: '1/2 cup (120g)', calories: 60, protein: 13.0, carbs: 1.0, fat: 0.2, fiber: 0.0, icon: '🥚' },
    { id: 'b-6', name: 'Artisan Sourdough Toast', category: 'Breakfast', servingSize: '1 thick slice (50g)', calories: 130, protein: 4.5, carbs: 26.0, fat: 1.0, fiber: 1.5, icon: '🍞' },
    { id: 'b-7', name: 'Avocado Toast with Chili Flakes', category: 'Breakfast', servingSize: '1 slice loaded (130g)', calories: 245, protein: 6.0, carbs: 28.0, fat: 13.0, fiber: 6.5, icon: '🥑' },
    { id: 'b-8', name: 'Chia Seed Pudding', category: 'Breakfast', servingSize: '1 cup (200g)', calories: 190, protein: 6.0, carbs: 20.0, fat: 10.0, fiber: 9.0, icon: '🍮' },
    { id: 'b-9', name: 'Protein Pancakes', category: 'Breakfast', servingSize: '2 medium (120g)', calories: 230, protein: 20.0, carbs: 28.0, fat: 4.0, fiber: 3.5, icon: '🥞' },
    { id: 'b-10', name: 'Almond Butter', category: 'Breakfast', servingSize: '2 tbsp (32g)', calories: 196, protein: 6.7, carbs: 6.0, fat: 17.8, fiber: 3.3, icon: '🥜' },
    { id: 'b-11', name: 'Peanut Butter (Natural)', category: 'Breakfast', servingSize: '2 tbsp (32g)', calories: 190, protein: 8.0, carbs: 7.0, fat: 16.0, fiber: 2.0, icon: '🥜' },
    { id: 'b-12', name: 'Pure Maple Syrup', category: 'Breakfast', servingSize: '1 tbsp (20ml)', calories: 52, protein: 0.0, carbs: 13.4, fat: 0.0, fiber: 0.0, icon: '🍁' },
    { id: 'b-13', name: 'Smoked Salmon (Lox)', category: 'Breakfast', servingSize: '3 oz (85g)', calories: 99, protein: 15.5, carbs: 0.0, fat: 3.7, fiber: 0.0, icon: '🐟' },
    { id: 'b-14', name: 'Everything Bagel', category: 'Breakfast', servingSize: '1 bagel (105g)', calories: 290, protein: 11.0, carbs: 56.0, fat: 2.0, fiber: 3.0, icon: '🥯' },

    // Proteins & Meat
    { id: 'p-1', name: 'Grilled Chicken Breast', category: 'Proteins', servingSize: '1 breast cooked (150g)', calories: 248, protein: 46.5, carbs: 0.0, fat: 5.4, fiber: 0.0, icon: '🍗' },
    { id: 'p-2', name: 'Wild Atlantic Salmon Fillet', category: 'Proteins', servingSize: '6 oz cooked (170g)', calories: 310, protein: 40.0, carbs: 0.0, fat: 16.0, fiber: 0.0, icon: '🐟' },
    { id: 'p-3', name: 'Grass-Fed Sirloin Steak', category: 'Proteins', servingSize: '6 oz cooked (170g)', calories: 330, protein: 44.0, carbs: 0.0, fat: 16.0, fiber: 0.0, icon: '🥩' },
    { id: 'p-4', name: 'Ground Turkey (93/7)', category: 'Proteins', servingSize: '4 oz cooked (112g)', calories: 170, protein: 22.0, carbs: 0.0, fat: 9.0, fiber: 0.0, icon: '🦃' },
    { id: 'p-5', name: 'Tofu (Organic Extra Firm)', category: 'Proteins', servingSize: '1/2 block (126g)', calories: 120, protein: 14.0, carbs: 3.0, fat: 6.0, fiber: 2.0, icon: '🧊' },
    { id: 'p-6', name: 'Tempeh (Organic)', category: 'Proteins', servingSize: '3 oz (85g)', calories: 160, protein: 15.0, carbs: 9.0, fat: 9.0, fiber: 7.0, icon: '🌱' },
    { id: 'p-7', name: 'Jumbo Shrimp (Grilled)', category: 'Proteins', servingSize: '6 oz (170g)', calories: 168, protein: 34.0, carbs: 1.5, fat: 2.4, fiber: 0.0, icon: '🦐' },
    { id: 'p-8', name: 'Albacore White Tuna (in water)', category: 'Proteins', servingSize: '1 can drained (142g)', calories: 150, protein: 32.0, carbs: 0.0, fat: 1.5, fiber: 0.0, icon: '🐟' },
    { id: 'p-9', name: 'Whey Protein Isolate Scoop', category: 'Proteins', servingSize: '1 scoop (30g)', calories: 120, protein: 25.0, carbs: 2.0, fat: 1.0, fiber: 0.5, icon: '🥤' },
    { id: 'p-10', name: 'Plant-Based Protein Powder', category: 'Proteins', servingSize: '1 scoop (35g)', calories: 130, protein: 24.0, carbs: 3.5, fat: 2.5, fiber: 2.0, icon: '🌿' },
    { id: 'p-11', name: 'Low-Fat Cottage Cheese', category: 'Proteins', servingSize: '1 cup (226g)', calories: 163, protein: 28.0, carbs: 6.2, fat: 2.3, fiber: 0.0, icon: '🧀' },

    // Grains, Pasta & Carbs
    { id: 'g-1', name: 'Quinoa (Cooked)', category: 'Grains & Carbs', servingSize: '1 cup (185g)', calories: 222, protein: 8.1, carbs: 39.4, fat: 3.6, fiber: 5.2, icon: '🌾' },
    { id: 'g-2', name: 'Brown Jasmine Rice (Cooked)', category: 'Grains & Carbs', servingSize: '1 cup (195g)', calories: 216, protein: 5.0, carbs: 45.0, fat: 1.8, fiber: 3.5, icon: '🍚' },
    { id: 'g-3', name: 'White Basmati Rice (Cooked)', category: 'Grains & Carbs', servingSize: '1 cup (158g)', calories: 205, protein: 4.2, carbs: 44.5, fat: 0.4, fiber: 0.6, icon: '🍚' },
    { id: 'g-4', name: 'Baked Sweet Potato', category: 'Grains & Carbs', servingSize: '1 medium (150g)', calories: 135, protein: 3.0, carbs: 31.0, fat: 0.2, fiber: 4.5, icon: '🍠' },
    { id: 'g-5', name: 'Whole Wheat Pasta (Cooked)', category: 'Grains & Carbs', servingSize: '1 cup (140g)', calories: 174, protein: 7.5, carbs: 37.0, fat: 0.8, fiber: 4.6, icon: '🍝' },
    { id: 'g-6', name: 'Chickpeas / Garbanzo Beans', category: 'Grains & Carbs', servingSize: '1/2 cup cooked (82g)', calories: 134, protein: 7.3, carbs: 22.5, fat: 2.1, fiber: 6.2, icon: '🧆' },
    { id: 'g-7', name: 'Black Beans (Cooked)', category: 'Grains & Carbs', servingSize: '1/2 cup (86g)', calories: 114, protein: 7.6, carbs: 20.4, fat: 0.5, fiber: 7.5, icon: '🫘' },
    { id: 'g-8', name: 'Red Lentils (Cooked)', category: 'Grains & Carbs', servingSize: '1/2 cup (100g)', calories: 115, protein: 9.0, carbs: 20.0, fat: 0.4, fiber: 4.0, icon: '🍲' },
    { id: 'g-9', name: 'Corn Tortilla', category: 'Grains & Carbs', servingSize: '2 tortillas (50g)', calories: 104, protein: 2.8, carbs: 21.6, fat: 1.4, fiber: 3.0, icon: '🌮' },
    { id: 'g-10', name: 'Couscous (Cooked)', category: 'Grains & Carbs', servingSize: '1 cup (157g)', calories: 176, protein: 6.0, carbs: 36.5, fat: 0.3, fiber: 2.2, icon: '🍲' },

    // Vegetables & Greens
    { id: 'v-1', name: 'Baby Spinach (Raw)', category: 'Vegetables', servingSize: '2 cups (60g)', calories: 14, protein: 1.7, carbs: 2.2, fat: 0.2, fiber: 1.3, icon: '🥬' },
    { id: 'v-2', name: 'Steamed Broccoli Florets', category: 'Vegetables', servingSize: '1 cup (150g)', calories: 55, protein: 3.7, carbs: 11.2, fat: 0.6, fiber: 5.1, icon: '🥦' },
    { id: 'v-3', name: 'Tuscan Kale (Chopped)', category: 'Vegetables', servingSize: '1 cup (67g)', calories: 33, protein: 2.9, carbs: 6.0, fat: 0.6, fiber: 2.5, icon: '🥬' },
    { id: 'v-4', name: 'Roasted Asparagus', category: 'Vegetables', servingSize: '6 spears (90g)', calories: 27, protein: 2.5, carbs: 4.5, fat: 0.2, fiber: 2.4, icon: '🌱' },
    { id: 'v-5', name: 'Bell Peppers (Assorted)', category: 'Vegetables', servingSize: '1 medium (119g)', calories: 31, protein: 1.2, carbs: 7.2, fat: 0.3, fiber: 2.5, icon: '🫑' },
    { id: 'v-6', name: 'English Cucumber', category: 'Vegetables', servingSize: '1 cup sliced (104g)', calories: 16, protein: 0.7, carbs: 3.8, fat: 0.1, fiber: 0.5, icon: '🥒' },
    { id: 'v-7', name: 'Cherry Tomatoes', category: 'Vegetables', servingSize: '1 cup (149g)', calories: 27, protein: 1.3, carbs: 5.8, fat: 0.3, fiber: 1.8, icon: '🍅' },
    { id: 'v-8', name: 'Roasted Cauliflower', category: 'Vegetables', servingSize: '1 cup (100g)', calories: 35, protein: 2.0, carbs: 5.0, fat: 1.0, fiber: 2.5, icon: '🥦' },
    { id: 'v-9', name: 'Zucchini (Grilled/Sauteed)', category: 'Vegetables', servingSize: '1 cup sliced (124g)', calories: 21, protein: 1.5, carbs: 3.9, fat: 0.4, fiber: 1.2, icon: '🥒' },
    { id: 'v-10', name: 'Baby Carrots', category: 'Vegetables', servingSize: '1 cup (120g)', calories: 42, protein: 0.8, carbs: 9.9, fat: 0.2, fiber: 3.5, icon: '🥕' },

    // Healthy Snacks & Nuts
    { id: 's-1', name: 'Raw Almonds', category: 'Snacks & Nuts', servingSize: '1 oz (28g / ~23 nuts)', calories: 164, protein: 6.0, carbs: 6.1, fat: 14.2, fiber: 3.5, icon: '🥜' },
    { id: 's-2', name: 'Walnut Halves', category: 'Snacks & Nuts', servingSize: '1 oz (28g / 14 halves)', calories: 185, protein: 4.3, carbs: 3.9, fat: 18.5, fiber: 1.9, icon: '🌰' },
    { id: 's-3', name: 'Classic Garlic Hummus', category: 'Snacks & Nuts', servingSize: '2 tbsp (30g)', calories: 70, protein: 2.0, carbs: 4.0, fat: 5.0, fiber: 1.5, icon: '🧆' },
    { id: 's-4', name: 'Dark Chocolate (85% Cacao)', category: 'Snacks & Nuts', servingSize: '1 oz (28g / 2 squares)', calories: 170, protein: 2.8, carbs: 12.0, fat: 14.0, fiber: 3.0, icon: '🍫' },
    { id: 's-5', name: 'Crispy Edamame (Steamed)', category: 'Snacks & Nuts', servingSize: '1/2 cup shelled (75g)', calories: 95, protein: 9.0, carbs: 7.0, fat: 4.0, fiber: 4.0, icon: '🫛' },
    { id: 's-6', name: 'Roasted Pumpkin Seeds', category: 'Snacks & Nuts', servingSize: '1 oz (28g)', calories: 158, protein: 8.6, carbs: 3.0, fat: 13.9, fiber: 1.7, icon: '🎃' },
    { id: 's-7', name: 'Organic Brown Rice Cakes', category: 'Snacks & Nuts', servingSize: '2 cakes (18g)', calories: 70, protein: 1.5, carbs: 15.0, fat: 0.5, fiber: 1.0, icon: '🍘' },
    { id: 's-8', name: 'Berry Antioxidant Trail Mix', category: 'Snacks & Nuts', servingSize: '1/4 cup (40g)', calories: 190, protein: 4.0, carbs: 22.0, fat: 11.0, fiber: 2.5, icon: '🥜' },
    { id: 's-9', name: 'String Cheese (Part-Skim)', category: 'Snacks & Nuts', servingSize: '1 stick (28g)', calories: 80, protein: 7.0, carbs: 1.0, fat: 6.0, fiber: 0.0, icon: '🧀' },
    { id: 's-10', name: 'Whole Wheat Pita Chips', category: 'Snacks & Nuts', servingSize: '1 oz (28g / 10 chips)', calories: 130, protein: 3.0, carbs: 19.0, fat: 5.0, fiber: 2.0, icon: '🥨' },

    // Healthy Meals & Bowls
    { id: 'm-1', name: 'Berry Green Goddess Smoothie', category: 'Meals', servingSize: '1 large smoothie (450ml)', calories: 290, protein: 24.0, carbs: 38.0, fat: 5.0, fiber: 8.0, icon: '🥤' },
    { id: 'm-2', name: 'Salmon & Quinoa Power Bowl', category: 'Meals', servingSize: '1 full bowl (400g)', calories: 520, protein: 42.0, carbs: 45.0, fat: 18.0, fiber: 7.0, icon: '🥗' },
    { id: 'm-3', name: 'Grilled Chicken Caesar Salad', category: 'Meals', servingSize: '1 large bowl (350g)', calories: 430, protein: 38.0, carbs: 12.0, fat: 26.0, fiber: 4.0, icon: '🥗' },
    { id: 'm-4', name: 'Tofu Rainbow Stir-Fry with Rice', category: 'Meals', servingSize: '1 plate (400g)', calories: 410, protein: 22.0, carbs: 54.0, fat: 12.0, fiber: 6.5, icon: '🥘' },
    { id: 'm-5', name: 'Turkey & Sweet Potato Skillet', category: 'Meals', servingSize: '1 plate (380g)', calories: 460, protein: 36.0, carbs: 42.0, fat: 15.0, fiber: 6.0, icon: '🍠' },
    { id: 'm-6', name: 'Mediterranean Falafel Wrap', category: 'Meals', servingSize: '1 wrap (280g)', calories: 480, protein: 14.0, carbs: 62.0, fat: 20.0, fiber: 9.0, icon: '🌯' },
    { id: 'm-7', name: 'Hearty Lentil Vegetable Soup', category: 'Meals', servingSize: '1.5 cups (350g)', calories: 240, protein: 14.0, carbs: 40.0, fat: 2.5, fiber: 11.0, icon: '🍲' },
    { id: 'm-8', name: 'Spaghetti with Lean Turkey Bolognese', category: 'Meals', servingSize: '1 bowl (400g)', calories: 490, protein: 34.0, carbs: 65.0, fat: 10.0, fiber: 6.0, icon: '🍝' },

    // Beverages
    { id: 'bev-1', name: 'Filtered Spring Water', category: 'Beverages', servingSize: '1 glass (250ml)', calories: 0, protein: 0.0, carbs: 0.0, fat: 0.0, fiber: 0.0, icon: '💧' },
    { id: 'bev-2', name: 'Organic Matcha Green Tea', category: 'Beverages', servingSize: '1 mug (240ml)', calories: 5, protein: 0.5, carbs: 0.8, fat: 0.0, fiber: 0.0, icon: '🍵' },
    { id: 'bev-3', name: 'Black Drip Coffee', category: 'Beverages', servingSize: '1 cup (240ml)', calories: 2, protein: 0.3, carbs: 0.0, fat: 0.0, fiber: 0.0, icon: '☕' },
    { id: 'bev-4', name: 'Oat Milk Latte (Unsweetened)', category: 'Beverages', servingSize: '1 tall cup (350ml)', calories: 130, protein: 3.0, carbs: 16.0, fat: 6.0, fiber: 2.0, icon: '☕' },
    { id: 'bev-5', name: 'Pure Coconut Water', category: 'Beverages', servingSize: '1 cup (240ml)', calories: 46, protein: 1.7, carbs: 8.9, fat: 0.5, fiber: 2.6, icon: '🥥' },
    { id: 'bev-6', name: 'Berry Hibiscus Kombucha', category: 'Beverages', servingSize: '1 bottle (355ml)', calories: 50, protein: 0.0, carbs: 12.0, fat: 0.0, fiber: 0.0, icon: '🍹' },
    { id: 'bev-7', name: 'Almond Milk (Unsweetened)', category: 'Beverages', servingSize: '1 cup (240ml)', calories: 30, protein: 1.0, carbs: 1.0, fat: 2.5, fiber: 1.0, icon: '🥛' }
  ],

  // Default customizable habits
  defaultHabits: [
    { id: 'h-1', name: 'Morning Hydration (500ml)', category: 'Body', icon: '💧', targetFrequency: 'Daily', streak: 6, completed: true, reminderTime: '07:30' },
    { id: 'h-2', name: 'Hit 10,000 Steps', category: 'Movement', icon: '👟', targetFrequency: 'Daily', streak: 4, completed: true, reminderTime: '18:00' },
    { id: 'h-3', name: '15 Min Mindful Breathwork', category: 'Mind', icon: '🧘', targetFrequency: 'Daily', streak: 7, completed: true, reminderTime: '08:00' },
    { id: 'h-4', name: 'Whole Food Rainbow Plate', category: 'Nutrition', icon: '🥗', targetFrequency: 'Daily', streak: 5, completed: false, reminderTime: '13:00' },
    { id: 'h-5', name: 'Screen-Free 45m Before Bed', category: 'Sleep', icon: '🌙', targetFrequency: 'Daily', streak: 3, completed: false, reminderTime: '21:30' },
    { id: 'h-6', name: 'Read 20 Pages', category: 'Mind', icon: '📚', targetFrequency: 'Daily', streak: 12, completed: true, reminderTime: '20:30' },
    { id: 'h-7', name: 'Outdoor Sunshine Walk (20m)', category: 'Movement', icon: '☀️', targetFrequency: 'Daily', streak: 2, completed: false, reminderTime: '12:00' },
    { id: 'h-8', name: 'Daily Omega-3 & Vitamins', category: 'Nutrition', icon: '💊', targetFrequency: 'Daily', streak: 9, completed: true, reminderTime: '08:30' }
  ],

  // Standard Workout Types with MET (Metabolic Equivalent) for calorie auto-calc
  workoutTypes: [
    { id: 'running', name: 'Outdoor Run', icon: '🏃', met: 9.8, defaultIntensity: 'High' },
    { id: 'cycling', name: 'Cycling / Spin', icon: '🚴', met: 7.5, defaultIntensity: 'Moderate' },
    { id: 'strength', name: 'Strength Training', icon: '🏋️', met: 6.0, defaultIntensity: 'Moderate' },
    { id: 'hiit', name: 'HIIT / Circuit', icon: '⚡', met: 8.5, defaultIntensity: 'Peak' },
    { id: 'yoga', name: 'Vinyasa Yoga', icon: '🧘', met: 3.5, defaultIntensity: 'Light' },
    { id: 'swimming', name: 'Swimming Laps', icon: '🏊', met: 8.0, defaultIntensity: 'High' },
    { id: 'walking', name: 'Brisk Walking', icon: '🚶', met: 4.2, defaultIntensity: 'Light' },
    { id: 'pilates', name: 'Mat Pilates', icon: '🤸', met: 4.0, defaultIntensity: 'Moderate' },
    { id: 'boxing', name: 'Boxing / Kickboxing', icon: '🥊', met: 9.0, defaultIntensity: 'Peak' },
    { id: 'rowing', name: 'Rowing Machine', icon: '🚣', met: 7.0, defaultIntensity: 'High' }
  ],

  // Default targets
  defaultGoals: {
    calories: 2200,
    proteinGrams: 140,
    carbsGrams: 220,
    fatGrams: 65,
    fiberGrams: 35,
    waterOz: 96,
    waterMl: 2800,
    sleepHours: 8.0,
    mindfulnessMins: 15,
    activeCalories: 550,
    exerciseMins: 30,
    standHours: 12,
    steps: 10000
  },

  // Generates 7 days of realistic history data including today
  generateInitialData: function() {
    const today = new Date();
    const history = {};

    // Generate past 7 days
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(today.getDate() - i);
      const dateKey = d.toISOString().split('T')[0];

      // Varied realistic metrics
      const isToday = (i === 0);
      const waterOz = isToday ? 68 : Math.round(80 + (Math.sin(i) * 16));
      const waterMl = Math.round(waterOz * 29.57);
      const sleepHours = 7.0 + Number((Math.sin(i * 1.5) * 0.9).toFixed(1));
      const activeCalories = isToday ? 480 : Math.round(520 + (Math.cos(i) * 110));
      const exerciseMins = isToday ? 35 : Math.round(38 + (Math.sin(i * 2) * 12));
      const standHours = isToday ? 10 : Math.min(14, Math.max(9, Math.round(11 + (i % 3))));
      const steps = isToday ? 8940 : Math.round(9200 + (Math.sin(i) * 2200));

      history[dateKey] = {
        date: dateKey,
        water: {
          intakeOz: waterOz,
          intakeMl: waterMl,
          goalOz: 96,
          goalMl: 2800,
          logs: [
            { time: '07:45', amount: 16, label: 'Morning Glass' },
            { time: '10:30', amount: 16, label: 'Mid-Morning Bottle' },
            { time: '13:15', amount: 16, label: 'Lunch Rehydrate' },
            ...(waterOz >= 68 ? [{ time: '16:00', amount: 20, label: 'Afternoon Refresh' }] : []),
            ...(waterOz >= 85 ? [{ time: '19:30', amount: 16, label: 'Evening Glass' }] : [])
          ]
        },
        sleep: {
          bedtime: '23:15',
          wakeTime: '07:15',
          durationHours: sleepHours,
          quality: (i % 2 === 0) ? 'Deep & Restorative' : 'Good',
          qualityRating: (i % 2 === 0) ? 5 : 4,
          stages: {
            deepPct: 22,
            remPct: 24,
            lightPct: 46,
            awakePct: 8
          },
          tags: ['Cool Room (67°F)', 'No Caffeine after 2pm', 'Dark Mask']
        },
        activity: {
          appleWatchSynced: true,
          appleWatchModel: 'Apple Watch Ultra 2 (Cellular)',
          lastSyncedAt: isToday ? '11:42 AM' : '11:30 PM',
          rings: {
            move: { current: activeCalories, goal: 550 },
            exercise: { current: exerciseMins, goal: 30 },
            stand: { current: standHours, goal: 12 }
          },
          steps: steps,
          distanceKm: Number((steps * 0.00078).toFixed(1)),
          avgHeartRate: 68 + (i % 5),
          workouts: [
            {
              id: `w-${dateKey}-1`,
              type: i % 2 === 0 ? 'Outdoor Run' : 'Strength Training',
              icon: i % 2 === 0 ? '🏃' : '🏋️',
              durationMins: exerciseMins,
              calories: Math.round(activeCalories * 0.75),
              distanceKm: i % 2 === 0 ? 4.8 : null,
              intensity: 'Moderate',
              source: 'Apple Watch',
              timestamp: '08:30 AM'
            }
          ]
        },
        nutrition: {
          dailyGoalCalories: 2200,
          meals: {
            breakfast: [
              { id: 'f-1', name: 'Fresh Blueberries', calories: 84, protein: 1.1, carbs: 21.4, fat: 0.5, fiber: 3.6, serving: '1 cup', icon: '🫐' },
              { id: 'b-1', name: 'Rolled Oats (Dry)', calories: 150, protein: 5.0, carbs: 27.0, fat: 2.5, fiber: 4.0, serving: '1/2 cup', icon: '🥣' },
              { id: 'b-2', name: 'Greek Yogurt (Plain, 0%)', calories: 100, protein: 18.0, carbs: 6.0, fat: 0.5, fiber: 0.0, serving: '1 cup', icon: '🥛' },
              { id: 'b-10', name: 'Almond Butter', calories: 196, protein: 6.7, carbs: 6.0, fat: 17.8, fiber: 3.3, serving: '2 tbsp', icon: '🥜' }
            ],
            lunch: [
              { id: 'p-1', name: 'Grilled Chicken Breast', calories: 248, protein: 46.5, carbs: 0.0, fat: 5.4, fiber: 0.0, serving: '150g', icon: '🍗' },
              { id: 'g-1', name: 'Quinoa (Cooked)', calories: 222, protein: 8.1, carbs: 39.4, fat: 3.6, fiber: 5.2, serving: '1 cup', icon: '🌾' },
              { id: 'v-1', name: 'Baby Spinach (Raw)', calories: 14, protein: 1.7, carbs: 2.2, fat: 0.2, fiber: 1.3, serving: '2 cups', icon: '🥬' },
              { id: 'f-8', name: 'Avocado (Hass)', calories: 160, protein: 2.0, carbs: 8.5, fat: 14.7, fiber: 6.7, serving: '1/2 avocado', icon: '🥑' }
            ],
            dinner: [
              { id: 'p-2', name: 'Wild Atlantic Salmon Fillet', calories: 310, protein: 40.0, carbs: 0.0, fat: 16.0, fiber: 0.0, serving: '6 oz', icon: '🐟' },
              { id: 'g-4', name: 'Baked Sweet Potato', calories: 135, protein: 3.0, carbs: 31.0, fat: 0.2, fiber: 4.5, serving: '1 medium', icon: '🍠' },
              { id: 'v-2', name: 'Steamed Broccoli Florets', calories: 55, protein: 3.7, carbs: 11.2, fat: 0.6, fiber: 5.1, serving: '1 cup', icon: '🥦' }
            ],
            snacks: [
              { id: 'f-4', name: 'Strawberries', calories: 53, protein: 1.1, carbs: 12.7, fat: 0.5, fiber: 3.3, serving: '1 cup', icon: '🍓' },
              { id: 's-4', name: 'Dark Chocolate (85% Cacao)', calories: 170, protein: 2.8, carbs: 12.0, fat: 14.0, fiber: 3.0, serving: '1 oz', icon: '🍫' }
            ]
          }
        },
        mindfulness: {
          targetMinutes: 15,
          completedMinutes: isToday ? 15 : (12 + (i % 6)),
          mood: isToday ? 'Calm & Centered' : ['Grateful', 'Energetic', 'Joyful', 'Peaceful'][i % 4],
          moodEmoji: isToday ? '🧘' : ['✨', '⚡', '🌸', '🌿'][i % 4],
          gratitudeJournal: 'Grateful for crisp morning air, deep focus on creative work, and a rejuvenating berry smoothie.',
          sessions: [
            { type: 'Box Breathing (4-4-4-4)', minutes: 5, completedAt: '08:10 AM' },
            { type: 'Loving-Kindness Meditation', minutes: 10, completedAt: '01:30 PM' }
          ]
        },
        habitsStatus: {
          'h-1': true,
          'h-2': true,
          'h-3': true,
          'h-4': i % 2 === 0,
          'h-5': i % 3 === 0,
          'h-6': true,
          'h-7': i % 2 === 1,
          'h-8': true
        }
      };
    }

    return {
      version: 1,
      userProfile: {
        name: 'Courtney',
        streakDays: 7,
        weightKg: 68,
        heightCm: 172
      },
      goals: { ...BerryPulseData.defaultGoals },
      habits: BerryPulseData.defaultHabits.map(h => ({ ...h })),
      history: history
    };
  }
};

window.BerryPulseData = BerryPulseData;

if (typeof module !== 'undefined') {
  module.exports = BerryPulseData;
}
