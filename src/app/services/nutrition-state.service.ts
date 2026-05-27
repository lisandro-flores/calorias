import { Injectable, signal, computed, effect, inject } from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { AuthService } from './auth.service';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { ToastController } from '@ionic/angular';

export interface FoodItem {
  id: string;
  name: string;
  icon: string;
  portion: string;
  calories: number;
  protein?: number;
  carbs?: number;
  fat?: number;
}

export interface Meal {
  name: string;
  icon: string;
  foods: FoodItem[];
}

export interface DayLog {
  date: string; // YYYY-MM-DD
  meals: Meal[];
  waterGlasses: number;
}

export type SyncStatus = 'pending' | 'syncing' | 'synced' | 'error';

export type Gender = 'male' | 'female';
export type ActivityLevel = 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active';

export interface UserProfile {
  displayName: string;
  age: number;
  gender: Gender;
  heightCm: number;
  startWeight: number;
  currentWeight: number;
  goalWeight: number;
  activityLevel: ActivityLevel;
  calorieGoalOverride: number | null;
  proteinGoalOverride: number | null;
  waterGoal: number;
}

export interface UserGoals {
  calorieGoal: number;
  proteinGoal: number;
  waterGoal: number;
  startWeight: number;
  currentWeight: number;
  goalWeight: number;
}

const ACTIVITY_MULTIPLIERS: Record<ActivityLevel, number> = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  active: 1.725,
  very_active: 1.9,
};

const DEFAULT_PROFILE: UserProfile = {
  displayName: 'Usuario',
  age: 25,
  gender: 'male',
  heightCm: 170,
  startWeight: 80,
  currentWeight: 80,
  goalWeight: 70,
  activityLevel: 'moderate',
  calorieGoalOverride: null,
  proteinGoalOverride: null,
  waterGoal: 8,
};

const DEFAULT_MEALS: Meal[] = [
  { name: 'Desayuno', icon: 'partly-sunny-outline', foods: [] },
  { name: 'Comida', icon: 'sunny-outline', foods: [] },
  { name: 'Cena', icon: 'moon-outline', foods: [] },
  { name: 'Snacks', icon: 'fast-food-outline', foods: [] },
];

@Injectable({
  providedIn: 'root'
})
export class NutritionStateService {

  // ─── Today's date key ───
  private todayKey = this.getDateKey(new Date());

  // ─── Signals ───
  meals = signal<Meal[]>(this.loadTodayMeals());
  waterGlasses = signal<number>(this.loadTodayWater());
  userProfile = signal<UserProfile>(this.loadProfile());
  recentFoods = signal<FoodItem[]>(this.loadRecentFoods());
  history = signal<DayLog[]>(this.loadHistory());
  syncStatus = signal<SyncStatus>('synced');

  syncStatusLabel = computed(() => {
    const status = this.syncStatus();
    if (status === 'pending') return 'Pendiente';
    if (status === 'syncing') return 'Sincronizando';
    if (status === 'error') return 'Error de sync';
    return 'Sincronizado';
  });

  syncStatusIcon = computed(() => {
    const status = this.syncStatus();
    if (status === 'pending') return 'time-outline';
    if (status === 'syncing') return 'sync-outline';
    if (status === 'error') return 'alert-circle-outline';
    return 'cloud-done-outline';
  });

  // ─── BMR / TDEE (Mifflin-St Jeor) ───
  bmr = computed(() => {
    const p = this.userProfile();
    const w = p.currentWeight;
    const h = p.heightCm;
    const a = p.age;
    if (p.gender === 'male') {
      return 10 * w + 6.25 * h - 5 * a + 5;
    } else {
      return 10 * w + 6.25 * h - 5 * a - 161;
    }
  });

  tdee = computed(() => {
    const mult = ACTIVITY_MULTIPLIERS[this.userProfile().activityLevel];
    return Math.round(this.bmr() * mult);
  });

  calorieGoal = computed(() => {
    const p = this.userProfile();
    if (p.calorieGoalOverride !== null) return p.calorieGoalOverride;
    const diff = p.currentWeight - p.goalWeight;
    if (diff > 1) return Math.round(this.tdee() - 400);
    if (diff < -1) return Math.round(this.tdee() + 300);
    return this.tdee();
  });

