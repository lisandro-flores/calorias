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
});
