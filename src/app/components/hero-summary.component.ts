import { Component, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { NutritionStateService } from '../services/nutrition-state.service';

@Component({
  selector: 'app-hero-summary',
  standalone: true,
  imports: [CommonModule, IonicModule],
  template: `
    <div class="hero-wrapper">
      <!-- Circular Progress -->
      <div class="ring-container">
        <svg viewBox="0 0 120 120" width="180" height="180">
          <!-- Track -->
          <circle cx="60" cy="60" r="50" fill="none" stroke="rgba(255,255,255,0.05)" stroke-width="10" />
          <!-- Progress arc -->
          <circle
            cx="60" cy="60" r="50"
            fill="none"
            [attr.stroke]="isOver() ? '#f87171' : 'var(--app-accent)'"
            stroke-width="10"
            stroke-linecap="round"
            [style.stroke-dasharray]="circumference"
            [style.stroke-dashoffset]="dashoffset()"
            style="transition: stroke-dashoffset 0.6s ease, stroke 0.3s ease;"
            transform="rotate(-90 60 60)" />
          <!-- Center text -->
          <text x="60" y="52" text-anchor="middle" fill="#fff" font-size="26" font-weight="700"
                font-family="'Inter', sans-serif">
            {{ remaining() | number:'1.0-0' }}
          </text>
          <text x="60" y="68" text-anchor="middle" fill="var(--app-muted)" font-size="10"
                font-family="'Inter', sans-serif">
            restantes
          </text>
        </svg>
      </div>

      <!-- Macro Pills -->
      <div class="macro-row">
        <div class="macro-pill">
          <span class="macro-value">{{ state.totalCalories() | number:'1.0-0' }}</span>
          <span class="macro-label">consumidas</span>
        </div>
        <div class="macro-pill accent">
          <span class="macro-value">{{ state.calorieGoal() | number:'1.0-0' }}</span>
          <span class="macro-label">meta</span>
        </div>
      </div>

      <!-- Deficit indicator -->
      <div class="deficit-indicator" [class.over]="isOver()">
        <span *ngIf="!isOver()"><ion-icon name="flag"></ion-icon> {{ state.remaining() | number:'1.0-0' }} restantes · TDEE {{ state.tdee() | number:'1.0-0' }}</span>
        <span *ngIf="isOver()"><ion-icon name="alert-circle"></ion-icon> Pasaste la meta por {{ -state.remaining() | number:'1.0-0' }} kcal</span>
      </div>

      <!-- Macro Bars -->
      <div class="macros-detail">
        <div class="macro-bar-item">
          <div class="macro-bar-header">
            <span>Proteína</span>
            <span>{{ state.totalProtein() | number:'1.0-0' }}g</span>
          </div>
          <div class="macro-bar-track">
            <div class="macro-bar-fill protein" [style.width.%]="proteinPercent()"></div>
          </div>
        </div>
        <div class="macro-bar-item">
          <div class="macro-bar-header">
            <span>Carbos</span>
            <span>{{ state.totalCarbs() | number:'1.0-0' }}g</span>
          </div>
          <div class="macro-bar-track">
            <div class="macro-bar-fill carbs" [style.width.%]="carbsPercent()"></div>
          </div>
        </div>
        <div class="macro-bar-item">
          <div class="macro-bar-header">
            <span>Grasa</span>
            <span>{{ state.totalFat() | number:'1.0-0' }}g</span>
          </div>
          <div class="macro-bar-track">
            <div class="macro-bar-fill fat" [style.width.%]="fatPercent()"></div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .hero-wrapper {
      padding: 20px 0 8px;
    }
    .ring-container {
      display: flex;
      justify-content: center;
      margin-bottom: 16px;
    }
    .macro-row {
      display: flex;
      justify-content: center;
      gap: 24px;
      margin-bottom: 20px;
    }
    .macro-pill {
      text-align: center;
    }
    .macro-value {
      display: block;
      font-size: 20px;
      font-weight: 700;
      color: var(--app-text);
    }
    .macro-pill.accent .macro-value {
      color: var(--app-accent);
    }
    .macro-label {
      font-size: 11px;
      color: var(--app-muted);
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .deficit-indicator {
      text-align: center;
      font-size: 11px;
      color: var(--app-muted);
      margin-bottom: 16px;
      padding: 6px 12px;
      background: rgba(255,255,255,0.03);
      border-radius: 20px;
      width: fit-content;
      margin-inline: auto;
    }
    .deficit-indicator.over {
      color: #f87171;
      background: rgba(248,113,113,0.08);
    }
    .macros-detail {
      display: flex;
      gap: 12px;
      padding: 0 4px;
    }
    .macro-bar-item {
      flex: 1;
    }
    .macro-bar-header {
      display: flex;
      justify-content: space-between;
      font-size: 11px;
      color: var(--app-muted);
      margin-bottom: 4px;
    }
    .macro-bar-track {
      height: 4px;
      background: rgba(255,255,255,0.06);
      border-radius: 99px;
      overflow: hidden;
    }
    .macro-bar-fill {
      height: 100%;
      border-radius: 99px;
      transition: width 0.5s ease;
      min-width: 0;
      max-width: 100%;
    }
    .macro-bar-fill.protein { background: var(--app-accent-2); }
    .macro-bar-fill.carbs { background: var(--app-accent); }
    .macro-bar-fill.fat { background: #c084fc; }
  `]
})
export class HeroSummaryComponent {
  state = inject(NutritionStateService);

  readonly circumference = 2 * Math.PI * 50;

  remaining = computed(() => this.state.remaining());
  isOver = computed(() => this.state.totalCalories() > this.state.calorieGoal());

  dashoffset = computed(() => {
    const fraction = this.state.totalCalories() / this.state.calorieGoal();
    return this.circumference * (1 - Math.min(fraction, 1));
  });

  proteinPercent = computed(() => Math.min((this.state.totalProtein() / this.state.goals().proteinGoal) * 100, 100));
  carbsPercent = computed(() => {
    // Estimate: carbs fill ~50% of remaining calories from protein/fat
    const remaining = this.state.calorieGoal() - (this.state.totalProtein() * 4) - (this.state.totalFat() * 9);
    const carbGoalG = Math.max(remaining / 4, 100);
    return Math.min((this.state.totalCarbs() / carbGoalG) * 100, 100);
  });
  fatPercent = computed(() => {
    const fatGoalG = (this.state.calorieGoal() * 0.25) / 9;
    return Math.min((this.state.totalFat() / fatGoalG) * 100, 100);
  });
}