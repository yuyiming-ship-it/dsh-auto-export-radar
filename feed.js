/**
 * 中国汽车出海雷达 —— 服务层：后台定时采集、去重合并、中文标题翻译、正文抽取与翻译、阅读状态。
 * 只依赖 node 标准库与同目录模块；DSH 服务（llm / agentDefaultModel）通过 ctx 按需取用。
 */
import { mkdir, readFile, rename, writeFile } from 'node:fs/promises'
import { homedir } from 'node:os'
import { join } from 'node:path'
import { extractArticle } from './article.js'
import { collect, EDITIONS, FEEDS, LOCALES, looksLikeAppliance } from './radar.js'
import { OFFICIAL_REFS, OFFICIAL_SOURCES, WATCH_SOURCES, fetchOfficialList } from './official.js'
import { MARKETS } from './radar.js'
import {
  PLATFORMS,
  SOCIAL_TEMPLATE,
  fetchBridgeFeed,
  fetchXRecent,
  isAutoPost,
  normalizeHandle,
  normalizeSocialItem,
} from './social.js'

const STATE_VERSION = 2
const POOL_MAX = 300
const POOL_TTL_MS = 10 * 24 * 3600 * 1000
const VIEW_HOURS = 96
const GOOGLE = 'https://translate.googleapis.com/translate_a/single'
const TRANSLATE_TIMEOUT_MS = 9000
const TRANSLATE_CONCURRENCY = 4
const TRANSLATE_BATCH = 16
const TRANSLATE_CHUNK_CONCURRENCY = 4
const TRANSLATE_CACHE_LIMIT = 6000
const SLOW_SOURCE_MS = 8000
const SLOW_EVERY = 2
const MAX_TRANSLATE_PER_CYCLE = 100
const ARTICLE_TTL_MS = 14 * 24 * 3600 * 1000
const ARTICLE_MAX = 120
const READ_MAX = 800
const PARAGRAPH_CHUNK_CHARS = 1400
const PARAGRAPH_CHUNK_MAX = 8
const SOCIAL_MAX = 40
const SOCIAL_CONCURRENCY = 3

export function dshHome(env = process.env) {
  return env.DSH_HOME || join(homedir(), '.dsh')
}

function hash(text) {
  let h = 5381
  for (let i = 0; i < text.length; i += 1) h = ((h << 5) + h + text.charCodeAt(i)) >>> 0
  return h.toString(36)
}

function linkKey(link) {
  try {
    const url = new URL(link)
    return `${url.host.replace(/^www\./, '')}${url.pathname}`.replace(/\/$/, '')
  } catch {
    return String(link).slice(0, 160)
  }
}

function articleKey(url) {
  try {
    const parsed = new URL(url)
    return `${parsed.host.replace(/^www\./, '')}${parsed.pathname}${parsed.search}`.slice(0, 300)
  } catch {
    return String(url).slice(0, 300)
  }
}

/** 标题已经主要是中文时不必再翻。 */
export function looksChinese(text) {
  const letters = String(text || '').replace(/[\s\d\p{P}]/gu, '')
  if (!letters) return false
  const cjk = letters.match(/[\u3400-\u9fff]/g)?.length || 0
  return cjk / letters.length > 0.35
}

/** 整轮采集的看门狗：到点就放弃本轮，把错误写进状态，别让面板一直转圈。 */
function withDeadline(promise, ms, message) {
  let timer
  const guard = new Promise((_, reject) => {
    timer = setTimeout(() => reject(Object.assign(new Error(message), { code: 'REFRESH_TIMEOUT' })), ms)
  })
  return Promise.race([promise, guard]).finally(() => clearTimeout(timer))
}

function hardTimeout(promise, ms, label) {
  let timer
  const guard = new Promise((_, reject) => {
    timer = setTimeout(() => reject(new Error(`${label} timeout`)), ms)
  })
  return Promise.race([promise, guard]).finally(() => clearTimeout(timer))
}

function mapLimit(items, limit, worker) {
  const out = new Array(items.length)
  let cursor = 0
  return Promise.all(
    Array.from({ length: Math.min(limit, items.length) }, async () => {
      while (cursor < items.length) {
        const index = cursor
        cursor += 1
        out[index] = await worker(items[index], index)
      }
    }),
  ).then(() => out)
}

/* ------------------------------------------------------------------ */
/* 翻译：先用免费的公开接口，失败再退回 DSH 当前默认模型                */
/* ------------------------------------------------------------------ */

/**
 * 一次请求翻一批：translate_a/t 支持重复 q，响应按顺序给 [译文, 源语言]。
 * 比逐条请求少一个数量级的往返。
 */
async function googleBatch(texts, signal) {
  const url = 'https://translate.googleapis.com/translate_a/t?client=gtx&sl=auto&tl=zh-CN'
  const body = texts.map((text) => `q=${encodeURIComponent(text)}`).join('&')
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'content-type': 'application/x-www-form-urlencoded',
      'user-agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36',
    },
    body,
    signal: signal ? AbortSignal.any([signal, AbortSignal.timeout(TRANSLATE_TIMEOUT_MS)]) : AbortSignal.timeout(TRANSLATE_TIMEOUT_MS),
  })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  const data = await res.json()
  if (!Array.isArray(data) || data.length !== texts.length) throw new Error('batch shape mismatch')
  return data.map((row) => {
    if (Array.isArray(row)) return String(row[0] ?? '').trim()
    return typeof row === 'string' ? row.trim() : ''
  })
}

async function googleOne(text, signal) {
  const url = new URL(GOOGLE)
  url.searchParams.set('client', 'gtx')
  url.searchParams.set('sl', 'auto')
  url.searchParams.set('tl', 'zh-CN')
  url.searchParams.set('dt', 't')
  url.searchParams.set('q', text)
  const res = await fetch(url, {
    headers: {
      'user-agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36',
    },
    signal: signal ? AbortSignal.any([signal, AbortSignal.timeout(TRANSLATE_TIMEOUT_MS)]) : AbortSignal.timeout(TRANSLATE_TIMEOUT_MS),
    redirect: 'follow',
  })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  const data = await res.json()
  const segments = Array.isArray(data?.[0]) ? data[0] : []
  const out = segments
    .map((seg) => (Array.isArray(seg) ? seg[0] : ''))
    .filter(Boolean)
    .join('')
    .trim()
  if (!out) throw new Error('empty translation')
  return out
}

/** 取当前默认模型路由：没配密钥、没接提供方时返回 null。 */
function defaultRoute(ctx) {
  try {
    const selection = ctx.get('agentDefaultModel')?.currentSelection()
    return selection?.provider && selection?.model ? { provider: selection.provider, model: selection.model } : null
  } catch {
    return null
  }
}

