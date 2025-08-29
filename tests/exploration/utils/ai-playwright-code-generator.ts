import { Page } from '@playwright/test'
import * as fs from 'fs'
import * as path from 'path'

export interface GeneratedTestCode {
  testFileName: string
  testCode: string
  description: string
  testCases: TestCaseInfo[]
}

export interface TestCaseInfo {
  name: string
  description: string
  selector: string
  action: string
  expectedResult: string
}

export class AIPlaywrightCodeGenerator {
  constructor(private page: Page) {}

  /**
   * Playwrightテストコードを生成
   */
  async generatePlaywrightTestCode(pageAnalysis: any, testCases: any[]): Promise<GeneratedTestCode> {
    const pageTitle = await this.page.title()
    const url = this.page.url()
    
    // JST形式のタイムスタンプを生成
    const now = new Date()
    const jstTimestamp = 
      now.getFullYear().toString() +
      (now.getMonth() + 1).toString().padStart(2, '0') +
      now.getDate().toString().padStart(2, '0') +
      now.getHours().toString().padStart(2, '0') +
      now.getMinutes().toString().padStart(2, '0') +
      now.getSeconds().toString().padStart(2, '0') +
      'JST'
    
    const testFileName = `ai-generated-test-${jstTimestamp}.spec.ts`

    // テストケース情報を収集
    const testCaseInfos: TestCaseInfo[] = testCases.map((testCase, index) => ({
      name: `testCase${index + 1}`,
      description: testCase.description,
      selector: testCase.elementSelector,
      action: testCase.action,
      expectedResult: testCase.expectedResult || '正常に動作する'
    }))

    // Playwrightテストコードを生成
    const testCode = this.generateTestCode(pageTitle, url, testCaseInfos)

    return {
      testFileName,
      testCode,
      description: `${pageTitle}の自動生成テスト`,
      testCases: testCaseInfos
    }
  }

  /**
   * Playwrightテストコードのテンプレートを生成
   */
  private generateTestCode(pageTitle: string, url: string, testCases: TestCaseInfo[]): string {
    const imports = this.generateImports()
    const testDescription = this.generateTestDescription(pageTitle, url)
    const testCasesCode = this.generateTestCasesCode(testCases)
    const helperFunctions = this.generateHelperFunctions()

    return `${imports}

${testDescription}

${helperFunctions}

${testCasesCode}
`
  }

  /**
   * インポート文を生成
   */
  private generateImports(): string {
    return `import { test, expect } from '@playwright/test'
import { getExplorationConfig, validateConfig } from '../utils/env-config'
import * as fs from 'fs'
import * as path from 'path'

// AI自動生成テスト - ${new Date().toLocaleString('ja-JP', { timeZone: 'Asia/Tokyo' })}
// このファイルはAIによって自動生成されました
`
  }

  /**
   * テスト説明を生成
   */
  private generateTestDescription(pageTitle: string, url: string): string {
    return `test.describe('AI自動生成テスト - ${pageTitle}', () => {
  validateConfig()
  const config = getExplorationConfig()
  const targetUrl = config.targetUrl
  const resultsDir = './tests/exploration/outputs'
  const username = config.username
  const password = config.password

  test.setTimeout(120000) // タイムアウトを2分に設定

  test.beforeEach(async ({ page }) => {
    // 基本認証の設定
    await page.setExtraHTTPHeaders({
      'Authorization': 'Basic ' + Buffer.from(\`\${username}:\${password}\`).toString('base64')
    })
  })

  test('初期ページ読み込みテスト', async ({ page }) => {
    console.log('🚀 AI自動生成テスト開始')
    console.log(\`📄 ページタイトル: ${pageTitle}\`)
    console.log(\`🔗 対象URL: ${url}\`)

    await page.goto(targetUrl)
    await page.waitForLoadState('domcontentloaded')

    // ページタイトルの確認
    const title = await page.title()
    expect(title).toBeTruthy()
    console.log(\`✅ ページタイトル確認: \${title}\`)

    // スクリーンショット撮影
    const screenshotPath = await takeScreenshot(page, 'initial-page-load')
    console.log(\`📸 初期スクリーンショット: \${screenshotPath}\`)
  })
`
  }

