import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AccionClienteValidacion } from './entities/accion-cliente-validacion.entity';
import { CreateAccionDto } from './dto/create-accion.dto';

@Injectable()
export class ActionsService {
    constructor(
        @InjectRepository(AccionClienteValidacion)
        private readonly accionRepo: Repository<AccionClienteValidacion>,
    ) { }

    /**
     * Create a client action on a validation
     */
    async create(dto: CreateAccionDto): Promise<AccionClienteValidacion> {
        const accion = this.accionRepo.create(dto);
        return this.accionRepo.save(accion);
    }

    /**
     * Find actions by validation
     */
    async findByValidation(validacionId: string): Promise<AccionClienteValidacion[]> {
        return this.accionRepo.find({
            where: { validacion_id: validacionId },
            order: { creado_en: 'DESC' },
        });
    }
}
