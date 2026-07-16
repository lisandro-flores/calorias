import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CoachComponent } from './coach.component';
import { AiService } from '../services/ai.service';
import { NutritionStateService } from '../services/nutrition-state.service';
import { of, throwError } from 'rxjs';

describe('CoachComponent', () => {
  let component: CoachComponent;
  let fixture: ComponentFixture<CoachComponent>;
  let mockAiService: any;
  let mockNutritionState: any;

  beforeEach(async () => {
    mockAiService = {
      getCoachAdvice: jasmine.createSpy('getCoachAdvice').and.returnValue(of({ advice: 'test advice' }))
    };

    mockNutritionState = {
      userProfile: jasmine.createSpy('userProfile').and.returnValue({}),
      meals: jasmine.createSpy('meals').and.returnValue([]),
      history: jasmine.createSpy('history').and.returnValue([
        { date: '2023-10-01' },
        { date: '2023-10-02' }
      ])
    };

    await TestBed.configureTestingModule({
      imports: [CoachComponent],
      providers: [
        { provide: AiService, useValue: mockAiService },
        { provide: NutritionStateService, useValue: mockNutritionState }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(CoachComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should fetch advice and set html', async () => {
    await component.getAdvice();
    expect(mockAiService.getCoachAdvice).toHaveBeenCalled();
    // adviceHtml should contain parsed HTML paragraph tag (from marked)
    expect(component.adviceHtml()).toContain('<p>test advice</p>');
    expect(component.isLoading()).toBeFalse();
  });

  it('should handle error when fetching advice', async () => {
    mockAiService.getCoachAdvice.and.returnValue(throwError(() => new Error('Error')));
    await component.getAdvice();
    expect(component.errorMsg()).toContain('No se pudo obtener el consejo');
    expect(component.isLoading()).toBeFalse();
  });
});
