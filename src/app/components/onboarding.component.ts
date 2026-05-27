import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonContent } from '@ionic/angular/standalone';
import { Router } from '@angular/router';

@Component({
  selector: 'app-onboarding',
  standalone: true,
  imports: [CommonModule, IonContent],
  template: `
    <ion-content>
      <div class="onboarding-root">
        <div class="slide" *ngIf="step === 0">
          <h2>Bienvenido a FuelSmart</h2>
          <p>Tu asistente de nutrición basado en IA. Registra comidas de forma rápida y sincroniza en la nube.</p>
        </div>

        <div class="slide" *ngIf="step === 1">
          <h2>IA para tus comidas</h2>
          <p>Escribe o habla tu comida y la IA parseará ingredientes y calorías automáticamente.</p>
        </div>

        <div class="slide" *ngIf="step === 2">
          <h2>Sincroniza entre dispositivos</h2>
          <p>Inicia sesión con Google para mantener tu progreso y recientes en todos tus dispositivos.</p>
        </div>

        <div class="controls">
          <button class="skip" (click)="skip()">Saltar</button>
          <button class="next" (click)="next()">{{ step < 2 ? 'Siguiente' : 'Comenzar' }}</button>
        </div>
      </div>
    </ion-content>
  `,
  styles: [`
    .onboarding-root{ padding: 40px; display:flex; flex-direction:column; gap:24px; align-items:center; justify-content:center; height:100%; text-align:center }
    .slide h2{ font-size:24px; margin:0 0 8px }
    .slide p{ color: #c7c7cc }
    .controls{ width:100%; display:flex; justify-content:space-between; gap:12px }
    .controls .next{ background:#fff; border:none; padding:12px 18px; border-radius:12px }
    .controls .skip{ background:transparent; border:1px solid rgba(255,255,255,0.08); padding:10px 14px; border-radius:12px }
  `]
})
export class OnboardingComponent {
  private router = inject(Router);
  step = 0;

  next() {
    if (this.step < 2) {
      this.step += 1;
      return;
    }
    this.finish();
  }

  skip() {
    this.finish();
  }

  finish() {
    try { localStorage.setItem('onboardingSeen', '1'); } catch (e) {}
    this.router.navigate(['/login']);
  }
}
