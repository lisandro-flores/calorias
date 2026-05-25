import { Component, inject, signal, effect, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { debounceTime, distinctUntilChanged, switchMap, catchError, takeUntil } from 'rxjs/operators';
import { Subject, of } from 'rxjs';
import { OpenFoodFactsService, OffProduct } from '../services/open-food-facts.service';
import { NutritionStateService } from '../services/nutrition-state.service';

@Component({
  selector: 'app-food-search',
  standalone: true,
  imports: [CommonModule, IonicModule, ReactiveFormsModule],
  template: `
    <ion-card color="dark" class="search-card">
      <ion-card-header>
        <ion-card-title>Buscar Alimento</ion-card-title>
      </ion-card-header>
      
      <ion-card-content>
        <ion-searchbar 
          color="dark"
          placeholder="Ej. Galletas Marinela, Atún..." 
          [formControl]="searchControl"
          debounce="0" 
          animated="true"
          (ionClear)="clearState()">
        </ion-searchbar>
        
        <!-- Loading Indicator -->
        <ion-progress-bar type="indeterminate" color="primary" *ngIf="isLoading()"></ion-progress-bar>
        
        <!-- Search Results -->
        <ion-list lines="none" color="dark" *ngIf="searchResults().length > 0" class="results-list">
          <ion-item *ngFor="let product of searchResults()" color="dark" button (click)="addProduct(product)">
            <ion-thumbnail slot="start" *ngIf="product.image_front_url">
              <img [src]="product.image_front_url" alt="product image" />
            </ion-thumbnail>
            
            <ion-label>
              <h2>{{ product.product_name || 'Desconocido' }}</h2>
              <p>Por 100g: 
                {{ product.nutriments['energy-kcal_100g'] | number:'1.0-0' }} kcal |
                P: {{ product.nutriments['proteins_100g'] | number:'1.0-1' }}g
              </p>
            </ion-label>
            <ion-icon name="add-circle" color="primary" slot="end"></ion-icon>
          </ion-item>
        </ion-list>

        <!-- Empty State / No Results -->
        <div class="empty-state" *ngIf="!isLoading() && searchControl.value && searchResults().length === 0">
          No se encontraron coincidencias libres.
        </div>
      </ion-card-content>
    </ion-card>
  `,
  styles: [`
    .search-card { margin-bottom: 20px; }
    ion-searchbar { padding: 0; padding-bottom: 10px; }
    .results-list { max-height: 250px; overflow-y: auto; background: transparent; }
    ion-thumbnail { border-radius: 4px; overflow: hidden; }
    .empty-state { text-align: center; color: var(--app-muted); padding: 15px; font-style: italic; }
  `]
})
export class FoodSearchComponent implements OnDestroy {
  private offService = inject(OpenFoodFactsService);
  private nutritionState = inject(NutritionStateService);
  private destroy$ = new Subject<void>();

  searchControl = new FormControl('');
  searchResults = signal<OffProduct[]>([]);
  isLoading = signal<boolean>(false);

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

  addProduct(product: OffProduct) {
    // Por simplicidad, agregamos 100g al 'Desayuno'. Idealmente abriría un ActionSheet para elegir la comida y porción
    const kcal = product.nutriments['energy-kcal_100g'] || 0;
    
    // Si no tiene calorías (datos faltantes), evitamos agregarlo
    if(kcal === 0) return;

    this.nutritionState.meals.update(meals => {
      return meals.map(meal => {
        if (meal.name === 'Desayuno') { 
          return {
            ...meal,
            foods: [...meal.foods, {
              id: product.code,
              name: product.product_name,
              emoji: '📦', 
              portion: '100 g',
              calories: Math.round(kcal),
              protein: Math.round(product.nutriments['proteins_100g'] || 0),
              carbs: Math.round(product.nutriments['carbohydrates_100g'] || 0),
              fats: Math.round(product.nutriments['fat_100g'] || 0)
            }]
          };
        }
        return meal;
      });
    });

    this.searchControl.setValue('', { emitEvent: false });
    this.clearState();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }
}