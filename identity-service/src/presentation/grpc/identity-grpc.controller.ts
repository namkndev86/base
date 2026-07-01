import { Controller } from '@nestjs/common';
import { GrpcMethod } from '@nestjs/microservices';
import { IdentityApplicationService } from '../../application/services/identity.service';

interface ValidateTokenRequest {
  accessToken: string;
}

interface GetUserRequest {
  userId: string;
}

@Controller()
export class IdentityGrpcController {
  constructor(private readonly identityService: IdentityApplicationService) {}

  @GrpcMethod('IdentityService', 'ValidateToken')
  async validateToken(data: ValidateTokenRequest) {
    return this.identityService.validateToken(data.accessToken);
  }

  @GrpcMethod('IdentityService', 'GetUser')
  async getUser(data: GetUserRequest) {
    return this.identityService.getUser(data.userId);
  }
}
