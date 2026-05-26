import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, timer, throwError } from 'rxjs';
import { retry } from 'rxjs/operators';

export interface AiFoodItem {
  name: string;
  portion: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  emoji: string;
}

import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class AiService {
  private http = inject(HttpClient);
  private baseUrl = `${environment.apiUrl}/ai`;

  parseMeal(text: string): Observable<AiFoodItem[]> {
    return this.http.post<AiFoodItem[]>(`${this.baseUrl}/parse-meal`, { text }).pipe(
      retry({
        count: 3,
        delay: (error: HttpErrorResponse, retryCount: number) => {
          // Si el error es 429 o un error de conexión, aplicamos backoff exponencial
          if (error.status === 429 || error.status === 0 || error.status >= 500) {
            const delayMs = Math.pow(2, retryCount) * 1000 + Math.random() * 1000;
            return timer(delayMs);
          }
          // Si es otro error (ej. 403 Invalid API Key), no reintentar
          return throwError(() => error);
        }
      })
    );
  }

  getCoachAdvice(profile: any, meals: any[]): Observable<{ advice: string }> {
    return this.http.post<{ advice: string }>(`${this.baseUrl}/coach-advice`, { profile, meals }).pipe(
      retry({
        count: 2,
        delay: (error: HttpErrorResponse, retryCount: number) => {
          if (error.status === 429 || error.status === 0 || error.status >= 500) {
            return timer(Math.pow(2, retryCount) * 1000);
          }
          return throwError(() => error);
        }
      })
    );
  }
}
