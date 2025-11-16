import type { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';

import { PLATFORM_CODES } from '../constants/platforms';
import type { PlatformCode } from '../types/activity';
import { success, failure } from '../utils/response';
import { normalizeError } from '../utils/errors';

const PlatformEnum = z.enum(PLATFORM_CODES);

const listQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional(),
  pageSize: z.coerce.number().int().positive().max(50).optional(),
  activityId: z.string().min(1).optional(),
});

const detailParamsSchema = z.object({
  platform: PlatformEnum,
  id: z.string().min(1),
});

const detailQuerySchema = z.object({
  linkType: z.coerce.number().int().optional(),
});

const listParamsSchema = z.object({
  platform: PlatformEnum,
});

const activitiesRoutes: FastifyPluginAsync = async (app) => {
  app.get('/activities/:platform', async (request, reply) => {
    const { platform } = listParamsSchema.parse(request.params);
    const query = listQuerySchema.parse(request.query);
    try {
      const result = await app.activityService.fetchList(platform as PlatformCode, query);
      return success(result, result.traceId);
    } catch (error) {
      const info = normalizeError(error, `${platform}-list-error`);
      reply.status(info.statusCode).send(failure(info.message, info.traceId, info.statusCode));
    }
  });

  app.get('/activities/:platform/:id', async (request, reply) => {
    const { platform, id } = detailParamsSchema.parse(request.params);
    const query = detailQuerySchema.parse(request.query);
    try {
      const result = await app.activityService.fetchDetail(platform as PlatformCode, id, query);
      return success(result, result.traceId);
    } catch (error) {
      const info = normalizeError(error, `${platform}-detail-error`);
      reply.status(info.statusCode).send(failure(info.message, info.traceId, info.statusCode));
    }
  });
};

export default activitiesRoutes;
