import { BadRequestException, Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { LinkHistoryRepository } from './link-history.repository';
import {
  GenerateLinkBody,
  LinkHistoryRecord,
  NormalizedShopeeProductUrl,
} from './link.types';
import { ShopeeAffiliateClient } from './shopee-affiliate.client';
import { normalizeShopeeProductUrl } from './shopee-url';
import { normalizeSubIds } from './sub-ids';

@Injectable()
export class LinksService {
  constructor(
    private readonly affiliateClient: ShopeeAffiliateClient,
    private readonly historyRepository: LinkHistoryRepository,
  ) {}

  async generate(body: GenerateLinkBody): Promise<LinkHistoryRecord> {
    const startedAt = Date.now();
    const originalUrl = this.getOriginalUrl(body);
    const subIds = normalizeSubIds(body.subId, body.subIds);
    const requester = this.normalizeRequester(body.requester);

    let normalized: NormalizedShopeeProductUrl | undefined;

    try {
      normalized = await normalizeShopeeProductUrl(originalUrl);
      const generated = await this.affiliateClient.generateShortLink(
        normalized,
        subIds,
      );
      const record: LinkHistoryRecord = {
        id: randomUUID(),
        originalUrl,
        normalizedUrl: normalized.normalizedUrl,
        affiliateUrl: generated.affiliateUrl,
        provider: generated.provider,
        status: 'success',
        subIds,
        requester,
        host: normalized.host,
        shopId: normalized.shopId,
        itemId: normalized.itemId,
        elapsedMs: Date.now() - startedAt,
        createdAt: new Date().toISOString(),
      };

      await this.historyRepository.append(record);

      return record;
    } catch (error) {
      const record: LinkHistoryRecord = {
        id: randomUUID(),
        originalUrl,
        normalizedUrl: normalized?.normalizedUrl,
        status: 'failed',
        subIds,
        requester,
        host: normalized?.host,
        shopId: normalized?.shopId,
        itemId: normalized?.itemId,
        error: this.describeError(error),
        elapsedMs: Date.now() - startedAt,
        createdAt: new Date().toISOString(),
      };

      await this.historyRepository.append(record);
      throw error;
    }
  }

  listHistory(limit?: number): Promise<LinkHistoryRecord[]> {
    return this.historyRepository.list(limit);
  }

  private getOriginalUrl(body: GenerateLinkBody): string {
    const originalUrl = body.originalUrl ?? body.url;

    if (typeof originalUrl !== 'string' || !originalUrl.trim()) {
      throw new BadRequestException('Vui long nhap URL san pham Shopee.');
    }

    return originalUrl.trim();
  }

  private normalizeRequester(requester: unknown): string | undefined {
    if (typeof requester !== 'string') {
      return undefined;
    }

    const value = requester.trim();

    return value ? value.slice(0, 80) : undefined;
  }

  private describeError(error: unknown): string {
    if (error instanceof Error) {
      return error.message;
    }

    return 'Loi khong xac dinh.';
  }
}
