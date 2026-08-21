<script setup>
import { ref, computed } from 'vue'

const matrix = [
  [ 1,  4,  6,  9, 12, 20, 25, 27, 28, 33, 41, 44, 46, 49, 52, 60],
  [ 3, 11, 14, 17, 19, 22, 30, 35, 36, 38, 43, 51, 54, 57, 59, 62],
  [ 2,  7,  8, 10, 15, 23, 26, 29, 31, 34, 42, 47, 48, 50, 55, 63],
  [ 5, 13, 16, 18, 21, 24, 32, 37, 39, 40, 45, 53, 56, 58, 61, 64],
]

const ROWS = 4
const COLS = 16
const TOTAL = 64

const inputText = ref('')

const results = computed(() => {
  const text = inputText.value.replace(/[^12]/g, '')
  const arr = []
  for (let i = 0; i < text.length && i < TOTAL; i++) {
    arr.push(parseInt(text[i]))
  }
  return arr
})

const inputCount = computed(() => results.value.length)

function getResult(matchNum) {
  if (matchNum < 1 || matchNum > inputCount.value) return null
  return results.value[matchNum - 1] || null
}

function getColIndex(matchNum) {
  for (let c = 0; c < COLS; c++) {
    for (let r = 0; r < ROWS; r++) {
      if (matrix[r][c] === matchNum) return c
    }
  }
  return -1
}

const columnStats = computed(() => {
  const stats = Array.from({ length: COLS }, () => [])
  const maxMatch = inputCount.value
  if (maxMatch < 2) return stats
  for (let i = 2; i <= maxMatch; i++) {
    const prevResult = results.value[i - 2]
    const curResult = results.value[i - 1]
    if (prevResult === undefined || curResult === undefined) continue
    const col = getColIndex(i)
    if (col === -1) continue
    const isSame = prevResult === curResult
    const type = isSame ? '\u8fde' : '\u8df3'
    stats[col].push({ type, matchNum: i })
  }
  return stats
})

const mergedStats = computed(() => {
  return columnStats.value.map(colStats => {
    if (colStats.length === 0) return []
    const merged = []
    let current = { type: colStats[0].type, count: 1 }
    for (let i = 1; i < colStats.length; i++) {
      if (colStats[i].type === current.type) {
        current.count++
      } else {
        merged.push({ ...current })
        current = { type: colStats[i].type, count: 1 }
      }
    }
    merged.push({ ...current })
    return merged
  })
})

function getStatStyle(type) {
  if (type === '\u8fde') return { backgroundColor: '#e74c3c', color: '#fff' }
  return { backgroundColor: '#3498db', color: '#fff' }
}

function getResultStyle(num) {
  const r = getResult(num)
  if (!r) return {}
  if (r === 1) return { backgroundColor: '#e74c3c', color: '#fff' }
  return { backgroundColor: '#3498db', color: '#fff' }
}

function clearInput() { inputText.value = '' }

function fillTestData() {
  const data = []
  for (let i = 0; i < TOTAL; i++) {
    data.push(Math.random() > 0.5 ? '1' : '2')
  }
  inputText.value = data.join('')
}

const totalLian = computed(() =>
  mergedStats.value.flat().filter(s => s.type === '\u8fde').reduce((sum, s) => sum + s.count, 0))
const totalTiao = computed(() =>
  mergedStats.value.flat().filter(s => s.type === '\u8df3').reduce((sum, s) => sum + s.count, 0))
const count1 = computed(() => results.value.filter(r => r === 1).length)
const count2 = computed(() => results.value.filter(r => r === 2).length)
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
      <p class="hint">按对局序号（1~64）顺序输入：1 = 红方胜，2 = 蓝方胜</p>
      <div class="input-row">
        <input v-model="inputText" type="text" maxlength="64"
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
      <div class="scroll-wrapper">
        <table class="matrix-table">
          <thead>
            <tr>
              <th v-for="c in COLS" :key="'h' + c" class="col-header">{{ c }}</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(row, r) in matrix" :key="'r' + r">
              <td v-for="(num, c) in row" :key="'c' + c"
                class="cell" :style="getResultStyle(num)"
                :class="{ 'has-result': getResult(num) }">
                <span class="num">{{ num }}</span>
                <span v-if="getResult(num)" class="result">{{ getResult(num) }}</span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <!-- 连跳统计 -->
    <section class="card">
      <h2>连跳统计</h2>
      <p class="hint">
        <span class="legend-item"><span class="tag lian">连</span> 上一局与当前局结果相同</span>
        <span class="legend-item"><span class="tag tiao">跳</span> 上一局与当前局结果不同</span>
      </p>
      <div class="scroll-wrapper">
        <table class="matrix-table stats-table">
          <thead>
            <tr>
              <th v-for="c in COLS" :key="'sh' + c" class="col-header">{{ c }}</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td v-for="(colStats, c) in mergedStats" :key="'sc' + c" class="stat-cell">
                <div v-if="colStats.length === 0" class="no-stat">-</div>
                <div v-else class="stat-list">
                  <span v-for="(item, idx) in colStats" :key="idx"
                    class="stat-tag" :class="item.type">
                    {{ item.type }}{{ item.count }}
                  </span>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
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
.scroll-wrapper {
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
}
.matrix-table {
  border-collapse: collapse;
  table-layout: fixed;
  width: 100%;
}
.matrix-table th,
.matrix-table td {
  border: 1px solid #e0e0e0;
  text-align: center;
  width: 56px;
  min-width: 56px;
  max-width: 56px;
}
.col-header {
  background: #f5f7fa;
  color: #888;
  font-size: 11px;
  font-weight: 600;
  height: 24px;
  padding: 0;
}
.cell {
  height: 38px;
  padding: 0;
  background: #fafafa;
  position: relative;
}
.cell.has-result { font-weight: 600; }
.num {
  font-size: 10px;
  color: #bbb;
  position: absolute;
  top: 2px;
  left: 50%;
  transform: translateX(-50%);
}
.cell.has-result .num { color: rgba(255,255,255,0.6); }
.result {
  font-size: 15px;
  font-weight: 700;
}

/* 分隔线 */
.divider {
  height: 1px;
  background: #ddd;
  margin: 8px 0;
}

/* 统计 */
.stat-cell {
  height: auto;
  min-height: 36px;
  padding: 4px 3px;
  vertical-align: top;
}
.stat-list {
  display: flex;
  flex-direction: column;
  gap: 2px;
  align-items: center;
}
.stat-tag {
  display: inline-block;
  padding: 1px 5px;
  border-radius: 3px;
  font-size: 10px;
  font-weight: 600;
  white-space: nowrap;
}
.stat-tag.lian { background: #e74c3c; color: #fff; }
.stat-tag.tiao { background: #3498db; color: #fff; }
.no-stat { color: #ccc; font-size: 13px; }

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
