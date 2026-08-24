<script setup>
import { ref, computed } from 'vue'

const matrix = [
  [ 1,  4,  6,  9, 12, 20, 25, 27, 28, 33, 41, 44, 46, 49, 52, 60],
  [ 3, 11, 14, 17, 19, 22, 30, 35, 36, 38, 43, 51, 54, 57, 59, 62],
  [ 2,  7,  8, 10, 15, 23, 26, 29, 31, 34, 42, 47, 48, 50, 55, 63],
  [ 5, 13, 16, 18, 21, 24, 32, 37, 39, 40, 45, 53, 56, 58, 61, 64],
]

const ROWS = 4
const TOTAL = 64

const inputText = ref('')
// 每局结果数组（唯一数据源）：null=空白，1=红方胜，2=蓝方胜
const resultsArr = ref(Array(TOTAL).fill(null))

const BLANK_CHAR = '\u00b7' // 文本框中用 · 表示空白占位

// 解析输入框内容：仅 1/2/0/· 有效，每个有效字符按顺序占用一个对局位；0 和 · 表示空白
function parseInput(text) {
  const cleaned = text.replace(/[^12\u00b70]/g, '')
  const arr = Array(TOTAL).fill(null)
  for (let i = 0; i < cleaned.length && i < TOTAL; i++) {
    const ch = cleaned[i]
    arr[i] = ch === '1' ? 1 : ch === '2' ? 2 : null
  }
  return arr
}

function onFieldInput(e) {
  inputText.value = e.target.value
  resultsArr.value = parseInput(inputText.value)
}

// 数组 => 文本框展示（截去末尾空白）
function projectResults() {
  let last = -1
  for (let i = TOTAL - 1; i >= 0; i--) {
    if (resultsArr.value[i] !== null) { last = i; break }
  }
  if (last === -1) return ''
  return resultsArr.value.slice(0, last + 1)
    .map(v => v === null ? BLANK_CHAR : String(v)).join('')
}

const inputCount = computed(() =>
  resultsArr.value.filter(v => v !== null).length)

// 已输入到的最大对局序号（中间可留空）
const maxEntered = computed(() => {
  for (let i = TOTAL - 1; i >= 0; i--) {
    if (resultsArr.value[i] !== null) return i + 1
  }
  return 0
})

// 前5局不参与连跳统计，从第6局开始
const START_MATCH = 6

function getResult(matchNum) {
  if (matchNum < 1 || matchNum > TOTAL) return null
  return resultsArr.value[matchNum - 1]
}

// 点击单元格切换结果：空白 → 1 → 2 → 空白
function toggleResult(matchNum) {
  const idx = matchNum - 1
  const cur = resultsArr.value[idx]
  resultsArr.value[idx] = cur === null ? 1 : cur === 1 ? 2 : null
  inputText.value = projectResults()
}

// 找到对局序号在矩阵中的位置 {row, col}
function getPosition(matchNum) {
  for (let r = 0; r < ROWS; r++) {
    const c = matrix[r].indexOf(matchNum)
    if (c !== -1) return { row: r, col: c }
  }
  return null
}

// 按序号遍历：当前局结果与所在行左侧节点（上一列）结果一致 => 连，否则 => 跳
const events = computed(() => {
  const evts = []
  for (let i = START_MATCH; i <= maxEntered.value; i++) {
    const pos = getPosition(i)
    if (!pos || pos.col === 0) continue
    const cur = getResult(i)
    const left = getResult(matrix[pos.row][pos.col - 1])
    if (cur === null || left === null) continue
    evts.push({ type: cur === left ? '\u8fde' : '\u8df3', matchNum: i })
  }
  return evts
})

// 连续统计到同类则次数+1；一旦没有连续上（类型变化），另起一条记录
const mergedRuns = computed(() => {
  const runs = []
  for (const e of events.value) {
    const last = runs[runs.length - 1]
    if (last && last.type === e.type) {
      last.count++
    } else {
      runs.push({ type: e.type, count: 1 })
    }
  }
  return runs
})

function getResultStyle(num) {
  const r = getResult(num)
  if (!r) return {}
  if (r === 1) return { backgroundColor: '#e74c3c', color: '#fff' }
  return { backgroundColor: '#3498db', color: '#fff' }
}

