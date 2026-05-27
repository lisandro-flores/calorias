import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule, ToastController } from '@ionic/angular';
import { AiService, AiFoodItem } from '../services/ai.service';
import { NutritionStateService } from '../services/nutrition-state.service';

@Component({
  selector: 'app-ai-input',
  standalone: true,
  imports: [CommonModule, FormsModule, IonicModule],
  template: `
    <div class="ai-wrapper">
      <!-- Collapsed trigger -->
      <button class="ai-trigger" (click)="toggle()" [class.active]="isOpen()">
        <ion-icon class="ai-icon" name="sparkles"></ion-icon>
        <span class="ai-label">Registrar con IA</span>
        <ion-icon [name]="isOpen() ? 'chevron-up' : 'chevron-down'" class="ai-chevron"></ion-icon>
      </button>

      <!-- Expanded panel -->
      <div class="ai-panel" *ngIf="isOpen()">
        <div class="ai-hint">Describe lo que comiste en lenguaje natural</div>

        <textarea
          class="ai-textarea"
          [(ngModel)]="userText"
          placeholder="Ej: Desayuné 2 huevos revueltos, frijoles y un café con leche. A medio día comí arroz con pollo..."
          rows="3"
          (keydown.enter)="onEnter($any($event))">
        </textarea>

        <!-- Examples chips -->
        <div class="examples-row">
          <button class="example-chip" *ngFor="let ex of examples" (click)="useExample(ex)">
            {{ ex }}
          </button>
        </div>

        <button class="ai-send-btn" (click)="sendToAI()" [disabled]="isLoading() || !userText.trim()">
          <span *ngIf="!isLoading()"><ion-icon name="sparkles"></ion-icon> Analizar</span>
          <span *ngIf="isLoading()" class="loading-dots">
            Analizando<span class="dot">.</span><span class="dot">.</span><span class="dot">.</span>
          </span>
        </button>

        <!-- Results preview -->
        <div class="results-section" *ngIf="results().length > 0">
          <div class="results-title">{{ results().length }} alimento{{ results().length > 1 ? 's' : '' }} detectado{{ results().length > 1 ? 's' : '' }}</div>

          <div class="result-item" *ngFor="let food of results()">
            <span class="result-emoji">{{ food.emoji || '🍽️' }}</span>
            <div class="result-info">
              <span class="result-name">{{ food.name }}</span>
              <span class="result-detail">{{ food.portion }} · {{ food.calories }} kcal · P: {{ food.protein }}g</span>
            </div>
            <span class="result-cals">{{ food.calories }}</span>
          </div>

          <div class="action-row">
            <button class="confirm-btn" (click)="confirmAll()">
              <ion-icon name="add-circle"></ion-icon>
              Agregar todos
            </button>
            <button class="dismiss-btn" (click)="clearResults()">Descartar</button>
          </div>
        </div>

        <!-- Meal picker overlay for bulk add -->
        <div class="meal-picker-overlay" *ngIf="mealPickerOpen()" (click)="cancelMealPicker()">
          <div class="meal-picker-card" (click)="$event.stopPropagation()">
            <div class="meal-picker-title">¿A qué comida agregar?</div>
            <button
              class="meal-picker-btn"
              *ngFor="let meal of nutritionState.meals()"
              (click)="addAllToMeal(meal.name)"
            >
              <ion-icon [name]="meal.icon"></ion-icon>
              <span>{{ meal.name }}</span>
            </button>
            <button class="meal-picker-cancel" (click)="cancelMealPicker()">Cancelar</button>
          </div>
        </div>

        <!-- Error -->
        <div class="error-msg" *ngIf="errorMsg()">{{ errorMsg() }}</div>

        <!-- Missing API Key Warning -->
        <div class="api-key-warning" *ngIf="isMissingApiKey()">
          <div class="api-key-title">Falta configurar la IA <ion-icon name="alert-circle"></ion-icon></div>
          <p>Para usar esta función, necesitas tu API Key de Gemini.</p>
          <ol>
            <li>Consigue una gratis en <a href="https://aistudio.google.com/apikey" target="_blank">aistudio.google.com</a></li>
            <li>Abre el archivo <code>backend/.env</code></li>
            <li>Pega la key: <code>GEMINI_API_KEY=tu_key_aqui</code></li>
            <li>Reinicia el servidor backend</li>
          </ol>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .ai-wrapper {
      margin-bottom: 16px;
    }

    /* Trigger button */
    .ai-trigger {
      width: 100%;
      display: flex;
      align-items: center;
      gap: 10px;
      background: var(--app-surface);
      border: 1px solid var(--app-border);
      border-radius: 14px;
      padding: 12px 16px;
      cursor: pointer;
      font-family: inherit;
      transition: all 0.2s;
    }
    .ai-trigger.active {
      border-bottom-left-radius: 0;
      border-bottom-right-radius: 0;
      border-bottom-color: transparent;
    }
    .ai-icon {
      font-size: 18px;
    }
    .ai-label {
      flex: 1;
      font-size: 14px;
      font-weight: 500;
      color: var(--app-text);
      text-align: left;
    }
    .ai-chevron {
      color: var(--app-muted);
      font-size: 16px;
    }

    /* Expanded panel */
    .ai-panel {
      background: var(--app-surface);
      border: 1px solid var(--app-border);
      border-top: none;
      border-radius: 0 0 14px 14px;
      padding: 14px 16px 16px;
    }

    .ai-hint {
      font-size: 12px;
      color: var(--app-muted);
      margin-bottom: 10px;
    }

    .ai-textarea {
      width: 100%;
      background: var(--app-bg);
      border: 1px solid var(--app-border);
      border-radius: 10px;
      color: var(--app-text);
      font-family: inherit;
      font-size: 14px;
      padding: 10px 12px;
      resize: none;
      outline: none;
      box-sizing: border-box;
      line-height: 1.5;
      transition: border-color 0.2s;
    }
    .ai-textarea:focus {
      border-color: var(--app-accent);
    }

    /* Examples */
    .examples-row {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
      margin: 10px 0;
    }
    .example-chip {
      background: none;
      border: 1px solid var(--app-border);
      border-radius: 20px;
      padding: 4px 10px;
      font-size: 11px;
      color: var(--app-muted);
      cursor: pointer;
      font-family: inherit;
      transition: all 0.2s;
    }
    .example-chip:active {
      background: var(--app-surface-2);
      color: var(--app-text);
    }

    /* Send button */
    .ai-send-btn {
      width: 100%;
      padding: 11px;
      background: var(--app-accent);
      color: #111;
      border: none;
      border-radius: 10px;
      font-size: 14px;
      font-weight: 600;
      font-family: inherit;
      cursor: pointer;
      transition: opacity 0.2s;
    }
    .ai-send-btn:disabled {
      opacity: 0.4;
      cursor: not-allowed;
    }

    /* Loading dots */
    .loading-dots .dot {
      animation: blink 1.2s infinite;
    }
    .loading-dots .dot:nth-child(2) { animation-delay: 0.2s; }
    .loading-dots .dot:nth-child(3) { animation-delay: 0.4s; }
    @keyframes blink {
      0%, 80%, 100% { opacity: 0; }
      40% { opacity: 1; }
    }

    /* Results */
    .results-section {
      margin-top: 14px;
    }
    .results-title {
      font-size: 12px;
      font-weight: 600;
      color: var(--app-muted);
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 10px;
    }
    .result-item {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 8px 0;
      border-bottom: 1px solid var(--app-border);
    }
    .result-item:last-of-type {
      border-bottom: none;
    }
    .result-emoji {
      font-size: 22px;
      width: 28px;
      text-align: center;
      flex-shrink: 0;
    }
    .result-info {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 2px;
    }
    .result-name {
      font-size: 13px;
      font-weight: 500;
      color: var(--app-text);
    }
    .result-detail {
      font-size: 11px;
      color: var(--app-muted);
    }
    .result-cals {
      font-size: 14px;
      font-weight: 600;
      color: var(--app-accent);
    }

    /* Action row */
    .action-row {
      display: flex;
      gap: 8px;
      margin-top: 12px;
    }
    .confirm-btn {
      flex: 1;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 6px;
      padding: 10px;
      background: var(--app-accent);
      color: #111;
      border: none;
      border-radius: 10px;
      font-size: 13px;
      font-weight: 600;
      cursor: pointer;
      font-family: inherit;
    }
    .confirm-btn ion-icon {
      font-size: 16px;
    }
    .dismiss-btn {
      padding: 10px 16px;
      background: none;
      border: 1px solid var(--app-border);
      border-radius: 10px;
      color: var(--app-muted);
      font-size: 13px;
      font-family: inherit;
      cursor: pointer;
    }

    .meal-picker-overlay {
      position: fixed;
      inset: 0;
      z-index: 9999;
      background: rgba(0, 0, 0, 0.55);
      display: flex;
      align-items: flex-end;
      justify-content: center;
      padding: 16px;
    }
    .meal-picker-card {
      width: 100%;
      max-width: 560px;
      background: var(--app-surface);
      border: 1px solid var(--app-border);
      border-radius: 18px;
      padding: 14px;
      box-shadow: 0 18px 45px rgba(0, 0, 0, 0.35);
      display: flex;
      flex-direction: column;
      gap: 10px;
    }
    .meal-picker-title {
      font-size: 14px;
      font-weight: 700;
      color: var(--app-text);
      margin-bottom: 2px;
    }
    .meal-picker-btn {
      display: flex;
      align-items: center;
      gap: 10px;
      width: 100%;
      padding: 12px 14px;
      border: 1px solid var(--app-border);
      border-radius: 12px;
      background: var(--app-bg);
      color: var(--app-text);
      font-family: inherit;
      font-size: 14px;
      cursor: pointer;
      text-align: left;
    }
    .meal-picker-btn ion-icon {
      font-size: 18px;
      color: var(--app-accent);
    }
    .meal-picker-cancel {
      margin-top: 2px;
      padding: 11px 14px;
      border: 1px solid var(--app-border);
      border-radius: 12px;
      background: none;
      color: var(--app-muted);
      font-family: inherit;
      font-size: 14px;
      cursor: pointer;
    }

    /* Error */
    .error-msg {
      margin-top: 10px;
      font-size: 12px;
      color: var(--ion-color-danger);
      text-align: center;
    }

    /* API Key Warning */
    .api-key-warning {
      margin-top: 14px;
      background: rgba(240, 168, 68, 0.1);
      border: 1px solid rgba(240, 168, 68, 0.3);
      border-radius: 12px;
      padding: 14px;
      color: var(--app-text);
      font-size: 13px;
    }
    .api-key-title {
      font-weight: 600;
      color: #f0a844;
      margin-bottom: 6px;
      font-size: 14px;
    }
    .api-key-warning p {
      margin: 0 0 10px 0;
      color: var(--app-muted);
    }
    .api-key-warning ol {
      margin: 0;
      padding-left: 20px;
      color: var(--app-muted);
    }
    .api-key-warning li {
      margin-bottom: 6px;
    }
    .api-key-warning a {
      color: var(--app-accent);
      text-decoration: none;
    }
    .api-key-warning code {
      background: var(--app-bg);
      padding: 2px 6px;
      border-radius: 4px;
      font-family: monospace;
      font-size: 11px;
      color: var(--app-text);
    }
  `]
})
export class AiInputComponent {
  private aiService = inject(AiService);
  nutritionState = inject(NutritionStateService);
  private toastCtrl = inject(ToastController);

