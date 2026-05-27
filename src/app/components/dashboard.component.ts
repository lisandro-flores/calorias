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
    AiInputComponent
  ],
  template: `
    <ion-header class="ion-no-border">
      <ion-toolbar>
        <ion-title class="page-title">Hoy</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content class="ion-padding" [scrollY]="true">
      <!-- Hero ring + macros -->
      <app-hero-summary></app-hero-summary>

      <!-- AI Input -->
      <app-ai-input></app-ai-input>

      <!-- Food search -->
      <app-food-search></app-food-search>

      <!-- Recent foods chips -->
      <app-recent-foods></app-recent-foods>

      <!-- Meals -->
      <app-meal-block
        *ngFor="let meal of state.meals()"
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
    </ion-content>
  `,
  styles: [`
    .page-title {
      font-size: 20px;
      font-weight: 700;
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

  ionViewDidEnter() {
    this.state.checkDateChange();
  }

  onCopyYesterday(mealName: string) {
    this.state.copyFromYesterday(mealName);
  }
}