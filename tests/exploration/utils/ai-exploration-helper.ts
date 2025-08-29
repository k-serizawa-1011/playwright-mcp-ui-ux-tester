import { Page, Locator } from '@playwright/test'

export interface VisualIssue {
  type: 'visual'
  severity: 'low' | 'medium' | 'high' | 'critical'
  description: string
  element?: string
  suggestion?: string
}

export interface VisualExplorationResult {
  url: string
  title: string
  timestamp: Date
  visualIssues: VisualIssue[]
  screenshots: string[]
}

export class VisualExplorationHelper {
  constructor(private page: Page) {}

  /**
   * ページの基本情報を収集
   */
  async collectPageInfo(): Promise<Partial<VisualExplorationResult>> {
    const title = await this.page.title()
    const url = this.page.url()

    return {
      url,
      title,
      timestamp: new Date(),
    }
  }

  /**
   * スクリーンショットを撮影
   */
  async takeScreenshots(): Promise<string[]> {
    const screenshots: string[] = []

    // 現在はスクリーンショットはメインテストファイルで管理しているため、
    // ここでは空の配列を返す
    return screenshots
  }

  /**
   * 視覚的問題を検出
   */
  async detectVisualIssues(): Promise<VisualIssue[]> {
    const issues: VisualIssue[] = []

    // 要素の重なり検出
    const overlappingIssues = await this.detectOverlappingElements()
    issues.push(...overlappingIssues)

    // レイアウトシフト検出
    const layoutShiftIssues = await this.detectLayoutShifts()
    issues.push(...layoutShiftIssues)

    // レイアウト問題検出
    const layoutIssues = await this.detectLayoutIssues()
    issues.push(...layoutIssues)

    // スペーシング問題検出
    const spacingIssues = await this.detectSpacingIssues()
    issues.push(...spacingIssues)

    // フォント問題検出
    const fontIssues = await this.detectFontIssues()
    issues.push(...fontIssues)

    return issues
  }

  /**
   * 要素の重なりを検出
   */
  private async detectOverlappingElements(): Promise<VisualIssue[]> {
    const issues: VisualIssue[] = []

    const overlaps = await this.page.evaluate(() => {
      const elements = document.querySelectorAll('*')
      const overlaps: Array<{
        overlapArea: number
        overlapPercentage: number
        element1: string
        element2: string
      }> = []

      for (let i = 0; i < elements.length; i++) {
        for (let j = i + 1; j < elements.length; j++) {
          const el1 = elements[i] as HTMLElement
          const el2 = elements[j] as HTMLElement

          if (!el1.offsetParent || !el2.offsetParent) continue

          const rect1 = el1.getBoundingClientRect()
          const rect2 = el2.getBoundingClientRect()

          const area1 = rect1.width * rect1.height
          const area2 = rect2.width * rect2.height

          if (area1 === 0 || area2 === 0) continue

          const overlapX = Math.max(
            0,
            Math.min(rect1.right, rect2.right) - Math.max(rect1.left, rect2.left)
          )
          const overlapY = Math.max(
            0,
            Math.min(rect1.bottom, rect2.bottom) - Math.max(rect1.top, rect2.top)
          )
          const overlapArea = overlapX * overlapY

          if (overlapArea > 0) {
            overlaps.push({
              overlapArea,
              overlapPercentage: Math.max(overlapArea / area1, overlapArea / area2),
              element1: el1.outerHTML,
              element2: el2.outerHTML,
            })
          }
        }
      }

      return overlaps
    })

    for (const overlap of overlaps) {
      if (overlap.overlapPercentage > 0.1) {
        issues.push({
          type: 'visual',
          severity: overlap.overlapPercentage > 0.5 ? 'high' : 'medium',
          description: `要素の重なりが検出されました (${Math.round(overlap.overlapPercentage * 100)}%)`,
          element: overlap.element1,
          suggestion: '要素の位置やz-indexを調整してください',
        })
      }
    }

    return issues
  }

  /**
   * レイアウトシフトを検出
   */
  private async detectLayoutShifts(): Promise<VisualIssue[]> {
    const issues: VisualIssue[] = []

    const layoutShifts = await this.page.evaluate(() => {
      const shifts = performance.getEntriesByType('layout-shift') as any[]
      return shifts.map(shift => ({
        value: shift.value,
        sources: shift.sources,
        startTime: shift.startTime,
      }))
    })

    for (const shift of layoutShifts) {
      if (shift.value > 0.1) {
        issues.push({
          type: 'visual',
          severity: shift.value > 0.25 ? 'high' : 'medium',
          description: `レイアウトシフトが検出されました (CLS: ${shift.value.toFixed(3)})`,
          suggestion: '画像サイズを指定するか、広告スペースを確保してください',
        })
      }
    }

    return issues
  }

