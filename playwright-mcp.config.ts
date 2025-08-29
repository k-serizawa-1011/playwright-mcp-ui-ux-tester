import { defineConfig, devices } from '@playwright/test'
import { baseConfig } from './playwright.config'

export default defineConfig({
  ...baseConfig,
  testMatch: '**/exploration/**',
  // 探索テスト用の出力ディレクトリを上書き
  outputDir: './tests/exploration/outputs/test-results',
  // 外部サイトのテストなのでglobalSetupを無効化
  globalSetup: undefined,
  // 外部サイトのテストなのでwebServerも無効化
  webServer: undefined,
  use: {
    ...baseConfig.use,
    // 探索テスト用の設定
    viewport: { width: 1280, height: 720 },
    // スクリーンショットを自動保存
    screenshot: 'on',
    // ビデオ録画を有効化
    video: 'on-first-retry',
    // トレースを有効化
    trace: 'on',
    // 外部サイトのテストなのでタイムアウトを延長
    actionTimeout: 30 * 1000,
    navigationTimeout: 30 * 1000,
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
    {
      name: 'mobile-chrome',
      use: { ...devices['Pixel 5'] },
    },
    {
      name: 'mobile-safari',
      use: { ...devices['iPhone 12'] },
    },
  ],
  // 探索テスト用のタイムアウト設定（全ブラウザ実行時のため100秒に設定）
  timeout: 100 * 1000,
  expect: {
    timeout: 10 * 1000,
  },
  // レポート設定
  reporter: [
    ['html', { outputFolder: './tests/exploration/outputs/exploration-report' }],
    ['json', { outputFile: './tests/exploration/outputs/exploration-results.json' }],
    ['list'],
  ],
})
