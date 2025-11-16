import { buildServer } from './app';

async function start() {
  const app = await buildServer();
  try {
    await app.listen({ host: app.config.HOST, port: app.config.PORT });
    app.log.info(`服务已启动：http://${app.config.HOST}:${app.config.PORT}`);
  } catch (error) {
    app.log.error(error, '服务启动失败');
    process.exit(1);
  }
}

start();
