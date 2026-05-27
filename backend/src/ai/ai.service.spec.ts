import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, HttpException } from '@nestjs/common';
import { AiService, ParsedFoodItem } from './ai.service';

describe('AiService', () => {
  let service: AiService;
  let mockGoogleGenAI: any;

  beforeEach(async () => {
    // Mock de GoogleGenAI
    mockGoogleGenAI = {
      models: {
        generateContent: jest.fn(),
      },
    };

    // Temporalmente al crear el servicio, lo hacemos sin API key para testing
    const originalEnv = process.env.GEMINI_API_KEY;
    delete process.env.GEMINI_API_KEY;

    const module: TestingModule = await Test.createTestingModule({
      providers: [AiService],
    }).compile();

    service = module.get<AiService>(AiService);

    // Restaurar env
    if (originalEnv) {
      process.env.GEMINI_API_KEY = originalEnv;
    }
  });

  describe('parseMealText', () => {
    it('should throw BadRequestException when API key is missing', async () => {
      await expect(service.parseMealText('2 huevos revueltos')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw BadRequestException when text is too short', async () => {
      // Simular que AI está disponible
      service['ai'] = mockGoogleGenAI;

      await expect(service.parseMealText('ab')).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException when text is empty', async () => {
      service['ai'] = mockGoogleGenAI;

      await expect(service.parseMealText('')).rejects.toThrow(BadRequestException);
      await expect(service.parseMealText('   ')).rejects.toThrow(BadRequestException);
    });

    it('should successfully parse a meal text', async () => {
      const mockParsedMeals: ParsedFoodItem[] = [
        {
          name: 'Huevos revueltos',
          portion: '2 piezas',
          calories: 155,
          protein: 13,
          carbs: 1,
          fat: 11,
          emoji: '🍳',
        },
        {
          name: 'Jamón',
          portion: '50g',
          calories: 150,
          protein: 20,
          carbs: 0,
          fat: 8,
          emoji: '🍖',
        },
      ];

      mockGoogleGenAI.models.generateContent.mockResolvedValue({
        text: JSON.stringify(mockParsedMeals),
      });

      service['ai'] = mockGoogleGenAI;

      const result = await service.parseMealText('2 huevos revueltos con jamón');

      expect(result).toEqual(mockParsedMeals);
      expect(result.length).toBe(2);
      expect(result[0].name).toBe('Huevos revueltos');
      expect(result[0].calories).toBe(155);
    });

    it('should handle rate limit errors', async () => {
      const rateLimitError = new Error('Quota exceeded');
      (rateLimitError as any).status = 429;

      mockGoogleGenAI.models.generateContent.mockRejectedValue(rateLimitError);
      service['ai'] = mockGoogleGenAI;

      await expect(service.parseMealText('desayuno')).rejects.toThrow(HttpException);
    });

    it('should handle API key errors', async () => {
      const apiKeyError = new Error('API key not valid');
      (apiKeyError as any).status = 403;

      mockGoogleGenAI.models.generateContent.mockRejectedValue(apiKeyError);
      service['ai'] = mockGoogleGenAI;

      await expect(service.parseMealText('desayuno')).rejects.toThrow(HttpException);
    });

    it('should return empty array if response is not valid JSON', async () => {
      mockGoogleGenAI.models.generateContent.mockResolvedValue({
        text: 'Invalid JSON { ]',
      });
      service['ai'] = mockGoogleGenAI;

      await expect(service.parseMealText('desayuno')).rejects.toThrow(BadRequestException);
    });

    it('should return empty array if response is empty', async () => {
      mockGoogleGenAI.models.generateContent.mockResolvedValue({
        text: '[]',
      });
      service['ai'] = mockGoogleGenAI;

      const result = await service.parseMealText('desayuno');
      expect(result).toEqual([]);
    });
  });

  describe('getCoachAdvice', () => {
    it('should throw BadRequestException when API key is missing', async () => {
      const profile = { name: 'Juan', dailyCalories: 2000 };
      const meals = [];

      await expect(service.getCoachAdvice(profile, meals)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should successfully get coach advice', async () => {
      const mockAdvice = 'Vas muy bien hoy, mantén el ritmo y toma más agua.';

      mockGoogleGenAI.models.generateContent.mockResolvedValue({
        text: mockAdvice,
      });

      service['ai'] = mockGoogleGenAI;

      const profile = { name: 'Juan', dailyCalories: 2000, goal: 1800 };
      const meals = [
        { name: 'Desayuno', calories: 500 },
        { name: 'Almuerzo', calories: 700 },
      ];

      const result = await service.getCoachAdvice(profile, meals);

      expect(result).toBe(mockAdvice);
    });

    it('should return default advice if response is empty', async () => {
      mockGoogleGenAI.models.generateContent.mockResolvedValue({
        text: null,
      });

      service['ai'] = mockGoogleGenAI;

      const profile = { name: 'Juan' };
      const meals = [];

      const result = await service.getCoachAdvice(profile, meals);

      expect(result).toBe('Sin consejos por el momento.');
    });

    it('should handle rate limit in coach advice', async () => {
      const rateLimitError = new Error('Quota exceeded');
      (rateLimitError as any).status = 429;

      mockGoogleGenAI.models.generateContent.mockRejectedValue(rateLimitError);
      service['ai'] = mockGoogleGenAI;

      const profile = {};
      const meals = [];

      await expect(service.getCoachAdvice(profile, meals)).rejects.toThrow(HttpException);
    });

    it('should handle API key errors in coach advice', async () => {
      const apiKeyError = new Error('Invalid API key');
      (apiKeyError as any).status = 403;

      mockGoogleGenAI.models.generateContent.mockRejectedValue(apiKeyError);
      service['ai'] = mockGoogleGenAI;

      const profile = {};
      const meals = [];

      await expect(service.getCoachAdvice(profile, meals)).rejects.toThrow(HttpException);
    });
  });
});
