import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const authGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  // Si tenemos un usuario en nuestro estado global, pasa
  if (authService.currentUser() !== null) {
    return true;
  }
  
  // Sino, redirígelo a iniciar sesión
  return router.createUrlTree(['/login']);
};