import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

declare var google: any;

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, IonicModule],
  template: `
    <ion-content color="dark">
      <div class="login-container">
        <!-- Logo / Marca -->
        <div class="brand">
          <ion-icon name="fitness-outline" color="primary" class="logo-icon"></ion-icon>
          <h1>Macros<span class="highlight">Sync</span></h1>
          <p>Potenciado por MongoDB</p>
        </div>

        <!-- Botón Nativo de Google Identity Services -->
        <div class="auth-section">
          <p class="subtitle">Comienza tu viaje en un tap</p>
          <div id="googleSignInBtn" class="google-btn"></div>
        </div>
      </div>
    </ion-content>
  `,
  styles: [`
    .login-container {
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      height: 100%;
      padding: 20px;
      text-align: center;
      background: var(--app-bg);
    }
    
    .brand {
      margin-bottom: 60px;
    }
    .logo-icon {
      font-size: 80px;
      margin-bottom: 20px;
    }
    h1 {
      font-size: 32px;
      font-weight: 700;
      margin: 0;
    }
    .highlight {
      color: var(--ion-color-primary);
    }
    .brand p {
      color: var(--ion-color-success);
      font-size: 14px;
      letter-spacing: 1px;
    }
    
    .auth-section {
      width: 100%;
      max-width: 320px;
      background: var(--app-surface);
      padding: 30px 20px;
      border-radius: 20px;
      border: 1px solid var(--app-border);
      box-shadow: 0 10px 30px rgba(0,0,0,0.5);
    }
    .subtitle {
      color: var(--app-muted);
      margin-top: 0;
      margin-bottom: 20px;
      font-size: 14px;
    }
    .google-btn {
      display: flex;
      justify-content: center;
    }
  `]
})
export class LoginComponent implements OnInit {
  private authService = inject(AuthService);
  private router = inject(Router);

  ngOnInit() {
    this.renderGoogleButton();
  }

  renderGoogleButton() {
    // Inicializa la librería de Google (asegúrate de que Google client script esté en index.html)
    if (typeof google === 'undefined' || !google.accounts) return;

    google.accounts.id.initialize({
      client_id: '96118425924-fia28il69d3ng7m7o3at72led0oisd7b.apps.googleusercontent.com', 
      callback: this.handleCredentialResponse.bind(this)
    });

    google.accounts.id.renderButton(
      document.getElementById('googleSignInBtn'),
      { theme: 'outline', size: 'large', shape: 'pill', text: 'continue_with' }
    );
  }

  async handleCredentialResponse(response: any) {
    if(response.credential) {
      // 1. Google nos da el JWT. Se lo mandamos a nuestro estado (y en la realidad al backend Mongo)
      await this.authService.loginWithGoogleToken(response.credential);
      // 2. Redirigimos al Dashboard (por los tabs)
      this.router.navigate(['/tabs/dashboard']);
    }
  }
}