import type { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';

import { PLATFORM_CODES } from '../constants/platforms';
import type { PlatformCode } from '../types/activity';
import { createTraceId } from '../utils/trace';
import { success } from '../utils/response';

const cacheQuerySchema = z.object({
  platform: z.enum(PLATFORM_CODES).optional(),
});

const cacheRoutes: FastifyPluginAsync = async (app) => {
  app.delete('/cache', async (request) => {
    const { platform } = cacheQuerySchema.parse(request.query);
    await app.activityService.invalidate(platform as PlatformCode | undefined);
    const traceId = createTraceId('cache');
    return success({ cleared: platform ?? 'all' }, traceId, '缓存已清理');
  });
};

export default cacheRoutes;
