import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Entry, EntryDocument } from './schemas/entry.schema';

@Injectable()
export class EntriesService {
  constructor(@InjectModel(Entry.name) private entryModel: Model<EntryDocument>) {}

  async saveEntry(date: string, meals: any[], waterGlasses: number) {
    // Para simplificar, buscamos por fecha en string directo si queremos (pero el esquema usa Date)
    // Asumimos que date viene como "YYYY-MM-DD"
    const parsedDate = new Date(date + 'T00:00:00.000Z');
    
    return this.entryModel.findOneAndUpdate(
      { date: parsedDate }, // Filtro (sin user por ahora)
      { meals, waterGlasses, date: parsedDate }, // Actualización
      { upsert: true, new: true }
    );
  }

  async getEntry(date: string) {
    const parsedDate = new Date(date + 'T00:00:00.000Z');
    return this.entryModel.findOne({ date: parsedDate });
  }
}
