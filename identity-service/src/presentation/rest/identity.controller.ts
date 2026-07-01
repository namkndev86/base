import { Controller, Post, Get, Body, Req, UseGuards, HttpStatus, HttpCode } from '@nestjs/common';
import { Request } from 'express';
import { IdentityApplicationService } from '../../application/services/identity.service';
import { CurrentUser, CurrentUserDto, JwtAuthGuard } from '@platform/shared-common';

class RegisterDto {
  email: string;
  passwordHash: string;
  tenantId?: string;
}

class LoginDto {
  email: string;
  passwordHash: string;
}

class RefreshDto {
  refreshToken: string;
}

@Controller('identity')
export class IdentityController {
  constructor(private readonly identityService: IdentityApplicationService) {}

  @Post('register')
  async register(@Body() dto: RegisterDto) {
    const data = await this.identityService.register(dto.email, dto.passwordHash, dto.tenantId);
    return {
      success: true,
      statusCode: HttpStatus.CREATED,
      message: 'User registered successfully',
      data,
      timestamp: new Date().toISOString(),
    };
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() dto: LoginDto, @Req() req: Request) {
    const userAgent = req.headers['user-agent'];
    const ipAddress = req.ip || req.socket.remoteAddress;

    const data = await this.identityService.login(dto.email, dto.passwordHash, userAgent, ipAddress);
    return {
      success: true,
      statusCode: HttpStatus.OK,
      message: 'Login successful',
      data,
      timestamp: new Date().toISOString(),
    };
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refresh(@Body() dto: RefreshDto) {
    const data = await this.identityService.refreshToken(dto.refreshToken);
    return {
      success: true,
      statusCode: HttpStatus.OK,
      message: 'Token refreshed successfully',
      data,
      timestamp: new Date().toISOString(),
    };
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  async me(@CurrentUser() user: CurrentUserDto) {
    const data = await this.identityService.getUser(user.id);
    return {
      success: true,
      statusCode: HttpStatus.OK,
      data,
      timestamp: new Date().toISOString(),
    };
  }
}
