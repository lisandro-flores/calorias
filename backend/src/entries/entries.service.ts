import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Entry, EntryDocument } from './schemas/entry.schema';

@Injectable()
export class EntriesService {
  constructor(@InjectModel(Entry.name) private entryModel: Model<EntryDocument>) {}

  async saveEntry(userId: string, date: string, meals: any[], waterGlasses: number) {
    const parsedDate = new Date(date + 'T00:00:00.000Z');
    
    return this.entryModel.findOneAndUpdate(
      { date: parsedDate, user: userId },
      { meals, waterGlasses, date: parsedDate, user: userId },
      { upsert: true, new: true }
    );
  }

  async getEntry(userId: string, date: string) {
    const parsedDate = new Date(date + 'T00:00:00.000Z');
    return this.entryModel.findOne({ date: parsedDate, user: userId });
  }
}
