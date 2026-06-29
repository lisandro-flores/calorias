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
            getRecentEntries: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<EntriesController>(EntriesController);
    service = module.get<EntriesService>(EntriesService);
  });

  const req = { user: { id: '000000000000000000000001' } } as any;

  describe('syncEntry', () => {
    it('should sync entry with valid data', async () => {
      const body = {
        date: '2024-05-26',
        meals: mockEntry.meals,
        waterGlasses: 3,
      };

      jest.spyOn(service, 'saveEntry').mockResolvedValue({ entry: mockEntry, merged: false });

      const result = await controller.syncEntry(body, req);

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockEntry);
      expect(result.merged).toBe(false);
      expect(service.saveEntry).toHaveBeenCalledWith(
        req.user.id,
        body.date,
        body.meals,
        body.waterGlasses,
        undefined,
        undefined,
      );
    });

    it('should handle multiple meals', async () => {
      const body = {
        date: '2024-05-26',
        meals: [
          { name: 'Desayuno', calories: 500 },
          { name: 'Almuerzo', calories: 800 },
        ],
        waterGlasses: 5,
      };

      const entryWithMeals = { ...mockEntry, meals: body.meals, version: 1 };
      jest.spyOn(service, 'saveEntry').mockResolvedValue({ entry: entryWithMeals, merged: false });

      const result = await controller.syncEntry(body, req);

      expect(result.success).toBe(true);
      expect(result.data.meals.length).toBe(2);
      expect(result.merged).toBe(false);
    });
  });

  describe('getDayEntry', () => {
    it('should retrieve entry for valid date and authenticated user', async () => {
      jest.spyOn(service, 'getEntry').mockResolvedValue(mockEntry);

      const result = await controller.getDayEntry('2024-05-26', req);

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockEntry);
      expect(service.getEntry).toHaveBeenCalledWith(req.user.id, '2024-05-26');
    });

    it('should return null if entry does not exist', async () => {
      jest.spyOn(service, 'getEntry').mockResolvedValue(null);

      const result = await controller.getDayEntry('2024-05-26', req);

      expect(result.success).toBe(true);
      expect(result.data).toBeNull();
    });

    it('should handle different date formats', async () => {
      jest.spyOn(service, 'getEntry').mockResolvedValue(mockEntry);

      await controller.getDayEntry('2025-12-31', req);

      expect(service.getEntry).toHaveBeenCalledWith(req.user.id, '2025-12-31');
    });
  });

  describe('getRangeEntries', () => {
    it('should retrieve entries for the authenticated user', async () => {
      jest.spyOn(service, 'getRecentEntries').mockResolvedValue([mockEntry] as any);

      const result = await controller.getRangeEntries(req, '7');

      expect(result.success).toBe(true);
      expect(result.data).toEqual([mockEntry]);
      expect(service.getRecentEntries).toHaveBeenCalledWith(req.user.id, 7);
    });
  });
});
