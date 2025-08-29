import { Page, Locator } from '@playwright/test'
import * as fs from 'fs'
import * as path from 'path'

export interface PageElement {
  selector: string
  tagName: string
  type: string
  text: string
  attributes: Record<string, string>
  isVisible: boolean
  isEnabled: boolean
  position: { x: number; y: number; width: number; height: number }
  role?: string
  ariaLabel?: string
  placeholder?: string
  value?: string
  href?: string
}

export interface PageAnalysis {
  url: string
  title: string
  elements: PageElement[]
  formCount: number
  buttonCount: number
  linkCount: number
  inputCount: number
  interactiveElements: PageElement[]
}

export interface TestCase {
  id: string
  description: string
  elementSelector: string
  action: string
  inputValue?: string
  expectedResult?: string
  priority: 'high' | 'medium' | 'low'
  category: 'navigation' | 'input' | 'interaction' | 'validation'
  dependencies?: string[]
}

export interface TestExecutionResult {
  testCaseId: string
  testCaseDescription: string
  success: boolean
  error?: string
  executionTime: number
  screenshotPath?: string
  urlBefore: string
  urlAfter?: string
  titleBefore: string
  titleAfter?: string
  actualResult?: string
}

export class AITestCaseGenerator {
  constructor(private page: Page) {}

  /**
   * ページの詳細分析を実行
   */
  async analyzePage(): Promise<PageAnalysis> {
    const analysis = await this.page.evaluate(() => {
      const elements: Array<{
        selector: string
        tagName: string
        type: string
        text: string
        attributes: Record<string, string>
        isVisible: boolean
        isEnabled: boolean
        position: { x: number; y: number; width: number; height: number }
        role?: string
        ariaLabel?: string
        placeholder?: string
        value?: string
        href?: string
      }> = []

      // インタラクティブな要素を検出
      const interactiveSelectors = [
        'button',
        'a[href]',
        'input',
        'textarea',
        'select',
        '[role="button"]',
        '[role="link"]',
        '[role="menuitem"]',
        '[onclick]',
        '[data-testid]',
        '[class*="btn"]',
        '[class*="button"]',
        '[class*="link"]',
        '[class*="menu"]',
        '[class*="nav"]'
      ]

      interactiveSelectors.forEach(selector => {
        const foundElements = document.querySelectorAll(selector)
        foundElements.forEach((element, index) => {
          const el = element as HTMLElement
          
          if (el.offsetParent !== null && 
              el.style.display !== 'none' && 
              el.style.visibility !== 'hidden') {
            
            const rect = el.getBoundingClientRect()
            const attributes: Record<string, string> = {}
            
            // 属性を収集
            for (let i = 0; i < el.attributes.length; i++) {
              const attr = el.attributes[i]
              attributes[attr.name] = attr.value
            }

            let uniqueSelector = selector
            if (index > 0) {
              uniqueSelector = `${selector}:nth-of-type(${index + 1})`
            }

            elements.push({
              selector: uniqueSelector,
              tagName: el.tagName.toLowerCase(),
              type: (el as HTMLInputElement).type || el.tagName.toLowerCase(),
              text: el.textContent?.trim() || '',
              attributes,
              isVisible: true,
              isEnabled: !(el as HTMLButtonElement | HTMLInputElement).disabled,
              position: {
                x: rect.x,
                y: rect.y,
                width: rect.width,
                height: rect.height
              },
              role: el.getAttribute('role') || undefined,
              ariaLabel: el.getAttribute('aria-label') || undefined,
              placeholder: (el as HTMLInputElement).placeholder || undefined,
              value: (el as HTMLInputElement).value || undefined,
              href: (el as HTMLAnchorElement).href || undefined
            })
          }
        })
      })

      return {
        url: window.location.href,
        title: document.title,
        elements,
        formCount: document.querySelectorAll('form').length,
        buttonCount: document.querySelectorAll('button, input[type="button"], input[type="submit"]').length,
        linkCount: document.querySelectorAll('a[href]').length,
        inputCount: document.querySelectorAll('input, textarea, select').length,
        interactiveElements: elements.filter(el => 
          el.tagName === 'button' || 
          el.tagName === 'a' || 
          el.tagName === 'input' ||
          el.role === 'button' ||
          el.role === 'link'
        )
      }
    })

    return analysis
  }

