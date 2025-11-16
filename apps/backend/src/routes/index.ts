import type { FastifyPluginAsync } from 'fastify';
import activitiesRoutes from './activities';
import platformRoutes from './platforms';
import cacheRoutes from './cache';
import healthRoutes from './health';

const apiRoutes: FastifyPluginAsync = async (app) => {
  await app.register(healthRoutes);
  await app.register(platformRoutes);
  await app.register(activitiesRoutes);
  await app.register(cacheRoutes);
};

export default apiRoutes;
