import { Module } from '@nestjs/common';
import { LinkHistoryRepository } from './link-history.repository';
import { LinksController } from './links.controller';
import { LinksService } from './links.service';
import { ShopeeAffiliateClient } from './shopee-affiliate.client';

@Module({
  controllers: [LinksController],
  providers: [LinksService, ShopeeAffiliateClient, LinkHistoryRepository],
})
export class LinksModule {}
