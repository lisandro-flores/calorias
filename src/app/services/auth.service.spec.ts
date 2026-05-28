import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { AuthService, UserProfile } from './auth.service';

describe('AuthService', () => {
  let service: AuthService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [AuthService]
    });
    service = TestBed.inject(AuthService);
    httpMock = TestBed.inject(HttpTestingController);

    localStorage.clear();
  });

  afterEach(() => {
    httpMock.verify();
    localStorage.clear();
  });

  describe('Inicialización (A-01 a A-02)', () => {
    
    it('A-01: currentUser() arranca en null si localStorage vacío', () => {
      expect(service.currentUser()).toBeNull();
    });

    it('A-02: Carga usuario persistido de localStorage al init', () => {
      const user: UserProfile = {
        id: 'user123',
        email: 'test@example.com',
        name: 'Test User',
        picture: 'https://example.com/photo.jpg',
        token: 'token_abc123'
      };
      
      localStorage.setItem('current_user', JSON.stringify(user));
      
      // Create a new service instance to trigger init
      const service2 = TestBed.inject(AuthService);
      
      const currentUser = service2.currentUser();
      expect(currentUser).not.toBeNull();
      expect(currentUser?.name).toBe('Test User');
    });
  });

  describe('Login y autenticación (A-03 a A-05)', () => {
    
    it('A-03: loginWithGoogleToken — backend OK', async () => {
      const token = 'google_token_123';
      
      const loginPromise = service.loginWithGoogleToken(token);
      
      const req = httpMock.expectOne(r => r.url.includes('/auth/google-login'));
      req.flush({
        success: true,
        data: {
          id: 'user456',
          email: 'newuser@example.com',
          name: 'New User',
          picture: 'https://example.com/photo2.jpg',
          token: 'new_token_def456'
        }
      });
      
      await loginPromise;
      
      expect(service.currentUser()).not.toBeNull();
      expect(service.currentUser()?.name).toBe('New User');
    });

    it('A-04: loginWithGoogleToken — backend falla → fallback offline', async () => {
      const token = 'invalid_token';
      
      const loginPromise = service.loginWithGoogleToken(token);
      
      const req = httpMock.expectOne(r => r.url.includes('/auth/google-login'));
      req.flush(
        { error: 'Authentication failed' },
        { status: 401, statusText: 'Unauthorized' }
      );
      
      await loginPromise;
      
      expect(service.currentUser()).not.toBeNull();
    });

    it('A-05: logout() limpia currentUser y localStorage', () => {
      const user: UserProfile = {
        id: 'user123',
        email: 'test@example.com',
        name: 'Test User',
        picture: 'https://example.com/photo.jpg',
        token: 'token_abc123'
      };
      
      service.currentUser.set(user);
      localStorage.setItem('current_user', JSON.stringify(user));
      
      service.logout();
      
      expect(service.currentUser()).toBeNull();
      expect(localStorage.getItem('current_user')).toBeNull();
    });
  });

  describe('Eventos de autenticación', () => {
    
    it('should dispatch auth:login-success event on successful login', (done) => {
      const token = 'token123';
      
      // Listen for custom event
      window.addEventListener('auth:login-success', () => {
        expect(service.currentUser()).not.toBeNull();
        done();
      });
      
      service.loginWithGoogleToken(token).then(() => {
        const req = httpMock.expectOne(r => r.url.includes('/auth/google-login'));
        req.flush({
          success: true,
          data: {
            id: 'user789',
            email: 'event@example.com',
            name: 'Event User',
            picture: 'https://example.com/event.jpg',
            token: 'event_token_ghi789'
          }
        });
      });
    });
  });
});
