import { Component, inject, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NetworkStatusService } from '../services/network-status.service';

@Component({
  selector: 'app-online-indicator',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div id="online-indicator" [class.offline]="!isOnline()" [title]="isOnline() ? 'Conexión OK' : 'Sin acceso a Internet'">
      <span class="dot"></span>
      <span id="online-text">{{ isOnline() ? 'En línea' : 'Sin conexión' }}</span>
    </div>
  `,
  styles: [`
    #online-indicator {
      position: absolute;
      top: 12px;
      right: 18px;
      display: flex;
      align-items: center;
      gap: 8px;
      background: rgba(0,0,0,0.65);
      padding: 6px 12px;
      border-radius: 18px;
      border: 1px solid var(--app-border, #333);
      color: var(--app-text, #e0e0e0);
      font-size: 13px;
      z-index: 1100;
      box-shadow: 0 2px 6px rgba(0,0,0,0.5);
      backdrop-filter: blur(4px);
      transition: all 0.3s ease;
    }
    #online-indicator .dot {
      width: 10px;
      height: 10px;
      border-radius: 50%;
      background: #28a745;
      box-shadow: 0 0 6px rgba(40,167,69,0.6);
      transition: all 0.3s ease;
    }
    #online-indicator.offline {
      border-color: rgba(220,53,69,0.4);
    }
    #online-indicator.offline .dot {
      background: #dc3545;
      box-shadow: 0 0 6px rgba(220,53,69,0.6);
    }
  `]
})
export class OnlineIndicatorComponent {
  private networkStatus = inject(NetworkStatusService);
  isOnline = this.networkStatus.isOnline;
}
