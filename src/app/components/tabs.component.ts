import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonTabs, IonTabBar, IonTabButton, IonIcon, IonLabel } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  homeOutline, barChartOutline, personOutline,
  remove, add, water, logOutOutline, addCircle,
  fitnessOutline, closeCircle, chevronDown, chevronUp,
  chevronForward, copyOutline, searchOutline,
  cameraOutline, bulbOutline, partlySunnyOutline, 
  sunnyOutline, moonOutline, fastFoodOutline, restaurantOutline,
  sparkles, alertCircle, checkmarkCircle, trendingUp, trendingDown, flame, flag
} from 'ionicons/icons';

@Component({
  selector: 'app-tabs',
  standalone: true,
  imports: [CommonModule, IonTabs, IonTabBar, IonTabButton, IonIcon, IonLabel],
  template: `
    <ion-tabs>
      <ion-tab-bar slot="bottom">

        <ion-tab-button tab="dashboard" href="/tabs/dashboard">
          <ion-icon name="home-outline"></ion-icon>
          <ion-label>Hoy</ion-label>
        </ion-tab-button>

        <ion-tab-button tab="progress" href="/tabs/progress">
          <ion-icon name="bar-chart-outline"></ion-icon>
          <ion-label>Progreso</ion-label>
        </ion-tab-button>

        <ion-tab-button tab="camera" href="/tabs/camera">
          <ion-icon name="camera-outline"></ion-icon>
          <ion-label>Captura</ion-label>
        </ion-tab-button>

        <ion-tab-button tab="coach" href="/tabs/coach">
          <ion-icon name="bulb-outline"></ion-icon>
          <ion-label>Coach</ion-label>
        </ion-tab-button>

        <ion-tab-button tab="profile" href="/tabs/profile">
          <ion-icon name="person-outline"></ion-icon>
          <ion-label>Perfil</ion-label>
        </ion-tab-button>

      </ion-tab-bar>
    </ion-tabs>
  `,
  styles: [`
    ion-tab-bar {
      --background: var(--app-surface);
      --border: 1px solid var(--app-border);
      border-top: 1px solid var(--app-border);
      padding-bottom: env(safe-area-inset-bottom, 0px);
    }
    ion-tab-button {
      --color: var(--app-muted);
      --color-selected: var(--app-accent);
    }
  `]
})
export class TabsComponent {
  constructor() {
    // Register all icons used across the app
    addIcons({
      'home-outline': homeOutline,
      'bar-chart-outline': barChartOutline,
      'person-outline': personOutline,
      'remove': remove,
      'add': add,
      'water': water,
      'log-out-outline': logOutOutline,
      'add-circle': addCircle,
      'fitness-outline': fitnessOutline,
      'close-circle': closeCircle,
      'chevron-down': chevronDown,
      'chevron-up': chevronUp,
      'chevron-forward': chevronForward,
      'copy-outline': copyOutline,
      'search-outline': searchOutline,
      'camera-outline': cameraOutline,
      'bulb-outline': bulbOutline,
      'partly-sunny-outline': partlySunnyOutline,
      'sunny-outline': sunnyOutline,
      'moon-outline': moonOutline,
      'fast-food-outline': fastFoodOutline,
      'restaurant-outline': restaurantOutline,
      'sparkles': sparkles,
      'alert-circle': alertCircle,
      'checkmark-circle': checkmarkCircle,
      'trending-up': trendingUp,
      'trending-down': trendingDown,
      'flame': flame,
      'flag': flag,
    });
  }
}