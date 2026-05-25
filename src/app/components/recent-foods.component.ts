import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';

interface RecentFood {
  name: string;
  emoji: string;
  defaultPortion: string;
  calories: number;
}

@Component({
  selector: 'app-recent-foods',
  standalone: true,
  imports: [CommonModule, IonicModule],
  template: `
    <ion-card color="dark">
      <ion-card-header>
        <ion-card-title>Ingresados Recientemente</ion-card-title>
      </ion-card-header>
      
      <ion-card-content>
        <ion-list lines="none" color="dark">
          <ion-item *ngFor="let food of recentFoods" color="dark" button detail="false">
            <span slot="start" class="recent-emoji">{{ food.emoji }}</span>
            <ion-label>
              <h2>{{ food.name }}</h2>
              <p>{{ food.defaultPortion }}</p>
            </ion-label>
            <div slot="end" class="recent-calories">+ {{ food.calories }} kcal</div>
          </ion-item>
        </ion-list>
      </ion-card-content>
    </ion-card>
  `,
  styles: [`
    .recent-emoji { font-size: 20px; margin-right: 10px; }
    .recent-calories { font-size: 13px; color: var(--ion-color-medium); }
  `]
})
export class RecentFoodsComponent {
  // Diccionario local estático/rápido para evitar llamadas HTTP
  readonly recentFoods: RecentFood[] = [
    { name: 'Tortilla de Maíz', emoji: '🌮', defaultPortion: '1 pza (30g)', calories: 52 },
    { name: 'Leche Entera', emoji: '🥛', defaultPortion: '1 taza (240ml)', calories: 150 },
    { name: 'Nopal Cocido', emoji: '🌵', defaultPortion: '1 taza (150g)', calories: 22 },
    { name: 'Pechuga de Pollo', emoji: '🍗', defaultPortion: '100g (asada)', calories: 165 },
  ];
}