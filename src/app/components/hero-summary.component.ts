import { Component, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { NutritionStateService } from '../services/nutrition-state.service';

@Component({
  selector: 'app-hero-summary',
  standalone: true,
  imports: [CommonModule, IonicModule],
  template: `
    <ion-card color="dark" class="hero-card">
      <ion-card-header>
        <ion-card-title class="ion-text-center">Resumen del Día</ion-card-title>
      </ion-card-header>

      <ion-card-content class="ion-text-center">
        <!-- Gráfico Circular SVG -->
        <div class="circular-progress">
          <svg viewBox="0 0 100 100" width="120" height="120">
            <!-- Fondo del círculo -->
            <circle cx="50" cy="50" r="45" fill="none" stroke="rgba(255,255,255,0.1)" stroke-width="10" />
            <!-- Círculo de progreso -->
            <circle 
              cx="50" cy="50" r="45" 
              fill="none" 
              stroke="var(--ion-color-primary, #3880ff)" 
              stroke-width="10" 
              stroke-linecap="round"
              [style.stroke-dasharray]="circumference()"
              [style.stroke-dashoffset]="dashoffset()"
              transform="rotate(-90 50 50)" />
            <text x="50" y="47" text-anchor="middle" fill="#fff" font-size="20" font-weight="bold">
              {{ state.totalCalories() | number:'1.0-0' }}
            </text>
            <text x="50" y="65" text-anchor="middle" fill="#aaa" font-size="12">
              / {{ state.calorieGoal }} kcal
            </text>
          </svg>
        </div>

        <!-- Barras de progreso de Macros -->
        <div class="macros-container">
          <!-- Proteína (Destacada) -->
          <div class="macro-row">
            <div class="macro-label">
              <span>Proteína</span>
              <span class="macro-text highlight">{{ state.totalProtein() }} / {{ state.proteinGoal }} g</span>
            </div>
            <ion-progress-bar color="success" [value]="proteinProgress()"></ion-progress-bar>
          </div>

          <!-- Carbohidratos -->
          <div class="macro-row">
            <div class="macro-label">
              <span>Carbohidratos</span>
              <span class="macro-text">{{ state.totalCarbs() }} / {{ state.carbsGoal }} g</span>
            </div>
            <ion-progress-bar color="warning" [value]="carbsProgress()"></ion-progress-bar>
          </div>

          <!-- Grasas -->
          <div class="macro-row">
            <div class="macro-label">
              <span>Grasas</span>
              <span class="macro-text">{{ state.totalFats() }} / {{ state.fatsGoal }} g</span>
            </div>
            <ion-progress-bar color="danger" [value]="fatsProgress()"></ion-progress-bar>
          </div>
        </div>
      </ion-card-content>
    </ion-card>
  `,
  styles: [`
    .hero-card { margin-bottom: 20px; }
    .circular-progress { margin: 15px 0 25px; }
    .macros-container { display: flex; flex-direction: column; gap: 15px; text-align: left; }
    .macro-row .macro-label { display: flex; justify-content: space-between; margin-bottom: 5px; font-size: 14px; }
    .macro-text { color: #aaa; }
    .macro-text.highlight { color: var(--ion-color-success); font-weight: bold; }
  `]
})
export class HeroSummaryComponent {
  state = inject(NutritionStateService);

  // SVG Calculations
  circumference = computed(() => 2 * Math.PI * 45);
  dashoffset = computed(() => {
    const fraction = this.state.totalCalories() / this.state.calorieGoal;
    return this.circumference() * (1 - Math.min(fraction, 1));
  });

  // Macro Progress Calculations (0 to 1)
  proteinProgress = computed(() => Math.min(this.state.totalProtein() / this.state.proteinGoal, 1));
  carbsProgress = computed(() => Math.min(this.state.totalCarbs() / this.state.carbsGoal, 1));
  fatsProgress = computed(() => Math.min(this.state.totalFats() / this.state.fatsGoal, 1));
}