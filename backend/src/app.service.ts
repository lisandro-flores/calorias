import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getHello(): string {
    return 'FuelSmart API';
  }

  getHealth() {
    return {
      status: 'ok',
      service: 'fuelsmart-api',
      timestamp: new Date().toISOString(),
    };
  }
}
