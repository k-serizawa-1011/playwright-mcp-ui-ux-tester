import { Page, Locator } from '@playwright/test'
import * as fs from 'fs'
import * as path from 'path'

export interface ClickableElement {
  selector: string
  tagName: string
  text: string
  type: 'button' | 'link' | 'input' | 'form' | 'other'
  isVisible: boolean
  isEnabled: boolean
  href?: string
  action?: string
}

export interface InputField {
  selector: string
  type: string
  name: string
  placeholder: string
  isRequired: boolean
  isVisible: boolean
  isEnabled: boolean
  value?: string
}

export interface NavigationResult {
  elementType: string
  selector: string
  action: string
  success: boolean
  error?: string
  urlBefore: string
  urlAfter?: string
  titleBefore: string
  titleAfter?: string
  screenshotPath?: string
  inputValue?: string
  responseTime?: number
}

export interface NavigationTestResult {
  url: string
  title: string
  timestamp: Date
  clickableElements: ClickableElement[]
  inputFields: InputField[]
  navigationResults: NavigationResult[]
  screenshots: string[]
}

export class NavigationTestHelper {
  constructor(private page: Page) {}

  /**
   * クリック可能な要素を検出
   */
  async detectClickableElements(): Promise<ClickableElement[]> {
    const elements = await this.page.evaluate(() => {
      const clickableSelectors = [
        'button',
        'a[href]',
        'input[type="submit"]',
        'input[type="button"]',
        'input[type="reset"]',
        '[role="button"]',
        '[onclick]',
        '[data-testid*="button"]',
        '[data-testid*="link"]',
        '[class*="btn"]',
        '[class*="button"]',
        '[class*="link"]'
      ]

      const clickableElements: Array<{
        selector: string
        tagName: string
        text: string
        type: 'button' | 'link' | 'input' | 'form' | 'other'
        isVisible: boolean
        isEnabled: boolean
        href?: string
        action?: string
      }> = []

      clickableSelectors.forEach(selector => {
        const elements = document.querySelectorAll(selector)
        elements.forEach((element, index) => {
          const el = element as HTMLElement
          
          // 要素が表示されていて、クリック可能かチェック
          if (el.offsetParent !== null && 
              !(el as HTMLButtonElement | HTMLInputElement).disabled && 
              el.style.display !== 'none' && 
              el.style.visibility !== 'hidden') {
            
            let type: 'button' | 'link' | 'input' | 'form' | 'other' = 'other'
            let text = ''
            let href = ''
            let action = ''

            if (el.tagName.toLowerCase() === 'button') {
              type = 'button'
              text = el.textContent?.trim() || ''
            } else if (el.tagName.toLowerCase() === 'a') {
              type = 'link'
              text = el.textContent?.trim() || ''
              href = (el as HTMLAnchorElement).href || ''
            } else if (el.tagName.toLowerCase() === 'input') {
              type = 'input'
              text = (el as HTMLInputElement).value || ''
            } else if (el.tagName.toLowerCase() === 'form') {
              type = 'form'
              text = el.getAttribute('action') || ''
              action = (el as HTMLFormElement).action || ''
            } else {
              type = 'other'
              text = el.textContent?.trim() || ''
            }

            // 重複を避けるためのセレクター生成
            let uniqueSelector = selector
            if (index > 0) {
              uniqueSelector = `${selector}:nth-of-type(${index + 1})`
            }

            clickableElements.push({
              selector: uniqueSelector,
              tagName: el.tagName.toLowerCase(),
              text: text.substring(0, 50), // テキストを50文字に制限
              type,
              isVisible: true,
              isEnabled: !(el as HTMLButtonElement | HTMLInputElement).disabled,
              href,
              action
            })
          }
        })
      })

      return clickableElements
    })

    return elements
  }

  /**
   * 入力フィールドを検出
   */
  async detectInputFields(): Promise<InputField[]> {
    const fields = await this.page.evaluate(() => {
      const inputSelectors = [
        'input[type="text"]',
        'input[type="email"]',
        'input[type="password"]',
        'input[type="search"]',
        'input[type="tel"]',
        'input[type="url"]',
        'input[type="number"]',
        'textarea',
        'select'
      ]

      const inputFields: Array<{
        selector: string
        type: string
        name: string
        placeholder: string
        isRequired: boolean
        isVisible: boolean
        isEnabled: boolean
        value?: string
      }> = []

      inputSelectors.forEach(selector => {
        const elements = document.querySelectorAll(selector)
        elements.forEach((element, index) => {
          const el = element as HTMLElement
          
          if (el.offsetParent !== null && 
              el.style.display !== 'none' && 
              el.style.visibility !== 'hidden') {
            
            let uniqueSelector = selector
            if (index > 0) {
              uniqueSelector = `${selector}:nth-of-type(${index + 1})`
            }

            inputFields.push({
              selector: uniqueSelector,
              type: (el as HTMLInputElement).type || el.tagName.toLowerCase(),
              name: (el as HTMLInputElement).name || '',
              placeholder: (el as HTMLInputElement).placeholder || '',
              isRequired: (el as HTMLInputElement).required || false,
              isVisible: true,
              isEnabled: !(el as HTMLInputElement).disabled,
              value: (el as HTMLInputElement).value || ''
            })
          }
        })
      })

      return inputFields
    })

    return fields
  }

