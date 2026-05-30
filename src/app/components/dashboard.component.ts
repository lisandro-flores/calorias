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
        <div class="dashboard-hero">
          <div>
            <div class="eyebrow">Hoy</div>
            <h1>Tu registro</h1>
            <p>Un vistazo rápido a calorías, macros y comidas del día.</p>
          </div>
          <div class="sync-badge" [ngClass]="state.syncStatus()">
            <ion-icon [name]="state.syncStatusIcon()"></ion-icon>
            <span>{{ state.syncStatusLabel() }}</span>
          </div>
        </div>

        <section class="section-block">
          <div class="section-label">Resumen</div>
          <app-hero-summary></app-hero-summary>
        </section>

        <section class="section-block">
          <div class="section-label">Actividad</div>
          <app-activity-card></app-activity-card>
        </section>

        <section class="section-block">
          <div class="section-label">Captura rápida</div>
          <div class="quick-capture-row">
            <app-ai-input></app-ai-input>
            <button class="show-search-btn" (click)="showSearch = !showSearch">
              <ion-icon name="search-outline"></ion-icon>
              <span>{{ showSearch ? 'Ocultar búsqueda' : 'Buscar producto' }}</span>
            </button>
          </div>
          <app-food-search *ngIf="showSearch"></app-food-search>
          <app-recent-foods></app-recent-foods>
        </section>

        <section class="section-block">
          <div class="section-label">Comidas del día</div>
          <app-meal-block
            *ngFor="let meal of state.meals(); trackBy: trackByMeal"
            [mealName]="meal.name"
            [mealIcon]="meal.icon"
            [foods]="meal.foods"
            (copyYesterday)="onCopyYesterday(meal.name)">
          </app-meal-block>
        </section>

        <section class="section-block bottom-stack">
          <div class="section-label">Progreso</div>
          <app-water-tracker></app-water-tracker>
          <app-goal-progress></app-goal-progress>
        </section>

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

    .dashboard-hero {
      display: flex;
      align-items: flex-end;
      justify-content: space-between;
      gap: 16px;
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

    .dashboard-hero p {
      margin: 6px 0 0;
      color: var(--app-muted);
      font-size: 13px;
      line-height: 1.45;
      max-width: 220px;
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

    .section-block {
      margin-bottom: 14px;
    }

    .section-label {
      font-size: 12px;
      font-weight: 700;
      color: var(--app-muted);
      text-transform: uppercase;
      letter-spacing: 0.7px;
      margin: 0 0 10px 2px;
    }

    .bottom-stack {
      display: flex;
      flex-direction: column;
      gap: 12px;
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

    app-hero-summary,
    app-activity-card,
    app-ai-input,
    app-food-search,
    app-recent-foods,
    app-water-tracker,
    app-goal-progress {
      display: block;
    }

    @keyframes fadeUp {
      from { opacity: 0; transform: translateY(8px); }
      to   { opacity: 1; transform: translateY(0); }
    }
  `]
})
export class DashboardComponent {
  state = inject(NutritionStateService);
  health = inject(HealthConnectService);
  showSearch = false;

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