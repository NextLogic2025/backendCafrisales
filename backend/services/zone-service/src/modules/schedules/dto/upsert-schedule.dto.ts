import { IsInt, IsBoolean, IsOptional, Min, Max } from 'class-validator';

/**
 * DTO para crear o actualizar un horario de zona.
 * dia_semana: 0=Domingo, 6=Sábado (según BD CHECK constraint).
 */
export class UpsertScheduleDto {
    @IsInt()
    @Min(0, { message: 'dia_semana debe ser entre 0 (Domingo) y 6 (Sábado)' })
    @Max(6, { message: 'dia_semana debe ser entre 0 (Domingo) y 6 (Sábado)' })
    @IsOptional()
    diaSemana?: number;

    @IsBoolean()
    @IsOptional()
    entregasHabilitadas?: boolean;

    @IsBoolean()
    @IsOptional()
    visitasHabilitadas?: boolean;
}
