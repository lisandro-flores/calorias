import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { IonicModule, ToastController } from '@ionic/angular';
import { CameraComponent } from './camera.component';
import { NutritionStateService } from '../services/nutrition-state.service';
import { AiService, AiFoodItem } from '../services/ai.service';
import { of, throwError } from 'rxjs';

describe('CameraComponent', () => {
  let component: CameraComponent;
  let fixture: ComponentFixture<CameraComponent>;
  let aiService: jasmine.SpyObj<AiService>;
  let toastCtrl: jasmine.SpyObj<ToastController>;

  const mockMeals = [
    { name: 'Desayuno', icon: '🌅', foods: [] },
    { name: 'Comida', icon: '🍽️', foods: [] },
  ];

  const mockState = {
    meals: jasmine.createSpy('meals').and.returnValue(mockMeals),
    quickAdd: jasmine.createSpy('quickAdd'),
  };

  beforeEach(async () => {
    aiService = jasmine.createSpyObj('AiService', ['analyzeImage', 'parseMeal', 'getCoachAdvice']);
    toastCtrl = jasmine.createSpyObj('ToastController', ['create']);
    toastCtrl.create.and.returnValue(Promise.resolve({ present: () => Promise.resolve() } as any));

    await TestBed.configureTestingModule({
      imports: [CameraComponent, IonicModule.forRoot()],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: NutritionStateService, useValue: mockState },
        { provide: AiService, useValue: aiService },
        { provide: ToastController, useValue: toastCtrl },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(CameraComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should start in photo mode', () => {
    expect(component.mode()).toBe('photo');
  });

  it('should toggle to manual mode', () => {
    component.mode.set('manual');
    expect(component.mode()).toBe('manual');
  });

  it('should switch meal selection', () => {
    component.selectedMeal.set('Comida');
    expect(component.selectedMeal()).toBe('Comida');
  });

  describe('Photo mode', () => {
    it('should analyze photo and set detected foods', () => {
      const mockFoods: AiFoodItem[] = [
        { name: 'Arroz', portion: '1 taza', calories: 206, protein: 4, carbs: 45, fat: 0, icon: 'restaurant' },
      ];
      aiService.analyzeImage.and.returnValue(of(mockFoods));

      component.imagePreview.set('data:image/jpeg;base64,abc123');
      (component as any).imageBase64.set('data:image/jpeg;base64,abc123');
      component.analyzePhoto();

      expect(component.detectedFoods()).toEqual(mockFoods);
      expect(component.isAnalyzing()).toBe(false);
    });

    it('should handle analysis error', () => {
      aiService.analyzeImage.and.returnValue(throwError(() => ({ status: 500 })));

      component.imagePreview.set('data:image/jpeg;base64,abc123');
      (component as any).imageBase64.set('data:image/jpeg;base64,abc123');
      component.analyzePhoto();

      expect(component.analysisError()).toBeTruthy();
      expect(component.isAnalyzing()).toBe(false);
    });

    it('should handle rate limit error with specific message', () => {
      aiService.analyzeImage.and.returnValue(throwError(() => ({ status: 429 })));

      (component as any).imageBase64.set('data:image/jpeg;base64,abc123');
      component.analyzePhoto();

      expect(component.analysisError()).toContain('Demasiadas solicitudes');
    });

    it('should remove detected food', () => {
      component.detectedFoods.set([
        { name: 'A', portion: '1', calories: 100, protein: 5, carbs: 10, fat: 2, icon: 'restaurant' },
        { name: 'B', portion: '1', calories: 200, protein: 10, carbs: 20, fat: 5, icon: 'restaurant' },
      ]);

      component.removeDetectedFood(0);

      expect(component.detectedFoods().length).toBe(1);
      expect(component.detectedFoods()[0].name).toBe('B');
    });

    it('should save detected foods to state', async () => {
      component.detectedFoods.set([
        { name: 'Arroz', portion: '1 taza', calories: 206, protein: 4, carbs: 45, fat: 0, icon: 'restaurant' },
        { name: 'Pollo', portion: '150g', calories: 250, protein: 35, carbs: 0, fat: 12, icon: 'restaurant' },
      ]);
      component.selectedMeal.set('Comida');

      await component.saveDetectedFoods();

      expect(mockState.quickAdd).toHaveBeenCalledTimes(2);
      expect(mockState.quickAdd).toHaveBeenCalledWith('Comida', 'Arroz', 206, 4, 45, 0);
      expect(mockState.quickAdd).toHaveBeenCalledWith('Comida', 'Pollo', 250, 35, 0, 12);
      expect(component.detectedFoods().length).toBe(0);
    });

    it('should clear image state', () => {
      component.imagePreview.set('something');
      (component as any).imageBase64.set('something');
      component.detectedFoods.set([{ name: 'A', portion: '1', calories: 1, protein: 0, carbs: 0, fat: 0, icon: 'r' }]);

      component.clearImage();

      expect(component.imagePreview()).toBeNull();
      expect(component.detectedFoods().length).toBe(0);
    });

    it('should not analyze when no image', () => {
      component.analyzePhoto();
      expect(aiService.analyzeImage).not.toHaveBeenCalled();
    });
  });

  describe('Manual mode', () => {
    it('should apply preset and switch to manual', () => {
      const preset = component.presets[0];
      component.applyPreset(preset);

      expect(component.mode()).toBe('manual');
      expect(component.foodName).toBe(preset.name);
      expect(component.calories).toBe(String(preset.calories));
    });

    it('should validate canSave', () => {
      component.foodName = '';
      component.calories = '';
      expect(component.canSave()).toBe(false);

      component.foodName = 'Test';
      component.calories = '100';
      expect(component.canSave()).toBe(true);
    });

    it('should save quick capture', async () => {
      mockState.quickAdd.calls.reset();
      component.foodName = 'Arroz';
      component.calories = '200';
      component.protein = '5';
      component.selectedMeal.set('Comida');

      await component.saveQuickCapture();

      expect(mockState.quickAdd).toHaveBeenCalledWith('Comida', 'Arroz', 200, 5, 0, 0);
      expect(component.foodName).toBe('');
    });
  });
});
