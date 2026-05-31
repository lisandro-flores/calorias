import { Component, Input, Output, EventEmitter, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule, AlertController, ActionSheetController } from '@ionic/angular';
import { FormsModule } from '@angular/forms';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
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
        <div class="header-actions">
          <button class="header-add" (click)="$event.stopPropagation(); onQuickAdd()">
            <ion-icon name="add-circle"></ion-icon>
          </button>
          <ion-icon [name]="expanded ? 'chevron-up' : 'chevron-down'" class="expand-icon"></ion-icon>
        </div>
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
            <button class="edit-btn" (click)="onEditFood(food)">
              <ion-icon name="create-outline"></ion-icon>
            </button>
            <button class="delete-btn" (click)="onRemoveFood(food.id)">
              <ion-icon name="close-circle" color="danger"></ion-icon>
            </button>
          </div>
        </div>

        <div class="empty-state" *ngIf="foods.length === 0">
          Sin alimentos
        </div>

        <!-- Inline Quick Add Form -->
        <div class="inline-add-form" *ngIf="showInlineAdd">
          <input class="inline-input" placeholder="Ej: Manzana" [(ngModel)]="quickAddName" />
          <div class="inline-row">
            <input class="inline-input small" type="number" placeholder="kcal" [(ngModel)]="quickAddCals" />
            <input class="inline-input small" type="number" placeholder="prot (g)" [(ngModel)]="quickAddProt" />
          </div>
          <div class="inline-actions">
            <button class="action-btn subtle" (click)="showInlineAdd = false">Cancelar</button>
            <button class="action-btn primary" (click)="submitInlineAdd()" [disabled]="!canSubmitInlineAdd()">Guardar</button>
          </div>
        </div>

        <!-- Action Buttons -->
        <div class="meal-actions" *ngIf="!showInlineAdd">
          <button class="action-btn primary" (click)="showInlineAdd = true">
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
      border-radius: 18px;
      margin-bottom: 12px;
      overflow: hidden;
      box-shadow: 0 12px 30px rgba(0, 0, 0, 0.12);
    }
    .meal-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 14px 16px;
      cursor: pointer;
      -webkit-tap-highlight-color: transparent;
      transition: background 0.15s;
    }
    .meal-header:active {
      background: rgba(255,255,255,0.03);
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
      padding: 10px 0;
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
      flex-shrink: 0;
    }
    .food-cals {
      font-size: 14px;
      font-weight: 600;
      color: var(--app-text);
    }
    .edit-btn {
      background: none;
      border: none;
      padding: 4px;
      cursor: pointer;
      font-size: 18px;
      opacity: 0.65;
      transition: opacity 0.2s;
    }
    .edit-btn:hover { opacity: 1; }
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
      margin-top: 12px;
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
    .inline-add-form {
      background: var(--app-bg);
      border: 1px solid var(--app-border);
      border-radius: 12px;
      padding: 12px;
      margin-top: 12px;
      display: flex;
      flex-direction: column;
      gap: 8px;
    }
    .inline-input {
      background: var(--app-surface);
      border: 1px solid var(--app-border);
      border-radius: 8px;
      color: var(--app-text);
      padding: 10px 12px;
      font-size: 14px;
      outline: none;
      width: 100%;
      font-family: inherit;
    }
    .inline-input:focus { border-color: var(--app-accent); }
    .inline-row { display: flex; gap: 8px; }
    .inline-input.small { flex: 1; }
    .inline-actions { display: flex; gap: 8px; margin-top: 4px; }
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
  showInlineAdd = false;
  quickAddName = '';
  quickAddCals = '';
  quickAddProt = '';

  mealCalories() { return this.foods.reduce((acc, f) => acc + f.calories, 0); }

  onCopyYesterday() {
    this.copyYesterday.emit();
  }

  async onQuickAdd() {
    const alert = await this.alertCtrl.create({
      header: `Agregar a ${this.mealName}`,
      cssClass: 'quick-add-alert',
      inputs: [
        { name: 'name', type: 'text', placeholder: 'Nombre del alimento' },
        { name: 'calories', type: 'number', placeholder: 'Calorías (kcal)', min: 0 },
        { name: 'protein', type: 'number', placeholder: 'Proteína (g)', min: 0 },
      ],
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Agregar',
          handler: (data: any) => {
            const name = data.name?.trim();
            const calories = parseFloat(data.calories);
            const protein = parseFloat(data.protein) || 0;
            if (!name || isNaN(calories) || calories <= 0) {
              return false;
            }

            this.state.quickAdd(this.mealName, name, calories, protein);
            return true;
          }
        }
      ]
    });

    await alert.present();
  }

  onRemoveFood(foodId: string) {
    void this.confirmRemoveFood(foodId);
  }

  async confirmRemoveFood(foodId: string) {
    const alert = await this.alertCtrl.create({
      header: 'Eliminar alimento',
      message: 'Esta acción no se puede deshacer.',
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Eliminar',
          role: 'destructive',
          handler: async () => {
            this.state.removeFoodFromMeal(this.mealName, foodId);
            try { await Haptics.impact({ style: ImpactStyle.Light }); } catch (e) {}
          }
        }
      ]
    });

    await alert.present();
  }

  async onEditFood(food: FoodItem) {
    const alert = await this.alertCtrl.create({
      header: `Editar en ${this.mealName}`,
      cssClass: 'quick-add-alert',
      inputs: [
        { name: 'name', type: 'text', placeholder: 'Nombre del alimento', value: food.name },
        { name: 'portion', type: 'text', placeholder: 'Porción', value: food.portion },
        { name: 'calories', type: 'number', placeholder: 'Calorías (kcal)', min: 0, value: String(food.calories) },
        { name: 'protein', type: 'number', placeholder: 'Proteína (g)', min: 0, value: String(food.protein ?? 0) },
        { name: 'carbs', type: 'number', placeholder: 'Carbohidratos (g)', min: 0, value: String(food.carbs ?? 0) },
        { name: 'fat', type: 'number', placeholder: 'Grasa (g)', min: 0, value: String(food.fat ?? 0) },
      ],
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Guardar',
          handler: (data) => {
            const name = data.name?.trim();
            const portion = data.portion?.trim();
            const calories = parseFloat(data.calories);
            if (!name || !portion || isNaN(calories) || calories <= 0) {
              return false;
            }

            this.state.updateFoodInMeal(this.mealName, food.id, {
              name,
              portion,
              calories,
              protein: parseFloat(data.protein) || 0,
              carbs: parseFloat(data.carbs) || 0,
              fat: parseFloat(data.fat) || 0,
            });
            return true;
          }
        }
      ]
    });

    await alert.present();
  }

  canSubmitInlineAdd() {
    return this.quickAddName.trim().length > 0 && Number(this.quickAddCals) > 0;
  }

  async submitInlineAdd() {
    if (!this.canSubmitInlineAdd()) return;
    this.state.quickAdd(
      this.mealName,
      this.quickAddName.trim(),
      Number(this.quickAddCals),
      Number(this.quickAddProt) || 0
    );
    try { await Haptics.impact({ style: ImpactStyle.Light }); } catch (e) {}
    this.quickAddName = '';
    this.quickAddCals = '';
    this.quickAddProt = '';
    this.showInlineAdd = false;
  }
}