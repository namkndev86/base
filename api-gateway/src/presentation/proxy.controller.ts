import { Controller, All, Req, Res, HttpStatus } from '@nestjs/common';
import { Request, Response } from 'express';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { LoggerService } from '@platform/shared-common';
import { firstValueFrom } from 'rxjs';

@Controller()
export class ProxyController {
  private serviceMappings: Record<string, string>;

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
    private readonly logger: LoggerService,
  ) {
    this.logger.setContext('ProxyController');
    
    // Read downstream URLs from environment variables
    this.serviceMappings = {
      identity: this.configService.get<string>('IDENTITY_SERVICE_URL', 'http://localhost:3001'),
      authorization: this.configService.get<string>('AUTHORIZATION_SERVICE_URL', 'http://localhost:3002'),
      tenant: this.configService.get<string>('TENANT_SERVICE_URL', 'http://localhost:3003'),
      notification: this.configService.get<string>('NOTIFICATION_SERVICE_URL', 'http://localhost:3004'),
      file: this.configService.get<string>('FILE_SERVICE_URL', 'http://localhost:3005'),
      audit: this.configService.get<string>('AUDIT_SERVICE_URL', 'http://localhost:3006'),
      search: this.configService.get<string>('SEARCH_SERVICE_URL', 'http://localhost:3007'),
      scheduler: this.configService.get<string>('SCHEDULER_SERVICE_URL', 'http://localhost:3008'),
      configuration: this.configService.get<string>('CONFIGURATION_SERVICE_URL', 'http://localhost:3009'),
      'feature-flag': this.configService.get<string>('FEATURE_FLAG_SERVICE_URL', 'http://localhost:3010'),
    };
  }

  @All(':service*')
  async proxyRequest(@Req() req: Request, @Res() res: Response) {
    const serviceName = req.params.service as string;
    const targetUrlBase = this.serviceMappings[serviceName];

    if (!targetUrlBase) {
      this.logger.warn(`Service mapping not found for route: ${serviceName}`);
      return res.status(HttpStatus.NOT_FOUND).json({
        success: false,
        statusCode: HttpStatus.NOT_FOUND,
        message: `Service '${serviceName}' not found or route is invalid`,
      });
    }

    // Reconstruct destination path
    const path = req.params['0'] || '';
    const query = req.url.includes('?') ? req.url.substring(req.url.indexOf('?')) : '';
    const destinationUrl = `${targetUrlBase}/${serviceName}${path}${query}`;

    this.logger.log(`Proxying request: [${req.method}] ${req.url} -> ${destinationUrl}`);

    // Map headers and attach correlation ID & user context headers
    const headers = { ...req.headers };
    // Keep hostname of target
    delete headers['host'];

    try {
      const response = (await firstValueFrom(
        this.httpService.request({
          method: req.method as any,
          url: destinationUrl,
          data: req.body,
          headers,
          validateStatus: () => true, // resolve promise for any status code
        })
      )) as any;

      // Copy response headers and write status/data
      Object.entries(response.headers).forEach(([key, val]) => {
        res.setHeader(key, val as string);
      });

      return res.status(response.status).send(response.data);
    } catch (error) {
      this.logger.error(`Error forwarding request to ${destinationUrl}`, error.stack || error.message);
      return res.status(HttpStatus.BAD_GATEWAY).json({
        success: false,
        statusCode: HttpStatus.BAD_GATEWAY,
        message: `Bad Gateway: Unable to reach downstream service '${serviceName}'`,
      });
    }
  }
}
