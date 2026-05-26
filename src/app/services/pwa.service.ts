import { Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class PwaService {
  private promptEvent: any;
  
  // Señal que indica si podemos mostrar el botón/alerta de instalación
  canInstall = signal<boolean>(false);

  constructor() {
    this.initPwaListeners();
  }

  private initPwaListeners() {
    window.addEventListener('beforeinstallprompt', (e) => {
      // Prevenir que el mini-infobar o alerta de Chrome aparezca automáticamente
      e.preventDefault();
      // Guardar el evento para dispararlo luego
      this.promptEvent = e;
      // Habilitar la bandera en la UI
      this.canInstall.set(true);
    });

    window.addEventListener('appinstalled', () => {
      // Ocultar botón tras instalación
      this.canInstall.set(false);
      this.promptEvent = null;
      console.log('App instalada como PWA correctamente');
    });
  }

  async promptInstall() {
    if (!this.promptEvent) return;
    
    // Mostrar el prompt nativo
    this.promptEvent.prompt();
    
    // Esperar a la decisión del usuario
    const { outcome } = await this.promptEvent.userChoice;
    
    // Limpiar el evento guardado independientemente del resultado
    this.promptEvent = null;
    this.canInstall.set(false);
  }
}
