import { ExecutionContext, Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

/**
 * Versão "opcional" do JwtAuthGuard:
 * - Se o request tem Authorization válido, popula req.user.
 * - Se não tem (ou está inválido), continua sem user (não falha).
 *
 * Útil em rotas públicas que mudam o que retornam quando autenticadas
 * (ex.: autor pode ver seu próprio rascunho).
 */
@Injectable()
export class OptionalJwtAuthGuard extends AuthGuard('jwt') {
  handleRequest<TUser>(_err: unknown, user: TUser | null): TUser | null {
    return user ?? null;
  }

  canActivate(context: ExecutionContext) {
    return super.canActivate(context);
  }
}
