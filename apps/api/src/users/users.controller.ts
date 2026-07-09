import { Body, Controller, Param, Patch, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AdminGuard } from '../common/guards/admin.guard';
import { UpdateUserPinDto } from './dto/update-user-pin.dto';
import { UsersService } from './users.service';

@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Patch(':id/pin')
  @UseGuards(AdminGuard)
  updatePin(@Param('id') id: string, @Body() dto: UpdateUserPinDto) {
    return this.usersService.updatePin(id, dto.pin);
  }
}
