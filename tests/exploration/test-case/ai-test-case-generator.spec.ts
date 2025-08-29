import { test, expect } from '@playwright/test'
import { getExplorationConfig, validateConfig } from '../utils/env-config'
import { AITestCaseGenerator } from '../utils/ai-test-case-generator.js'
import { AIPlaywrightCodeGenerator } from '../utils/ai-playwright-code-generator.js'
import * as fs from 'fs'
import * as path from 'path'

test.describe('AI自動テストケース生成テスト', () => {
  validateConfig()
  const config = getExplorationConfig()
  const targetUrl = config.targetUrl
  const resultsDir = './tests/exploration/outputs'
  const username = config.username
  const password = config.password

  test.setTimeout(180000) // タイムアウトを3分に延長

  test('AI自動テストケース生成テスト', async ({ browser }) => {
    console.log('🤖 AI自動テストケース生成テスト開始')

    const context = await browser.newContext({
      httpCredentials: { username, password },
    })
    const page = await context.newPage()

    try {
      await page.goto(targetUrl)
      await page.waitForLoadState('domcontentloaded')

      const generator = new AITestCaseGenerator(page)
      const codeGenerator = new AIPlaywrightCodeGenerator(page)

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

      const initialScreenshotPath = path.join(screenshotDir, `ai-test-case-${timestamp}-initial.png`)
      await page.screenshot({ path: initialScreenshotPath, fullPage: true })
      console.log(`📸 初期画面スクリーンショット保存: ${initialScreenshotPath}`)

      // 2. ページの分析とテストケース生成
      console.log('🔍 ページの分析を開始...')
      const pageAnalysis = await generator.analyzePage()
      console.log(`📊 ページ分析完了: ${pageAnalysis.elements.length}個の要素を検出`)

      // 3. AIによるテストケース生成
      console.log('🤖 AIによるテストケース生成を開始...')
      const testCases = await generator.generateTestCases(pageAnalysis)
      console.log(`📝 生成されたテストケース数: ${testCases.length}個`)

      // 4. テストケースの実行
      console.log('🚀 テストケースの実行を開始...')
      const executionResults = await generator.executeTestCases(testCases)
      console.log(`✅ 実行完了: ${executionResults.length}個のテストケースを実行`)

      // 5. Playwrightテストコードの生成
      console.log('📝 Playwrightテストコードの生成を開始...')
      const generatedTestCode = await codeGenerator.generatePlaywrightTestCode(pageAnalysis, testCases)
      const testCodePath = await codeGenerator.saveGeneratedTestCode(generatedTestCode)
      console.log(`📄 Playwrightテストコード生成完了: ${testCodePath}`)

      // 6. 結果の保存
      const resultsPath = path.join(resultsDir, `ai-test-case-results-${timestamp}.json`)
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
        pageAnalysis,
        testCases,
        executionResults,
        generatedTestCode: {
          fileName: generatedTestCode.testFileName,
          filePath: testCodePath,
          description: generatedTestCode.description
        },
        screenshots: [initialScreenshotPath]
      }

      fs.writeFileSync(resultsPath, JSON.stringify(resultsData, null, 2))
      console.log(`💾 結果を保存しました: ${resultsPath}`)

      // 6. 結果サマリーの表示
      const successCount = executionResults.filter(r => r.success).length
      const errorCount = executionResults.filter(r => !r.success).length
      
      console.log(`\n📊 AI自動テストケース生成結果サマリー:`)
      console.log(`🔍 検出された要素: ${pageAnalysis.elements.length}個`)
      console.log(`📝 生成されたテストケース: ${testCases.length}個`)
      console.log(`✅ 成功: ${successCount}個`)
      console.log(`❌ 失敗: ${errorCount}個`)
      console.log(`📊 成功率: ${executionResults.length > 0 ? Math.round((successCount / executionResults.length) * 100) : 0}%`)

      // 7. 生成されたPlaywrightテストコードの情報表示
      console.log(`\n📝 生成されたPlaywrightテストコード:`)
      console.log(`📄 ファイル名: ${generatedTestCode.testFileName}`)
      console.log(`📁 保存場所: ${testCodePath}`)
      console.log(`📋 説明: ${generatedTestCode.description}`)

      // 8. 生成されたテストケースの詳細表示
      console.log(`\n📋 生成されたテストケース:`)
      testCases.forEach((testCase, index) => {
        console.log(`${index + 1}. ${testCase.description}`)
        console.log(`   🔧 操作: ${testCase.action}`)
        console.log(`   🎯 要素: ${testCase.elementSelector}`)
        if (testCase.expectedResult) {
          console.log(`   ✅ 期待結果: ${testCase.expectedResult}`)
        }
        console.log('')
      })

      // 8. 実行結果の詳細表示
      if (errorCount > 0) {
        console.log(`\n❌ 失敗したテストケース:`)
        executionResults
          .filter(r => !r.success)
          .forEach((result, index) => {
            console.log(`  ${index + 1}. ${result.testCaseDescription}`)
            console.log(`     🚫 エラー: ${result.error}`)
            console.log('')
          })
      }

      console.log('✅ AI自動テストケース生成テスト完了')

    } catch (error) {
      console.error('❌ AI自動テストケース生成テストでエラーが発生しました:', error)
      throw error
    } finally {
      await context.close()
    }
  })
})
