import { Component, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { NutritionStateService } from '../services/nutrition-state.service';

@Component({
  selector: 'app-goal-progress',
  standalone: true,
  imports: [CommonModule, IonicModule],
  template: `
    <div class="weight-section" *ngIf="showWeight()">
      <div class="weight-header">
        <span class="section-title">Peso</span>
        <span class="weight-change" [class.positive]="weightLost() > 0">
          {{ weightLost() > 0 ? '-' : '+' }}{{ weightLost() | number:'1.1-1' }} kg
        </span>
      </div>
      <div class="weight-bar-track">
        <div class="weight-bar-fill" [style.width.%]="weightProgress()"></div>
      </div>
      <div class="weight-labels">
        <span>{{ goals().startWeight }} kg</span>
        <span class="current-weight">{{ goals().currentWeight }} kg</span>
        <span>{{ goals().goalWeight }} kg</span>
      </div>
    </div>
  `,
  styles: [`
    .weight-section {
      background: var(--app-surface);
      border: 1px solid var(--app-border);
      border-radius: 14px;
      padding: 14px 16px;
      margin-bottom: 12px;
    }
    .weight-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 10px;
    }
    .section-title {
      font-size: 13px;
      font-weight: 600;
      color: var(--app-muted);
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .weight-change {
      font-size: 13px;
      font-weight: 600;
      color: var(--app-accent-2);
    }
    .weight-change.positive { color: var(--app-accent-2); }
    .weight-bar-track {
      height: 6px;
      background: rgba(255,255,255,0.06);
      border-radius: 99px;
      overflow: hidden;
      margin-bottom: 8px;
    }
    .weight-bar-fill {
      height: 100%;
      background: var(--app-accent-2);
      border-radius: 99px;
      transition: width 0.5s ease;
    }
    .weight-labels {
      display: flex;
      justify-content: space-between;
      font-size: 11px;
      color: var(--app-muted);
    }
    .current-weight {
      color: var(--app-text);
      font-weight: 600;
    }
  `]
})
export class GoalProgressComponent {
  private state = inject(NutritionStateService);

  goals = computed(() => this.state.goals());

  showWeight = computed(() => {
    const g = this.goals();
    return g.startWeight > 0 && g.goalWeight > 0;
  });

  weightLost = computed(() => {
    const g = this.goals();
    return Math.abs(g.startWeight - g.currentWeight);
  });

  weightProgress = computed(() => {
    const g = this.goals();
    const total = g.startWeight - g.goalWeight;
    if (total <= 0) return 0;
    const lost = g.startWeight - g.currentWeight;
    return Math.max(0, Math.min((lost / total) * 100, 100));
  });
}