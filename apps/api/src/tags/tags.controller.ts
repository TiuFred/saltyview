import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AdminGuard } from '../common/guards/admin.guard';
import { CreateTagDto } from './dto/create-tag.dto';
import { UpdateTagDto } from './dto/update-tag.dto';
import { TagsService } from './tags.service';

@Controller('tags')
@UseGuards(JwtAuthGuard)
export class TagsController {
  constructor(private readonly tagsService: TagsService) {}

  @Get()
  list() {
    return this.tagsService.list();
  }

  @Post()
  @UseGuards(AdminGuard)
  create(@Body() dto: CreateTagDto) {
    return this.tagsService.create(dto);
  }

  @Get(':id/usage')
  @UseGuards(AdminGuard)
  getUsage(@Param('id') id: string) {
    return this.tagsService.getUsage(id);
  }

  @Patch(':id')
  @UseGuards(AdminGuard)
  rename(@Param('id') id: string, @Body() dto: UpdateTagDto) {
    return this.tagsService.rename(id, dto);
  }

  @Delete(':id')
  @UseGuards(AdminGuard)
  remove(@Param('id') id: string) {
    return this.tagsService.remove(id);
  }
}
