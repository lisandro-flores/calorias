import { Injectable, signal } from '@angular/core';

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
  // Estado global reactivo para el usuario
  currentUser = signal<UserProfile | null>(null);

  /**
   * Recibe el token JWT de Google tras un login exitoso.
   * Lo envía al backend Node.js/MongoDB para validar y recuperar al usuario local.
   */
  async loginWithGoogleToken(googleJwt: string) {
    /* 
     * [MOCK] Lógica real que enviarías a tu backend conectado a MongoDB:
     * 
     * const response = await fetch('https://api.tu-backend.com/auth/google', {
     *   method: 'POST',
     *   headers: { 'Content-Type': 'application/json' },
     *   body: JSON.stringify({ token: googleJwt })
     * });
     * const mongoUser = await response.json();
     */
    
    // Decodificación de prueba (solo del payload JWT base64)
    const payloadInfo = this.decodeJwt(googleJwt);
    
    const mockMongoUser: UserProfile = {
      id: 'mongo_64fb1c8...',
      email: payloadInfo.email,
      name: payloadInfo.name,
      picture: payloadInfo.picture,
      token: googleJwt
    };

    this.currentUser.set(mockMongoUser);
    return mockMongoUser;
  }

  logout() {
    this.currentUser.set(null);
  }

  private decodeJwt(token: string) {
    try {
      return JSON.parse(atob(token.split('.')[1]));
    } catch (e) {
      return { email: 'user@test.com', name: 'Usuario', picture: '' };
    }
  }
}
