import { HttpException, HttpStatus, Injectable } from '@nestjs/common';

const WINDOW_MS = 60_000;
const MAX_REQUESTS_PER_WINDOW = Number(process.env.AI_RATE_LIMIT_PER_MINUTE ?? 20);

@Injectable()
export class AiRateLimitService {
  private readonly hits = new Map<string, number[]>();

  assertAllowed(userId: string) {
    const now = Date.now();
    const since = now - WINDOW_MS;
    const recentHits = (this.hits.get(userId) ?? []).filter(ts => ts > since);

    if (recentHits.length >= MAX_REQUESTS_PER_WINDOW) {
      this.hits.set(userId, recentHits);
      throw new HttpException('AI_RATE_LIMIT_EXCEEDED', HttpStatus.TOO_MANY_REQUESTS);
    }

    recentHits.push(now);
    this.hits.set(userId, recentHits);
  }
}
