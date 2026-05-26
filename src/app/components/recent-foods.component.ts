import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule, ActionSheetController } from '@ionic/angular';
import { NutritionStateService, FoodItem } from '../services/nutrition-state.service';

@Component({
  selector: 'app-recent-foods',
  standalone: true,
  imports: [CommonModule, IonicModule],
  template: `
    <div class="recent-section" *ngIf="state.recentFoods().length > 0">
      <div class="section-title">Recientes</div>
      <div class="chips-row">
        <button class="food-chip" *ngFor="let food of state.recentFoods().slice(0, 8)" (click)="onAddRecent(food)">
          <span class="chip-name">{{ food.name }}</span>
          <span class="chip-cals">{{ food.calories }}</span>
        </button>
      </div>
    </div>
  `,
  styles: [`
    .recent-section {
      margin-bottom: 16px;
    }
    .section-title {
      font-size: 13px;
      font-weight: 600;
      color: var(--app-muted);
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 10px;
    }
    .chips-row {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
    }
    .food-chip {
      display: flex;
      align-items: center;
      gap: 6px;
      background: var(--app-surface);
      border: 1px solid var(--app-border);
      border-radius: 20px;
      padding: 6px 12px;
      cursor: pointer;
      font-family: inherit;
      transition: all 0.2s;
    }
    .food-chip:active {
      background: var(--app-surface-2);
      transform: scale(0.96);
    }
    .chip-name {
      font-size: 12px;
      color: var(--app-text);
      max-width: 120px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .chip-cals {
      font-size: 11px;
      color: var(--app-accent);
      font-weight: 600;
    }
  `]
})
export class RecentFoodsComponent {
  state = inject(NutritionStateService);
  private actionSheetCtrl = inject(ActionSheetController);

  async onAddRecent(food: FoodItem) {
    const meals = this.state.meals();
    const buttons = meals.map(meal => ({
      text: `${meal.icon} ${meal.name}`,
      handler: () => {
        this.state.addFoodToMeal(meal.name, {
          ...food,
          id: Date.now().toString() + Math.random().toString(36).substr(2, 4),
        });
      }
    }));
    buttons.push({ text: 'Cancelar', handler: () => {} } as any);

    const sheet = await this.actionSheetCtrl.create({
      header: '¿A qué comida agregar?',
      buttons,
    });
    await sheet.present();
  }
}