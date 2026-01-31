import { IsEnum, IsNotEmpty } from 'class-validator';
import { EstadoRutero } from '../../../common/constants/route-enums';

export class RouteStatusDto {
    @IsNotEmpty()
    @IsEnum(EstadoRutero)
    status: EstadoRutero;
}
