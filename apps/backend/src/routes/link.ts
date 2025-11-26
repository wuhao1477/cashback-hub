import type { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';

const convertSchema = z.object({
    platform: z.string(),
    content: z.string().min(1),
    externalInfo: z.string().optional(),
});

export const linkRoutes: FastifyPluginAsync = async (fastify) => {
    fastify.post('/convert', async (request, reply) => {
        const body = convertSchema.parse(request.body);
        const result = await fastify.linkService.convert(body);
        return result;
    });
};
