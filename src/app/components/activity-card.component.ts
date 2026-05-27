import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { HealthConnectService } from '../services/health-connect.service';

@Component({
  selector: 'app-activity-card',
  standalone: true,
  imports: [CommonModule, IonicModule],
  template: `
    <div class="activity-card">
      <div class="activity-head">
        <div>
          <div class="activity-title">Actividad de hoy</div>
          <div class="activity-sub">{{ health.statusLabel() }}</div>
        </div>
        <ion-icon name="fitness-outline" class="activity-icon"></ion-icon>
      </div>

      <ng-container *ngIf="health.isAvailable(); else unavailable">
        <div class="metrics">
          <div class="metric">
            <span class="metric-value">{{ health.todaySummary().steps | number:'1.0-0' }}</span>
            <span class="metric-label">Pasos</span>
          </div>
          <div class="metric">
            <span class="metric-value">{{ health.todaySummary().caloriesBurned | number:'1.0-0' }}</span>
            <span class="metric-label">Kcal quemadas</span>
          </div>
          <div class="metric">
            <span class="metric-value">{{ health.weightLabel() }}</span>
            <span class="metric-label">Peso HC</span>
          </div>
        </div>

        <div class="step-track">
          <div class="step-fill" [style.width.%]="health.stepsProgress() * 100"></div>
        </div>

        <div class="actions">
          <button class="action-btn primary" (click)="connect()" [disabled]="health.isBusy()">
            {{ health.isAuthorized() ? 'Actualizar' : 'Conectar' }}
          </button>
          <button class="action-btn subtle" (click)="openPrivacy()">Privacidad</button>
        </div>
      </ng-container>

      <ng-template #unavailable>
        <div class="unavailable">
          Health Connect está disponible solo en Android.
        </div>
      </ng-template>
    </div>
  `,
  styles: [`
    .activity-card {
      background: var(--app-surface);
      border: 1px solid var(--app-border);
      border-radius: 14px;
      padding: 16px;
      margin-bottom: 12px;
    }
    .activity-head {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 14px;
    }
    .activity-title {
      font-size: 12px;
      font-weight: 700;
      color: var(--app-muted);
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .activity-sub {
      font-size: 14px;
      color: var(--app-text);
      margin-top: 4px;
    }
    .activity-icon {
      font-size: 22px;
      color: var(--app-accent);
    }
    .metrics {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 8px;
      margin-bottom: 14px;
    }
    .metric {
      background: var(--app-surface-2);
      border: 1px solid var(--app-border);
      border-radius: 12px;
      padding: 10px 8px;
      text-align: center;
    }
    .metric-value {
      display: block;
      font-size: 16px;
      font-weight: 700;
      color: var(--app-text);
    }
    .metric-label {
      display: block;
      margin-top: 3px;
      font-size: 10px;
      color: var(--app-muted);
      text-transform: uppercase;
      letter-spacing: 0.3px;
    }
    .step-track {
      height: 6px;
      background: rgba(255,255,255,0.06);
      border-radius: 999px;
      overflow: hidden;
      margin-bottom: 12px;
    }
    .step-fill {
      height: 100%;
      background: var(--app-accent-2);
      border-radius: inherit;
      transition: width 0.3s ease;
    }
    .actions {
      display: flex;
      gap: 8px;
    }
    .action-btn {
      flex: 1;
      border-radius: 10px;
      padding: 10px 12px;
      font-family: inherit;
      font-size: 13px;
      font-weight: 600;
      border: 1px solid var(--app-border);
      background: var(--app-surface-2);
      color: var(--app-text);
    }
    .action-btn.primary {
      background: var(--app-accent);
      color: #111;
      border-color: var(--app-accent);
    }
    .action-btn.subtle {
      color: var(--app-muted);
    }
    .unavailable {
      color: var(--app-muted);
      font-size: 13px;
      line-height: 1.5;
    }
  `]
})
export class ActivityCardComponent {
  health = inject(HealthConnectService);

  async connect() {
    await this.health.connect();
  }

  async openPrivacy() {
    await this.health.openPrivacyPolicy();
  }
}
