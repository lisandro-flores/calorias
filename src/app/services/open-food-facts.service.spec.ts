import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { OpenFoodFactsService, OffSearchResponse } from './open-food-facts.service';

describe('OpenFoodFactsService', () => {
  let service: OpenFoodFactsService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [OpenFoodFactsService]
    });
    service = TestBed.inject(OpenFoodFactsService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should return products on search', () => {
    const mockResponse: OffSearchResponse = {
      count: 1,
      page: 1,
      page_size: 10,
      products: [
        { code: '123', product_name: 'Apple', nutriments: {} }
      ]
    };

    service.searchProducts('Apple').subscribe(products => {
      expect(products.length).toBe(1);
      expect(products[0].product_name).toBe('Apple');
    });

    const req = httpMock.expectOne(request => request.url.includes('search.pl'));
    expect(req.request.method).toBe('GET');
    req.flush(mockResponse);
  });

  it('should return empty array if no products on search', () => {
    const mockResponse = { count: 0 } as any;

    service.searchProducts('Unknown').subscribe(products => {
      expect(products).toEqual([]);
    });

    const req = httpMock.expectOne(request => request.url.includes('search.pl'));
    req.flush(mockResponse);
  });

  it('should return product by barcode', () => {
    const mockProduct = { code: '123', product_name: 'Apple', nutriments: {} };
    const mockResponse = { status: 1, product: mockProduct };

    service.getProductByBarcode('123').subscribe(product => {
      expect(product).toEqual(mockProduct);
    });

    const req = httpMock.expectOne(request => request.url.includes('123.json'));
    expect(req.request.method).toBe('GET');
    req.flush(mockResponse);
  });

  it('should return null if barcode not found', () => {
    const mockResponse = { status: 0, status_verbose: 'product not found' };

    service.getProductByBarcode('999').subscribe(product => {
      expect(product).toBeNull();
    });

    const req = httpMock.expectOne(request => request.url.includes('999.json'));
    req.flush(mockResponse);
  });
});