function clearInput() {
  resultsArr.value = Array(TOTAL).fill(null)
  inputText.value = ''
}

function fillTestData() {
  resultsArr.value = Array.from({ length: TOTAL }, () => Math.random() > 0.5 ? 1 : 2)
  inputText.value = projectResults()
}

const totalLian = computed(() =>
  mergedRuns.value.filter(s => s.type === '\u8fde').reduce((sum, s) => sum + s.count, 0))
const totalTiao = computed(() =>
  mergedRuns.value.filter(s => s.type === '\u8df3').reduce((sum, s) => sum + s.count, 0))
const count1 = computed(() => resultsArr.value.filter(r => r === 1).length)
const count2 = computed(() => resultsArr.value.filter(r => r === 2).length)
</script>

<template>
  <div class="container">
    <header class="header">
      <h1>对局统计 - 连跳分析</h1>
      <p class="subtitle">共 64 局 · 4行×16列 矩阵</p>
    </header>

    <!-- 输入区域 -->
    <section class="card">
      <h2>输入对局结果</h2>
      <p class="hint">按对局序号（1~64）顺序输入 1 / 2（0 或 · 表示该局留空），也可直接点击下方矩阵切换单元格结果</p>
      <div class="input-row">
        <input :value="inputText" @input="onFieldInput" type="text" maxlength="64"
          placeholder="输入对局结果，如：1212212211..." class="input-field" />
        <button @click="clearInput" class="btn btn-clear">清空</button>
        <button @click="fillTestData" class="btn btn-test">测试数据</button>
      </div>
      <div class="progress-info">
        已输入 <strong>{{ inputCount }}</strong> / {{ TOTAL }} 局
        <div class="progress-bar">
          <div class="progress-fill" :style="{ width: (inputCount / TOTAL * 100) + '%' }"></div>
        </div>
      </div>
    </section>

    <!-- 对局结果 -->
    <section class="card">
      <h2>对局结果</h2>
      <table class="matrix-table">
        <tbody>
          <tr v-for="(row, r) in matrix" :key="'r' + r">
            <td v-for="(num, c) in row" :key="'c' + c"
              class="cell" :style="getResultStyle(num)"
              :class="{ 'has-result': getResult(num) }"
              :title="'第 ' + num + ' 局：点击切换 空白 → 1 → 2'"
              @click="toggleResult(num)">
              <span class="num">{{ num }}</span>
              <span v-if="getResult(num)" class="result">{{ getResult(num) }}</span>
            </td>
          </tr>
        </tbody>
      </table>
    </section>

    <!-- 连跳统计 -->
    <section class="card">
      <h2>连跳统计</h2>
      <p class="hint">
        <span class="legend-item"><span class="tag lian">连</span> 与所在行左侧节点结果相同</span>
        <span class="legend-item"><span class="tag tiao">跳</span> 与所在行左侧节点结果不同</span>
        （前5局不参与统计）
      </p>
      <div v-if="mergedRuns.length === 0" class="no-stat">-</div>
      <div v-else class="runs-grid">
        <span v-for="(run, idx) in mergedRuns" :key="idx"
          class="run-chip" :class="run.type === '\u8fde' ? 'lian' : 'tiao'">{{ run.count }}</span>
      </div>
    </section>

    <!-- 汇总 -->
    <section class="card" v-if="inputCount >= 2">
      <h2>汇总统计</h2>
      <div class="summary-row">
        <div class="stat-box">
          <div class="stat-label">总对局</div>
          <div class="stat-num">{{ inputCount }}</div>
        </div>
        <div class="stat-box">
          <div class="stat-label">红方胜(1)</div>
          <div class="stat-num red">{{ count1 }}</div>
        </div>
        <div class="stat-box">
          <div class="stat-label">蓝方胜(2)</div>
          <div class="stat-num blue">{{ count2 }}</div>
        </div>
        <div class="stat-box">
          <div class="stat-label">总连</div>
          <div class="stat-num red">{{ totalLian }}</div>
        </div>
        <div class="stat-box">
          <div class="stat-label">总跳</div>
          <div class="stat-num blue">{{ totalTiao }}</div>
        </div>
      </div>
    </section>
  </div>
</template>

