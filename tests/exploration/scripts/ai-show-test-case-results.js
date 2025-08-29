#!/usr/bin/env node

const fs = require('fs')
const path = require('path')

/**
 * AI自動テストケース生成結果を表示
 */
function showAITestCaseResults() {
  console.log('🤖 AI自動テストケース生成結果を確認中...')
  
  const resultsDir = path.join(__dirname, '../outputs')
  
  if (!fs.existsSync(resultsDir)) {
    console.log('❌ 結果ディレクトリが見つかりません:', resultsDir)
    return
  }

  // AIテストケース結果ファイルを検索
  const files = fs.readdirSync(resultsDir)
  const aiTestCaseResultFiles = files.filter(file => 
    file.startsWith('ai-test-case-results-') && file.endsWith('.json')
  )

  if (aiTestCaseResultFiles.length === 0) {
    console.log('❌ AI自動テストケース生成結果ファイルが見つかりません')
    console.log('💡 先にAI自動テストケース生成テストを実行してください: npm run test:ai-generator')
    return
  }

  // 最新の結果ファイルを取得
  const latestFile = aiTestCaseResultFiles
    .sort()
    .reverse()[0]

  const resultPath = path.join(resultsDir, latestFile)
  const resultData = JSON.parse(fs.readFileSync(resultPath, 'utf8'))

  displayAITestCaseResults(resultData, latestFile)
}

/**
 * AI自動テストケース生成結果を表示
 */
