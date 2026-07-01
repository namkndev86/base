import { ClientOptions, Transport } from '@nestjs/microservices';
import {
  IDENTITY_PROTO_PATH,
  AUTHORIZATION_PROTO_PATH,
  TENANT_PROTO_PATH,
  PROTO_PACKAGE_NAMES,
} from '@platform/shared-protobuf';

export function getGrpcClientOptions(
  serviceName: 'IDENTITY' | 'AUTHORIZATION' | 'TENANT',
  url: string,
): ClientOptions {
  let protoPath = '';
  let packageName = '';

  switch (serviceName) {
    case 'IDENTITY':
      protoPath = IDENTITY_PROTO_PATH;
      packageName = PROTO_PACKAGE_NAMES.IDENTITY;
      break;
    case 'AUTHORIZATION':
      protoPath = AUTHORIZATION_PROTO_PATH;
      packageName = PROTO_PACKAGE_NAMES.AUTHORIZATION;
      break;
    case 'TENANT':
      protoPath = TENANT_PROTO_PATH;
      packageName = PROTO_PACKAGE_NAMES.TENANT;
      break;
  }

  return {
    transport: Transport.GRPC,
    options: {
      url,
      package: packageName,
      protoPath,
    },
  };
}
