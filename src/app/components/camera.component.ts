import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';

@Component({
  selector: 'app-camera',
  standalone: true,
  imports: [CommonModule, IonicModule],
  template: `
    <ion-content class="ion-padding" [scrollY]="false">
      <div class="coming-soon-container">
        <ion-icon name="camera-outline" class="huge-icon"></ion-icon>
        <h2>Visión Artificial</h2>
        <p>Próximamente podrás tomarle foto a tu comida y la IA registrará automáticamente tus macros y calorías.</p>
        <div class="badge">Próximamente</div>
      </div>
    </ion-content>
  `,
  styles: [`
    .coming-soon-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      height: 100%;
      text-align: center;
      padding: 20px;
    }
    .huge-icon {
      font-size: 80px;
      color: var(--app-accent);
      margin-bottom: 20px;
      opacity: 0.8;
    }
    h2 {
      font-size: 24px;
      font-weight: 700;
      margin-bottom: 10px;
    }
    p {
      color: var(--app-muted);
      line-height: 1.5;
      margin-bottom: 30px;
      max-width: 300px;
    }
    .badge {
      background: var(--app-surface);
      border: 1px solid var(--app-accent);
      color: var(--app-accent);
      padding: 8px 16px;
      border-radius: 20px;
      font-weight: 600;
      font-size: 14px;
      text-transform: uppercase;
      letter-spacing: 1px;
    }
  `]
})
export class CameraComponent {}
