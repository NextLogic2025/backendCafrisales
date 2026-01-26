import { IsUUID, IsDateString, IsInt, Min } from 'class-validator';

export class CreateLogisticRouteDto {
    @IsDateString()
    fecha_rutero: string;

    @IsUUID()
    zona_id: string;

    @IsUUID()
    vehiculo_id: string;

    @IsUUID()
    transportista_id: string;
}

export class AddOrderDto {
    @IsUUID()
    pedido_id: string;

    @IsInt()
    @Min(1)
    orden_entrega: number;
}
