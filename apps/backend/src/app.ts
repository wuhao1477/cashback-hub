import Fastify from 'fastify';
import cors from '@fastify/cors';
import rateLimit from '@fastify/rate-limit';
import fastifyRedis from '@fastify/redis';
import type * as FastifyRedisNS from '@fastify/redis';

import { registerEnv } from './config/env';
import { registerCache } from './plugins/cache';
import { ActivityService } from './services/activityService';
import routes from './routes';

export async function buildServer() {
  const app = Fastify({
    logger: {
      level: 'info',
    },
  });

  await registerEnv(app);

  await app.register(cors, {
    origin: (origin, cb) => {
      const allowed = app.config.ALLOWED_ORIGINS;
      if (allowed === '*' || !origin) {
        cb(null, true);
        return;
      }
      const whitelist = allowed.split(',').map((value) => value.trim());
      cb(null, whitelist.includes(origin));
    },
    credentials: true,
  });

  await app.register(rateLimit, {
    max: 60,
    timeWindow: '1 minute',
    allowList: ['127.0.0.1'],
  });

  let redisClient: FastifyRedisNS.FastifyRedis | undefined;
  try {
    await app.register(fastifyRedis, {
      host: app.config.REDIS_HOST,
      port: app.config.REDIS_PORT,
      password: app.config.REDIS_PASSWORD || undefined,
      enableOfflineQueue: false,
    });
    redisClient = app.redis;
  } catch (error) {
    app.log.warn({ err: error }, 'Redis 连接失败，将回退到内存缓存');
  }

  await registerCache(app, redisClient);

  app.decorate('activityService', new ActivityService(app.config, app.cache));

  await app.register(routes, { prefix: '/api' });

  return app;
}
