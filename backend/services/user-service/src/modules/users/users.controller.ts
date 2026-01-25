import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import { UsersService } from './users.service';

@Controller('usuarios')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  async create(@Body() body: any) {
    const created = await this.usersService.create(body);
    return created;
  }

  @Get(':id')
  async get(@Param('id') id: string) {
    return this.usersService.findById(id);
  }

  @Patch(':id')
  async patch(@Param('id') id: string, @Body() body: any) {
    return this.usersService.update(id, body);
  }
}
