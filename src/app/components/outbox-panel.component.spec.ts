import { ComponentFixture, TestBed } from '@angular/core/testing';
import { OutboxPanelComponent } from './outbox-panel.component';
import { IonicModule } from '@ionic/angular';
import { OutboxService } from '../services/outbox.service';
import { of, BehaviorSubject } from 'rxjs';

describe('OutboxPanelComponent', () => {
  let component: OutboxPanelComponent;
  let fixture: ComponentFixture<OutboxPanelComponent>;
  let outboxService: any;
  let pendingSubject: BehaviorSubject<number>;

  beforeEach(async () => {
    pendingSubject = new BehaviorSubject<number>(0);
    outboxService = {
      pending$: pendingSubject,
      list: jasmine.createSpy('list').and.returnValue([{ id: '1', type: 'test', status: 'pending', attempts: 0 }]),
      clear: jasmine.createSpy('clear')
    };

    await TestBed.configureTestingModule({
      imports: [OutboxPanelComponent, IonicModule.forRoot()],
      providers: [
        { provide: OutboxService, useValue: outboxService }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(OutboxPanelComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should refresh on pending$ emission', () => {
    expect(component.pending).toBe(0);
    pendingSubject.next(2);
    expect(component.pending).toBe(2);
    expect(outboxService.list).toHaveBeenCalled();
  });

  it('should clear when confirm is true', () => {
    spyOn(window, 'confirm').and.returnValue(true);
    component.clear();
    expect(outboxService.clear).toHaveBeenCalled();
    expect(outboxService.list).toHaveBeenCalled();
  });

  it('should not clear when confirm is false', () => {
    spyOn(window, 'confirm').and.returnValue(false);
    component.clear();
    expect(outboxService.clear).not.toHaveBeenCalled();
  });

  it('should remove when confirm is true', () => {
    spyOn(window, 'confirm').and.returnValue(true);
    spyOn(localStorage, 'setItem');
    component.remove('1');
    expect(localStorage.setItem).toHaveBeenCalledWith('outbox_v1', '[]');
    expect(outboxService.list).toHaveBeenCalled();
  });

  it('should catch error when localStorage.setItem fails during remove', () => {
    spyOn(window, 'confirm').and.returnValue(true);
    spyOn(localStorage, 'setItem').and.throwError('quota');
    spyOn(console, 'error');
    component.remove('1');
    expect(console.error).toHaveBeenCalled();
  });

  it('should not remove when confirm is false', () => {
    spyOn(window, 'confirm').and.returnValue(false);
    spyOn(localStorage, 'setItem');
    component.remove('1');
    expect(localStorage.setItem).not.toHaveBeenCalled();
  });
});
