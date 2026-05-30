import { TestBed, fakeAsync } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { OutboxService } from './outbox.service';

describe('OutboxService', () => {
  let service: OutboxService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [OutboxService]
    });
    service = TestBed.inject(OutboxService);
    httpMock = TestBed.inject(HttpTestingController);

    // Clear localStorage before each test
    localStorage.clear();
  });

  afterEach(() => {
    httpMock.verify();
    localStorage.clear();
  });

  describe('Enqueue y deduplicación (O-01 a O-05)', () => {

    // processQueue() is called automatically on enqueue. To prevent items from
    // transitioning to 'in-flight' (which breaks deduplication lookups),
    // we stub processQueue so it does nothing during these tests.
    beforeEach(() => {
      spyOn(service, 'processQueue').and.returnValue(Promise.resolve());
    });

    it('O-01: enqueue crea un item', () => {
      const payload = { userId: 'user1', date: '2026-05-28', meals: [], waterGlasses: 0 };
      service.enqueue('entry-sync', payload);

      expect(service.list().length).toBe(1);
      expect(service.list()[0].type).toBe('entry-sync');
    });

    it('O-02: enqueue deduplica entry-sync por fecha', () => {
      const payload1 = { userId: 'user1', date: '2026-05-28', meals: [], waterGlasses: 0 };
      const payload2 = { userId: 'user1', date: '2026-05-28', meals: [{ name: 'Nuevo' }], waterGlasses: 1 };

      service.enqueue('entry-sync', payload1);
      service.enqueue('entry-sync', payload2);

      expect(service.list().length).toBe(1);
      expect(service.list()[0].payload.waterGlasses).toBe(1); // payload actualizado
    });

    it('O-03: enqueue deduplica profile-sync', () => {
      const payload1 = { displayName: 'User1' };
      const payload2 = { displayName: 'User2' };

      service.enqueue('profile-sync', payload1);
      service.enqueue('profile-sync', payload2);

      expect(service.list().length).toBe(1);
      expect(service.list()[0].payload.displayName).toBe('User2');
    });

    it('O-04: pending$ emite la cuenta correcta', (done) => {
      service.pending$.subscribe(count => {
        if (count === 2) {
          expect(count).toBe(2);
          done();
        }
      });
      
      service.enqueue('entry-sync', { date: '2026-05-28' });
      service.enqueue('profile-sync', { displayName: 'Test' });
    });

    it('O-05: clear() vacía la cola', () => {
      service.enqueue('entry-sync', { date: '2026-05-28' });
      service.enqueue('profile-sync', { displayName: 'Test' });
      
      expect(service.list().length).toBe(2);
      
      service.clear();
      
      expect(service.list().length).toBe(0);
    });
  });

  describe('Procesamiento y persisten cia (O-06 a O-07)', () => {
    
    it('O-06: processQueue marca item como done tras éxito HTTP', async () => {
      const payload = { userId: 'user1', date: '2026-05-28', meals: [], waterGlasses: 0 };
      service.enqueue('entry-sync', payload);
      
      const itemId = service.list()[0].id;
      
      // Simulate online
      Object.defineProperty(navigator, 'onLine', { value: true, writable: true });
      
      // Manually trigger processQueue
      const processPromise = service.processQueue();
      
      // Mock the HTTP request
      const req = httpMock.expectOne(r => r.url.includes('/entries/sync'));
      req.flush({ success: true });
      
      await processPromise;
      
      // Check that item is no longer in pending list (cleaned up)
      const processed = service.list().find(i => i.id === itemId);
      expect(processed).toBeUndefined();
    });

    it('O-07: processQueue marca como failed después de 5 intentos', async () => {
      const payload = { userId: 'user1', date: '2026-05-28', meals: [], waterGlasses: 0 };
      service.enqueue('entry-sync', payload);
      
      const itemId = service.list()[0].id;
      
      // Simulate online
      Object.defineProperty(navigator, 'onLine', { value: true, writable: true });
      
      // First attempt
      for (let attempt = 0; attempt < 5; attempt++) {
        // Don't process more than 5 attempts for this test
        (service as any).processing = false;
        
        const processPromise = service.processQueue();
        
        const req = httpMock.expectOne(r => r.url.includes('/entries/sync'));
        req.flush({ error: 'Server error' }, { status: 500, statusText: 'Internal Server Error' });
        
        await processPromise;
      }
      
      const failed = service.list().find(i => i.id === itemId);
      expect(failed?.status).toBe('failed');
    });
  });

  describe('Persistencia en localStorage', () => {

    it('should save queue to localStorage', fakeAsync(async () => {
      // Stub processQueue to prevent real HTTP calls during this test
      spyOn(service, 'processQueue').and.returnValue(Promise.resolve());

      service.enqueue('entry-sync', { date: '2099-01-01' });

      const stored = JSON.parse(localStorage.getItem('outbox_v1') || '[]');
      expect(stored.length).toBeGreaterThanOrEqual(1);
      const saved = stored.find((i: any) => i.payload?.date === '2099-01-01');
      expect(saved).toBeDefined();
      expect(saved.type).toBe('entry-sync');
    }));

    it('should load queue from localStorage via load mechanism', () => {
      // Verify that the load mechanism reads from localStorage correctly.
      // TestBed is a singleton so we test the private load method directly.
      const item = {
        id: 'test-id-load',
        type: 'entry-sync' as const,
        payload: { date: '2099-02-01' },
        attempts: 0,
        createdAt: new Date().toISOString(),
        status: 'pending' as const
      };

      localStorage.setItem('outbox_v1', JSON.stringify([item]));

      // Call the private load method to re-load from localStorage
      (service as any).load();

      const found = service.list().find((i: any) => i.id === 'test-id-load');
      expect(found).toBeDefined();
      expect(found!.id).toBe('test-id-load');
    });
  });

  describe('Sincronización (Fase 5)', () => {
    
    it('should emit syncComplete$ on successful sync', (done) => {
      const payload = { userId: 'user1', date: '2026-05-28', meals: [], waterGlasses: 0 };
      
      service.syncComplete$.subscribe(event => {
        expect(event.type).toBe('entry-sync');
        expect(event.payload).toEqual(payload);
        done();
      });
      
      service.enqueue('entry-sync', payload);
      
      Object.defineProperty(navigator, 'onLine', { value: true, writable: true });
      
      service.processQueue().then(() => {
        const req = httpMock.expectOne(r => r.url.includes('/entries/sync'));
        req.flush({ success: true });
      });
    });
  });

  describe('Deduplicación (Fase 4)', () => {

    // Stub processQueue so enqueue doesn't move items to in-flight
    beforeEach(() => {
      spyOn(service, 'processQueue').and.returnValue(Promise.resolve());
    });

    it('should replace payload for duplicate entry-sync on same date', () => {
      const date = '2099-03-01'; // unique date to avoid cross-test pollution
      const payload1 = { userId: 'user1', date, meals: [{ name: 'Meal1' }], waterGlasses: 0 };
      const payload2 = { userId: 'user1', date, meals: [{ name: 'Meal2' }], waterGlasses: 2 };

      const id1 = service.enqueue('entry-sync', payload1);
      const id2 = service.enqueue('entry-sync', payload2);

      // Should be the same item (deduplicated) — id1 is returned for both
      expect(id1).toBe(id2);
      const items = service.list().filter((i: any) => i.payload?.date === date);
      expect(items.length).toBe(1);
      expect(items[0].payload.waterGlasses).toBe(2);
    });

    it('should not deduplicate different dates', () => {
      // Clear queue first to avoid state from previous tests
      service.clear();
      const payload1 = { userId: 'user1', date: '2099-04-01', meals: [], waterGlasses: 0 };
      const payload2 = { userId: 'user1', date: '2099-04-02', meals: [], waterGlasses: 1 };

      service.enqueue('entry-sync', payload1);
      service.enqueue('entry-sync', payload2);

      expect(service.list().length).toBe(2);
    });

    it('should reset attempts on deduplication update', () => {
      const date = '2099-05-01'; // unique date
      const payload1 = { userId: 'user1', date, meals: [], waterGlasses: 0 };
      const payload2 = { userId: 'user1', date, meals: [], waterGlasses: 1 };

      service.enqueue('entry-sync', payload1);

      // Manually set attempts to simulate a previous failed attempt
      const item = service.list().find((i: any) => i.payload?.date === date)!;
      item.attempts = 3;

      // Re-enqueue same date — should reset attempts
      service.enqueue('entry-sync', payload2);

      const updated = service.list().find((i: any) => i.payload?.date === date)!;
      expect(updated.attempts).toBe(0);
    });
  });
});
