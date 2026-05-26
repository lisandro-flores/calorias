import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { AiService } from '../services/ai.service';
import { NutritionStateService } from '../services/nutrition-state.service';

@Component({
  selector: 'app-coach',
  standalone: true,
  imports: [CommonModule, IonicModule],
  template: `
    <ion-header class="ion-no-border">
      <ion-toolbar>
        <ion-title class="page-title">Coach IA</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content class="ion-padding">
      <div class="header-section">
        <ion-icon name="bulb-outline" class="huge-icon"></ion-icon>
        <h2>Asistente de Nutrición</h2>
        <p>Tu coach analiza tu ingesta del día y te da recomendaciones clave para lograr tu meta.</p>
      </div>

      <ion-button expand="block" shape="round" class="analyze-btn" (click)="getAdvice()" [disabled]="isLoading()">
        {{ isLoading() ? 'Analizando...' : 'Analizar Mi Día ✨' }}
      </ion-button>

      <div class="advice-card" *ngIf="advice()">
        <h3>Recomendación del Coach:</h3>
        <p class="advice-text">{{ advice() }}</p>
      </div>

      <div class="error-msg" *ngIf="errorMsg()">
        {{ errorMsg() }}
      </div>
    </ion-content>
  `,
  styles: [`
    .page-title {
      font-size: 20px;
      font-weight: 700;
    }
    .header-section {
      text-align: center;
      margin-bottom: 30px;
    }
    .huge-icon {
      font-size: 64px;
      color: var(--app-accent);
      margin-bottom: 15px;
    }
    h2 {
      font-size: 22px;
      font-weight: 700;
      margin-bottom: 10px;
    }
    p {
      color: var(--app-muted);
      font-size: 15px;
      line-height: 1.4;
    }
    .analyze-btn {
      --background: var(--app-accent);
      --color: var(--app-bg);
      font-weight: bold;
      margin-bottom: 30px;
    }
    .advice-card {
      background: var(--app-surface);
      border-radius: 16px;
      padding: 20px;
      border: 1px solid var(--app-border);
      animation: fadeIn 0.4s ease-out;
    }
    .advice-card h3 {
      font-size: 18px;
      font-weight: 700;
      color: var(--app-accent);
      margin-top: 0;
      margin-bottom: 15px;
    }
    .advice-text {
      color: var(--app-text);
      line-height: 1.6;
      white-space: pre-wrap;
    }
    .error-msg {
      color: #ff4d4f;
      text-align: center;
      margin-top: 20px;
      font-weight: 500;
    }
    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(10px); }
      to { opacity: 1; transform: translateY(0); }
    }
  `]
})
export class CoachComponent {
  private aiService = inject(AiService);
  private nutritionState = inject(NutritionStateService);

  isLoading = signal(false);
  advice = signal('');
  errorMsg = signal('');

  getAdvice() {
    this.isLoading.set(true);
    this.advice.set('');
    this.errorMsg.set('');

    const profile = this.nutritionState.userProfile();
    const meals = this.nutritionState.meals();

    this.aiService.getCoachAdvice(profile, meals).subscribe({
      next: (res) => {
        this.advice.set(res.advice);
        this.isLoading.set(false);
      },
      error: (err) => {
        this.errorMsg.set('No se pudo obtener el consejo en este momento. Intenta más tarde.');
        this.isLoading.set(false);
      }
    });
  }
}
