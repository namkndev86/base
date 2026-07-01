import { Injectable } from '@nestjs/common';
import { createHmac } from 'crypto';

@Injectable()
export class JwtService {
  private readonly secret = process.env.JWT_SECRET || 'super-secret-platform-key';

  sign(payload: Record<string, any>, expiresInSeconds: number = 3600): string {
    const header = {
      alg: 'HS256',
      typ: 'JWT',
    };

    const exp = Math.floor(Date.now() / 1000) + expiresInSeconds;
    const jwtPayload = {
      ...payload,
      exp,
    };

    const encodedHeader = this.base64url(JSON.stringify(header));
    const encodedPayload = this.base64url(JSON.stringify(jwtPayload));

    const signature = this.signHmac(`${encodedHeader}.${encodedPayload}`);
    return `${encodedHeader}.${encodedPayload}.${signature}`;
  }

  verify(token: string): Record<string, any> | null {
    const parts = token.split('.');
    if (parts.length !== 3) {
      return null;
    }

    const [header, payload, signature] = parts;
    const verifySignature = this.signHmac(`${header}.${payload}`);

    if (signature !== verifySignature) {
      return null;
    }

    const decodedPayload = JSON.parse(this.base64urlDecode(payload));
    
    // Check expiration
    const now = Math.floor(Date.now() / 1000);
    if (decodedPayload.exp && decodedPayload.exp < now) {
      return null; // Expired
    }

    return decodedPayload;
  }

  private signHmac(data: string): string {
    return createHmac('sha256', this.secret)
      .update(data)
      .digest('base64')
      .replace(/=/g, '')
      .replace(/\+/g, '-')
      .replace(/\//g, '_');
  }

  private base64url(str: string): string {
    return Buffer.from(str)
      .toString('base64')
      .replace(/=/g, '')
      .replace(/\+/g, '-')
      .replace(/\//g, '_');
  }

  private base64urlDecode(str: string): string {
    let base64 = str.replace(/-/g, '+').replace(/_/g, '/');
    while (base64.length % 4) {
      base64 += '=';
    }
    return Buffer.from(base64, 'base64').toString('utf8');
  }
}
