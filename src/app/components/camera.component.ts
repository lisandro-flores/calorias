import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule, ToastController } from '@ionic/angular';
import { NutritionStateService } from '../services/nutrition-state.service';
import { AiService, AiFoodItem } from '../services/ai.service';

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
    <ion-content class="ion-padding" [scrollY]="true">
      <div class="capture-shell">
        <div class="section-badge">Registrar comida</div>

        <!-- Mode Toggle -->
        <div class="mode-toggle">
          <button class="mode-btn" [class.active]="mode() === 'photo'" (click)="mode.set('photo')">
            <ion-icon name="camera"></ion-icon> Foto con IA
          </button>
          <button class="mode-btn" [class.active]="mode() === 'manual'" (click)="mode.set('manual')">
            <ion-icon name="create"></ion-icon> Manual
          </button>
        </div>

        <!-- Meal Picker (shared) -->
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

        <!-- ===== PHOTO MODE ===== -->
        <ng-container *ngIf="mode() === 'photo'">
          <div class="photo-card">
            <!-- No image yet -->
            <div class="photo-placeholder" *ngIf="!imagePreview()" (click)="fileInput.click()">
              <ion-icon name="camera-outline" class="placeholder-icon"></ion-icon>
              <span>Toma una foto o selecciona de tu galería</span>
              <button class="photo-btn" (click)="fileInput.click(); $event.stopPropagation()">
                <ion-icon name="image"></ion-icon> Abrir cámara / galería
              </button>
            </div>

            <!-- Image preview -->
            <div class="photo-preview" *ngIf="imagePreview()">
              <img [src]="imagePreview()" alt="Vista previa del plato" />
              <div class="photo-actions">
                <button class="photo-action-btn retake" (click)="clearImage(); fileInput.click()">
                  <ion-icon name="refresh"></ion-icon> Otra foto
                </button>
                <button class="photo-action-btn analyze" (click)="analyzePhoto()" [disabled]="isAnalyzing()">
                  <ion-icon name="sparkles"></ion-icon>
                  {{ isAnalyzing() ? 'Analizando...' : 'Analizar con IA' }}
                </button>
              </div>
            </div>

            <input #fileInput type="file" accept="image/*" capture="environment"
              (change)="onFileSelected($event)" style="display: none" />
          </div>

          <!-- Analysis Results -->
          <div class="results-card" *ngIf="detectedFoods().length > 0">
            <div class="results-header">
              <ion-icon name="checkmark-circle" class="results-icon"></ion-icon>
              <span>{{ detectedFoods().length }} alimento(s) detectado(s)</span>
            </div>

            <div class="food-result" *ngFor="let food of detectedFoods(); let i = index">
              <div class="food-result-header">
                <ion-icon [name]="food.icon || 'restaurant'" class="food-icon"></ion-icon>
                <div class="food-info">
                  <input class="food-name-input" [(ngModel)]="food.name" />
                  <span class="food-portion">{{ food.portion }}</span>
                </div>
                <button class="remove-food-btn" (click)="removeDetectedFood(i)">
                  <ion-icon name="close-circle"></ion-icon>
                </button>
              </div>
              <div class="food-macros">
                <div class="macro-pill">
                  <span class="macro-val">{{ food.calories }}</span>
                  <span class="macro-label">kcal</span>
                </div>
                <div class="macro-pill">
                  <span class="macro-val">{{ food.protein }}g</span>
                  <span class="macro-label">prot</span>
                </div>
                <div class="macro-pill">
                  <span class="macro-val">{{ food.carbs }}g</span>
                  <span class="macro-label">carbs</span>
                </div>
                <div class="macro-pill">
                  <span class="macro-val">{{ food.fat }}g</span>
                  <span class="macro-label">grasa</span>
                </div>
              </div>
            </div>

            <button class="save-btn" (click)="saveDetectedFoods()" [disabled]="isSaving()">
              <ion-icon name="add-circle"></ion-icon>
              {{ isSaving() ? 'Guardando...' : 'Agregar ' + detectedFoods().length + ' alimento(s) a ' + selectedMeal() }}
            </button>
          </div>

          <!-- Analysis Error -->
          <div class="error-card" *ngIf="analysisError()">
            <ion-icon name="alert-circle"></ion-icon>
            <span>{{ analysisError() }}</span>
            <button class="retry-btn" (click)="analyzePhoto()">Reintentar</button>
          </div>
        </ng-container>

        <!-- ===== MANUAL MODE ===== -->
        <ng-container *ngIf="mode() === 'manual'">
          <div class="capture-card">
            <ion-input label="Alimento" labelPlacement="stacked" [(ngModel)]="foodName" placeholder="Ej: Arroz con pollo" autofocus="true"></ion-input>
            <ion-input label="Calorías" labelPlacement="stacked" type="number" min="1" inputmode="numeric" [(ngModel)]="calories" placeholder="Ej: 420"></ion-input>

            <div class="macro-grid">
              <ion-input label="Proteína" labelPlacement="stacked" type="number" min="0" inputmode="numeric" [(ngModel)]="protein" placeholder="g"></ion-input>
              <ion-input label="Carbos" labelPlacement="stacked" type="number" min="0" inputmode="numeric" [(ngModel)]="carbs" placeholder="g"></ion-input>
              <ion-input label="Grasa" labelPlacement="stacked" type="number" min="0" inputmode="numeric" [(ngModel)]="fat" placeholder="g"></ion-input>
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
        </ng-container>
      </div>
    </ion-content>
  `,
  styles: [`
    .capture-shell {
      display: flex;
      flex-direction: column;
      gap: 14px;
      padding-bottom: 20px;
    }
    .section-badge {
      display: inline-flex;
      align-self: flex-start;
      background: rgba(255, 193, 7, 0.12);
      color: var(--app-accent);
      border: 1px solid rgba(255, 193, 7, 0.18);
      border-radius: 999px;
      padding: 6px 10px;
      font-size: 11px;
      font-weight: 700;
      letter-spacing: 0.6px;
      text-transform: uppercase;
    }

    /* Mode toggle */
    .mode-toggle {
      display: flex;
      gap: 8px;
      background: var(--app-bg);
      border-radius: 14px;
      padding: 4px;
      border: 1px solid var(--app-border);
    }
    .mode-btn {
      flex: 1;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 6px;
      border: none;
      background: transparent;
      color: var(--app-muted);
      border-radius: 10px;
      padding: 10px 14px;
      font-size: 14px;
      font-weight: 600;
      transition: all 0.2s;
    }
    .mode-btn.active {
      background: var(--app-surface);
      color: var(--app-accent);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    }

    /* Meal picker */
    .meal-picker { display: flex; flex-wrap: wrap; gap: 8px; }
    .meal-chip {
      border: 1px solid var(--app-border);
      background: var(--app-bg);
      color: var(--app-text);
      border-radius: 999px;
      padding: 8px 12px;
      font-size: 13px;
      transition: transform 0.15s, border-color 0.15s, background 0.15s;
    }
    .meal-chip.active {
      border-color: var(--app-accent);
      background: rgba(255, 193, 7, 0.12);
    }
    .meal-chip:active { transform: scale(0.98); }

    /* Photo card */
    .photo-card {
      background: var(--app-surface);
      border: 1px solid var(--app-border);
      border-radius: 18px;
      overflow: hidden;
      box-shadow: 0 16px 36px rgba(0, 0, 0, 0.16);
    }
    .photo-placeholder {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 12px;
      padding: 40px 20px;
      text-align: center;
      color: var(--app-muted);
      cursor: pointer;
      transition: background 0.2s;
    }
    .photo-placeholder:active {
      background: rgba(255, 193, 7, 0.04);
    }
    .placeholder-icon {
      font-size: 64px;
      color: var(--app-accent);
      opacity: 0.7;
    }
    .photo-btn {
      display: flex;
      align-items: center;
      gap: 6px;
      background: var(--app-accent);
      color: #111;
      border: none;
      border-radius: 12px;
      padding: 10px 18px;
      font-size: 14px;
      font-weight: 700;
      margin-top: 4px;
    }
    .photo-preview {
      position: relative;
    }
    .photo-preview img {
      width: 100%;
      max-height: 280px;
      object-fit: cover;
      display: block;
    }
    .photo-actions {
      display: flex;
      gap: 8px;
      padding: 12px;
    }
    .photo-action-btn {
      flex: 1;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 6px;
      border: none;
      border-radius: 12px;
      padding: 10px 14px;
      font-size: 13px;
      font-weight: 700;
      transition: transform 0.15s, opacity 0.15s;
    }
    .photo-action-btn:active:not(:disabled) { transform: translateY(1px); }
    .photo-action-btn:disabled { opacity: 0.5; }
    .photo-action-btn.retake {
      background: var(--app-bg);
      color: var(--app-text);
      border: 1px solid var(--app-border);
    }
    .photo-action-btn.analyze {
      background: var(--app-accent);
      color: #111;
      box-shadow: 0 6px 16px rgba(255, 193, 7, 0.2);
    }

    /* Results */
    .results-card {
      background: var(--app-surface);
      border: 1px solid var(--app-border);
      border-radius: 18px;
      padding: 16px;
      box-shadow: 0 16px 36px rgba(0, 0, 0, 0.16);
      animation: fadeSlideIn 0.3s ease-out;
    }
    .results-header {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 14px;
      font-weight: 700;
      font-size: 14px;
      color: var(--app-accent-2, #4ade80);
    }
    .results-icon { font-size: 20px; }
    .food-result {
      background: var(--app-bg);
      border: 1px solid var(--app-border);
      border-radius: 14px;
      padding: 12px;
      margin-bottom: 10px;
    }
    .food-result-header {
      display: flex;
      align-items: center;
      gap: 10px;
      margin-bottom: 8px;
    }
    .food-icon { font-size: 22px; color: var(--app-accent); }
    .food-info { flex: 1; display: flex; flex-direction: column; gap: 2px; }
    .food-name-input {
      background: transparent;
      border: none;
      border-bottom: 1px solid var(--app-border);
      color: var(--app-text);
      font-size: 15px;
      font-weight: 600;
      padding: 2px 0;
      width: 100%;
    }
    .food-name-input:focus { border-color: var(--app-accent); outline: none; }
    .food-portion { font-size: 12px; color: var(--app-muted); }
    .remove-food-btn {
      background: transparent;
      border: none;
      color: var(--app-muted);
      font-size: 22px;
      padding: 4px;
      transition: color 0.15s;
    }
    .remove-food-btn:active { color: #f87171; }
    .food-macros {
      display: flex;
      gap: 8px;
    }
    .macro-pill {
      flex: 1;
      text-align: center;
      background: rgba(255, 193, 7, 0.06);
      border-radius: 10px;
      padding: 6px 4px;
    }
    .macro-val { font-size: 13px; font-weight: 700; color: var(--app-text); display: block; }
    .macro-label { font-size: 10px; color: var(--app-muted); text-transform: uppercase; }

    /* Error */
    .error-card {
      display: flex;
      align-items: center;
      gap: 10px;
      background: rgba(248, 113, 113, 0.1);
      border: 1px solid rgba(248, 113, 113, 0.2);
      border-radius: 14px;
      padding: 14px;
      color: #f87171;
      font-size: 13px;
    }
    .error-card ion-icon { font-size: 22px; flex-shrink: 0; }
    .retry-btn {
      margin-left: auto;
      background: rgba(248, 113, 113, 0.15);
      border: none;
      color: #f87171;
      border-radius: 8px;
      padding: 6px 12px;
      font-weight: 600;
      font-size: 12px;
      white-space: nowrap;
    }

    /* Manual mode (existing) */
    .capture-card, .preset-section {
      background: var(--app-surface);
      border: 1px solid var(--app-border);
      border-radius: 18px;
      padding: 16px;
      box-shadow: 0 16px 36px rgba(0, 0, 0, 0.16);
    }
    .capture-card { display: flex; flex-direction: column; gap: 12px; }
    .macro-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; }
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
      box-shadow: 0 10px 22px rgba(255, 193, 7, 0.18);
      transition: transform 0.15s, opacity 0.15s;
    }
    .save-btn:disabled { opacity: 0.45; }
    .save-btn:active:not(:disabled) { transform: translateY(1px); }
    .preset-section { display: flex; flex-direction: column; gap: 10px; }
    .section-title {
      font-size: 13px; font-weight: 700; color: var(--app-muted);
      text-transform: uppercase; letter-spacing: 0.5px;
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
      transition: border-color 0.15s, transform 0.15s, background 0.15s;
    }
    .preset-card div { display: flex; flex-direction: column; gap: 2px; }
    .preset-card span, .preset-card small { color: var(--app-muted); font-size: 12px; }
    .preset-card:active {
      transform: scale(0.99);
      border-color: var(--app-accent);
      background: rgba(255, 193, 7, 0.05);
    }

    @keyframes fadeSlideIn {
      from { opacity: 0; transform: translateY(12px); }
      to { opacity: 1; transform: translateY(0); }
    }
  `]
})
export class CameraComponent {
  private state = inject(NutritionStateService);
  private toastCtrl = inject(ToastController);
  private aiService = inject(AiService);

  // Mode
  mode = signal<'photo' | 'manual'>('photo');

  // Shared
  mealOptions = computed(() => this.state.meals());
  selectedMeal = signal(this.state.meals()[0]?.name ?? 'Desayuno');
  isSaving = signal(false);

  // Photo mode
  imagePreview = signal<string | null>(null);
  private imageBase64 = signal<string | null>(null);
  isAnalyzing = signal(false);
  detectedFoods = signal<AiFoodItem[]>([]);
  analysisError = signal<string | null>(null);

  // Manual mode
  foodName = '';
  calories = '';
  protein = '';
  carbs = '';
  fat = '';

  presets: QuickPreset[] = [
    { meal: 'Desayuno', name: 'Avena con plátano', portion: '1 bowl', calories: 320, protein: 10, carbs: 54, fat: 7 },
    { meal: 'Comida', name: 'Arroz con pollo', portion: '1 plato', calories: 420, protein: 28, carbs: 42, fat: 11 },
    { meal: 'Snacks', name: 'Yogur griego', portion: '1 vaso', calories: 150, protein: 15, carbs: 12, fat: 4 },
  ];

  // === Photo Mode Methods ===

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input?.files?.[0];
    if (!file) return;

    // Reset previous results
    this.detectedFoods.set([]);
    this.analysisError.set(null);

    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      this.imagePreview.set(dataUrl);
      this.imageBase64.set(dataUrl);
    };
    reader.readAsDataURL(file);

    // Reset file input so the same image can be re-selected
    input.value = '';
  }

  clearImage() {
    this.imagePreview.set(null);
    this.imageBase64.set(null);
    this.detectedFoods.set([]);
    this.analysisError.set(null);
  }

  analyzePhoto() {
    const base64 = this.imageBase64();
    if (!base64 || this.isAnalyzing()) return;

    this.isAnalyzing.set(true);
    this.analysisError.set(null);

    this.aiService.analyzeImage(base64, this.selectedMeal()).subscribe({
      next: (foods) => {
        this.detectedFoods.set(foods);
        this.isAnalyzing.set(false);
      },
      error: (err) => {
        const msg = err.status === 429
          ? 'Demasiadas solicitudes. Espera un momento e intenta de nuevo.'
          : err.status === 403
          ? 'API key inválida. Contacta al administrador.'
          : 'No se pudo analizar la imagen. Intenta con otra foto o usa el modo manual.';
        this.analysisError.set(msg);
        this.isAnalyzing.set(false);
      }
    });
  }

  removeDetectedFood(index: number) {
    const foods = [...this.detectedFoods()];
    foods.splice(index, 1);
    this.detectedFoods.set(foods);
  }

  async saveDetectedFoods() {
    const foods = this.detectedFoods();
    if (foods.length === 0 || this.isSaving()) return;

    this.isSaving.set(true);
    try {
      const meal = this.selectedMeal();
      for (const food of foods) {
        this.state.quickAdd(
          meal,
          food.name,
          food.calories,
          food.protein || 0,
          food.carbs || 0,
          food.fat || 0,
        );
      }

      const toast = await this.toastCtrl.create({
        message: `${foods.length} alimento(s) agregado(s) a ${meal}`,
        duration: 2000,
        position: 'top',
        color: 'dark',
      });
      await toast.present();

      // Clear everything
      this.clearImage();
    } finally {
      this.isSaving.set(false);
    }
  }

  // === Manual Mode Methods ===

  applyPreset(preset: QuickPreset) {
    this.selectedMeal.set(preset.meal);
    this.foodName = preset.name;
    this.calories = String(preset.calories);
    this.protein = String(preset.protein);
    this.carbs = String(preset.carbs);
    this.fat = String(preset.fat);
    this.mode.set('manual');
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