  /**
   * ヘルパー関数を生成
   */
  private generateHelperFunctions(): string {
    return `
  /**
   * スクリーンショットを撮影
   */
  async function takeScreenshot(page: any, name: string): Promise<string> {
    const resultsDir = './tests/exploration/outputs'
    const screenshotDir = path.join(resultsDir, 'screenshots')
    
    if (!fs.existsSync(screenshotDir)) {
      fs.mkdirSync(screenshotDir, { recursive: true })
    }
    
    const now = new Date()
    const jstTimestamp = 
      now.getFullYear().toString() +
      (now.getMonth() + 1).toString().padStart(2, '0') +
      now.getDate().toString().padStart(2, '0') +
      now.getHours().toString().padStart(2, '0') +
      now.getMinutes().toString().padStart(2, '0') +
      now.getSeconds().toString().padStart(2, '0') +
      'JST'
    
    const screenshotPath = path.join(screenshotDir, \`ai-generated-\${name}-\${jstTimestamp}.png\`)
    
    await page.screenshot({ path: screenshotPath, fullPage: true })
    return screenshotPath
  }

  /**
   * 要素が表示されるまで待機
   */
  async function waitForElement(page: any, selector: string, timeout = 10000): Promise<void> {
    try {
      await page.waitForSelector(selector, { timeout })
    } catch (error) {
      throw new Error(\`要素が見つかりません: \${selector}\`)
    }
  }

  /**
   * テスト結果を記録
   */
  function logTestResult(testName: string, success: boolean, details?: string): void {
    const status = success ? '✅' : '❌'
    console.log(\`\${status} \${testName}\`)
    if (details) {
      console.log(\`   📝 \${details}\`)
    }
  }
`
  }

  /**
   * テストケースコードを生成
   */
  private generateTestCasesCode(testCases: TestCaseInfo[]): string {
    let testCasesCode = ''

    testCases.forEach((testCase, index) => {
      const testCaseCode = this.generateIndividualTestCase(testCase, index + 1)
      testCasesCode += testCaseCode + '\n'
    })

    return testCasesCode
  }

