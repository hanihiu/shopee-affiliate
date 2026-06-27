import { Injectable } from '@nestjs/common';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { LinkHistoryRecord } from './link.types';

const MAX_HISTORY_RECORDS = 500;

@Injectable()
export class LinkHistoryRepository {
  private readonly filePath =
    process.env.LINK_HISTORY_FILE ??
    join(process.cwd(), 'storage', 'link-history.json');

  async append(record: LinkHistoryRecord): Promise<void> {
    const history = await this.list(MAX_HISTORY_RECORDS);
    const nextHistory = [record, ...history].slice(0, MAX_HISTORY_RECORDS);

    await mkdir(dirname(this.filePath), { recursive: true });
    await writeFile(
      this.filePath,
      JSON.stringify(nextHistory, null, 2),
      'utf8',
    );
  }

  async list(limit = 50): Promise<LinkHistoryRecord[]> {
    const boundedLimit = Math.min(Math.max(limit, 1), MAX_HISTORY_RECORDS);

    try {
      const content = await readFile(this.filePath, 'utf8');
      const parsed = JSON.parse(content) as LinkHistoryRecord[];

      if (!Array.isArray(parsed)) {
        return [];
      }

      return parsed.slice(0, boundedLimit);
    } catch {
      return [];
    }
  }
}
