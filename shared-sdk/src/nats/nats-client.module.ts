import { Module, Global } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { NatsClientService } from './nats-client.service';

@Global()
@Module({
  imports: [
    ClientsModule.register([
      {
        name: 'NATS_CLIENT_PROXY',
        transport: Transport.NATS,
        options: {
          servers: [process.env.NATS_URL || 'nats://localhost:4222'],
        },
      },
    ]),
  ],
  providers: [NatsClientService],
  exports: [NatsClientService, ClientsModule],
})
export class NatsClientModule {}
