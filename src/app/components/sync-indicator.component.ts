import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { NutritionStateService } from '../services/nutrition-state.service';
import { OutboxService } from '../services/outbox.service';

@Component({
  selector: 'app-sync-indicator',
  standalone: true,
  imports: [CommonModule, IonicModule],
  template: `
    <div class="sync-indicator">
      <ion-badge *ngIf="pending>0" color="warning">{{pending}}</ion-badge>
      <ion-icon [name]="ns.syncStatusIcon()"></ion-icon>
      <span class="label">{{ ns.syncStatusLabel() }}</span>
    </div>
  `,
  styles: [`.sync-indicator{display:flex;align-items:center;gap:8px}.label{font-size:12px}`]
})
export class SyncIndicatorComponent {
  pending = 0;

  constructor(public ns: NutritionStateService, outbox: OutboxService) {
    outbox.pending$.subscribe(n => this.pending = n);
  }
}
