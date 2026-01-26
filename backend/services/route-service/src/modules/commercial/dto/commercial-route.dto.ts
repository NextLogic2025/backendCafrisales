import { IsUUID, IsDateString, IsString, IsOptional, IsInt, Min, IsEnum } from 'class-validator';
import { ResultadoVisita } from '../../../common/constants/route-enums';

export class CreateCommercialRouteDto {
    @IsDateString()
    fecha_rutero: string;

    @IsUUID()
    zona_id: string;

    @IsUUID()
    vendedor_id: string;
}

export class AddVisitDto {
    @IsUUID()
    cliente_id: string;

    @IsInt()
    @Min(1)
    orden_visita: number;

    @IsString()
    @IsOptional()
    objetivo?: string;
}

export class UpdateVisitResultDto {
    @IsEnum(ResultadoVisita)
    resultado: ResultadoVisita;

    @IsString()
    @IsOptional()
    notas?: string;
}
