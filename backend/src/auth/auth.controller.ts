import { Controller, Post, Body, Get, Patch, Query } from '@nestjs/common';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('google')
  async googleLogin(@Body('token') token: string) {
    return this.authService.verifyGoogleTokenAndLogin(token);
  }

  @Get('profile')
  async getProfile(@Query('userId') userId: string) {
    return this.authService.getUserProfile(userId);
  }

  @Patch('profile')
  async updateProfile(@Body() body: { userId: string, profile: any, recentFoods?: any[] }) {
    return this.authService.updateUserProfile(body.userId, {
      ...body.profile,
      recentFoods: body.recentFoods ?? body.profile?.recentFoods ?? [],
    });
  }
}