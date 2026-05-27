import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, HttpException } from '@nestjs/common';
import { AiController } from './ai.controller';
import { AiService } from './ai.service';

describe('AiController', () => {
  let controller: AiController;
  let service: AiService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AiController],
      providers: [
        {
          provide: AiService,
          useValue: {
            parseMealText: jest.fn(),
            getCoachAdvice: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<AiController>(AiController);
    service = module.get<AiService>(AiService);
  });

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
          emoji: '🍳',
        },
      ];

      jest.spyOn(service, 'parseMealText').mockResolvedValue(mockMeals);

      const result = await controller.parseMeal('2 huevos revueltos');

      expect(result).toEqual(mockMeals);
      expect(service.parseMealText).toHaveBeenCalledWith('2 huevos revueltos');
    });

    it('should return empty array on success', async () => {
      jest.spyOn(service, 'parseMealText').mockResolvedValue([]);

      const result = await controller.parseMeal('xyz');

      expect(result).toEqual([]);
    });

    it('should throw error from service', async () => {
      jest
        .spyOn(service, 'parseMealText')
        .mockRejectedValue(new BadRequestException('MISSING_API_KEY'));

      await expect(controller.parseMeal('text')).rejects.toThrow(BadRequestException);
    });
  });

  describe('getCoachAdvice', () => {
    it('should return advice in correct wrapper format', async () => {
      const profile = { name: 'Juan' };
      const meals = [{ name: 'Desayuno', calories: 500 }];
      const advice = 'Vas bien hoy!';

      jest.spyOn(service, 'getCoachAdvice').mockResolvedValue(advice);

      const result = await controller.getCoachAdvice({ profile, meals });

      expect(result).toEqual({ advice });
    });

    it('should pass profile and meals to service', async () => {
      const profile = { weight: 75 };
      const meals = [{ name: 'Test', calories: 100 }];

      jest.spyOn(service, 'getCoachAdvice').mockResolvedValue('test advice');

      await controller.getCoachAdvice({ profile, meals });

      expect(service.getCoachAdvice).toHaveBeenCalledWith(profile, meals);
    });

    it('should handle service errors', async () => {
      jest
        .spyOn(service, 'getCoachAdvice')
        .mockRejectedValue(new HttpException('Error', 500));

      await expect(controller.getCoachAdvice({} as any)).rejects.toThrow(HttpException);
    });
  });
});
