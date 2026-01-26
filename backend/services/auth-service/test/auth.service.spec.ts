import { Test, TestingModule } from '@nestjs/testing';
import { DataSource, EntityManager } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import { AuthService } from '../src/modules/auth/auth.service';
import { SessionService } from '../src/modules/auth/services/session.service';
import { OutboxService } from '../src/modules/outbox/outbox.service';
import { RegisterDto } from '../src/modules/auth/dto/register.dto';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Credential } from '../src/modules/auth/entities/credential.entity';
import { Session } from '../src/modules/auth/entities/session.entity';
import { ConfigService } from '@nestjs/config';
import { S2S_CLIENT } from '../src/common/interfaces/s2s-client.interface';

describe('AuthService', () => {
  let service: AuthService;
  let dataSource: DataSource;
  let outboxService: OutboxService;

  // 1. Mock del EntityManager (Simula la transacción)
  const mockRepo = { save: jest.fn().mockResolvedValue({}) };
  const mockEntityManager = {
    create: jest.fn(),
    save: jest.fn(),
    findOne: jest.fn(),
    getRepository: jest.fn().mockReturnValue(mockRepo),
  } as unknown as EntityManager;

  // 2. Mock del DataSource (Intercepta .transaction())
  const mockDataSource = {
    transaction: jest.fn().mockImplementation(async (cb) => {
      return cb(mockEntityManager);
    }),
  } as unknown as DataSource;

  const mockOutboxService = {
    createEvent: jest.fn(),
  } as unknown as OutboxService;

  const mockSessionService = {
    createSession: jest.fn(),
  } as unknown as SessionService;

  const mockJwtService = {
    sign: jest.fn(() => 'test-token'),
  } as unknown as JwtService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: getRepositoryToken(Credential), useValue: {} },
        { provide: getRepositoryToken(Session), useValue: {} },
        { provide: DataSource, useValue: mockDataSource },
        { provide: ConfigService, useValue: { get: jest.fn(() => '') } },
        { provide: S2S_CLIENT, useValue: { get: jest.fn() } },
        { provide: OutboxService, useValue: mockOutboxService },
        { provide: SessionService, useValue: mockSessionService },
        { provide: JwtService, useValue: mockJwtService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    dataSource = module.get<DataSource>(DataSource);
    outboxService = module.get<OutboxService>(OutboxService);

    jest.clearAllMocks();
  });

  describe('register', () => {
    const registerDto: RegisterDto = {
      email: 'test@cafrilosa.com',
      password: 'password123',
      rol: 'cliente' as any,
      nombres: 'Juan' as any,
      apellidos: 'Perez' as any,
    } as any;

    it('debería registrar usuario y crear evento outbox ATÓMICAMENTE', async () => {
      // Setup: Mockear creación de entidad credencial
      (mockEntityManager.create as jest.Mock).mockReturnValue({ id: 'uuid-123' });

      // Ejecución
      const result = await service.register(registerDto);

      // Verificaciones
      // 1. Se inició una transacción
      expect(dataSource.transaction).toHaveBeenCalled();

      // 2. Se guardó la credencial usando el repo devuelto por el manager de la transacción
      expect(mockEntityManager.getRepository).toHaveBeenCalledWith(Credential);
      expect(mockRepo.save).toHaveBeenCalled();

      // 3. CRÍTICO: Se llamó al OutboxService pasando el MISMO manager
      expect(outboxService.createEvent).toHaveBeenCalledWith(
        mockEntityManager,
        expect.objectContaining({
          tipo: 'CredencialCreada',
          claveAgregado: expect.any(String),
          payload: expect.objectContaining({
            email: registerDto.email,
            rol: 'cliente',
          }),
        }),
      );

      expect(result).toHaveProperty('id');
    });

    it('debería fallar todo si el Outbox falla (Rollback implícito)', async () => {
      // Setup: OutboxService lanza error
      (mockOutboxService.createEvent as jest.Mock).mockRejectedValue(new Error('Outbox Error'));

      // Ejecución y Verificación
      await expect(service.register(registerDto)).rejects.toThrow('Outbox Error');
    });
  });
});
