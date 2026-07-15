import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { AiService } from './ai.service';
import { environment } from '../../environments/environment';
import { HttpErrorResponse } from '@angular/common/http';

describe('AiService', () => {
  let service: AiService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [AiService]
    });
    service = TestBed.inject(AiService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should parse meal successfully', () => {
    const mockItems = [{ name: 'Apple', portion: '1', calories: 95, protein: 0, carbs: 25, fat: 0, icon: '🍎' }];
    
    service.parseMeal('una manzana').subscribe(res => {
      expect(res).toEqual(mockItems);
    });

    const req = httpMock.expectOne(`${environment.apiUrl}/ai/parse-meal`);
    expect(req.request.method).toBe('POST');
    req.flush(mockItems);
  });

  it('should retry parseMeal on 500 error', fakeAsync(() => {
    let response: any;
    
    service.parseMeal('una manzana').subscribe(res => {
      response = res;
    });

    // 1st attempt
    const req1 = httpMock.expectOne(`${environment.apiUrl}/ai/parse-meal`);
    req1.flush('Error', { status: 500, statusText: 'Server Error' });

    // Wait for retry (first retry uses ~2000ms + random offset)
    tick(3000);

    // 2nd attempt
    const req2 = httpMock.expectOne(`${environment.apiUrl}/ai/parse-meal`);
    const mockItems = [{ name: 'Apple', portion: '1', calories: 95, protein: 0, carbs: 25, fat: 0, icon: '🍎' }];
    req2.flush(mockItems);

    expect(response).toEqual(mockItems);
  }));

  it('should not retry on 400 error', fakeAsync(() => {
    let errorResponse: any;
    
    service.parseMeal('una manzana').subscribe({
      next: () => fail('Should have failed'),
      error: (err) => { errorResponse = err; }
    });

    const req = httpMock.expectOne(`${environment.apiUrl}/ai/parse-meal`);
    req.flush('Bad Request', { status: 400, statusText: 'Bad Request' });

    expect(errorResponse).toBeInstanceOf(HttpErrorResponse);
    expect(errorResponse.status).toBe(400);
    
    // No more requests expected
    httpMock.expectNone(`${environment.apiUrl}/ai/parse-meal`);
  }));

  it('should get coach advice', () => {
    const mockAdvice = { advice: 'Come más proteínas' };
    
    service.getCoachAdvice({}, []).subscribe(res => {
      expect(res).toEqual(mockAdvice);
    });

    const req = httpMock.expectOne(`${environment.apiUrl}/ai/coach-advice`);
    expect(req.request.method).toBe('POST');
    req.flush(mockAdvice);
  });

  it('should retry coach advice on 429 error', fakeAsync(() => {
    let response: any;
    
    service.getCoachAdvice({}, []).subscribe(res => {
      response = res;
    });

    // 1st attempt
    const req1 = httpMock.expectOne(`${environment.apiUrl}/ai/coach-advice`);
    req1.flush('Too Many Requests', { status: 429, statusText: 'Too Many Requests' });

    // Wait for retry (first retry uses Math.pow(2, 1) * 1000 = 2000ms)
    tick(2500);

    // 2nd attempt
    const req2 = httpMock.expectOne(`${environment.apiUrl}/ai/coach-advice`);
    const mockAdvice = { advice: 'Excelente' };
    req2.flush(mockAdvice);

    expect(response).toEqual(mockAdvice);
  }));
});
