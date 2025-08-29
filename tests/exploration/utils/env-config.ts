import * as dotenv from 'dotenv'
import * as path from 'path'

// .envファイルを読み込み
const envPath = path.resolve(__dirname, '../../../.env')
dotenv.config({ path: envPath })

export interface ExplorationConfig {
  username: string
  password: string
  targetUrl: string
  timeout: number
  actionTimeout: number
}

export function getExplorationConfig(): ExplorationConfig {
  return {
    username: process.env.EXPLORATION_BASIC_AUTH_USERNAME || '',
    password: process.env.EXPLORATION_BASIC_AUTH_PASSWORD || '',
    targetUrl: process.env.EXPLORATION_TEST_TARGET_URL || '',
    timeout: parseInt(process.env.EXPLORATION_TIMEOUT || '30000'),
    actionTimeout: parseInt(process.env.EXPLORATION_ACTION_TIMEOUT || '30000'),
  }
}

// 環境変数が正しく読み込まれているかチェック
export function validateConfig(): void {
  const config = getExplorationConfig()

  // 必須環境変数のチェック
  if (!config.username) {
    throw new Error(
      'EXPLORATION_BASIC_AUTH_USERNAMEが設定されていません。.envファイルを確認してください。'
    )
  }

  if (!config.password) {
    throw new Error(
      'EXPLORATION_BASIC_AUTH_PASSWORDが設定されていません。.envファイルを確認してください。'
    )
  }

  if (!config.targetUrl) {
    throw new Error(
      'EXPLORATION_TEST_TARGET_URLが設定されていません。.envファイルを確認してください。'
    )
  }

  // URLの形式チェック
  try {
    new URL(config.targetUrl)
  } catch {
    throw new Error(`EXPLORATION_TEST_TARGET_URLの形式が正しくありません: ${config.targetUrl}`)
  }

  console.log('✅ 環境変数設定を読み込みました:')
  console.log(`  - 設定ファイル: ${envPath}`)
  console.log(`  - 対象URL: ${config.targetUrl}`)
  console.log(`  - ユーザー名: ${config.username.replace(/./g, '*')}`)
  console.log(`  - パスワード: ${config.password.replace(/./g, '*')}`)
  console.log(`  - タイムアウト: ${config.timeout}ms`)
  console.log(`  - アクションタイムアウト: ${config.actionTimeout}ms`)
}
