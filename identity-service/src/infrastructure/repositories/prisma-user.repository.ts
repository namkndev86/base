import { Injectable } from '@nestjs/common';
import { IUserRepository } from '../../application/ports/user-repository.interface';
import { UserEntity } from '../../domain/user.entity';
import { pbkdf2Sync, randomBytes } from 'crypto';

// In-memory implementation for fallback if Prisma is not connected,
// or actual database mapping using mock/real clients.
@Injectable()
export class PrismaUserRepository implements IUserRepository {
  private users: Map<string, { entity: UserEntity; passwordHash: string }> = new Map();
  private refreshTokens: Map<string, { userId: string; isRevoked: boolean; expiresAt: Date }> = new Map();
  private sessions: Set<string> = new Set();

  async findById(id: string): Promise<UserEntity | null> {
    const user = this.users.get(id);
    return user ? user.entity : null;
  }

  async findByEmail(email: string): Promise<UserEntity | null> {
    for (const record of this.users.values()) {
      if (record.entity.getEmail().toLowerCase() === email.toLowerCase()) {
        return record.entity;
      }
    }
    return null;
  }

  async create(user: UserEntity, passwordHash: string): Promise<UserEntity> {
    const userId = user.id || `u-${Math.random().toString(36).substr(2, 9)}`;
    const createdUser = new UserEntity(
      userId,
      user.getEmail(),
      user.tenantId,
      user.getIsActive(),
      user.createdAt,
      user.updatedAt,
    );

    const hash = this.hashPassword(passwordHash);
    this.users.set(userId, { entity: createdUser, passwordHash: hash });
    return createdUser;
  }

  async update(user: UserEntity): Promise<UserEntity> {
    const record = this.users.get(user.id);
    if (!record) {
      throw new Error('User not found');
    }
    record.entity = user;
    return user;
  }

  async verifyPassword(userId: string, passwordPlain: string): Promise<boolean> {
    const record = this.users.get(userId);
    if (!record) return false;
    
    return this.verifyPasswordHash(passwordPlain, record.passwordHash);
  }

  async saveRefreshToken(userId: string, token: string, expiresAt: Date): Promise<void> {
    this.refreshTokens.set(token, { userId, isRevoked: false, expiresAt });
  }

  async findRefreshToken(token: string): Promise<{ userId: string; isRevoked: boolean; expiresAt: Date } | null> {
    const rt = this.refreshTokens.get(token);
    return rt || null;
  }

  async revokeRefreshToken(token: string): Promise<void> {
    const rt = this.refreshTokens.get(token);
    if (rt) {
      rt.isRevoked = true;
    }
  }

  async createSession(userId: string, userAgent?: string, ipAddress?: string, expiresAt?: Date): Promise<string> {
    const sessionId = `s-${Math.random().toString(36).substr(2, 9)}`;
    this.sessions.add(sessionId);
    return sessionId;
  }

  async revokeSession(sessionId: string): Promise<void> {
    this.sessions.delete(sessionId);
  }

  // Password Utility Functions
  private hashPassword(password: string): string {
    const salt = randomBytes(16).toString('hex');
    const hash = pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
    return `${salt}:${hash}`;
  }

  private verifyPasswordHash(password: string, storedHash: string): boolean {
    const [salt, hash] = storedHash.split(':');
    const verifyHash = pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
    return hash === verifyHash;
  }
}
