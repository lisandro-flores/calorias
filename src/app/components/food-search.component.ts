import { Component, inject, signal, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule, ActionSheetController, AlertController, ToastController } from '@ionic/angular';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { debounceTime, distinctUntilChanged, switchMap, catchError, takeUntil } from 'rxjs/operators';
import { Subject, of } from 'rxjs';
import { OpenFoodFactsService, OffProduct } from '../services/open-food-facts.service';
import { NutritionStateService } from '../services/nutrition-state.service';

@Component({
  selector: 'app-food-search',
  standalone: true,
  imports: [CommonModule, IonicModule, ReactiveFormsModule, FormsModule],
  template: `
    <div class="search-wrapper">
      <ion-searchbar
        color="dark"
        placeholder="Buscar alimento..."
        [formControl]="searchControl"
        debounce="0"
        animated="true"
        (ionClear)="clearState()">
      </ion-searchbar>

      <!-- Loading -->
      <ion-progress-bar type="indeterminate" color="primary" *ngIf="isLoading()"></ion-progress-bar>

      <!-- Results -->
      <div class="results-container" *ngIf="searchResults().length > 0">
        <div class="result-item" *ngFor="let product of searchResults()" (click)="onProductTap(product)">
          <img *ngIf="product.image_front_url" [src]="product.image_front_url" class="result-thumb" alt="" />
          <div class="result-placeholder" *ngIf="!product.image_front_url">📦</div>
          <div class="result-info">
            <span class="result-name">{{ product.product_name || 'Desconocido' }}</span>
            <span class="result-macros">
              <strong>{{ product.nutriments['energy-kcal_100g'] | number:'1.0-0' }} kcal</strong>/100g ·
              P: {{ product.nutriments['proteins_100g'] | number:'1.0-1' }}g
              <span *ngIf="product.nutriments['fat_100g']"> · G: {{ product.nutriments['fat_100g'] | number:'1.0-1' }}g</span>
            </span>
          </div>
          <ion-icon name="add-circle" color="primary" class="add-icon"></ion-icon>
        </div>
      </div>

      <!-- No results -->
      <div class="no-results" *ngIf="!isLoading() && searchControl.value && searchControl.value.length >= 3 && searchResults().length === 0">
        Sin resultados para "{{ searchControl.value }}"
      </div>

      <!-- ── Portion Modal Overlay ── -->
      <div class="portion-overlay" *ngIf="selectedProduct()" (click)="cancelPortion()">
        <div class="portion-card" (click)="$event.stopPropagation()">

          <!-- Product preview -->
          <div class="portion-header">
            <div class="portion-thumb" *ngIf="selectedProduct()!.image_front_url">
              <img [src]="selectedProduct()!.image_front_url" alt="" />
            </div>
            <div class="portion-thumb emoji" *ngIf="!selectedProduct()!.image_front_url">📦</div>
            <div class="portion-title-area">
              <span class="portion-product-name">{{ selectedProduct()!.product_name || 'Alimento' }}</span>
              <span class="portion-base-info">Valores por 100g</span>
            </div>
          </div>

          <!-- Macro badges per 100g -->
          <div class="macro-badges">
            <div class="badge">
              <span class="badge-val">{{ selectedProduct()!.nutriments['energy-kcal_100g'] | number:'1.0-0' }}</span>
              <span class="badge-label">kcal</span>
            </div>
            <div class="badge">
              <span class="badge-val">{{ selectedProduct()!.nutriments['proteins_100g'] | number:'1.0-1' }}</span>
              <span class="badge-label">proteína</span>
            </div>
            <div class="badge">
              <span class="badge-val">{{ selectedProduct()!.nutriments['carbohydrates_100g'] | number:'1.0-1' }}</span>
              <span class="badge-label">carbos</span>
            </div>
            <div class="badge">
              <span class="badge-val">{{ selectedProduct()!.nutriments['fat_100g'] | number:'1.0-1' }}</span>
              <span class="badge-label">grasa</span>
            </div>
          </div>

          <!-- Gram input -->
          <div class="gram-section">
            <label class="gram-label">¿Cuántos gramos comiste?</label>
            <div class="gram-input-row">
              <button class="gram-btn" (click)="adjustGrams(-25)">−25</button>
              <div class="gram-input-wrap">
                <input class="gram-input" type="number" [(ngModel)]="portionGrams" min="1" max="5000" />
                <span class="gram-unit">g</span>
              </div>
              <button class="gram-btn" (click)="adjustGrams(25)">+25</button>
            </div>

            <!-- Quick presets -->
            <div class="preset-row">
              <button class="preset-chip" *ngFor="let p of presets" (click)="portionGrams = p">{{ p }}g</button>
            </div>
          </div>

          <!-- Live calculated result -->
          <div class="calc-result" *ngIf="portionGrams > 0">
            <span class="calc-main">
              {{ calcKcal() | number:'1.0-0' }} kcal
            </span>
            <span class="calc-detail">
              P: {{ calcProtein() | number:'1.0-1' }}g · C: {{ calcCarbs() | number:'1.0-1' }}g · G: {{ calcFat() | number:'1.0-1' }}g
            </span>
          </div>

          <!-- Actions -->
          <div class="portion-actions">
            <button class="cancel-btn" (click)="cancelPortion()">Cancelar</button>
            <button class="add-btn" (click)="confirmPortion()" [disabled]="portionGrams <= 0">
              <ion-icon name="add-circle"></ion-icon>
              Agregar
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .search-wrapper { margin-bottom: 16px; position: relative; }
    ion-searchbar {
      padding: 0;
      --background: var(--app-surface);
      --border-radius: 12px;
      --box-shadow: none;
    }
    .results-container {
      background: var(--app-surface);
      border: 1px solid var(--app-border);
      border-radius: 12px;
      max-height: 260px;
      overflow-y: auto;
      margin-top: 8px;
    }
    .result-item {
      display: flex; align-items: center; gap: 12px;
      padding: 10px 14px; cursor: pointer;
      transition: background 0.15s;
      border-bottom: 1px solid var(--app-border);
    }
    .result-item:last-child { border-bottom: none; }
    .result-item:active { background: rgba(255,255,255,0.04); }
    .result-thumb { width: 36px; height: 36px; border-radius: 8px; object-fit: cover; flex-shrink: 0; }
    .result-placeholder { width: 36px; height: 36px; display: flex; align-items: center; justify-content: center; font-size: 20px; flex-shrink: 0; }
    .result-info { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 2px; }
    .result-name { font-size: 13px; font-weight: 500; color: var(--app-text); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .result-macros { font-size: 11px; color: var(--app-muted); }
    .result-macros strong { color: var(--app-accent); }
    .add-icon { font-size: 22px; flex-shrink: 0; }
    .no-results { text-align: center; color: var(--app-muted); font-size: 13px; padding: 16px; font-style: italic; }

    /* ── Portion Modal ── */
    .portion-overlay {
      position: fixed; inset: 0; z-index: 9999;
      background: rgba(0,0,0,0.65);
      display: flex; align-items: flex-end; justify-content: center;
      animation: overlayIn 0.2s ease;
    }
    @keyframes overlayIn { from { opacity: 0; } to { opacity: 1; } }

    .portion-card {
      background: var(--app-surface);
      border-radius: 24px 24px 0 0;
      padding: 24px 20px 32px;
      width: 100%; max-width: 500px;
      animation: cardIn 0.25s ease;
    }
    @keyframes cardIn { from { transform: translateY(40px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }

    .portion-header {
      display: flex; align-items: center; gap: 12px; margin-bottom: 16px;
    }
    .portion-thumb { width: 48px; height: 48px; border-radius: 12px; overflow: hidden; flex-shrink: 0; }
    .portion-thumb img { width: 100%; height: 100%; object-fit: cover; }
    .portion-thumb.emoji { display: flex; align-items: center; justify-content: center; font-size: 26px; background: var(--app-bg); }
    .portion-title-area { display: flex; flex-direction: column; gap: 3px; }
    .portion-product-name { font-size: 15px; font-weight: 600; color: var(--app-text); }
    .portion-base-info { font-size: 11px; color: var(--app-muted); }

    .macro-badges {
      display: flex; gap: 8px; margin-bottom: 20px;
    }
    .badge {
      flex: 1; background: var(--app-bg);
      border: 1px solid var(--app-border); border-radius: 10px;
      padding: 8px 4px; text-align: center;
      display: flex; flex-direction: column; gap: 3px;
    }
    .badge-val { font-size: 14px; font-weight: 700; color: var(--app-text); }
    .badge-label { font-size: 9px; color: var(--app-muted); text-transform: uppercase; }

    .gram-section { margin-bottom: 16px; }
    .gram-label { display: block; font-size: 13px; color: var(--app-muted); margin-bottom: 10px; }
    .gram-input-row { display: flex; align-items: center; gap: 10px; margin-bottom: 10px; }
    .gram-btn {
      padding: 10px 16px; background: var(--app-bg);
      border: 1px solid var(--app-border); border-radius: 10px;
      color: var(--app-text); font-size: 13px; font-weight: 600;
      cursor: pointer; font-family: inherit; transition: background 0.15s; flex-shrink: 0;
    }
    .gram-btn:active { background: var(--app-border); }
    .gram-input-wrap { flex: 1; display: flex; align-items: center; gap: 6px; }
    .gram-input {
      flex: 1; background: var(--app-bg); border: 1px solid var(--app-accent);
      border-radius: 10px; color: var(--app-text); font-size: 22px;
      font-weight: 700; font-family: inherit; padding: 8px 12px;
      text-align: center; outline: none;
    }
    .gram-unit { font-size: 14px; color: var(--app-muted); }
    .preset-row { display: flex; gap: 6px; flex-wrap: wrap; }
    .preset-chip {
      background: none; border: 1px solid var(--app-border); border-radius: 20px;
      padding: 4px 12px; font-size: 12px; color: var(--app-muted);
      cursor: pointer; font-family: inherit; transition: all 0.15s;
    }
    .preset-chip:active { background: var(--app-accent); color: #111; border-color: var(--app-accent); }

    .calc-result {
      background: var(--app-bg); border: 1px solid var(--app-border);
      border-radius: 12px; padding: 12px 16px; margin-bottom: 16px;
      display: flex; flex-direction: column; gap: 4px; align-items: center;
    }
    .calc-main { font-size: 24px; font-weight: 800; color: var(--app-accent); }
    .calc-detail { font-size: 12px; color: var(--app-muted); }

    .portion-actions { display: flex; gap: 10px; }
    .cancel-btn {
      flex: 0 0 auto; padding: 12px 20px; background: none;
      border: 1px solid var(--app-border); border-radius: 12px;
      color: var(--app-muted); font-size: 14px; cursor: pointer; font-family: inherit;
    }
    .add-btn {
      flex: 1; display: flex; align-items: center; justify-content: center; gap: 8px;
      padding: 12px; background: var(--app-accent); color: #111;
      border: none; border-radius: 12px; font-size: 15px;
      font-weight: 700; cursor: pointer; font-family: inherit;
      transition: opacity 0.2s;
    }
    .add-btn:disabled { opacity: 0.4; cursor: not-allowed; }
    .add-btn ion-icon { font-size: 18px; }
  `]
})
export class FoodSearchComponent implements OnDestroy {
  private offService = inject(OpenFoodFactsService);
  private nutritionState = inject(NutritionStateService);
  private actionSheetCtrl = inject(ActionSheetController);
  private toastCtrl = inject(ToastController);
  private destroy$ = new Subject<void>();

