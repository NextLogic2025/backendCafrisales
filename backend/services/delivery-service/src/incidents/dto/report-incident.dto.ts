import { IsEnum, IsNotEmpty, IsString } from 'class-validator';
import { SeveridadIncidencia } from '../../common/constants/delivery-enums';

export class ReportIncidentDto {
    @IsNotEmpty()
    @IsString()
    titulo: string;

    @IsNotEmpty()
    @IsString()
    descripcion: string;

    @IsNotEmpty()
    @IsEnum(SeveridadIncidencia)
    severidad: SeveridadIncidencia;
}