  /**
   * AIによるテストケース生成
   */
  async generateTestCases(analysis: PageAnalysis): Promise<TestCase[]> {
    const testCases: TestCase[] = []
    let testCaseId = 1

    // 検索機能のテストケース
    const searchInputs = analysis.elements.filter(el => 
      el.type === 'search' || 
      el.type === 'text' || // Googleの検索ボックスは通常text型
      el.placeholder?.toLowerCase().includes('search') ||
      el.placeholder?.toLowerCase().includes('検索') ||
      el.ariaLabel?.toLowerCase().includes('search') ||
      el.ariaLabel?.toLowerCase().includes('検索') ||
      el.attributes.name?.toLowerCase().includes('q') || // Google検索のname属性
      el.attributes.id?.toLowerCase().includes('search') ||
      el.attributes.id?.toLowerCase().includes('q')
    )

    for (const searchInput of searchInputs.slice(0, 2)) {
      // より具体的な名前を生成
      const searchName = searchInput.placeholder || searchInput.ariaLabel || '検索'
      const selectorInfo = searchInput.selector.replace(/[^a-zA-Z0-9]/g, '-')
      const uniqueDescription = `検索機能のテスト: "${searchName}" (${selectorInfo})`
      
      testCases.push({
        id: `TC${testCaseId++}`,
        description: uniqueDescription,
        elementSelector: searchInput.selector,
        action: 'input_and_search',
        inputValue: 'test search query',
        expectedResult: '検索結果が表示される',
        priority: 'high',
        category: 'input'
      })
    }

    // 検索ボタンのテストケース（検索機能の一部として）
    const searchButtons = analysis.elements.filter(el => 
      (el.tagName === 'button' || el.tagName === 'input') &&
      (el.type === 'submit' || 
       el.text?.toLowerCase().includes('search') ||
       el.text?.toLowerCase().includes('検索') ||
       el.ariaLabel?.toLowerCase().includes('search') ||
       el.ariaLabel?.toLowerCase().includes('検索') ||
       el.value?.toLowerCase().includes('search') ||
       el.value?.toLowerCase().includes('検索'))
    )

    for (const searchButton of searchButtons.slice(0, 1)) {
      // より具体的な名前を生成
      const buttonName = searchButton.text || searchButton.value || searchButton.ariaLabel || '検索ボタン'
      const selectorInfo = searchButton.selector.replace(/[^a-zA-Z0-9]/g, '-')
      const uniqueDescription = `検索ボタンのテスト: "${buttonName}" (${selectorInfo})`
      
      testCases.push({
        id: `TC${testCaseId++}`,
        description: uniqueDescription,
        elementSelector: searchButton.selector,
        action: 'click',
        expectedResult: '検索が実行される',
        priority: 'high',
        category: 'input'
      })
    }

    // ナビゲーションリンクのテストケース
    const navigationLinks = analysis.elements.filter(el => 
      el.tagName === 'a' && 
      el.href && 
      !el.href.startsWith('#') &&
      !el.href.startsWith('javascript:')
    )

    for (const link of navigationLinks.slice(0, 3)) {
      // より具体的な名前を生成
      const linkName = link.text || link.ariaLabel || 'リンク'
      const selectorInfo = link.selector.replace(/[^a-zA-Z0-9]/g, '-')
      const uniqueDescription = `ナビゲーションリンクのテスト: "${linkName}" (${selectorInfo})`
      
      testCases.push({
        id: `TC${testCaseId++}`,
        description: uniqueDescription,
        elementSelector: link.selector,
        action: 'click',
        expectedResult: '新しいページに遷移する',
        priority: 'high',
        category: 'navigation'
      })
    }

    // フォーム入力のテストケース
    const inputFields = analysis.elements.filter(el => 
      el.tagName === 'input' && 
      ['text', 'email', 'password', 'tel', 'url'].includes(el.type)
    )

    for (const input of inputFields.slice(0, 3)) {
      const testValue = this.generateTestValue(input.type, input.placeholder)
      // より具体的な名前を生成
      const inputName = input.placeholder || input.ariaLabel || input.type
      const selectorInfo = input.selector.replace(/[^a-zA-Z0-9]/g, '-')
      const uniqueDescription = `フォーム入力テスト: "${inputName}" (${selectorInfo})`
      
      testCases.push({
        id: `TC${testCaseId++}`,
        description: uniqueDescription,
        elementSelector: input.selector,
        action: 'input',
        inputValue: testValue,
        expectedResult: '入力値が正しく反映される',
        priority: 'medium',
        category: 'input'
      })
    }

    // ボタンのテストケース
    const buttons = analysis.elements.filter(el => 
      el.tagName === 'button' || 
      el.type === 'submit' || 
      el.type === 'button' ||
      el.role === 'button'
    )

    for (const button of buttons.slice(0, 3)) {
      // より具体的な名前を生成
      const buttonName = button.text || button.ariaLabel || button.placeholder || 'ボタン'
      const selectorInfo = button.selector.replace(/[^a-zA-Z0-9]/g, '-')
      const uniqueDescription = `ボタンクリックテスト: "${buttonName}" (${selectorInfo})`
      
      testCases.push({
        id: `TC${testCaseId++}`,
        description: uniqueDescription,
        elementSelector: button.selector,
        action: 'click',
        expectedResult: 'ボタンが正常に動作する',
        priority: 'high',
        category: 'interaction'
      })
    }

    // バリデーションテストケース
    const requiredInputs = analysis.elements.filter(el => 
      el.tagName === 'input' && 
      el.attributes.required === 'true'
    )

    for (const input of requiredInputs.slice(0, 2)) {
      // より具体的な名前を生成
      const inputName = input.placeholder || input.ariaLabel || input.type
      const selectorInfo = input.selector.replace(/[^a-zA-Z0-9]/g, '-')
      const uniqueDescription = `必須入力バリデーションテスト: "${inputName}" (${selectorInfo})`
      
      testCases.push({
        id: `TC${testCaseId++}`,
        description: uniqueDescription,
        elementSelector: input.selector,
        action: 'validation',
        expectedResult: '必須項目のエラーメッセージが表示される',
        priority: 'medium',
        category: 'validation'
      })
    }

    return testCases
  }

