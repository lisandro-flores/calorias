import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface OffProduct {
  code: string;
  product_name: string;
  image_front_url?: string;
  nutriments: {
    'energy-kcal_100g'?: number;
    'proteins_100g'?: number;
    'carbohydrates_100g'?: number;
    'fat_100g'?: number;
  };
}

export interface OffSearchResponse {
  count: number;
  page: number;
  page_size: number;
  products: OffProduct[];
}

@Injectable({
  providedIn: 'root'
})
export class OpenFoodFactsService {
  private http = inject(HttpClient);
  // Usamos el endpoint global (mundo) para máxima cobertura, aunque puedes restringir a 'mx' o 'es'
  private baseUrl = 'https://world.openfoodfacts.org/cgi';

  /**
   * Busca productos por nombre en la base de datos libre de Open Food Facts
   */
  searchProducts(query: string, limit = 10): Observable<OffProduct[]> {
    const url = `${this.baseUrl}/search.pl?search_terms=${encodeURIComponent(query)}&search_simple=1&action=process&json=1&page_size=${limit}`;
    return this.http.get<OffSearchResponse>(url).pipe(
      map(res => res.products || [])
    );
  }

  /**
   * Obtiene un producto exacto por código de barras (EAN-13, etc.)
   */
  getProductByBarcode(barcode: string): Observable<OffProduct | null> {
    const url = `https://world.openfoodfacts.org/api/v0/product/${barcode}.json`;
    return this.http.get<any>(url).pipe(
      map(res => res.status === 1 ? res.product : null)
    );
  }
}