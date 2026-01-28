import { Transform } from 'class-transformer';
import { IsEnum, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';
import { TipoEvidencia } from '../../common/constants/delivery-enums';

export class UploadEvidenceDto {
    @IsNotEmpty({ message: 'tipo es requerido' })
    @IsEnum(TipoEvidencia, { message: 'tipo debe ser uno de: foto, firma, documento, audio, otro' })
    tipo: TipoEvidencia;

    @IsOptional()
    @IsString({ message: 'descripcion debe ser un string' })
    @MaxLength(500, { message: 'descripcion no debe exceder 500 caracteres' })
    @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
    descripcion?: string;
}
