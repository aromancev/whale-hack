import { createClient, type RedisClientType } from "redis";

export type KvSetOptions = {
  ttlSeconds?: number;
};

export type KvStore = {
  get(key: string): Promise<string | null>;
  set(key: string, value: string, options?: KvSetOptions): Promise<void>;
  delete(key: string): Promise<void>;
  has(key: string): Promise<boolean>;
};

const redisUrl = process.env.REDIS_URL ?? "redis://localhost:6379";

let redisClientPromise: Promise<RedisClientType> | undefined;

export const kvStore: KvStore = createRedisKvStore();

export function createRedisKvStore(url = redisUrl): KvStore {
  return {
    async get(key) {
      return getRedisClient(url).then((client) => client.get(key));
    },

    async set(key, value, options = {}) {
      const client = await getRedisClient(url);

      if (options.ttlSeconds) {
        await client.set(key, value, { EX: options.ttlSeconds });
        return;
      }

      await client.set(key, value);
    },

    async delete(key) {
      const client = await getRedisClient(url);

      await client.del(key);
    },

    async has(key) {
      const client = await getRedisClient(url);

      return (await client.exists(key)) === 1;
    },
  };
}

async function getRedisClient(url: string) {
  redisClientPromise ??= createConnectedRedisClient(url);

  return redisClientPromise;
}

async function createConnectedRedisClient(url: string) {
  const client = createClient({ url });

  client.on("error", (error) => {
    console.error("Redis client error", error);
  });

  await client.connect();

  return client as RedisClientType;
}
