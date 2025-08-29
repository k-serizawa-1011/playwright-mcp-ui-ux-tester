#!/usr/bin/env node

const fs = require('fs')
const path = require('path')

/**
 * JSONファイルを読み込む
 */
function loadJsonFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8')
    return JSON.parse(content)
  } catch (error) {
    console.error(`❌ ファイル読み込みエラー: ${filePath}`)
    return null
  }
}

/**
 * 最新のファイルを見つける
 */
function findLatestFiles(resultsDir) {
  try {
    const files = fs.readdirSync(resultsDir)
    const jsonFiles = files.filter(file => file.endsWith('.json'))

    if (jsonFiles.length === 0) {
      return null
    }

    // 最新のファイルを取得
    const latestFile = jsonFiles
      .map(file => ({
        name: file,
        path: path.join(resultsDir, file),
        mtime: fs.statSync(path.join(resultsDir, file)).mtime,
      }))
      .sort((a, b) => b.mtime - a.mtime)[0]

    return {
      visual: latestFile.path,
    }
  } catch (error) {
    console.error(`❌ ディレクトリ読み込みエラー: ${resultsDir}`)
    return null
  }
}

/**
 * 再帰的にファイルを検索
 */
function findFilesRecursively(dir, pattern) {
  const results = []
  
  function search(currentDir) {
    try {
      const items = fs.readdirSync(currentDir)
      
      for (const item of items) {
        const fullPath = path.join(currentDir, item)
        const stat = fs.statSync(fullPath)
        
        if (stat.isDirectory()) {
          search(fullPath)
        } else if (pattern.test(item)) {
          results.push({
            name: item,
            path: fullPath,
            mtime: stat.mtime,
          })
        }
      }
    } catch (error) {
      // ディレクトリが読み取れない場合はスキップ
    }
  }
  
  search(dir)
  return results
}

/**
 * 結果を表示
 */
function displayResults(data) {
  console.log('\n🎯 UI違和感検知結果サマリー')
  console.log('='.repeat(50))

  // 基本情報
  console.log(`📄 ページタイトル: ${data.title || 'N/A'}`)
  console.log(`🔗 対象URL: ${data.url || 'N/A'}`)
  console.log(`⏰ 実行日時: ${new Date(data.timestamp).toLocaleString('ja-JP')}`)

  // 問題の統計
  const visualIssues = data.visualIssues || []
  const highPriorityIssues = visualIssues.filter(
    issue => issue.severity === 'high' || issue.severity === 'critical'
  )
  const mediumPriorityIssues = visualIssues.filter(issue => issue.severity === 'medium')
  const lowPriorityIssues = visualIssues.filter(issue => issue.severity === 'low')

  console.log(`\n📊 検出された問題数: ${visualIssues.length}個`)
  console.log(`🔴 高優先度問題: ${highPriorityIssues.length}個`)
  console.log(`🟠 中優先度問題: ${mediumPriorityIssues.length}個`)
  console.log(`🟢 低優先度問題: ${lowPriorityIssues.length}個`)

  // スクリーンショット情報
  if (data.screenshots && data.screenshots.length > 0) {
    console.log('\n📸 スクリーンショット:')
    data.screenshots.forEach((screenshot, index) => {
      console.log(`   ${index + 1}. ${screenshot}`)
    })
  }

  // 問題タイプ別の詳細
  const overlapIssues = visualIssues.filter(issue => issue.description.includes('重なり'))
  const layoutShiftIssues = visualIssues.filter(issue =>
    issue.description.includes('レイアウトシフト')
  )
  const layoutIssues = visualIssues.filter(
    issue => issue.description.includes('はみ出し') || issue.description.includes('overflow')
  )
  const spacingIssues = visualIssues.filter(
    issue => issue.description.includes('パディング') || issue.description.includes('マージン')
  )
  const fontIssues = visualIssues.filter(issue => issue.description.includes('フォント'))

  console.log('\n🔍 問題の詳細:')
  console.log(`   - 要素の重なり: ${overlapIssues.length}個`)
  console.log(`   - レイアウトシフト: ${layoutShiftIssues.length}個`)
  console.log(`   - レイアウト問題: ${layoutIssues.length}個`)
  console.log(`   - スペーシング問題: ${spacingIssues.length}個`)
  console.log(`   - フォント問題: ${fontIssues.length}個`)

  // 番号付きハイライト問題の詳細表示
  if (data.highlightedIssues && data.highlightedIssues.length > 0) {
    console.log('\n🎯 ハイライトされた問題 (スクリーンショットの番号付き):')
    console.log('-'.repeat(50))

    data.highlightedIssues.forEach(issue => {
      const severityIcon = issue.severity === 'critical' ? '🔴' : '🟠'
      console.log(`🔢 問題${issue.issueNumber}: ${severityIcon} ${issue.description}`)
      console.log(`   📍 タイプ: ${issue.type}`)
      console.log(`   🎯 優先度: ${issue.severity}`)

      if (issue.suggestion) {
        console.log(`   💡 提案: ${issue.suggestion}`)
      }
      console.log('')
    })
  }

  // 高優先度問題の詳細表示
  if (highPriorityIssues.length > 0) {
    console.log('\n🚨 全高優先度問題の詳細:')
    console.log('-'.repeat(40))

    highPriorityIssues.slice(0, 5).forEach((issue, index) => {
      const severityIcon = issue.severity === 'critical' ? '🔴' : '🟠'
      console.log(`${index + 1}. ${severityIcon} ${issue.description}`)

      if (issue.suggestion) {
        console.log(`   💡 提案: ${issue.suggestion}`)
      }
    })

    if (highPriorityIssues.length > 5) {
      console.log(`   ... 他 ${highPriorityIssues.length - 5}個の高優先度問題`)
    }
  }

  // 推奨アクション
  console.log('\n💡 推奨アクション:')
  if (overlapIssues.length > 0) {
    console.log(`   1. 要素の重なり問題の修正 (${overlapIssues.length}個)`)
    console.log('      - 要素の位置やz-indexを調整')
    console.log('      - レイアウトの見直し')
  }

  if (layoutShiftIssues.length > 0) {
    console.log(`   2. レイアウトシフトの修正 (${layoutShiftIssues.length}個)`)
    console.log('      - 画像サイズの指定')
    console.log('      - 広告スペースの確保')
  }

  if (spacingIssues.length > 0) {
    console.log(`   3. スペーシングの統一性向上 (${spacingIssues.length}個)`)
    console.log('      - パディング/マージンの統一')
  }

  if (fontIssues.length > 0) {
    console.log(`   4. フォントサイズの統一性向上 (${fontIssues.length}個)`)
    console.log('      - フォントサイズの統一')
  }
}

