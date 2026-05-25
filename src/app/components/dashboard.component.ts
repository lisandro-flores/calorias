import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { NutritionStateService } from '../services/nutrition-state.service';
import { HeroSummaryComponent } from './hero-summary.component';
import { MealBlockComponent } from './meal-block.component';
import { RecentFoodsComponent } from './recent-foods.component';
import { WaterTrackerComponent } from './water-tracker.component';
import { FoodSearchComponent } from './food-search.component';
import { AuthService } from '../services/auth.service';
import { Router } from '@angular/router';

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
    FoodSearchComponent
  ],
  template: `
    <ion-header class="ion-no-border">
      <ion-toolbar color="dark">
        <ion-title>Hoy</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content color="dark" class="ion-padding">
      <!-- 1. Hero Dashboard (Estado Global) -->
      <app-hero-summary></app-hero-summary>

      <!-- Buscador en base de datos libre -->
      <app-food-search></app-food-search>

      <!-- 2. Componentes Modulares de Comida -->
      <!-- Iteramos reactivamente a través de los Signals que contiene la lista de comidas -->
      <app-meal-block 
        *ngFor="let meal of state.meals()" 
        [mealName]="meal.name"
        [foods]="meal.foods"
        (copyYesterday)="onCopyYesterday(meal.name)">
      </app-meal-block>

      <!-- 3. Módulo de Ingresados Recientemente -->
      <app-recent-foods></app-recent-foods>

      <!-- 4. Tarjetas de Fricción Cero (Agua y Disciplina) -->
      <app-water-tracker></app-water-tracker>
      <app-goal-progress></app-goal-progress>

    </ion-content>
  `,
  styles: [`
    ion-card {
      animation: rise 480ms ease-out both;
    }

    ion-card:nth-of-type(2) { animation-delay: 40ms; }
    ion-card:nth-of-type(3) { animation-delay: 80ms; }
    ion-card:nth-of-type(4) { animation-delay: 120ms; }
    ion-card:nth-of-type(5) { animation-delay: 160ms; }
    ion-card:nth-of-type(6) { animation-delay: 200ms; }

    @keyframes rise {
      from { opacity: 0; transform: translateY(10px); }
      to { opacity: 1; transform: translateY(0); }
    }
  `]
})
export class DashboardComponent {
  state = inject(NutritionStateService);
  authService = inject(AuthService);
  router = inject(Router);

  onCopyYesterday(mealName: string) {
    this.state.copyFromYesterday(mealName);
  }
}