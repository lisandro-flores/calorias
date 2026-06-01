import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonContent, IonIcon } from '@ionic/angular/standalone';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { addIcons } from 'ionicons';
import { flash, sparkles, cloudDone, arrowForward, personOutline } from 'ionicons/icons';

@Component({
  selector: 'app-onboarding',
  standalone: true,
  imports: [CommonModule, IonContent, IonIcon, FormsModule],
  template: `
    <ion-content scroll-y="false">
      <div class="onboarding-root">
        <!-- Background Elements -->
        <div class="ambient-glow" [class]="'glow-step-' + step"></div>

        <div class="slides-container">
          <!-- Slide 0 -->
          <div class="slide" [class.active]="step === 0" [class.prev]="step > 0">
            <div class="icon-wrapper accent">
              <ion-icon name="flash"></ion-icon>
            </div>
            <h2>Contador Minimalista</h2>
            <p>Registra tus calorías y macros de la forma más rápida, visual y sin distracciones.</p>
          </div>

          <!-- Slide 1 -->
          <div class="slide" [class.active]="step === 1" [class.prev]="step > 1" [class.next]="step < 1">
            <div class="icon-wrapper accent-2">
              <ion-icon name="sparkles"></ion-icon>
            </div>
            <h2>Impulsado por IA</h2>
            <p>Solo escribe o dicta lo que comiste y la inteligencia artificial calculará tus macros al instante.</p>
          </div>

          <!-- Slide 2 -->
          <div class="slide" [class.active]="step === 2" [class.prev]="step > 2" [class.next]="step < 2">
            <div class="icon-wrapper blue">
              <ion-icon name="cloud-done"></ion-icon>
            </div>
            <h2>Sincronización Total</h2>
            <p>Inicia sesión con Google para mantener tu progreso seguro y sincronizado en todos tus dispositivos.</p>
          </div>

          <!-- Slide 3 (Profile Setup) -->
          <div class="slide" [class.active]="step === 3" [class.next]="step < 3">
            <div class="icon-wrapper accent">
              <ion-icon name="person-outline"></ion-icon>
            </div>
            <h2>Conozcámonos</h2>
            <p>Ingresa tus datos básicos para calcular tus metas iniciales.</p>
            
            <div class="profile-form">
              <div class="input-row">
                <input type="number" [(ngModel)]="currentWeight" placeholder="Peso actual" />
                <span>kg</span>
              </div>
              <div class="input-row">
                <input type="number" [(ngModel)]="goalWeight" placeholder="Peso meta" />
                <span>kg</span>
              </div>
              <div class="input-row">
                <input type="number" [(ngModel)]="height" placeholder="Estatura" />
                <span>cm</span>
              </div>
            </div>
          </div>
        </div>

        <div class="bottom-section">
          <!-- Progress Dots -->
          <div class="progress-dots">
            <div class="dot" [class.active]="step === 0"></div>
            <div class="dot" [class.active]="step === 1"></div>
            <div class="dot" [class.active]="step === 2"></div>
            <div class="dot" [class.active]="step === 3"></div>
          </div>

          <!-- Controls -->
          <div class="controls">
            <button class="skip-btn" (click)="skip()" *ngIf="step < 3">Saltar</button>
            <div class="spacer" *ngIf="step === 3"></div>
            
            <button class="next-btn" (click)="next()" [disabled]="step === 3 && !isProfileValid()">
              <span *ngIf="step < 3">Siguiente</span>
              <span *ngIf="step === 3">Comenzar</span>
              <ion-icon name="arrow-forward"></ion-icon>
            </button>
          </div>
        </div>
      </div>
    </ion-content>
  `,
  styles: [`
    :host {
      --glow-accent: rgba(240, 168, 68, 0.2);
      --glow-accent-2: rgba(94, 234, 212, 0.2);
      --glow-blue: rgba(56, 189, 248, 0.2);
    }
    .onboarding-root {
      position: relative;
      height: 100%;
      display: flex;
      flex-direction: column;
      overflow: hidden;
      background: var(--app-bg);
    }
    
    .ambient-glow {
      position: absolute;
      top: 20%;
      left: 50%;
      width: 300px;
      height: 300px;
      transform: translate(-50%, -50%);
      border-radius: 50%;
      filter: blur(80px);
      z-index: 0;
      transition: background 0.6s ease;
    }
    .glow-step-0 { background: var(--glow-accent); }
    .glow-step-1 { background: var(--glow-accent-2); }
    .glow-step-2 { background: var(--glow-blue); }

    .slides-container {
      flex: 1;
      position: relative;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .slide {
      position: absolute;
      width: 100%;
      padding: 0 32px;
      text-align: center;
      opacity: 0;
      transform: translateX(100px);
      transition: all 0.5s cubic-bezier(0.2, 0.8, 0.2, 1);
      pointer-events: none;
      z-index: 1;
    }
    .slide.active {
      opacity: 1;
      transform: translateX(0);
      pointer-events: auto;
    }
    .slide.prev {
      transform: translateX(-100px);
    }
    .slide.next {
      transform: translateX(100px);
    }

    .icon-wrapper {
      width: 96px;
      height: 96px;
      margin: 0 auto 32px;
      border-radius: 28px;
      display: flex;
      justify-content: center;
      align-items: center;
      font-size: 48px;
      background: var(--app-surface);
      border: 1px solid var(--app-border);
      box-shadow: 0 16px 32px rgba(0,0,0,0.3);
    }
    .icon-wrapper.accent { color: var(--app-accent); }
    .icon-wrapper.accent-2 { color: var(--app-accent-2); }
    .icon-wrapper.blue { color: #38bdf8; }

    h2 {
      font-size: 28px;
      font-weight: 800;
      letter-spacing: -0.5px;
      margin: 0 0 16px;
      color: #fff;
    }

    p {
      font-size: 16px;
      line-height: 1.5;
      color: var(--app-muted);
      margin: 0 auto;
      max-width: 320px;
    }

    .bottom-section {
      padding: 0 24px 48px;
      z-index: 10;
    }

    .progress-dots {
      display: flex;
      justify-content: center;
      gap: 8px;
      margin-bottom: 32px;
    }
    .dot {
      width: 8px;
      height: 8px;
      border-radius: 4px;
      background: rgba(255,255,255,0.15);
      transition: all 0.3s ease;
    }
    .dot.active {
      width: 24px;
      background: var(--app-text);
    }

    .controls {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .skip-btn {
      background: transparent;
      border: none;
      color: var(--app-muted);
      font-size: 15px;
      font-weight: 600;
      padding: 12px;
    }

    .spacer {
      flex: 1;
    }

    .next-btn {
      display: flex;
      align-items: center;
      gap: 8px;
      background: #fff;
      color: #000;
      border: none;
      padding: 16px 28px;
      border-radius: 100px;
      font-size: 16px;
      font-weight: 700;
      transition: transform 0.2s;
    }
    .next-btn:active {
      transform: scale(0.96);
    }
    .next-btn ion-icon {
      font-size: 20px;
    }
    .profile-form {
      display: flex; flex-direction: column; gap: 12px; margin-top: 24px;
      max-width: 260px; margin-left: auto; margin-right: auto;
    }
    .input-row {
      display: flex; align-items: center; background: var(--app-surface);
      border: 1px solid var(--app-border); border-radius: 12px; padding: 4px 16px;
    }
    .input-row input {
      flex: 1; background: transparent; border: none; color: var(--app-text);
      font-size: 16px; padding: 12px 0; outline: none; font-family: inherit;
    }
    .input-row span { color: var(--app-muted); font-size: 14px; font-weight: 500; }
  `]
})
export class OnboardingComponent {
  private router = inject(Router);
  step = 0;

  currentWeight = '';
  goalWeight = '';
  height = '';

  constructor() {
    addIcons({ flash, sparkles, cloudDone, 'arrow-forward': arrowForward, 'person-outline': personOutline });
  }

  isProfileValid() {
    return Number(this.currentWeight) > 20 && Number(this.goalWeight) > 20 && Number(this.height) > 100;
  }

  next() {
    if (this.step < 3) {
      this.step += 1;
      return;
    }
    this.finish();
  }

  skip() {
    this.finish();
  }

  finish() {
    try { 
      localStorage.setItem('onboardingSeen', '1'); 
      if (this.isProfileValid()) {
        const profileStr = localStorage.getItem('user_profile');
        let profile = profileStr ? JSON.parse(profileStr) : {};
        profile.currentWeight = Number(this.currentWeight);
        profile.startWeight = Number(this.currentWeight);
        profile.goalWeight = Number(this.goalWeight);
        profile.heightCm = Number(this.height);
        localStorage.setItem('user_profile', JSON.stringify(profile));
      }
    } catch (e) {}
    this.router.navigate(['/login']);
  }
}
