import { Injectable, LoggerService as NestLoggerService, Scope } from '@nestjs/common';

@Injectable({ scope: Scope.TRANSIENT })
export class LoggerService implements NestLoggerService {
  private contextName: string = 'System';

  setContext(context: string) {
    this.contextName = context;
  }

  log(message: any, ...optionalParams: any[]) {
    this.print('info', message, optionalParams);
  }

  error(message: any, ...optionalParams: any[]) {
    this.print('error', message, optionalParams);
  }

  warn(message: any, ...optionalParams: any[]) {
    this.print('warn', message, optionalParams);
  }

  debug(message: any, ...optionalParams: any[]) {
    this.print('debug', message, optionalParams);
  }

  verbose(message: any, ...optionalParams: any[]) {
    this.print('verbose', message, optionalParams);
  }

  private print(level: string, message: any, optionalParams: any[]) {
    const timestamp = new Date().toISOString();
    let correlationId = undefined;
    let extra = {};

    if (optionalParams && optionalParams.length > 0) {
      const lastParam = optionalParams[optionalParams.length - 1];
      if (typeof lastParam === 'object' && lastParam !== null) {
        if ('correlationId' in lastParam) {
          correlationId = lastParam.correlationId;
        }
        extra = { ...lastParam };
        delete (extra as any).correlationId;
      }
    }

    const payload = {
      timestamp,
      level,
      context: this.contextName,
      message: typeof message === 'object' ? JSON.stringify(message) : message,
      correlationId,
      ...extra,
    };

    console.log(JSON.stringify(payload));
  }
}
