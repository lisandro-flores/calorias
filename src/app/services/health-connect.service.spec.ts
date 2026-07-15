import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { HealthConnectService } from './health-connect.service';
import { Capacitor } from '@capacitor/core';
import { Health } from '@capgo/capacitor-health';

describe('HealthConnectService', () => {
  let service: HealthConnectService;

  let mockHealthPlugin: any;
  let platformSpy: jasmine.Spy;

  beforeEach(() => {
    mockHealthPlugin = {
      isAvailable: jasmine.createSpy('isAvailable').and.returnValue(Promise.resolve({ available: true })),
      checkAuthorization: jasmine.createSpy('checkAuthorization').and.returnValue(Promise.resolve({ readDenied: [] })),
      requestAuthorization: jasmine.createSpy('requestAuthorization').and.returnValue(Promise.resolve({} as any)),
      showPrivacyPolicy: jasmine.createSpy('showPrivacyPolicy').and.returnValue(Promise.resolve()),
      openHealthConnectSettings: jasmine.createSpy('openHealthConnectSettings').and.returnValue(Promise.resolve()),
      readSamples: jasmine.createSpy('readSamples').and.callFake((options: any) => {
        if (options.dataType === 'weight') return Promise.resolve({ samples: [{ value: 70 }] });
        if (options.dataType === 'steps') return Promise.resolve({ samples: [{ value: 1000 }, { value: 500 }] });
        if (options.dataType === 'totalCalories') return Promise.resolve({ samples: [{ value: 150 }, { value: 150 }] });
        return Promise.resolve({ samples: [] });
      })
    };

    TestBed.configureTestingModule({
      providers: [HealthConnectService]
    });
    service = TestBed.inject(HealthConnectService);

    spyOnProperty(service as any, 'healthPlugin', 'get').and.returnValue(mockHealthPlugin);
    platformSpy = spyOnProperty(service as any, 'platform', 'get').and.returnValue('android');
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should check availability and return true on android with health available', async () => {
    const result = await service.checkAvailability();
    expect(result).toBeTrue();
    expect(service.isAvailable()).toBeTrue();
  });

  it('should return false for availability on non-android platforms', async () => {
    platformSpy.and.returnValue('ios');
    const result = await service.checkAvailability();
    expect(result).toBeFalse();
    expect(service.isAvailable()).toBeFalse();
  });

  it('should check authorization and return true if granted', async () => {
    const result = await service.checkAuthorization();
    expect(result).toBeTrue();
    expect(service.isAuthorized()).toBeTrue();
  });

  it('should return false if authorization has denied reads', async () => {
    mockHealthPlugin.checkAuthorization.and.returnValue(Promise.resolve({ readDenied: ['steps'] } as any));
    const result = await service.checkAuthorization();
    expect(result).toBeFalse();
    expect(service.isAuthorized()).toBeFalse();
  });

  it('should refresh today data correctly', fakeAsync(() => {
    service.isAvailable.set(true);
    service.isAuthorized.set(true);
    
    service.refreshToday();
    tick(); // resolve promises
    
    expect(mockHealthPlugin.readSamples).toHaveBeenCalledTimes(3);
    expect(service.todaySummary().weight).toBe(70);
    expect(service.todaySummary().steps).toBe(1500);
    expect(service.todaySummary().caloriesBurned).toBe(300);
    expect(service.hasData()).toBeTrue();
    expect(service.stepsProgress()).toBe(0.15); // 1500/10000
    expect(service.weightLabel()).toBe('70.0 kg');
  }));

  it('should handle connect success', fakeAsync(() => {
    service.connect();
    tick(); // resolve checkAvailability
    tick(); // resolve requestAuthorization
    tick(); // resolve checkAuthorization
    tick(); // resolve refreshToday

    expect(mockHealthPlugin.requestAuthorization).toHaveBeenCalled();
    expect(service.isAuthorized()).toBeTrue();
    expect(service.todaySummary().steps).toBe(1500);
  }));

  it('should not connect if not available', async () => {
    platformSpy.and.returnValue('web');
    const result = await service.connect();
    expect(result).toBeFalse();
    expect(mockHealthPlugin.requestAuthorization).not.toHaveBeenCalled();
  });

  it('should compute status label correctly', () => {
    service.isAvailable.set(false);
    expect(service.statusLabel()).toBe('Solo disponible en Android');

    service.isAvailable.set(true);
    service.isAuthorized.set(false);
    expect(service.statusLabel()).toBe('Sin permisos');

    service.isAuthorized.set(true);
    service.isBusy.set(true);
    expect(service.statusLabel()).toBe('Actualizando Health Connect');

    service.isBusy.set(false);
    expect(service.statusLabel()).toBe('Conectado');

    service.todaySummary.set({ steps: 100, caloriesBurned: 0, weight: null, syncedAt: 'now' });
    expect(service.statusLabel()).toBe('Conectado y actualizado');
  });

  it('should open privacy policy', async () => {
    await service.openPrivacyPolicy();
    expect(mockHealthPlugin.showPrivacyPolicy).toHaveBeenCalled();
  });
});
