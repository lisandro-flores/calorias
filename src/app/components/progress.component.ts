import { Component, inject, computed, ViewChild, ElementRef, AfterViewInit, OnDestroy, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { NutritionStateService } from '../services/nutrition-state.service';
import Chart from 'chart.js/auto';

@Component({
  selector: 'app-progress',
  standalone: true,
  imports: [CommonModule, IonicModule],
  template: `
    <ion-content class="ion-padding">
      <div class="progress-hero">
        <div>
          <div class="eyebrow">Progreso</div>
          <h1>Tu avance</h1>
          <p>Revisa calorías, tendencias y balance nutricional.</p>
        </div>
      </div>

      <div class="section-stack">
        <!-- Macros Doughnut (Today) -->
        <div class="chart-card">
          <div class="chart-head">
            <div class="chart-title">Macros de hoy</div>
            <div class="chart-sub">{{ state.totalCalories() }} / {{ state.calorieGoal() }} kcal</div>
          </div>
          <div class="macros-container">
            <div class="canvas-wrapper doughnut-wrapper">
              <canvas #macrosCanvas></canvas>
            </div>
            <div class="macros-legend">
              <div class="macro-item">
                <span class="legend-dot" style="background: #3b82f6"></span>
                <span>Prot: {{ state.totalProtein() }}g</span>
              </div>
              <div class="macro-item">
                <span class="legend-dot" style="background: #eab308"></span>
                <span>Carb: {{ state.totalCarbs() }}g</span>
              </div>
              <div class="macro-item">
                <span class="legend-dot" style="background: #ef4444"></span>
                <span>Grasa: {{ state.totalFat() }}g</span>
              </div>
            </div>
          </div>
        </div>

        <!-- 7-Day Line/Bar chart -->
        <div class="chart-card">
          <div class="chart-head">
            <div class="chart-title">Calorías — Últimos 7 días</div>
            <div class="chart-sub">Meta: {{ goal() }} kcal</div>
          </div>
          <div class="canvas-wrapper">
            <canvas #weeklyCanvas></canvas>
          </div>
        </div>

        <!-- Deficit chart -->
        <div class="chart-card" *ngIf="anyDeficitData()">
          <div class="chart-head">
            <div class="chart-title">Déficit / Superávit diario</div>
            <div class="chart-sub">Comparado con TDEE</div>
          </div>
          <div class="canvas-wrapper">
            <canvas #deficitCanvas></canvas>
          </div>
        </div>

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

        <!-- Prediction -->
        <div class="prediction-card" *ngIf="state.weeklyWeightChangePrediction() !== null">
          <ion-icon class="prediction-icon" [name]="state.weeklyWeightChangePrediction()! > 0 ? 'trending-down' : 'trending-up'"></ion-icon>
          <div class="prediction-text">
            <span class="prediction-title">
              {{ state.weeklyWeightChangePrediction()! > 0 ? 'Bajando' : 'Subiendo' }}
              ~{{ (Math.abs(state.weeklyWeightChangePrediction()!) | number:'1.2-2') }} kg/semana
            </span>
            <span class="prediction-sub">
              Basado en tu promedio vs TDEE de {{ state.tdee() }} kcal
            </span>
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
    /* Chart Cards */
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
    .canvas-wrapper {
      position: relative;
      height: 180px;
      width: 100%;
    }
    .doughnut-wrapper {
      height: 140px;
      flex: 1;
    }
    .macros-container {
      display: flex;
      align-items: center;
      gap: 16px;
    }
    .macros-legend {
      display: flex;
      flex-direction: column;
      gap: 8px;
      font-size: 12px;
      color: var(--app-text);
    }
    .macro-item {
      display: flex;
      align-items: center;
      gap: 6px;
    }
    .legend-dot {
      width: 10px;
      height: 10px;
      border-radius: 50%;
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
    .streak-fire { font-size: 28px; color: #ff9800; }
    .streak-text { display: flex; flex-direction: column; }
    .streak-count { font-size: 18px; font-weight: 700; color: var(--app-text); }
    .streak-label { font-size: 12px; color: var(--app-muted); }
  `]
})
export class ProgressComponent implements AfterViewInit, OnDestroy {
  Math = Math;
  state = inject(NutritionStateService);

  @ViewChild('weeklyCanvas') weeklyCanvas!: ElementRef<HTMLCanvasElement>;
  @ViewChild('deficitCanvas') deficitCanvas!: ElementRef<HTMLCanvasElement>;
  @ViewChild('macrosCanvas') macrosCanvas!: ElementRef<HTMLCanvasElement>;

  weeklyChart?: Chart;
  deficitChart?: Chart;
  macrosChart?: Chart;

  goal = computed(() => this.state.calorieGoal());
  weekData = computed(() => this.state.getLast7Days());
  hasAnyCalories = computed(() => this.weekData().some(d => d.calories > 0));

  showWeight = computed(() => {
    const p = this.state.userProfile();
    return p.startWeight > 0 && p.goalWeight > 0;
  });

