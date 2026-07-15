import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule, ModalController } from '@ionic/angular';
import { AiInputComponent } from './ai-input.component';
import { FoodSearchComponent } from './food-search.component';
import { RecentFoodsComponent } from './recent-foods.component';
import { addIcons } from 'ionicons';
import { closeOutline, flashOutline, searchOutline, timeOutline } from 'ionicons/icons';

@Component({
  selector: 'app-add-food-modal',
  standalone: true,
  imports: [CommonModule, IonicModule, FormsModule, AiInputComponent, FoodSearchComponent, RecentFoodsComponent],
  template: `
    <ion-header class="ion-no-border">
      <ion-toolbar>
        <ion-title>Registrar Comida</ion-title>
        <ion-buttons slot="end">
          <ion-button (click)="close()">
            <ion-icon name="close-outline" slot="icon-only"></ion-icon>
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
      <ion-toolbar>
        <ion-segment [(ngModel)]="activeSegment">
          <ion-segment-button value="ai">
            <ion-icon name="flash-outline"></ion-icon>
            <ion-label>IA</ion-label>
          </ion-segment-button>
          <ion-segment-button value="search">
            <ion-icon name="search-outline"></ion-icon>
            <ion-label>Buscar</ion-label>
          </ion-segment-button>
          <ion-segment-button value="recent">
            <ion-icon name="time-outline"></ion-icon>
            <ion-label>Recientes</ion-label>
          </ion-segment-button>
        </ion-segment>
      </ion-toolbar>
    </ion-header>

    <ion-content class="ion-padding">
      <div [ngSwitch]="activeSegment" class="segment-content">
        <div *ngSwitchCase="'ai'" class="fade-in">
          <p class="helper-text">Escribe lo que comiste y la IA calculará las calorías.</p>
          <app-ai-input (foodAdded)="close()"></app-ai-input>
        </div>
        
        <div *ngSwitchCase="'search'" class="fade-in">
          <app-food-search></app-food-search>
        </div>

        <div *ngSwitchCase="'recent'" class="fade-in">
          <app-recent-foods></app-recent-foods>
        </div>
      </div>
    </ion-content>
  `,
  styles: [`
    ion-toolbar {
      --background: var(--app-background);
    }
    ion-segment {
      margin: 8px 16px;
      width: calc(100% - 32px);
    }
    .helper-text {
      font-size: 14px;
      color: var(--app-muted);
      margin-bottom: 16px;
      text-align: center;
    }
    .segment-content {
      padding-top: 12px;
    }
    .fade-in {
      animation: fadeIn 0.3s ease-out;
    }
    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(4px); }
      to { opacity: 1; transform: translateY(0); }
    }
  `]
})
export class AddFoodModalComponent {
  private modalCtrl = inject(ModalController);
  activeSegment = 'ai';

  constructor() {
    addIcons({
      'close-outline': closeOutline,
      'flash-outline': flashOutline,
      'search-outline': searchOutline,
      'time-outline': timeOutline
    });
  }

  close() {
    this.modalCtrl.dismiss();
  }
}
