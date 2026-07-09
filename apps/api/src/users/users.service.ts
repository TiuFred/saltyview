import { BadRequestException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';

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

  // O admin não aparece no seletor de perfis (tela de login pública) — o acesso dele é só
  // pelo login discreto de e-mail/senha, não pela lista de nomes das pessoas da casa.
  listUsers() {
    return this.prisma.user.findMany({
      where: { email: { not: this.config.get<string>('SEED_ADMIN_EMAIL') } },
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
}