  /**
   * レイアウト問題を検出
   */
  private async detectLayoutIssues(): Promise<VisualIssue[]> {
    const issues: VisualIssue[] = []

    const layoutIssues = await this.page.evaluate(() => {
      const issues: Array<{ element: string; issue: string }> = []

      // overflow問題の検出
      const elements = document.querySelectorAll('*')
      elements.forEach(el => {
        const style = window.getComputedStyle(el)
        if (style.overflow === 'hidden' && el.scrollHeight > el.clientHeight) {
          issues.push({
            element: (el as HTMLElement).outerHTML,
            issue: 'コンテンツがコンテナからはみ出しています',
          })
        }
      })

      return issues
    })

    for (const issue of layoutIssues) {
      issues.push({
        type: 'visual',
        severity: 'medium',
        description: issue.issue,
        element: issue.element,
        suggestion: 'コンテナのサイズを調整するか、overflow設定を見直してください',
      })
    }

    return issues
  }

  /**
   * スペーシング問題を検出
   */
  private async detectSpacingIssues(): Promise<VisualIssue[]> {
    const issues: VisualIssue[] = []

    const spacingIssues = await this.page.evaluate(() => {
      const issues: Array<{ element: string; issue: string }> = []

      const elements = document.querySelectorAll('*')
      const margins: number[] = []
      const paddings: number[] = []

      elements.forEach(el => {
        const style = window.getComputedStyle(el)
        const margin = parseFloat(style.marginTop) + parseFloat(style.marginBottom)
        const padding = parseFloat(style.paddingTop) + parseFloat(style.paddingBottom)

        if (margin > 0) margins.push(margin)
        if (padding > 0) paddings.push(padding)
      })

      // マージンの不整合を検出
      if (margins.length > 1) {
        const maxMargin = Math.max(...margins)
        const minMargin = Math.min(...margins)
        if (maxMargin - minMargin > 20) {
          issues.push({
            element: 'body',
            issue: 'マージンの不整合が検出されました',
          })
        }
      }

      // パディングの不整合を検出
      if (paddings.length > 1) {
        const maxPadding = Math.max(...paddings)
        const minPadding = Math.min(...paddings)
        if (maxPadding - minPadding > 20) {
          issues.push({
            element: 'body',
            issue: 'パディングの不整合が検出されました',
          })
        }
      }

      return issues
    })

    for (const issue of spacingIssues) {
      issues.push({
        type: 'visual',
        severity: 'low',
        description: issue.issue,
        element: issue.element,
        suggestion: 'スペーシングの統一性を向上させてください',
      })
    }

    return issues
  }

  /**
   * フォント問題を検出
   */
  private async detectFontIssues(): Promise<VisualIssue[]> {
    const issues: VisualIssue[] = []

    const fontIssues = await this.page.evaluate(() => {
      const issues: Array<{ element: string; issue: string }> = []

      const elements = document.querySelectorAll('*')
      const fontSizes: number[] = []

      elements.forEach(el => {
        const style = window.getComputedStyle(el)
        const fontSize = parseFloat(style.fontSize)
        if (fontSize > 0) fontSizes.push(fontSize)
      })

      if (fontSizes.length > 1) {
        const mean = fontSizes.reduce((a, b) => a + b) / fontSizes.length
        const variance = fontSizes.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / fontSizes.length
        const stdDev = Math.sqrt(variance)

        if (stdDev > 8) {
          issues.push({
            element: 'body',
            issue: `フォントサイズの不整合が検出されました (標準偏差: ${stdDev.toFixed(1)}px)`,
          })
        }
      }

      return issues
    })

    for (const issue of fontIssues) {
      issues.push({
        type: 'visual',
        severity: 'low',
        description: issue.issue,
        element: issue.element,
        suggestion: 'フォントサイズの統一性を向上させてください',
      })
    }

    return issues
  }

  /**
   * 視覚的探索を実行
   */
  async performVisualExploration(): Promise<VisualExplorationResult> {
    const pageInfo = await this.collectPageInfo()
    const screenshots = await this.takeScreenshots()
    const visualIssues = await this.detectVisualIssues()

    return {
      ...pageInfo,
      screenshots,
      visualIssues,
    } as VisualExplorationResult
  }
}
