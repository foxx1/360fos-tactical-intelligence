import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { IS_PUBLIC_KEY } from './public.decorator';

type SupabaseUser = {
  id: string;
  email?: string;
  [key: string]: unknown;
};

@Injectable()
export class AuthGuard implements CanActivate {
  private readonly supabaseUrl = process.env.SUPABASE_URL!;
  private readonly supabasePublishableKey = process.env.SUPABASE_PUBLISHABLE_KEY!;

  constructor(private readonly reflector: Reflector) {}

  async canActivate(context: ExecutionContext) {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

    const request = context.switchToHttp().getRequest();
    const authorization = request.headers.authorization;
    if (!authorization?.startsWith('Bearer ')) {
      throw new UnauthorizedException('Missing bearer token');
    }

    const token = authorization.slice(7);

    try {
      const response = await fetch(`${this.supabaseUrl}/auth/v1/user`, {
        method: 'GET',
        headers: {
          apikey: this.supabasePublishableKey,
          Authorization: `Bearer ${token}`,
          Accept: 'application/json',
        },
      });

      if (!response.ok) {
        throw new UnauthorizedException('Invalid or expired access token');
      }

      const user = (await response.json()) as SupabaseUser;

      if (!user?.id) {
        throw new UnauthorizedException('Invalid or expired access token');
      }

      request.user = user;
      return true;
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }

      throw new UnauthorizedException('Unable to validate access token');
    }
  }
}
