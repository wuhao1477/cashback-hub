import type { FastifyInstance } from 'fastify';
import fastifyEnv from '@fastify/env';

export const envSchema = {
  type: 'object',
  required: ['ZHE_TAOKE_APPKEY', 'ZHE_TAOKE_SID', 'ZHE_TAOKE_CUSTOMER_ID'],
  properties: {
    NODE_ENV: { type: 'string', default: 'development' },
    HOST: { type: 'string', default: '0.0.0.0' },
    PORT: { type: 'number', default: 3333 },
    ALLOWED_ORIGINS: { type: 'string', default: '*' },
    ZHE_TAOKE_APPKEY: { type: 'string' },
    ZHE_TAOKE_SID: { type: 'string' },
    ZHE_TAOKE_CUSTOMER_ID: { type: 'string' },
    REDIS_HOST: { type: 'string', default: '127.0.0.1' },
    REDIS_PORT: { type: 'number', default: 6379 },
    REDIS_PASSWORD: { type: 'string', default: '' },
    CACHE_TTL_MINUTES: { type: 'number', default: 20 },
  },
} as const;

export type AppConfig = {
  NODE_ENV: string;
  HOST: string;
  PORT: number;
  ALLOWED_ORIGINS: string;
  ZHE_TAOKE_APPKEY: string;
  ZHE_TAOKE_SID: string;
  ZHE_TAOKE_CUSTOMER_ID: string;
  REDIS_HOST: string;
  REDIS_PORT: number;
  REDIS_PASSWORD: string;
  CACHE_TTL_MINUTES: number;
};

export async function registerEnv(app: FastifyInstance) {
  await app.register(fastifyEnv, {
    schema: envSchema,
    dotenv: true,
    data: process.env,
    confKey: 'config',
  });
}
