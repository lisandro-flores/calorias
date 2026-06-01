import { ComponentFixture, TestBed } from '@angular/core/testing';
import { OnboardingComponent } from './onboarding.component';

describe('OnboardingComponent', () => {
  let component: OnboardingComponent;
  let fixture: ComponentFixture<OnboardingComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [OnboardingComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(OnboardingComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('advances through all 4 steps', () => {
    expect(component.step).toBe(0);
    component.next();
    expect(component.step).toBe(1);
    component.next();
    expect(component.step).toBe(2);
    component.next();
    expect(component.step).toBe(3);
  });

  describe('isProfileValid', () => {
    it('returns false when all fields are empty', () => {
      expect(component.isProfileValid()).toBeFalse();
    });

    it('returns false when weight is too low', () => {
      component.currentWeight = '10';
      component.goalWeight = '60';
      component.height = '170';
      expect(component.isProfileValid()).toBeFalse();
    });

    it('returns false when height is too low', () => {
      component.currentWeight = '80';
      component.goalWeight = '70';
      component.height = '50';
      expect(component.isProfileValid()).toBeFalse();
    });

    it('returns true with valid data', () => {
      component.currentWeight = '80';
      component.goalWeight = '70';
      component.height = '170';
      expect(component.isProfileValid()).toBeTrue();
    });
  });

  describe('finish', () => {
    beforeEach(() => {
      localStorage.clear();
    });

    it('saves onboardingSeen to localStorage', () => {
      component.currentWeight = '80';
      component.goalWeight = '70';
      component.height = '175';
      component.finish();
      expect(localStorage.getItem('onboardingSeen')).toBe('1');
    });

    it('saves profile to localStorage when valid', () => {
      component.currentWeight = '85';
      component.goalWeight = '72';
      component.height = '180';
      component.finish();

      const profile = JSON.parse(localStorage.getItem('user_profile') || '{}');
      expect(profile.currentWeight).toBe(85);
      expect(profile.startWeight).toBe(85);
      expect(profile.goalWeight).toBe(72);
      expect(profile.heightCm).toBe(180);
    });

    it('does not save profile when invalid', () => {
      component.currentWeight = '';
      component.goalWeight = '';
      component.height = '';
      component.finish();

      const profile = localStorage.getItem('user_profile');
      expect(profile).toBeNull();
    });
  });
});
