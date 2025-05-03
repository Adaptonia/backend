import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { Response } from 'express';

describe('AuthController', () => {
  let controller: AuthController;
  let service: AuthService;

  const mockAuthService = {
    login: jest.fn((dto) => {
      if (dto.email === 'test@example.com' && dto.password === 'password') {
        return Promise.resolve({
          token: 'fake-jwt-token',
          user: { id: 1, email: dto.email },
        });
      }
      return null;
    }),
  };

  const mockRes = {
    cookie: jest.fn(),
  } as unknown as Response;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: mockAuthService,
        },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
    service = module.get<AuthService>(AuthService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should login a user and return user data', async () => {
    const result = await controller.login(
      { email: 'test@example.com', password: 'password' },
      mockRes,
    );

    expect(result).toEqual({
      message: 'Login successful',
      user: { id: 1, email: 'test@example.com' },
    });
  });

  it('should set auth-token cookie on login', async () => {
    await controller.login(
      { email: 'test@example.com', password: 'password' },
      mockRes,
    );

    expect(mockRes.cookie).toHaveBeenCalledWith(
      'auth-token',
      'fake-jwt-token',
      expect.objectContaining({
        httpOnly: true,
        secure: false,
        sameSite: 'lax',
        maxAge: expect.any(Number),
      }),
    );
  });
});