  proteinGoal = computed(() => {
    const p = this.userProfile();
    if (p.proteinGoalOverride !== null) return p.proteinGoalOverride;
    return Math.round(p.currentWeight * 1.8);
  });

  waterGoal = computed(() => this.userProfile().waterGoal);

  goals = computed<UserGoals>(() => ({
    calorieGoal: this.calorieGoal(),
    proteinGoal: this.proteinGoal(),
    waterGoal: this.waterGoal(),
    startWeight: this.userProfile().startWeight,
    currentWeight: this.userProfile().currentWeight,
    goalWeight: this.userProfile().goalWeight,
  }));

  totalCalories = computed(() =>
    this.meals().reduce((acc, meal) =>
      acc + meal.foods.reduce((sum, f) => sum + f.calories, 0), 0)
  );

  totalProtein = computed(() =>
    this.meals().reduce((acc, meal) =>
      acc + meal.foods.reduce((sum, f) => sum + (f.protein || 0), 0), 0)
  );

  totalCarbs = computed(() =>
    this.meals().reduce((acc, meal) =>
      acc + meal.foods.reduce((sum, f) => sum + (f.carbs || 0), 0), 0)
  );

  totalFat = computed(() =>
    this.meals().reduce((acc, meal) =>
      acc + meal.foods.reduce((sum, f) => sum + (f.fat || 0), 0), 0)
  );

  remaining = computed(() => this.calorieGoal() - this.totalCalories());

  weeklyWeightChangePrediction = computed(() => {
    const weekHistory = this.getLast7Days().filter(d => d.calories > 0);
    if (weekHistory.length === 0) return null;
    const avgCals = weekHistory.reduce((s, d) => s + d.calories, 0) / weekHistory.length;
    const dailyDeficit = this.tdee() - avgCals;
    const weeklyKg = (dailyDeficit * 7) / 7700;
    return weeklyKg;
  });

  // ─── Persistence effects ───
  private http = inject(HttpClient);
  private authService = inject(AuthService);
  private toastCtrl = inject(ToastController);
  private document = inject(DOCUMENT);
  private syncTimeout: any;
  private profileSyncTimeout: any;
  private midnightTimeout: ReturnType<typeof setTimeout> | null = null;
  private refreshInterval: ReturnType<typeof setInterval> | null = null;
  private isSyncing = false;
  private isHydrating = true;
  private initialHydrationStepsRemaining = 3;

  constructor() {
    this.pullFromMongo(true);
    this.pullProfileFromMongo(true);
    this.pullHistoryFromMongo(true);
    this.scheduleNextDateCheck();

    if (typeof window !== 'undefined') {
      window.addEventListener('focus', this.handleVisibilityOrFocusChange);
      window.addEventListener('online', this.handleVisibilityOrFocusChange);
    }

    this.document.addEventListener('visibilitychange', this.handleVisibilityOrFocusChange);

    this.refreshInterval = setInterval(() => {
      const user = this.authService.currentUser();
      if (!user || user.id === 'offline_mode') return;
      if (this.document.hidden) return;
      if (this.isHydrating || this.isSyncing || this.syncStatus() === 'pending') return;
      this.refreshFromServer();
    }, 20000);

    effect(() => {
      const user = this.authService.currentUser();
      if (user && user.id !== 'offline_mode') {
        this.pullFromMongo();
        this.pullProfileFromMongo();
        this.pullHistoryFromMongo();
      }
    });

    effect(() => {
      const m = this.meals();
      localStorage.setItem(`meals_${this.todayKey}`, JSON.stringify(m));
      this.saveTodayToHistory();
      if (!this.isSyncing && !this.isHydrating) {
        this.syncToMongo();
      }
    });
    effect(() => {
      const w = this.waterGlasses();
      localStorage.setItem(`water_${this.todayKey}`, JSON.stringify(w));
      if (!this.isSyncing && !this.isHydrating) {
        this.syncToMongo();
      }
    });
    effect(() => {
      const profile = this.userProfile();
      localStorage.setItem('user_profile', JSON.stringify(profile));
      if (!this.isSyncing && !this.isHydrating) {
        this.syncProfileToMongo();
      }
    });
    effect(() => {
      const recent = this.recentFoods().slice(0, 15);
      localStorage.setItem('recent_foods', JSON.stringify(recent));
      if (!this.isSyncing && !this.isHydrating) {
        this.syncProfileToMongo();
      }
    });
  }

