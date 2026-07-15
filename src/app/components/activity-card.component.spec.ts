import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivityCardComponent } from './activity-card.component';
import { HealthConnectService } from '../services/health-connect.service';
import { signal } from '@angular/core';

describe('ActivityCardComponent', () => {
  let component: ActivityCardComponent;
  let fixture: ComponentFixture<ActivityCardComponent>;
  let mockHealthConnect: any;

  beforeEach(async () => {
    mockHealthConnect = {
      isAvailable: signal(true),
      isAuthorized: signal(false),
      isBusy: signal(false),
      statusLabel: signal('Desconectado'),
      todaySummary: signal({ steps: 1500, caloriesBurned: 300 }),
      weightLabel: signal('70 kg'),
      stepsProgress: signal(0.15),
      connect: jasmine.createSpy('connect').and.returnValue(Promise.resolve()),
      openPrivacyPolicy: jasmine.createSpy('openPrivacyPolicy').and.returnValue(Promise.resolve())
    };

    await TestBed.configureTestingModule({
      imports: [ActivityCardComponent],
      providers: [
        { provide: HealthConnectService, useValue: mockHealthConnect }
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ActivityCardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should call connect on health service', async () => {
    await component.connect();
    expect(mockHealthConnect.connect).toHaveBeenCalled();
  });

  it('should call openPrivacyPolicy on health service', async () => {
    await component.openPrivacy();
    expect(mockHealthConnect.openPrivacyPolicy).toHaveBeenCalled();
  });

  it('should show unavailable message if not available', () => {
    mockHealthConnect.isAvailable.set(false);
    fixture.detectChanges();
    const el = fixture.nativeElement.querySelector('.unavailable');
    expect(el).toBeTruthy();
  });
});
