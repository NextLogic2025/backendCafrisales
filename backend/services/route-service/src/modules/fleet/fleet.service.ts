import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Vehiculo } from './entities/vehiculo.entity';
import { CreateVehicleDto, UpdateVehicleStatusDto } from './dto/vehicle.dto';

@Injectable()
export class FleetService {
    constructor(
        @InjectRepository(Vehiculo)
        private readonly vehicleRepo: Repository<Vehiculo>,
    ) { }

    async create(dto: CreateVehicleDto, userId: string): Promise<Vehiculo> {
        const existing = await this.vehicleRepo.findOne({ where: { placa: dto.placa } });
        if (existing) {
            throw new ConflictException(`Vehículo con placa ${dto.placa} ya existe`);
        }

        const vehicle = this.vehicleRepo.create({
            ...dto,
            creado_por: userId,
            actualizado_por: userId,
        });

        return this.vehicleRepo.save(vehicle);
    }

    async findAll(): Promise<Vehiculo[]> {
        return this.vehicleRepo.find({ order: { placa: 'ASC' } });
    }

    async findOne(id: string): Promise<Vehiculo> {
        const vehicle = await this.vehicleRepo.findOne({ where: { id } });
        if (!vehicle) {
            throw new NotFoundException(`Vehículo ${id} no encontrado`);
        }
        return vehicle;
    }

    async updateStatus(id: string, dto: UpdateVehicleStatusDto, userId: string): Promise<Vehiculo> {
        const vehicle = await this.findOne(id);
        vehicle.estado = dto.estado;
        vehicle.actualizado_por = userId;
        return this.vehicleRepo.save(vehicle);
    }
}
