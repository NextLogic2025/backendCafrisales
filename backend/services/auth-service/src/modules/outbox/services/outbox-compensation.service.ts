import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Credential } from '../../auth/entities/credential.entity';
import { OutboxEvento } from '../entities/outbox.entity';

@Injectable()
export class OutboxCompensationService {
  private readonly logger = new Logger(OutboxCompensationService.name);

  constructor(
    @InjectRepository(Credential)
    private readonly credRepo: Repository<Credential>,

    @InjectRepository(OutboxEvento)
    private readonly outboxRepo: Repository<OutboxEvento>,
  ) {}

  /**
   * Ejecuta la lógica de compensación cuando un evento falla definitivamente.
   * Nota: La tabla `credenciales` debe adaptar columnas para soft-delete (p.ej. `estado`, `bloqueado_motivo`).
   */
  async compensate(evento: OutboxEvento, error: any): Promise<void> {
    this.logger.warn(`Iniciando compensación para evento ${evento.id}. Causa: ${error?.message || error}`);

    try {
      const usuarioId = evento.clave_agregado || (evento.payload && (evento.payload.id || evento.payload.usuario_id));
      if (!usuarioId) {
        this.logger.warn('No se encontró usuario objetivo para compensación');
      } else {
        // Intentar actualizar estado a 'bloqueado' si la columna existe.
        try {
          await this.credRepo.update({ id: usuarioId } as any, {
            // Estos campos requieren migración en DB: estado, bloqueado_motivo
            // Si no existen, la actualización se ignorará por TypeORM o fallará según configuración.
            // Ajusta según tu esquema: podrías usar soft-delete real o marcar en otra tabla de auditoría.
            estado: 'bloqueado',
            bloqueado_motivo: 'error_sincronizacion_s2s',
          } as any);
          this.logger.log(`Credencial ${usuarioId} marcada como bloqueada (soft).`);
        } catch (e) {
          this.logger.warn('No fue posible marcar credencial como bloqueada (columna ausente?), intentando borrado físico como fallback');
          try {
            await this.credRepo.delete({ id: usuarioId } as any);
            this.logger.log(`Credencial ${usuarioId} eliminada físicamente como fallback de compensación.`);
          } catch (delErr) {
            this.logger.error('Fallo al intentar borrar credencial como fallback', delErr);
          }
        }
      }

      evento.procesado_en = new Date();
      evento.ultimo_error = JSON.stringify({ message: error?.message || String(error), compensation_applied: true, timestamp: new Date() });
      await this.outboxRepo.save(evento);

      this.logger.log(`Compensación completada para evento ${evento.id}`);
    } catch (compErr) {
      this.logger.error(`CRÍTICO: Falló la compensación del evento ${evento.id}`, compErr);
      // Aquí se podrían disparar alertas externas.
    }
  }
}