  /** Verifica si la fecha cambió (ej. la app estuvo abierta pasada la medianoche) */
  checkDateChange() {
    const newKey = this.getDateKey(new Date());
    if (newKey !== this.todayKey) {
      this.todayKey = newKey;
      this.meals.set(this.loadTodayMeals());
      this.waterGlasses.set(this.loadTodayWater());
      this.pullFromMongo();
    }
  }

  private handleVisibilityOrFocusChange = () => {
    this.checkDateChange();
    this.refreshFromServer();
    this.scheduleNextDateCheck();
  };

  private refreshFromServer() {
    this.pullFromMongo();
    this.pullProfileFromMongo();
    this.pullHistoryFromMongo();
  }

  private finishInitialHydrationStep() {
    if (!this.isHydrating) return;
    this.initialHydrationStepsRemaining = Math.max(0, this.initialHydrationStepsRemaining - 1);
    if (this.initialHydrationStepsRemaining === 0) {
      this.isHydrating = false;
    }
  }

  private scheduleNextDateCheck() {
    if (this.midnightTimeout) {
      clearTimeout(this.midnightTimeout);
    }

    const now = new Date();
    const nextUtcMidnight = Date.UTC(
      now.getUTCFullYear(),
      now.getUTCMonth(),
      now.getUTCDate() + 1,
      0,
      0,
      0,
      0,
    );
    const delay = Math.max(nextUtcMidnight - now.getTime(), 1000);

    this.midnightTimeout = setTimeout(() => {
      this.checkDateChange();
      this.scheduleNextDateCheck();
    }, delay);
  }

  private syncProfileToMongo() {
    const user = this.authService.currentUser();
    if (!user || user.id === 'offline_mode') return;

    if (this.profileSyncTimeout) {
      clearTimeout(this.profileSyncTimeout);
    }

    const profile = this.userProfile();

    this.profileSyncTimeout = setTimeout(() => {
      this.http.patch(`${environment.apiUrl}/auth/profile`, {
        userId: user.id,
        profile,
        recentFoods: this.recentFoods().slice(0, 15),
      }).subscribe({
        next: () => {
          console.log('Perfil sincronizado con MongoDB');
        },
        error: (err) => console.error('Error sincronizando perfil con MongoDB', err)
      });
    }, 1500);
  }

  private syncToMongo() {
    const user = this.authService.currentUser();
    if (!user || user.id === 'offline_mode') {
      this.syncStatus.set('synced');
      return;
    }

    if (this.syncTimeout) {
      clearTimeout(this.syncTimeout);
    }

    this.syncTimeout = setTimeout(() => {
      this.syncStatus.set('syncing');
      this.http.post(`${environment.apiUrl}/entries/sync`, {
        userId: user.id,
        date: this.todayKey,
        meals: this.meals(),
        waterGlasses: this.waterGlasses(),
        clientUpdatedAt: this.getTodayClientUpdatedAt(),
      }).subscribe({
        next: async () => {
          this.syncStatus.set('synced');
          console.log('Sincronizado con MongoDB');
          const toast = await this.toastCtrl.create({
            message: 'Respaldado en la nube',
            duration: 1500,
            position: 'bottom',
            color: 'dark',
            icon: 'cloud-done-outline'
          });
          toast.present();
        },
        error: (err) => {
          this.syncStatus.set('error');
          console.error('Error sincronizando con MongoDB', err);
        }
      });
    }, 2500);
  }

