import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonContent, IonIcon } from '@ionic/angular/standalone';
import { Router } from '@angular/router';
import { addIcons } from 'ionicons';
import { scan, bulb, leaf, arrowForward } from 'ionicons/icons';

@Component({
  selector: 'app-landing',
  standalone: true,
  imports: [CommonModule, IonContent, IonIcon],
  template: `
    <ion-content scroll-y="false">
      <div class="landing-container">
        <!-- Advanced Ambient Background -->
        <div class="ambient-light light-1"></div>
        <div class="ambient-light light-2"></div>
        <div class="ambient-light light-3"></div>
        
        <!-- Grid Overlay for Depth -->
        <div class="grid-overlay"></div>

        <!-- Main Content -->
        <div class="content-wrapper">
          <div class="hero-brand" style="--delay: 0.2s">
            <div class="brand-icon-wrapper">
              <div class="brand-icon-glow"></div>
              <span class="brand-icon">🔥</span>
            </div>
            <h1 class="title">Fuel<span>Smart</span></h1>
            <p class="tagline">La IA que transforma tu nutrición.</p>
          </div>

          <div class="feature-cards">
            <div class="feature-card" style="--delay: 0.4s">
              <div class="icon-box blue"><ion-icon name="scan"></ion-icon></div>
              <div class="text-box">
                <h3>Cero Estrés</h3>
                <p>Escribe tu comida y la IA calcula tus macros al instante.</p>
              </div>
            </div>

            <div class="feature-card" style="--delay: 0.6s">
              <div class="icon-box pink"><ion-icon name="bulb"></ion-icon></div>
              <div class="text-box">
                <h3>Coach Activo</h3>
                <p>Consejos personalizados basados en tu progreso diario.</p>
              </div>
            </div>
            
            <div class="feature-card" style="--delay: 0.8s">
              <div class="icon-box green"><ion-icon name="leaf"></ion-icon></div>
              <div class="text-box">
                <h3>Minimalista</h3>
                <p>Diseño enfocado en lo que importa, sin distracciones.</p>
              </div>
            </div>
          </div>

          <div class="cta-section" style="--delay: 1s">
            <button class="start-btn" (click)="goToLogin()">
              <span class="btn-text">Comenzar mi viaje</span>
              <ion-icon name="arrow-forward"></ion-icon>
            </button>
            <p class="sub-cta">Sincronización en la nube incluida</p>
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
      height: 100%;
      width: 100%;
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      overflow: hidden;
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

    .content-wrapper {
      position: relative;
      z-index: 10;
      width: 100%;
      max-width: 480px;
      display: flex;
      flex-direction: column;
      height: 100%;
      justify-content: space-evenly;
      padding: 40px 0;
    }

    /* Animation Utilities */
    .hero-brand, .feature-card, .cta-section {
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
    }
    .brand-icon-wrapper {
      position: relative;
      width: 100px;
      height: 100px;
      margin: 0 auto 24px;
      display: flex;
      justify-content: center;
      align-items: center;
    }
    .brand-icon-glow {
      position: absolute;
      inset: 0;
      background: conic-gradient(from 180deg at 50% 50%, var(--primary-color) 0deg, var(--secondary-color) 180deg, var(--primary-color) 360deg);
      border-radius: 30px;
      filter: blur(20px);
      opacity: 0.6;
      animation: spin 4s linear infinite;
    }
    @keyframes spin { 100% { transform: rotate(360deg); } }
    .brand-icon {
      font-size: 56px;
      position: relative;
      z-index: 2;
      background: #111;
      width: 100%;
      height: 100%;
      display: flex;
      justify-content: center;
      align-items: center;
      border-radius: 28px;
      border: 1px solid rgba(255, 255, 255, 0.1);
    }

    .title {
      font-size: 48px;
      font-weight: 900;
      color: #fff;
      margin: 0 0 8px;
      letter-spacing: -1.5px;
    }
    .title span {
      color: var(--primary-color);
    }
    .tagline {
      font-size: 18px;
      color: #a1a1aa;
      margin: 0;
    }

    /* Features Section */
    .feature-cards {
      display: flex;
      flex-direction: column;
      gap: 16px;
      margin: 30px 0;
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
      transition: background 0.3s ease;
    }
    .feature-card:active {
      background: rgba(255, 255, 255, 0.08);
    }
    .icon-box {
      width: 50px;
      height: 50px;
      border-radius: 14px;
      display: flex;
      justify-content: center;
      align-items: center;
      font-size: 24px;
    }
    .icon-box.blue { background: rgba(0, 153, 255, 0.1); color: var(--primary-color); }
    .icon-box.pink { background: rgba(255, 64, 129, 0.1); color: var(--secondary-color); }
    .icon-box.green { background: rgba(0, 230, 118, 0.1); color: var(--tertiary-color); }
    
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
      background: linear-gradient(135deg, rgba(0,153,255,0.2), rgba(255,64,129,0.2));
      opacity: 0;
      transition: opacity 0.3s;
    }
    .start-btn:active {
      transform: scale(0.96);
    }
    .start-btn:active::before {
      opacity: 1;
    }
    .btn-text {
      position: relative;
      z-index: 1;
    }
    .start-btn ion-icon {
      position: relative;
      z-index: 1;
      font-size: 22px;
      transition: transform 0.3s;
    }
    .start-btn:hover ion-icon {
      transform: translateX(5px);
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

  constructor() {
    addIcons({
      scan,
      bulb,
      leaf,
      'arrow-forward': arrowForward
    });
  }

  ngOnInit() {
    // Optional: preload heavy routes
  }

  goToLogin() {
    this.router.navigate(['/login']);
  }
}

