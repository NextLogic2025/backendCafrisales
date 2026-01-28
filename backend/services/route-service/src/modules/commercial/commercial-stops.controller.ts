import { Body, Controller, Param, Put, UseGuards, ParseUUIDPipe } from '@nestjs/common';
import { CommercialService } from './commercial.service';
import { UpdateVisitResultDto } from './dto/commercial-route.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser, AuthUser } from '../../common/decorators/current-user.decorator';
import { RolUsuario } from '../../common/constants/rol-usuario.enum';

@Controller('paradas-comerciales')
@UseGuards(JwtAuthGuard, RolesGuard)
export class CommercialStopsController {
    constructor(private readonly commercialService: CommercialService) { }

    @Put(':stopId/checkin')
    @Roles(RolUsuario.VENDEDOR)
    checkin(@Param('stopId', ParseUUIDPipe) stopId: string, @CurrentUser() user: AuthUser) {
        return this.commercialService.checkin(stopId, user.userId);
    }

    @Put(':stopId/checkout')
    @Roles(RolUsuario.VENDEDOR)
    checkout(
        @Param('stopId', ParseUUIDPipe) stopId: string,
        @Body() dto: UpdateVisitResultDto,
        @CurrentUser() user: AuthUser,
    ) {
        return this.commercialService.checkout(stopId, user.userId, dto);
    }
}
