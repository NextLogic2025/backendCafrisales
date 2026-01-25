import { Test, TestingModule } from '@nestjs/testing';
import { RoleProvisionService } from './role-provision.service';
import { EntityManager } from 'typeorm';

describe('RoleProvisionService', () => {
  let service: RoleProvisionService;

  const mockQueryBuilder = {
    insert: jest.fn().mockReturnThis(),
    into: jest.fn().mockReturnThis(),
    values: jest.fn().mockReturnThis(),
    orIgnore: jest.fn().mockReturnThis(),
    execute: jest.fn().mockResolvedValue({}),
  };

  const mockManager = {
    createQueryBuilder: jest.fn().mockReturnValue(mockQueryBuilder),
  } as unknown as EntityManager;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [RoleProvisionService],
    }).compile();

    service = module.get<RoleProvisionService>(RoleProvisionService);
    jest.clearAllMocks();
  });

  it('debería insertar en app.supervisores cuando el rol es SUPERVISOR', async () => {
    const dto: any = { rol: 'supervisor', supervisor: { codigo_empleado: 'SUP-001' } };
    const userId = 'uuid-123';

    await service.provisionRole(mockManager, userId, dto as any);

    expect(mockQueryBuilder.into).toHaveBeenCalledWith('app.supervisores');
    expect(mockQueryBuilder.values).toHaveBeenCalledWith({ usuario_id: userId, codigo_empleado: 'SUP-001' });
    expect(mockQueryBuilder.orIgnore).toHaveBeenCalled();
  });

  it('debería insertar en app.vendedores con supervisor_id cuando es VENDEDOR', async () => {
    const dto: any = { rol: 'vendedor', vendedor: { codigo_empleado: 'VEN-001', supervisor_id: 'uuid-sup' } };

    await service.provisionRole(mockManager, 'uuid-ven', dto as any);

    expect(mockQueryBuilder.into).toHaveBeenCalledWith('app.vendedores');
    expect(mockQueryBuilder.values).toHaveBeenCalledWith(expect.objectContaining({ supervisor_id: 'uuid-sup' }));
  });
});
