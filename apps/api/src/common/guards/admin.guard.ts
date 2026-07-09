import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { RequestUser } from '../../auth/decorators/current-user.decorator';

interface RequestWithUser {
  user: RequestUser;
}

// Só existe um "admin" hoje: o e-mail configurado em SEED_ADMIN_EMAIL. Precisa rodar depois do
// JwtAuthGuard (que popula request.user).
@Injectable()
export class AdminGuard implements CanActivate {
  constructor(private readonly config: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<RequestWithUser>();
    const adminEmail = this.config.get<string>('SEED_ADMIN_EMAIL');

    if (request.user?.email !== adminEmail) {
      throw new ForbiddenException('Apenas o administrador pode realizar esta ação.');
    }

    return true;
  }
}