  /**
   * テストケースの実行
   */
  async executeTestCases(testCases: TestCase[]): Promise<TestExecutionResult[]> {
    const results: TestExecutionResult[] = []

    for (const testCase of testCases) {
      const startTime = Date.now()
      const urlBefore = this.page.url()
      let titleBefore = 'unknown'

      try {
        titleBefore = await this.page.title()
        
        const result = await this.executeTestCase(testCase)
        const endTime = Date.now()
        const executionTime = endTime - startTime

        results.push({
          testCaseId: testCase.id,
          testCaseDescription: testCase.description,
          success: result.success,
          error: result.error,
          executionTime,
          screenshotPath: result.screenshotPath,
          urlBefore,
          urlAfter: result.urlAfter,
          titleBefore,
          titleAfter: result.titleAfter,
          actualResult: result.actualResult
        })

      } catch (error) {
        const endTime = Date.now()
        const executionTime = endTime - startTime

        results.push({
          testCaseId: testCase.id,
          testCaseDescription: testCase.description,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
          executionTime,
          urlBefore,
          titleBefore
        })
      }
    }

    return results
  }

  /**
   * 個別テストケースの実行
   */
  private async executeTestCase(testCase: TestCase): Promise<{
    success: boolean
    error?: string
    urlAfter?: string
    titleAfter?: string
    screenshotPath?: string
    actualResult?: string
  }> {
    try {
      switch (testCase.action) {
        case 'click':
          return await this.executeClickAction(testCase)
        case 'input':
          return await this.executeInputAction(testCase)
        case 'input_and_search':
          return await this.executeInputAndSearchAction(testCase)
        case 'validation':
          return await this.executeValidationAction(testCase)
        default:
          return { success: false, error: `Unknown action: ${testCase.action}` }
      }
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      }
    }
  }

  /**
   * クリックアクションの実行
   */
  private async executeClickAction(testCase: TestCase) {
    // クリック前の状態を記録
    const urlBefore = this.page.url()
    const titleBefore = await this.page.title()
    
    await this.page.waitForSelector(testCase.elementSelector, { timeout: 5000 })
    
    // 画面遷移を監視するためのリスナーを設定
    const navigationPromise = this.page.waitForEvent('framenavigated', { timeout: 10000 }).catch(() => null)
    
    // クリックを実行
    await this.page.click(testCase.elementSelector)
    
    // 遷移が発生したかチェック
    const navigationEvent = await navigationPromise
    if (navigationEvent) {
      // 遷移完了を待つ
      await this.page.waitForLoadState('domcontentloaded', { timeout: 10000 })
      const newUrl = this.page.url()
      const newTitle = await this.page.title()
      
      // スクリーンショットを撮影
      const screenshotPath = await this.takeScreenshot(`test-case-${testCase.id}-click-navigation`)
      
      // 元のページに戻る
      await this.page.goBack()
      await this.page.waitForLoadState('domcontentloaded', { timeout: 10000 })
      
      const success = urlBefore !== newUrl || titleBefore !== newTitle
      const actualResult = success 
        ? `ページ遷移が発生しました: ${urlBefore} → ${newUrl}` 
        : 'ページ遷移は発生しませんでした'
      
      return {
        success,
        urlAfter: newUrl,
        titleAfter: newTitle,
        screenshotPath,
        actualResult
      }
    } else {
      // 遷移が発生しなかった場合
      await this.page.waitForTimeout(2000)
      
      const urlAfter = this.page.url()
      const titleAfter = await this.page.title()
      const screenshotPath = await this.takeScreenshot(`test-case-${testCase.id}-click-no-navigation`)
      
      const success = urlBefore !== urlAfter || titleBefore !== titleAfter
      const actualResult = success 
        ? 'ページ遷移が発生しました' 
        : 'ページ遷移は発生しませんでした'
      
      return {
        success,
        urlAfter,
        titleAfter,
        screenshotPath,
        actualResult
      }
    }
  }

  /**
   * 入力アクションの実行
   */
  private async executeInputAction(testCase: TestCase) {
    await this.page.waitForSelector(testCase.elementSelector, { timeout: 5000 })
    await this.page.fill(testCase.elementSelector, testCase.inputValue || '')
    await this.page.waitForTimeout(500)

    const value = await this.page.inputValue(testCase.elementSelector)
    const success = value === testCase.inputValue
    const actualResult = success ? '入力値が正しく反映されました' : '入力値が反映されませんでした'

    return {
      success,
      actualResult
    }
  }

  /**
   * 入力と検索アクションの実行
   */
  private async executeInputAndSearchAction(testCase: TestCase) {
    // 検索前の状態を記録
    const urlBefore = this.page.url()
    const titleBefore = await this.page.title()
    
    await this.page.waitForSelector(testCase.elementSelector, { timeout: 5000 })
    await this.page.fill(testCase.elementSelector, testCase.inputValue || '')
    
    // 画面遷移を監視するためのリスナーを設定
    const navigationPromise = this.page.waitForEvent('framenavigated', { timeout: 15000 }).catch(() => null)
    
    // 検索ボタンまたはEnterキーで検索
    const searchButton = await this.page.$('input[type="submit"], button[type="submit"], .search-button')
    if (searchButton) {
      await searchButton.click()
    } else {
      await this.page.keyboard.press('Enter')
    }

    // 遷移が発生したかチェック
    const navigationEvent = await navigationPromise
    if (navigationEvent) {
      // 遷移完了を待つ
      await this.page.waitForLoadState('domcontentloaded', { timeout: 10000 })
      const newUrl = this.page.url()
      const newTitle = await this.page.title()
      
      // スクリーンショットを撮影
      const screenshotPath = await this.takeScreenshot(`test-case-${testCase.id}-search-navigation`)
      
      // 元のページに戻る
      await this.page.goBack()
      await this.page.waitForLoadState('domcontentloaded', { timeout: 10000 })
      
      const success = urlBefore !== newUrl || titleBefore !== newTitle
      const actualResult = success 
        ? `検索が実行され、ページ遷移が発生しました: ${urlBefore} → ${newUrl}` 
        : '検索が実行されましたが、ページ遷移は発生しませんでした'
      
      return {
        success,
        urlAfter: newUrl,
        titleAfter: newTitle,
        screenshotPath,
        actualResult
      }
    } else {
      // 遷移が発生しなかった場合
      await this.page.waitForTimeout(3000)
      
      const urlAfter = this.page.url()
      const titleAfter = await this.page.title()
      const screenshotPath = await this.takeScreenshot(`test-case-${testCase.id}-search-no-navigation`)
      
      const success = urlAfter.includes('search') || titleAfter.includes('検索')
      const actualResult = success 
        ? '検索が実行されました' 
        : '検索が実行されませんでした'
      
      return {
        success,
        urlAfter,
        titleAfter,
        screenshotPath,
        actualResult
      }
    }
  }

  /**
   * バリデーションアクションの実行
   */
  private async executeValidationAction(testCase: TestCase) {
    await this.page.waitForSelector(testCase.elementSelector, { timeout: 5000 })
    
    // 空の値を入力してバリデーションをトリガー
    await this.page.fill(testCase.elementSelector, '')
    await this.page.evaluate((selector) => {
      const element = document.querySelector(selector) as HTMLElement
      if (element) {
        element.blur()
      }
    }, testCase.elementSelector)
    await this.page.waitForTimeout(1000)

    // エラーメッセージの検出
    const errorMessages = await this.page.$$eval('[class*="error"], [class*="invalid"], .error-message, .validation-error', 
      elements => elements.map(el => el.textContent?.trim()).filter(Boolean)
    )

    const success = errorMessages.length > 0
    const actualResult = success ? 'バリデーションエラーが表示されました' : 'バリデーションエラーが表示されませんでした'

    return {
      success,
      actualResult
    }
  }

  /**
   * テスト用の値を生成
   */
  private generateTestValue(type: string, placeholder?: string): string {
    if (placeholder?.toLowerCase().includes('email')) {
      return 'test@example.com'
    }
    if (placeholder?.toLowerCase().includes('password')) {
      return 'testpassword123'
    }
    if (placeholder?.toLowerCase().includes('tel') || type === 'tel') {
      return '090-1234-5678'
    }
    if (placeholder?.toLowerCase().includes('url') || type === 'url') {
      return 'https://example.com'
    }
    if (type === 'email') {
      return 'test@example.com'
    }
    if (type === 'password') {
      return 'testpassword123'
    }
    if (type === 'tel') {
      return '090-1234-5678'
    }
    if (type === 'url') {
      return 'https://example.com'
    }
    return 'test input value'
  }

  /**
   * スクリーンショットを撮影
   */
  private async takeScreenshot(filename: string): Promise<string> {
    const screenshotDir = './tests/exploration/outputs/screenshots'
    const screenshotPath = path.join(screenshotDir, `${filename}-${Date.now()}.png`)
    
    await this.page.screenshot({ path: screenshotPath, fullPage: true })
    return screenshotPath
  }
}