  /**
   * 個別テストケースを生成
   */
  private generateIndividualTestCase(testCase: TestCaseInfo, index: number): string {
    const testName = testCase.name
    const description = testCase.description
    const selector = testCase.selector
    const action = testCase.action
    const expectedResult = testCase.expectedResult

    // 特殊文字を除去して安全なテストタイトルを生成
    const safeDescription = description
      .replace(/['"]/g, '') // シングルクォートとダブルクォートを除去
      .replace(/[^\w\s\-()]/g, '') // 英数字、スペース、ハイフン、括弧以外を除去
      .trim()
    
    // 重複を避けるためにインデックス番号を追加
    const uniqueDescription = `${safeDescription} (${index})`

    // console.log用にシングルクォートをエスケープ
    const escapedDescription = description.replace(/'/g, "\\'")

    let testCode = `  test('${uniqueDescription}', async ({ page }) => {
    console.log('🧪 テストケース${index}: ${escapedDescription}')
    
    await page.goto(targetUrl)
    await page.waitForLoadState('domcontentloaded')
    
    try {
`

    // アクションに応じたテストコードを生成
    switch (action) {
      case 'click':
        testCode += this.generateClickTestCode(selector, expectedResult)
        break
      case 'input':
        testCode += this.generateInputTestCode(selector, expectedResult)
        break
      case 'input_and_search':
        testCode += this.generateInputAndSearchTestCode(selector, expectedResult)
        break
      case 'validation':
        testCode += this.generateValidationTestCode(selector, expectedResult)
        break
      default:
        testCode += this.generateGenericTestCode(selector, action, expectedResult)
    }

    testCode += `
      logTestResult('${escapedDescription}', true, '${expectedResult}')
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      logTestResult('${escapedDescription}', false, errorMessage)
      throw error
    }
  })
`

    return testCode
  }

  /**
   * クリックテストコードを生成
   */
  private generateClickTestCode(selector: string, expectedResult: string): string {
    return `      // 要素が表示されるまで待機
      await waitForElement(page, '${selector}')
      
      // クリック前の状態を記録
      const urlBefore = page.url()
      const titleBefore = await page.title()
      
      // 要素をクリック
      await page.click('${selector}')
      
      // 画面遷移を待機
      await page.waitForTimeout(2000)
      
      // クリック後の状態を確認
      const urlAfter = page.url()
      const titleAfter = await page.title()
      
      // スクリーンショット撮影
      const screenshotPath = await takeScreenshot(page, 'click-test-${selector.replace(/[^a-zA-Z0-9]/g, '-')}')
      
      // 遷移が発生したかチェック
      const hasNavigation = urlBefore !== urlAfter || titleBefore !== titleAfter
      expect(hasNavigation).toBeTruthy()
      
      console.log(\`   🔗 URL変更: \${urlBefore} → \${urlAfter}\`)
      console.log(\`   📄 タイトル変更: \${titleBefore} → \${titleAfter}\`)
      console.log(\`   📸 スクリーンショット: \${screenshotPath}\`)`
  }

  /**
   * 入力テストコードを生成
   */
  private generateInputTestCode(selector: string, expectedResult: string): string {
    return `      // 要素が表示されるまで待機
      await waitForElement(page, '${selector}')
      
      // テスト値を生成
      const testValue = generateTestValue('text')
      
      // 要素に値を入力
      await page.fill('${selector}', testValue)
      await page.waitForTimeout(500)
      
      // 入力値が正しく反映されているかチェック
      const actualValue = await page.inputValue('${selector}')
      expect(actualValue).toBe(testValue)
      
      console.log(\`   📝 入力値: \${testValue}\`)
      console.log(\`   ✅ 実際の値: \${actualValue}\`)`
  }

  /**
   * 入力と検索テストコードを生成
   */
  private generateInputAndSearchTestCode(selector: string, expectedResult: string): string {
    return `      // 要素が表示されるまで待機
      await waitForElement(page, '${selector}')
      
      // 検索クエリを入力
      const searchQuery = 'test search query'
      await page.fill('${selector}', searchQuery)
      
      // 検索を実行（Enterキーまたは検索ボタン）
      const searchButton = await page.$('input[type="submit"], button[type="submit"]')
      if (searchButton) {
        await searchButton.click()
      } else {
        await page.keyboard.press('Enter')
      }
      
      // 検索結果の読み込みを待機
      await page.waitForTimeout(3000)
      
      // 検索が実行されたかチェック
      const urlAfter = page.url()
      const titleAfter = await page.title()
      
      // スクリーンショット撮影
      const screenshotPath = await takeScreenshot(page, 'search-test')
      
      // 検索結果が表示されているかチェック
      const isSearchResult = urlAfter.includes('search') || titleAfter.includes('検索') || titleAfter.includes(searchQuery)
      expect(isSearchResult).toBeTruthy()
      
      console.log(\`   🔍 検索クエリ: \${searchQuery}\`)
      console.log(\`   🔗 検索後URL: \${urlAfter}\`)
      console.log(\`   📸 スクリーンショット: \${screenshotPath}\`)`
  }

  /**
   * バリデーションテストコードを生成
   */
  private generateValidationTestCode(selector: string, expectedResult: string): string {
    return `      // 要素が表示されるまで待機
      await waitForElement(page, '${selector}')
      
      // 空の値を入力してバリデーションをトリガー
      await page.fill('${selector}', '')
      await page.blur('${selector}')
      await page.waitForTimeout(1000)
      
      // エラーメッセージの検出
      const errorMessages = await page.$$eval(
        '[class*="error"], [class*="invalid"], .error-message, .validation-error',
        elements => elements.map(el => el.textContent?.trim()).filter(Boolean)
      )
      
      // バリデーションエラーが表示されているかチェック
      expect(errorMessages.length).toBeGreaterThan(0)
      
      console.log(\`   🚫 検出されたエラーメッセージ: \${errorMessages.length}個\`)
      errorMessages.forEach((msg, index) => {
        console.log(\`      \${index + 1}. \${msg}\`)
      })`
  }

  /**
   * 汎用テストコードを生成
   */
  private generateGenericTestCode(selector: string, action: string, expectedResult: string): string {
    return `      // 要素が表示されるまで待機
      await waitForElement(page, '${selector}')
      
      // 要素の存在を確認
      const element = await page.$(selector)
      expect(element).toBeTruthy()
      
      // 要素が有効かチェック
      const isEnabled = await element.isEnabled()
      expect(isEnabled).toBeTruthy()
      
      // 要素が表示されているかチェック
      const isVisible = await element.isVisible()
      expect(isVisible).toBeTruthy()
      
      console.log(\`   🎯 要素: \${selector}\`)
      console.log(\`   ✅ 有効: \${isEnabled}\`)
      console.log(\`   👁️ 表示: \${isVisible}\`)`
  }

  /**
   * テスト用の値を生成する関数を追加
   */
  private generateTestValueFunction(): string {
    return `
  /**
   * テスト用の値を生成
   */
  function generateTestValue(type: string): string {
    switch (type.toLowerCase()) {
      case 'email':
        return 'test@example.com'
      case 'password':
        return 'testpassword123'
      case 'tel':
        return '090-1234-5678'
      case 'url':
        return 'https://example.com'
      case 'number':
        return '123'
      case 'search':
        return 'test search query'
      default:
        return 'test input value'
    }
  }
`
  }

  /**
   * 生成されたテストコードをファイルに保存
   */
  async saveGeneratedTestCode(generatedCode: GeneratedTestCode): Promise<string> {
    const testsDir = './tests/exploration/generated'
    
    // ディレクトリが存在しない場合は作成
    if (!fs.existsSync(testsDir)) {
      fs.mkdirSync(testsDir, { recursive: true })
    }
    
    const filePath = path.join(testsDir, generatedCode.testFileName)
    fs.writeFileSync(filePath, generatedCode.testCode, 'utf8')
    
    return filePath
  }
}
