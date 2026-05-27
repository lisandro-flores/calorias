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
});