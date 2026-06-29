import { DestroyRef, Injectable, inject, signal } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class NetworkStatusService {
  private destroyRef = inject(DestroyRef);
  isOnline = signal<boolean>(true);
  private intervalId: ReturnType<typeof setInterval> | null = null;
  
  constructor() {
    this.initNetworkListeners();
    this.checkRealConnectivity();
    
    // Check every 30s as in the provided model
    this.intervalId = setInterval(() => {
      this.checkRealConnectivity();
    }, 30000);

    this.destroyRef.onDestroy(() => {
      if (this.intervalId) clearInterval(this.intervalId);
      window.removeEventListener('online', this.handleOnline);
      window.removeEventListener('offline', this.handleOffline);
    });
  }

  private initNetworkListeners() {
    window.addEventListener('online', this.handleOnline);
    window.addEventListener('offline', this.handleOffline);
  }

  private handleOnline = () => {
    this.checkRealConnectivity();
  };

  private handleOffline = () => {
    this.isOnline.set(false);
  };

  /**
   * Pings a lightweight endpoint to ensure actual internet access, 
   * not just a local network connection.
   */
  async checkRealConnectivity() {
    if (!navigator.onLine) {
      this.isOnline.set(false);
      return;
    }

    try {
      const response = await fetch('https://www.gstatic.com/generate_204', {
        method: 'GET',
        cache: 'no-store',
        mode: 'no-cors',
        signal: AbortSignal.timeout(3000)
      });
      
      if (response.type === 'opaque' || response.status === 204 || response.ok) {
        this.isOnline.set(true);
      } else {
        this.isOnline.set(false);
      }
    } catch (err) {
      this.isOnline.set(false);
    }
  }
}
