import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, IonicModule],
  template: `
    <ion-header class="ion-no-border">
      <ion-toolbar color="dark">
        <ion-title>Mi Perfil</ion-title>
      </ion-toolbar>
    </ion-header>
    <ion-content color="dark" class="ion-padding">
      <ion-card color="dark">
        <ion-card-header>
          <ion-card-title>Ajustes de Cuenta</ion-card-title>
        </ion-card-header>
        <ion-card-content>
          <ion-list lines="none" color="dark">
             <ion-item color="dark">
               <ion-label>
                 <h2>Usuario</h2>
                 <p>{{ authService.currentUser()?.name || 'Invitado' }}</p>
               </ion-label>
             </ion-item>
             <ion-item color="dark">
               <ion-label>
                 <h2>Email</h2>
                 <p>{{ authService.currentUser()?.email || 'test@test.com' }}</p>
               </ion-label>
             </ion-item>
          </ion-list>
          <div class="ion-margin-top">
            <ion-button expand="block" color="danger" (click)="logout()">
              Cerrar Sesión
              <ion-icon slot="end" name="log-out-outline"></ion-icon>
            </ion-button>
          </div>
        </ion-card-content>
      </ion-card>
    </ion-content>
  `
})
export class ProfileComponent {
  authService = inject(AuthService);
  router = inject(Router);

  logout() {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}