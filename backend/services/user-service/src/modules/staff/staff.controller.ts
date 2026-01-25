import { Controller, Get } from '@nestjs/common';

@Controller('staff')
export class StaffController {
  @Get()
  list() {
    return [];
  }
}
