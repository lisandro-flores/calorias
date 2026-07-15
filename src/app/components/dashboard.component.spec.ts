import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { DashboardComponent } from './dashboard.component';
import { IonicModule, ModalController } from '@ionic/angular';
import { NutritionStateService } from '../services/nutrition-state.service';
import { HealthConnectService } from '../services/health-connect.service';
import { OutboxService } from '../services/outbox.service';
import { of } from 'rxjs';
import { signal } from '@angular/core';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { AddFoodModalComponent } from './add-food-modal.component';
import { HeroSummaryComponent } from './hero-summary.component';
import { MealBlockComponent } from './meal-block.component';
import { ActivityCardComponent } from './activity-card.component';
import { WaterTrackerComponent } from './water-tracker.component';
import { GoalProgressComponent } from './goal-progress.component';

describe('DashboardComponent', () => {
  let component: DashboardComponent;
  let fixture: ComponentFixture<DashboardComponent>;
  let modalCtrlSpy: jasmine.SpyObj<ModalController>;
  let nutritionSpy: any;
  let healthSpy: any;
  let outboxSpy: any;

  beforeEach(async () => {
    modalCtrlSpy = jasmine.createSpyObj('ModalController', ['create']);
    modalCtrlSpy.create.and.returnValue(Promise.resolve({
      present: () => Promise.resolve()
    } as any));

    nutritionSpy = {
      dataReady: signal(true),
      syncStatus: signal('synced'),
      syncStatusIcon: signal('cloud-done-outline'),
      syncStatusLabel: signal('Sincronizado'),
      dataSource: signal('cloud'),
      meals: signal([]),
      totalCalories: signal(1000),
      totalProtein: signal(50),
      totalCarbs: signal(100),
      totalFat: signal(20),
      calorieGoal: signal(2000),
      waterGoal: signal(2000),
      waterConsumed: signal(1000),
      remaining: signal(500),
      checkDateChange: jasmine.createSpy('checkDateChange'),
      retrySync: jasmine.createSpy('retrySync'),
      copyFromYesterday: jasmine.createSpy('copyFromYesterday')
    };

    healthSpy = {
      init: jasmine.createSpy('init')
    };

    outboxSpy = {
      pending$: of(0)
    };

    await TestBed.configureTestingModule({
      imports: [DashboardComponent, IonicModule.forRoot(), HttpClientTestingModule],
      providers: [
        { provide: ModalController, useValue: modalCtrlSpy },
        { provide: NutritionStateService, useValue: nutritionSpy },
        { provide: HealthConnectService, useValue: healthSpy },
        { provide: OutboxService, useValue: outboxSpy }
      ],
      schemas: [CUSTOM_ELEMENTS_SCHEMA]
    })
    .overrideProvider(ModalController, { useValue: modalCtrlSpy })
    // Override nested components to avoid deep rendering issues in unit tests
    .overrideComponent(DashboardComponent, {
      remove: { imports: [HeroSummaryComponent, MealBlockComponent, AddFoodModalComponent, ActivityCardComponent, WaterTrackerComponent, GoalProgressComponent] },
      add: { schemas: [CUSTOM_ELEMENTS_SCHEMA] }
    })
    .compileComponents();

    fixture = TestBed.createComponent(DashboardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should call init on ionViewDidEnter', () => {
    component.ionViewDidEnter();
    expect(nutritionSpy.checkDateChange).toHaveBeenCalled();
    expect(healthSpy.init).toHaveBeenCalled();
  });

  it('should open AddFoodModal', async () => {
    await component.openAddFoodModal();
    expect(modalCtrlSpy.create).toHaveBeenCalledWith(jasmine.objectContaining({
      component: AddFoodModalComponent
    }));
  });

  it('should return correct trust icon', () => {
    nutritionSpy.dataSource.set('local');
    expect(component.trustIcon()).toBe('cloud-offline-outline');
    nutritionSpy.dataSource.set('cloud');
    nutritionSpy.syncStatus.set('error');
    expect(component.trustIcon()).toBe('alert-circle-outline');
  });

  it('should call copyFromYesterday on onCopyYesterday', () => {
    component.onCopyYesterday('Desayuno');
    expect(nutritionSpy.copyFromYesterday).toHaveBeenCalledWith('Desayuno');
  });

  it('should return meal name for trackByMeal', () => {
    expect(component.trackByMeal(0, { name: 'Almuerzo' })).toBe('Almuerzo');
  });

  it('should call retrySync on retrySync', () => {
    component.retrySync();
    expect(nutritionSpy.retrySync).toHaveBeenCalled();
  });

  it('should return correct trust title based on state', () => {
    nutritionSpy.dataSource.set('local');
    expect(component.trustTitle()).toBe('Datos locales');

    nutritionSpy.dataSource.set('cloud');
    nutritionSpy.syncStatus.set('pending');
    expect(component.trustTitle()).toBe('Cambios pendientes');

    nutritionSpy.syncStatus.set('syncing');
    expect(component.trustTitle()).toBe('Guardando cambios');

    nutritionSpy.syncStatus.set('error');
    expect(component.trustTitle()).toBe('No se pudo sincronizar');

    nutritionSpy.syncStatus.set('synced');
    expect(component.trustTitle()).toBe('Datos en la nube');
  });

  it('should return correct trust message based on state and pending count', () => {
    // Local source
    nutritionSpy.dataSource.set('local');
    expect(component.trustMessage(0)).toContain('se sincronizarán cuando haya conexión');

    // Cloud source, pending status
    nutritionSpy.dataSource.set('cloud');
    nutritionSpy.syncStatus.set('pending');
    expect(component.trustMessage(1)).toBe('Hay 1 cambio esperando sincronización.');
    expect(component.trustMessage(2)).toBe('Hay 2 cambios esperando sincronización.');

    // Cloud source, syncing status
    nutritionSpy.syncStatus.set('syncing');
    expect(component.trustMessage(0)).toBe('Estamos guardando tus cambios en la nube.');

    // Cloud source, error status
    nutritionSpy.syncStatus.set('error');
    expect(component.trustMessage(0)).toBe('Tus datos siguen en este dispositivo. Puedes reintentar.');

    // Cloud source, synced status
    nutritionSpy.syncStatus.set('synced');
    expect(component.trustMessage(0)).toBe('Tus datos están confirmados en la nube.');
  });
});
