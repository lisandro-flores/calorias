import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AddFoodModalComponent } from './add-food-modal.component';
import { ModalController, IonicModule } from '@ionic/angular';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { AiInputComponent } from './ai-input.component';
import { FoodSearchComponent } from './food-search.component';
import { RecentFoodsComponent } from './recent-foods.component';

describe('AddFoodModalComponent', () => {
  let component: AddFoodModalComponent;
  let fixture: ComponentFixture<AddFoodModalComponent>;
  let modalCtrlSpy: jasmine.SpyObj<ModalController>;

  beforeEach(async () => {
    modalCtrlSpy = jasmine.createSpyObj('ModalController', ['dismiss']);

    await TestBed.configureTestingModule({
      imports: [AddFoodModalComponent, IonicModule.forRoot(), HttpClientTestingModule],
      providers: [
        { provide: ModalController, useValue: modalCtrlSpy }
      ]
    })
    .overrideProvider(ModalController, { useValue: modalCtrlSpy })
    .compileComponents();

    fixture = TestBed.createComponent(AddFoodModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should default to "ai" segment', () => {
    expect(component.activeSegment).toBe('ai');
  });

  it('should dismiss modal when close is called', () => {
    component.close();
    expect(modalCtrlSpy.dismiss).toHaveBeenCalled();
  });
});
