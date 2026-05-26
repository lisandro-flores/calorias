import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type UserDocument = User & Document;

@Schema({ timestamps: true })
export class User {
  @Prop({ required: true, unique: true })
  email: string;

  @Prop()
  name: string;

  @Prop()
  picture: string;

  // Podremos agregar despues las metas
  @Prop({ default: 1450 })
  calorieGoal: number;
}

export const UserSchema = SchemaFactory.createForClass(User);