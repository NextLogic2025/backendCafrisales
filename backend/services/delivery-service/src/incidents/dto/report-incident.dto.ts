import { Transform } from 'class-transformer';
import { IsEnum, IsNotEmpty, IsString, MaxLength } from 'class-validator';
import { SeveridadIncidencia } from '../../common/constants/delivery-enums';

export class ReportIncidentDto {
    @IsNotEmpty({ message: 'tipo_incidencia es requerido' })
    @IsString({ message: 'tipo_incidencia debe ser un string' })
    @MaxLength(100, { message: 'tipo_incidencia no debe exceder 100 caracteres' })
    @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
    tipo_incidencia: string;

    @IsNotEmpty({ message: 'descripcion es requerida' })
    @IsString({ message: 'descripcion debe ser un string' })
    @MaxLength(2000, { message: 'descripcion no debe exceder 2000 caracteres' })
    @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
    descripcion: string;

    @IsNotEmpty({ message: 'severidad es requerida' })
    @IsEnum(SeveridadIncidencia, { message: 'severidad debe ser uno de: baja, media, alta, critica' })
    severidad: SeveridadIncidencia;
}
