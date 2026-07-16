import { ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Role } from '@prisma/client';
import { RolesGuard } from './roles.guard';

describe('RolesGuard', () => {
  const buildContext = (role: Role): ExecutionContext =>
    ({
      getHandler: jest.fn(),
      getClass: jest.fn(),
      switchToHttp: () => ({
        getRequest: () => ({
          user: {
            id: 'user-1',
            name: 'Test User',
            email: 'test@inventory.local',
            role,
          },
        }),
      }),
    }) as unknown as ExecutionContext;

  it('allows a matching role', () => {
    const reflector = {
      getAllAndOverride: jest.fn().mockReturnValue([Role.vendedor]),
    } as unknown as Reflector;

    expect(new RolesGuard(reflector).canActivate(buildContext(Role.vendedor))).toBe(true);
  });

  it('denies a non-matching role', () => {
    const reflector = {
      getAllAndOverride: jest.fn().mockReturnValue([Role.almacen]),
    } as unknown as Reflector;

    expect(new RolesGuard(reflector).canActivate(buildContext(Role.vendedor))).toBe(false);
  });

  it('allows admin through every role check', () => {
    const reflector = {
      getAllAndOverride: jest.fn().mockReturnValue([Role.almacen]),
    } as unknown as Reflector;

    expect(new RolesGuard(reflector).canActivate(buildContext(Role.admin))).toBe(true);
  });
});