/**
 * メイン処理
 */
function main() {
  const resultsDir = path.join(__dirname, './outputs')

  console.log('🔍 UI違和感検知結果を確認中...')
  console.log(`📁 結果ディレクトリ: ${resultsDir}`)

  // 再帰的にファイルを検索
  const allJsonFiles = findFilesRecursively(resultsDir, /\.json$/)
  const visualIssueFiles = allJsonFiles.filter(file => 
    file.name.includes('visual-issues') || 
    file.name.includes('exploration-results')
  )

  if (visualIssueFiles.length === 0) {
    console.log('❌ 結果ファイルが見つかりません')
    console.log(
      '   テストを実行してください: yarn playwright test --config=playwright-mcp.config.ts ./ai-visual-issues.spec.ts --project=chromium'
    )
    process.exit(1)
  }

  // 最新のファイルを取得
  const latestFile = visualIssueFiles.sort((a, b) => b.mtime - a.mtime)[0]
  const latestFiles = { visual: latestFile.path }

  // 結果を読み込んで表示
  const visualData = loadJsonFile(latestFiles.visual)

  if (!visualData) {
    console.log('❌ 結果ファイルの読み込みに失敗しました')
    process.exit(1)
  }

  // Playwrightの結果ファイルの場合は、テスト結果を抽出
  if (visualData.config && visualData.suites) {
    console.log('📊 Playwright実行結果サマリー')
    console.log('='.repeat(50))
    
    const stats = visualData.stats || {}
    console.log(`✅ 成功: ${stats.expected || 0}個`)
    console.log(`❌ 失敗: ${stats.unexpected || 0}個`)
    console.log(`⏱️  実行時間: ${Math.round((stats.duration || 0) / 1000)}秒`)
    
    // テストの詳細を表示
    if (visualData.suites && visualData.suites.length > 0) {
      const suite = visualData.suites[0]
      if (suite.specs && suite.specs.length > 0) {
        const spec = suite.specs[0]
        if (spec.tests && spec.tests.length > 0) {
          const test = spec.tests[0]
          console.log(`\n📝 テスト名: ${test.title}`)
          console.log(`📄 ファイル: ${spec.file}`)
          
          // テスト結果の詳細を表示
          if (test.results && test.results.length > 0) {
            const result = test.results[0]
            console.log(`🎯 ステータス: ${result.status}`)
            console.log(`⏱️  実行時間: ${Math.round((result.duration || 0) / 1000)}秒`)
            
            // ログを表示
            if (result.stdout && result.stdout.length > 0) {
              console.log('\n📋 実行ログ:')
              result.stdout.forEach(log => {
                if (log.text && log.text.trim()) {
                  console.log(log.text.trim())
                }
              })
            }
          }
        }
      }
    }
  } else {
    // 通常の結果ファイルの場合
    displayResults(visualData)
  }

  console.log('\n✅ 結果確認完了')
  console.log('\n📸 スクリーンショットを確認するには:')
  console.log('   open ./outputs/screenshots/visual-issues-*.png')
  console.log('   # 通常版: visual-issues-{timestamp}.png')
  console.log('   # ハイライト版: visual-issues-{timestamp}-highlighted.png')
}

// スクリプト実行
if (require.main === module) {
  main()
}
