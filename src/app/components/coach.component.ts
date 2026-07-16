import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { AiService } from '../services/ai.service';
import { NutritionStateService } from '../services/nutrition-state.service';
import { marked } from 'marked';

@Component({
  selector: 'app-coach',
  standalone: true,
  imports: [CommonModule, IonicModule],
  template: `
    <ion-content class="ion-padding">
      <div class="header-section">
        <ion-icon name="bulb-outline" class="huge-icon"></ion-icon>
        <h2>Coach Proactivo</h2>
        <p>Analizo tu historial de la última semana para darte insights personalizados.</p>
      </div>

      <ion-button expand="block" shape="round" class="analyze-btn" (click)="getAdvice()" [disabled]="isLoading()">
        <span *ngIf="isLoading()">Analizando...</span>
        <span *ngIf="!isLoading()">Generar Análisis Semanal <ion-icon name="sparkles"></ion-icon></span>
      </ion-button>

      <div class="advice-card" *ngIf="adviceHtml()">
        <h3>Análisis y Recomendaciones:</h3>
        <div class="markdown-content" [innerHTML]="adviceHtml()"></div>
      </div>

      <div class="error-msg" *ngIf="errorMsg()">
        {{ errorMsg() }}
      </div>
    </ion-content>
  `,
  styles: [`
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
      color: var(--app-text);
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
    ::ng-deep .markdown-content {
      color: var(--app-text);
      line-height: 1.6;
      font-size: 15px;
    }
    ::ng-deep .markdown-content p {
      margin-top: 0;
      margin-bottom: 12px;
    }
    ::ng-deep .markdown-content ul, ::ng-deep .markdown-content ol {
      padding-left: 20px;
      margin-bottom: 12px;
    }
    ::ng-deep .markdown-content li {
      margin-bottom: 6px;
    }
    ::ng-deep .markdown-content strong {
      color: #fff;
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
  adviceHtml = signal('');
  errorMsg = signal('');

  async getAdvice() {
    this.isLoading.set(true);
    this.adviceHtml.set('');
    this.errorMsg.set('');

    const profile = this.nutritionState.userProfile();
    const meals = this.nutritionState.meals();
    
    // Get last 7 days of history, excluding today since it's already in 'meals'
    const today = new Date().toISOString().split('T')[0];
    const history = this.nutritionState.history()
      .filter(h => h.date !== today)
      .slice(-7);

    this.aiService.getCoachAdvice(profile, meals, history).subscribe({
      next: async (res) => {
        const html = await marked.parse(res.advice);
        this.adviceHtml.set(html);
        this.isLoading.set(false);
      },
      error: (err) => {
        this.errorMsg.set('No se pudo obtener el consejo en este momento. Intenta más tarde.');
        this.isLoading.set(false);
      }
    });
  }
}
