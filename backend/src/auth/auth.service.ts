import { Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { OAuth2Client } from 'google-auth-library';
import { RecentFoodItem, User, UserDocument } from '../users/schemas/user.schema';
import * as jwt from 'jsonwebtoken';

export interface UpdateUserProfileDto {
  displayName?: string;
  age?: number;
  gender?: 'male' | 'female';
  heightCm?: number;
  startWeight?: number;
  currentWeight?: number;
  goalWeight?: number;
  activityLevel?: 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active';
  calorieGoalOverride?: number | null;
  proteinGoalOverride?: number | null;
  waterGoal?: number;
  recentFoods?: RecentFoodItem[];
}

@Injectable()
export class AuthService {
  private googleClient: OAuth2Client;
  
  private readonly GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID
    || '96118425924-fia28il69d3ng7m7o3at72led0oisd7b.apps.googleusercontent.com';

  constructor(@InjectModel(User.name) private userModel: Model<UserDocument>) {
    this.googleClient = new OAuth2Client(this.GOOGLE_CLIENT_ID);
  }

  private toProfileResponse(user: any) {
    return {
      id: user._id,
      email: user.email,
      name: user.name,
      picture: user.picture,
      displayName: user.displayName ?? user.name ?? 'Usuario',
      age: user.age,
      gender: user.gender,
      heightCm: user.heightCm,
      startWeight: user.startWeight,
      currentWeight: user.currentWeight,
      goalWeight: user.goalWeight,
      activityLevel: user.activityLevel,
      calorieGoalOverride: user.calorieGoalOverride ?? null,
      proteinGoalOverride: user.proteinGoalOverride ?? null,
      waterGoal: user.waterGoal,
      calorieGoal: user.calorieGoal,
      recentFoods: user.recentFoods ?? [],
    };
  }

  async verifyGoogleTokenAndLogin(credentialToken: string) {
    try {
      const ticket = await this.googleClient.verifyIdToken({
        idToken: credentialToken,
        audience: this.GOOGLE_CLIENT_ID,
      });
      
      const payload = ticket.getPayload();
      
      if (!payload) {
        throw new UnauthorizedException('Token inválido');
      }

      // Buscar si el usuario ya existe en Mongo
      let user = await this.userModel.findOne({ email: payload.email }).exec();
      
      // Si no existe, registrarlo
      if (!user) {
        user = new this.userModel({
          email: payload.email,
          name: payload.name,
          displayName: payload.name || 'Usuario',
          picture: payload.picture,
          recentFoods: [],
        });
        await user.save();
      }

      // Generar un JWT propio para sesión (mejor control de expiración/revocación)
      const secret = process.env.JWT_SECRET;
      if (!secret) {
        throw new Error('JWT_SECRET no está configurado en las variables de entorno');
      }
      const jwtToken = jwt.sign(
        { sub: user._id.toString(), email: user.email },
        secret,
        { expiresIn: '7d' },
      );

      // Devolvemos la info limpia para Angular con el token propio
      return {
        ...this.toProfileResponse(user),
        token: jwtToken,
      };
      
    } catch (error) {
       throw new UnauthorizedException('Error autenticando con Google', error.message);
    }
  }

  async getUserProfile(userId: string) {
    const user = await this.userModel.findById(userId).exec();
    if (!user) {
      throw new UnauthorizedException('Usuario no encontrado');
    }

    return this.toProfileResponse(user);
  }

  async updateUserProfile(userId: string, profile: UpdateUserProfileDto) {
    const user = await this.userModel.findByIdAndUpdate(
      userId,
      { $set: profile },
      { new: true, upsert: false },
    ).exec();

    if (!user) {
      throw new UnauthorizedException('Usuario no encontrado');
    }

    return this.toProfileResponse(user);
  }
}