  searchControl = new FormControl('');
  searchResults = signal<OffProduct[]>([]);
  isLoading = signal<boolean>(false);

  // Portion selection state
  selectedProduct = signal<OffProduct | null>(null);
  portionGrams = 100;
  presets = [50, 100, 150, 200, 250, 300];

  constructor() {
    this.setupSearch();
  }

  setupSearch() {
    this.searchControl.valueChanges.pipe(
      takeUntil(this.destroy$),
      debounceTime(400),
      distinctUntilChanged(),
      switchMap(query => {
        if (!query || query.trim().length < 3) {
          this.clearState();
          return of([]);
        }
        this.isLoading.set(true);
        return this.offService.searchProducts(query).pipe(
          catchError(() => of([]))
        );
      })
    ).subscribe(results => {
      this.searchResults.set(results);
      this.isLoading.set(false);
    });
  }

  clearState() {
    this.searchResults.set([]);
    this.isLoading.set(false);
  }

  /** Step 1: User taps a product → show portion picker */
  onProductTap(product: OffProduct) {
    const kcal = product.nutriments['energy-kcal_100g'] || 0;
    if (kcal === 0) return;
    this.portionGrams = 100;
    this.selectedProduct.set(product);
  }

  adjustGrams(delta: number) {
    this.portionGrams = Math.max(1, this.portionGrams + delta);
  }

