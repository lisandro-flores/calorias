import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HeroSummaryComponent } from './hero-summary.component';
import { NutritionStateService } from '../services/nutrition-state.service';
import { signal } from '@angular/core';

describe('HeroSummaryComponent', () => {
  let component: HeroSummaryComponent;
  let fixture: ComponentFixture<HeroSummaryComponent>;
  let mockNutritionState: any;

  beforeEach(async () => {
    mockNutritionState = {
      remaining: signal(1500),
      totalCalories: signal(1000),
      calorieGoal: signal(2500),
      tdee: signal(2500),
      totalProtein: signal(50),
      totalCarbs: signal(100),
      totalFat: signal(40),
      goals: signal({ proteinGoal: 100, carbGoal: 200, fatGoal: 80 })
    };

    await TestBed.configureTestingModule({
      imports: [HeroSummaryComponent],
      providers: [
        { provide: NutritionStateService, useValue: mockNutritionState }
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(HeroSummaryComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should calculate proteinPercent correctly', () => {
    expect(component.proteinPercent()).toBe(50);
  });

  it('should calculate carbsPercent correctly', () => {
    expect(component.carbsPercent()).toBe(50);
  });

  it('should calculate fatPercent correctly', () => {
    expect(component.fatPercent()).toBe(50);
  });

  it('should handle zero carb goal', () => {
    mockNutritionState.goals.set({ proteinGoal: 100, carbGoal: 0, fatGoal: 80 });
    expect(component.carbsPercent()).toBe(0);
  });

  it('should handle zero fat goal', () => {
    mockNutritionState.goals.set({ proteinGoal: 100, carbGoal: 200, fatGoal: 0 });
    expect(component.fatPercent()).toBe(0);
  });

  it('should cap percentages at 100', () => {
    mockNutritionState.totalProtein.set(150);
    expect(component.proteinPercent()).toBe(100);
  });

  it('should calculate dashoffset correctly', () => {
    // 1000 / 2500 = 0.4
    // dashoffset = circumference * (1 - 0.4) = circumference * 0.6
    expect(component.dashoffset()).toBe(component.circumference * 0.6);
  });

  it('should detect when isOver is true', () => {
    expect(component.isOver()).toBeFalse();
    mockNutritionState.totalCalories.set(3000);
    expect(component.isOver()).toBeTrue();
  });

  it('should update animatedDashoffset on init', (done) => {
    setTimeout(() => {
      expect(component.animatedDashoffset()).toBe(component.dashoffset());
      done();
    }, 150);
  });
});