  /**
   * 画面遷移テストを実行
   */
  async performNavigationTests(
    clickableElements: ClickableElement[], 
    inputFields: InputField[]
  ): Promise<NavigationResult[]> {
    const results: NavigationResult[] = []
    const maxTests = 5 // 最大テスト数を5に制限（より安全に）
    let testCount = 0

    // 入力フィールドの処理
    for (const field of inputFields.slice(0, 2)) { // 最大2つの入力フィールドをテスト
      if (testCount >= maxTests) break
      
      try {
        const result = await this.testInputField(field)
        results.push(result)
        testCount++
      } catch (error) {
        try {
          results.push({
            elementType: 'input',
            selector: field.selector,
            action: 'input',
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
            urlBefore: this.page.url(),
            titleBefore: await this.page.title()
          })
        } catch (pageError) {
          results.push({
            elementType: 'input',
            selector: field.selector,
            action: 'input',
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
            urlBefore: 'unknown',
            titleBefore: 'unknown'
          })
        }
      }
    }

    // クリック可能要素の処理
    for (const element of clickableElements) {
      if (testCount >= maxTests) break
      
      try {
        const result = await this.testClickableElement(element)
        results.push(result)
        testCount++
      } catch (error) {
        try {
          results.push({
            elementType: element.type,
            selector: element.selector,
            action: 'click',
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
            urlBefore: this.page.url(),
            titleBefore: await this.page.title()
          })
        } catch (pageError) {
          results.push({
            elementType: element.type,
            selector: element.selector,
            action: 'click',
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
            urlBefore: 'unknown',
            titleBefore: 'unknown'
          })
        }
      }
    }

    return results
  }

  /**
   * 入力フィールドのテスト
   */
  private async testInputField(field: InputField): Promise<NavigationResult> {
    const urlBefore = this.page.url()
    const titleBefore = await this.page.title()
    const startTime = Date.now()

    try {
      // 入力フィールドに値を入力
      const testValue = this.generateTestValue(field.type)
      await this.page.fill(field.selector, testValue)
      
      // 少し待機して入力が反映されるのを確認
      await this.page.waitForTimeout(500)
      
      const endTime = Date.now()
      const responseTime = endTime - startTime

      return {
        elementType: 'input',
        selector: field.selector,
        action: 'input',
        success: true,
        urlBefore,
        titleBefore,
        inputValue: testValue,
        responseTime
      }
    } catch (error) {
      throw error
    }
  }

  /**
   * クリック可能要素のテスト
   */
  private async testClickableElement(element: ClickableElement): Promise<NavigationResult> {
    const urlBefore = this.page.url()
    const titleBefore = await this.page.title()
    const startTime = Date.now()

    try {
      // 要素が表示されるまで待機
      await this.page.waitForSelector(element.selector, { timeout: 5000 })
      
      // 要素をクリック
      await this.page.click(element.selector)
      
      // 画面遷移を待機
      await this.page.waitForTimeout(2000)
      
      const urlAfter = this.page.url()
      const titleAfter = await this.page.title()
      const endTime = Date.now()
      const responseTime = endTime - startTime

      // スクリーンショットを撮影
      const screenshotPath = await this.takeScreenshot(`navigation-${element.type}-${Date.now()}`)

      // 遷移が成功したかどうかを判定
      const success = urlBefore !== urlAfter || titleBefore !== titleAfter

      return {
        elementType: element.type,
        selector: element.selector,
        action: 'click',
        success,
        urlBefore,
        urlAfter,
        titleBefore,
        titleAfter,
        screenshotPath,
        responseTime
      }
    } catch (error) {
      throw error
    }
  }

  /**
   * テスト用の値を生成
   */
  private generateTestValue(type: string): string {
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
        return 'test search'
      default:
        return 'test input'
    }
  }

  /**
   * スクリーンショットを撮影
   */
  private async takeScreenshot(filename: string): Promise<string> {
    const screenshotDir = './tests/exploration/outputs/screenshots'
    const screenshotPath = path.join(screenshotDir, `${filename}.png`)
    
    await this.page.screenshot({ path: screenshotPath, fullPage: true })
    return screenshotPath
  }
}
