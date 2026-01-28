import { Transform } from 'class-transformer';
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class ResolveIncidentDto {
    @IsNotEmpty({ message: 'resolucion es requerida' })
    @IsString({ message: 'resolucion debe ser un string' })
    @MaxLength(2000, { message: 'resolucion no debe exceder 2000 caracteres' })
    @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
    resolucion: string;
}
