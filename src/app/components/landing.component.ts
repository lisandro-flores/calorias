import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonContent, IonIcon } from '@ionic/angular/standalone';
import { Router } from '@angular/router';
import { addIcons } from 'ionicons';
import { scan, bulb, leaf, arrowForward, logoAndroid, flame, restaurant, fitness, arrowUp, statsChart, sparkles } from 'ionicons/icons';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-landing',
  standalone: true,
  imports: [CommonModule, IonContent, IonIcon],
  template: `
    <ion-content scroll-y="true">
      <div class="landing-container">
        <!-- Advanced Ambient Background -->
        <div class="ambient-light light-1"></div>
        <div class="ambient-light light-2"></div>
        <div class="ambient-light light-3"></div>
        
        <!-- Grid Overlay for Depth -->
        <div class="grid-overlay"></div>

        <!-- Main Content -->
        <div class="content-wrapper">
          <div class="hero-brand" style="--delay: 0.1s">
            <div class="brand-badge">
              <ion-icon name="sparkles"></ion-icon>
              <span>IA de Nutrición v2.0</span>
            </div>
            <h1 class="title">Fuel<span>Smart</span></h1>
            <p class="tagline">Toma una foto, descubre tus macros. La forma más inteligente de comer bien.</p>
          </div>

          <!-- Dynamic Floating UI Showcase -->
          <div class="showcase-container" style="--delay: 0.3s">
            <div class="glass-mockup main-mockup">
              <div class="mockup-header">
                <ion-icon name="scan"></ion-icon>
                <span>Analizando...</span>
              </div>
              <div class="mockup-img"></div>
              <div class="mockup-results">
                <div class="result-row">
                  <span>Ensalada César</span>
                  <strong>320 kcal</strong>
                </div>
                <div class="macro-bars">
                  <div class="macro-bar p" style="width: 40%"></div>
                  <div class="macro-bar c" style="width: 20%"></div>
                  <div class="macro-bar f" style="width: 35%"></div>
                </div>
              </div>
            </div>

            <div class="glass-mockup floating-mockup top-right">
              <ion-icon name="restaurant" class="accent-icon"></ion-icon>
              <div>
                <strong>+25g</strong>
                <span>Proteína</span>
              </div>
            </div>

            <div class="glass-mockup floating-mockup bottom-left">
              <ion-icon name="bulb" class="accent-icon"></ion-icon>
              <div>
                <strong>Coach</strong>
                <span>Buen progreso hoy</span>
              </div>
            </div>
          </div>

          <div class="feature-cards">
            <div class="feature-card" style="--delay: 0.5s">
              <div class="icon-box blue"><ion-icon name="scan"></ion-icon></div>
              <div class="text-box">
                <h3>Visión Artificial</h3>
                <p>Usa tu cámara y deja que la IA identifique y calcule todo.</p>
              </div>
            </div>

            <div class="feature-card" style="--delay: 0.6s">
              <div class="icon-box pink"><ion-icon name="bulb"></ion-icon></div>
              <div class="text-box">
                <h3>Coach Activo</h3>
                <p>Aprende de tu historial y recibe consejos proactivos.</p>
              </div>
            </div>
          </div>

          <div class="cta-section" style="--delay: 0.8s">
            <button class="start-btn" (click)="goToLogin()">
              <span class="btn-text">Iniciar Sesión</span>
              <ion-icon name="arrow-forward"></ion-icon>
            </button>
            <a href="https://github.com/lisandro-flores/calorias/releases/download/latest/fuelsmart.apk" class="apk-btn">
              <ion-icon name="logo-android"></ion-icon>
              <span class="btn-text">Descargar APK (Android)</span>
            </a>
            <p class="sub-cta">Requiere cuenta de Google para sincronización segura en la nube.</p>
          </div>
        </div>
      </div>
    </ion-content>
  `,
  styles: [`
    :host {
      --primary-color: #0099ff;
      --secondary-color: #ff4081;
      --tertiary-color: #00e676;
    }
    
    ion-content {
      --background: #050505;
    }

    .landing-container {
      position: relative;
      min-height: 100%;
      width: 100%;
      display: flex;
      flex-direction: column;
      align-items: center;
      overflow-x: hidden;
      padding: 0 24px;
    }

    /* Ambient Backgrounds */
    .ambient-light {
      position: absolute;
      border-radius: 50%;
      filter: blur(100px);
      z-index: 0;
      opacity: 0.5;
      animation: drift 15s infinite alternate ease-in-out;
    }
    .light-1 {
      top: -5%; right: -10%; width: 400px; height: 400px;
      background: rgba(0, 153, 255, 0.4);
      animation-delay: 0s;
    }
    .light-2 {
      bottom: 20%; left: -10%; width: 500px; height: 500px;
      background: rgba(255, 64, 129, 0.3);
      animation-delay: -5s;
    }
    .light-3 {
      top: 40%; left: 50%; width: 300px; height: 300px;
      background: rgba(255, 193, 7, 0.2);
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

    .content-wrapper {
      position: relative;
      z-index: 10;
      width: 100%;
      max-width: 480px;
      display: flex;
      flex-direction: column;
      padding: 60px 0 40px;
    }

    /* Animation Utilities */
    .hero-brand, .showcase-container, .feature-card, .cta-section {
      opacity: 0;
      animation: fadeUp 0.8s cubic-bezier(0.2, 0.8, 0.2, 1) forwards;
      animation-delay: var(--delay);
    }

    @keyframes fadeUp {
      from { opacity: 0; transform: translateY(30px); }
      to { opacity: 1; transform: translateY(0); }
    }

    /* Brand Section */
    .hero-brand {
      text-align: center;
      margin-bottom: 40px;
    }
    .brand-badge {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      background: rgba(255, 193, 7, 0.15);
      border: 1px solid rgba(255, 193, 7, 0.3);
      color: #ffc107;
      padding: 6px 14px;
      border-radius: 999px;
      font-size: 13px;
      font-weight: 700;
      margin-bottom: 20px;
      box-shadow: 0 4px 12px rgba(255, 193, 7, 0.1);
    }
    .title {
      font-size: 52px;
      font-weight: 900;
      color: #fff;
      margin: 0 0 16px;
      letter-spacing: -1.5px;
      line-height: 1.1;
    }
    .title span {
      background: linear-gradient(135deg, var(--primary-color), #ffc107);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }
    .tagline {
      font-size: 16px;
      color: #a1a1aa;
      margin: 0;
      line-height: 1.5;
    }

    /* Showcase Container */
    .showcase-container {
      position: relative;
      width: 100%;
      height: 240px;
      margin: 0 0 40px;
      display: flex;
      justify-content: center;
      align-items: center;
    }
    .glass-mockup {
      background: rgba(255, 255, 255, 0.05);
      backdrop-filter: blur(16px);
      -webkit-backdrop-filter: blur(16px);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 20px;
      box-shadow: 0 20px 40px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.1);
    }
    .main-mockup {
      width: 220px;
      padding: 16px;
      display: flex;
      flex-direction: column;
      gap: 12px;
      animation: floatMain 6s ease-in-out infinite;
    }
    .mockup-header {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 12px;
      color: var(--primary-color);
      font-weight: 700;
    }
    .mockup-img {
      width: 100%;
      height: 100px;
      border-radius: 12px;
      background: linear-gradient(135deg, rgba(255,255,255,0.1), rgba(255,255,255,0.02));
      position: relative;
      overflow: hidden;
    }
    .mockup-img::after {
      content: '';
      position: absolute;
      top: 0; left: -100%; width: 50%; height: 100%;
      background: linear-gradient(90deg, transparent, rgba(255,255,255,0.1), transparent);
      animation: scan 2s infinite;
    }
    @keyframes scan {
      100% { left: 200%; }
    }
    .result-row {
      display: flex;
      justify-content: space-between;
      color: #fff;
      font-size: 14px;
    }
    .macro-bars {
      display: flex;
      gap: 4px;
      height: 4px;
      border-radius: 2px;
      overflow: hidden;
      margin-top: 4px;
    }
    .macro-bar { height: 100%; }
    .macro-bar.p { background: var(--primary-color); }
    .macro-bar.c { background: var(--tertiary-color); }
    .macro-bar.f { background: var(--secondary-color); }

    .floating-mockup {
      position: absolute;
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 12px 16px;
      animation: floatSide 5s ease-in-out infinite alternate;
    }
    .floating-mockup.top-right {
      top: 20px; right: 0;
      animation-delay: -2s;
    }
    .floating-mockup.bottom-left {
      bottom: 20px; left: 0;
      animation-delay: -4s;
    }
    .accent-icon {
      font-size: 24px;
      color: #ffc107;
    }
    .floating-mockup div {
      display: flex;
      flex-direction: column;
    }
    .floating-mockup strong { color: #fff; font-size: 14px; }
    .floating-mockup span { color: #a1a1aa; font-size: 11px; }

    @keyframes floatMain {
      0%, 100% { transform: translateY(0); }
      50% { transform: translateY(-10px); }
    }
    @keyframes floatSide {
      0% { transform: translateY(0) translateX(0); }
      100% { transform: translateY(15px) translateX(-5px); }
    }

    /* Features Section */
    .feature-cards {
      display: flex;
      flex-direction: column;
      gap: 16px;
      margin-bottom: 40px;
    }
    .feature-card {
      background: rgba(255, 255, 255, 0.03);
      border: 1px solid rgba(255, 255, 255, 0.05);
      border-radius: 20px;
      padding: 16px;
      display: flex;
      align-items: center;
      gap: 16px;
      backdrop-filter: blur(12px);
      -webkit-backdrop-filter: blur(12px);
      transition: background 0.3s ease;
    }
    .icon-box {
      width: 50px;
      height: 50px;
      border-radius: 14px;
      display: flex;
      justify-content: center;
      align-items: center;
      font-size: 24px;
      flex-shrink: 0;
    }
    .icon-box.blue { background: rgba(0, 153, 255, 0.1); color: var(--primary-color); }
    .icon-box.pink { background: rgba(255, 64, 129, 0.1); color: var(--secondary-color); }
    
    .text-box h3 {
      font-size: 16px;
      font-weight: 700;
      color: #fff;
      margin: 0 0 4px;
    }
    .text-box p {
      font-size: 13px;
      color: #a1a1aa;
      margin: 0;
      line-height: 1.4;
    }

    /* CTA Section */
    .cta-section {
      text-align: center;
      margin-top: auto;
    }
    .start-btn {
      position: relative;
      background: #fff;
      color: #000;
      border: none;
      border-radius: 100px;
      height: 60px;
      width: 100%;
      font-size: 18px;
      font-weight: 700;
      display: flex;
      justify-content: center;
      align-items: center;
      gap: 8px;
      cursor: pointer;
      overflow: hidden;
      transition: transform 0.2s cubic-bezier(0.2, 0.8, 0.2, 1);
    }
    .start-btn::before {
      content: '';
      position: absolute;
      top: 0; left: 0; right: 0; bottom: 0;
      background: linear-gradient(135deg, rgba(0,153,255,0.2), rgba(255,193,7,0.4));
      opacity: 0;
      transition: opacity 0.3s;
    }
    .start-btn:active { transform: scale(0.96); }
    .start-btn:active::before { opacity: 1; }
    .btn-text { position: relative; z-index: 1; }
    .start-btn ion-icon {
      position: relative;
      z-index: 1;
      font-size: 22px;
      transition: transform 0.3s;
    }
    .start-btn:hover ion-icon { transform: translateX(5px); }

    .apk-btn {
      position: relative;
      background: transparent;
      color: #fff;
      border: 1px solid rgba(255, 255, 255, 0.2);
      border-radius: 100px;
      height: 60px;
      width: 100%;
      font-size: 16px;
      font-weight: 600;
      display: flex;
      justify-content: center;
      align-items: center;
      gap: 10px;
      cursor: pointer;
      text-decoration: none;
      margin-top: 16px;
      transition: all 0.2s cubic-bezier(0.2, 0.8, 0.2, 1);
    }
    .apk-btn:hover {
      background: rgba(255, 255, 255, 0.05);
      border-color: rgba(255, 255, 255, 0.4);
    }
    .apk-btn:active { transform: scale(0.96); }
    .apk-btn ion-icon {
      font-size: 24px;
      color: var(--tertiary-color);
    }

    .sub-cta {
      font-size: 12px;
      color: #71717a;
      margin-top: 16px;
    }
  `]
})
export class LandingComponent implements OnInit {
  private router = inject(Router);
  private authService = inject(AuthService);

  constructor() {
    addIcons({
      scan, bulb, leaf, 
      'arrow-forward': arrowForward, 
      'logo-android': logoAndroid, 
      flame, restaurant, fitness, 'arrow-up': arrowUp, 'stats-chart': statsChart, sparkles
    });
  }

  ngOnInit() {
    // REDIRECT si el usuario ya está autenticado
    if (this.authService.currentUser()) {
      this.router.navigate(['/tabs/dashboard'], { replaceUrl: true });
    }
  }

  goToLogin() {
    // Open onboarding first for new users
    try {
      const seen = localStorage.getItem('onboardingSeen');
      if (!seen) {
        this.router.navigate(['/onboarding']);
        return;
      }
    } catch (e) {}

    this.router.navigate(['/login']);
  }
}


