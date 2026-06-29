import {
  Injectable,
  InternalServerErrorException,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import {
  GeneratedAffiliateLink,
  NormalizedShopeeProductUrl,
} from './link.types';
import { shortenUrl } from './url-shortener';

/* ---------- Web API response shape ---------- */

interface ShopeeWebApiBatchLinkResult {
  shortLink?: string;
  longLink?: string;
  failCode?: number;
}

interface ShopeeWebApiResponse {
  data?: {
    batchCustomLink?: ShopeeWebApiBatchLinkResult[];
  };
  errors?: Array<{
    message?: string;
  }>;
}

/* ---------- Cookie health ---------- */

export interface CookieHealthStatus {
  hasCookie: boolean;
  hasAffiliateId: boolean;
  cookieValid: boolean | null;
  activeProvider: 'shopee_web_api' | 'manual_redirect' | 'none';
  message: string;
  checkedAt: string;
}

/* ---------- Constants ---------- */

const REDIRECT_BASE_BY_HOST: Record<string, string> = {
  'shopee.vn': 'https://s.shopee.vn',
  'shopee.sg': 'https://s.shopee.sg',
  'shopee.ph': 'https://s.shopee.ph',
  'shopee.tw': 'https://s.shopee.tw',
  'shopee.co.id': 'https://s.shopee.co.id',
  'shopee.co.th': 'https://s.shopee.co.th',
  'shopee.com.br': 'https://s.shopee.com.br',
  'shopee.com.my': 'https://s.shopee.my',
};

const DEFAULT_WEB_API_ENDPOINT =
  'https://affiliate.shopee.vn/api/v3/gql?q=batchCustomLink';

/* ---------- Service ---------- */

@Injectable()
export class ShopeeAffiliateClient {
  private readonly logger = new Logger(ShopeeAffiliateClient.name);

  /**
   * Fallback chain:
   *  1. Web API    – SHOPEE_COOKIE (session cookie from browser)
   *     → on failure, fall back to step 2 (if available)
   *  2. Manual     – SHOPEE_AFFILIATE_ID (redirect link)
   *  3. Error
   */
  async generateShortLink(
    productUrl: NormalizedShopeeProductUrl,
    subIds: string[],
  ): Promise<GeneratedAffiliateLink> {
    const cookie = process.env.SHOPEE_COOKIE?.trim();
    const affiliateId = process.env.SHOPEE_AFFILIATE_ID?.trim();

    if (cookie) {
      try {
        return await this.generateWithWebApi(productUrl.originalUrl, cookie);
      } catch (error) {
        const errorMsg = this.describeError(error);
        this.logger.warn(
          `Web API that bai (cookie co the het han): ${errorMsg}`,
        );

        if (affiliateId) {
          this.logger.warn(
            'Tu dong fallback sang manual_redirect. Hay cap nhat SHOPEE_COOKIE som.',
          );
          return this.buildManualRedirectResult(productUrl, affiliateId, subIds);
        }

        // No fallback available – re-throw the original error
        throw error;
      }
    }

    if (affiliateId) {
      return this.buildManualRedirectResult(productUrl, affiliateId, subIds);
    }

    throw new InternalServerErrorException(
      'Thieu cau hinh Shopee: can SHOPEE_COOKIE hoac SHOPEE_AFFILIATE_ID.',
    );
  }

  /**
   * Proactively check whether the current cookie is still valid
   * by making a lightweight test request to Shopee's API.
   */
  async checkCookieHealth(): Promise<CookieHealthStatus> {
    const cookie = process.env.SHOPEE_COOKIE?.trim();
    const affiliateId = process.env.SHOPEE_AFFILIATE_ID?.trim();
    const checkedAt = new Date().toISOString();

    if (!cookie) {
      return {
        hasCookie: false,
        hasAffiliateId: !!affiliateId,
        cookieValid: null,
        activeProvider: affiliateId ? 'manual_redirect' : 'none',
        message: affiliateId
          ? 'Khong co cookie. Dang dung manual_redirect.'
          : 'Khong co cookie va affiliate ID. Khong the tao link.',
        checkedAt,
      };
    }

    // Test the cookie by making a real request with a known Shopee URL
    const testUrl = 'https://shopee.vn/product/1/1';
    try {
      await this.generateWithWebApi(testUrl, cookie);

      return {
        hasCookie: true,
        hasAffiliateId: !!affiliateId,
        cookieValid: true,
        activeProvider: 'shopee_web_api',
        message: 'Cookie hop le. Web API dang hoat dong.',
        checkedAt,
      };
    } catch {
      return {
        hasCookie: true,
        hasAffiliateId: !!affiliateId,
        cookieValid: false,
        activeProvider: affiliateId ? 'manual_redirect' : 'none',
        message: affiliateId
          ? 'Cookie het han. Dang fallback sang manual_redirect. Hay cap nhat cookie.'
          : 'Cookie het han va khong co affiliate ID. Hay cap nhat cookie.',
        checkedAt,
      };
    }
  }

  /* ========== Web API (Cookie-based) ========== */

  /**
   * Build the full set of request headers that Shopee's affiliate portal expects.
   *
   * Static / low-sensitivity values (User-Agent, sec-* hints, etc.) are
   * hard-coded to match a real Chrome request.  The values that change per
   * session or carry security tokens are read from environment variables so
   * they can be rotated without touching code.
   *
   * Required env vars (beyond SHOPEE_COOKIE which is already handled):
   *   SHOPEE_CSRF_TOKEN      – csrf-token header  (e.g. "kfZH3E1D-…")
   *   SHOPEE_AF_AC_ENC_DAT   – af-ac-enc-dat      (e.g. "0e23ef8da5d01fca")
   *   SHOPEE_AF_AC_ENC_TOKEN – af-ac-enc-sz-token (the long base64 value)
   *   SHOPEE_X_SAP_RI        – x-sap-ri           (hex string)
   *   SHOPEE_X_SAP_SEC       – x-sap-sec          (long encoded string)
   */
  private buildRequestHeaders(cookie: string): Record<string, string> {
    const csrfToken = process.env.SHOPEE_CSRF_TOKEN?.trim() ?? '';
    const afAcEncDat = process.env.SHOPEE_AF_AC_ENC_DAT?.trim() ?? '';
    const afAcEncToken = process.env.SHOPEE_AF_AC_ENC_TOKEN?.trim() ?? '';
    const xSapRi = process.env.SHOPEE_X_SAP_RI?.trim() ?? '';
    const xSapSec = process.env.SHOPEE_X_SAP_SEC?.trim() ?? '';

    const headers: Record<string, string> = {
      // ── Content ──────────────────────────────────────────────────────────
      'content-type': 'application/json; charset=UTF-8',
      accept: 'application/json, text/plain, */*',
      'accept-encoding': 'gzip, deflate, br, zstd',
      'accept-language': 'en-US,en;q=0.9,vi;q=0.8',

      // ── Session / Auth ────────────────────────────────────────────────────
      cookie,

      // ── Shopee security tokens ────────────────────────────────────────────
      'affiliate-program-type': '1',
      origin: 'https://affiliate.shopee.vn',
      referer: 'https://affiliate.shopee.vn/offer/custom_link',

      // ── Browser fingerprint (static, matches Chrome 149 on Windows) ───────
      'user-agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 ' +
        '(KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36',
      'sec-ch-ua':
        '"Google Chrome";v="149", "Chromium";v="149", "Not)A;Brand";v="24"',
      'sec-ch-ua-mobile': '?0',
      'sec-ch-ua-platform': '"Windows"',
      'sec-fetch-dest': 'empty',
      'sec-fetch-mode': 'cors',
      'sec-fetch-site': 'same-origin',
      priority: 'u=1, i',
    };

    // Only attach token headers when values are configured – avoids sending
    // empty strings which may cause Shopee's WAF to reject the request.
    if (csrfToken) headers['csrf-token'] = csrfToken;
    if (afAcEncDat) headers['af-ac-enc-dat'] = afAcEncDat;
    if (afAcEncToken) headers['af-ac-enc-sz-token'] = afAcEncToken;
    if (xSapRi) headers['x-sap-ri'] = xSapRi;
    if (xSapSec) headers['x-sap-sec'] = xSapSec;

    return headers;
  }

  private async generateWithWebApi(
    originUrl: string,
    cookie: string,
  ): Promise<GeneratedAffiliateLink> {
    const endpoint =
      process.env.SHOPEE_WEB_API_ENDPOINT?.trim() || DEFAULT_WEB_API_ENDPOINT;

    const payload = {
      operationName: 'batchGetCustomLink',
      query: `
    query batchGetCustomLink($linkParams: [CustomLinkParam!], $sourceCaller: SourceCaller){
      batchCustomLink(linkParams: $linkParams, sourceCaller: $sourceCaller){
        shortLink
        longLink
        failCode
      }
    }
    `,
      variables: {
        linkParams: [
          {
            originalLink: originUrl,
            advancedLinkParams: {},
          },
        ],
        sourceCaller: 'CUSTOM_LINK_CALLER',
      },
    };

    const body = JSON.stringify(payload);

    let response: Response;

    try {
      response = await fetch(endpoint, {
        method: 'POST',
        headers: this.buildRequestHeaders(cookie),
        body,
      });
    } catch (error) {
      throw new ServiceUnavailableException(
        `Khong the ket noi Shopee Web API: ${this.describeError(error)}`,
      );
    }

    if (!response.ok) {
      throw new ServiceUnavailableException(
        `Shopee Web API tra ve HTTP ${response.status}. Cookie co the da het han.`,
      );
    }

    const responseBody = (await response.json().catch(() => ({}))) as
      | ShopeeWebApiResponse
      | Record<string, never>;

    if ('errors' in responseBody && responseBody.errors?.length) {
      const message =
        responseBody.errors
          .map((error) => error.message)
          .filter(Boolean)
          .join('; ') || 'Loi GraphQL khong xac dinh.';

      throw new ServiceUnavailableException(message);
    }

    const results =
      'data' in responseBody ? responseBody.data?.batchCustomLink : undefined;

    if (!results?.length) {
      throw new ServiceUnavailableException(
        'Shopee Web API khong tra ve ket qua.',
      );
    }

    const first = results[0];

    if (first.failCode && first.failCode !== 0) {
      throw new ServiceUnavailableException(
        `Shopee Web API tra ve failCode: ${first.failCode}.`,
      );
    }

    const shortLink = first.shortLink;

    if (!shortLink) {
      throw new ServiceUnavailableException(
        'Shopee Web API khong tra ve shortLink.',
      );
    }

    return {
      affiliateUrl: shortLink,
      provider: 'shopee_web_api',
    };
  }

  /* ========== Manual redirect ========== */

  /**
   * Build a manual redirect affiliate link and attempt to shorten it.
   * If shortening fails, affiliateUrl still contains the working long URL.
   */
  private async buildManualRedirectResult(
    productUrl: NormalizedShopeeProductUrl,
    affiliateId: string,
    subIds: string[],
  ): Promise<GeneratedAffiliateLink> {
    const longUrl = this.buildManualRedirectLink(productUrl, affiliateId, subIds);
    const shortened = await shortenUrl(longUrl);

    return {
      affiliateUrl: shortened ?? longUrl,
      shortUrl: shortened ?? undefined,
      provider: 'manual_redirect',
    };
  }

  private buildManualRedirectLink(
    productUrl: NormalizedShopeeProductUrl,
    affiliateId: string,
    subIds: string[],
  ): string {
    const redirectUrl = new URL('/an_redir', this.getRedirectBase(productUrl));
    redirectUrl.searchParams.set('origin_link', productUrl.normalizedUrl);
    redirectUrl.searchParams.set('affiliate_id', affiliateId);

    if (subIds.length) {
      redirectUrl.searchParams.set('sub_id', subIds.join('-'));
    }

    return redirectUrl.toString();
  }

  private getRedirectBase(productUrl: NormalizedShopeeProductUrl): string {
    const explicitBase = process.env.SHOPEE_REDIRECT_BASE_URL?.trim();

    if (explicitBase) {
      return explicitBase;
    }

    return (
      REDIRECT_BASE_BY_HOST[productUrl.host] ?? `https://s.${productUrl.host}`
    );
  }

  /* ========== Helpers ========== */

  private describeError(error: unknown): string {
    return error instanceof Error ? error.message : 'unknown error';
  }
}
