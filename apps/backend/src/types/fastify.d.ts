import type { CacheClient } from '../plugins/cache';
import type { ActivityService } from '../services/activityService';
import type { AppConfig } from '../config/env';

declare module 'fastify' {
  interface FastifyInstance {
    config: AppConfig;
    cache: CacheClient;
    activityService: ActivityService;
  }
}
