import { fileURLToPath, URL } from 'node:url';

import vue from '@vitejs/plugin-vue';
import { defineConfig } from 'vite';

const envDir = fileURLToPath(new URL('../../', import.meta.url));

// https://vite.dev/config/
export default defineConfig({
  envDir,
  plugins: [vue()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  server: {
    host: '0.0.0.0',
    port: 5173,
  },
  build: {
    // 代码分割优化
    rollupOptions: {
      output: {
        manualChunks: {
          'vue-vendor': ['vue', 'vue-router', 'pinia'],
          'vant-vendor': ['vant'],
          'utils': ['dayjs', 'crypto-js'],
        },
      },
    },
    // 生成 sourcemap 以便调试，生产环境可设为 false
    sourcemap: false,
    // 开启 CSS 代码分割
    cssCodeSplit: true,
    // 清理输出目录
    emptyOutDir: true,
    // chunk 大小警告的限制
    chunkSizeWarningLimit: 1000,
    // 打包后的文件大小报告
    reportCompressedSize: true,
  },
  // 优化依赖预构建
  optimizeDeps: {
    include: [
      'vue',
      'vue-router',
      'pinia',
      'vant',
      'dayjs',
      'axios',
    ],
  },
});
