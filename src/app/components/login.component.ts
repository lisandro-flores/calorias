import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { environment } from '../../environments/environment';

declare var google: any;

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, IonicModule],
  template: `
    <ion-content>
      <div class="login-container">
        <!-- Brand -->
        <div class="brand">
          <ion-icon class="brand-icon" name="flame"></ion-icon>
          <h1>FuelSmart</h1>
          <p class="tagline">Tu nutrición, simplificada</p>
        </div>

        <!-- Auth Section -->
        <div class="auth-section">
          <button
            *ngIf="showReloginButton"
            class="relogin-btn"
            type="button"
            (click)="renderGoogleButton()">
            Volver a iniciar sesión
          </button>

          <div id="googleSignInBtn" class="google-btn"></div>

          <!-- Skip login button for testing / offline use -->
          <button class="skip-btn" (click)="skipLogin()">
            Continuar sin cuenta
          </button>
        </div>
      </div>
    </ion-content>
  `,
  styles: [`
    .login-container {
      position: relative;
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      height: 100%;
      padding: 40px 24px;
      text-align: center;
      overflow: hidden;
      background: var(--app-bg);
    }

    /* Ambient Backgrounds (from landing) */
    .ambient-light {
      position: absolute;
      border-radius: 50%;
      filter: blur(100px);
      z-index: 0;
      opacity: 0.5;
      animation: drift 15s infinite alternate ease-in-out;
    }
    .light-1 {
      top: -15%; right: -10%; width: 400px; height: 400px;
      background: rgba(0, 153, 255, 0.4);
      animation-delay: 0s;
    }
    .light-2 {
      bottom: -15%; left: -10%; width: 500px; height: 500px;
      background: rgba(255, 64, 129, 0.3);
      animation-delay: -5s;
    }
    .light-3 {
      top: 40%; left: 50%; width: 300px; height: 300px;
      background: rgba(0, 230, 118, 0.15);
      transform: translateX(-50%);
      animation-delay: -10s;
    }

    .grid-overlay {
      position: absolute;
      top: 0; left: 0; right: 0; bottom: 0;
      background-image: linear-gradient(rgba(255, 255, 255, 0.03) 1px, transparent 1px),
                        linear-gradient(90deg, rgba(255, 255, 255, 0.03) 1px, transparent 1px);
      background-size: 30px 30px;
      z-index: 1;
      mask-image: radial-gradient(circle at center, black 0%, transparent 80%);
      -webkit-mask-image: radial-gradient(circle at center, black 0%, transparent 80%);
    }

    @keyframes drift {
      0% { transform: translate(0, 0) scale(1); }
      100% { transform: translate(40px, -40px) scale(1.2); }
    }

    .brand, .auth-section {
      position: relative;
      z-index: 10;
    }

    .brand {
      margin-bottom: 60px;
      animation: fadeUp 0.8s cubic-bezier(0.2, 0.8, 0.2, 1) forwards;
    }
    @keyframes fadeUp {
      from { opacity: 0; transform: translateY(30px); }
      to { opacity: 1; transform: translateY(0); }
    }
    .brand-icon {
      font-size: 56px;
      margin-bottom: 16px;
      color: var(--app-accent);
    }
    h1 {
      font-size: 32px;
      font-weight: 700;
      color: var(--app-text);
      margin: 0 0 8px;
      letter-spacing: -0.5px;
    }
    .tagline {
      font-size: 14px;
      color: var(--app-muted);
      margin: 0;
      letter-spacing: 0.3px;
    }

    .auth-section {
      width: 100%;
      max-width: 300px;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 20px;
      animation: fadeUp 0.8s cubic-bezier(0.2, 0.8, 0.2, 1) forwards;
      animation-delay: 0.2s;
      opacity: 0;
    }
    .google-btn {
      display: flex;
      justify-content: center;
    }
    .relogin-btn {
      width: 100%;
      border: 0;
      border-radius: 999px;
      padding: 12px 18px;
      background: linear-gradient(135deg, var(--app-accent), #f8d56b);
      color: #111;
      font-size: 14px;
      font-weight: 700;
      cursor: pointer;
      font-family: inherit;
      box-shadow: 0 8px 24px rgba(255, 214, 102, 0.22);
    }
    .relogin-btn:active {
      transform: translateY(1px);
    }
    .skip-btn {
      background: rgba(255,255,255,0.05);
      border: 1px solid var(--app-border);
      border-radius: 20px;
      padding: 10px 24px;
      color: var(--app-muted);
      font-size: 13px;
      font-family: inherit;
      cursor: pointer;
      transition: all 0.2s;
    }
    .skip-btn:active {
      background: var(--app-surface);
      transform: scale(0.96);
    }
  `]
})
export class LoginComponent implements OnInit {
  private authService = inject(AuthService);
  private router = inject(Router);
  showReloginButton = false;

  ngOnInit() {
    // If already logged in, go to dashboard
    if (this.authService.currentUser()) {
      this.router.navigate(['/tabs/dashboard']);
      return;
    }

    this.showReloginButton = Boolean((history.state as { showReloginButton?: boolean } | null)?.showReloginButton);
    this.renderGoogleButton();
  }

  renderGoogleButton() {
    // Inicializa la librería de Google (asegúrate de que Google client script esté en index.html)
    if (typeof google === 'undefined' || !google.accounts) return;

    google.accounts.id.initialize({
      client_id: environment.googleClientId,
      callback: this.handleCredentialResponse.bind(this)
    });

    google.accounts.id.renderButton(
      document.getElementById('googleSignInBtn'),
      { theme: 'outline', size: 'large', shape: 'pill', text: 'continue_with' }
    );
  }

  async handleCredentialResponse(response: any) {
    if(response.credential) {
      await this.authService.loginWithGoogleToken(response.credential);
      this.router.navigate(['/tabs/dashboard']);
    }
  }

  skipLogin() {
    // Create an offline user so the guard lets us through
    this.authService.currentUser.set({
      id: 'offline_mode',
      email: '',
      name: 'Usuario',
      picture: '',
      token: '',
    });
    this.router.navigate(['/tabs/dashboard']);
  }
}