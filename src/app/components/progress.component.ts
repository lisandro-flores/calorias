import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';

@Component({
  selector: 'app-progress',
  standalone: true,
  imports: [CommonModule, IonicModule],
  template: `
    <ion-header class="ion-no-border">
      <ion-toolbar color="dark">
        <ion-title>Progreso</ion-title>
      </ion-toolbar>
    </ion-header>
    <ion-content color="dark" class="ion-padding">
      <ion-card color="dark">
        <ion-card-header>
          <ion-card-title>Estadísticas Semanales</ion-card-title>
        </ion-card-header>
        <ion-card-content class="ion-text-center">
          <p>Gráficos y reportes van aquí...</p>
        </ion-card-content>
      </ion-card>
    </ion-content>
  `
})
export class ProgressComponent {}