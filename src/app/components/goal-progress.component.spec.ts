import { ComponentFixture, TestBed } from '@angular/core/testing';
import { GoalProgressComponent } from './goal-progress.component';
import { NutritionStateService } from '../services/nutrition-state.service';
import { signal } from '@angular/core';

describe('GoalProgressComponent', () => {
  let component: GoalProgressComponent;
  let fixture: ComponentFixture<GoalProgressComponent>;
  let mockNutritionState: any;

  beforeEach(async () => {
    mockNutritionState = {
      goals: signal({
        startWeight: 80,
        currentWeight: 78,
        goalWeight: 75
      })
    };

    await TestBed.configureTestingModule({
      imports: [GoalProgressComponent],
      providers: [
        { provide: NutritionStateService, useValue: mockNutritionState }
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(GoalProgressComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should show weight section if start and goal weight are > 0', () => {
    expect(component.showWeight()).toBeTrue();
  });

  it('should hide weight section if start weight is 0', () => {
    mockNutritionState.goals.set({ startWeight: 0, currentWeight: 78, goalWeight: 75 });
    expect(component.showWeight()).toBeFalse();
  });

  it('should calculate weightLost correctly', () => {
    expect(component.weightLost()).toBe(2);
  });

  it('should calculate weightProgress correctly', () => {
    // start 80, goal 75, total = 5
    // lost = 80 - 78 = 2
    // progress = (2 / 5) * 100 = 40
    expect(component.weightProgress()).toBe(40);
  });

  it('should handle zero or negative total weight to lose', () => {
    mockNutritionState.goals.set({ startWeight: 80, currentWeight: 80, goalWeight: 85 });
    expect(component.weightProgress()).toBe(0);
  });

  it('should cap weightProgress at 100', () => {
    mockNutritionState.goals.set({ startWeight: 80, currentWeight: 70, goalWeight: 75 });
    expect(component.weightProgress()).toBe(100);
  });
});
