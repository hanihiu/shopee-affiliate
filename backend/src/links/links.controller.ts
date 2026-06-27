import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import type { GenerateLinkBody } from './link.types';
import { LinksService } from './links.service';
import { ShopeeAffiliateClient } from './shopee-affiliate.client';

@Controller('api/links')
export class LinksController {
  constructor(
    private readonly linksService: LinksService,
    private readonly affiliateClient: ShopeeAffiliateClient,
  ) {}

  @Post('generate')
  generate(@Body() body: GenerateLinkBody) {
    return this.linksService.generate(body);
  }

  @Get('history')
  history(@Query('limit') limit?: string) {
    const parsedLimit = limit ? Number(limit) : undefined;

    return this.linksService.listHistory(
      Number.isFinite(parsedLimit) ? parsedLimit : undefined,
    );
  }

  @Get('status')
  status() {
    return this.affiliateClient.checkCookieHealth();
  }
}
