import { ComponentFixture, TestBed } from '@angular/core/testing';
import { IonicModule, ToastController } from '@ionic/angular';
import { CameraComponent } from './camera.component';
import { NutritionStateService } from '../services/nutrition-state.service';

describe('CameraComponent', () => {
  let component: CameraComponent;
  let fixture: ComponentFixture<CameraComponent>;
  let nutritionState: jasmine.SpyObj<NutritionStateService>;
  let toastCtrl: jasmine.SpyObj<ToastController>;

  beforeEach(async () => {
    nutritionState = jasmine.createSpyObj('NutritionStateService', ['quickAdd', 'meals']);
    nutritionState.meals.and.returnValue([
      { name: 'Desayuno', icon: 'partly-sunny-outline', foods: [] },
      { name: 'Comida', icon: 'sunny-outline', foods: [] },
      { name: 'Cena', icon: 'moon-outline', foods: [] },
    ] as any);

    const toastMock = jasmine.createSpyObj('Toast', ['present']);
    toastCtrl = jasmine.createSpyObj('ToastController', ['create']);
    toastCtrl.create.and.returnValue(Promise.resolve(toastMock));

    await TestBed.configureTestingModule({
      imports: [CameraComponent, IonicModule.forRoot()],
      providers: [
        { provide: NutritionStateService, useValue: nutritionState },
        { provide: ToastController, useValue: toastCtrl },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(CameraComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('crea un preset rápido y guarda en una comida', async () => {
    component.applyPreset({
      meal: 'Comida',
      name: 'Arroz con pollo',
      portion: '1 plato',
      calories: 420,
      protein: 28,
      carbs: 42,
      fat: 11,
    });

    await component.saveQuickCapture();

    expect(nutritionState.quickAdd).toHaveBeenCalledWith('Comida', 'Arroz con pollo', 420, 28, 42, 11);
    expect(component.foodName).toBe('');
    expect(component.calories).toBe('');
  });
});
