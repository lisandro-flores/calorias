import { Component, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { NutritionStateService } from '../services/nutrition-state.service';

@Component({
  selector: 'app-progress',
  standalone: true,
  imports: [CommonModule, IonicModule],
  template: `
    <ion-content class="ion-padding">
      <div class="progress-hero">
        <div>
          <div class="eyebrow">Progreso</div>
          <h1>Tu avance semanal</h1>
          <p>Revisa calorías, tendencia de peso y rachas sin perder contexto.</p>
        </div>
      </div>

      <div class="section-stack">
        <!-- Weight Progress -->
        <div class="weight-card" *ngIf="showWeight()">
          <div class="weight-header">
            <div class="weight-col">
              <span class="weight-val">{{ state.userProfile().startWeight }}</span>
              <span class="weight-label">Inicio</span>
            </div>
            <div class="weight-arrow">→</div>
            <div class="weight-col current">
              <span class="weight-val accent">{{ state.userProfile().currentWeight }}</span>
              <span class="weight-label">Actual</span>
            </div>
            <div class="weight-arrow">→</div>
            <div class="weight-col">
              <span class="weight-val">{{ state.userProfile().goalWeight }}</span>
              <span class="weight-label">Meta</span>
            </div>
          </div>
          <div class="weight-bar-track">
            <div class="weight-bar-fill" [style.width.%]="weightProgress()"></div>
          </div>
          <div class="weight-stats">
            <span>{{ weightLost() > 0 ? 'Perdido' : 'Ganado' }}: <strong>{{ weightLost() | number:'1.1-1' }} kg</strong></span>
            <span>Por bajar: <strong>{{ weightRemaining() | number:'1.1-1' }} kg</strong></span>
          </div>
        </div>

        <!-- Weekly Prediction from AI context -->
        <div class="prediction-card" *ngIf="state.weeklyWeightChangePrediction() !== null">
          <ion-icon class="prediction-icon" [name]="state.weeklyWeightChangePrediction()! > 0 ? 'trending-down' : 'trending-up'"></ion-icon>
          <div class="prediction-text">
            <span class="prediction-title">
              {{ state.weeklyWeightChangePrediction()! > 0 ? 'Bajando' : 'Subiendo' }}
              ~{{ (state.weeklyWeightChangePrediction()! | number:'1.2-2') }} kg/semana
            </span>
            <span class="prediction-sub">
              Basado en tu promedio vs tu TDEE de {{ state.tdee() }} kcal
            </span>
          </div>
        </div>

        <!-- 7-Day bar chart -->
        <div class="chart-card">
          <div class="chart-head">
            <div class="chart-title">Calorías — Últimos 7 días</div>
            <div class="chart-sub">Meta: {{ goal() }} kcal</div>
          </div>
          <div class="bar-chart" *ngIf="hasAnyCalories(); else emptyCalories">
            <div class="bar-col" *ngFor="let day of weekData()">
              <div class="bar-wrapper">
                <div class="bar"
                  [class.today]="day.label === 'Hoy'"
                  [class.over]="day.calories > goal() && day.calories > 0"
                  [style.height.%]="barHeight(day.calories)">
                </div>
              </div>
              <span class="bar-cal" *ngIf="day.calories > 0">{{ day.calories }}</span>
              <span class="bar-cal empty" *ngIf="day.calories === 0">—</span>
              <span class="bar-label">{{ day.label }}</span>
            </div>
          </div>
          <ng-template #emptyCalories>
            <div class="empty-state">Todavía no hay calorías registradas esta semana.</div>
          </ng-template>
          <div class="goal-indicator">
            <div class="goal-line"></div>
            <span class="goal-label">TDEE: {{ state.tdee() }} kcal</span>
          </div>
        </div>

        <!-- Deficit chart -->
        <div class="chart-card" *ngIf="anyDeficitData()">
          <div class="chart-head">
            <div class="chart-title">Déficit / Superávit diario</div>
            <div class="chart-sub">Comparado con la meta diaria</div>
          </div>
          <div class="deficit-bars">
            <div class="deficit-col" *ngFor="let day of weekData()">
              <div class="deficit-bar-wrapper">
                <!-- Surplus (above center) -->
                <div class="deficit-bar surplus" *ngIf="day.deficit < 0 && day.calories > 0"
                  [style.height.px]="deficitBarHeight(-day.deficit)">
                </div>
                <!-- Deficit (below center) -->
                <div class="deficit-bar deficit" *ngIf="day.deficit > 0 && day.calories > 0"
                  [style.height.px]="deficitBarHeight(day.deficit)">
                </div>
                <div class="deficit-bar empty-bar" *ngIf="day.calories === 0"></div>
              </div>
              <span class="deficit-val" *ngIf="day.calories > 0"
                [class.pos]="day.deficit > 0" [class.neg]="day.deficit < 0">
                {{ day.deficit > 0 ? '-' : '+' }}{{ day.deficit | number:'1.0-0' | slice:0:-1 | slice:(day.deficit < 0 ? 1 : 0) }}
              </span>
              <span class="bar-label">{{ day.label }}</span>
            </div>
          </div>
          <div class="deficit-legend">
            <span class="legend-dot green"></span><span>Déficit (quemas)</span>
            <span class="legend-dot red"></span><span>Superávit (exceso)</span>
          </div>
        </div>

        <!-- Stats row -->
        <div class="stats-row">
          <div class="stat-card">
            <span class="stat-value">{{ avgCalories() | number:'1.0-0' }}</span>
            <span class="stat-label">Prom. diario</span>
          </div>
          <div class="stat-card">
            <span class="stat-value">{{ avgDeficit() | number:'1.0-0' }}</span>
            <span class="stat-label">Déficit prom.</span>
          </div>
          <div class="stat-card">
            <span class="stat-value">{{ daysOnTarget() }}/7</span>
            <span class="stat-label">Días en meta</span>
          </div>
        </div>

        <!-- Streak -->
        <div class="streak-card" *ngIf="streak() > 0">
          <ion-icon class="streak-fire" name="flame"></ion-icon>
          <div class="streak-text">
            <span class="streak-count">{{ streak() }} días</span>
            <span class="streak-label">racha registrando</span>
          </div>
        </div>
      </div>
    </ion-content>
  `,
  styles: [`
    .progress-hero {
      margin-bottom: 14px;
      padding: 2px 2px 6px;
    }
    .eyebrow {
      font-size: 11px;
      font-weight: 700;
      letter-spacing: 0.8px;
      text-transform: uppercase;
      color: var(--app-accent);
      margin-bottom: 4px;
    }
    h1 {
      margin: 0;
      font-size: 28px;
      line-height: 1.1;
      color: var(--app-text);
    }
    .progress-hero p {
      margin: 6px 0 0;
      color: var(--app-muted);
      font-size: 13px;
      line-height: 1.45;
      max-width: 280px;
    }
    .section-stack {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }
    /* Weight card */
    .weight-card {
      background: var(--app-surface); border: 1px solid var(--app-border);
      border-radius: 18px; padding: 16px; margin-bottom: 0;
      box-shadow: 0 12px 30px rgba(0, 0, 0, 0.12);
    }
    .weight-header { display: flex; align-items: center; justify-content: space-around; margin-bottom: 12px; }
    .weight-col { text-align: center; display: flex; flex-direction: column; gap: 4px; }
    .weight-col.current .weight-val { color: var(--app-accent); }
    .weight-val { font-size: 20px; font-weight: 700; color: var(--app-text); }
    .weight-label { font-size: 11px; color: var(--app-muted); }
    .weight-arrow { color: var(--app-muted); font-size: 18px; }
    .weight-bar-track {
      height: 6px; background: rgba(255,255,255,0.06);
      border-radius: 99px; overflow: hidden; margin-bottom: 8px;
    }
    .weight-bar-fill { height: 100%; background: var(--app-accent-2); border-radius: 99px; transition: width 0.5s; }
    .weight-stats { display: flex; justify-content: space-between; font-size: 12px; color: var(--app-muted); }
    .weight-stats strong { color: var(--app-text); }

    /* Prediction */
    .prediction-card {
      background: var(--app-surface); border: 1px solid var(--app-border);
      border-radius: 18px; padding: 14px 16px; margin-bottom: 0;
      display: flex; align-items: center; gap: 14px;
      box-shadow: 0 12px 30px rgba(0, 0, 0, 0.12);
    }
    .prediction-icon { font-size: 26px; }
    .prediction-text { display: flex; flex-direction: column; gap: 3px; }
    .prediction-title { font-size: 15px; font-weight: 600; color: var(--app-text); }
    .prediction-sub { font-size: 11px; color: var(--app-muted); }

    /* Chart */
    .chart-card {
      background: var(--app-surface); border: 1px solid var(--app-border);
      border-radius: 18px; padding: 16px; margin-bottom: 0;
      box-shadow: 0 12px 30px rgba(0, 0, 0, 0.12);
    }
    .chart-head {
      display: flex;
      justify-content: space-between;
      align-items: baseline;
      gap: 8px;
      margin-bottom: 14px;
    }
    .chart-title { font-size: 12px; font-weight: 700; color: var(--app-muted); text-transform: uppercase; letter-spacing: 0.5px; }
    .chart-sub { font-size: 11px; color: var(--app-muted); }
    .bar-chart { display: flex; justify-content: space-between; align-items: flex-end; height: 140px; gap: 6px; }
    .bar-col { flex: 1; display: flex; flex-direction: column; align-items: center; gap: 4px; }
    .bar-wrapper { width: 100%; height: 100px; display: flex; align-items: flex-end; justify-content: center; }
    .bar { width: 100%; max-width: 28px; border-radius: 6px 6px 2px 2px; background: rgba(240,168,68,0.25); min-height: 3px; transition: height 0.5s ease; }
    .bar.today { background: var(--app-accent); }
    .bar.over { background: rgba(248,113,113,0.5); }
    .bar.today.over { background: #f87171; }
    .bar-cal { font-size: 9px; color: var(--app-muted); }
    .bar-cal.empty { color: rgba(255,255,255,0.15); }
    .bar-label { font-size: 11px; color: var(--app-muted); font-weight: 500; }
    .goal-indicator { display: flex; align-items: center; gap: 8px; margin-top: 10px; padding-top: 8px; border-top: 1px solid var(--app-border); }
    .goal-line { width: 14px; height: 2px; background: var(--app-accent); border-radius: 99px; }
    .goal-label { font-size: 10px; color: var(--app-muted); }

    /* Deficit chart */
    .deficit-bars { display: flex; justify-content: space-between; gap: 6px; margin-bottom: 8px; }
    .deficit-col { flex: 1; display: flex; flex-direction: column; align-items: center; gap: 4px; }
    .deficit-bar-wrapper { width: 100%; height: 60px; display: flex; align-items: flex-end; justify-content: center; }
    .deficit-bar { width: 100%; max-width: 28px; border-radius: 4px; transition: height 0.4s; }
    .deficit-bar.deficit { background: var(--app-accent-2); }
    .deficit-bar.surplus { background: rgba(248,113,113,0.5); }
    .deficit-bar.empty-bar { height: 4px; background: rgba(255,255,255,0.06); border-radius: 4px; }
    .deficit-val { font-size: 9px; font-weight: 600; }
    .deficit-val.pos { color: var(--app-accent-2); }
    .deficit-val.neg { color: #f87171; }
    .deficit-legend { display: flex; align-items: center; gap: 8px; font-size: 10px; color: var(--app-muted); margin-top: 6px; }
    .legend-dot { width: 8px; height: 8px; border-radius: 50%; }
    .legend-dot.green { background: var(--app-accent-2); }
    .legend-dot.red { background: rgba(248,113,113,0.6); }

    /* Stats */
    .stats-row { display: flex; gap: 10px; margin-bottom: 12px; }
    .stat-card {
      flex: 1; background: var(--app-surface); border: 1px solid var(--app-border);
      border-radius: 18px; padding: 14px 10px; text-align: center;
      display: flex; flex-direction: column; gap: 4px;
      box-shadow: 0 10px 24px rgba(0, 0, 0, 0.10);
    }
    .stat-value { font-size: 19px; font-weight: 700; color: var(--app-text); }
    .stat-label { font-size: 10px; color: var(--app-muted); text-transform: uppercase; letter-spacing: 0.3px; }

    /* Streak */
    .streak-card {
      background: var(--app-surface); border: 1px solid var(--app-border);
      border-radius: 18px; padding: 16px; display: flex; align-items: center; gap: 14px;
      box-shadow: 0 12px 30px rgba(0, 0, 0, 0.12);
    }
    .streak-fire { font-size: 28px; }
    .streak-text { display: flex; flex-direction: column; }
    .streak-count { font-size: 18px; font-weight: 700; color: var(--app-text); }
    .streak-label { font-size: 12px; color: var(--app-muted); }
    .empty-state {
      padding: 14px;
      text-align: center;
      font-size: 13px;
      color: var(--app-muted);
    }
  `]
})
export class ProgressComponent {
  state = inject(NutritionStateService);

  goal = computed(() => this.state.calorieGoal());
  weekData = computed(() => this.state.getLast7Days());
  hasAnyCalories = computed(() => this.weekData().some(d => d.calories > 0));

  showWeight = computed(() => {
    const p = this.state.userProfile();
    return p.startWeight > 0 && p.goalWeight > 0;
  });

  weightLost = computed(() => {
    const p = this.state.userProfile();
    return Math.abs(p.startWeight - p.currentWeight);
  });

  weightRemaining = computed(() => {
    const p = this.state.userProfile();
    return Math.max(0, Math.abs(p.currentWeight - p.goalWeight));
  });

  weightProgress = computed(() => {
    const p = this.state.userProfile();
    const total = Math.abs(p.startWeight - p.goalWeight);
    if (total <= 0) return 100;
    const done = Math.abs(p.startWeight - p.currentWeight);
    return Math.max(0, Math.min((done / total) * 100, 100));
  });

  barHeight(calories: number): number {
    const allCals = this.weekData().map(d => d.calories);
    const max = Math.max(this.goal() * 1.3, ...allCals);
    if (max === 0 || calories === 0) return 3;
    return Math.max((calories / max) * 100, 3);
  }

  anyDeficitData = computed(() => this.weekData().some(d => d.calories > 0));

  deficitBarHeight(deficit: number): number {
    const maxDeficit = Math.max(...this.weekData().map(d => Math.abs(d.deficit)), 1);
    return Math.max((Math.abs(deficit) / maxDeficit) * 50, 2);
  }

  avgCalories = computed(() => {
    const days = this.weekData().filter(d => d.calories > 0);
    if (days.length === 0) return 0;
    return days.reduce((sum, d) => sum + d.calories, 0) / days.length;
  });

  avgDeficit = computed(() => {
    const days = this.weekData().filter(d => d.calories > 0);
    if (days.length === 0) return 0;
    return days.reduce((sum, d) => sum + d.deficit, 0) / days.length;
  });

  daysOnTarget = computed(() => {
    const g = this.goal();
    return this.weekData().filter(d => d.calories > 0 && d.calories <= g * 1.05).length;
  });

  streak = computed(() => {
    const history = this.state.history().sort((a, b) => b.date.localeCompare(a.date));
    let count = 0;
    const today = new Date();
    for (let i = 0; i < 30; i++) {
      const d = new Date();
      d.setDate(today.getDate() - i);
      const key = d.toISOString().split('T')[0];
      const entry = history.find(h => h.date === key);
      if (entry && entry.meals.some(m => m.foods.length > 0)) {
        count++;
      } else if (i > 0) {
        break;
      }
    }
    return count;
  });
}