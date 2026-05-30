import { Injectable, signal, inject, effect } from '@angular/core';
import { HttpClient } from '@angular/common/http';

import { environment } from '../../environments/environment';

export interface UserProfile {
  id: string; // ID en MongoDB
  email: string;
  name: string;
  picture: string;
  token: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private http = inject(HttpClient);

  // Estado global reactivo para el usuario cargando del almacenamiento local si existe
  currentUser = signal<UserProfile | null>(this.loadStoredUser());

  constructor() {
    // Sincronizar el estado del usuario con localStorage automáticamente
    effect(() => {
      const user = this.currentUser();
      if (user) {
        localStorage.setItem('current_user', JSON.stringify(user));
      } else {
        localStorage.removeItem('current_user');
      }
    });
  }

  /**
   * Recibe el token JWT de Google tras un login exitoso.
   * Lo envía al backend Node.js (NestJS) para validar y encontrar a MongoUser.
   */
  async loginWithGoogleToken(googleJwt: string) {
    try {
      const response = await fetch(`${environment.apiUrl}/auth/google`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: googleJwt })
      });
      
      if (!response.ok) throw new Error('Backend rechazó el token');
      
      const mongoUser: UserProfile = await response.json();
      this.currentUser.set(mongoUser);
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('auth:login-success', { detail: { userId: mongoUser.id } }));
      }
      return mongoUser;
      
    } catch (e) {
      console.error("Error en validación NestJS:", e);
      throw e;
    }
  }

  logout() {
    this.currentUser.set(null);
  }

  private loadStoredUser(): UserProfile | null {
    try {
      const stored = localStorage.getItem('current_user');
      return stored ? JSON.parse(stored) : null;
    } catch (e) {
      return null;
    }
  }

}
