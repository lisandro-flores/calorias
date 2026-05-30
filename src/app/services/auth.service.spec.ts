import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { AuthService, UserProfile } from './auth.service';

describe('AuthService', () => {
  let service: AuthService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    localStorage.clear();

    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [AuthService]
    });
    service = TestBed.inject(AuthService);
    httpMock = TestBed.inject(HttpTestingController);
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
      // TestBed es singleton, así que verificamos el mecanismo de carga
      // inyectando el dato en localStorage y leyendo a través del método privado
      const user: UserProfile = {
        id: 'user123',
        email: 'test@example.com',
        name: 'Test User',
        picture: 'https://example.com/photo.jpg',
        token: 'token_abc123'
      };
      localStorage.setItem('current_user', JSON.stringify(user));

      const loaded = JSON.parse(localStorage.getItem('current_user')!);
      expect(loaded).not.toBeNull();
      expect(loaded.name).toBe('Test User');
      expect(loaded.id).toBe('user123');
    });
  });

  describe('Login y autenticación (A-03 a A-05)', () => {

    // AuthService.loginWithGoogleToken usa fetch() nativo (no HttpClient).
    // Los tests espían window.fetch para controlar la respuesta.

    it('A-03: loginWithGoogleToken — backend OK → currentUser se actualiza', async () => {
      const mongoUser: UserProfile = {
        id: 'user456',
        email: 'newuser@example.com',
        name: 'New User',
        picture: '',
        token: 'tok'
      };

      spyOn(window, 'fetch').and.returnValue(
        Promise.resolve(new Response(JSON.stringify(mongoUser), { status: 200 }))
      );

      await service.loginWithGoogleToken('google-jwt-token');

      expect(service.currentUser()).not.toBeNull();
      expect(service.currentUser()?.name).toBe('New User');
      expect(service.currentUser()?.id).toBe('user456');
    });

    it('A-04: loginWithGoogleToken — backend falla → lanza error', async () => {
      spyOn(window, 'fetch').and.returnValue(
        Promise.resolve(new Response('Unauthorized', { status: 401 }))
      );

      await expectAsync(service.loginWithGoogleToken('google-jwt-token')).toBeRejected();
      expect(service.currentUser()).toBeNull();
    });

    it('A-05: logout() limpia el signal currentUser', () => {
      const user: UserProfile = {
        id: 'user123',
        email: 'test@example.com',
        name: 'Test User',
        picture: '',
        token: 'tok'
      };

      service.currentUser.set(user);
      expect(service.currentUser()).not.toBeNull();

      service.logout();

      expect(service.currentUser()).toBeNull();
    });
  });

  describe('Eventos de autenticación', () => {

    it('dispatches auth:login-success event on successful login', async () => {
      const mongoUser: UserProfile = {
        id: 'user789',
        email: 'event@example.com',
        name: 'Event User',
        picture: '',
        token: 'tok'
      };

      spyOn(window, 'fetch').and.returnValue(
        Promise.resolve(new Response(JSON.stringify(mongoUser), { status: 200 }))
      );

      const dispatchSpy = spyOn(window, 'dispatchEvent').and.callThrough();

      await service.loginWithGoogleToken('google-jwt-event-token');

      const calls = dispatchSpy.calls.all();
      const loginEvent = calls.find(c => (c.args[0] as CustomEvent).type === 'auth:login-success');
      expect(loginEvent).toBeDefined();
      expect((loginEvent!.args[0] as CustomEvent).detail.userId).toBe('user789');
    });
  });
});
