import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import type { TagDto } from '@casa/shared-types';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTagDto } from './dto/create-tag.dto';
import { UpdateTagDto } from './dto/update-tag.dto';

function toTagDto(tag: { id: string; name: string; createdAt: Date }): TagDto {
  return { id: tag.id, name: tag.name, createdAt: tag.createdAt.toISOString() };
}

@Injectable()
export class TagsService {
  constructor(private readonly prisma: PrismaService) {}

  async list(): Promise<TagDto[]> {
    const tags = await this.prisma.tag.findMany({ orderBy: { name: 'asc' } });
    return tags.map(toTagDto);
  }

  async create(dto: CreateTagDto): Promise<TagDto> {
    try {
      const tag = await this.prisma.tag.create({ data: { name: dto.name.trim() } });
      return toTagDto(tag);
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new ConflictException('Já existe uma tag com esse nome.');
      }
      throw error;
    }
  }

  async rename(id: string, dto: UpdateTagDto): Promise<TagDto> {
    await this.getTagOrThrow(id);
    try {
      const tag = await this.prisma.tag.update({ where: { id }, data: { name: dto.name.trim() } });
      return toTagDto(tag);
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new ConflictException('Já existe uma tag com esse nome.');
      }
      throw error;
    }
  }

  // Chamado pela UI antes de exibir a confirmação de exclusão — a exclusão em si (m:n implícito
  // com onDelete: Cascade na tabela de junção) desassocia silenciosamente de todos os devices.
  async getUsage(id: string): Promise<{ deviceCount: number }> {
    const tag = await this.prisma.tag.findUnique({
      where: { id },
      include: { _count: { select: { devices: true } } },
    });
    if (!tag) {
      throw new NotFoundException('Tag não encontrada');
    }
    return { deviceCount: tag._count.devices };
  }

  async remove(id: string): Promise<void> {
    await this.getTagOrThrow(id);
    await this.prisma.tag.delete({ where: { id } });
  }

  private async getTagOrThrow(id: string) {
    const tag = await this.prisma.tag.findUnique({ where: { id } });
    if (!tag) {
      throw new NotFoundException('Tag não encontrada');
    }
    return tag;
  }
}