  isOpen = signal(false);
  isLoading = signal(false);
  results = signal<AiFoodItem[]>([]);
  errorMsg = signal<string>('');
  isMissingApiKey = signal<boolean>(false);
  mealPickerOpen = signal<boolean>(false);
  private pendingFoods: AiFoodItem[] = [];
  userText = '';

  examples = [
    '2 tacos de bistec',
    'ensalada cesar con pollo',
    'avena con plátano y miel',
    'torta de jamón con refresco',
  ];

  toggle() {
    this.isOpen.update(v => !v);
    if (!this.isOpen()) {
      this.clearResults();
    }
  }

  useExample(text: string) {
    this.userText = text;
  }

  onEnter(event: KeyboardEvent) {
    if (!event.shiftKey) {
      event.preventDefault();
      this.sendToAI();
    }
  }

  sendToAI() {
    if (!this.userText.trim() || this.isLoading()) return;

    this.isLoading.set(true);
    this.results.set([]);
    this.errorMsg.set('');
    this.isMissingApiKey.set(false);

    this.aiService.parseMeal(this.userText).subscribe({
      next: (foods) => {
        this.results.set(foods);
        this.isLoading.set(false);
      },
      error: (err) => {
        const backendMsg = err.error?.message;
        if (backendMsg === 'MISSING_API_KEY' || backendMsg === 'INVALID_API_KEY') {
          this.isMissingApiKey.set(true);
        } else if (backendMsg === 'RATE_LIMIT_EXCEEDED') {
          this.errorMsg.set(
            'Has superado el límite de peticiones de Gemini (Free Tier). Intenta de nuevo en unos segundos.'
          );
        } else {
          this.errorMsg.set(
            err.status === 0
              ? 'No se pudo conectar al servidor. ¿Está corriendo el backend?'
              : 'Error al analizar. Intenta de nuevo.'
          );
        }
        this.isLoading.set(false);
      }
    });
  }