async function llmText(ctx, { system, user, maxTokens = 4000, signal }) {
  const llm = ctx.get('llm')
  const route = defaultRoute(ctx)
  if (!llm || !route) throw new Error('当前没有可用模型')
  const call = await llm.prepareCall({ provider: route.provider, model: route.model, maxTokens, temperature: 0.1 }, signal)
  let text = ''
  for await (const chunk of call.stream({
    ...call.config,
    system,
    messages: [{ role: 'user', content: [{ type: 'text', text: user }], source: { kind: 'auto-export-radar' } }],
    signal,
  })) {
    if (chunk.type === 'text-delta') text += chunk.text
    else if (chunk.type === 'finish' && (chunk.reason?.kind === 'error' || chunk.reason?.kind === 'aborted')) {
      throw new Error(chunk.reason.failure?.message || '模型调用失败')
    }
  }
  return text
}

function parseJsonArray(text) {
  const start = text.search(/\[/)
  const end = text.lastIndexOf(']')
  if (start < 0 || end <= start) return null
  try {
    const parsed = JSON.parse(text.slice(start, end + 1))
    return Array.isArray(parsed) ? parsed.map((row) => String(row ?? '').trim()) : null
  } catch {
    return null
  }
}

const TITLE_SYSTEM = [
  '你是中国汽车出海行业的中文编辑。把每条新闻标题翻译成简体中文。',
  '保留品牌名、车型名、机构名的通用中文译法（如 BYD 比亚迪、Chery 奇瑞、Jetour 捷途、GWM 长城、SAIC 上汽）。',
  '不要添加解释、不要合并、不要省略任何一条。',
  '只输出 JSON 数组，长度与输入条数相同，元素是译好的字符串，例如 ["标题一","标题二"]。',
].join('\n')

async function llmTranslate(ctx, texts, signal) {
  const numbered = texts.map((text, index) => `${index + 1}. ${text}`).join('\n')
  const raw = await llmText(ctx, { system: TITLE_SYSTEM, user: numbered, maxTokens: 4000, signal })
  const parsed = parseJsonArray(raw)
  return parsed && parsed.length === texts.length ? parsed : null
}

const BODY_SYSTEM = [
  '你是中国汽车出海行业的中文译者。把下面编号的英文/阿语/西语等段落逐段译成简体中文。',
  '保留品牌名、车型名、数字、单位与专有名词；不要添加评论、不要省略段落、不要合并段落。',
  '只输出 JSON 数组，长度与输入段数相同，元素是一段中文译文。',
].join('\n')

/** 把段落翻成中文，长文分批；返回等长数组与「是否真的译过」标记。 */
async function translateParagraphs(ctx, paragraphs, signal, logger) {
  const chunks = []
  let current = []
  let chars = 0
  for (const paragraph of paragraphs) {
    if (current.length >= PARAGRAPH_CHUNK_MAX || (chars + paragraph.length > PARAGRAPH_CHUNK_CHARS && current.length)) {
      chunks.push(current)
      current = []
      chars = 0
    }
    current.push(paragraph)
    chars += paragraph.length
  }
  if (current.length) chunks.push(current)

  const out = new Array(paragraphs.length)
  let done = 0
  let offset = 0
  const positions = chunks.map((chunk) => {
    const start = offset
    offset += chunk.length
    return start
  })
  await mapLimit(chunks, 3, async (chunk, chunkIndex) => {
    const start = positions[chunkIndex]
    try {
      const rows = await googleBatch(chunk, signal)
      if (rows.length === chunk.length && rows.every(Boolean)) {
        rows.forEach((text, index) => { out[start + index] = text })
        done += 1
        return
      }
      throw new Error('batch shape mismatch')
    } catch {
      /* 免费接口不行再走模型 */
    }
    const numbered = chunk.map((text, index) => `【${index + 1}】${text}`).join('\n\n')
    try {
      const raw = await llmText(ctx, { system: BODY_SYSTEM, user: numbered, maxTokens: 4000, signal })
      const parsed = parseJsonArray(raw)
      if (parsed && parsed.length === chunk.length && parsed.every(Boolean)) {
        parsed.forEach((text, index) => { out[start + index] = text })
        done += 1
      } else {
        chunk.forEach((text, index) => { out[start + index] = text })
      }
    } catch (error) {
      logger?.warn?.('auto-export-radar: 正文翻译失败：%s', error?.message ?? error)
      chunk.forEach((text, index) => { out[start + index] = text })
    }
  })
  return { paragraphs: out.map((text, index) => text ?? paragraphs[index]), translated: done === chunks.length }
}

/**
 * 把一批原始标题翻成中文。返回 [{ titleZh, engine }]，顺序与输入一致；翻不出的项 titleZh 为空。
 */
export async function translateTitles(texts, { ctx, signal, logger, cache } = {}) {
  const out = texts.map((text) => ({
    titleZh: looksChinese(text) ? String(text).trim() : '',
    engine: looksChinese(text) ? 'original' : null,
  }))
  // 先查历史译文：同一个标题只翻一次，重复来源也能直接复用。
  const byText = new Map()
  texts.forEach((text, index) => {
    if (out[index].titleZh) return
    const raw = String(text)
    const cached = cache?.[hash(raw)]
    if (cached) {
      out[index] = { titleZh: cached, engine: 'cache' }
      return
    }
    if (!byText.has(raw)) byText.set(raw, [])
    byText.get(raw).push(index)
  })
  if (!byText.size) return out

  const unique = [...byText.keys()]
  const batches = []
  for (let i = 0; i < unique.length; i += TRANSLATE_BATCH) batches.push(unique.slice(i, i + TRANSLATE_BATCH))

  const translatedByText = new Map()
  await mapLimit(batches, TRANSLATE_CHUNK_CONCURRENCY, async (batch) => {
    try {
      const rows = await googleBatch(batch, signal)
      batch.forEach((text, index) => {
        const value = rows[index]
        if (value) translatedByText.set(text, value)
      })
    } catch {
      // 整批失败再逐条试，避免一条坏数据拖垮一批
      await mapLimit(batch, TRANSLATE_CONCURRENCY, async (text) => {
        try {
          translatedByText.set(text, await googleOne(text, signal))
        } catch {
          /* 留给模型兜底 */
        }
      })
    }
  })

  const failed = []
  for (const [text, indexes] of byText) {
    const value = translatedByText.get(text)
    if (value) {
      for (const index of indexes) out[index] = { titleZh: value, engine: 'google' }
    } else {
      for (const index of indexes) failed.push({ index, text })
    }
  }

  if (failed.length && ctx) {
    try {
      const translated = await llmTranslate(ctx, [...new Set(failed.map((row) => row.text))], signal)
      if (translated) {
        const uniqueFailed = [...new Set(failed.map((row) => row.text))]
        failed.forEach((row) => {
          const value = translated[uniqueFailed.indexOf(row.text)]
          if (value) out[row.index] = { titleZh: value, engine: 'llm' }
        })
      }
    } catch (error) {
      logger?.warn?.('auto-export-radar: 模型翻译失败：%s', error?.message ?? error)
    }
  }
  return out
}

/* ------------------------------------------------------------------ */
/* 状态                                                                */
/* ------------------------------------------------------------------ */

function emptyState() {
  return {
    version: STATE_VERSION,
    generatedAt: null,
    nextRefreshAt: null,
    lastError: null,
    lastReason: null,
    items: [],
    translations: {},
    sources: [],
    collected: 0,
    reads: {},
    favorites: {},
    customFeeds: [],
    settings: {},
    socialChannels: [],
    socialConfig: { bridgeBase: '', xBearer: '' },
    officialSources: [],
    officialWatch: {},
    officialSeen: {},
    sourceLatency: {},
    rounds: 0,
  }
}

function isPlainObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
}

