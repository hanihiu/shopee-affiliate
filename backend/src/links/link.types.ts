export type AffiliateLinkProvider =
  | 'shopee_web_api'
  | 'manual_redirect';

export type AffiliateLinkStatus = 'success' | 'failed';

export interface GenerateLinkBody {
  url?: unknown;
  originalUrl?: unknown;
  subId?: unknown;
  subIds?: unknown;
  requester?: unknown;
}

export interface NormalizedShopeeProductUrl {
  host: string;
  itemId: string;
  normalizedUrl: string;
  originalUrl: string;
  shopId: string;
}

export interface GeneratedAffiliateLink {
  affiliateUrl: string;
  provider: AffiliateLinkProvider;
}

export interface LinkHistoryRecord {
  id: string;
  affiliateUrl?: string;
  createdAt: string;
  elapsedMs: number;
  error?: string;
  host?: string;
  itemId?: string;
  normalizedUrl?: string;
  originalUrl: string;
  provider?: AffiliateLinkProvider;
  requester?: string;
  shopId?: string;
  status: AffiliateLinkStatus;
  subIds: string[];
}