  private pullFromMongo(trackHydration = false) {
    const user = this.authService.currentUser();
    if (!user || user.id === 'offline_mode') {
      if (trackHydration) {
        this.finishInitialHydrationStep();
      }
      return;
    }

    this.http.get<any>(`${environment.apiUrl}/entries/day?date=${this.todayKey}&userId=${user.id}`)
      .subscribe({
        next: (res) => {
          if (res.success && res.data) {
            this.isSyncing = true;
            const serverUpdatedAt = res.data.clientUpdatedAt ?? res.data.updatedAt;
            if (serverUpdatedAt) {
              this.setClientUpdatedAtForDate(this.todayKey, serverUpdatedAt);
            }
            if (res.data.meals && res.data.meals.length > 0) {
              this.meals.set(res.data.meals);
            }
            if (res.data.waterGlasses !== undefined) {
              this.waterGlasses.set(res.data.waterGlasses);
            }
            // Defer unsetting flag so Angular processes signal effects first
            setTimeout(() => this.isSyncing = false, 0);
          }
          if (trackHydration) {
            this.finishInitialHydrationStep();
          }
        },
        error: (err) => {
          console.error('Error al recuperar datos de Mongo', err);
          if (trackHydration) {
            this.finishInitialHydrationStep();
          }
        }
      });
  }

  private pullProfileFromMongo(trackHydration = false) {
    const user = this.authService.currentUser();
    if (!user || user.id === 'offline_mode') {
      if (trackHydration) {
        this.finishInitialHydrationStep();
      }
      return;
    }

    this.http.get<any>(`${environment.apiUrl}/auth/profile?userId=${user.id}`)
      .subscribe({
        next: (res) => {
          const data = res?.data ?? res;
          if (!data) {
            if (trackHydration) {
              this.finishInitialHydrationStep();
            }
            return;
          }

          this.isSyncing = true;
          this.userProfile.set({
            ...this.userProfile(),
            displayName: data.displayName ?? data.name ?? this.userProfile().displayName,
            age: data.age ?? this.userProfile().age,
            gender: data.gender ?? this.userProfile().gender,
            heightCm: data.heightCm ?? this.userProfile().heightCm,
            startWeight: data.startWeight ?? this.userProfile().startWeight,
            currentWeight: data.currentWeight ?? this.userProfile().currentWeight,
            goalWeight: data.goalWeight ?? this.userProfile().goalWeight,
            activityLevel: data.activityLevel ?? this.userProfile().activityLevel,
            calorieGoalOverride: data.calorieGoalOverride ?? this.userProfile().calorieGoalOverride,
            proteinGoalOverride: data.proteinGoalOverride ?? this.userProfile().proteinGoalOverride,
            waterGoal: data.waterGoal ?? this.userProfile().waterGoal,
          });
          if (Array.isArray(data.recentFoods)) {
            this.recentFoods.set(data.recentFoods.slice(0, 15));
          }
          setTimeout(() => this.isSyncing = false, 0);
          if (trackHydration) {
            this.finishInitialHydrationStep();
          }
        },
        error: (err) => {
          console.error('Error al recuperar perfil de Mongo', err);
          if (trackHydration) {
            this.finishInitialHydrationStep();
          }
        }
      });
  }

  private pullHistoryFromMongo(trackHydration = false) {
    const user = this.authService.currentUser();
    if (!user || user.id === 'offline_mode') {
      if (trackHydration) {
        this.finishInitialHydrationStep();
      }
      return;
    }

    this.http.get<any>(`${environment.apiUrl}/entries/range?userId=${user.id}&days=30`)
      .subscribe({
        next: (res) => {
          const entries = res?.data ?? [];
          if (!Array.isArray(entries)) {
            if (trackHydration) {
              this.finishInitialHydrationStep();
            }
            return;
          }

          const mappedHistory: DayLog[] = entries.map((entry: any) => ({
            date: entry.date?.split('T')[0] ?? entry.date,
            meals: Array.isArray(entry.meals) ? entry.meals : [],
            waterGlasses: entry.waterGlasses ?? 0,
          }));

          if (mappedHistory.length > 0) {
            this.history.set(mappedHistory);
            localStorage.setItem('day_history', JSON.stringify(mappedHistory));
          }
          if (trackHydration) {
            this.finishInitialHydrationStep();
          }
        },
        error: (err) => {
          console.error('Error al recuperar historial de Mongo', err);
          if (trackHydration) {
            this.finishInitialHydrationStep();
          }
        }
      });
  }