function normalizeSaved(saved) {
  const state = emptyState()
  if (!isPlainObject(saved) || saved.version !== STATE_VERSION) return state
  state.generatedAt = typeof saved.generatedAt === 'string' ? saved.generatedAt : null
  state.nextRefreshAt = typeof saved.nextRefreshAt === 'string' ? saved.nextRefreshAt : null
  state.lastError = typeof saved.lastError === 'string' ? saved.lastError : null
  state.lastReason = typeof saved.lastReason === 'string' ? saved.lastReason : null
  state.collected = Number.isFinite(saved.collected) ? saved.collected : 0
  state.sources = Array.isArray(saved.sources) ? saved.sources.filter((row) => isPlainObject(row) && typeof row.name === 'string') : []
  state.items = Array.isArray(saved.items)
    ? saved.items.filter((row) => isPlainObject(row) && typeof row.title === 'string' && typeof row.link === 'string').slice(0, POOL_MAX)
    : []
  state.translations = isPlainObject(saved.translations) ? saved.translations : {}
  state.reads = isPlainObject(saved.reads) ? saved.reads : {}
  state.favorites = isPlainObject(saved.favorites) ? saved.favorites : {}
  state.customFeeds = Array.isArray(saved.customFeeds)
    ? saved.customFeeds.filter((row) => isPlainObject(row) && typeof row.url === 'string' && /^https?:\/\//i.test(row.url)).slice(0, 60)
    : []
  state.settings = isPlainObject(saved.settings) ? saved.settings : {}
  state.socialChannels = Array.isArray(saved.socialChannels)
    ? saved.socialChannels
        .filter((row) => isPlainObject(row) && PLATFORMS[row.platform] && normalizeHandle(row.handle))
        .map((row) => ({
          id: typeof row.id === 'string' && row.id ? row.id : `${row.platform}:${normalizeHandle(row.handle)}`,
          platform: row.platform,
          handle: normalizeHandle(row.handle),
          name: typeof row.name === 'string' ? row.name.slice(0, 60) : '',
          lang: typeof row.lang === 'string' && row.lang ? row.lang.slice(0, 8) : 'en',
          region: typeof row.region === 'string' ? row.region.slice(0, 24) : '',
          enabled: row.enabled !== false,
        }))
        .slice(0, SOCIAL_MAX)
    : []
  state.officialWatch = isPlainObject(saved.officialWatch) ? saved.officialWatch : {}
  state.officialSeen = isPlainObject(saved.officialSeen) ? saved.officialSeen : {}
  state.sourceLatency = isPlainObject(saved.sourceLatency) ? saved.sourceLatency : {}
  state.rounds = Number.isFinite(saved.rounds) ? saved.rounds : 0
  state.officialSources = Array.isArray(saved.officialSources)
    ? saved.officialSources
        .filter((row) => isPlainObject(row) && typeof row.url === 'string' && /^https?:\/\//i.test(row.url))
        .map((row) => ({
          id: typeof row.id === 'string' && row.id ? row.id : hash(row.url),
          name: (typeof row.name === 'string' && row.name.trim()) || String(row.url).replace(/^https?:\/\//, '').slice(0, 40),
          url: String(row.url).trim(),
          lang: typeof row.lang === 'string' && row.lang ? row.lang.slice(0, 8) : 'en',
          region: typeof row.region === 'string' ? row.region.slice(0, 24) : '',
          filter: typeof row.filter === 'string' ? row.filter.slice(0, 300) : 'vehicle|automotive|car|汽车|авто|سيار|otomobil|voiture|veículo|автомоб',
        }))
        .slice(0, 40)
    : []
  state.socialConfig = {
    bridgeBase: isPlainObject(saved.socialConfig) && typeof saved.socialConfig.bridgeBase === 'string' ? saved.socialConfig.bridgeBase : '',
    xBearer: isPlainObject(saved.socialConfig) && typeof saved.socialConfig.xBearer === 'string' ? saved.socialConfig.xBearer : '',
  }
  return state
}

function normalizeArticle(saved) {
  if (!isPlainObject(saved) || !Array.isArray(saved.paragraphs) || !saved.paragraphs.length) return null
  return {
    url: String(saved.url || ''),
    finalUrl: String(saved.finalUrl || saved.url || ''),
    title: String(saved.title || ''),
    site: String(saved.site || ''),
    byline: String(saved.byline || ''),
    publishedAt: typeof saved.publishedAt === 'string' ? saved.publishedAt : null,
    paragraphs: saved.paragraphs.filter((row) => typeof row === 'string' && row.length > 0).slice(0, 200),
    chars: Number(saved.chars) || 0,
    fetchedAt: typeof saved.fetchedAt === 'string' ? saved.fetchedAt : new Date(0).toISOString(),
    zh: isPlainObject(saved.zh) && Array.isArray(saved.zh.paragraphs) && saved.zh.paragraphs.length
      ? { paragraphs: saved.zh.paragraphs.map((row) => String(row ?? '')), engine: String(saved.zh.engine || 'llm'), at: String(saved.zh.at || '') }
      : null,
  }
}

function clamp(value, min, max, fallback) {
  return Number.isFinite(value) ? Math.max(min, Math.min(max, value)) : fallback
}

/* ------------------------------------------------------------------ */
/* 服务                                                                */
/* ------------------------------------------------------------------ */

export class RadarFeed {
  constructor({ ctx, config = {}, logger } = {}) {
    this.ctx = ctx
    this.logger = logger
    this.config = {
      refreshMinutes: clamp(config.refreshMinutes, 5, 720, 20),
      translate: config.translate !== false,
      windowHours: clamp(config.windowHours, 6, 336, VIEW_HOURS),
      bridgeBase: typeof config.bridgeBase === 'string' ? config.bridgeBase.trim() : '',
      xBearer: typeof config.xBearer === 'string' ? config.xBearer.trim() : '',
    }
    this.root = join(dshHome(), 'auto-export-radar')
    this.file = join(this.root, 'state.json')
    this.articlesFile = join(this.root, 'articles.json')
    this.state = emptyState()
    this.articles = new Map()
    this.running = null
    this.timer = null
    this.loaded = false
    this.socialStatus = new Map()
    this.officialStatus = new Map()
    this.translating = null
    this.ready = this.load()
  }

  async load() {
    try {
      this.state = normalizeSaved(JSON.parse(await readFile(this.file, 'utf8')))
    } catch (error) {
      if (error?.code !== 'ENOENT') this.logger?.warn?.('auto-export-radar: 读取本地状态失败：%s', error?.message ?? error)
      this.state = emptyState()
    }
    // 配置里显式写死的不被本地设置覆盖
    const saved = this.state.settings
    if (!Number.isFinite(this.config.refreshMinutes)) this.config.refreshMinutes = 20
    this.config.refreshMinutes = clamp(saved.refreshMinutes, 5, 720, this.config.refreshMinutes)
    this.config.translate = typeof saved.translate === 'boolean' ? saved.translate : this.config.translate
    this.config.windowHours = clamp(saved.windowHours, 6, 336, this.config.windowHours)
    this.config.watchlist = Array.isArray(saved.watchlist) ? saved.watchlist.filter((row) => typeof row === 'string' && row.trim()).slice(0, 24) : []
    if (!this.config.bridgeBase) this.config.bridgeBase = this.state.socialConfig?.bridgeBase || ''
    if (!this.config.xBearer) this.config.xBearer = this.state.socialConfig?.xBearer || ''

    try {
      const raw = JSON.parse(await readFile(this.articlesFile, 'utf8'))
      if (isPlainObject(raw)) {
        for (const [key, value] of Object.entries(raw)) {
          const article = normalizeArticle(value)
          if (article) this.articles.set(key, article)
        }
      }
    } catch (error) {
      if (error?.code !== 'ENOENT') this.logger?.warn?.('auto-export-radar: 读取正文缓存失败：%s', error?.message ?? error)
    }
    this.loaded = true
    return this.state
  }

  saveSettingsObject() {
    this.state.settings = {
      refreshMinutes: this.config.refreshMinutes,
      translate: this.config.translate,
      windowHours: this.config.windowHours,
      watchlist: this.config.watchlist || [],
    }
  }

  async save() {
    this.state.translations = Object.fromEntries(Object.entries(this.state.translations).slice(-1200))
    this.state.reads = Object.fromEntries(Object.entries(this.state.reads).slice(-READ_MAX))
    this.state.favorites = Object.fromEntries(Object.entries(this.state.favorites).slice(-READ_MAX))
    this.saveSettingsObject()
    try {
      await mkdir(this.root, { recursive: true })
      const tmp = `${this.file}.${process.pid}.tmp`
      await writeFile(tmp, JSON.stringify(this.state), 'utf8')
      await rename(tmp, this.file)
    } catch (error) {
      this.logger?.warn?.('auto-export-radar: 保存本地状态失败：%s', error?.message ?? error)
    }
  }

  async saveArticles() {
    const rows = [...this.articles.entries()]
      .sort((a, b) => Date.parse(b[1].fetchedAt) - Date.parse(a[1].fetchedAt))
      .slice(0, ARTICLE_MAX)
    this.articles = new Map(rows)
    try {
      await mkdir(this.root, { recursive: true })
      const tmp = `${this.articlesFile}.${process.pid}.tmp`
      await writeFile(tmp, JSON.stringify(Object.fromEntries(rows)), 'utf8')
      await rename(tmp, this.articlesFile)
    } catch (error) {
      this.logger?.warn?.('auto-export-radar: 保存正文缓存失败：%s', error?.message ?? error)
    }
  }

  /** 按当前间隔重排后台任务。 */
  arm() {
    if (this.timer) clearInterval(this.timer)
    const timer = setInterval(() => {
      const due = !this.state.nextRefreshAt || Date.now() >= Date.parse(this.state.nextRefreshAt)
      if (due) void this.refresh('interval')
    }, 60_000)
    timer.unref?.()
    this.timer = timer
  }

  /** 启动：读盘 + 立即刷一轮 + 之后按间隔刷。 */
  start() {
    void this.ready.then(() => {
      const stale = !this.state.generatedAt || Date.now() - Date.parse(this.state.generatedAt) > this.config.refreshMinutes * 60_000
      if (stale) void this.refresh('startup')
      this.arm()
    })
    return this
  }

  get intervalMinutes() {
    return this.config.refreshMinutes
  }

  get refreshing() {
    return this.running !== null
  }

  /** 内置源 + 用户自己加的源。 */
  feedList() {
    const custom = (this.state.customFeeds || [])
      .filter((feed) => feed.enabled !== false)
      .map((feed) => ({ name: feed.name || feed.url, url: feed.url, lang: feed.lang || 'en', region: feed.region || '' }))
    return [...FEEDS, ...custom]
  }

  /** 刷一轮：采集 → 合并 → 翻译新条目 → 落盘。并发调用复用同一次执行。 */
  refresh(reason = 'manual') {
    if (this.running) return this.running
    this.state.lastRefreshStartedAt = new Date().toISOString()
    this.state.lastRefreshReason = reason
    void this.save()
    this.running = (async () => {
      const startedAt = Date.now()
      try {
        await this.ready
        this.state.rounds = (this.state.rounds || 0) + 1
        const slowNames = this.slowSources()
        // 新闻/RSS、社交、官方页三路互不依赖，一起发；总时长取最慢的一路
        // 整轮最多 120 秒，超时放弃本轮并记错误，避免面板一直卡在“正在抓取”
        const [result, social, official] = await withDeadline(Promise.all([
          collect({
            hours: this.config.windowHours,
            limit: 220,
            langs: ['all'],
            mode: 'all',
            feeds: this.feedList(),
            latency: this.state.sourceLatency,
            skipNames: this.state.rounds % SLOW_EVERY === 1 ? slowNames : null,
            markets: MARKETS.map((market) => market.id),
          }),
          this.collectSocial(),
          this.collectOfficial(),
        ]), 120000, '本轮采集超过 120 秒，已放弃；下轮再试')
        this.recordLatency(result.sources)
        this.merge({
          ...result,
          items: [...(result.items || []), ...social.items, ...official.items],
          collected: (result.collected || 0) + social.items.length + official.items.length,
          sources: [...(result.sources || []), ...social.sources, ...official.sources],
        })
        this.state.generatedAt = new Date().toISOString()
        this.state.lastError = null
        this.state.lastReason = reason
        this.state.nextRefreshAt = new Date(Date.now() + this.config.refreshMinutes * 60_000).toISOString()
        this.state.lastRefreshMs = Date.now() - startedAt
        await this.save()
        this.scheduleTranslate()
      } catch (error) {
        this.state.lastError = String(error?.message ?? error)
        this.state.nextRefreshAt = new Date(Date.now() + this.config.refreshMinutes * 60_000).toISOString()
        this.logger?.warn?.('auto-export-radar: 采集失败：%s', this.state.lastError)
        await this.save()
      } finally {
        this.running = null
      }
      return this.state
    })()
    return this.running
  }

  merge(result) {
    const byKey = new Map(this.state.items.map((item) => [item.key, item]))
    // 官方源被删掉/改名后，它以前收的条目也一起清出去（其余来源不动）。
    const officialNames = new Set(this.officialList().map((source) => source.name))
    const now = Date.now()
    for (const raw of result.items || []) {
      const key = linkKey(raw.link)
      const existing = byKey.get(key)
      const cached = this.state.translations[hash(raw.title)] ?? null
      const titleZh = existing?.titleZh || cached || ''
      byKey.set(key, {
        key,
        title: raw.title,
        titleZh,
        source: raw.source,
        lang: raw.lang,
        region: raw.region || '',
        publishedAt: raw.publishedAt || null,
        link: raw.link,
        snippet: raw.snippet || '',
        via: raw.via || 'news',
        topics: Array.isArray(raw.topics) ? raw.topics : [],
        signal: Number(raw.signal) || 0,
        signalKinds: Array.isArray(raw.signalKinds) ? raw.signalKinds : [],
        market: typeof raw.market === 'string' ? raw.market : '',
        addedAt: existing?.addedAt || new Date(now).toISOString(),
      })
    }
    const items = [...byKey.values()]
      .filter((item) => {
        const stamp = Date.parse(item.publishedAt || item.addedAt)
        if (Number.isFinite(stamp) && now - stamp >= POOL_TTL_MS) return false
        // 旧规则存进来的家电/数码误判（小米洗衣机之类）在下一轮合并时清出池子。
        if (item.via !== 'social' && looksLikeAppliance(`${item.title} ${item.snippet || ''}`)) return false
        if (item.via === 'official' && !officialNames.has(item.source)) return false
        return true
      })
      .sort((a, b) => Date.parse(b.publishedAt || b.addedAt) - Date.parse(a.publishedAt || a.addedAt))
      .slice(0, POOL_MAX)
    this.state.items = items
    this.state.collected = result.collected ?? items.length
    // 一轮的渠道状态就是完整清单：直接替换，删掉的源不会一直挂在健康列表里
    if (Array.isArray(result.sources) && result.sources.length) this.state.sources = result.sources
  }

  /** 官方信源：内置清单 + 自己加的页面。 */
  officialList() {
    const custom = (this.state.officialSources || []).map((row) => ({
      id: row.id,
      name: row.name,
      url: row.url,
      lang: row.lang,
      region: row.region,
      filter: row.filter,
      custom: true,
    }))
    const builtin = OFFICIAL_SOURCES.map((row) => ({ ...row, custom: false }))
    const watch = WATCH_SOURCES.map((row) => ({
      ...row,
      custom: false,
      watch: true,
      enabled: this.watchEnabled(row),
    }))
    return [...builtin, ...watch, ...custom]
  }

  watchEnabled(source) {
    const override = this.state.officialWatch?.[source.id]
    if (typeof override === 'boolean') return override
    return source.enabledByDefault !== false
  }

  /** 打开/关闭一个增量监控源。 */
  async saveWatch(id, enabled) {
    if (!String(id || '').trim()) throw new Error('缺少信源 id')
    this.state.officialWatch = { ...(this.state.officialWatch || {}), [id]: Boolean(enabled) }
    await this.save()
    return { id, enabled: Boolean(enabled) }
  }

  /** 上一轮实测超过阈值的源：隔一轮抓一次，避免每轮都被同一批慢站拽住。 */
  slowSources() {
    const table = this.state.sourceLatency || {}
    return new Set(Object.entries(table).filter(([, ms]) => Number(ms) > SLOW_SOURCE_MS).map(([name]) => name))
  }

  /** 用本轮耗时更新每源滑动平均，下一轮据此收紧超时。 */
  recordLatency(sources) {
    if (!Array.isArray(sources)) return
    const table = this.state.sourceLatency || {}
    for (const source of sources) {
      const ms = Number(source?.ms)
      if (!Number.isFinite(ms) || ms <= 0) continue
      const prev = Number(table[source.name])
      table[source.name] = Number.isFinite(prev) && prev > 0 ? Math.round(prev * 0.7 + ms * 0.3) : Math.round(ms)
    }
    this.state.sourceLatency = table
  }

  /**
   * 抓官方公告页：部委 / 海关 / 公报没有 RSS，用列表页 + 关键词过滤。
   * 没有匹配公告时记 0 条（正常），打不开才记故障。
   */
  async collectOfficial() {
    const sources = this.officialList()
    const items = []
    const sourcesOut = []
    const now = new Date().toISOString()
    if (!sources.length) return { items, sources: sourcesOut }
    const seen = new Set()
    const startedAt = Date.now()
    const budgetMs = 13000
    await mapLimit(sources, 6, async (source) => {
      const isOddRound = (this.state.rounds || 0) % SLOW_EVERY === 1
      const slowOfficial = isOddRound && Number(this.state.sourceLatency?.[source.name]) > SLOW_SOURCE_MS
      if (slowOfficial) {
        sourcesOut.push({ name: source.name, ok: true, items: 0, error: null, lang: source.lang, official: true, skipped: true, ms: 0, note: '慢源降频，本轮跳过' })
        this.officialStatus.set(source.id, { ok: true, items: 0, error: null, at: now, skipped: true, note: '慢源降频，本轮跳过' })
        return
      }
      if (Date.now() > startedAt + budgetMs) {
        sourcesOut.push({ name: source.name, ok: true, items: 0, error: null, lang: source.lang, official: true, skipped: true, ms: 0, note: '本轮超预算，下轮再抓' })
        this.officialStatus.set(source.id, { ok: true, items: 0, error: null, at: now, skipped: true, note: '本轮超预算，下轮再抓' })
        return
      }
      if (source.watch && !this.watchEnabled(source)) {
        sourcesOut.push({ name: source.name, ok: true, items: 0, error: null, lang: source.lang, official: true, watch: true, paused: true, note: source.note || '已暂停' })
        this.officialStatus.set(source.id, { ok: true, items: 0, error: null, at: now, watch: true, paused: true, note: source.note || '已暂停' })
        return
      }
      try {
        const ewma = Number(this.state.sourceLatency?.[source.name])
        const timeoutMs = Number.isFinite(ewma) && ewma > 0 ? Math.min(15000, Math.max(6000, Math.round(ewma * 3))) : 15000
        const t0 = Date.now()
        const rows = await hardTimeout(fetchOfficialList(source), timeoutMs, `${source.name} `)
        const took = Date.now() - t0
        const prev = Number(this.state.sourceLatency?.[source.name])
        this.state.sourceLatency = {
          ...(this.state.sourceLatency || {}),
          [source.name]: Number.isFinite(prev) && prev > 0 ? Math.round(prev * 0.7 + took * 0.3) : Math.round(took),
        }
        let kept = 0
        if (source.watch) {
          const previous = Array.isArray(this.state.officialSeen?.[source.id]) ? this.state.officialSeen[source.id] : null
          const firstRun = previous === null
          const known = new Set(previous || [])
          const baseline = Number.isFinite(source.baseline) ? source.baseline : 6
          for (const row of rows) {
            const key = linkKey(row.link)
            if (seen.has(key)) continue
            const isNew = !known.has(key)
            seen.add(key)
            if (!isNew) continue
            if (firstRun && kept >= baseline) continue
            items.push({ ...row, watchNew: true })
            kept += 1
          }
          this.state.officialSeen = {
            ...(this.state.officialSeen || {}),
            [source.id]: rows.map((row) => linkKey(row.link)).slice(0, 400),
          }
          const note = kept
            ? `${firstRun ? '首次基线' : '新增'} ${kept} 条`
            : '本期没有新法令'
          sourcesOut.push({ name: source.name, ok: true, items: kept, error: null, lang: source.lang, official: true, watch: true, new: kept, firstRun, note })
          this.officialStatus.set(source.id, { ok: true, items: kept, error: null, at: now, watch: true, new: kept, firstRun, note })
          return
        }
        for (const row of rows) {
          const key = linkKey(row.link)
          if (seen.has(key)) continue
          seen.add(key)
          items.push(row)
          kept += 1
        }
        sourcesOut.push({
          name: source.name,
          ok: true,
          items: kept,
          error: null,
          lang: source.lang,
          official: true,
          ms: took,
          note: kept ? null : '本期没有匹配关键词的公告',
        })
        this.officialStatus.set(source.id, { ok: true, items: kept, error: null, at: now, note: kept ? null : '本期没有匹配关键词的公告' })
      } catch (error) {
        const message = String(error?.message ?? error)
        sourcesOut.push({ name: source.name, ok: false, items: 0, error: message, lang: source.lang, official: true })
        this.officialStatus.set(source.id, { ok: false, items: 0, error: message, at: now })
        this.logger?.warn?.('auto-export-radar: 官方信源失败 %s：%s', source.name, message)
      }
    })
    return { items, sources: sourcesOut }
  }

  /** 社交连接状态（不返回令牌本身）。 */
  socialReady() {
    const bridge = String(this.config.bridgeBase || '').trim()
    const bearer = String(this.config.xBearer || '').trim()
    return {
      bridge,
      bearer,
      bridgeReady: /^https?:\/\//i.test(bridge),
      xReady: bearer.length > 10,
    }
  }

  /**
   * 采集社交渠道：优先自建桥（X / Facebook / Threads 都走它），只有 X 可以用官方 API 兜底。
   * 没有配置时不发任何请求。
   */
  async collectSocial() {
    const channels = (this.state.socialChannels || []).filter((row) => row.enabled !== false)
    const items = []
    const sources = []
    const now = new Date().toISOString()
    if (!channels.length) return { items, sources, skipped: 0 }
    const ready = this.socialReady()
    if (!ready.bridgeReady && !ready.xReady) {
      for (const channel of channels) {
        this.socialStatus.set(channel.id, { ok: null, skipped: true, items: 0, error: null, at: now })
      }
      return { items, sources, skipped: channels.length, reason: 'unconfigured' }
    }

    const seen = new Set()
    await mapLimit(channels, SOCIAL_CONCURRENCY, async (channel) => {
      const label = `${PLATFORMS[channel.platform]?.label || channel.platform} · ${channel.handle}`
      try {
        const viaXApi = channel.platform === 'x' && !ready.bridgeReady && ready.xReady
        if (!viaXApi && !ready.bridgeReady) {
          this.socialStatus.set(channel.id, {
            ok: null,
            skipped: true,
            items: 0,
            error: null,
            reason: '需要自建桥（RSSHub）：Facebook / Threads 没有官方只读接口',
            at: now,
          })
          return
        }
        const raw = viaXApi
          ? await fetchXRecent({ bearer: ready.bearer, handle: channel.handle })
          : await fetchBridgeFeed({ base: ready.bridge, platform: channel.platform, handle: channel.handle })
        let kept = 0
        for (const item of raw) {
          const normalized = normalizeSocialItem(item, channel)
          if (!normalized) continue
          if (!isAutoPost(`${normalized.title} ${normalized.snippet}`)) continue
          const key = linkKey(normalized.link)
          if (seen.has(key)) continue
          seen.add(key)
          items.push({ ...normalized, socialChannel: channel.id })
          kept += 1
        }
        sources.push({ name: label, ok: true, items: kept, error: null, lang: channel.lang, social: true })
        this.socialStatus.set(channel.id, { ok: true, skipped: false, items: kept, error: null, at: now })
      } catch (error) {
        const message = String(error?.message ?? error)
        sources.push({ name: label, ok: false, items: 0, error: message, lang: channel.lang, social: true })
        this.socialStatus.set(channel.id, { ok: false, skipped: false, items: 0, error: message, at: now })
        this.logger?.warn?.('auto-export-radar: 社交渠道失败 %s：%s', label, message)
      }
    })
    return { items, sources, skipped: 0 }
  }

  /** 给还没有中文标题的条目补翻译；每轮限流，避免一次刷太多。 */
  async translatePending() {
    const pending = this.state.items.filter((item) => !item.titleZh).slice(0, MAX_TRANSLATE_PER_CYCLE)
    if (!pending.length) return
    const translated = await translateTitles(pending.map((item) => item.title), {
      ctx: this.ctx, logger: this.logger, cache: this.state.translations,
    })
    pending.forEach((item, index) => {
      const row = translated[index]
      if (!row?.titleZh) return
      item.titleZh = row.titleZh
      this.state.translations[hash(item.title)] = row.titleZh
    })
    const keys = Object.keys(this.state.translations)
    if (keys.length > TRANSLATE_CACHE_LIMIT) {
      for (const key of keys.slice(0, keys.length - TRANSLATE_CACHE_LIMIT)) delete this.state.translations[key]
    }
  }

  /** 翻译放到后台跑，不挡刷新返回；积压多于一轮上限时连续补几轮。 */
  scheduleTranslate() {
    if (!this.config.translate || this.translating) return
    this.translating = (async () => {
      try {
        for (let round = 0; round < 4; round += 1) {
          const before = this.state.items.filter((item) => !item.titleZh).length
          if (!before) break
          await this.translatePending()
          await this.save()
          const after = this.state.items.filter((item) => !item.titleZh).length
          if (after >= before) break
        }
      } catch (error) {
        this.logger?.warn?.('auto-export-radar: 后台翻译失败：%s', error?.message ?? error)
      } finally {
        this.translating = null
      }
    })()
  }

  /** 面板/接口视角：按窗口、语种、主题、关键词、未读、收藏过滤。 */
  view({ hours, langs, topic, q, limit, unread, favorite } = {}) {
    const windowHours = clamp(hours, 1, 24 * 30, this.config.windowHours)
    const cutoff = Date.now() - windowHours * 3600_000
    const wanted = Array.isArray(langs) && langs.length ? new Set(langs) : null
    const needle = typeof q === 'string' ? q.trim().toLowerCase() : ''

    const inWindow = this.state.items.filter((item) => {
      const stamp = Date.parse(item.publishedAt || item.addedAt)
      return Number.isFinite(stamp) && stamp >= cutoff
    })

    const decorate = (item) => ({
      ...item,
      id: item.key,
      read: Boolean(this.state.reads[item.key]),
      favorite: Boolean(this.state.favorites[item.key]),
      hasArticle: !/^https?:\/\/news\.google\.com\//i.test(item.link),
    })

    const filtered = inWindow
      .filter((item) => {
        if (wanted && !wanted.has(item.lang)) return false
        if (topic && !item.topics?.includes(topic)) return false
        if (unread && this.state.reads[item.key]) return false
        if (favorite && !this.state.favorites[item.key]) return false
        if (needle) {
          const haystack = `${item.title} ${item.titleZh} ${item.source} ${item.region}`.toLowerCase()
          if (!haystack.includes(needle)) return false
        }
        return true
      })
      .sort((a, b) => Date.parse(b.publishedAt || b.addedAt) - Date.parse(a.publishedAt || a.addedAt))

    const items = filtered
      .slice(0, Number.isFinite(limit) ? Math.max(1, Math.min(300, limit)) : 120)
      .map(decorate)

    const byLang = {}
    for (const item of items) byLang[item.lang] = (byLang[item.lang] || 0) + 1
    const byTopic = {}
    for (const item of items) for (const tag of item.topics || []) byTopic[tag] = (byTopic[tag] || 0) + 1

    const failed = (this.state.sources || []).filter((row) => row.ok === false)
    const unreadCount = inWindow.filter((item) => !this.state.reads[item.key]).length
    const favoriteCount = Object.keys(this.state.favorites).length
    const customFeeds = (this.state.customFeeds || []).map((feed) => ({ ...feed }))

    return {
      ok: true,
      generatedAt: this.state.generatedAt,
      nextRefreshAt: this.state.nextRefreshAt,
      refreshing: this.refreshing,
      intervalMinutes: this.config.refreshMinutes,
      lastError: this.state.lastError,
      windowHours,
      poolSize: this.state.items.length,
      collected: this.state.collected,
      itemCount: items.length,
      untranslated: this.state.items.filter((item) => !item.titleZh).length,
      translating: Boolean(this.translating),
      lastRefreshMs: this.state.lastRefreshMs || null,
      refreshStartedAt: this.state.lastRefreshStartedAt || null,
      refreshReason: this.state.lastRefreshReason || null,
      markets: MARKETS.map((market) => ({ id: market.id, name: market.name, group: market.group })),
      unreadCount,
      favoriteCount,
      watchlist: this.config.watchlist || [],
      settings: { refreshMinutes: this.config.refreshMinutes, translate: this.config.translate, watchlist: this.config.watchlist || [] },
      byLang,
      byTopic,
      items,
      sources: this.state.sources,
      channelHealth: {
        total: (this.state.sources || []).length,
        ok: (this.state.sources || []).length - failed.length,
        failed: failed.map((row) => ({ name: row.name, error: row.error || null })),
      },
      channels: {
        news: EDITIONS.map((edition) => ({
          lang: edition.lang,
          label: LOCALES[edition.lang]?.label ?? edition.lang,
          region: edition.region,
        })),
        feeds: this.feedList().map((feed) => ({ name: feed.name, lang: feed.lang, region: feed.region })),
      },
      customFeeds,
      official: this.officialView(),
      social: this.socialView(items),
    }
  }

  officialView() {
    return {
      refs: OFFICIAL_REFS,
      sources: this.officialList().map((source) => ({
        id: source.id,
        name: source.name,
        region: source.region || '',
        lang: source.lang,
        custom: Boolean(source.custom),
        watch: Boolean(source.watch),
        enabled: source.watch ? this.watchEnabled(source) : true,
        url: source.url,
        status: this.officialStatus.get(source.id) || null,
      })),
      count: (this.state.sources || []).filter((row) => row.official).reduce((sum, row) => sum + (row.items || 0), 0),
    }
  }

  /** 覆盖保存自定义官方页面。 */
  async saveOfficialSources(list) {
    const rows = (Array.isArray(list) ? list : [])
      .filter((row) => isPlainObject(row) && typeof row.url === 'string' && /^https?:\/\//i.test(row.url))
      .map((row) => ({
        id: typeof row.id === 'string' && row.id ? row.id : hash(String(row.url).trim()),
        name: (typeof row.name === 'string' ? row.name.trim() : '').slice(0, 60) || String(row.url).replace(/^https?:\/\//, '').slice(0, 40),
        url: String(row.url).trim(),
        lang: typeof row.lang === 'string' && row.lang ? row.lang.slice(0, 8) : 'en',
        region: typeof row.region === 'string' ? row.region.slice(0, 24) : '',
        filter: typeof row.filter === 'string' ? row.filter.slice(0, 300) : '',
      }))
      .slice(0, 40)
    this.state.officialSources = rows
    this.officialStatus = new Map()
    this.translating = null
    await this.save()
    return { officialSources: rows }
  }

  socialView(items) {
    const ready = this.socialReady()
    return {
      configured: { bridge: ready.bridgeReady, x: ready.xReady },
      bridgeBase: ready.bridge,
      xBearerHint: ready.bearer ? ready.bearer.slice(-4) : '',
      channels: (this.state.socialChannels || []).map((channel) => ({
        ...channel,
        status: this.socialStatus.get(channel.id) || null,
      })),
      template: SOCIAL_TEMPLATE,
      count: items.filter((item) => item.via === 'social').length,
    }
  }

  status() {
    return {
      generatedAt: this.state.generatedAt,
      nextRefreshAt: this.state.nextRefreshAt,
      refreshing: this.refreshing,
      intervalMinutes: this.config.refreshMinutes,
      poolSize: this.state.items.length,
      unreadCount: this.state.items.filter((item) => !this.state.reads[item.key]).length,
      lastError: this.state.lastError,
    }
  }

  /** 标记已读/未读；keys 为空时表示全部当前条目。 */
  async markRead(keys, read = true) {
    const list = Array.isArray(keys) && keys.length ? keys : this.state.items.map((item) => item.key)
    const stamp = new Date().toISOString()
    for (const key of list) {
      if (typeof key !== 'string' || !key) continue
      if (read) this.state.reads[key] = stamp
      else delete this.state.reads[key]
    }
    await this.save()
    return { unreadCount: this.state.items.filter((item) => !this.state.reads[item.key]).length }
  }

  async setFavorite(keys, favorite = true) {
    const list = Array.isArray(keys) ? keys : [keys]
    const stamp = new Date().toISOString()
    for (const key of list) {
      if (typeof key !== 'string' || !key) continue
      if (favorite) this.state.favorites[key] = stamp
      else delete this.state.favorites[key]
    }
    await this.save()
    return { favoriteCount: Object.keys(this.state.favorites).length }
  }

  /** 覆盖保存自定义订阅源。 */
  async saveFeeds(feeds) {
    const list = Array.isArray(feeds) ? feeds : []
    this.state.customFeeds = list
      .filter((row) => isPlainObject(row) && typeof row.url === 'string' && /^https?:\/\//i.test(row.url.trim()))
      .map((row) => {
        const url = String(row.url).trim()
        let host = url
        try {
          host = new URL(url).host.replace(/^www\./, '')
        } catch {}
        return {
          id: typeof row.id === 'string' && row.id ? row.id : hash(url),
          name: (typeof row.name === 'string' && row.name.trim()) || host,
          url,
          lang: typeof row.lang === 'string' && row.lang ? row.lang.slice(0, 8) : 'en',
          region: typeof row.region === 'string' ? row.region.slice(0, 24) : '',
          enabled: row.enabled !== false,
        }
      })
      .slice(0, 60)
    await this.save()
    return { customFeeds: this.state.customFeeds }
  }

  async saveSettings(patch = {}) {
    if (Number.isFinite(patch.refreshMinutes)) this.config.refreshMinutes = clamp(patch.refreshMinutes, 5, 720, this.config.refreshMinutes)
    if (typeof patch.translate === 'boolean') this.config.translate = patch.translate
    if (Array.isArray(patch.watchlist)) {
      this.config.watchlist = patch.watchlist
        .filter((row) => typeof row === 'string' && row.trim())
        .map((row) => row.trim().slice(0, 40))
        .slice(0, 24)
    }
    this.state.nextRefreshAt = new Date(Date.now() + this.config.refreshMinutes * 60_000).toISOString()
    this.arm()
    await this.save()
    return { settings: { refreshMinutes: this.config.refreshMinutes, translate: this.config.translate, watchlist: this.config.watchlist || [] } }
  }

  /** 覆盖保存社交渠道清单。 */
  async saveSocialChannels(list) {
    const rows = (Array.isArray(list) ? list : [])
      .filter((row) => isPlainObject(row) && PLATFORMS[row.platform] && normalizeHandle(row.handle))
      .map((row) => ({
        id: typeof row.id === 'string' && row.id ? row.id : `${row.platform}:${normalizeHandle(row.handle).toLowerCase()}`,
        platform: row.platform,
        handle: normalizeHandle(row.handle),
        name: (typeof row.name === 'string' ? row.name.trim() : '').slice(0, 60),
        lang: typeof row.lang === 'string' && row.lang ? row.lang.slice(0, 8) : 'en',
        region: typeof row.region === 'string' ? row.region.slice(0, 24) : '',
        enabled: row.enabled !== false,
      }))
      .filter((row, index, all) => all.findIndex((other) => other.id === row.id) === index)
      .slice(0, SOCIAL_MAX)
    this.state.socialChannels = rows
    this.socialStatus = new Map()
    this.officialStatus = new Map()
    this.translating = null
    await this.save()
    return { socialChannels: rows }
  }

  /** 保存社交连接（自建桥地址 / X Bearer）。令牌只落本地状态，不回传给前端。 */
  async saveSocialSettings(patch = {}) {
    if (typeof patch.bridgeBase === 'string') {
      const value = patch.bridgeBase.trim()
      if (value && !/^https?:\/\//i.test(value)) {
        throw Object.assign(new Error('桥接地址必须是 http(s) 链接'), { status: 400 })
      }
      this.config.bridgeBase = value.replace(/\/+$/, '')
    }
    if (typeof patch.xBearer === 'string') this.config.xBearer = patch.xBearer.trim()
    this.state.socialConfig = { bridgeBase: this.config.bridgeBase, xBearer: this.config.xBearer }
    await this.save()
    const ready = this.socialReady()
    return {
      configured: { bridge: ready.bridgeReady, x: ready.xReady },
      bridgeBase: ready.bridge,
      xBearerHint: ready.bearer ? ready.bearer.slice(-4) : '',
    }
  }

  async getArticle(url) {
    const key = articleKey(url)
    const cached = this.articles.get(key)
    if (cached && Date.now() - Date.parse(cached.fetchedAt) < ARTICLE_TTL_MS) return { article: cached, cached: true }
    const article = await extractArticle(url)
    this.articles.set(key, article)
    await this.saveArticles()
    return { article, cached: false }
  }

  async translateArticle(url) {
    const { article } = await this.getArticle(url)
    if (article.zh?.paragraphs?.length) return { article, cached: true }
    const result = await translateParagraphs(this.ctx, article.paragraphs, undefined, this.logger)
    if (!result.translated) {
      throw Object.assign(new Error('翻译暂时不可用（没有可用的模型或全部批次失败）'), { code: 'TRANSLATE_UNAVAILABLE' })
    }
    article.zh = { paragraphs: result.paragraphs, engine: 'llm', at: new Date().toISOString() }
    this.articles.set(articleKey(url), article)
    await this.saveArticles()
    return { article, cached: false }
  }

  dispose() {
    if (this.timer) clearInterval(this.timer)
    this.timer = null
  }
}
