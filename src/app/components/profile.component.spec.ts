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
}

class MockHealthConnect {
  init() {}
  isAvailable() { return true; }
  isAuthorized() { return true; }
  todaySummary() { return { weight: 75.4, steps: 1000, caloriesBurned: 200 }; }
  refreshToday() { return Promise.resolve(); }
  connect() { return Promise.resolve(); }
  weightLabel() { return '75.4 kg'; }
  statusLabel() { return 'Conectado'; }
}

class MockAuth {
  currentUser() { return { name: 'Usuario', email: 'u@example.com' }; }
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
});
