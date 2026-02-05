import { Exclude, Expose } from 'class-transformer';

@Exclude()
export class ScheduleResponseDto {
    @Expose()
    id: string;

    @Expose()
    diaSemana: number;

    @Expose()
    entregasHabilitadas: boolean;

    @Expose()
    visitasHabilitadas: boolean;
}
