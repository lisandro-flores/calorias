import { inject } from '@angular/core';
import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { environment } from '../../environments/environment';
import { AuthService } from './auth.service';

export const authTokenInterceptor: HttpInterceptorFn = (req, next) => {
  if (!req.url.startsWith(environment.apiUrl) || req.url.includes('/auth/google')) {
    return next(req);
  }

  const authService = inject(AuthService);
  const router = inject(Router);
  let request = req;

  try {
    const storedUser = localStorage.getItem('current_user');
    const token = storedUser ? JSON.parse(storedUser)?.token : null;

    if (token) {
      request = req.clone({
        setHeaders: {
          Authorization: `Bearer ${token}`,
        },
      });
    }
  } catch {
    // Continue without a token; the backend will reject protected routes.
  }

  return next(request).pipe(
    catchError((error: unknown) => {
      if (error instanceof HttpErrorResponse && error.status === 401) {
        authService.logout();
        void router.navigate(['/login'], { state: { showReloginButton: true } });
      }
      return throwError(() => error);
    }),
  );
};
