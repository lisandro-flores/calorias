import { Component } from '@angular/core';
import { IonApp, IonRouterOutlet } from '@ionic/angular/standalone';
import { OnlineIndicatorComponent } from './components/online-indicator.component';
import { PwaInstallComponent } from './components/pwa-install.component';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  standalone: true,
  imports: [IonApp, IonRouterOutlet, OnlineIndicatorComponent, PwaInstallComponent],
})
export class AppComponent {
  constructor() {}
}
