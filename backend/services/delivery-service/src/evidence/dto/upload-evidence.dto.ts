import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { TipoEvidencia } from '../../common/constants/delivery-enums';

export class UploadEvidenceDto {
    @IsNotEmpty()
    @IsEnum(TipoEvidencia)
    tipo: TipoEvidencia;

    @IsOptional()
    @IsString()
    descripcion?: string;
}
