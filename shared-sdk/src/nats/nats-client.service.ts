import { Injectable, Inject } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { BaseEvent } from '@platform/shared-contracts';
import { randomUUID } from 'crypto';

@Injectable()
export class NatsClientService {
  constructor(
    @Inject('NATS_CLIENT_PROXY') private readonly client: ClientProxy,
  ) {}

  emitEvent<T>(
    pattern: string,
    payload: T,
    correlationId?: string,
    tenantId?: string,
  ) {
    const event: BaseEvent<T> = {
      id: randomUUID(),
      pattern,
      timestamp: new Date().toISOString(),
      correlationId: correlationId || randomUUID(),
      tenantId,
      payload,
    };
    return this.client.emit(pattern, event);
  }

  sendRequest<TResponse, TRequest>(
    pattern: string,
    payload: TRequest,
    correlationId?: string,
    tenantId?: string,
  ) {
    const event: BaseEvent<TRequest> = {
      id: randomUUID(),
      pattern,
      timestamp: new Date().toISOString(),
      correlationId: correlationId || randomUUID(),
      tenantId,
      payload,
    };
    return this.client.send<TResponse, BaseEvent<TRequest>>(pattern, event);
  }
}
