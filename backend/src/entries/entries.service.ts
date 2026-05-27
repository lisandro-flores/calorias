import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Entry, EntryDocument } from './schemas/entry.schema';

@Injectable()
export class EntriesService {
  constructor(@InjectModel(Entry.name) private entryModel: Model<EntryDocument>) {}

  async saveEntry(
    userId: string,
    date: string,
    meals: any[],
    waterGlasses: number,
    clientUpdatedAt?: string,
  ) {
    const parsedDate = new Date(date + 'T00:00:00.000Z');
    const parsedClientUpdatedAt = clientUpdatedAt ? new Date(clientUpdatedAt) : new Date();
    const safeClientUpdatedAt = Number.isNaN(parsedClientUpdatedAt.getTime())
      ? new Date()
      : parsedClientUpdatedAt;

    const existing = await this.entryModel.findOne({ date: parsedDate, user: userId });
    if (existing?.clientUpdatedAt && existing.clientUpdatedAt > safeClientUpdatedAt) {
      return existing;
    }

    return this.entryModel.findOneAndUpdate(
      { date: parsedDate, user: userId },
      {
        meals,
        waterGlasses,
        date: parsedDate,
        user: userId,
        clientUpdatedAt: safeClientUpdatedAt,
      },
      { upsert: true, new: true }
    );
  }

  async getEntry(userId: string, date: string) {
    const parsedDate = new Date(date + 'T00:00:00.000Z');
    return this.entryModel.findOne({ date: parsedDate, user: userId });
  }

  async getRecentEntries(userId: string, days = 30) {
    return this.entryModel
      .find({ user: userId })
      .sort({ date: -1 })
      .limit(days)
      .lean();
  }
}