  updateProfile(partial: Partial<UserProfile>) {
    this.userProfile.update(p => ({ ...p, ...partial }));
  }

  updateGoals(partial: Partial<UserGoals>) {
    this.userProfile.update(p => {
      const updated: Partial<UserProfile> = {};
      if (partial.calorieGoal !== undefined) updated.calorieGoalOverride = partial.calorieGoal;
      if (partial.proteinGoal !== undefined) updated.proteinGoalOverride = partial.proteinGoal;
      if (partial.waterGoal !== undefined) updated.waterGoal = partial.waterGoal;
      if (partial.startWeight !== undefined) updated.startWeight = partial.startWeight;
      if (partial.currentWeight !== undefined) updated.currentWeight = partial.currentWeight;
      if (partial.goalWeight !== undefined) updated.goalWeight = partial.goalWeight;
      return { ...p, ...updated };
    });
  }

  addFoodToMeal(mealName: string, food: FoodItem) {
    this.markTodayDirty();
    this.meals.update(meals => meals.map(meal => {
      if (meal.name === mealName) {
        return { ...meal, foods: [...meal.foods, food] };
      }
      return meal;
    }));
    this.addToRecent(food);
  }

  removeFoodFromMeal(mealName: string, foodId: string) {
    this.markTodayDirty();
    this.meals.update(meals => meals.map(meal => {
      if (meal.name === mealName) {
        return { ...meal, foods: meal.foods.filter(f => f.id !== foodId) };
      }
      return meal;
    }));
  }

