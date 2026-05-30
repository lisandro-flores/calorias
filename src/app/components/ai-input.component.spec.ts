import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { IonicModule, ToastController } from '@ionic/angular';
import { FormsModule } from '@angular/forms';
import { of, throwError } from 'rxjs';
import { AiInputComponent } from './ai-input.component';
import { AiService, AiFoodItem } from '../services/ai.service';
import { NutritionStateService } from '../services/nutrition-state.service';

/** Helper: crea un AiFoodItem de prueba */
function makeAiFood(name = 'Arroz', calories = 200): AiFoodItem {
  return { name, portion: '100g', calories, protein: 5, carbs: 40, fat: 1, icon: 'restaurant' };
}

describe('AiInputComponent (I-06 a I-12)', () => {
  let component: AiInputComponent;
  let fixture: ComponentFixture<AiInputComponent>;
  let aiService: jasmine.SpyObj<AiService>;
  let nutritionState: jasmine.SpyObj<NutritionStateService>;
  let toastCtrl: jasmine.SpyObj<ToastController>;

  beforeEach(async () => {
    aiService = jasmine.createSpyObj('AiService', ['parseMeal', 'getCoachAdvice']);
    nutritionState = jasmine.createSpyObj('NutritionStateService', ['addFoodToMeal', 'meals']);
    nutritionState.meals.and.returnValue([
      { name: 'Desayuno', icon: 'partly-sunny-outline', foods: [] },
      { name: 'Comida', icon: 'sunny-outline', foods: [] },
      { name: 'Cena', icon: 'moon-outline', foods: [] },
      { name: 'Snacks', icon: 'fast-food-outline', foods: [] },
    ] as any);

    const toastMock = jasmine.createSpyObj('Toast', ['present']);
    toastCtrl = jasmine.createSpyObj('ToastController', ['create']);
    toastCtrl.create.and.returnValue(Promise.resolve(toastMock));

    await TestBed.configureTestingModule({
      imports: [AiInputComponent, IonicModule.forRoot(), FormsModule],
      providers: [
        { provide: AiService, useValue: aiService },
        { provide: NutritionStateService, useValue: nutritionState },
        { provide: ToastController, useValue: toastCtrl },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(AiInputComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => {
    fixture.destroy();
  });

  // ─────────────────────────────────────────────────────────
  // I-06: sendToAI() con text vacío NO llama al servicio
  // ─────────────────────────────────────────────────────────
  it('I-06: sendToAI() con texto vacío no invoca aiService.parseMeal', () => {
    component.userText = '';
    component.sendToAI();
    expect(aiService.parseMeal).not.toHaveBeenCalled();
  });

  it('I-06b: sendToAI() con solo espacios no invoca aiService.parseMeal', () => {
    component.userText = '   ';
    component.sendToAI();
    expect(aiService.parseMeal).not.toHaveBeenCalled();
  });

  // ─────────────────────────────────────────────────────────
  // I-07: Respuesta exitosa llena results()
  // ─────────────────────────────────────────────────────────
  it('I-07: respuesta exitosa de parseMeal llena results()', () => {
    const foods = [makeAiFood('Arroz'), makeAiFood('Pollo', 250)];
    aiService.parseMeal.and.returnValue(of(foods));

    component.userText = '50g arroz con pollo';
    component.sendToAI();

    expect(component.results().length).toBe(2);
    expect(component.results()[0].name).toBe('Arroz');
    expect(component.isLoading()).toBe(false);
  });

  // ─────────────────────────────────────────────────────────
  // I-08: Error MISSING_API_KEY activa isMissingApiKey()
  // ─────────────────────────────────────────────────────────
  it('I-08: error MISSING_API_KEY activa isMissingApiKey()', () => {
    aiService.parseMeal.and.returnValue(
      throwError(() => ({ status: 403, error: { message: 'MISSING_API_KEY' } }))
    );

    component.userText = 'tacos de bistec';
    component.sendToAI();

    expect(component.isMissingApiKey()).toBe(true);
    expect(component.isLoading()).toBe(false);
  });

  // ─────────────────────────────────────────────────────────
  // I-09: Error RATE_LIMIT_EXCEEDED muestra mensaje correcto
  // ─────────────────────────────────────────────────────────
  it('I-09: error RATE_LIMIT_EXCEEDED muestra mensaje de límite', () => {
    aiService.parseMeal.and.returnValue(
      throwError(() => ({ status: 429, error: { message: 'RATE_LIMIT_EXCEEDED' } }))
    );

    component.userText = 'pollo con arroz';
    component.sendToAI();

    expect(component.errorMsg()).toContain('límite');
    expect(component.isLoading()).toBe(false);
  });

  // ─────────────────────────────────────────────────────────
  // I-10: confirmAll() abre el picker de comidas
  // ─────────────────────────────────────────────────────────
  it('I-10: confirmAll() abre el meal picker cuando hay resultados', async () => {
    component.results.set([makeAiFood()]);
    await component.confirmAll();

    expect(component.mealPickerOpen()).toBe(true);
  });

  it('I-10b: confirmAll() no hace nada si results está vacío', async () => {
    component.results.set([]);
    await component.confirmAll();

    expect(component.mealPickerOpen()).toBe(false);
  });

  // ─────────────────────────────────────────────────────────
  // I-11: addAllToMeal agrega todos los foods al servicio
  // ─────────────────────────────────────────────────────────
  it('I-11: addAllToMeal() llama addFoodToMeal N veces y cierra el picker', async () => {
    const foods = [makeAiFood('Arroz'), makeAiFood('Frijoles', 120)];
    component.results.set(foods);
    await component.confirmAll(); // abre el picker y guarda pendingFoods

    await component.addAllToMeal('Desayuno');

    expect(nutritionState.addFoodToMeal).toHaveBeenCalledTimes(2);
    expect(nutritionState.addFoodToMeal).toHaveBeenCalledWith('Desayuno', jasmine.objectContaining({ name: 'Arroz' }));
    expect(component.mealPickerOpen()).toBe(false);
    expect(component.results().length).toBe(0);
  });

  // ─────────────────────────────────────────────────────────
  // I-12: clearResults() limpia results y errorMsg
  // ─────────────────────────────────────────────────────────
  it('I-12: clearResults() limpia results, errorMsg e isMissingApiKey', () => {
    component.results.set([makeAiFood()]);
    component['errorMsg'].set('Algún error');
    component['isMissingApiKey'].set(true);

    component.clearResults();

    expect(component.results().length).toBe(0);
    expect(component['errorMsg']()).toBe('');
    expect(component['isMissingApiKey']()).toBe(false);
  });

  // ─────────────────────────────────────────────────────────
  // Extra: toggle abre y cierra el panel
  // ─────────────────────────────────────────────────────────
  it('toggle() alterna el estado isOpen', () => {
    expect(component.isOpen()).toBe(false);
    component.toggle();
    expect(component.isOpen()).toBe(true);
    component.toggle();
    expect(component.isOpen()).toBe(false);
  });

  it('cancelMealPicker() cierra el picker y limpia pendingFoods', () => {
    component.mealPickerOpen.set(true);
    (component as any).pendingFoods = [makeAiFood()];

    component.cancelMealPicker();

    expect(component.mealPickerOpen()).toBe(false);
    expect((component as any).pendingFoods.length).toBe(0);
  });

  it('useExample() rellena el textarea con el texto del ejemplo', () => {
    component.useExample('2 tacos de bistec');
    expect(component.userText).toBe('2 tacos de bistec');
  });

  it('error de conexión (status=0) muestra mensaje de servidor', () => {
    aiService.parseMeal.and.returnValue(
      throwError(() => ({ status: 0, error: {} }))
    );

    component.userText = 'algo';
    component.sendToAI();

    expect(component.errorMsg()).toContain('servidor');
  });
});
