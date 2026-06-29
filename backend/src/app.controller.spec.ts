import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from './app.controller';
import { AppService } from './app.service';

describe('AppController', () => {
  let appController: AppController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [AppService],
    }).compile();

    appController = app.get<AppController>(AppController);
  });

  describe('root', () => {
    it('should return the API name', () => {
      expect(appController.getHello()).toBe('FuelSmart API');
    });
  });

  describe('health', () => {
    it('should return a health payload', () => {
      expect(appController.getHealth()).toMatchObject({
        status: 'ok',
        service: 'fuelsmart-api',
      });
    });
  });
});
