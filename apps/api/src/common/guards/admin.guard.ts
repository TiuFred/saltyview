import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { RequestUser } from '../../auth/decorators/current-user.decorator';

interface RequestWithUser {
  user: RequestUser;
}

const LEGACY_ADMIN_NAME = 'Admin';
const LEGACY_ADMIN_EMAIL = 'admin@example.com';

// O perfil admin atual pode ser identificado pelo e-mail ou pelo nome configurados no ambiente.
// Precisa rodar depois do JwtAuthGuard (que popula request.user).
@Injectable()
export class AdminGuard implements CanActivate {
  constructor(private readonly config: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<RequestWithUser>();
    const adminEmail = this.config.get<string>('SEED_ADMIN_EMAIL');
    const adminName = this.config.get<string>('SEED_ADMIN_NAME');

    const isAdmin =
      request.user?.email === adminEmail ||
      request.user?.name === adminName ||
      request.user?.email === LEGACY_ADMIN_EMAIL ||
      request.user?.name === LEGACY_ADMIN_NAME;

    if (!isAdmin) {
      throw new ForbiddenException('Apenas o administrador pode realizar esta ação.');
    }

    return true;
  }
}
