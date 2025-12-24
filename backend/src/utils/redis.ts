import { createClient } from 'redis';
import type { RedisClientType } from 'redis';

let redisClient: RedisClientType | null = null;

export async function initRedis(redisUrl?: string): Promise<RedisClientType> {
  if (redisClient) {
    return redisClient;
  }

  redisClient = createClient({
    url: redisUrl || 'redis://localhost:6379',
    socket: {
      reconnectStrategy: (retries: number) => {
        if (retries > 10) {
          console.error('Redis: Max reconnection attempts reached');
          return new Error('Max reconnection attempts reached');
        }
        // Exponential backoff: 100ms, 200ms, 400ms, etc., max 3s
        const delay = Math.min(100 * Math.pow(2, retries), 3000);
        console.log(`Redis: Reconnecting in ${delay}ms (attempt ${retries + 1})`);
        return delay;
      },
    },
  });

  redisClient.on('error', err => {
    console.error('Redis Client Error:', err);
  });

  redisClient.on('connect', () => {
    console.log('Redis: Connecting...');
  });

  redisClient.on('ready', () => {
    console.log('Redis: Client ready');
  });

  // Retry connection with exponential backoff
  const maxRetries = 5;
  const baseDelay = 1000;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      await redisClient.connect();
      return redisClient;
    } catch (error: any) {
      if (attempt === maxRetries) {
        console.error(`Redis: Failed to connect after ${maxRetries} attempts`);
        throw error;
      }
      const delay = baseDelay * Math.pow(2, attempt - 1);
      console.log(`Redis: Connection attempt ${attempt} failed, retrying in ${delay}ms...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  return redisClient;
}

export function getRedisClient(): RedisClientType {
  if (!redisClient) {
    throw new Error('Redis client not initialized');
  }
  return redisClient;
}
