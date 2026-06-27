import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getHealth() {
    return {
      service: 'shopee-affiliate-api',
      status: 'ok',
      timestamp: new Date().toISOString(),
    };
  }
}
