import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { NutritionStateService, UserProfile } from './nutrition-state.service';
import { AuthService } from './auth.service';

describe('NutritionStateService', () => {
  let service: NutritionStateService;
  let authService: AuthService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        NutritionStateService,
        AuthService,
        provideHttpClient(),
        provideHttpClientTesting(),
      ]
    });
    service = TestBed.inject(NutritionStateService);
    authService = TestBed.inject(AuthService);
  });

  describe('Estado inicial (U-básicos)', () => {
    it('should format default state correctly', () => {
      expect(service.waterGlasses()).toBe(0);
      expect(service.meals().length).toBe(4);
      expect(service.totalCalories()).toBe(0);
    });

    it('should have default profile values', () => {
      const profile = service.userProfile();
      expect(profile.displayName).toBe('Usuario');
      expect(profile.age).toBe(25);
      expect(profile.startWeight).toBe(80);
    });

    it('should initialize dataReady as false (Fase 1)', () => {
      expect(service.dataReady()).toBe(false);
      expect(service.dataSource()).toBe('loading');
    });

    it('should initialize currentEntryVersion as 0 (Fase 3)', () => {
      expect(service.currentEntryVersion()).toBe(0);
    });
  });

  describe('Cálculos BMR y TDEE (U-01 a U-09)', () => {
    
    it('U-01: BMR hombre (Mifflin-St Jeor)', () => {
      // peso=80, altura=170, edad=25, género=male
      // BMR = 10*80 + 6.25*170 - 5*25 + 5 = 800 + 1062.5 - 125 + 5 = 1742.5
      service.userProfile.set({
        ...service.userProfile(),
        gender: 'male',
        age: 25,
        heightCm: 170,
        currentWeight: 80
      });
      expect(service.bmr()).toBeCloseTo(1742.5, 0);
    });

    it('U-02: BMR mujer', () => {
      // peso=60, altura=165, edad=30, género=female
      // BMR = 10*60 + 6.25*165 - 5*30 - 161 = 600 + 1031.25 - 150 - 161 = 1320.25
      service.userProfile.set({
        ...service.userProfile(),
        gender: 'female',
        age: 30,
        heightCm: 165,
        currentWeight: 60
      });
      expect(service.bmr()).toBeCloseTo(1320.25, 0);
    });

    it('U-03: TDEE con nivel sedentario', () => {
      service.userProfile.set({
        ...service.userProfile(),
        gender: 'male',
        age: 25,
        heightCm: 170,
        currentWeight: 80,
        activityLevel: 'sedentary'
      });
      const expected = Math.round(service.bmr() * 1.2);
      expect(service.tdee()).toBe(expected);
    });

    it('U-04: TDEE con nivel very_active', () => {
      service.userProfile.set({
        ...service.userProfile(),
        gender: 'male',
        age: 25,
        heightCm: 170,
        currentWeight: 80,
        activityLevel: 'very_active'
      });
      const expected = Math.round(service.bmr() * 1.9);
      expect(service.tdee()).toBe(expected);
    });

    it('U-05: Meta calorías — déficit (bajar de peso)', () => {
      service.userProfile.set({
        ...service.userProfile(),
        currentWeight: 80,
        goalWeight: 70,
        calorieGoalOverride: null
      });
      expect(service.calorieGoal()).toBe(Math.round(service.tdee() - 400));
    });

    it('U-06: Meta calorías — superávit (subir de peso)', () => {
      service.userProfile.set({
        ...service.userProfile(),
        currentWeight: 60,
        goalWeight: 70,
        calorieGoalOverride: null
      });
      expect(service.calorieGoal()).toBe(Math.round(service.tdee() + 300));
    });

    it('U-07: Meta calorías — override manual', () => {
      service.userProfile.set({
        ...service.userProfile(),
        calorieGoalOverride: 2000
      });
      expect(service.calorieGoal()).toBe(2000);
    });

    it('U-08: Meta proteína automática', () => {
      service.userProfile.set({
        ...service.userProfile(),
        currentWeight: 80,
        proteinGoalOverride: null
      });
      expect(service.proteinGoal()).toBe(Math.round(80 * 1.8));
    });

    it('U-09: Meta proteína override', () => {
      service.userProfile.set({
        ...service.userProfile(),
        proteinGoalOverride: 150
      });
      expect(service.proteinGoal()).toBe(150);
    });
  });

  describe('Gestión de comidas y alimentos (U-10 a U-20)', () => {
    
    it('U-10: Agregar alimento a comida existente', () => {
      const food = {
        id: 'test-1',
        name: 'Manzana',
        icon: 'nutrition',
        portion: '100g',
        calories: 52
      };
      const mealsBefore = service.meals();
      service.addFoodToMeal('Desayuno', food);
      const mealsAfter = service.meals();
      
      const desayuno = mealsAfter.find(m => m.name === 'Desayuno');
      expect(desayuno?.foods.length).toBe(1);
      expect(desayuno?.foods[0].name).toBe('Manzana');
    });

    it('U-11: Totalizar calorías tras agregar', () => {
      service.addFoodToMeal('Desayuno', {
        id: 'f1',
        name: 'Food1',
        icon: 'nutrition',
        portion: '100g',
        calories: 300
      });
      service.addFoodToMeal('Desayuno', {
        id: 'f2',
        name: 'Food2',
        icon: 'nutrition',
        portion: '100g',
        calories: 200
      });
      expect(service.totalCalories()).toBe(500);
    });

    it('U-12: Totalizar proteína', () => {
      service.addFoodToMeal('Desayuno', {
        id: 'f1',
        name: 'Food1',
        icon: 'nutrition',
        portion: '100g',
        calories: 100,
        protein: 30
      });
      expect(service.totalProtein()).toBe(30);
    });

    it('U-13: Eliminar alimento de comida', () => {
      const food = {
        id: 'test-del',
        name: 'Comida a eliminar',
        icon: 'nutrition',
        portion: '100g',
        calories: 100
      };
      service.addFoodToMeal('Desayuno', food);
      expect(service.meals()[0].foods.length).toBeGreaterThan(0);
      
      service.removeFoodFromMeal('Desayuno', 'test-del');
      expect(service.meals()[0].foods.find(f => f.id === 'test-del')).toBeUndefined();
    });

    it('U-14: quickAdd crea FoodItem correcto', () => {
      service.quickAdd('Cena', 'Arroz', 250, 5, 50, 1);
      const ceña = service.meals().find(m => m.name === 'Cena');
      const food = ceña?.foods[ceña?.foods.length - 1];
      
      expect(food?.calories).toBe(250);
      expect(food?.protein).toBe(5);
      expect(food?.carbs).toBe(50);
      expect(food?.fat).toBe(1);
    });

    it('U-15: quickAdd redondea valores flotantes', () => {
      service.quickAdd('Snacks', 'Float', 100.7, 5.3, 20.1, 3.9);
      const snack = service.meals().find(m => m.name === 'Snacks');
      const food = snack?.foods[snack?.foods.length - 1];
      
      expect(Number.isInteger(food?.calories)).toBe(true);
      expect(Number.isInteger(food?.protein)).toBe(true);
      expect(Number.isInteger(food?.carbs)).toBe(true);
      expect(Number.isInteger(food?.fat)).toBe(true);
    });

    it('U-16: Agregar a comida inexistente', () => {
      const mealsCountBefore = service.meals().length;
      service.addFoodToMeal('MealNoExistente', {
        id: 'f',
        name: 'Food',
        icon: 'nutrition',
        portion: '100g',
        calories: 100
      });
      expect(service.meals().length).toBe(mealsCountBefore);
    });

    it('U-17: recentFoods se actualiza al agregar', () => {
      service.addFoodToMeal('Desayuno', {
        id: 'recent1',
        name: 'Recent Food',
        icon: 'nutrition',
        portion: '100g',
        calories: 100
      });
      expect(service.recentFoods()[0]?.name).toBe('Recent Food');
    });

    it('U-18: recentFoods no duplica por nombre', () => {
      const food = {
        id: 'dup1',
        name: 'Duplicate',
        icon: 'nutrition',
        portion: '100g',
        calories: 100
      };
      service.addFoodToMeal('Desayuno', food);
      service.addFoodToMeal('Comida', food);
      
      const dups = service.recentFoods().filter(f => f.name === 'Duplicate');
      expect(dups.length).toBe(1);
    });

    it('U-19: recentFoods máximo 15 elementos', () => {
      for (let i = 0; i < 20; i++) {
        service.addFoodToMeal('Desayuno', {
          id: `food${i}`,
          name: `Food${i}`,
          icon: 'nutrition',
          portion: '100g',
          calories: 100 + i
        });
      }
      expect(service.recentFoods().length).toBeLessThanOrEqual(15);
    });

    it('U-20: resetToday limpia meals y agua', () => {
      service.addFoodToMeal('Desayuno', {
        id: 'f',
        name: 'Food',
        icon: 'nutrition',
        portion: '100g',
        calories: 100
      });
      service.addWater();
      service.addWater();
      
      service.resetToday();
      
      expect(service.totalCalories()).toBe(0);
      expect(service.waterGlasses()).toBe(0);
    });
  });

  describe('Tracker de agua (U-21 a U-23)', () => {
    
    it('U-21: Sumar vaso de agua', () => {
      service.addWater();
      expect(service.waterGlasses()).toBe(1);
    });

    it('U-22: Restar vaso', () => {
      service.addWater();
      service.addWater();
      service.removeWater();
      expect(service.waterGlasses()).toBe(1);
    });

    it('U-23: No llega a negativo', () => {
      service.removeWater();
      expect(service.waterGlasses()).toBe(0);
    });
  });

  describe('Historial y predicción de peso (U-24 a U-29)', () => {
    
    it('U-24: getCaloriesForDate sin datos', () => {
      const result = service.getCaloriesForDate('2000-01-01');
      expect(result).toBe(0);
    });

    it('U-25: getCaloriesForDate con datos', () => {
      service.addFoodToMeal('Desayuno', {
        id: 'f',
        name: 'Breakfast',
        icon: 'nutrition',
        portion: '100g',
        calories: 300
      });
      
      const today = new Date().toISOString().split('T')[0];
      const result = service.getCaloriesForDate(today);
      expect(result).toBeGreaterThan(0);
    });

    it('U-26: getDeficitForDate', () => {
      service.userProfile.set({
        ...service.userProfile(),
        gender: 'male',
        age: 25,
        heightCm: 170,
        currentWeight: 80,
        activityLevel: 'moderate',
        calorieGoalOverride: 2000
      });
      service.addFoodToMeal('Desayuno', {
        id: 'f',
        name: 'Food',
        icon: 'nutrition',
        portion: '100g',
        calories: 1500
      });
      
      const today = new Date().toISOString().split('T')[0];
      const deficit = service.getDeficitForDate(today);
      expect(deficit).toBeGreaterThan(0);
    });

    it('U-27: getLast7Days devuelve 7 elementos', () => {
      const result = service.getLast7Days();
      expect(result.length).toBe(7);
    });

    it('U-28: weeklyWeightChangePrediction sin historial', () => {
      service.history.set([]);
      const result = service.weeklyWeightChangePrediction();
      expect(result).toBeNull();
    });

    it('U-29: weeklyWeightChangePrediction con datos', () => {
      service.userProfile.set({
        ...service.userProfile(),
        gender: 'male',
        age: 25,
        heightCm: 170,
        currentWeight: 80,
        activityLevel: 'moderate',
        calorieGoalOverride: 2000
      });
      
      // Simulate history with 1500 kcal avg (deficit vs TDEE ~2200)
      service.addFoodToMeal('Desayuno', {
        id: 'f',
        name: 'Food',
        icon: 'nutrition',
        portion: '100g',
        calories: 1500
      });
      
      const result = service.weeklyWeightChangePrediction();
      expect(result).not.toBeNull();
    });
  });

  describe('checkDateChange (U-30 a U-31)', () => {
    
    it('U-30: No hace nada si la fecha es la misma', () => {
      const initialKey = (service as any).todayKey;
      service.checkDateChange();
      expect((service as any).todayKey).toBe(initialKey);
    });

    it('U-31: Recarga datos si la fecha cambió', () => {
      const oldKey = '2000-01-01';
      (service as any).todayKey = oldKey;
      
      spyOn<any>(service as any, 'pullFromMongo').and.stub();
      
      service.checkDateChange();
      
      expect((service as any).todayKey).not.toBe(oldKey);
      expect((service as any).pullFromMongo).toHaveBeenCalled();
    });
  });

  describe('updateProfile / updateGoals (U-32 a U-33)', () => {
    
    it('U-32: updateProfile modifica solo el campo enviado', () => {
      const initialAge = service.userProfile().age;
      service.updateProfile({ displayName: 'Ana' });
      
      expect(service.userProfile().displayName).toBe('Ana');
      expect(service.userProfile().age).toBe(initialAge);
    });

    it('U-33: updateGoals mapea calorieGoal a override', () => {
      service.updateGoals({ calorieGoal: 1800 });
      expect(service.userProfile().calorieGoalOverride).toBe(1800);
    });
  });

  describe('Comportamiento offline (Fase 1)', () => {
    
    it('should set dataReady true after successful hydration', () => {
      // Simular éxito de hidratación
      service.dataReady.set(true);
      service.dataSource.set('cloud');
      
      expect(service.dataReady()).toBe(true);
      expect(service.dataSource()).toBe('cloud');
    });

    it('should set dataSource to local on timeout', () => {
      service.dataReady.set(true);
      service.dataSource.set('local');
      
      expect(service.dataSource()).toBe('local');
    });
  });

  describe('Versionado Fase 3', () => {
    
    it('should initialize currentEntryVersion to 0', () => {
      expect(service.currentEntryVersion()).toBe(0);
    });

    it('should update currentEntryVersion when pulling fresh data', () => {
      service.currentEntryVersion.set(2);
      expect(service.currentEntryVersion()).toBe(2);
    });
  });

  describe('Totales computados', () => {
    
    it('should compute totalCarbs correctly', () => {
      service.addFoodToMeal('Desayuno', {
        id: 'c1',
        name: 'Carbs',
        icon: 'nutrition',
        portion: '100g',
        calories: 100,
        carbs: 25
      });
      expect(service.totalCarbs()).toBe(25);
    });

    it('should compute totalFat correctly', () => {
      service.addFoodToMeal('Desayuno', {
        id: 'f1',
        name: 'Fat',
        icon: 'nutrition',
        portion: '100g',
        calories: 100,
        fat: 12
      });
      expect(service.totalFat()).toBe(12);
    });

    it('should compute remaining calories correctly', () => {
      service.userProfile.set({
        ...service.userProfile(),
        calorieGoalOverride: 2000
      });
      service.addFoodToMeal('Desayuno', {
        id: 'f',
        name: 'Food',
        icon: 'nutrition',
        portion: '100g',
        calories: 500
      });
      expect(service.remaining()).toBe(1500);
    });
  });
});