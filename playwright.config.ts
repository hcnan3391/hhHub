import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright 配置文件
 * @see https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
  // 测试文件目录
  testDir: './e2e',

  // 测试文件匹配模式
  testMatch: '**/*.spec.ts',

  // 测试超时时间
  timeout: 30 * 1000,

  // 期望超时时间
  expect: {
    timeout: 5000,
  },

  // 禁止在测试文件中并行执行
  fullyParallel: false,

  // 失败时保留 artifacts
  forbidOnly: !!process.env.CI,

  // 重试次数（CI 环境重试 2 次）
  retries: process.env.CI ? 2 : 0,

  // 并行工作者数量
  workers: process.env.CI ? 1 : undefined,

  // 测试报告配置
  reporter: [
    ['html', { open: 'never' }],
    ['list'],
  ],

  // 共享配置
  use: {
    // 基础 URL
    baseURL: 'http://localhost:3000',

    // 跟踪记录（仅在重试时保存）
    trace: 'on-first-retry',

    // 截图（仅在失败时保存）
    screenshot: 'only-on-failure',

    // 视频（仅在失败时保存）
    video: 'on-first-retry',

    // 视口大小
    viewport: { width: 1280, height: 720 },

    // 动作超时
    actionTimeout: 15000,

    // 导航超时
    navigationTimeout: 15000,
  },

  // 项目配置（不同浏览器）
  projects: [
    {
      name: 'chrome',
      use: {
        ...devices['Desktop Chrome'],
        channel: 'chrome', // 使用本地 Chrome，无需下载
      },
    },
    // 如需其他浏览器，取消下面注释：
    // {
    //   name: 'edge',
    //   use: { ...devices['Desktop Edge'], channel: 'msedge' },
    // },
  ],

  // 本地开发服务器配置
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000,
  },

  // 输出目录
  outputDir: 'test-results/',
});
