import { Injectable, Inject, ConflictException, UnauthorizedException, NotFoundException } from '@nestjs/common';
import { IUserRepository } from '../ports/user-repository.interface';
import { UserEntity } from '../../domain/user.entity';
import { JwtService } from '../../infrastructure/security/jwt.service';
import { NatsClientService } from '@platform/shared-sdk';

@Injectable()
export class IdentityApplicationService {
  constructor(
    @Inject('IUserRepository') private readonly userRepository: IUserRepository,
    private readonly jwtService: JwtService,
    private readonly natsClient: NatsClientService,
  ) {}

  async register(email: string, passwordPlain: string, tenantId?: string) {
    const existingUser = await this.userRepository.findByEmail(email);
    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }

    const newUser = UserEntity.create(email, tenantId || null);
    const createdUser = await this.userRepository.create(newUser, passwordPlain);

    // Emit UserCreatedEvent via NATS
    await this.natsClient.emitEvent('user.created', {
      userId: createdUser.id,
      email: createdUser.getEmail(),
      tenantId: createdUser.tenantId,
      roles: ['USER'],
    });

    return {
      userId: createdUser.id,
      email: createdUser.getEmail(),
      tenantId: createdUser.tenantId,
    };
  }

  async login(email: string, passwordPlain: string, userAgent?: string, ipAddress?: string) {
    const user = await this.userRepository.findByEmail(email);
    if (!user || !user.getIsActive()) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await this.userRepository.verifyPassword(user.id, passwordPlain);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Default roles / permissions for demo.
    // In production, authorization-service maps user role policies.
    const roles = ['USER'];
    const permissions = ['read:profile'];

    const accessToken = this.jwtService.sign({
      sub: user.id,
      email: user.getEmail(),
      tenantId: user.tenantId,
      roles,
      permissions,
    }, 3600); // 1 Hour

    const refreshToken = this.jwtService.sign({
      sub: user.id,
    }, 3600 * 24 * 7); // 7 Days

    await this.userRepository.saveRefreshToken(user.id, refreshToken, new Date(Date.now() + 3600 * 24 * 7 * 1000));
    await this.userRepository.createSession(user.id, userAgent, ipAddress, new Date(Date.now() + 3600 * 24 * 1000));

    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        email: user.getEmail(),
        tenantId: user.tenantId,
      },
    };
  }

  async refreshToken(token: string) {
    const payload = this.jwtService.verify(token);
    if (!payload || !payload.sub) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const storedToken = await this.userRepository.findRefreshToken(token);
    if (!storedToken || storedToken.isRevoked || storedToken.expiresAt < new Date()) {
      throw new UnauthorizedException('Refresh token is invalid or expired');
    }

    const user = await this.userRepository.findById(payload.sub);
    if (!user || !user.getIsActive()) {
      throw new UnauthorizedException('User is inactive or not found');
    }

    const accessToken = this.jwtService.sign({
      sub: user.id,
      email: user.getEmail(),
      tenantId: user.tenantId,
      roles: ['USER'],
      permissions: ['read:profile'],
    }, 3600);

    return {
      accessToken,
    };
  }

  async validateToken(accessToken: string) {
    const payload = this.jwtService.verify(accessToken);
    if (!payload) {
      return { isValid: false };
    }

    return {
      isValid: true,
      userId: payload.sub,
      tenantId: payload.tenantId || '',
      roles: payload.roles || [],
      permissions: payload.permissions || [],
      email: payload.email || '',
    };
  }

  async getUser(userId: string) {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return {
      userId: user.id,
      email: user.getEmail(),
      tenantId: user.tenantId,
      isActive: user.getIsActive(),
      roles: ['USER'],
    };
  }
}
