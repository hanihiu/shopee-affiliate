import { BadRequestException } from '@nestjs/common';

const MAX_SUB_IDS = 5;
const MAX_SUB_ID_LENGTH = 64;
const SUB_ID_PATTERN = /^[A-Za-z0-9_-]+$/;

export function normalizeSubIds(subId: unknown, subIds: unknown): string[] {
  const rawValues = Array.isArray(subIds)
    ? subIds
    : typeof subId === 'string'
      ? subId.split(',')
      : [];

  const values = rawValues
    .map((value) => (typeof value === 'string' ? value.trim() : ''))
    .filter(Boolean);

  if (values.length > MAX_SUB_IDS) {
    throw new BadRequestException('Shopee chi ho tro toi da 5 sub_id.');
  }

  for (const value of values) {
    if (value.length > MAX_SUB_ID_LENGTH || !SUB_ID_PATTERN.test(value)) {
      throw new BadRequestException(
        'sub_id chi duoc gom chu, so, dau gach ngang va dau gach duoi.',
      );
    }
  }

  return values;
}
