import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { IonicModule } from '@ionic/angular';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { of, throwError } from 'rxjs';
import { FoodSearchComponent } from './food-search.component';
import { OpenFoodFactsService, OffProduct } from '../services/open-food-facts.service';
import { NutritionStateService } from '../services/nutrition-state.service';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';

/** Crea un OffProduct de prueba con valores por defecto sobreescribibles */
function makeProduct(overrides: Partial<OffProduct> = {}): OffProduct {
  return {
    code: '0001',
    product_name: 'Arroz',
    nutriments: {
      'energy-kcal_100g': 100,
      'proteins_100g': 2,
      'carbohydrates_100g': 22,
      'fat_100g': 0.5,
    },
    ...overrides,
  };
}

describe('FoodSearchComponent (I-01 a I-05)', () => {
  let component: FoodSearchComponent;
  let fixture: ComponentFixture<FoodSearchComponent>;
  let offService: jasmine.SpyObj<OpenFoodFactsService>;
  let nutritionState: jasmine.SpyObj<NutritionStateService>;

  beforeEach(async () => {
    offService = jasmine.createSpyObj('OpenFoodFactsService', ['searchProducts']);
    nutritionState = jasmine.createSpyObj('NutritionStateService', ['addFoodToMeal', 'meals']);
    nutritionState.meals.and.returnValue([
      { name: 'Desayuno', icon: 'partly-sunny-outline', foods: [] },
      { name: 'Comida', icon: 'sunny-outline', foods: [] },
    ] as any);

    await TestBed.configureTestingModule({
      imports: [
        FoodSearchComponent,
        IonicModule.forRoot(),
        ReactiveFormsModule,
        FormsModule,
        HttpClientTestingModule,
      ],
      providers: [
        { provide: OpenFoodFactsService, useValue: offService },
        { provide: NutritionStateService, useValue: nutritionState },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(FoodSearchComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => {
    fixture.destroy();
  });

  // ─────────────────────────────────────────────────────────
  // I-01: Búsqueda con < 3 chars no dispara request
  // ─────────────────────────────────────────────────────────
  it('I-01: búsqueda con menos de 3 caracteres NO llama al servicio', fakeAsync(() => {
    offService.searchProducts.and.returnValue(of([]));

    component.searchControl.setValue('ar');
    tick(500); // esperar debounce

    expect(offService.searchProducts).not.toHaveBeenCalled();
  }));

  // ─────────────────────────────────────────────────────────
  // I-02: Búsqueda con >= 3 chars llama searchProducts
  // ─────────────────────────────────────────────────────────
  it('I-02: búsqueda con 3+ caracteres llama a searchProducts', fakeAsync(() => {
    const mockProducts = [makeProduct()];
    offService.searchProducts.and.returnValue(of(mockProducts));

    component.searchControl.setValue('arr');
    tick(500);

    expect(offService.searchProducts).toHaveBeenCalledWith('arr');
    expect(component.searchResults().length).toBe(1);
  }));

  // ─────────────────────────────────────────────────────────
  // I-03: calcKcal para 150g de producto con 100 kcal/100g
  // ─────────────────────────────────────────────────────────
  it('I-03: calcKcal() devuelve 150 kcal para 150g de producto 100kcal/100g', () => {
    component.selectedProduct.set(makeProduct({ nutriments: { 'energy-kcal_100g': 100, 'proteins_100g': 2, 'carbohydrates_100g': 22, 'fat_100g': 0 } }));
    component.portionGrams = 150;

    expect(component.calcKcal()).toBe(150);
  });

  // ─────────────────────────────────────────────────────────
  // I-04: adjustGrams(-25) no baja de 1
  // ─────────────────────────────────────────────────────────
  it('I-04: adjustGrams(-25) con portionGrams=10 no baja de 1', () => {
    component.portionGrams = 10;
    component.adjustGrams(-25);

    expect(component.portionGrams).toBe(1);
  });

  // ─────────────────────────────────────────────────────────
  // I-05: onProductTap con kcal=0 NO abre el modal
  // ─────────────────────────────────────────────────────────
  it('I-05: onProductTap con kcal=0 no abre la modal de porción', () => {
    const zeroKcalProduct = makeProduct({
      nutriments: { 'energy-kcal_100g': 0, 'proteins_100g': 0, 'carbohydrates_100g': 0, 'fat_100g': 0 },
    });

    component.onProductTap(zeroKcalProduct);

    expect(component.selectedProduct()).toBeNull();
  });

  // ─────────────────────────────────────────────────────────
  // Extra: calcKcal/calcProtein/calcCarbs/calcFat son 0 sin producto
  // ─────────────────────────────────────────────────────────
  it('calcKcal retorna 0 si no hay producto seleccionado', () => {
    component.selectedProduct.set(null);
    expect(component.calcKcal()).toBe(0);
    expect(component.calcProtein()).toBe(0);
    expect(component.calcCarbs()).toBe(0);
    expect(component.calcFat()).toBe(0);
  });

  it('cancelPortion() cierra el modal de porción', () => {
    component.selectedProduct.set(makeProduct());
    component.cancelPortion();
    expect(component.selectedProduct()).toBeNull();
  });

  it('clearState() resetea los resultados y el estado de carga', fakeAsync(() => {
    offService.searchProducts.and.returnValue(of([makeProduct()]));
    component.searchControl.setValue('aroz');
    tick(500);
    expect(component.searchResults().length).toBeGreaterThan(0);

    component.clearState();

    expect(component.searchResults().length).toBe(0);
    expect(component.isLoading()).toBe(false);
  }));

  it('adjustGrams(+25) suma correctamente a portionGrams', () => {
    component.portionGrams = 100;
    component.adjustGrams(25);
    expect(component.portionGrams).toBe(125);
  });
});
