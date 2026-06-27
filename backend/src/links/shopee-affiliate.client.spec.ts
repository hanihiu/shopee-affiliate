import { ShopeeAffiliateClient } from './shopee-affiliate.client';

describe('ShopeeAffiliateClient', () => {
  const originalCookie = process.env.SHOPEE_COOKIE;
  const originalAffiliateId = process.env.SHOPEE_AFFILIATE_ID;
  const originalRedirectBase = process.env.SHOPEE_REDIRECT_BASE_URL;

  afterEach(() => {
    restoreEnv('SHOPEE_COOKIE', originalCookie);
    restoreEnv('SHOPEE_AFFILIATE_ID', originalAffiliateId);
    restoreEnv('SHOPEE_REDIRECT_BASE_URL', originalRedirectBase);
  });

  it('builds a manual redirect affiliate link when only affiliate id exists', async () => {
    delete process.env.SHOPEE_COOKIE;
    delete process.env.SHOPEE_REDIRECT_BASE_URL;
    process.env.SHOPEE_AFFILIATE_ID = '14354840000';

    const result = await new ShopeeAffiliateClient().generateShortLink(
      {
        host: 'shopee.vn',
        shopId: '52377417',
        itemId: '6309028319',
        normalizedUrl: 'https://shopee.vn/product/52377417/6309028319',
      },
      ['web', 'post_01'],
    );

    expect(result).toEqual({
      provider: 'manual_redirect',
      affiliateUrl:
        'https://s.shopee.vn/an_redir?origin_link=https%3A%2F%2Fshopee.vn%2Fproduct%2F52377417%2F6309028319&affiliate_id=14354840000&sub_id=web-post_01',
    });
  });

  it('throws when no credentials are configured', async () => {
    delete process.env.SHOPEE_COOKIE;
    delete process.env.SHOPEE_AFFILIATE_ID;

    await expect(
      new ShopeeAffiliateClient().generateShortLink(
        {
          host: 'shopee.vn',
          shopId: '52377417',
          itemId: '6309028319',
          normalizedUrl: 'https://shopee.vn/product/52377417/6309028319',
        },
        [],
      ),
    ).rejects.toThrow('Thieu cau hinh Shopee');
  });
});

function restoreEnv(key: string, value: string | undefined): void {
  if (value === undefined) {
    delete process.env[key];
    return;
  }

  process.env[key] = value;
}
