import { Component, Input, Output, EventEmitter, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule, AlertController, ActionSheetController } from '@ionic/angular';
import { FormsModule } from '@angular/forms';
import { FoodItem, NutritionStateService } from '../services/nutrition-state.service';

@Component({
  selector: 'app-meal-block',
  standalone: true,
  imports: [CommonModule, IonicModule, FormsModule],
  template: `
    <div class="meal-section">
      <!-- Meal Header -->
      <div class="meal-header" (click)="expanded = !expanded">
        <div class="meal-title-row">
          <ion-icon class="meal-icon" [name]="mealIcon"></ion-icon>
          <span class="meal-name">{{ mealName }}</span>
          <span class="meal-cals">{{ mealCalories() }} kcal</span>
        </div>
        <ion-icon [name]="expanded ? 'chevron-up' : 'chevron-down'" class="expand-icon"></ion-icon>
      </div>

      <!-- Expanded Content -->
      <div class="meal-body" *ngIf="expanded">
        <!-- Food list -->
        <div class="food-row" *ngFor="let food of foods">
          <ion-icon class="food-icon" [name]="food.icon || 'restaurant'"></ion-icon>
          <div class="food-info">
            <span class="food-name">{{ food.name }}</span>
            <span class="food-portion">{{ food.portion }}</span>
          </div>
          <div class="food-actions">
            <span class="food-cals">{{ food.calories }}</span>
            <button class="delete-btn" (click)="onRemoveFood(food.id)">
              <ion-icon name="close-circle" color="danger"></ion-icon>
            </button>
          </div>
        </div>

        <div class="empty-state" *ngIf="foods.length === 0">
          Sin alimentos
        </div>

        <!-- Action Buttons -->
        <div class="meal-actions">
          <button class="action-btn primary" (click)="onQuickAdd()">
            <ion-icon name="add"></ion-icon>
            Agregar
          </button>
          <button class="action-btn subtle" (click)="onCopyYesterday()">
            <ion-icon name="copy-outline"></ion-icon>
            Copiar ayer
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .meal-section {
      background: var(--app-surface);
      border: 1px solid var(--app-border);
      border-radius: 14px;
      margin-bottom: 12px;
      overflow: hidden;
    }
    .meal-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 14px 16px;
      cursor: pointer;
      -webkit-tap-highlight-color: transparent;
    }
    .meal-title-row {
      display: flex;
      align-items: center;
      gap: 10px;
    }
    .meal-icon { font-size: 18px; }
    .meal-name {
      font-size: 15px;
      font-weight: 600;
      color: var(--app-text);
    }
    .meal-cals {
      font-size: 13px;
      color: var(--app-muted);
      margin-left: 4px;
    }
    .expand-icon {
      color: var(--app-muted);
      font-size: 16px;
    }
    .meal-body {
      padding: 0 16px 14px;
    }
    .food-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 8px 0;
      border-bottom: 1px solid var(--app-border);
      gap: 10px;
    }
    .food-row:last-of-type {
      border-bottom: none;
    }
    .food-icon {
      width: 24px;
      text-align: center;
      font-size: 20px;
      flex-shrink: 0;
      color: var(--app-accent);
    }
    .food-info {
      display: flex;
      flex-direction: column;
      gap: 2px;
      flex: 1;
      min-width: 0;
    }
    .food-name {
      font-size: 14px;
      color: var(--app-text);
    }
    .food-portion {
      font-size: 11px;
      color: var(--app-muted);
    }
    .food-actions {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .food-cals {
      font-size: 14px;
      font-weight: 600;
      color: var(--app-text);
    }
    .delete-btn {
      background: none;
      border: none;
      padding: 4px;
      cursor: pointer;
      font-size: 18px;
      opacity: 0.5;
      transition: opacity 0.2s;
    }
    .delete-btn:hover { opacity: 1; }
    .empty-state {
      text-align: center;
      padding: 12px 0;
      font-size: 13px;
      color: var(--app-muted);
      font-style: italic;
    }
    .meal-actions {
      display: flex;
      gap: 8px;
      margin-top: 10px;
    }
    .action-btn {
      flex: 1;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 6px;
      padding: 8px 12px;
      border-radius: 10px;
      border: none;
      font-size: 13px;
      font-weight: 500;
      cursor: pointer;
      font-family: inherit;
      transition: all 0.2s;
    }
    .action-btn.primary {
      background: var(--app-accent);
      color: #111;
    }
    .action-btn.subtle {
      background: var(--app-surface-2);
      color: var(--app-muted);
      border: 1px solid var(--app-border);
    }
    .action-btn ion-icon { font-size: 16px; }
  `]
})
export class MealBlockComponent {
  @Input({ required: true }) mealName!: string;
  @Input() mealIcon: string = 'restaurant-outline';
  @Input({ required: true }) foods!: FoodItem[];
  @Output() copyYesterday = new EventEmitter<void>();

  private state = inject(NutritionStateService);
  private alertCtrl = inject(AlertController);

  expanded = false;

  mealCalories() { return this.foods.reduce((acc, f) => acc + f.calories, 0); }

  onCopyYesterday() {
    this.copyYesterday.emit();
  }

  onRemoveFood(foodId: string) {
    this.state.removeFoodFromMeal(this.mealName, foodId);
  }

  async onQuickAdd() {
    const alert = await this.alertCtrl.create({
      header: `Agregar a ${this.mealName}`,
      cssClass: 'quick-add-alert',
      inputs: [
        { name: 'name', type: 'text', placeholder: 'Nombre del alimento' },
        { name: 'calories', type: 'number', placeholder: 'Calorías (kcal)', min: 0 },
        { name: 'protein', type: 'number', placeholder: 'Proteína (g) — opcional', min: 0 },
      ],
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Agregar',
          handler: (data) => {
            const name = data.name?.trim();
            const calories = parseFloat(data.calories);
            if (!name || isNaN(calories) || calories <= 0) return false;
            const protein = parseFloat(data.protein) || 0;
            this.state.quickAdd(this.mealName, name, calories, protein);
            return true;
          }
        }
      ]
    });
    await alert.present();
  }
}