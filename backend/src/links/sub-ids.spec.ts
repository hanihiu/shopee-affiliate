import { BadRequestException } from '@nestjs/common';
import { normalizeSubIds } from './sub-ids';

describe('normalizeSubIds', () => {
  it('accepts up to five clean sub ids', () => {
    expect(normalizeSubIds(undefined, ['web', 'campaign_1'])).toEqual([
      'web',
      'campaign_1',
    ]);
  });

  it('splits comma-separated sub id input', () => {
    expect(normalizeSubIds('web,campaign-1', undefined)).toEqual([
      'web',
      'campaign-1',
    ]);
  });

  it('rejects unsupported characters', () => {
    expect(() => normalizeSubIds('web campaign', undefined)).toThrow(
      BadRequestException,
    );
  });
});
