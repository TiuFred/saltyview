import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import type { AuthenticatedUserDto } from '@casa/shared-types';
import { PrismaService } from '../prisma/prisma.service';

const LEGACY_ADMIN_NAME = 'Admin';
const DEFAULT_ADMIN_NAME = 'adm';
const LEGACY_ADMIN_EMAIL = 'admin@example.com';

@Injectable()
export class UsersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {}

  findByEmail(email: string) {
    return this.prisma.user.findUnique({ where: { email } });
  }

  findByName(name: string) {
    return this.prisma.user.findFirst({ where: { name } });
  }

  isAdminUser(user: { email: string; name: string }): boolean {
    const adminEmail = this.config.get<string>('SEED_ADMIN_EMAIL');
    const adminName = this.config.get<string>('SEED_ADMIN_NAME');
    return (
      user.email === adminEmail ||
      user.name === adminName ||
      user.name === DEFAULT_ADMIN_NAME ||
      user.email === LEGACY_ADMIN_EMAIL ||
      user.name === LEGACY_ADMIN_NAME
    );
  }

  toAuthenticatedUser(user: { id: string; name: string; email: string }): AuthenticatedUserDto {
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      isAdmin: this.isAdminUser(user),
    };
  }

  listUsers() {
    return this.prisma.user.findMany({
      select: { id: true, name: true },
      orderBy: { name: 'asc' },
    });
  }

  async createHouseholdUser(name: string, pin: string) {
    const existingUser = await this.prisma.user.findFirst({ where: { name } });
    if (existingUser) {
      throw new BadRequestException('Já existe um usuário com esse nome');
    }

    const pinHash = await bcrypt.hash(pin, 12);
    const createdUser = await this.prisma.user.create({
      data: {
        name,
        email: `${name.toLowerCase().replace(/[^a-z0-9]+/g, '')}@home.local`,
        passwordHash: await bcrypt.hash(`home-${Math.random().toString(36).slice(2)}`, 12),
        pinHash,
      },
      select: { id: true, name: true },
    });

    return createdUser;
  }

  findById(id: string) {
    return this.prisma.user.findUnique({ where: { id } });
  }

  async updatePin(id: string, pin: string) {
    const existingUser = await this.prisma.user.findUnique({ where: { id } });
    if (!existingUser) {
      throw new NotFoundException('Usuário não encontrado');
    }

    const pinHash = await bcrypt.hash(pin, 12);
    return this.prisma.user.update({
      where: { id },
      data: { pinHash },
      select: { id: true, name: true },
    });
  }
}
