import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { User } from '../../users/schemas/user.schema';

export type EntryDocument = Entry & Document;

@Schema()
export class FoodItem {
  @Prop()
  id: string; // ID desde OpenFoodFacts o FatSecret

  @Prop()
  name: string;

  @Prop()
  emoji: string;

  @Prop()
  portion: string;

  @Prop()
  calories: number;

  @Prop()
  protein: number;

  @Prop()
  carbs: number;

  @Prop()
  fat: number;
}

@Schema({ timestamps: true, collection: 'registro' })
export class Entry {
    @Prop({ type: String, required: false })
  user: string;
//  true once Auth is done
  

  // Fecha exacto truncada a 00:00:00 (ej: 2026-05-25)
  @Prop({ required: true })
  date: Date;
  
  @Prop({ default: 0 })
  waterGlasses: number;

  @Prop({ type: [{ name: String, foods: [SchemaFactory.createForClass(FoodItem)] }] })
  meals: { name: string; foods: FoodItem[] }[];
}

export const EntrySchema = SchemaFactory.createForClass(Entry);
