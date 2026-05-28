import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Entry, EntryDocument } from './schemas/entry.schema';

@Injectable()
export class EntriesService {
  constructor(@InjectModel(Entry.name) private entryModel: Model<EntryDocument>) {}

  /**
   * Fase 3: Merge foods from client and server meals by meal name.
   * Deduplicates by food.id to avoid duplicate entries.
   */
  private mergeMeals(serverMeals: any[], clientMeals: any[]): any[] {
    const mealMap = new Map<string, any>();

    // Start with server meals
    for (const meal of serverMeals) {
      mealMap.set(meal.name, { ...meal, foods: [...(meal.foods || [])] });
    }

    // Merge client meals
    for (const clientMeal of clientMeals) {
      const existing = mealMap.get(clientMeal.name);
      if (!existing) {
        mealMap.set(clientMeal.name, { ...clientMeal, foods: [...(clientMeal.foods || [])] });
        continue;
      }

      // Deduplicate foods by id
      const existingIds = new Set((existing.foods || []).map((f: any) => f.id));
      for (const food of clientMeal.foods || []) {
        if (!existingIds.has(food.id)) {
          existing.foods.push(food);
        }
      }
    }

    return Array.from(mealMap.values());
  }

  async saveEntry(
    userId: string,
    date: string,
    meals: any[],
    waterGlasses: number,
    clientUpdatedAt?: string,
    expectedVersion?: number, // Fase 3: client's expected version
  ): Promise<{ entry: EntryDocument | null; merged: boolean }> {
    const parsedDate = new Date(date + 'T00:00:00.000Z');
    const parsedClientUpdatedAt = clientUpdatedAt ? new Date(clientUpdatedAt) : new Date();
    const safeClientUpdatedAt = Number.isNaN(parsedClientUpdatedAt.getTime())
      ? new Date()
      : parsedClientUpdatedAt;

    const existing = await this.entryModel.findOne({ date: parsedDate, user: userId });

    // Fase 3: Conflict detection and merge
    if (existing) {
      const serverVersion = existing.version || 0;
      const clientVersion = expectedVersion || 0;

      // If client expected a different version, there's a conflict → merge
      if (clientVersion !== serverVersion) {
        console.log(
          `[Merge] Conflict for ${userId} on ${date}: client v${clientVersion}, server v${serverVersion}`,
        );
        const mergedMeals = this.mergeMeals(existing.meals || [], meals);
        const mergedWater = Math.max(existing.waterGlasses || 0, waterGlasses);
        const updated = await this.entryModel.findOneAndUpdate(
          { date: parsedDate, user: userId },
          {
            meals: mergedMeals,
            waterGlasses: mergedWater,
            clientUpdatedAt: safeClientUpdatedAt,
            version: serverVersion + 1,
          },
          { new: true },
        );
        return { entry: updated, merged: true };
      }

      // No conflict: normal update
      if (existing.clientUpdatedAt && existing.clientUpdatedAt > safeClientUpdatedAt) {
        return { entry: existing, merged: false };
      }
    }

    // Upsert: create or update without conflict
    const finalVersion = existing ? (existing.version || 0) + 1 : 1;
    const updated = await this.entryModel.findOneAndUpdate(
      { date: parsedDate, user: userId },
      {
        meals,
        waterGlasses,
        date: parsedDate,
        user: userId,
        clientUpdatedAt: safeClientUpdatedAt,
        version: finalVersion,
      },
      { upsert: true, new: true },
    );
    return { entry: updated, merged: false };
  }

  async getEntry(userId: string, date: string) {
    const parsedDate = new Date(date + 'T00:00:00.000Z');
    const entry = await this.entryModel.findOne({ date: parsedDate, user: userId });
    return entry ? { entry, merged: false, version: entry.version || 0 } : null;
  }

  async getRecentEntries(userId: string, days = 30) {
    return this.entryModel
      .find({ user: userId })
      .sort({ date: -1 })
      .limit(days)
      .lean();
  }
}
