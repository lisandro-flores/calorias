import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { PwaService } from '../services/pwa.service';

@Component({
  selector: 'app-pwa-install',
  standalone: true,
  imports: [CommonModule, IonicModule],
  template: `
    <div class="pwa-banner" *ngIf="pwaService.canInstall()">
      <div class="pwa-content">
        <ion-icon name="download-outline" class="pwa-icon"></ion-icon>
        <div class="pwa-text">
          <strong>Instalar App</strong>
          <span>Añade FuelSmart a tu pantalla de inicio para acceso rápido y modo sin conexión.</span>
        </div>
      </div>
      <div class="pwa-actions">
        <button class="btn-dismiss" (click)="dismiss()">Ahora no</button>
        <button class="btn-install" (click)="install()">Instalar</button>
      </div>
    </div>
  `,
  styles: [`
    .pwa-banner {
      position: fixed;
      bottom: 70px; /* Sobre la barra de tabs */
      left: 10px;
      right: 10px;
      background: var(--app-surface);
      border: 1px solid var(--app-accent);
      border-radius: 12px;
      padding: 16px;
      z-index: 1000;
      box-shadow: 0 8px 24px rgba(0,0,0,0.5);
      animation: slideUp 0.5s cubic-bezier(0.16, 1, 0.3, 1);
    }
    .pwa-content {
      display: flex;
      align-items: flex-start;
      gap: 12px;
      margin-bottom: 12px;
    }
    .pwa-icon {
      font-size: 24px;
      color: var(--app-accent);
      margin-top: 2px;
    }
    .pwa-text {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }
    .pwa-text strong {
      font-size: 15px;
      color: var(--app-text);
    }
    .pwa-text span {
      font-size: 13px;
      color: var(--app-muted);
      line-height: 1.4;
    }
    .pwa-actions {
      display: flex;
      justify-content: flex-end;
      gap: 12px;
    }
    button {
      background: none;
      border: none;
      font-size: 14px;
      font-weight: 600;
      padding: 8px 16px;
      border-radius: 6px;
      cursor: pointer;
    }
    .btn-dismiss {
      color: var(--app-muted);
    }
    .btn-install {
      background: var(--app-accent);
      color: var(--app-bg);
    }
    @keyframes slideUp {
      from { transform: translateY(100px); opacity: 0; }
      to { transform: translateY(0); opacity: 1; }
    }
  `]
})
export class PwaInstallComponent {
  pwaService = inject(PwaService);

  install() {
    this.pwaService.promptInstall();
  }

  dismiss() {
    this.pwaService.canInstall.set(false);
  }
}
