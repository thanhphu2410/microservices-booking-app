import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { IdempotencyRecordEntity, IdempotencyStatus } from './idempotency-record.entity';

@Injectable()
export class IdempotencyService {
  constructor(
    @InjectRepository(IdempotencyRecordEntity)
    private readonly repo: Repository<IdempotencyRecordEntity>,
  ) {}

  async begin(scope: string, key: string, ttlSeconds?: number): Promise<{ status: IdempotencyStatus; record: IdempotencyRecordEntity }>{
    const expiresAt = ttlSeconds ? new Date(Date.now() + ttlSeconds * 1000) : undefined;
    try {
      const record = this.repo.create({ scope, key, status: 'in_progress', expiresAt });
      await this.repo.insert(record);
      return { status: 'in_progress', record };
    } catch (e) {
      // Unique constraint likely hit → fetch existing
      const existing = await this.repo.findOne({ where: { scope, key } });
      if (existing) return { status: existing.status, record: existing };
      throw e;
    }
  }

  async succeed(scope: string, key: string, responseJson: any) {
    await this.repo.update({ scope, key }, { status: 'succeeded', responseJson });
  }

  async fail(scope: string, key: string, errorJson: any) {
    await this.repo.update({ scope, key }, { status: 'failed', errorJson });
  }
}

