import { Component, Input, Output, EventEmitter, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { FoodItem } from '../services/nutrition-state.service';

@Component({
  selector: 'app-meal-block',
  standalone: true,
  imports: [CommonModule, IonicModule],
  template: `
    <ion-card color="dark" class="meal-card">
      <ion-card-header class="meal-header">
        <div>
          <ion-card-title>{{ mealName }}</ion-card-title>
          <ion-card-subtitle>
            Total: {{ mealCalories() }} kcal
          </ion-card-subtitle>
        </div>
        <ion-button fill="outline" size="small" color="primary" (click)="onCopyYesterday()">
          ¿Copiar de ayer?
        </ion-button>
      </ion-card-header>

      <ion-card-content>
        <ion-list class="meal-list" lines="full" *ngIf="foods.length > 0; else noFoods">
          <ion-item *ngFor="let food of foods" color="dark">
            <div slot="start" class="food-emoji">{{ food.emoji }}</div>
            <ion-label>
              <h2>{{ food.name }}</h2>
              <p>{{ food.portion }}</p>
            </ion-label>
            <div slot="end" class="food-calories">
              <strong>{{ food.calories }}</strong> kcal
            </div>
          </ion-item>
        </ion-list>
        
        <ng-template #noFoods>
          <div class="empty-state">No hay alimentos registrados.</div>
        </ng-template>
      </ion-card-content>
    </ion-card>
  `,
  styles: [`
    .meal-card { margin-bottom: 20px; }
    .meal-header { display: flex; justify-content: space-between; align-items: flex-start; }
    .food-emoji { font-size: 24px; margin-right: 15px; }
    .food-calories { text-align: right; font-size: 14px; }
    .empty-state { padding: 10px 0; color: #888; font-style: italic; }
    .meal-list { background: transparent; }
  `]
})
export class MealBlockComponent {
  @Input({ required: true }) mealName!: string;
  @Input({ required: true }) foods!: FoodItem[];
  @Output() copyYesterday = new EventEmitter<void>();

  mealCalories() { return this.foods.reduce((acc, f) => acc + f.calories, 0); }

  onCopyYesterday() {
    this.copyYesterday.emit();
  }
}