  quickAdd(mealName: string, name: string, calories: number, protein = 0, carbs = 0, fat = 0) {
    const food: FoodItem = {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 4),
      name,
      icon: 'restaurant-outline',
      portion: `${calories} kcal`,
      calories: Math.round(calories),
      protein: Math.round(protein),
      carbs: Math.round(carbs),
      fat: Math.round(fat),
    };
    this.addFoodToMeal(mealName, food);
  }

  addWater() {
    this.markTodayDirty();
    this.waterGlasses.update(v => v + 1);
  }

  removeWater() {
    this.markTodayDirty();
    this.waterGlasses.update(v => Math.max(0, v - 1));
  }

  private addToRecent(food: FoodItem) {
    this.recentFoods.update(list => {
      const filtered = list.filter(f => f.name !== food.name);
      return [food, ...filtered].slice(0, 15);
    });
  }

  copyFromYesterday(mealName: string) {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const key = this.getDateKey(yesterday);
    const stored = localStorage.getItem(`meals_${key}`);
    if (!stored) return;
    try {
      const yesterdayMeals: Meal[] = JSON.parse(stored);
      const yesterdayMeal = yesterdayMeals.find(m => m.name === mealName);
      if (!yesterdayMeal || yesterdayMeal.foods.length === 0) return;
      const copiedFoods = yesterdayMeal.foods.map(f => ({
        ...f,
        id: Date.now().toString() + Math.random().toString(36).substr(2, 4)
      }));
      this.meals.update(meals => meals.map(meal => {
        if (meal.name === mealName) {
          this.markTodayDirty();
          return { ...meal, foods: [...meal.foods, ...copiedFoods] };
        }
        return meal;
      }));
    } catch (e) {
      console.error('Error copying from yesterday:', e);
    }
  }

  private saveTodayToHistory() {
    const todayLog: DayLog = {
      date: this.todayKey,
      meals: this.meals(),
      waterGlasses: this.waterGlasses(),
    };
    this.history.update(h => {
      const filtered = h.filter(d => d.date !== this.todayKey);
      return [...filtered, todayLog].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 30);
    });
    localStorage.setItem('day_history', JSON.stringify(this.history()));
  }

  getCaloriesForDate(date: string): number {
    const entry = this.history().find(h => h.date === date);
    if (!entry) return 0;
    return entry.meals.reduce((acc, meal) =>
      acc + meal.foods.reduce((sum, f) => sum + f.calories, 0), 0);
  }

  getDeficitForDate(date: string): number {
    const cals = this.getCaloriesForDate(date);
    if (cals === 0) return 0;
    return this.tdee() - cals;
  }

  getLast7Days(): { date: string; calories: number; label: string; deficit: number }[] {
    const days = [];
    const dayNames = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = this.getDateKey(d);
      const calories = this.getCaloriesForDate(key);
      days.push({
        date: key,
        calories,
        label: i === 0 ? 'Hoy' : dayNames[d.getDay()],
        deficit: calories > 0 ? this.tdee() - calories : 0,
      });
    }
    return days;
  }

  resetToday() {
    this.markTodayDirty();
    this.meals.set(DEFAULT_MEALS.map(m => ({ ...m, foods: [] })));
    this.waterGlasses.set(0);
  }

  private markTodayDirty() {
    this.syncStatus.set('pending');
    this.setClientUpdatedAtForDate(this.todayKey, new Date().toISOString());
  }

  private getTodayClientUpdatedAt(): string {
    const key = this.getClientUpdatedAtStorageKey(this.todayKey);
    const stored = localStorage.getItem(key);
    if (stored) {
      return stored;
    }
    const now = new Date().toISOString();
    localStorage.setItem(key, now);
    return now;
  }

  private setClientUpdatedAtForDate(dateKey: string, value: string) {
    localStorage.setItem(this.getClientUpdatedAtStorageKey(dateKey), value);
  }

  private getClientUpdatedAtStorageKey(dateKey: string): string {
    return `entry_updated_at_${dateKey}`;
  }

  private getDateKey(date: Date): string {
    return date.toISOString().split('T')[0];
  }

  private loadTodayMeals(): Meal[] {
    if (this.shouldPreferCloudData()) {
      return DEFAULT_MEALS.map(m => ({ ...m, foods: [] }));
    }

    try {
      const stored = localStorage.getItem(`meals_${this.todayKey}`);
      if (stored) return JSON.parse(stored);
    } catch (e) {}
    return DEFAULT_MEALS.map(m => ({ ...m, foods: [] }));
  }

  private loadTodayWater(): number {
    if (this.shouldPreferCloudData()) {
      return 0;
    }

    try {
      const stored = localStorage.getItem(`water_${this.todayKey}`);
      if (stored) return JSON.parse(stored);
    } catch (e) {}
    return 0;
  }

  private loadProfile(): UserProfile {
    if (this.shouldPreferCloudData()) {
      return { ...DEFAULT_PROFILE };
    }

    try {
      const stored = localStorage.getItem('user_profile');
      if (stored) return JSON.parse(stored);
      const oldGoals = localStorage.getItem('user_goals');
      if (oldGoals) {
        const g = JSON.parse(oldGoals);
        return {
          ...DEFAULT_PROFILE,
          startWeight: g.startWeight ?? DEFAULT_PROFILE.startWeight,
          currentWeight: g.currentWeight ?? DEFAULT_PROFILE.currentWeight,
          goalWeight: g.goalWeight ?? DEFAULT_PROFILE.goalWeight,
          calorieGoalOverride: g.calorieGoal ?? null,
          proteinGoalOverride: g.proteinGoal ?? null,
          waterGoal: g.waterGoal ?? DEFAULT_PROFILE.waterGoal,
        };
      }
    } catch (e) {}
    return { ...DEFAULT_PROFILE };
  }

  private loadRecentFoods(): FoodItem[] {
    if (this.shouldPreferCloudData()) {
      return [];
    }

    try {
      const stored = localStorage.getItem('recent_foods');
      if (stored) return JSON.parse(stored);
    } catch (e) {}
    return [];
  }

  private loadHistory(): DayLog[] {
    if (this.shouldPreferCloudData()) {
      return [];
    }

    try {
      const stored = localStorage.getItem('day_history');
      if (stored) return JSON.parse(stored);
    } catch (e) {}
    return [];
  }

  private shouldPreferCloudData(): boolean {
    try {
      const stored = localStorage.getItem('current_user');
      if (!stored) return false;
      const user = JSON.parse(stored);
      return Boolean(user && user.id && user.id !== 'offline_mode');
    } catch {
      return false;
    }
  }
}