  // Live calculated values based on portionGrams
  calcKcal(): number {
    const p = this.selectedProduct();
    if (!p) return 0;
    return (p.nutriments['energy-kcal_100g'] || 0) * this.portionGrams / 100;
  }
  calcProtein(): number {
    const p = this.selectedProduct();
    if (!p) return 0;
    return (p.nutriments['proteins_100g'] || 0) * this.portionGrams / 100;
  }
  calcCarbs(): number {
    const p = this.selectedProduct();
    if (!p) return 0;
    return (p.nutriments['carbohydrates_100g'] || 0) * this.portionGrams / 100;
  }
  calcFat(): number {
    const p = this.selectedProduct();
    if (!p) return 0;
    return (p.nutriments['fat_100g'] || 0) * this.portionGrams / 100;
  }

  cancelPortion() {
    this.selectedProduct.set(null);
  }

  /** Step 2: User confirms grams → pick meal */
  async confirmPortion() {
    const product = this.selectedProduct();
    if (!product || this.portionGrams <= 0) return;

    const meals = this.nutritionState.meals();
    const buttons = meals.map(meal => ({
      text: `${meal.icon} ${meal.name}`,
      handler: () => {
        this.nutritionState.addFoodToMeal(meal.name, {
          id: product.code + '_' + Date.now(),
          name: product.product_name || 'Alimento',
          emoji: '📦',
          portion: `${this.portionGrams} g`,
          calories: Math.round(this.calcKcal()),
          protein: Math.round(this.calcProtein()),
          carbs: Math.round(this.calcCarbs()),
          fat: Math.round(this.calcFat()),
        });
        this.showToast(product.product_name || 'Alimento', this.portionGrams);
        this.selectedProduct.set(null);
        this.searchControl.setValue('', { emitEvent: false });
        this.clearState();
      }
    }));
    buttons.push({ text: 'Cancelar', handler: () => {} } as any);

    const sheet = await this.actionSheetCtrl.create({
      header: '¿A qué comida agregar?',
      buttons,
    });
    await sheet.present();
  }

  async showToast(name: string, grams: number) {
    const toast = await this.toastCtrl.create({
      message: `✅ ${name} (${grams}g) agregado`,
      duration: 2000,
      position: 'top',
      color: 'dark',
    });
    toast.present();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }
}