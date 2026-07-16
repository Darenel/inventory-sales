import { UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Role } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { AuthService } from './auth.service';

describe('AuthService', () => {
  const jwtService = {
    signAsync: jest.fn().mockResolvedValue('signed.jwt.token'),
  } as unknown as JwtService;

  const prisma = {
    user: {
      findUnique: jest.fn(),
    },
  } as unknown as PrismaService;

  let service: AuthService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new AuthService(prisma, jwtService);
  });

  it('logs in with valid credentials', async () => {
    const passwordHash = await bcrypt.hash('demo1234', 4);
    jest.spyOn(prisma.user, 'findUnique').mockResolvedValue({
      id: 'user-1',
      name: 'Darenel Admin',
      email: 'admin@inventory.local',
      passwordHash,
      role: Role.admin,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    await expect(service.login({ email: 'admin@inventory.local', password: 'demo1234' })).resolves.toEqual({
      accessToken: 'signed.jwt.token',
      user: {
        id: 'user-1',
        name: 'Darenel Admin',
        email: 'admin@inventory.local',
        role: Role.admin,
      },
    });
  });

  it('rejects a wrong password', async () => {
    const passwordHash = await bcrypt.hash('demo1234', 4);
    jest.spyOn(prisma.user, 'findUnique').mockResolvedValue({
      id: 'user-1',
      name: 'Darenel Admin',
      email: 'admin@inventory.local',
      passwordHash,
      role: Role.admin,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    await expect(service.login({ email: 'admin@inventory.local', password: 'not-right' })).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });

  it('rejects an unknown email', async () => {
    jest.spyOn(prisma.user, 'findUnique').mockResolvedValue(null);

    await expect(service.login({ email: 'missing@inventory.local', password: 'demo1234' })).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });
});
