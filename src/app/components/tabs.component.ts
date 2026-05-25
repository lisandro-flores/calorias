import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { addIcons } from 'ionicons';
import { homeOutline, barChartOutline, personOutline, remove, add, water, logOutOutline, addCircle, fitnessOutline } from 'ionicons/icons';

@Component({
  selector: 'app-tabs',
  standalone: true,
  imports: [CommonModule, IonicModule],
  template: `
    <ion-tabs>
      <ion-tab-bar slot="bottom" color="dark">
        
        <ion-tab-button tab="dashboard" href="/tabs/dashboard">
          <ion-icon name="home-outline"></ion-icon>
          <ion-label>Hoy</ion-label>
        </ion-tab-button>

        <ion-tab-button tab="progress" href="/tabs/progress">
          <ion-icon name="bar-chart-outline"></ion-icon>
          <ion-label>Progreso</ion-label>
        </ion-tab-button>

        <ion-tab-button tab="profile" href="/tabs/profile">
          <ion-icon name="person-outline"></ion-icon>
          <ion-label>Perfil</ion-label>
        </ion-tab-button>

      </ion-tab-bar>
    </ion-tabs>
  `
})
export class TabsComponent {
  constructor() {
    // Registramos los íconos necesarios para los tabs y otros componentes
    addIcons({
      'home-outline': homeOutline,
      'bar-chart-outline': barChartOutline,
      'person-outline': personOutline,
      'remove': remove,
      'add': add,
      'water': water,
      'log-out-outline': logOutOutline,
      'add-circle': addCircle,
      'fitness-outline': fitnessOutline
    });
  }
}