<style scoped>
.container {
  max-width: 1100px;
  margin: 0 auto;
  padding: 16px;
}
.header {
  text-align: center;
  margin-bottom: 20px;
}
.header h1 {
  font-size: 24px;
  color: #1a1a2e;
  margin: 0 0 4px;
}
.subtitle {
  color: #888;
  font-size: 13px;
  margin: 0;
}
.card {
  background: #fff;
  border-radius: 10px;
  padding: 18px;
  margin-bottom: 16px;
  box-shadow: 0 1px 8px rgba(0,0,0,0.06);
}
.card h2 {
  font-size: 16px;
  color: #1a1a2e;
  margin: 0 0 12px;
}
.hint {
  color: #999;
  font-size: 12px;
  margin: 0 0 10px;
}

/* 输入 */
.input-row {
  display: flex;
  gap: 10px;
}
.input-field {
  flex: 1;
  padding: 10px 14px;
  border: 1.5px solid #ddd;
  border-radius: 6px;
  font-size: 15px;
  letter-spacing: 1.5px;
  transition: border-color 0.2s;
}
.input-field:focus {
  outline: none;
  border-color: #3498db;
}
.btn {
  padding: 10px 16px;
  border: none;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  white-space: nowrap;
}
.btn-clear { background: #f0f0f0; color: #666; }
.btn-clear:hover { background: #e0e0e0; }
.btn-test { background: #3498db; color: #fff; }
.btn-test:hover { background: #2980b9; }
.progress-info {
  margin-top: 10px;
  color: #888;
  font-size: 13px;
}
.progress-bar {
  height: 4px;
  background: #eee;
  border-radius: 2px;
  margin-top: 6px;
  overflow: hidden;
}
.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #3498db, #2ecc71);
  transition: width 0.3s;
}

/* 矩阵 */
.matrix-table {
  border-collapse: collapse;
  table-layout: fixed;
  width: 100%;
  max-width: 560px;
  margin: 0 auto;
}
.matrix-table td {
  border: 1px solid #e0e0e0;
  text-align: center;
  padding: 0;
}
.cell {
  height: 36px;
  background: #fafafa;
  position: relative;
  cursor: pointer;
  user-select: none;
  transition: filter 0.1s;
}
.cell:hover { background: #eef2f7; }
.cell.has-result:hover { filter: brightness(0.92); }
.cell:active { transform: scale(0.94); }
.cell.has-result { font-weight: 600; }
.num {
  font-size: 8px;
  color: #000;
  position: absolute;
  top: 1px;
  left: 50%;
  transform: translateX(-50%);
  line-height: 1;
}
.result {
  font-size: 13px;
  font-weight: 700;
}

/* 分隔线 */
.divider {
  height: 1px;
  background: #ddd;
  margin: 8px 0;
}

/* 统计 */
.runs-grid {
  display: grid;
  grid-template-columns: repeat(16, 1fr);
  gap: 3px;
}
.run-chip {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 22px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 700;
  color: #fff;
}
.run-chip.lian { background: #e74c3c; }
.run-chip.tiao { background: #3498db; }
.no-stat {
  color: #ccc;
  font-size: 13px;
  text-align: center;
}

/* 图例 */
.legend-item {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  margin-right: 16px;
}
.tag {
  display: inline-block;
  padding: 1px 6px;
  border-radius: 3px;
  font-size: 11px;
  font-weight: 600;
  color: #fff;
}
.tag.lian { background: #e74c3c; }
.tag.tiao { background: #3498db; }

/* 汇总 */
.summary-row {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}
.stat-box {
  flex: 1;
  min-width: 80px;
  text-align: center;
  padding: 12px 8px;
  background: #f8f9fa;
  border-radius: 8px;
}
.stat-label {
  font-size: 11px;
  color: #999;
  margin-bottom: 4px;
}
.stat-num {
  font-size: 22px;
  font-weight: 700;
  color: #1a1a2e;
}
.stat-num.red { color: #e74c3c; }
.stat-num.blue { color: #3498db; }

/* 响应式 */
@media (max-width: 600px) {
  .container { padding: 10px; }
  .header h1 { font-size: 20px; }
  .card { padding: 14px; }
  .input-row { flex-wrap: wrap; }
  .input-field { min-width: 0; }
  .btn { flex: 1; }
  .stat-num { font-size: 18px; }
}
</style>
