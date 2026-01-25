import { Controller, Post, Body, UseGuards, Inject, Logger, Req, ConflictException } from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { RolesGuard } from '../../common/guards/roles.guard';

@Controller('internal/usuarios')
@UseGuards(RolesGuard)
export class UsersInternalController {
  private readonly logger = new Logger(UsersInternalController.name);
  constructor(private readonly usersService: UsersService) {}

  @Post('sync')
  async syncUser(@Body() dto: CreateUserDto, @Req() req: any) {
    // idempotency: if exists, return quickly
    const exists = await this.usersService.findById((dto as any).id);
    if (exists) return { status: 'already_exists', id: (dto as any).id };
    try {
      const created = await this.usersService.create(dto as any);
      return { status: 'created', id: created.id };
    } catch (err: any) {
      // map DB unique violations to 409 for outbox processor handling
      if (err && err.code === '23505') {
        throw new ConflictException('Resource conflict in user-service');
      }
      throw err;
    }
  }
}