  async confirmAll() {
    if (this.results().length === 0) return;
    this.pendingFoods = [...this.results()];
    this.mealPickerOpen.set(true);
  }

  async addAllToMeal(mealName: string) {
    const foods = this.pendingFoods.length > 0 ? this.pendingFoods : this.results();

    foods.forEach(food => {
      this.nutritionState.addFoodToMeal(mealName, {
        id: Date.now().toString() + Math.random().toString(36).substr(2, 4),
        name: food.name,
        emoji: food.emoji,
        portion: food.portion,
        calories: food.calories,
        protein: food.protein,
        carbs: food.carbs,
        fat: food.fat,
      });
    });

    await this.showSuccessToast(foods.length, mealName);
    this.pendingFoods = [];
    this.mealPickerOpen.set(false);
    this.clearResults();
    this.userText = '';
    this.isOpen.set(false);
  }

  cancelMealPicker() {
    this.pendingFoods = [];
    this.mealPickerOpen.set(false);
  }

  async showSuccessToast(count: number, mealName: string) {
    const toast = await this.toastCtrl.create({
      message: `${count} alimento${count > 1 ? 's' : ''} agregado${count > 1 ? 's' : ''} a ${mealName}`,
      duration: 2500,
      position: 'top',
      color: 'dark',
    });
    await toast.present();
  }

  clearResults() {
    this.results.set([]);
    this.errorMsg.set('');
    this.isMissingApiKey.set(false);
  }
}
