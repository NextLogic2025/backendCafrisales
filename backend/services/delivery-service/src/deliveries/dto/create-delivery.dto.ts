import { IsNotEmpty, IsOptional, IsString, IsNumber, IsDateString, IsUUID, Min, Max } from 'class-validator';

export class CreateDeliveryDto {
    @IsNotEmpty()
    @IsUUID()
    pedidoId: string;

    @IsOptional()
    @IsUUID()
    rutaLogisticaId?: string;

    @IsOptional()
    @IsUUID()
    conductorId?: string;

    @IsOptional()
    @IsUUID()
    vehiculoId?: string;

    @IsNotEmpty()
    @IsString()
    direccionEntrega: string;

    @IsOptional()
    @IsNumber()
    @Min(-90)
    @Max(90)
    latitudEntrega?: number;

    @IsOptional()
    @IsNumber()
    @Min(-180)
    @Max(180)
    longitudEntrega?: number;

    @IsOptional()
    @IsDateString()
    fechaProgramada?: string;

    @IsNotEmpty()
    @IsString()
    clienteNombre: string;

    @IsOptional()
    @IsString()
    clienteTelefono?: string;

    @IsOptional()
    @IsString()
    observaciones?: string;

    @IsNotEmpty()
    @IsNumber()
    @Min(0)
    cantidadItemsTotal: number;
}
