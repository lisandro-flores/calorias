import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class NetworkStatusService {
  isOnline = signal<boolean>(true);
  
  constructor(private http: HttpClient) {
    this.initNetworkListeners();
    this.checkRealConnectivity();
    
    // Check every 30s as in the provided model
    setInterval(() => {
      this.checkRealConnectivity();
    }, 30000);
  }

  private initNetworkListeners() {
    window.addEventListener('online', () => {
      this.checkRealConnectivity();
    });
    
    window.addEventListener('offline', () => {
      this.isOnline.set(false);
    });
  }

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
        signal: AbortSignal.timeout(3000)
      });
      
      if (response.status === 204 || response.ok) {
        this.isOnline.set(true);
      } else {
        this.isOnline.set(false);
      }
    } catch (err) {
      this.isOnline.set(false);
    }
  }
}
