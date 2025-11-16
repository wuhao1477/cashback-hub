import type { FastifyPluginAsync } from 'fastify';
import { PLATFORM_META } from '../constants/platforms';
import { createTraceId } from '../utils/trace';
import { success } from '../utils/response';

const platformRoutes: FastifyPluginAsync = async (app) => {
  app.get('/platforms', async () => {
    const traceId = createTraceId('platforms');
    return success(Object.values(PLATFORM_META), traceId);
  });
};

export default platformRoutes;
