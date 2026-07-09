import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import type { CreateDeviceDto, DeviceCommand, UpdateDeviceNameDto } from '@casa/shared-types';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { RequestUser } from '../auth/decorators/current-user.decorator';
import { LogsService } from '../logs/logs.service';
import { DevicesService } from './devices.service';
import { SendCommandDto } from './dto/send-command.dto';

@Controller('devices')
@UseGuards(JwtAuthGuard)
export class DevicesController {
  constructor(
    private readonly devicesService: DevicesService,
    private readonly logsService: LogsService,
  ) {}

  @Get()
  list() {
    return this.devicesService.list();
  }

  @Get('lg-available')
  listAvailableLgDevices() {
    return this.devicesService.listAvailableLgDevices();
  }

  @Get('smartthings-available')
  listAvailableSmartThingsDevices() {
    return this.devicesService.listAvailableSmartThingsDevices();
  }

  @Post()
  createDevice(@Body() dto: CreateDeviceDto) {
    return this.devicesService.createDevice(dto);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.devicesService.findOne(id);
  }

  @Patch(':id/name')
  updateName(
    @Param('id') id: string,
    @Body() dto: UpdateDeviceNameDto,
    @CurrentUser() user: RequestUser,
  ) {
    return this.devicesService.updateName(id, dto, user.email);
  }

  @Delete(':id')
  removeDevice(@Param('id') id: string, @CurrentUser() user: RequestUser) {
    return this.devicesService.removeDevice(id, user.email);
  }

  @Get(':id/logs')
  logs(@Param('id') id: string) {
    return this.logsService.listByDevice(id);
  }

  @Post(':id/refresh')
  refresh(@Param('id') id: string) {
    return this.devicesService.refresh(id);
  }

  @Post(':id/commands')
  sendCommand(
    @Param('id') id: string,
    @Body() dto: SendCommandDto,
    @CurrentUser() user: RequestUser,
  ) {
    return this.devicesService.sendCommand(id, dto as DeviceCommand, user.id);
  }
}
