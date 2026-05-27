import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type UserDocument = User & Document;

export type UserGender = 'male' | 'female';
export type UserActivityLevel = 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active';

export interface RecentFoodItem {
  id: string;
  name: string;
  emoji: string;
  portion: string;
  calories: number;
  protein?: number;
  carbs?: number;
  fat?: number;
}

@Schema({ timestamps: true })
export class User {
  @Prop({ required: true, unique: true })
  email: string;

  @Prop()
  name: string;

  @Prop({ default: 'Usuario' })
  displayName: string;

  @Prop({ default: 25 })
  age: number;

  @Prop({ default: 'male' })
  gender: UserGender;

  @Prop({ default: 170 })
  heightCm: number;

  @Prop({ default: 80 })
  startWeight: number;

  @Prop({ default: 80 })
  currentWeight: number;

  @Prop({ default: 70 })
  goalWeight: number;

  @Prop({ default: 'moderate' })
  activityLevel: UserActivityLevel;

  @Prop({ type: Number, default: null })
  calorieGoalOverride: number | null;

  @Prop({ type: Number, default: null })
  proteinGoalOverride: number | null;

  @Prop({ default: 8 })
  waterGoal: number;

  @Prop()
  picture: string;

  @Prop({ default: 1450 })
  calorieGoal: number;

  @Prop({ type: Array, default: [] })
  recentFoods: RecentFoodItem[];
}

export const UserSchema = SchemaFactory.createForClass(User);