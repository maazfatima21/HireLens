import { Redis } from "ioredis";

export const redisConfigured = Boolean(process.env.REDIS_URL);
export const redisConnection = redisConfigured
  ? new Redis(process.env.REDIS_URL!, { maxRetriesPerRequest: null, lazyConnect: true })
  : null;
