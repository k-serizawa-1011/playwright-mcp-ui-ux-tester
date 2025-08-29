import { test, expect } from '@playwright/test'
import { getExplorationConfig, validateConfig } from '../utils/env-config'
import { NavigationTestHelper, NavigationResult } from '../utils/ai-navigation-helper.js'
import * as fs from 'fs'
import * as path from 'path'

test.describe('画面遷移テスト', () => {
  validateConfig()
  const config = getExplorationConfig()
  const targetUrl = config.targetUrl
  const resultsDir = './tests/exploration/outputs'
  const username = config.username
  const password = config.password

  test.setTimeout(120000) // タイムアウトを2分に延長

  test('画面遷移テスト', async ({ browser }) => {
    console.log('🔍 画面遷移テスト開始')

    const context = await browser.newContext({
      httpCredentials: { username, password },
    })
    const page = await context.newPage()

    try {
      await page.goto(targetUrl)
      await page.waitForLoadState('domcontentloaded')

      const helper = new NavigationTestHelper(page)

    // 結果ディレクトリの作成
    if (!fs.existsSync(resultsDir)) {
      fs.mkdirSync(resultsDir, { recursive: true })
    }

    // スクリーンショットディレクトリの作成
    const screenshotDir = path.join(resultsDir, 'screenshots')
    if (!fs.existsSync(screenshotDir)) {
      fs.mkdirSync(screenshotDir, { recursive: true })
    }

    // 1. 初期画面のスクリーンショット
    const now = new Date()
    const timestamp =
      now.getFullYear().toString() +
      (now.getMonth() + 1).toString().padStart(2, '0') +
      now.getDate().toString().padStart(2, '0') +
      now.getHours().toString().padStart(2, '0') +
      now.getMinutes().toString().padStart(2, '0') +
      now.getSeconds().toString().padStart(2, '0') +
      now.getMilliseconds().toString().padStart(3, '0')

    const initialScreenshotPath = path.join(screenshotDir, `navigation-test-${timestamp}-initial.png`)
    await page.screenshot({ path: initialScreenshotPath, fullPage: true })
    console.log(`📸 初期画面スクリーンショット保存: ${initialScreenshotPath}`)

    // 2. クリック可能な要素の検出
    const clickableElements = await helper.detectClickableElements()
    console.log(`🔍 検出されたクリック可能要素数: ${clickableElements.length}個`)

    // 3. フォーム入力フィールドの検出
    const inputFields = await helper.detectInputFields()
    console.log(`📝 検出された入力フィールド数: ${inputFields.length}個`)

    // 4. 画面遷移テストの実行
    const navigationResults = await helper.performNavigationTests(clickableElements, inputFields)
    console.log(`🚀 実行された画面遷移テスト数: ${navigationResults.length}個`)

    // 5. 結果の保存
    const resultsPath = path.join(resultsDir, `navigation-results-${timestamp}.json`)
    let pageTitle = 'unknown'
    try {
      pageTitle = await page.title()
    } catch (error) {
      console.log('⚠️ ページタイトルの取得に失敗しました')
    }
    
    const resultsData = {
      url: targetUrl,
      title: pageTitle,
      timestamp: new Date().toISOString(),
      clickableElements: clickableElements.length,
      inputFields: inputFields.length,
      navigationTests: navigationResults.length,
      results: navigationResults,
      screenshots: [initialScreenshotPath]
    }

    fs.writeFileSync(resultsPath, JSON.stringify(resultsData, null, 2))
    console.log(`💾 結果を保存しました: ${resultsPath}`)

    // 6. 成功した遷移のスクリーンショット
    const successfulNavigations = navigationResults.filter((result: NavigationResult) => result.success)
    for (let i = 0; i < successfulNavigations.length; i++) {
      const result = successfulNavigations[i]
      if (result.screenshotPath) {
        console.log(`📸 遷移成功スクリーンショット: ${result.screenshotPath}`)
      }
    }

    // 7. 結果サマリーの表示
    const successCount = navigationResults.filter((r: NavigationResult) => r.success).length
    const errorCount = navigationResults.filter((r: NavigationResult) => !r.success).length
    
    console.log(`\n📊 画面遷移テスト結果サマリー:`)
    console.log(`✅ 成功: ${successCount}個`)
    console.log(`❌ 失敗: ${errorCount}個`)
    console.log(`📝 入力フィールド処理: ${inputFields.length}個`)
    console.log(`🔗 クリック可能要素: ${clickableElements.length}個`)

    if (errorCount > 0) {
      console.log(`\n❌ 失敗した遷移:`)
      navigationResults
        .filter((r: NavigationResult) => !r.success)
        .forEach((result: NavigationResult, index: number) => {
          console.log(`  ${index + 1}. ${result.elementType}: ${result.error}`)
        })
    }

      console.log('✅ 画面遷移テスト完了')
    } catch (error) {
      console.error('❌ 画面遷移テストでエラーが発生しました:', error)
      throw error
    } finally {
      await context.close()
    }
  })
})
