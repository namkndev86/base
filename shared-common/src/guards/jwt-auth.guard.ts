import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const userId = request.user?.id || request.headers['x-user-id'];
    
    if (!userId) {
      throw new UnauthorizedException('Authentication context is missing');
    }
    
    return true;
  }
}
