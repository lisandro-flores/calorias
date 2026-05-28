import { Test, TestingModule } from '@nestjs/testing';
import { EntriesController } from './entries.controller';
import { EntriesService } from './entries.service';

describe('EntriesController', () => {
  let controller: EntriesController;
  let service: EntriesService;

  const mockEntry = {
    _id: '000000000000000000000001',
    date: new Date('2024-05-26'),
    user: '000000000000000000000001',
    meals: [
      {
        name: 'Desayuno',
        calories: 500,
        protein: 20,
      },
    ],
    waterGlasses: 3,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [EntriesController],
      providers: [
        {
          provide: EntriesService,
          useValue: {
            saveEntry: jest.fn(),
            getEntry: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<EntriesController>(EntriesController);
    service = module.get<EntriesService>(EntriesService);
  });

  describe('syncEntry', () => {
    it('should reject request without userId', async () => {
      const body = {
        userId: '',
        date: '2024-05-26',
        meals: [],
        waterGlasses: 0,
      };

      const result = await controller.syncEntry(body);

      expect(result.success).toBe(false);
      expect(result.message).toBe('Missing userId');
    });

    it('should sync entry with valid data', async () => {
      const body = {
        userId: '000000000000000000000001',
        date: '2024-05-26',
        meals: mockEntry.meals,
        waterGlasses: 3,
      };

      jest.spyOn(service, 'saveEntry').mockResolvedValue({ entry: mockEntry, merged: false });

      const result = await controller.syncEntry(body);

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockEntry);
      expect(result.merged).toBe(false);
      expect(service.saveEntry).toHaveBeenCalledWith(
        body.userId,
        body.date,
        body.meals,
        body.waterGlasses,
        undefined,
        undefined,
      );
    });

    it('should handle multiple meals', async () => {
      const body = {
        userId: 'user123',
        date: '2024-05-26',
        meals: [
          { name: 'Desayuno', calories: 500 },
          { name: 'Almuerzo', calories: 800 },
        ],
        waterGlasses: 5,
      };

      const entryWithMeals = { ...mockEntry, meals: body.meals, version: 1 };
      jest.spyOn(service, 'saveEntry').mockResolvedValue({ entry: entryWithMeals, merged: false });

      const result = await controller.syncEntry(body);

      expect(result.success).toBe(true);
      expect(result.data.meals.length).toBe(2);
      expect(result.merged).toBe(false);
    });
  });

  describe('getDayEntry', () => {
    it('should reject request without userId', async () => {
      const result = await controller.getDayEntry('2024-05-26', '');

      expect(result.success).toBe(false);
      expect(result.message).toBe('Missing userId');
    });

    it('should retrieve entry for valid date and userId', async () => {
      jest.spyOn(service, 'getEntry').mockResolvedValue(mockEntry);

      const result = await controller.getDayEntry('2024-05-26', 'user123');

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockEntry);
      expect(service.getEntry).toHaveBeenCalledWith('user123', '2024-05-26');
    });

    it('should return null if entry does not exist', async () => {
      jest.spyOn(service, 'getEntry').mockResolvedValue(null);

      const result = await controller.getDayEntry('2024-05-26', 'user123');

      expect(result.success).toBe(true);
      expect(result.data).toBeNull();
    });

    it('should handle different date formats', async () => {
      jest.spyOn(service, 'getEntry').mockResolvedValue(mockEntry);

      await controller.getDayEntry('2025-12-31', 'user123');

      expect(service.getEntry).toHaveBeenCalledWith('user123', '2025-12-31');
    });
  });
});