function displayAITestCaseResults(data, filename) {
  console.log('\n🤖 AI自動テストケース生成結果サマリー')
  console.log('==================================================')
  console.log(`📄 ページタイトル: ${data.title}`)
  console.log(`🔗 対象URL: ${data.url}`)
  console.log(`⏰ 実行日時: ${new Date(data.timestamp).toLocaleString('ja-JP')}`)
  console.log(`📁 結果ファイル: ${filename}`)

  console.log('\n📊 ページ分析結果:')
  console.log(`🔍 検出された要素: ${data.pageAnalysis.elements.length}個`)
  console.log(`📝 フォーム数: ${data.pageAnalysis.formCount}個`)
  console.log(`🔘 ボタン数: ${data.pageAnalysis.buttonCount}個`)
  console.log(`🔗 リンク数: ${data.pageAnalysis.linkCount}個`)
  console.log(`📝 入力フィールド数: ${data.pageAnalysis.inputCount}個`)
  console.log(`🎯 インタラクティブ要素: ${data.pageAnalysis.interactiveElements.length}個`)

  console.log('\n📋 生成されたテストケース:')
  console.log(`📝 総数: ${data.testCases.length}個`)
  
  // カテゴリ別の統計
  const categoryStats = {}
  data.testCases.forEach(testCase => {
    if (!categoryStats[testCase.category]) {
      categoryStats[testCase.category] = 0
    }
    categoryStats[testCase.category]++
  })

  Object.entries(categoryStats).forEach(([category, count]) => {
    console.log(`   ${category}: ${count}個`)
  })

  // 優先度別の統計
  const priorityStats = {}
  data.testCases.forEach(testCase => {
    if (!priorityStats[testCase.priority]) {
      priorityStats[testCase.priority] = 0
    }
    priorityStats[testCase.priority]++
  })

  console.log('\n🎯 優先度別テストケース:')
  Object.entries(priorityStats).forEach(([priority, count]) => {
    const emoji = priority === 'high' ? '🔴' : priority === 'medium' ? '🟠' : '🟢'
    console.log(`   ${emoji} ${priority}: ${count}個`)
  })

  // 実行結果の分析
  const results = data.executionResults || []
  const successCount = results.filter(r => r.success).length
  const errorCount = results.filter(r => !r.success).length

  console.log('\n📈 テスト実行結果:')
  console.log(`✅ 成功: ${successCount}個`)
  console.log(`❌ 失敗: ${errorCount}個`)
  console.log(`📊 成功率: ${results.length > 0 ? Math.round((successCount / results.length) * 100) : 0}%`)

  // 実行時間の統計
  if (results.length > 0) {
    const executionTimes = results.map(r => r.executionTime)
    const avgTime = executionTimes.reduce((a, b) => a + b, 0) / executionTimes.length
    const minTime = Math.min(...executionTimes)
    const maxTime = Math.max(...executionTimes)
    
    console.log(`⏱️  実行時間統計:`)
    console.log(`   平均: ${Math.round(avgTime)}ms`)
    console.log(`   最短: ${minTime}ms`)
    console.log(`   最長: ${maxTime}ms`)
  }

  // 生成されたテストケースの詳細
  console.log('\n📋 生成されたテストケース詳細:')
  console.log('--------------------------------------------------')
  data.testCases.forEach((testCase, index) => {
    const priorityEmoji = testCase.priority === 'high' ? '🔴' : testCase.priority === 'medium' ? '🟠' : '🟢'
    console.log(`${index + 1}. ${priorityEmoji} ${testCase.description}`)
    console.log(`   🔧 操作: ${testCase.action}`)
    console.log(`   🎯 要素: ${testCase.elementSelector}`)
    console.log(`   📂 カテゴリ: ${testCase.category}`)
    if (testCase.inputValue) {
      console.log(`   📝 入力値: ${testCase.inputValue}`)
    }
    if (testCase.expectedResult) {
      console.log(`   ✅ 期待結果: ${testCase.expectedResult}`)
    }
    console.log('')
  })

  // 成功したテストケース
  const successfulResults = results.filter(r => r.success)
  if (successfulResults.length > 0) {
    console.log('\n✅ 成功したテストケース:')
    console.log('--------------------------------------------------')
    successfulResults.forEach((result, index) => {
      console.log(`${index + 1}. ${result.testCaseDescription}`)
      console.log(`   ⏱️  実行時間: ${result.executionTime}ms`)
      if (result.actualResult) {
        console.log(`   📊 実際の結果: ${result.actualResult}`)
      }
      if (result.urlAfter && result.urlBefore !== result.urlAfter) {
        console.log(`   🔗 URL変更: ${result.urlBefore} → ${result.urlAfter}`)
      }
      if (result.screenshotPath) {
        console.log(`   📸 スクリーンショット: ${result.screenshotPath}`)
      }
      console.log('')
    })
  }

  // 失敗したテストケース
  const failedResults = results.filter(r => !r.success)
  if (failedResults.length > 0) {
    console.log('\n❌ 失敗したテストケース:')
    console.log('--------------------------------------------------')
    failedResults.forEach((result, index) => {
      console.log(`${index + 1}. ${result.testCaseDescription}`)
      console.log(`   🚫 エラー: ${result.error}`)
      console.log(`   ⏱️  実行時間: ${result.executionTime}ms`)
      console.log('')
    })
  }

  // AIの分析結果
  console.log('\n🤖 AI分析結果:')
  console.log('--------------------------------------------------')
  console.log(`🔍 検出された要素の詳細:`)
  
  const elementTypes = {}
  data.pageAnalysis.elements.forEach(element => {
    if (!elementTypes[element.tagName]) {
      elementTypes[element.tagName] = 0
    }
    elementTypes[element.tagName]++
  })

  Object.entries(elementTypes).forEach(([tagName, count]) => {
    console.log(`   ${tagName}: ${count}個`)
  })

  // 推奨アクション
  console.log('\n💡 推奨アクション:')
  console.log('--------------------------------------------------')
  
  if (errorCount > 0) {
    console.log(`1. 失敗したテストケースの修正 (${errorCount}個)`)
    console.log('   - 要素のセレクターを確認')
    console.log('   - 要素が正しく表示されているか確認')
    console.log('   - JavaScriptエラーの確認')
  }
  
  if (successCount > 0) {
    console.log(`2. 成功したテストケースの最適化 (${successCount}個)`)
    console.log('   - 実行時間の改善')
    console.log('   - ユーザビリティの向上')
  }

  console.log('3. 追加のテストケース検討')
  console.log('   - より多くの要素のテスト')
  console.log('   - エッジケースの追加')
  console.log('   - より複雑なシナリオの追加')

  console.log('4. AI分析の改善')
  console.log('   - より多くの要素タイプの検出')
  console.log('   - より適切なテストケース生成')
  console.log('   - より詳細な分析結果')

  // スクリーンショット情報
  if (data.screenshots && data.screenshots.length > 0) {
    console.log('\n📸 生成されたスクリーンショット:')
    console.log('--------------------------------------------------')
    data.screenshots.forEach((screenshot, index) => {
      console.log(`${index + 1}. ${screenshot}`)
    })
  }

  console.log('\n✅ AI自動テストケース生成結果の表示完了')
}

// メイン実行
if (require.main === module) {
  showAITestCaseResults()
}

module.exports = { showAITestCaseResults, displayAITestCaseResults }
