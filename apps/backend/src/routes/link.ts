/**
 * 转链路由
 * 使用 @cashback/core 的 PlatformService 处理转链请求
 */

import type { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { createBackendPlatformService } from '../services/platformService';
import type { PlatformCode } from '@cashback/core';

/** 转链请求参数校验 */
const convertSchema = z.object({
    platform: z.enum(['meituan', 'eleme', 'douyin']),
    content: z.string().min(1),
    externalInfo: z.string().optional(),
});

/**
 * 转链路由插件
 * POST /convert - 将商品链接转换为返利链接
 */
export const linkRoutes: FastifyPluginAsync = async (fastify) => {
    fastify.post('/convert', async (request, reply) => {
        const body = convertSchema.parse(request.body);
        
        // 使用 @cashback/core 的 PlatformService 进行转链
        const platformService = createBackendPlatformService(fastify.config);
        const result = await platformService.convertLink(body.platform as PlatformCode, {
            content: body.content,
            externalInfo: body.externalInfo,
        });
        
        return result;
    });
};
