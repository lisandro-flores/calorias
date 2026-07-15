import { ComponentFixture, TestBed } from '@angular/core/testing';
import { IonicModule, AlertController } from '@ionic/angular';
import { FormsModule } from '@angular/forms';
import { MealBlockComponent } from './meal-block.component';
import { NutritionStateService } from '../services/nutrition-state.service';

describe('MealBlockComponent', () => {
  let component: MealBlockComponent;
  let fixture: ComponentFixture<MealBlockComponent>;
  let nutritionState: jasmine.SpyObj<NutritionStateService>;

  beforeEach(async () => {
    nutritionState = jasmine.createSpyObj('NutritionStateService', [
      'quickAdd', 'removeFoodFromMeal', 'updateFoodInMeal',
    ]);
    await TestBed.configureTestingModule({
      imports: [MealBlockComponent, IonicModule.forRoot(), FormsModule],
      providers: [
        { provide: NutritionStateService, useValue: nutritionState },
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(MealBlockComponent);
    component = fixture.componentInstance;
    component.mealName = 'Comida';
    component.foods = [] as any;
    fixture.detectChanges();
  });

  it('should create the component', () => {
    expect(component).toBeTruthy();
  });

  it('starts with inline add form hidden', () => {
    expect(component.showInlineAdd).toBeFalse();
  });

  describe('canSubmitInlineAdd', () => {
    it('returns false when name is empty', () => {
      component.quickAddName = '';
      component.quickAddCals = '200';
      expect(component.canSubmitInlineAdd()).toBeFalse();
    });

    it('returns false when name is whitespace', () => {
      component.quickAddName = '   ';
      component.quickAddCals = '200';
      expect(component.canSubmitInlineAdd()).toBeFalse();
    });

    it('returns false when calories is 0', () => {
      component.quickAddName = 'Arroz';
      component.quickAddCals = '0';
      expect(component.canSubmitInlineAdd()).toBeFalse();
    });

    it('returns false when calories is empty', () => {
      component.quickAddName = 'Arroz';
      component.quickAddCals = '';
      expect(component.canSubmitInlineAdd()).toBeFalse();
    });

    it('returns true when name and calories are valid', () => {
      component.quickAddName = 'Arroz';
      component.quickAddCals = '220';
      expect(component.canSubmitInlineAdd()).toBeTrue();
    });
  });

  describe('submitInlineAdd', () => {
    it('calls quickAdd with correct params and resets form', async () => {
      component.quickAddName = 'Arroz';
      component.quickAddCals = '220';
      component.quickAddProt = '6';
      component.showInlineAdd = true;

      await component.submitInlineAdd();

      expect(nutritionState.quickAdd).toHaveBeenCalledWith('Comida', 'Arroz', 220, 6);
      expect(component.quickAddName).toBe('');
      expect(component.quickAddCals).toBe('');
      expect(component.quickAddProt).toBe('');
      expect(component.showInlineAdd).toBeFalse();
    });

    it('defaults protein to 0 if empty', async () => {
      component.quickAddName = 'Galleta';
      component.quickAddCals = '100';
      component.quickAddProt = '';

      await component.submitInlineAdd();

      expect(nutritionState.quickAdd).toHaveBeenCalledWith('Comida', 'Galleta', 100, 0);
    });

    it('does nothing when form is invalid', async () => {
      component.quickAddName = '';
      component.quickAddCals = '';

      await component.submitInlineAdd();

      expect(nutritionState.quickAdd).not.toHaveBeenCalled();
    });

    it('trims name whitespace', async () => {
      component.quickAddName = '  Pan  ';
      component.quickAddCals = '150';
      component.quickAddProt = '5';

      await component.submitInlineAdd();

      expect(nutritionState.quickAdd).toHaveBeenCalledWith('Comida', 'Pan', 150, 5);
    });
  });

  describe('mealCalories', () => {
    it('returns 0 for empty foods', () => {
      component.foods = [];
      expect(component.mealCalories()).toBe(0);
    });

    it('sums calories correctly', () => {
      component.foods = [
        { id: '1', name: 'A', icon: '', portion: '', calories: 200, protein: 0 },
        { id: '2', name: 'B', icon: '', portion: '', calories: 350, protein: 0 },
      ] as any;
      expect(component.mealCalories()).toBe(550);
    });
  });

  describe('copyYesterday', () => {
    it('emits copyYesterday event', () => {
      spyOn(component.copyYesterday, 'emit');
      component.onCopyYesterday();
      expect(component.copyYesterday.emit).toHaveBeenCalled();
    });
  });

  describe('Alerts and handlers', () => {
    it('should call confirmRemoveFood on onRemoveFood', () => {
      spyOn(component, 'confirmRemoveFood').and.returnValue(Promise.resolve());
      component.onRemoveFood('123');
      expect(component.confirmRemoveFood).toHaveBeenCalledWith('123');
    });

    it('should call state.removeFoodFromMeal when confirming removal', async () => {
      const alertCtrl = TestBed.inject(AlertController);
      spyOn(alertCtrl, 'create').and.callFake(async (opts:any) => {
        return {
          present: async () => {
            const btn = (opts.buttons || []).find((b:any) => b.text === 'Eliminar');
            if (btn && typeof btn.handler === 'function') {
              btn.handler();
            }
          }
        } as any;
      });

      await component.confirmRemoveFood('123');
      expect(nutritionState.removeFoodFromMeal).toHaveBeenCalledWith('Comida', '123');
    });

    it('should handle onQuickAdd valid submit', async () => {
      const alertCtrl = TestBed.inject(AlertController);
      spyOn(alertCtrl, 'create').and.callFake(async (opts:any) => {
        return {
          present: async () => {
            const btn = (opts.buttons || []).find((b:any) => b.text === 'Agregar');
            if (btn && typeof btn.handler === 'function') {
              btn.handler({ name: 'Manzana', calories: '100', protein: '1' });
            }
          }
        } as any;
      });

      await component.onQuickAdd();
      expect(nutritionState.quickAdd).toHaveBeenCalledWith('Comida', 'Manzana', 100, 1);
    });

    it('should handle onQuickAdd invalid submit', async () => {
      const alertCtrl = TestBed.inject(AlertController);
      spyOn(alertCtrl, 'create').and.callFake(async (opts:any) => {
        return {
          present: async () => {
            const btn = (opts.buttons || []).find((b:any) => b.text === 'Agregar');
            if (btn && typeof btn.handler === 'function') {
              const res = btn.handler({ name: '', calories: '', protein: '' });
              expect(res).toBeFalse();
            }
          }
        } as any;
      });

      await component.onQuickAdd();
      expect(nutritionState.quickAdd).not.toHaveBeenCalled();
    });

    it('should handle onEditFood valid submit', async () => {
      const alertCtrl = TestBed.inject(AlertController);
      spyOn(alertCtrl, 'create').and.callFake(async (opts:any) => {
        return {
          present: async () => {
            const btn = (opts.buttons || []).find((b:any) => b.text === 'Guardar');
            if (btn && typeof btn.handler === 'function') {
              btn.handler({ name: 'Manzana Edit', portion: '1 ud', calories: '120', protein: '2', carbs: '30', fat: '0' });
            }
          }
        } as any;
      });

      await component.onEditFood({ id: 'f1', name: 'Manzana', calories: 100 } as any);
      expect(nutritionState.updateFoodInMeal).toHaveBeenCalledWith('Comida', 'f1', jasmine.objectContaining({
        name: 'Manzana Edit', portion: '1 ud', calories: 120, protein: 2, carbs: 30, fat: 0
      }));
    });

    it('should handle onEditFood invalid submit', async () => {
      const alertCtrl = TestBed.inject(AlertController);
      spyOn(alertCtrl, 'create').and.callFake(async (opts:any) => {
        return {
          present: async () => {
            const btn = (opts.buttons || []).find((b:any) => b.text === 'Guardar');
            if (btn && typeof btn.handler === 'function') {
              const res = btn.handler({ name: '', portion: '', calories: '' });
              expect(res).toBeFalse();
            }
          }
        } as any;
      });

      await component.onEditFood({ id: 'f1', name: 'Manzana', calories: 100 } as any);
      expect(nutritionState.updateFoodInMeal).not.toHaveBeenCalled();
    });
  });
});
