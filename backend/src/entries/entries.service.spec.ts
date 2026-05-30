import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { EntriesService } from './entries.service';
import { Entry } from './schemas/entry.schema';

describe('EntriesService', () => {
  let service: EntriesService;
  let mockEntryModel: any;

  const mockEntry = {
    _id: '000000000000000000000001',
    date: new Date('2024-05-26T00:00:00.000Z'),
    user: '000000000000000000000001',
    clientUpdatedAt: new Date('2024-05-26T12:00:00.000Z'),
    meals: [
      {
        name: 'Desayuno',
        calories: 500,
        protein: 20,
        carbs: 60,
        fat: 15,
      },
    ],
    waterGlasses: 3,
    save: jest.fn(),
  };

  beforeEach(async () => {
    mockEntryModel = {
      findOneAndUpdate: jest.fn(),
      findOne: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EntriesService,
        {
          provide: getModelToken(Entry.name),
          useValue: mockEntryModel,
        },
      ],
    }).compile();

    service = module.get<EntriesService>(EntriesService);
  });

  describe('saveEntry', () => {
    it('should save a new entry', async () => {
      const userId = '000000000000000000000001';
      const date = '2024-05-26';
      const meals = [
        {
          name: 'Desayuno',
          calories: 500,
        },
      ];
      const waterGlasses = 3;

      mockEntryModel.findOne.mockResolvedValue(null);
      mockEntryModel.findOneAndUpdate.mockResolvedValue(mockEntry);

      const result = await service.saveEntry(userId, date, meals, waterGlasses);

      expect(result.entry).toEqual(mockEntry);
      expect(result.merged).toBe(false);
      expect(mockEntryModel.findOne).toHaveBeenCalledWith({
        date: new Date('2024-05-26T00:00:00.000Z'),
        user: userId,
      });
      expect(mockEntryModel.findOneAndUpdate).toHaveBeenCalledWith(
        { date: new Date('2024-05-26T00:00:00.000Z'), user: userId },
        expect.objectContaining({
          meals,
          waterGlasses,
          date: new Date('2024-05-26T00:00:00.000Z'),
          user: userId,
          clientUpdatedAt: expect.any(Date),
          version: expect.any(Number),
        }),
        { upsert: true, new: true },
      );
    });

    it('should update an existing entry', async () => {
      const userId = '000000000000000000000001';
      const date = '2024-05-26';
      const newMeals = [
        {
          name: 'Almuerzo',
          calories: 800,
        },
      ];
      const waterGlasses = 5;

      const updatedEntry = {
        ...mockEntry,
        meals: newMeals,
        waterGlasses,
      };

      mockEntryModel.findOne.mockResolvedValue(mockEntry);
      mockEntryModel.findOneAndUpdate.mockResolvedValue(updatedEntry);

      const result = await service.saveEntry(userId, date, newMeals, waterGlasses);

      expect(result.entry.meals).toEqual(newMeals);
      expect(result.entry.waterGlasses).toBe(5);
      expect(result.merged).toBe(false);
    });

    it('should handle empty meals array', async () => {
      const userId = '000000000000000000000001';
      const date = '2024-05-26';
      const meals = [];
      const waterGlasses = 2;

      mockEntryModel.findOne.mockResolvedValue(mockEntry);
      mockEntryModel.findOneAndUpdate.mockResolvedValue({
        ...mockEntry,
        meals,
      });

      const result = await service.saveEntry(userId, date, meals, waterGlasses);

      expect(result.entry.meals).toEqual([]);
    });

    it('should parse date correctly in ISO format', async () => {
      const userId = '000000000000000000000001';
      const date = '2024-12-31';
      const meals = [];
      const waterGlasses = 0;

      mockEntryModel.findOne.mockResolvedValue(mockEntry);
      mockEntryModel.findOneAndUpdate.mockResolvedValue(mockEntry);

      await service.saveEntry(userId, date, meals, waterGlasses);

      const expectedDate = new Date('2024-12-31T00:00:00.000Z');
      expect(mockEntryModel.findOneAndUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          date: expectedDate,
          user: userId,
        }),
        expect.any(Object),
        expect.any(Object),
      );
    });

    it('should ignore stale updates using clientUpdatedAt', async () => {
      const userId = '000000000000000000000001';
      const date = '2024-05-26';
      const meals = [{ name: 'Cena', calories: 400 }];
      const waterGlasses = 1;
      const staleTimestamp = '2024-05-26T11:00:00.000Z';

      mockEntryModel.findOne.mockResolvedValue(mockEntry);

      const result = await service.saveEntry(userId, date, meals, waterGlasses, staleTimestamp);

      expect(result.entry).toEqual(mockEntry);
      expect(result.merged).toBe(false);
      expect(mockEntryModel.findOneAndUpdate).not.toHaveBeenCalled();
    });
  });

  describe('getEntry', () => {
    it('should retrieve an existing entry', async () => {
      const userId = '000000000000000000000001';
      const date = '2024-05-26';

      mockEntryModel.findOne.mockResolvedValue(mockEntry);

      const result = await service.getEntry(userId, date);

      expect(result.entry).toEqual(mockEntry);
      expect(result.merged).toBe(false);
      expect(result.version).toBe(0);
      expect(mockEntryModel.findOne).toHaveBeenCalledWith({
        date: new Date('2024-05-26T00:00:00.000Z'),
        user: userId,
      });
    });

    it('should return null if entry does not exist', async () => {
      const userId = 'nonexistent_user';
      const date = '2024-05-26';

      mockEntryModel.findOne.mockResolvedValue(null);

      const result = await service.getEntry(userId, date);

      expect(result).toBeNull();
    });

    it('should handle different date formats correctly', async () => {
      const userId = '000000000000000000000001';
      const date = '2025-01-15';

      mockEntryModel.findOne.mockResolvedValue(mockEntry);

      await service.getEntry(userId, date);

      const expectedDate = new Date('2025-01-15T00:00:00.000Z');
      expect(mockEntryModel.findOne).toHaveBeenCalledWith(
        expect.objectContaining({
          date: expectedDate,
          user: userId,
        }),
      );
    });

    it('should return the full entry with all fields', async () => {
      const userId = '000000000000000000000001';
      const date = '2024-05-26';

      const fullEntry = {
        ...mockEntry,
        meals: [
          {
            name: 'Desayuno',
            calories: 500,
            protein: 20,
            carbs: 60,
            fat: 15,
          },
          {
            name: 'Almuerzo',
            calories: 800,
            protein: 35,
            carbs: 80,
            fat: 20,
          },
        ],
        waterGlasses: 5,
        version: 1,
      };

      mockEntryModel.findOne.mockResolvedValue(fullEntry);

      const result = await service.getEntry(userId, date);

      expect(result.entry.meals.length).toBe(2);
      expect(result.entry.waterGlasses).toBe(5);
      expect(result.version).toBe(1);
    });
  });

  // ═══════════════════════════════════════════════════════════
  // MULTI-DISPOSITIVO: Detección de conflictos y merge
  // ═══════════════════════════════════════════════════════════
  describe('Conflict Resolution — Multi-dispositivo (Fase 3)', () => {
    const userId = '000000000000000000000001';
    const date = '2024-06-15';

    it('should merge meals from two devices when expectedVersion conflicts', async () => {
      // Server tiene version=2 con un alimento del Device A
      const existingEntry = {
        _id: 'existing-merge-1',
        date: new Date('2024-06-15T00:00:00.000Z'),
        user: userId,
        version: 2,
        clientUpdatedAt: new Date('2024-06-15T10:00:00.000Z'),
        meals: [
          {
            name: 'Desayuno',
            foods: [
              { id: 'food-a1', name: 'Avena (DeviceA)', calories: 300 },
            ],
          },
        ],
        waterGlasses: 3,
      };

      // Device B envía con expectedVersion=1 (desfasado) y su propio alimento
      const clientMeals = [
        {
          name: 'Desayuno',
          foods: [
            { id: 'food-b1', name: 'Yogurt (DeviceB)', calories: 150 },
          ],
        },
      ];

      const mergedResult = {
        ...existingEntry,
        meals: [
          {
            name: 'Desayuno',
            foods: [
              { id: 'food-a1', name: 'Avena (DeviceA)', calories: 300 },
              { id: 'food-b1', name: 'Yogurt (DeviceB)', calories: 150 },
            ],
          },
        ],
        waterGlasses: 3,
        version: 3,
      };

      mockEntryModel.findOne.mockResolvedValue(existingEntry);
      mockEntryModel.findOneAndUpdate.mockResolvedValue(mergedResult);

      const result = await service.saveEntry(userId, date, clientMeals, 2, undefined, 1);

      expect(result.merged).toBe(true);
      expect(mockEntryModel.findOneAndUpdate).toHaveBeenCalledWith(
        { date: new Date('2024-06-15T00:00:00.000Z'), user: userId },
        expect.objectContaining({
          version: 3, // serverVersion(2) + 1
        }),
        { new: true },
      );
    });

    it('should take max waterGlasses on conflict merge', async () => {
      const existingEntry = {
        _id: 'existing-water-merge',
        date: new Date('2024-06-15T00:00:00.000Z'),
        user: userId,
        version: 1,
        clientUpdatedAt: new Date(),
        meals: [],
        waterGlasses: 5,
      };

      mockEntryModel.findOne.mockResolvedValue(existingEntry);
      mockEntryModel.findOneAndUpdate.mockResolvedValue({
        ...existingEntry,
        waterGlasses: 5,
        version: 2,
      });

      // Client sends 3 glasses but server has 5 → max(5, 3) = 5
      const result = await service.saveEntry(userId, date, [], 3, undefined, 0);

      expect(result.merged).toBe(true);
      expect(mockEntryModel.findOneAndUpdate).toHaveBeenCalledWith(
        expect.any(Object),
        expect.objectContaining({
          waterGlasses: 5, // max(5, 3)
        }),
        expect.any(Object),
      );
    });

    it('should not merge when versions match (no conflict)', async () => {
      const existingEntry = {
        _id: 'existing-no-conflict',
        date: new Date('2024-06-15T00:00:00.000Z'),
        user: userId,
        version: 3,
        clientUpdatedAt: new Date('2024-06-15T08:00:00.000Z'),
        meals: [{ name: 'Desayuno', foods: [] }],
        waterGlasses: 2,
      };

      mockEntryModel.findOne.mockResolvedValue(existingEntry);
      mockEntryModel.findOneAndUpdate.mockResolvedValue({
        ...existingEntry,
        version: 4,
      });

      // expectedVersion matches server version → normal update
      const result = await service.saveEntry(
        userId, date, [{ name: 'Desayuno', foods: [] }], 4,
        '2024-06-15T12:00:00.000Z', 3,
      );

      expect(result.merged).toBe(false);
    });

    it('should deduplicate foods by id during merge', async () => {
      const sharedFoodId = 'shared-food-1';
      const existingEntry = {
        _id: 'existing-dedup',
        date: new Date('2024-06-15T00:00:00.000Z'),
        user: userId,
        version: 1,
        clientUpdatedAt: new Date(),
        meals: [
          {
            name: 'Desayuno',
            foods: [{ id: sharedFoodId, name: 'Huevos', calories: 200 }],
          },
        ],
        waterGlasses: 1,
      };

      const clientMeals = [
        {
          name: 'Desayuno',
          foods: [
            { id: sharedFoodId, name: 'Huevos', calories: 200 }, // duplicate
            { id: 'new-food-1', name: 'Pan', calories: 150 }, // new
          ],
        },
      ];

      // Simulate merge: the service should call findOneAndUpdate with merged meals
      mockEntryModel.findOne.mockResolvedValue(existingEntry);
      mockEntryModel.findOneAndUpdate.mockImplementation((_filter: any, update: any) => {
        return Promise.resolve({
          ...existingEntry,
          ...update,
        });
      });

      const result = await service.saveEntry(userId, date, clientMeals, 1, undefined, 0);

      expect(result.merged).toBe(true);

      // Verify the meals passed to findOneAndUpdate contain deduplicated foods
      const updateCall = mockEntryModel.findOneAndUpdate.mock.calls[0][1];
      const desayunoFoods = updateCall.meals.find((m: any) => m.name === 'Desayuno')?.foods || [];

      // Should have 2 foods (Huevos once + Pan), NOT 3
      expect(desayunoFoods.length).toBe(2);
      const foodIds = desayunoFoods.map((f: any) => f.id);
      expect(foodIds).toContain(sharedFoodId);
      expect(foodIds).toContain('new-food-1');
    });

    it('should increment version on every save', async () => {
      // First save: no existing entry
      mockEntryModel.findOne.mockResolvedValue(null);
      mockEntryModel.findOneAndUpdate.mockImplementation((_filter: any, update: any) => {
        return Promise.resolve({ ...update, _id: 'new-entry' });
      });

      const result1 = await service.saveEntry(userId, date, [], 0);
      expect(result1.entry.version).toBe(1);

      // Second save: existing entry with version 1
      const existingV1 = {
        _id: 'new-entry',
        date: new Date('2024-06-15T00:00:00.000Z'),
        user: userId,
        version: 1,
        clientUpdatedAt: new Date(),
        meals: [],
        waterGlasses: 0,
      };

      mockEntryModel.findOne.mockResolvedValue(existingV1);

      const result2 = await service.saveEntry(userId, date, [], 0, undefined, 1);
      expect(result2.entry.version).toBe(2);
    });

    it('should add meals from client that server does not have (new meal name)', async () => {
      const existingEntry = {
        _id: 'existing-new-meal',
        date: new Date('2024-06-15T00:00:00.000Z'),
        user: userId,
        version: 1,
        clientUpdatedAt: new Date(),
        meals: [
          { name: 'Desayuno', foods: [{ id: 'f1', name: 'Avena', calories: 300 }] },
        ],
        waterGlasses: 0,
      };

      const clientMeals = [
        { name: 'Merienda', foods: [{ id: 'f2', name: 'Galletas', calories: 100 }] },
      ];

      mockEntryModel.findOne.mockResolvedValue(existingEntry);
      mockEntryModel.findOneAndUpdate.mockImplementation((_filter: any, update: any) => {
        return Promise.resolve({ ...existingEntry, ...update });
      });

      const result = await service.saveEntry(userId, date, clientMeals, 0, undefined, 0);

      expect(result.merged).toBe(true);
      const updateCall = mockEntryModel.findOneAndUpdate.mock.calls[0][1];
      const mealNames = updateCall.meals.map((m: any) => m.name);
      expect(mealNames).toContain('Desayuno');
      expect(mealNames).toContain('Merienda');
    });
  });
});
