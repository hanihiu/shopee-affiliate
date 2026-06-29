import { Logger } from '@nestjs/common';

const logger = new Logger('UrlShortener');

/**
 * Shorten a URL using a free URL shortener service (is.gd).
 * Returns the shortened URL, or null if the service is unavailable.
 */
export async function shortenUrl(longUrl: string): Promise<string | null> {
  const apiUrl = `https://is.gd/create.php?format=json&url=${encodeURIComponent(longUrl)}`;

  try {
    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: { 'user-agent': 'ShopeeAffiliateTool/1.0' },
      signal: AbortSignal.timeout(5000),
    });

    if (!response.ok) {
      logger.warn(`URL shortener returned HTTP ${response.status}`);
      return null;
    }

    const data = (await response.json()) as { shorturl?: string; errorcode?: number; errormessage?: string };

    if (data.shorturl) {
      logger.log(`Shortened: ${longUrl.slice(0, 60)}... → ${data.shorturl}`);
      return data.shorturl;
    }

    logger.warn(
      `URL shortener error: ${data.errormessage ?? 'unknown'}`,
    );
    return null;
  } catch (error) {
    logger.warn(
      `URL shortener failed: ${error instanceof Error ? error.message : 'unknown'}`,
    );
    return null;
  }
}
