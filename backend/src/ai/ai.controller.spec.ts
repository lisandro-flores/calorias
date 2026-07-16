import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, HttpException } from '@nestjs/common';
import { AiController } from './ai.controller';
import { AiService } from './ai.service';
import { AiRateLimitService } from './ai-rate-limit.service';

describe('AiController', () => {
  let controller: AiController;
  let service: AiService;
  let rateLimit: AiRateLimitService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AiController],
      providers: [
        {
          provide: AiService,
          useValue: {
            parseMealText: jest.fn(),
            getCoachAdvice: jest.fn(),
            analyzeImage: jest.fn(),
          },
        },
        {
          provide: AiRateLimitService,
          useValue: {
            assertAllowed: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<AiController>(AiController);
    service = module.get<AiService>(AiService);
    rateLimit = module.get<AiRateLimitService>(AiRateLimitService);
  });

  const req = { user: { id: 'user123' } } as any;

  describe('parseMeal', () => {
    it('should call parseMealText with text', async () => {
      const mockMeals = [
        {
          name: 'Huevos',
          portion: '2 piezas',
          calories: 155,
          protein: 13,
          carbs: 1,
          fat: 11,
          icon: 'egg',
        },
      ];

      jest.spyOn(service, 'parseMealText').mockResolvedValue(mockMeals);

      const result = await controller.parseMeal(req, { text: '2 huevos revueltos' });

      expect(result).toEqual(mockMeals);
      expect(rateLimit.assertAllowed).toHaveBeenCalledWith(req.user.id);
      expect(service.parseMealText).toHaveBeenCalledWith('2 huevos revueltos');
    });

    it('should return empty array on success', async () => {
      jest.spyOn(service, 'parseMealText').mockResolvedValue([]);

      const result = await controller.parseMeal(req, { text: 'xyz' });

      expect(result).toEqual([]);
    });

    it('should throw error from service', async () => {
      jest
        .spyOn(service, 'parseMealText')
        .mockRejectedValue(new BadRequestException('MISSING_API_KEY'));

      await expect(controller.parseMeal(req, { text: 'text' })).rejects.toThrow(BadRequestException);
    });
  });

  describe('getCoachAdvice', () => {
    it('should return advice in correct wrapper format', async () => {
      const profile = { name: 'Juan' };
      const meals = [{ name: 'Desayuno', calories: 500 }];
      const advice = 'Vas bien hoy!';

      jest.spyOn(service, 'getCoachAdvice').mockResolvedValue(advice);

      const result = await controller.getCoachAdvice(req, { profile, meals });

      expect(result).toEqual({ advice });
      expect(rateLimit.assertAllowed).toHaveBeenCalledWith(req.user.id);
    });

    it('should pass profile, meals and weeklyHistory to service', async () => {
      const profile = { weight: 75 };
      const meals = [{ name: 'Test', calories: 100 }];
      const weeklyHistory = [{ date: '2023-10-01' }];

      jest.spyOn(service, 'getCoachAdvice').mockResolvedValue('test advice');

      await controller.getCoachAdvice(req, { profile, meals, weeklyHistory });

      expect(service.getCoachAdvice).toHaveBeenCalledWith(profile, meals, weeklyHistory);
    });

    it('should handle service errors', async () => {
      jest
        .spyOn(service, 'getCoachAdvice')
        .mockRejectedValue(new HttpException('Error', 500));

      await expect(controller.getCoachAdvice(req, {} as any)).rejects.toThrow(HttpException);
    });
  });

  describe('analyzeImage', () => {
    it('should call analyzeImage with image and mealType', async () => {
      const mockFoods = [
        { name: 'Arroz', portion: '1 taza', calories: 206, protein: 4, carbs: 45, fat: 0, icon: 'restaurant' },
      ];

      jest.spyOn(service, 'analyzeImage').mockResolvedValue(mockFoods);

      const body = { image: 'base64data...', mealType: 'Comida' };
      const result = await controller.analyzeImage(req, body);

      expect(result).toEqual(mockFoods);
      expect(rateLimit.assertAllowed).toHaveBeenCalledWith(req.user.id);
      expect(service.analyzeImage).toHaveBeenCalledWith('base64data...', 'Comida');
    });

    it('should work without mealType', async () => {
      jest.spyOn(service, 'analyzeImage').mockResolvedValue([]);

      const body = { image: 'base64data...' };
      const result = await controller.analyzeImage(req, body);

      expect(result).toEqual([]);
      expect(service.analyzeImage).toHaveBeenCalledWith('base64data...', undefined);
    });

    it('should handle service errors', async () => {
      jest
        .spyOn(service, 'analyzeImage')
        .mockRejectedValue(new BadRequestException('MISSING_API_KEY'));

      await expect(controller.analyzeImage(req, { image: 'x' })).rejects.toThrow(BadRequestException);
    });
  });
});

