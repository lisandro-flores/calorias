import { Injectable, signal, computed } from '@angular/core';

export interface FoodItem {
  id: string;
  name: string;
  emoji: string;
  portion: string;
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
}

export interface Meal {
  name: string;
  foods: FoodItem[];
}

@Injectable({
  providedIn: 'root'
})
export class NutritionStateService {
  // Metas estáticas
  readonly calorieGoal = 1450;
  readonly proteinGoal = 115;
  readonly carbsGoal = 130;
  readonly fatsGoal = 45;

  // Estado centralizado con Signals
  meals = signal<Meal[]>([
    { name: 'Desayuno', foods: [] },
    { name: 'Comida', foods: [] },
    { name: 'Cena', foods: [] }
  ]);

  waterGlasses = signal<number>(0);

  // Computed signals (Selectores reactivos)
  totalCalories = computed(() => {
    return this.meals().reduce((acc, meal) => 
      acc + meal.foods.reduce((sum, food) => sum + food.calories, 0), 0);
  });

  totalProtein = computed(() => {
    return this.meals().reduce((acc, meal) => 
      acc + meal.foods.reduce((sum, food) => sum + food.protein, 0), 0);
  });

  totalCarbs = computed(() => {
    return this.meals().reduce((acc, meal) => 
      acc + meal.foods.reduce((sum, food) => sum + food.carbs, 0), 0);
  });

  totalFats = computed(() => {
    return this.meals().reduce((acc, meal) => 
      acc + meal.foods.reduce((sum, food) => sum + food.fats, 0), 0);
  });

  // Acciones (Reducers)
  addWater() {
    this.waterGlasses.update(v => v + 1);
  }

  removeWater() {
    this.waterGlasses.update(v => Math.max(0, v - 1));
  }

  copyFromYesterday(mealName: string) {
    // Simulación de buscar datos de ayer (idealmente desde base de datos / IndexedDB)
    const mockYesterdayFood: FoodItem = {
      id: Date.now().toString(),
      name: 'Huevo Revuelto',
      emoji: '🍳',
      portion: '150 g',
      calories: 220,
      protein: 18,
      carbs: 2,
      fats: 15
    };

    this.meals.update(meals => meals.map(meal => {
      if (meal.name === mealName) {
        return { ...meal, foods: [...meal.foods, mockYesterdayFood] };
      }
      return meal;
    }));
  }
}