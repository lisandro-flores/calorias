import { Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { OAuth2Client } from 'google-auth-library';
import { User, UserDocument } from '../users/schemas/user.schema';

@Injectable()
export class AuthService {
  private googleClient: OAuth2Client;
  
  // EL MISMO CLIENT ID QUE CONFIGURASTE EN ANGULAR
  private readonly GOOGLE_CLIENT_ID = '96118425924-fia28il69d3ng7m7o3at72led0oisd7b.apps.googleusercontent.com';

  constructor(@InjectModel(User.name) private userModel: Model<UserDocument>) {
    this.googleClient = new OAuth2Client(this.GOOGLE_CLIENT_ID);
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
          picture: payload.picture,
        });
        await user.save();
      }

      // Devolvemos la info limpia para Angular
      return {
        id: user._id,
        email: user.email,
        name: user.name,
        picture: user.picture,
        token: credentialToken // O podrías generar y firmar tu propio JWT local aquí
      };
      
    } catch (error) {
       throw new UnauthorizedException('Error autenticando con Google', error.message);
    }
  }
}
