import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';

describe('AuthController', () => {
  let controller: AuthController;
  let service: AuthService;

  const mockUser = {
    id: '000000000000000000000001',
    email: 'test@example.com',
    name: 'Test User',
    picture: 'https://example.com/pic.jpg',
    token: 'token123',
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: {
            verifyGoogleTokenAndLogin: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
    service = module.get<AuthService>(AuthService);
  });

  describe('googleLogin', () => {
    it('should return user on successful token verification', async () => {
      jest.spyOn(service, 'verifyGoogleTokenAndLogin').mockResolvedValue(mockUser);

      const result = await controller.googleLogin('valid_token');

      expect(result).toEqual(mockUser);
      expect(service.verifyGoogleTokenAndLogin).toHaveBeenCalledWith('valid_token');
    });

    it('should include user fields in response', async () => {
      jest.spyOn(service, 'verifyGoogleTokenAndLogin').mockResolvedValue(mockUser);

      const result = await controller.googleLogin('token');

      expect(result).toHaveProperty('id');
      expect(result).toHaveProperty('email');
      expect(result).toHaveProperty('name');
      expect(result).toHaveProperty('picture');
      expect(result).toHaveProperty('token');
    });

    it('should throw error on invalid token', async () => {
      jest
        .spyOn(service, 'verifyGoogleTokenAndLogin')
        .mockRejectedValue(new UnauthorizedException('Invalid token'));

      await expect(controller.googleLogin('invalid_token')).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });
});
