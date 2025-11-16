import type { FastifyPluginAsync } from 'fastify';
import { createTraceId } from '../utils/trace';
import { success } from '../utils/response';

const healthRoutes: FastifyPluginAsync = async (app) => {
  app.get('/healthz', async () => {
    const traceId = createTraceId('health');
    return success({ status: 'ok', uptime: process.uptime() }, traceId);
  });
};

export default healthRoutes;
