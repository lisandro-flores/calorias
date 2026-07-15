import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RecentFoodsComponent } from './recent-foods.component';
import { NutritionStateService } from '../services/nutrition-state.service';
import { ActionSheetController, IonicModule } from '@ionic/angular';
import { signal } from '@angular/core';

describe('RecentFoodsComponent', () => {
  let component: RecentFoodsComponent;
  let fixture: ComponentFixture<RecentFoodsComponent>;
  let mockNutritionState: any;
  let actionSheetCtrlSpy: any;
  let mockActionSheet: any;

  beforeEach(async () => {
    mockNutritionState = {
      recentFoods: signal([{ id: '1', name: 'Apple', portion: '1', icon: '🍎', calories: 95, protein: 0, carbs: 25, fat: 0 }]),
      meals: signal([{ name: 'Desayuno', icon: '🍳', foods: [] }]),
      addFoodToMeal: jasmine.createSpy('addFoodToMeal')
    };

    mockActionSheet = {
      present: jasmine.createSpy('present').and.returnValue(Promise.resolve())
    };

    actionSheetCtrlSpy = jasmine.createSpyObj('ActionSheetController', ['create']);
    actionSheetCtrlSpy.create.and.returnValue(Promise.resolve(mockActionSheet));

    await TestBed.configureTestingModule({
      imports: [RecentFoodsComponent, IonicModule.forRoot()],
      providers: [
        { provide: NutritionStateService, useValue: mockNutritionState },
        { provide: ActionSheetController, useValue: actionSheetCtrlSpy }
      ]
    })
    .overrideProvider(ActionSheetController, { useValue: actionSheetCtrlSpy })
    .compileComponents();

    fixture = TestBed.createComponent(RecentFoodsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should call onAddRecent and present ActionSheet', async () => {
    const food = { id: '1', name: 'Apple', portion: '1', icon: '🍎', calories: 95, protein: 0, carbs: 25, fat: 0 };
    await component.onAddRecent(food);
    
    expect(actionSheetCtrlSpy.create).toHaveBeenCalled();
    const args = actionSheetCtrlSpy.create.calls.first().args[0];
    expect(args.header).toBe('¿A qué comida agregar?');
    expect(args.buttons.length).toBe(2); // 1 meal + 1 cancel
    
    expect(mockActionSheet.present).toHaveBeenCalled();
  });

  it('should add food to meal when action sheet button is clicked', async () => {
    const food = { id: '1', name: 'Apple', portion: '1', icon: '🍎', calories: 95, protein: 0, carbs: 25, fat: 0 };
    await component.onAddRecent(food);
    
    const args = actionSheetCtrlSpy.create.calls.first().args[0];
    const mealButton = args.buttons[0];
    
    // Simulate click
    mealButton.handler();
    
    expect(mockNutritionState.addFoodToMeal).toHaveBeenCalledWith('Desayuno', jasmine.objectContaining({
      name: 'Apple',
      calories: 95
    }));
  });
});
