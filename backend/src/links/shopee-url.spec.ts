import { BadRequestException } from '@nestjs/common';
import { normalizeShopeeProductUrl } from './shopee-url';

describe('normalizeShopeeProductUrl', () => {
  it('normalizes canonical Shopee product URLs', () => {
    expect(
      normalizeShopeeProductUrl(
        'https://shopee.vn/product/52377417/6309028319?utm_source=test',
      ),
    ).toEqual({
      host: 'shopee.vn',
      shopId: '52377417',
      itemId: '6309028319',
      normalizedUrl: 'https://shopee.vn/product/52377417/6309028319',
    });
  });

  it('normalizes legacy Shopee product URLs', () => {
    expect(
      normalizeShopeeProductUrl(
        'https://www.shopee.vn/Apple-iPhone-i.52377417.6309028319',
      ).normalizedUrl,
    ).toBe('https://shopee.vn/product/52377417/6309028319');
  });

  it('rejects non-Shopee URLs', () => {
    expect(() =>
      normalizeShopeeProductUrl('https://example.com/product/1/2'),
    ).toThrow(BadRequestException);
  });
});
