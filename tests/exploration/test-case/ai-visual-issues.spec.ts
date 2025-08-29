import { test, expect } from '@playwright/test'
import { getExplorationConfig, validateConfig } from '../utils/env-config'
import { VisualExplorationHelper } from '../utils/ai-exploration-helper'
import * as fs from 'fs'
import * as path from 'path'

test.describe('UI違和感検知テスト', () => {
  validateConfig()
  const config = getExplorationConfig()
  const targetUrl = config.targetUrl
  const resultsDir = './tests/exploration/outputs'
  const username = config.username
  const password = config.password

  test('UI違和感検知テスト', async ({ browser }) => {
    console.log('🔍 UI違和感検知テスト開始')

    const context = await browser.newContext({
      httpCredentials: { username, password },
    })
    const page = await context.newPage()

    await page.goto(targetUrl)
    await page.waitForLoadState('domcontentloaded')

    const helper = new VisualExplorationHelper(page)

    // 結果ディレクトリの作成
    if (!fs.existsSync(resultsDir)) {
      fs.mkdirSync(resultsDir, { recursive: true })
    }

    // スクリーンショットディレクトリの作成
    const screenshotDir = path.join(resultsDir, 'screenshots')
    if (!fs.existsSync(screenshotDir)) {
      fs.mkdirSync(screenshotDir, { recursive: true })
    }

    // 1. 通常のスクリーンショット
    const now = new Date()
    const timestamp =
      now.getFullYear().toString() +
      (now.getMonth() + 1).toString().padStart(2, '0') +
      now.getDate().toString().padStart(2, '0') +
      now.getHours().toString().padStart(2, '0') +
      now.getMinutes().toString().padStart(2, '0') +
      now.getSeconds().toString().padStart(2, '0') +
      now.getMilliseconds().toString().padStart(3, '0')
    const normalScreenshotPath = path.join(screenshotDir, `visual-issues-${timestamp}.png`)
    await page.screenshot({ path: normalScreenshotPath, fullPage: true })
    console.log(`📸 通常スクリーンショット保存: ${normalScreenshotPath}`)

    // 2. 視覚的問題の検出
    const visualIssues = await helper.detectVisualIssues()
    console.log(`🔍 検出された視覚的問題数: ${visualIssues.length}個`)

    // 3. 高優先度問題のハイライト
    const highPriorityIssues = visualIssues.filter(
      issue => issue.severity === 'high' || issue.severity === 'critical'
    )
    console.log(`🔴 高優先度問題数: ${highPriorityIssues.length}個`)

    if (highPriorityIssues.length > 0) {
      const issuesToHighlight = highPriorityIssues.slice(0, 10)
      console.log(`🎯 ハイライト対象問題数: ${issuesToHighlight.length}個`)

      // 要素にハイライトを適用
      for (let i = 0; i < issuesToHighlight.length; i++) {
        const issue = issuesToHighlight[i]
        if (issue.element) {
          try {
            await page.evaluate(
              ({
                htmlString,
                index,
                issueType,
                description,
                severity,
              }: {
                htmlString: string
                index: number
                issueType: string
                description: string
                severity: string
              }) => {
                const tempDiv = document.createElement('div')
                tempDiv.innerHTML = htmlString
                const targetElement = tempDiv.firstElementChild

                if (targetElement) {
                  const classes = targetElement.className.split(' ').filter(c => c.trim())
                  const tagName = targetElement.tagName.toLowerCase()

                  const selectors = []

                  if (targetElement.id) {
                    selectors.push(`#${targetElement.id}`)
                  }

                  if (classes.length > 0) {
                    selectors.push(`${tagName}.${classes[0]}`)
                    selectors.push(`.${classes[0]}`)
                  }

                  selectors.push(tagName)

                  let highlighted = false
                  for (const selector of selectors) {
                    const elements = document.querySelectorAll(selector)
                    if (elements.length > 0) {
                      const element = elements[0] as HTMLElement

                      // 番号付きハイライトのスタイルを適用
                      element.style.outline = '4px solid #ff0000'
                      element.style.backgroundColor = 'rgba(255, 0, 0, 0.15)'
                      element.style.position = 'relative'
                      element.setAttribute('data-issue-index', index.toString())

                      // 番号ラベルを作成（位置を調整して重ならないようにする）
                      const label = document.createElement('div')
                      label.textContent = index.toString()

                      // 番号に応じて位置と色を調整
                      const positions = [
                        { top: '-10px', left: '-10px', color: '#ff0000' }, // 1番: 赤
                        { top: '-10px', right: '-10px', color: '#ff6600' }, // 2番: オレンジ
                        { top: '50%', left: '-10px', color: '#ffcc00' }, // 3番: 黄色
                        { top: '50%', right: '-10px', color: '#00cc00' }, // 4番: 緑
                        { bottom: '-10px', left: '-10px', color: '#0066ff' }, // 5番: 青
                        { bottom: '-10px', right: '-10px', color: '#6600ff' }, // 6番: 紫
                        { top: '25%', left: '-10px', color: '#ff0066' }, // 7番: ピンク
                        { top: '25%', right: '-10px', color: '#00ffff' }, // 8番: シアン
                        { top: '75%', left: '-10px', color: '#ff9900' }, // 9番: オレンジ
                        { top: '75%', right: '-10px', color: '#9900ff' }, // 10番: バイオレット
                      ]

                      const position = positions[index - 1] || positions[0]

                      label.style.cssText = `
                        position: absolute;
                        ${position.top ? `top: ${position.top};` : ''}
                        ${position.left ? `left: ${position.left};` : ''}
                        ${position.right ? `right: ${position.right};` : ''}
                        ${position.bottom ? `bottom: ${position.bottom};` : ''}
                        background: ${position.color};
                        color: white;
                        border-radius: 50%;
                        width: 28px;
                        height: 28px;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        font-weight: bold;
                        font-size: 14px;
                        z-index: 10000;
                        box-shadow: 0 2px 4px rgba(0,0,0,0.3);
                        border: 2px solid white;
                        transform: translateY(-50%);
                      `
                      label.setAttribute('data-issue-number', index.toString())

                      // 要素に番号ラベルを追加
                      element.appendChild(label)

                      highlighted = true
                      break
                    }
                  }

                  if (!highlighted) {
                    console.log(`⚠️ 要素を特定できませんでした: ${htmlString.substring(0, 100)}...`)
                  }
                }
              },
              {
                htmlString: issue.element,
                index: i + 1,
                issueType: issue.type,
                description: issue.description,
                severity: issue.severity,
              }
            )

            // 外部でログを出力
            console.log(`🔴 要素をハイライトしました: 問題${i + 1}`)
            console.log(`   📍 問題タイプ: ${issue.type}`)
            console.log(`   📝 詳細: ${issue.description}`)
            console.log(`   🎯 優先度: ${issue.severity}`)
          } catch (error: any) {
            console.log(`    ⚠️ 要素ハイライト失敗: ${error.message}`)
          }
        }
      }

      // ハイライト後のスクリーンショット
      await page.waitForTimeout(1000)
      const highlightedScreenshotPath = path.join(
        screenshotDir,
        `visual-issues-${timestamp}-highlighted.png`
      )
      await page.screenshot({ path: highlightedScreenshotPath, fullPage: true })
      console.log(`📸 ハイライトスクリーンショット保存: ${highlightedScreenshotPath}`)
    }

    // 4. 結果の保存
    const result = await helper.performVisualExploration()
    const resultPath = path.join(resultsDir, `visual-issues-${timestamp}.json`)

    // 番号付きの問題情報を作成
    const numberedIssues = highPriorityIssues.slice(0, 10).map((issue, index) => ({
      ...issue,
      issueNumber: index + 1,
      highlighted: true,
    }))

    const resultData = {
      ...result,
      highlightedIssues: numberedIssues,
      screenshots: [
        normalScreenshotPath,
        ...(highPriorityIssues.length > 0
          ? [path.join(screenshotDir, `visual-issues-${timestamp}-highlighted.png`)]
          : []),
      ],
    }

    try {
      fs.writeFileSync(resultPath, JSON.stringify(resultData, null, 2))
      console.log(`💾 結果を保存しました: ${resultPath}`)
    } catch (error) {
      console.error(`❌ 結果保存エラー: ${error}`)
      // 代替パスに保存
      const fallbackPath = path.join(__dirname, `visual-issues-${timestamp}.json`)
      fs.writeFileSync(fallbackPath, JSON.stringify(resultData, null, 2))
      console.log(`💾 代替パスに結果を保存しました: ${fallbackPath}`)
    }

    // 5. 基本的なアサーション
    expect(visualIssues.length).toBeGreaterThanOrEqual(0)
    expect(page.url()).toContain('google.com')

    console.log('✅ UI違和感検知テスト完了')
    await context.close()
  })
})
