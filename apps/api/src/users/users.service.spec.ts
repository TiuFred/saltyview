import { BadRequestException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { UsersService } from './users.service';

describe('UsersService', () => {
  const prisma = {
    user: {
      findFirst: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
    },
  };
  const config = { get: jest.fn(() => 'admin@example.com') };

  let usersService: UsersService;

  beforeEach(() => {
    jest.clearAllMocks();
    usersService = new UsersService(prisma as unknown as PrismaService, config as never);
  });

  it('creates a user with a generated email and hashed pin', async () => {
    prisma.user.findFirst.mockResolvedValueOnce(null);
    prisma.user.create.mockResolvedValueOnce({
      id: 'user-1',
      name: 'Ana',
    });

    const result = await usersService.createHouseholdUser('Ana', '1234');

    expect(result).toEqual({ id: 'user-1', name: 'Ana' });
    expect(prisma.user.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          name: 'Ana',
          email: 'ana@home.local',
        }),
      }),
    );

    const createdData = prisma.user.create.mock.calls[0][0].data;
    expect(createdData.pinHash).not.toEqual('1234');
    await expect(bcrypt.compare('1234', createdData.pinHash)).resolves.toBe(true);
  });

  it('rejects duplicate names', async () => {
    prisma.user.findFirst.mockResolvedValueOnce({ id: 'user-1', name: 'Ana' });

    await expect(usersService.createHouseholdUser('Ana', '1234')).rejects.toThrow(BadRequestException);
  });
});
