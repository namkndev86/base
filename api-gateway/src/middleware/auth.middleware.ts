import { Injectable, NestMiddleware, UnauthorizedException, Inject, OnModuleInit } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { ClientGrpc } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';

// Define gRPC interface based on identity.proto
interface ValidateTokenResponse {
  isValid: boolean;
  userId?: string;
  tenantId?: string;
  roles?: string[];
  permissions?: string[];
  email?: string;
}

interface IdentityServiceGrpc {
  validateToken(data: { accessToken: string }): { toPromise(): Promise<ValidateTokenResponse> };
}

@Injectable()
export class AuthMiddleware implements NestMiddleware, OnModuleInit {
  private identityService: IdentityServiceGrpc;

  constructor(
    @Inject('IDENTITY_GRPC_SERVICE') private readonly client: ClientGrpc,
  ) {}

  onModuleInit() {
    // Resolve the gRPC service interface
    this.identityService = this.client.getService<IdentityServiceGrpc>('IdentityService');
  }

  async use(req: Request, res: Response, next: NextFunction) {
    const authHeader = req.headers['authorization'];
    if (!authHeader) {
      // Allow anonymous requests - guards downstream will enforce authorization if required
      return next();
    }

    const parts = authHeader.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
      throw new UnauthorizedException('Invalid authorization format');
    }

    const token = parts[1];

    try {
      // Call Identity Service over gRPC to validate the token
      // Using standard rxjs wrapper to promise conversion
      const response = await firstValueFrom(
        (this.identityService as any).validateToken({ accessToken: token })
      ) as ValidateTokenResponse;

      if (!response.isValid || !response.userId) {
        throw new UnauthorizedException('Invalid or expired token');
      }

      // Inject validated user information into headers for routing to other services
      req.headers['x-user-id'] = response.userId;
      req.headers['x-tenant-id'] = response.tenantId || '';
      req.headers['x-user-email'] = response.email || '';
      req.headers['x-user-roles'] = response.roles ? response.roles.join(',') : '';
      req.headers['x-user-permissions'] = response.permissions ? response.permissions.join(',') : '';

      // Also attach to request object for local use if needed
      (req as any).user = {
        id: response.userId,
        tenantId: response.tenantId,
        roles: response.roles || [],
        permissions: response.permissions || [],
        email: response.email,
      };

      next();
    } catch (err) {
      throw new UnauthorizedException(err.message || 'Token validation failed');
    }
  }
}
