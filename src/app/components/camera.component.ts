import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule, ToastController } from '@ionic/angular';
import { NutritionStateService } from '../services/nutrition-state.service';

type QuickPreset = {
  meal: string;
  name: string;
  portion: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
};

@Component({
  selector: 'app-camera',
  standalone: true,
  imports: [CommonModule, FormsModule, IonicModule],
  template: `
    <ion-content class="ion-padding" [scrollY]="false">
      <div class="capture-shell">
        <div class="hero-card">
          <ion-icon name="camera-outline" class="huge-icon"></ion-icon>
          <h2>Captura rápida</h2>
          <p>Registra una comida en un solo paso y deja lista la base para la visión artificial.</p>
        </div>

        <div class="meal-picker">
          <button
            *ngFor="let meal of mealOptions()"
            class="meal-chip"
            [class.active]="selectedMeal() === meal.name"
            (click)="selectedMeal.set(meal.name)"
          >
            {{ meal.icon }} {{ meal.name }}
          </button>
        </div>

        <div class="capture-card">
          <ion-input label="Alimento" labelPlacement="stacked" [(ngModel)]="foodName" placeholder="Ej: Arroz con pollo"></ion-input>
          <ion-input label="Calorías" labelPlacement="stacked" type="number" min="1" [(ngModel)]="calories" placeholder="Ej: 420"></ion-input>

          <div class="macro-grid">
            <ion-input label="Proteína" labelPlacement="stacked" type="number" min="0" [(ngModel)]="protein" placeholder="g"></ion-input>
            <ion-input label="Carbos" labelPlacement="stacked" type="number" min="0" [(ngModel)]="carbs" placeholder="g"></ion-input>
            <ion-input label="Grasa" labelPlacement="stacked" type="number" min="0" [(ngModel)]="fat" placeholder="g"></ion-input>
          </div>

          <button class="save-btn" (click)="saveQuickCapture()" [disabled]="isSaving() || !canSave()">
            <ion-icon name="add-circle"></ion-icon>
            {{ isSaving() ? 'Guardando...' : 'Agregar rápido' }}
          </button>
        </div>

        <div class="preset-section">
          <div class="section-title">Atajos</div>
          <button class="preset-card" *ngFor="let preset of presets" (click)="applyPreset(preset)">
            <div>
              <strong>{{ preset.name }}</strong>
              <span>{{ preset.portion }}</span>
            </div>
            <small>{{ preset.calories }} kcal</small>
          </button>
        </div>

        <div class="coming-soon-note">
          <ion-icon name="sparkles"></ion-icon>
          <span>La foto automática seguirá después; hoy ya puedes capturar mucho más rápido.</span>
        </div>
      </div>
    </ion-content>
  `,
  styles: [`
    .capture-shell {
      display: flex;
      flex-direction: column;
      gap: 14px;
      padding-bottom: 8px;
    }
    .hero-card,
    .capture-card,
    .preset-section,
    .coming-soon-note {
      background: var(--app-surface);
      border: 1px solid var(--app-border);
      border-radius: 18px;
      padding: 16px;
    }
    .hero-card {
      display: flex;
      flex-direction: column;
      align-items: center;
      text-align: center;
      gap: 8px;
    }
    .huge-icon {
      font-size: 80px;
      color: var(--app-accent);
      opacity: 0.85;
    }
    h2 {
      font-size: 24px;
      font-weight: 700;
      margin: 0;
    }
    p {
      color: var(--app-muted);
      line-height: 1.5;
      margin: 0;
    }
    .meal-picker {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
    }
    .meal-chip {
      border: 1px solid var(--app-border);
      background: var(--app-bg);
      color: var(--app-text);
      border-radius: 999px;
      padding: 8px 12px;
      font-size: 13px;
    }
    .meal-chip.active {
      border-color: var(--app-accent);
      background: rgba(255, 193, 7, 0.12);
    }
    .capture-card {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }
    .macro-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 10px;
    }
    .save-btn {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      width: 100%;
      border: none;
      border-radius: 12px;
      padding: 12px 14px;
      font-size: 15px;
      font-weight: 700;
      background: var(--app-accent);
      color: #111;
    }
    .save-btn:disabled {
      opacity: 0.45;
    }
    .preset-section {
      display: flex;
      flex-direction: column;
      gap: 10px;
    }
    .section-title {
      font-size: 13px;
      font-weight: 700;
      color: var(--app-muted);
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .preset-card {
      width: 100%;
      display: flex;
      justify-content: space-between;
      align-items: center;
      border: 1px solid var(--app-border);
      background: var(--app-bg);
      color: var(--app-text);
      border-radius: 14px;
      padding: 12px 14px;
      text-align: left;
    }
    .preset-card div {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }
    .preset-card span,
    .preset-card small {
      color: var(--app-muted);
      font-size: 12px;
    }
    .coming-soon-note {
      display: flex;
      align-items: center;
      gap: 10px;
      color: var(--app-muted);
      font-size: 13px;
      line-height: 1.4;
    }
    .coming-soon-note ion-icon {
      color: var(--app-accent);
      font-size: 18px;
    }
  `]
})
export class CameraComponent {
  private state = inject(NutritionStateService);
  private toastCtrl = inject(ToastController);

  mealOptions = computed(() => this.state.meals());
  selectedMeal = signal(this.state.meals()[0]?.name ?? 'Desayuno');
  foodName = '';
  calories = '';
  protein = '';
  carbs = '';
  fat = '';
  isSaving = signal(false);

  presets: QuickPreset[] = [
    { meal: 'Desayuno', name: 'Avena con plátano', portion: '1 bowl', calories: 320, protein: 10, carbs: 54, fat: 7 },
    { meal: 'Comida', name: 'Arroz con pollo', portion: '1 plato', calories: 420, protein: 28, carbs: 42, fat: 11 },
    { meal: 'Snacks', name: 'Yogur griego', portion: '1 vaso', calories: 150, protein: 15, carbs: 12, fat: 4 },
  ];

  applyPreset(preset: QuickPreset) {
    this.selectedMeal.set(preset.meal);
    this.foodName = preset.name;
    this.calories = String(preset.calories);
    this.protein = String(preset.protein);
    this.carbs = String(preset.carbs);
    this.fat = String(preset.fat);
  }

  canSave() {
    return !!this.foodName.trim() && Number(this.calories) > 0;
  }

  async saveQuickCapture() {
    if (!this.canSave() || this.isSaving()) return;

    this.isSaving.set(true);
    try {
      this.state.quickAdd(
        this.selectedMeal(),
        this.foodName.trim(),
        Number(this.calories),
        Number(this.protein) || 0,
        Number(this.carbs) || 0,
        Number(this.fat) || 0,
      );

      const savedMeal = this.selectedMeal();
      const savedName = this.foodName.trim();
      this.clearFields();

      const toast = await this.toastCtrl.create({
        message: `${savedName} agregado a ${savedMeal}`,
        duration: 1800,
        position: 'top',
        color: 'dark',
      });
      await toast.present();
    } finally {
      this.isSaving.set(false);
    }
  }

  private clearFields() {
    this.foodName = '';
    this.calories = '';
    this.protein = '';
    this.carbs = '';
    this.fat = '';
  }
}
