import { BadRequestException, Logger } from '@nestjs/common';
import { NormalizedShopeeProductUrl } from './link.types';

const PRODUCT_PATH_PATTERN = /^\/product\/(\d+)\/(\d+)\/?$/;
const LEGACY_PRODUCT_PATTERN = /(?:^|-)i\.(\d+)\.(\d+)(?:$|[/?#])/;

/** Matches /{slug}/{shopId}/{itemId} – used by short link redirects */
const SLUG_PATH_PATTERN = /^\/[a-zA-Z][a-zA-Z0-9_-]*\/(\d+)\/(\d+)\/?$/;

const SHOPEE_HOST_PATTERN =
  /^shopee\.(vn|sg|ph|tw|pl|cl)$|^shopee\.com\.(my|br|mx|co)$|^shopee\.co\.(id|th)$/;

/** Matches short-link domains like s.shopee.vn, s.shopee.co.id, etc. */
const SHOPEE_SHORT_LINK_PATTERN =
  /^s\.shopee\.(vn|sg|ph|tw|pl|cl)$|^s\.shopee\.com\.(my|br|mx|co)$|^s\.shopee\.co\.(id|th)$/;

const logger = new Logger('ShopeeUrl');

/**
 * Normalize a Shopee product URL.
 * Accepts full product URLs and short links (e.g. https://s.shopee.vn/xxxxx).
 * Short links are resolved by following HTTP redirects.
 */
export async function normalizeShopeeProductUrl(
  input: string,
): Promise<NormalizedShopeeProductUrl> {
  let parsed: URL;

  try {
    parsed = new URL(input.trim());
  } catch {
    throw new BadRequestException('URL khong hop le.');
  }

  if (!['http:', 'https:'].includes(parsed.protocol)) {
    throw new BadRequestException('Chi chap nhan URL http hoac https.');
  }

  const host = parsed.hostname.toLowerCase().replace(/^www\./, '');

  // Handle short links – resolve redirect to get the real product URL
  if (SHOPEE_SHORT_LINK_PATTERN.test(host)) {
    const resolvedUrl = await resolveShortLink(input.trim());
    return normalizeShopeeProductUrl(resolvedUrl);
  }

  if (!SHOPEE_HOST_PATTERN.test(host)) {
    throw new BadRequestException('URL phai thuoc domain san pham Shopee.');
  }

  const ids = extractProductIds(parsed);

  if (!ids) {
    throw new BadRequestException(
      'URL Shopee phai la link san pham co shop id va item id.',
    );
  }

  return {
    host,
    shopId: ids.shopId,
    itemId: ids.itemId,
    originalUrl: input.trim(),
    normalizedUrl: `https://${host}/product/${ids.shopId}/${ids.itemId}`,
  };
}

/**
 * Follow a Shopee short link (e.g. https://s.shopee.vn/qhSp5XxJW)
 * and return the destination product URL.
 *
 * Uses `redirect: 'manual'` to read the Location header without
 * actually following the full redirect chain (faster, no body download).
 */
async function resolveShortLink(shortUrl: string): Promise<string> {
  const MAX_REDIRECTS = 5;
  let currentUrl = shortUrl;

  for (let i = 0; i < MAX_REDIRECTS; i++) {
    let response: Response;

    try {
      response = await fetch(currentUrl, {
        method: 'GET',
        redirect: 'manual',
        headers: {
          'user-agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 ' +
            '(KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36',
        },
      });
    } catch (error) {
      throw new BadRequestException(
        `Khong the truy cap short link: ${error instanceof Error ? error.message : 'unknown error'}`,
      );
    }

    const location = response.headers.get('location');

    if (!location) {
      // No more redirects – check if we landed on a Shopee product page
      if (response.ok || response.status === 200) {
        // currentUrl might be the final destination
        const finalHost = new URL(currentUrl).hostname
          .toLowerCase()
          .replace(/^www\./, '');
        if (SHOPEE_HOST_PATTERN.test(finalHost)) {
          logger.log(`Short link resolved: ${shortUrl} → ${currentUrl}`);
          return currentUrl;
        }
      }
      throw new BadRequestException(
        'Short link khong chuyen huong den trang san pham Shopee.',
      );
    }

    // Resolve relative redirects
    currentUrl = new URL(location, currentUrl).toString();

    // Check if we've reached a Shopee product domain
    const redirectHost = new URL(currentUrl).hostname
      .toLowerCase()
      .replace(/^www\./, '');

    if (SHOPEE_HOST_PATTERN.test(redirectHost)) {
      logger.log(`Short link resolved: ${shortUrl} → ${currentUrl}`);
      return currentUrl;
    }
  }

  throw new BadRequestException(
    `Short link chuyen huong qua nhieu lan (>${MAX_REDIRECTS}).`,
  );
}

function extractProductIds(
  url: URL,
): { itemId: string; shopId: string } | null {
  // 1. /product/{shopId}/{itemId}
  const productPathMatch = url.pathname.match(PRODUCT_PATH_PATTERN);

  if (productPathMatch) {
    return {
      shopId: productPathMatch[1],
      itemId: productPathMatch[2],
    };
  }

  // 2. /slug-i.{shopId}.{itemId}
  const legacyPathMatch = `${url.pathname}${url.search}`.match(
    LEGACY_PRODUCT_PATTERN,
  );

  if (legacyPathMatch) {
    return {
      shopId: legacyPathMatch[1],
      itemId: legacyPathMatch[2],
    };
  }

  // 3. /{slug}/{shopId}/{itemId} – from short link redirects
  const slugPathMatch = url.pathname.match(SLUG_PATH_PATTERN);

  if (slugPathMatch) {
    return {
      shopId: slugPathMatch[1],
      itemId: slugPathMatch[2],
    };
  }

  return null;
}
