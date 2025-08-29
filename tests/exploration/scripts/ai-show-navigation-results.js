#!/usr/bin/env node

const fs = require('fs')
const path = require('path')

/**
 * 画面遷移テスト結果を表示
 */
function showNavigationResults() {
  console.log('🔍 画面遷移テスト結果を確認中...')
  
  const resultsDir = path.join(__dirname, '../outputs')
  
  if (!fs.existsSync(resultsDir)) {
    console.log('❌ 結果ディレクトリが見つかりません:', resultsDir)
    return
  }

  // 画面遷移テスト結果ファイルを検索
  const files = fs.readdirSync(resultsDir)
  const navigationResultFiles = files.filter(file => 
    file.startsWith('navigation-results-') && file.endsWith('.json')
  )

  if (navigationResultFiles.length === 0) {
    console.log('❌ 画面遷移テスト結果ファイルが見つかりません')
    console.log('💡 先に画面遷移テストを実行してください: npm run test:navigation')
    return
  }

  // 最新の結果ファイルを取得
  const latestFile = navigationResultFiles
    .sort()
    .reverse()[0]

  const resultPath = path.join(resultsDir, latestFile)
  const resultData = JSON.parse(fs.readFileSync(resultPath, 'utf8'))

  displayNavigationResults(resultData, latestFile)
}

/**
 * 画面遷移テスト結果を表示
 */
function displayNavigationResults(data, filename) {
  console.log('\n🎯 画面遷移テスト結果サマリー')
  console.log('==================================================')
  console.log(`📄 ページタイトル: ${data.title}`)
  console.log(`🔗 対象URL: ${data.url}`)
  console.log(`⏰ 実行日時: ${new Date(data.timestamp).toLocaleString('ja-JP')}`)
  console.log(`📁 結果ファイル: ${filename}`)

  console.log('\n📊 検出された要素数:')
  console.log(`🔗 クリック可能要素: ${data.clickableElements}個`)
  console.log(`📝 入力フィールド: ${data.inputFields}個`)
  console.log(`🚀 実行されたテスト: ${data.navigationTests}個`)

  // 結果の詳細分析
  const results = data.results || []
  const successCount = results.filter(r => r.success).length
  const errorCount = results.filter(r => !r.success).length

  console.log('\n📈 テスト結果:')
  console.log(`✅ 成功: ${successCount}個`)
  console.log(`❌ 失敗: ${errorCount}個`)
  console.log(`📊 成功率: ${results.length > 0 ? Math.round((successCount / results.length) * 100) : 0}%`)

  // 成功した遷移の詳細
  const successfulResults = results.filter(r => r.success)
  if (successfulResults.length > 0) {
    console.log('\n✅ 成功した画面遷移:')
    console.log('--------------------------------------------------')
    successfulResults.forEach((result, index) => {
      console.log(`${index + 1}. ${result.elementType.toUpperCase()}: ${result.selector}`)
      if (result.urlAfter && result.urlBefore !== result.urlAfter) {
        console.log(`   🔗 URL変更: ${result.urlBefore} → ${result.urlAfter}`)
      }
      if (result.titleAfter && result.titleBefore !== result.titleAfter) {
        console.log(`   📄 タイトル変更: ${result.titleBefore} → ${result.titleAfter}`)
      }
      if (result.inputValue) {
        console.log(`   📝 入力値: ${result.inputValue}`)
      }
      if (result.responseTime) {
        console.log(`   ⏱️  応答時間: ${result.responseTime}ms`)
      }
      if (result.screenshotPath) {
        console.log(`   📸 スクリーンショット: ${result.screenshotPath}`)
      }
      console.log('')
    })
  }

  // 失敗した遷移の詳細
  const failedResults = results.filter(r => !r.success)
  if (failedResults.length > 0) {
    console.log('\n❌ 失敗した画面遷移:')
    console.log('--------------------------------------------------')
    failedResults.forEach((result, index) => {
      console.log(`${index + 1}. ${result.elementType.toUpperCase()}: ${result.selector}`)
      console.log(`   🚫 エラー: ${result.error}`)
      console.log('')
    })
  }

  // 要素タイプ別の分析
  const elementTypeAnalysis = analyzeElementTypes(results)
  if (Object.keys(elementTypeAnalysis).length > 0) {
    console.log('\n📊 要素タイプ別分析:')
    console.log('--------------------------------------------------')
    Object.entries(elementTypeAnalysis).forEach(([type, stats]) => {
      console.log(`${type.toUpperCase()}:`)
      console.log(`   📊 総数: ${stats.total}個`)
      console.log(`   ✅ 成功: ${stats.success}個`)
      console.log(`   ❌ 失敗: ${stats.failed}個`)
      console.log(`   📈 成功率: ${Math.round((stats.success / stats.total) * 100)}%`)
      console.log('')
    })
  }

  // 推奨アクション
  console.log('\n💡 推奨アクション:')
  console.log('--------------------------------------------------')
  
  if (errorCount > 0) {
    console.log(`1. 失敗した遷移の修正 (${errorCount}個)`)
    console.log('   - 要素のセレクターを確認')
    console.log('   - 要素が正しく表示されているか確認')
    console.log('   - JavaScriptエラーの確認')
  }
  
  if (successCount > 0) {
    console.log(`2. 成功した遷移の最適化 (${successCount}個)`)
    console.log('   - 応答時間の改善')
    console.log('   - ユーザビリティの向上')
  }

  console.log('3. 追加のテストケース検討')
  console.log('   - より多くの要素のテスト')
  console.log('   - エッジケースの追加')

  // スクリーンショット情報
  if (data.screenshots && data.screenshots.length > 0) {
    console.log('\n📸 生成されたスクリーンショット:')
    console.log('--------------------------------------------------')
    data.screenshots.forEach((screenshot, index) => {
      console.log(`${index + 1}. ${screenshot}`)
    })
  }

  console.log('\n✅ 画面遷移テスト結果の表示完了')
}

/**
 * 要素タイプ別の分析
 */
function analyzeElementTypes(results) {
  const analysis = {}
  
  results.forEach(result => {
    const type = result.elementType
    if (!analysis[type]) {
      analysis[type] = { total: 0, success: 0, failed: 0 }
    }
    
    analysis[type].total++
    if (result.success) {
      analysis[type].success++
    } else {
      analysis[type].failed++
    }
  })
  
  return analysis
}

// メイン実行
if (require.main === module) {
  showNavigationResults()
}

module.exports = { showNavigationResults, displayNavigationResults }
