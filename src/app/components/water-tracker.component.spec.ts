import { ComponentFixture, TestBed } from '@angular/core/testing';
import { WaterTrackerComponent } from './water-tracker.component';
import { NutritionStateService } from '../services/nutrition-state.service';
import { signal } from '@angular/core';

describe('WaterTrackerComponent', () => {
  let component: WaterTrackerComponent;
  let fixture: ComponentFixture<WaterTrackerComponent>;
  let mockNutritionState: any;

  beforeEach(async () => {
    mockNutritionState = {
      waterGlasses: signal(2),
      goals: signal({ waterGoal: 8 }),
      addWater: jasmine.createSpy('addWater'),
      removeWater: jasmine.createSpy('removeWater')
    };

    await TestBed.configureTestingModule({
      imports: [WaterTrackerComponent],
      providers: [
        { provide: NutritionStateService, useValue: mockNutritionState }
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(WaterTrackerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should generate water dots array based on goal', () => {
    expect(component.waterDots.length).toBe(8);
    expect(component.waterDots).toEqual([0, 1, 2, 3, 4, 5, 6, 7]);
  });

  it('should call addWater on state service when addWater is invoked', async () => {
    await component.addWater();
    expect(mockNutritionState.addWater).toHaveBeenCalled();
  });

  it('should call removeWater on state service when removeWater is invoked', async () => {
    await component.removeWater();
    expect(mockNutritionState.removeWater).toHaveBeenCalled();
  });
});
