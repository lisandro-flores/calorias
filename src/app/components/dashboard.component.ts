import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { NutritionStateService } from '../services/nutrition-state.service';
import { HeroSummaryComponent } from './hero-summary.component';
import { MealBlockComponent } from './meal-block.component';
import { RecentFoodsComponent } from './recent-foods.component';
import { WaterTrackerComponent } from './water-tracker.component';
import { GoalProgressComponent } from './goal-progress.component';
import { FoodSearchComponent } from './food-search.component';
import { AiInputComponent } from './ai-input.component';
import { ActivityCardComponent } from './activity-card.component';
import { HealthConnectService } from '../services/health-connect.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    IonicModule,
    HeroSummaryComponent,
    MealBlockComponent,
    RecentFoodsComponent,
    WaterTrackerComponent,
    GoalProgressComponent,
    FoodSearchComponent,
    AiInputComponent,
    ActivityCardComponent
  ],
  template: `
    <ion-content class="ion-padding" [scrollY]="true">
      <!-- Fase 1: Hydration overlay -->
      <div class="hydration-overlay" *ngIf="!state.dataReady()">
        <ion-spinner name="crescent"></ion-spinner>
        <span>Cargando datos desde la nube...</span>
      </div>

      <!-- Main content (only when dataReady) -->
      <div *ngIf="state.dataReady()">
        <div class="top-row">
          <div class="sync-badge" [ngClass]="state.syncStatus()">
            <ion-icon [name]="state.syncStatusIcon()"></ion-icon>
            <span>{{ state.syncStatusLabel() }}</span>
          </div>
        </div>

        <!-- Hero ring + macros -->
        <app-hero-summary></app-hero-summary>

        <!-- Health Connect activity -->
        <app-activity-card></app-activity-card>

        <!-- AI Input -->
        <app-ai-input></app-ai-input>

        <!-- Food search -->
        <app-food-search></app-food-search>

        <!-- Recent foods chips -->
        <app-recent-foods></app-recent-foods>

        <!-- Meals -->
        <app-meal-block
          *ngFor="let meal of state.meals(); trackBy: trackByMeal"
          [mealName]="meal.name"
          [mealIcon]="meal.icon"
          [foods]="meal.foods"
          (copyYesterday)="onCopyYesterday(meal.name)">
        </app-meal-block>

        <!-- Water -->
        <app-water-tracker></app-water-tracker>

        <!-- Weight goal -->
        <app-goal-progress></app-goal-progress>

        <div class="footer-space"></div>
      </div>
    </ion-content>
  `,
  styles: [`
    .hydration-overlay {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      height: 60vh;
      gap: 16px;
      color: var(--app-muted);
      font-size: 14px;
    }

    .top-row {
      display: flex;
      justify-content: flex-end;
      margin-bottom: 10px;
    }

    .sync-badge {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      font-size: 12px;
      font-weight: 600;
      padding: 6px 10px;
      border-radius: 999px;
      border: 1px solid var(--app-border);
      background: var(--app-surface-2);
      color: var(--app-muted);
    }

    .sync-badge ion-icon {
      font-size: 14px;
    }

    .sync-badge.pending,
    .sync-badge.syncing {
      color: var(--ion-color-warning);
    }

    .sync-badge.error {
      color: var(--ion-color-danger);
    }

    .sync-badge.synced {
      color: var(--ion-color-success);
    }

    .footer-space {
      height: 20px;
    }

    /* Staggered card entrance */
    app-meal-block {
      display: block;
      animation: fadeUp 350ms ease-out both;
    }
    app-meal-block:nth-of-type(2) { animation-delay: 40ms; }
    app-meal-block:nth-of-type(3) { animation-delay: 80ms; }
    app-meal-block:nth-of-type(4) { animation-delay: 120ms; }

    @keyframes fadeUp {
      from { opacity: 0; transform: translateY(8px); }
      to   { opacity: 1; transform: translateY(0); }
    }
  `]
})
export class DashboardComponent {
  state = inject(NutritionStateService);
  health = inject(HealthConnectService);

  ionViewDidEnter() {
    this.state.checkDateChange();
    this.health.init();
  }

  onCopyYesterday(mealName: string) {
    this.state.copyFromYesterday(mealName);
  }

  trackByMeal(_index: number, meal: { name: string }) {
    return meal.name;
  }
}