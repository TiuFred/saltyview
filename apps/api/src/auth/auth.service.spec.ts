import { UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { AuthService } from './auth.service';

describe('AuthService', () => {
  const passwordHash = bcrypt.hashSync('super-secret', 10);
  const user = {
    id: 'user-1',
    name: 'Admin',
    email: 'admin@example.com',
    passwordHash,
  };

  const usersService = {
    findByEmail: jest.fn(),
    findByName: jest.fn(),
    findAdminUser: jest.fn(),
    isAdminAlias: jest.fn(),
    ensureConfiguredAdminAccount: jest.fn(),
    findById: jest.fn(),
    toAuthenticatedUser: jest.fn((currentUser) => ({
      id: currentUser.id,
      name: currentUser.name,
      email: currentUser.email,
      isAdmin: currentUser.email === 'admin@example.com' || currentUser.name === 'Administrador',
    })),
  };
  const config = {
    getOrThrow: jest.fn((key: string) =>
      key.includes('SECRET') ? `${key}-value` : key,
    ),
    get: jest.fn((key: string, fallback?: string) => (key === 'SEED_ADMIN_PIN' ? ' "0000" ' : fallback)),
  };

  let authService: AuthService;

  beforeEach(() => {
    jest.clearAllMocks();
    authService = new AuthService(
      usersService as never,
      new JwtService({}),
      config as never,
    );
  });

  describe('validateCredentials', () => {
    it('throws when the user does not exist', async () => {
      usersService.findByEmail.mockResolvedValueOnce(null);
      await expect(
        authService.validateCredentials(user.email, 'super-secret'),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('throws when the password does not match', async () => {
      usersService.findByEmail.mockResolvedValueOnce(user);
      await expect(
        authService.validateCredentials(user.email, 'wrong-password'),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('returns the authenticated user when credentials are valid', async () => {
      usersService.findByEmail.mockResolvedValueOnce(user);
      const result = await authService.validateCredentials(
        user.email,
        'super-secret',
      );
      expect(result).toEqual({
        id: user.id,
        name: user.name,
        email: user.email,
        isAdmin: true,
      });
    });
  });

  describe('validatePinCredentials', () => {
    it('returns the authenticated admin when the admin PIN is valid', async () => {
      usersService.isAdminAlias.mockReturnValueOnce(true);
      usersService.ensureConfiguredAdminAccount.mockResolvedValueOnce({ ...user, name: 'Administrador', pinHash: bcrypt.hashSync('0000', 10) });
      const result = await authService.validatePinCredentials('Administrador', '0000');
      expect(result).toEqual({ id: user.id, name: 'Administrador', email: user.email, isAdmin: true });
      expect(usersService.ensureConfiguredAdminAccount).toHaveBeenCalledWith('0000');
    });

    it('returns the authenticated user when a household PIN is valid', async () => {
      usersService.isAdminAlias.mockReturnValueOnce(false);
      usersService.findByName.mockResolvedValueOnce({ ...user, pinHash: bcrypt.hashSync('1234', 10) });
      const result = await authService.validatePinCredentials('Ana', '1234');
      expect(result).toEqual({ id: user.id, name: user.name, email: user.email, isAdmin: true });
    });

    it('throws when the PIN does not match', async () => {
      usersService.isAdminAlias.mockReturnValueOnce(true);
      usersService.findAdminUser.mockResolvedValueOnce({ ...user, pinHash: bcrypt.hashSync('1234', 10) });
      await expect(authService.validatePinCredentials('Administrador', '9999')).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('issueTokens / refresh', () => {
    it('issues an access and refresh token that round-trip through refresh()', async () => {
      const tokens = authService.issueTokens({
        id: user.id,
        name: user.name,
        email: user.email,
        isAdmin: true,
      });
      expect(tokens.accessToken).toEqual(expect.any(String));
      expect(tokens.refreshToken).toEqual(expect.any(String));

      usersService.findById.mockResolvedValueOnce(user);
      const refreshed = await authService.refresh(tokens.refreshToken);
      expect(refreshed.accessToken).toEqual(expect.any(String));
    });

    it('rejects a malformed refresh token', async () => {
      await expect(authService.refresh('not-a-jwt')).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });
});
