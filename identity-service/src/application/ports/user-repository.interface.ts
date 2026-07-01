import { UserEntity } from '../../domain/user.entity';

export interface IUserRepository {
  findById(id: string): Promise<UserEntity | null>;
  findByEmail(email: string): Promise<UserEntity | null>;
  create(user: UserEntity, passwordHash: string): Promise<UserEntity>;
  update(user: UserEntity): Promise<UserEntity>;
  verifyPassword(userId: string, passwordPlain: string): Promise<boolean>;
  
  // Refresh Token operations
  saveRefreshToken(userId: string, token: string, expiresAt: Date): Promise<void>;
  findRefreshToken(token: string): Promise<{ userId: string; isRevoked: boolean; expiresAt: Date } | null>;
  revokeRefreshToken(token: string): Promise<void>;

  // Session operations
  createSession(userId: string, userAgent?: string, ipAddress?: string, expiresAt?: Date): Promise<string>;
  revokeSession(sessionId: string): Promise<void>;
}
