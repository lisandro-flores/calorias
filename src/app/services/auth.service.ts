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
      return mongoUser;
      
    } catch (e) {
      console.error("Error en validación NestJS:", e);
      // Fallback local por si el server de BD se apaga
      const payloadInfo = this.decodeJwt(googleJwt);
      const mockUser = {
        id: 'offline_mode',
        email: payloadInfo.email,
        name: payloadInfo.name,
        picture: payloadInfo.picture,
        token: googleJwt
      };
      this.currentUser.set(mockUser);
      return mockUser;
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

  private decodeJwt(token: string) {
    try {
      return JSON.parse(atob(token.split('.')[1]));
    } catch (e) {
      return { email: 'user@test.com', name: 'Usuario', picture: '' };
    }
  }
}
