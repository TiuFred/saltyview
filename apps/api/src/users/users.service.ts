import { BadRequestException, Injectable } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  findByEmail(email: string) {
    return this.prisma.user.findUnique({ where: { email } });
  }

  findByName(name: string) {
    return this.prisma.user.findFirst({ where: { name } });
  }

  listUsers() {
    return this.prisma.user.findMany({ select: { id: true, name: true }, orderBy: { name: 'asc' } });
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
