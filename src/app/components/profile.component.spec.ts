import { ComponentFixture, TestBed } from '@angular/core/testing';
import { IonicModule, AlertController, ToastController } from '@ionic/angular';
import { ProfileComponent } from './profile.component';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { NutritionStateService } from '../services/nutrition-state.service';
import { HealthConnectService } from '../services/health-connect.service';
import { AuthService } from '../services/auth.service';
import { of } from 'rxjs';

class MockNutritionState {
  private profile = {
    displayName: 'Usuario', age: 25, gender: 'male', heightCm: 175,
    startWeight: 80, currentWeight: 80, goalWeight: 70,
    calorieGoalOverride: null, proteinGoalOverride: null, waterGoal: 8,
    activityLevel: 'moderate'
  };
  userProfile() { return this.profile; }
  updateProfile(_p:any) { Object.assign(this.profile, _p); }
  bmr() { return 1600; }
  tdee() { return 2200; }
  calorieGoal() { return this.profile.calorieGoalOverride ?? this.tdee(); }
  goals() { return { calorieGoal: this.calorieGoal(), proteinGoal: this.profile.proteinGoalOverride ?? 144, carbGoal: 200, fatGoal: 70, waterGoal: this.profile.waterGoal, startWeight: this.profile.startWeight, currentWeight: this.profile.currentWeight, goalWeight: this.profile.goalWeight }; }
  proteinGoal() { return 144; }
  resetToday = jasmine.createSpy('resetToday');
}

class MockHealthConnect {
  init() {}
  isAvailable() { return true; }
  isAuthorized() { return true; }
  todaySummary() { return { weight: 75.4, steps: 1000, caloriesBurned: 200 }; }
  refreshToday = jasmine.createSpy('refreshToday').and.returnValue(Promise.resolve());
  connect = jasmine.createSpy('connect').and.returnValue(Promise.resolve());
  weightLabel() { return '75.4 kg'; }
  statusLabel() { return 'Conectado'; }
}

class MockAuth {
  currentUser() { return { name: 'Usuario', email: 'u@example.com' }; }
  logout = jasmine.createSpy('logout');
}

describe('ProfileComponent', () => {
  let component: ProfileComponent;
  let fixture: ComponentFixture<ProfileComponent>;
  let ns: MockNutritionState;
  let hc: MockHealthConnect;

  beforeEach(async () => {
    ns = new MockNutritionState();
    hc = new MockHealthConnect();

    await TestBed.configureTestingModule({
      imports: [IonicModule.forRoot(), HttpClientTestingModule, ProfileComponent],
      providers: [
        { provide: NutritionStateService, useValue: ns },
        { provide: HealthConnectService, useValue: hc },
        { provide: AuthService, useValue: new MockAuth() },
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(ProfileComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('initial draft equals service profile', () => {
    expect(component.draft.displayName).toBe(ns.userProfile().displayName);
  });

  it('markDirty sets draft changes flag', () => {
    component.markDirty();
    expect(component.hasDraftChanges()).toBeTrue();
  });

  it('save updates profile and clears dirty flag', async () => {
    component.draft.displayName = 'Ana';
    component.markDirty();
    await component.save();
    expect(ns.userProfile().displayName).toBe('Ana');
    expect(component.hasDraftChanges()).toBeFalse();
  });

  it('importHealthWeight shows alert and updates currentWeight on confirm', async () => {
    // Spy on alert controller to simulate user accept
    const alertCtrl = TestBed.inject(AlertController);
    spyOn(alertCtrl, 'create').and.callFake(async (opts:any) => {
      return {
        present: async () => {
          // simulate user clicking 'Actualizar'
          const btn = (opts.buttons || []).find((b:any) => b.text === 'Actualizar');
          if (btn && typeof btn.handler === 'function') {
            btn.handler();
          }
        }
      } as any;
    });

    // call import and wait
    await component.importHealthWeight();

    // After import, service should be updated
    expect(ns.userProfile().currentWeight).toBeCloseTo(75.4, 1);
  });

  it('should set gender and mark dirty', () => {
    component.setGender('female');
    expect(component.draft.gender).toBe('female');
    expect(component.hasDraftChanges()).toBeTrue();
  });

  it('should reset calorie goal auto', () => {
    component.draft.calorieGoalOverride = 2000;
    component.resetCalAuto();
    expect(component.draft.calorieGoalOverride).toBeNull();
    expect(component.hasDraftChanges()).toBeTrue();
  });

  it('should connect health', async () => {
    await component.connectHealth();
    expect(hc.connect).toHaveBeenCalled();
  });

  it('should refresh health', async () => {
    await component.refreshHealth();
    expect(hc.refreshToday).toHaveBeenCalled();
  });

  it('should call resetToday on state and show alert', async () => {
    const alertCtrl = TestBed.inject(AlertController);
    spyOn(alertCtrl, 'create').and.callFake(async (opts:any) => {
      return {
        present: async () => {
          const btn = (opts.buttons || []).find((b:any) => b.text === 'Reiniciar');
          if (btn && typeof btn.handler === 'function') {
            btn.handler();
          }
        }
      } as any;
    });

    await component.resetToday();
    expect(ns.resetToday).toHaveBeenCalled();
  });

  it('should show alert on confirmSave', async () => {
    const alertCtrl = TestBed.inject(AlertController);
    spyOn(alertCtrl, 'create').and.callFake(async (opts:any) => {
      return {
        present: async () => {
          const btn = (opts.buttons || []).find((b:any) => b.text === 'Guardar');
          if (btn && typeof btn.handler === 'function') {
            btn.handler();
          }
        }
      } as any;
    });

    component.markDirty();
    await component.confirmSave();
    
    // check that save() was called by verifying if dirty flag is cleared
    expect(component.hasDraftChanges()).toBeFalse();
  });

  it('should not show alert on confirmSave if no changes', async () => {
    const alertCtrl = TestBed.inject(AlertController);
    spyOn(alertCtrl, 'create');
    await component.confirmSave();
    expect(alertCtrl.create).not.toHaveBeenCalled();
  });

  it('should logout', () => {
    const authService = TestBed.inject(AuthService);
    component.logout();
    expect((authService as any).logout).toHaveBeenCalled();
  });
});
