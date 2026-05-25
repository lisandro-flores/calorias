import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { NutritionStateService } from '../services/nutrition-state.service';

@Component({
  selector: 'app-water-tracker',
  standalone: true,
  imports: [CommonModule, IonicModule],
  template: `
    <ion-card color="dark" class="tracker-card">
      <ion-card-content class="water-content">
        <div class="water-info">
          <ion-icon name="water" color="tertiary" class="water-icon"></ion-icon>
          <div class="water-text">
            <h2>Agua</h2>
            <p>{{ state.waterGlasses() }} vasos (250ml)</p>
          </div>
        </div>
        
        <div class="water-actions">
          <ion-button fill="outline" color="medium" shape="round" class="action-btn" (click)="state.removeWater()">
            <ion-icon name="remove"></ion-icon>
          </ion-button>
          <span class="glasses-count">{{ state.waterGlasses() }}</span>
          <ion-button fill="solid" color="tertiary" shape="round" class="action-btn" (click)="state.addWater()">
            <ion-icon name="add"></ion-icon>
          </ion-button>
        </div>
      </ion-card-content>
    </ion-card>
  `,
  styles: [`
    .tracker-card { margin-top: 10px; }
    .water-content { display: flex; justify-content: space-between; align-items: center; padding: 10px 15px; }
    .water-info { display: flex; align-items: center; }
    .water-icon { font-size: 32px; margin-right: 15px; }
    .water-text h2 { margin: 0; font-size: 16px; font-weight: bold; }
    .water-text p { margin: 0; font-size: 13px; color: #888; }
    
    .water-actions { display: flex; align-items: center; gap: 10px; }
    .glasses-count { font-size: 18px; font-weight: bold; min-width: 20px; text-align: center; }
    .action-btn { --padding-start: 10px; --padding-end: 10px; height: 35px; }
  `]
})
export class WaterTrackerComponent {
  state = inject(NutritionStateService);
}