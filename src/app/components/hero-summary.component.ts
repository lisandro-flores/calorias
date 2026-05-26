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
          <svg viewBox="0 0 100 100" width="160" height="160">
            <!-- Fondo del círculo -->
            <circle cx="50" cy="50" r="45" fill="none" stroke="rgba(255,255,255,0.05)" stroke-width="8" />
            <!-- Círculo de progreso -->
            <circle 
              cx="50" cy="50" r="45" 
              fill="none" 
              stroke="var(--ion-color-primary, #ffb454)" 
              stroke-width="8" 
              stroke-linecap="round"
              [style.stroke-dasharray]="circumference()"
              [style.stroke-dashoffset]="dashoffset()"
              transform="rotate(-90 50 50)" />
            <text x="50" y="48" text-anchor="middle" fill="#fff" font-size="22" font-weight="bold">
              {{ state.totalCalories() | number:'1.0-0' }}
            </text>
            <text x="50" y="65" text-anchor="middle" fill="var(--app-muted)" font-size="12">
              / {{ state.calorieGoal }} kcal
            </text>
          </svg>
        </div>
      </ion-card-content>
    </ion-card>
  `,
  styles: [`
    .hero-card { margin-bottom: 20px; padding: 10px 0; }
    .circular-progress { 
      margin: 10px 0; 
      display: flex;
      justify-content: center;
      align-items: center;
    }
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
}