  weightLost = computed(() => {
    const p = this.state.userProfile();
    return p.startWeight - p.currentWeight;
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

  anyDeficitData = computed(() => this.weekData().some(d => d.calories > 0));

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

  constructor() {
    effect(() => {
      // Re-render charts when data changes
      const week = this.weekData();
      const p = this.state.totalProtein();
      const c = this.state.totalCarbs();
      const f = this.state.totalFat();
      
      setTimeout(() => {
        this.renderWeeklyChart(week);
        this.renderDeficitChart(week);
        this.renderMacrosChart(p, c, f);
      }, 0);
    });
  }

  ngAfterViewInit() {
    // Initial render is handled by the effect
  }

  ngOnDestroy() {
    this.destroyCharts();
  }

  private destroyCharts() {
    if (this.weeklyChart) this.weeklyChart.destroy();
    if (this.deficitChart) this.deficitChart.destroy();
    if (this.macrosChart) this.macrosChart.destroy();
  }

  private getCssVariable(name: string): string {
    return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  }

  private renderWeeklyChart(week: any[]) {
    if (!this.weeklyCanvas) return;
    if (this.weeklyChart) this.weeklyChart.destroy();

    const ctx = this.weeklyCanvas.nativeElement.getContext('2d');
    if (!ctx) return;

    const labels = week.map(d => d.label);
    const data = week.map(d => d.calories > 0 ? d.calories : null);
    const goalData = week.map(() => this.goal());

    const isDark = document.body.classList.contains('dark');
    const textColor = isDark ? '#9ca3af' : '#6b7280';
    const gridColor = isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)';
    const accent = '#00e676';

    this.weeklyChart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels,
        datasets: [
          {
            type: 'line',
            label: 'Meta',
            data: goalData,
            borderColor: accent,
            borderWidth: 2,
            borderDash: [5, 5],
            pointRadius: 0,
            fill: false
          },
          {
            type: 'bar',
            label: 'Calorías',
            data,
            backgroundColor: (context) => {
              const val = context.raw as number;
              if (val > this.goal()) return 'rgba(248, 113, 113, 0.8)';
              return 'rgba(240, 168, 68, 0.8)';
            },
            borderRadius: 6,
            barPercentage: 0.6
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            mode: 'index',
            intersect: false,
            callbacks: {
              label: (context) => \`\${context.dataset.label}: \${context.raw} kcal\`
            }
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            grid: { color: gridColor },
            ticks: { color: textColor, font: { size: 10 } }
          },
          x: {
            grid: { display: false },
            ticks: { color: textColor, font: { size: 10 } }
          }
        }
      }
    });
  }

  private renderDeficitChart(week: any[]) {
    if (!this.deficitCanvas) return;
    if (this.deficitChart) this.deficitChart.destroy();

    const ctx = this.deficitCanvas.nativeElement.getContext('2d');
    if (!ctx) return;

    const labels = week.map(d => d.label);
    const data = week.map(d => d.calories > 0 ? d.deficit : null);

    const isDark = document.body.classList.contains('dark');
    const textColor = isDark ? '#9ca3af' : '#6b7280';
    const gridColor = isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)';

    this.deficitChart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels,
        datasets: [{
          label: 'Déficit / Superávit',
          data,
          backgroundColor: (context) => {
            const val = context.raw as number;
            return val > 0 ? '#00e676' : 'rgba(248, 113, 113, 0.8)';
          },
          borderRadius: 4,
          barPercentage: 0.5
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: (context) => {
                const val = context.raw as number;
                return val > 0 ? \`Déficit: \${val} kcal\` : \`Superávit: \${Math.abs(val)} kcal\`;
              }
            }
          }
        },
        scales: {
          y: {
            grid: { color: gridColor },
            ticks: { color: textColor, font: { size: 10 } }
          },
          x: {
            grid: { display: false },
            ticks: { color: textColor, font: { size: 10 } }
          }
        }
      }
    });
  }

  private renderMacrosChart(p: number, c: number, f: number) {
    if (!this.macrosCanvas) return;
    if (this.macrosChart) this.macrosChart.destroy();

    const ctx = this.macrosCanvas.nativeElement.getContext('2d');
    if (!ctx) return;

    // Si no hay macros, mostramos un anillo gris
    const hasData = p > 0 || c > 0 || f > 0;
    const data = hasData ? [p, c, f] : [1];
    const bgColors = hasData ? ['#3b82f6', '#eab308', '#ef4444'] : ['rgba(156, 163, 175, 0.2)'];

    this.macrosChart = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: hasData ? ['Proteína', 'Carbs', 'Grasa'] : ['Sin datos'],
        datasets: [{
          data,
          backgroundColor: bgColors,
          borderWidth: 0,
          cutout: '75%'
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            enabled: hasData,
            callbacks: {
              label: (context) => \` \${context.label}: \${context.raw}g\`
            }
          }
        }
      }
    });
  }
}