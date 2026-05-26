import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { NutritionStateService } from '../services/nutrition-state.service';

@Component({
  selector: 'app-water-tracker',
  standalone: true,
  imports: [CommonModule, IonicModule],
  template: `
    <div class="water-section">
      <div class="water-row">
        <div class="water-left">
          <ion-icon name="water" class="water-icon"></ion-icon>
          <div class="water-text">
            <span class="water-count">{{ state.waterGlasses() }} / {{ state.goals().waterGoal }}</span>
            <span class="water-label">vasos de agua</span>
          </div>
        </div>
        <div class="water-controls">
          <button class="water-btn minus" (click)="state.removeWater()" [disabled]="state.waterGlasses() === 0">
            <ion-icon name="remove"></ion-icon>
          </button>
          <button class="water-btn plus" (click)="state.addWater()">
            <ion-icon name="add"></ion-icon>
          </button>
        </div>
      </div>
      <!-- Water progress dots -->
      <div class="water-dots">
        <div
          class="dot"
          *ngFor="let i of waterDots"
          [class.filled]="i < state.waterGlasses()">
        </div>
      </div>
    </div>
  `,
  styles: [`
    .water-section {
      background: var(--app-surface);
      border: 1px solid var(--app-border);
      border-radius: 14px;
      padding: 14px 16px;
      margin-bottom: 12px;
    }
    .water-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .water-left {
      display: flex;
      align-items: center;
      gap: 12px;
    }
    .water-icon {
      font-size: 24px;
      color: #38bdf8;
    }
    .water-text {
      display: flex;
      flex-direction: column;
    }
    .water-count {
      font-size: 15px;
      font-weight: 600;
      color: var(--app-text);
    }
    .water-label {
      font-size: 11px;
      color: var(--app-muted);
    }
    .water-controls {
      display: flex;
      gap: 8px;
    }
    .water-btn {
      width: 34px;
      height: 34px;
      border-radius: 10px;
      border: none;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      font-size: 18px;
      transition: all 0.15s;
    }
    .water-btn.minus {
      background: var(--app-surface-2);
      color: var(--app-muted);
      border: 1px solid var(--app-border);
    }
    .water-btn.minus:disabled {
      opacity: 0.3;
    }
    .water-btn.plus {
      background: #38bdf8;
      color: #111;
    }
    .water-btn:active {
      transform: scale(0.92);
    }
    .water-dots {
      display: flex;
      gap: 6px;
      margin-top: 10px;
    }
    .dot {
      flex: 1;
      height: 4px;
      border-radius: 99px;
      background: rgba(255,255,255,0.06);
      transition: background 0.3s;
    }
    .dot.filled {
      background: #38bdf8;
    }
  `]
})
export class WaterTrackerComponent {
  state = inject(NutritionStateService);

  get waterDots(): number[] {
    return Array.from({ length: this.state.goals().waterGoal }, (_, i) => i);
  }
}