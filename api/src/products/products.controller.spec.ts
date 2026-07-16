import { ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Role } from '@prisma/client';
import { ROLES_KEY } from '../auth/decorators/roles.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';
import { ProductsController } from './products.controller';

describe('ProductsController guards', () => {
  it('denies vendedor access to POST /products', () => {
    const reflector = new Reflector();
    const roles = reflector.get<Role[]>(ROLES_KEY, ProductsController.prototype.create);
    const guard = new RolesGuard({
      getAllAndOverride: jest.fn().mockReturnValue(roles),
    } as unknown as Reflector);
    const context = {
      getHandler: () => ProductsController.prototype.create,
      getClass: () => ProductsController,
      switchToHttp: () => ({
        getRequest: () => ({
          user: {
            id: 'user-1',
            name: 'Vendedor',
            email: 'vendedor@inventory.local',
            role: Role.vendedor,
          },
        }),
      }),
    } as unknown as ExecutionContext;

    expect(roles).toEqual([Role.almacen]);
    expect(guard.canActivate(context)).toBe(false);
  });
});
