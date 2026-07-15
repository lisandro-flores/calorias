import { TestBed } from '@angular/core/testing';
import { PwaService } from './pwa.service';

describe('PwaService', () => {
  let service: PwaService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(PwaService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should handle beforeinstallprompt event', () => {
    const event = new Event('beforeinstallprompt') as any;
    event.preventDefault = jasmine.createSpy('preventDefault');
    
    window.dispatchEvent(event);
    
    expect(event.preventDefault).toHaveBeenCalled();
    expect(service.canInstall()).toBeTrue();
  });

  it('should handle appinstalled event', () => {
    service.canInstall.set(true);
    (service as any).promptEvent = {};
    
    window.dispatchEvent(new Event('appinstalled'));
    
    expect(service.canInstall()).toBeFalse();
    expect((service as any).promptEvent).toBeNull();
  });

  it('should prompt install if promptEvent exists', async () => {
    const mockPromptEvent = {
      prompt: jasmine.createSpy('prompt'),
      userChoice: Promise.resolve({ outcome: 'accepted' })
    };
    
    (service as any).promptEvent = mockPromptEvent;
    service.canInstall.set(true);
    
    await service.promptInstall();
    
    expect(mockPromptEvent.prompt).toHaveBeenCalled();
    expect(service.canInstall()).toBeFalse();
    expect((service as any).promptEvent).toBeNull();
  });

  it('should not prompt if promptEvent is null', async () => {
    (service as any).promptEvent = null;
    service.canInstall.set(true);
    
    await service.promptInstall();
    
    expect(service.canInstall()).toBeTrue(); // shouldn't change
  });
});
