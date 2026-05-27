import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { User } from '../users/schemas/user.schema';

describe('AuthService (Simplified)', () => {
  let service: AuthService;
  let mockUserModel: any;

  beforeEach(async () => {
    mockUserModel = {
      findOne: jest.fn().mockReturnValue({
        exec: jest.fn(),
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: getModelToken(User.name),
          useValue: mockUserModel,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should have verifyGoogleTokenAndLogin method', () => {
    expect(typeof service.verifyGoogleTokenAndLogin).toBe('function');
  });

  describe('Token validation', () => {
    it('should reject null payload', async () => {
      // Mock the google client to return null payload
      const mockTicket = {
        getPayload: jest.fn().mockReturnValue(null),
      };

      service['googleClient'].verifyIdToken = jest.fn().mockResolvedValue(mockTicket);

      try {
        await service.verifyGoogleTokenAndLogin('token');
        fail('Should have thrown');
      } catch (e: any) {
        expect(e).toBeInstanceOf(UnauthorizedException);
      }
    });

    it('should handle token verification errors', async () => {
      service['googleClient'].verifyIdToken = jest
        .fn()
        .mockRejectedValue(new Error('Invalid token'));

      try {
        await service.verifyGoogleTokenAndLogin('invalid_token');
        fail('Should have thrown');
      } catch (e: any) {
        expect(e).toBeInstanceOf(UnauthorizedException);
      }
    });
  });
});
