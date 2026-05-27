import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { NutritionStateService } from './nutrition-state.service';

describe('NutritionStateService', () => {
  let service: NutritionStateService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        NutritionStateService,
        provideHttpClient(),
        provideHttpClientTesting(),
      ]
    });
    service = TestBed.inject(NutritionStateService);
  });

  it('should format default state correctly', () => {
    expect(service.waterGlasses()).toBe(0);
    expect(service.meals().length).toBe(4);
    expect(service.totalCalories()).toBe(0);
  });

  it('should increase and decrease water properly', () => {
    service.addWater();
    expect(service.waterGlasses()).toBe(1);
    service.addWater();
    service.removeWater();
    expect(service.waterGlasses()).toBe(1);
  });

  it('should not allow negative water count', () => {
    service.removeWater();
    expect(service.waterGlasses()).toBe(0);
  });

  it('should reload today data when the date changes', () => {
    const todayKey = new Date().toISOString().split('T')[0];
    const meals = [
      { name: 'Desayuno', icon: 'partly-sunny-outline', foods: [] },
      { name: 'Comida', icon: 'sunny-outline', foods: [] },
      { name: 'Cena', icon: 'moon-outline', foods: [] },
      { name: 'Snacks', icon: 'fast-food-outline', foods: [] },
    ];

    localStorage.setItem(`meals_${todayKey}`, JSON.stringify(meals));
    localStorage.setItem(`water_${todayKey}`, JSON.stringify(5));

    (service as any).todayKey = '2000-01-01';
    spyOn<any>(service as any, 'pullFromMongo').and.stub();

    service.checkDateChange();

    expect((service as any).todayKey).toBe(todayKey);
    expect(service.waterGlasses()).toBe(5);
    expect(service.meals()).toEqual(meals);
    expect((service as any).pullFromMongo).toHaveBeenCalled();
  });
});