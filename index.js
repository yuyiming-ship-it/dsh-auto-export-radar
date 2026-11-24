/**
 * 中国汽车出海雷达 —— 宿主半片。
 * 提供：左侧栏面板用的 HTTP 接口（后台定时采集、中文翻译、正文阅读、订阅管理）、
 * 给 agent 的采集工具 auto_export_radar、以及简报写作 skill。
 */
import { readFileSync } from 'node:fs'
import { ArticleError } from './article.js'
import { RadarFeed, translateTitles } from './feed.js'
import { collect, LOCALES } from './radar.js'

export const name = 'auto-export-radar'

const GUIDE = readFileSync(new URL('./skill/radar-guide.md', import.meta.url), 'utf8')
const MAX_BODY = 2 * 1024 * 1024
const OPML_MAX = 512 * 1024
const ROUTE = '/auto-export-radar'

const TOOL_DESCRIPTION = [
  'Harvest recent news about Chinese vehicles going overseas (exports, overseas plants, KD assembly, tariffs, sales, dealer networks, homologation) from many channels and languages at once.',
  'It queries localized Google News editions for Chinese, English, Japanese, Korean, German, French, Arabic, Spanish, Portuguese, Russian, Thai, Vietnamese, Indonesian and Turkish, plus a curated set of industry RSS feeds, then dedupes and balances the result across languages.',
  'Every item also carries a Simplified-Chinese title in `titleZh` (auto-translated; empty when translation is unavailable), plus `signal` (0-3) and `signalKinds` (关税/进口政策/建厂-KD/渠道/物流/禁售召回/补贴税收/进出市场). Prefer `signal > 0` items when writing a decision-oriented digest; treat the rest as background.',
  'Returns a JSON object with normalized items (title, titleZh, source, lang, region, publishedAt, link, topics) and a per-source health list so a failing channel is visible rather than silent.',
  'It only collects, translates and filters; it does not summarize. Write the digest yourself from the returned items and cite the links.',
].join(' ')

function json(res, status, body) {
  const text = JSON.stringify(body)
  res.statusCode = status
  res.setHeader('content-type', 'application/json; charset=utf-8')
  res.setHeader('cache-control', 'no-store')
  res.setHeader('content-length', Buffer.byteLength(text))
  res.end(text)
}

function xml(res, body, filename) {
  res.statusCode = 200
  res.setHeader('content-type', 'text/xml; charset=utf-8')
  res.setHeader('cache-control', 'no-store')
  res.setHeader('content-disposition', `attachment; filename="${filename}"`)
  res.end(body)
}

function numParam(url, key) {
  const raw = url.searchParams.get(key)
  if (raw === null || raw === '') return undefined
  const value = Number(raw)
  return Number.isFinite(value) ? value : undefined
}

function boolParam(url, key) {
  const raw = url.searchParams.get(key)
  return raw === '1' || raw === 'true' || raw === 'yes'
}

function parseLangs(value) {
  if (!value) return undefined
  const list = String(value)
    .split(',')
    .map((row) => row.trim())
    .filter((row) => row && row !== 'all')
  return list.length ? list : undefined
}

async function readBody(req, limit = MAX_BODY) {
  const chunks = []
  let size = 0
  for await (const chunk of req) {
    size += chunk.length
    if (size > limit) throw Object.assign(new Error('请求体太大'), { status: 413 })
    chunks.push(chunk)
  }
  return Buffer.concat(chunks).toString('utf8')
}

async function readJson(req, limit = MAX_BODY) {
  const raw = await readBody(req, limit)
  if (!raw.trim()) return {}
  try {
    const parsed = JSON.parse(raw)
    return parsed && typeof parsed === 'object' ? parsed : {}
  } catch {
    throw Object.assign(new Error('请求不是有效 JSON'), { status: 400 })
  }
}

function decodeXml(value) {
  return String(value || '')
    .replace(/&#(\d+);/g, (_, d) => String.fromCharCode(Number(d)))
    .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCharCode(parseInt(h, 16)))
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
}

/** 从 OPML 里取订阅源；只认 xmlUrl。 */
function parseOpml(xmlText) {
  const feeds = []
  const seen = new Set()
  for (const match of String(xmlText).matchAll(/<outline\b[^>]*>/gi)) {
    const tag = match[0]
    const attr = (name) => {
      const found = tag.match(new RegExp(`${name}\\s*=\\s*"([^"]*)"`, 'i')) || tag.match(new RegExp(`${name}\\s*=\\s*'([^']*)'`, 'i'))
      return found ? decodeXml(found[1]) : ''
    }
    const url = attr('xmlUrl') || attr('xmlurl')
    if (!url || !/^https?:\/\//i.test(url) || seen.has(url)) continue
    seen.add(url)
    let host = url
    try {
      host = new URL(url).host.replace(/^www\./, '')
    } catch {}
    feeds.push({ url, name: attr('title') || attr('text') || host, lang: 'en', region: '', enabled: true })
  }
  return feeds
}

function opmlDocument(feeds) {
  const rows = feeds
    .map((feed) => {
      const escape = (value) => String(value ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
      return `    <outline type="rss" text="${escape(feed.name)}" title="${escape(feed.name)}" xmlUrl="${escape(feed.url)}" htmlUrl="" />`
    })
    .join('\n')
  return `<?xml version="1.0" encoding="UTF-8"?>
<opml version="2.0">
  <head>
    <title>中国汽车出海雷达 · 订阅源</title>
    <dateCreated>${new Date().toUTCString()}</dateCreated>
  </head>
  <body>
${rows}
  </body>
</opml>
`
}

function articleErrorStatus(error) {
  switch (error?.code) {
    case 'GOOGLE_NEWS':
      return 422
    case 'NO_CONTENT':
      return 422
    case 'BAD_URL':
    case 'BAD_SCHEME':
      return 400
    case 'FETCH_FAILED':
      return 502
    case 'TOO_LARGE':
    case 'NOT_HTML':
      return 415
    default:
      return 500
  }
}

export default {
  name,
  inject: ['webServer', 'connection'],
  apply(ctx, config = {}) {
    const feed = new RadarFeed({ ctx, config, logger: ctx.logger })
    feed.start()
    ctx.effect(() => () => feed.dispose(), 'auto-export-radar: stop background refresh')

    /* ---------------- HTTP：给左侧栏面板用 ---------------- */

    ctx.effect(
      () =>
        ctx.webServer.register({
          kind: 'prefix',
          path: ROUTE,
          handler: async (req, res) => {
            try {
              // Web 服务不替插件路由鉴权，每个请求自己走一遍 Host/Origin 与凭证检查。
              const connection = ctx.get('connection')
              const rejection = typeof connection?.requestRejection === 'function' ? connection.requestRejection({ headers: req.headers }) : 403
              if (rejection) return json(res, rejection, { ok: false, error: '未授权' })

              const url = new URL(req.url || '/', 'http://127.0.0.1')
              const path = url.pathname.replace(/\/+$/, '') || ROUTE
              const method = (req.method || 'GET').toUpperCase()

              if (path === `${ROUTE}/feed` && method === 'GET') {
                await feed.ready
                const snapshot = feed.view({
                  hours: numParam(url, 'hours'),
                  langs: parseLangs(url.searchParams.get('langs')),
                  topic: url.searchParams.get('topic') || undefined,
                  q: url.searchParams.get('q') || undefined,
                  limit: numParam(url, 'limit'),
                  unread: boolParam(url, 'unread'),
                  favorite: boolParam(url, 'favorite'),
                })
                // 冷启动：第一次打开面板时池子还空着，先把采集踢起来，让面板显示"正在抓取"。
                if (!snapshot.poolSize && !feed.refreshing) void feed.refresh('first-open')
                return json(res, 200, { ...snapshot, refreshing: feed.refreshing || !snapshot.poolSize })
              }

              if (path === `${ROUTE}/refresh` && (method === 'POST' || method === 'PUT')) {
                await readBody(req)
                void feed.refresh('manual')
                return json(res, 202, { ok: true, refreshing: true, ...feed.status() })
              }

              if (path === `${ROUTE}/status` && method === 'GET') {
                await feed.ready
                return json(res, 200, { ok: true, ...feed.status() })
              }

              if (path === `${ROUTE}/article` && method === 'GET') {
                const target = url.searchParams.get('url') || ''
                if (!target) return json(res, 400, { ok: false, error: '缺少 url 参数' })
                try {
                  const { article, cached } = await feed.getArticle(target)
                  return json(res, 200, { ok: true, cached, article })
                } catch (error) {
                  const status = error instanceof ArticleError ? articleErrorStatus(error) : 500
                  return json(res, status, { ok: false, error: String(error?.message ?? error), code: error?.code || null })
                }
              }

              if (path === `${ROUTE}/article/translate` && method === 'POST') {
                const body = await readJson(req)
                const target = typeof body.url === 'string' ? body.url : ''
                if (!target) return json(res, 400, { ok: false, error: '缺少 url' })
                try {
                  const { article, cached } = await feed.translateArticle(target)
                  return json(res, 200, { ok: true, cached, article })
                } catch (error) {
                  const status = error instanceof ArticleError ? articleErrorStatus(error) : 500
                  return json(res, status, { ok: false, error: String(error?.message ?? error), code: error?.code || null })
                }
              }

              if (path === `${ROUTE}/read` && method === 'POST') {
                const body = await readJson(req)
                const result = await feed.markRead(Array.isArray(body.keys) ? body.keys : [], body.read !== false)
                return json(res, 200, { ok: true, ...result })
              }

              if (path === `${ROUTE}/favorite` && method === 'POST') {
                const body = await readJson(req)
                const result = await feed.setFavorite(Array.isArray(body.keys) ? body.keys : [body.key].filter(Boolean), body.favorite !== false)
                return json(res, 200, { ok: true, ...result })
              }

              if (path === `${ROUTE}/feeds` && method === 'GET') {
                await feed.ready
                return json(res, 200, { ok: true, customFeeds: feed.state.customFeeds, builtin: feed.view({ hours: 24, limit: 1 }).channels.feeds })
              }

              if (path === `${ROUTE}/feeds` && method === 'POST') {
                const body = await readJson(req)
                const result = await feed.saveFeeds(Array.isArray(body.feeds) ? body.feeds : [])
                void feed.refresh('feeds-changed')
                return json(res, 200, { ok: true, ...result, refreshing: true })
              }

              if (path === `${ROUTE}/opml` && method === 'GET') {
                await feed.ready
                return xml(res, opmlDocument(feed.state.customFeeds || []), 'auto-export-radar-subscriptions.opml')
              }

              if (path === `${ROUTE}/opml` && method === 'POST') {
                const raw = await readBody(req, OPML_MAX)
                const incoming = parseOpml(raw)
                if (!incoming.length) return json(res, 400, { ok: false, error: '没有解析到订阅源（需要 xmlUrl）' })
                const existing = feed.state.customFeeds || []
                const known = new Set(existing.map((row) => row.url))
                const merged = [...existing, ...incoming.filter((row) => !known.has(row.url))]
                const result = await feed.saveFeeds(merged)
                void feed.refresh('opml-import')
                return json(res, 200, { ok: true, imported: incoming.length, added: merged.length - existing.length, ...result })
              }

              if (path === `${ROUTE}/settings` && method === 'POST') {
                const body = await readJson(req)
                const result = await feed.saveSettings(body)
                return json(res, 200, { ok: true, ...result })
              }

              if (path === `${ROUTE}/official/watch` && method === 'POST') {
                const body = await readJson(req)
                const result = await feed.saveWatch(body.id, body.enabled)
                void feed.refresh('official-watch-changed')
                return json(res, 200, { ok: true, ...result, refreshing: true })
              }

              if (path === `${ROUTE}/official` && method === 'POST') {
                const body = await readJson(req)
                const result = await feed.saveOfficialSources(Array.isArray(body.sources) ? body.sources : [])
                void feed.refresh('official-changed')
                return json(res, 200, { ok: true, ...result, refreshing: true })
              }

              if (path === `${ROUTE}/social` && method === 'POST') {
                const body = await readJson(req)
                const result = await feed.saveSocialChannels(Array.isArray(body.channels) ? body.channels : [])
                void feed.refresh('social-changed')
                return json(res, 200, { ok: true, ...result, refreshing: true })
              }

              if (path === `${ROUTE}/social/settings` && method === 'POST') {
                const body = await readJson(req)
                const result = await feed.saveSocialSettings(body)
                void feed.refresh('social-connected')
                return json(res, 200, { ok: true, ...result, refreshing: true })
              }

              return json(res, 404, { ok: false, error: '接口不存在' })
            } catch (error) {
              ctx.logger?.warn?.('auto-export-radar: 接口失败：%s', error?.message ?? error)
              if (!res.headersSent) json(res, error?.status || 500, { ok: false, error: String(error?.message ?? error) })
              else res.end()
            }
          },
        }),
      'auto-export-radar: panel routes',
    )

    /* ---------------- 工具：给 agent 的一次性采集 ---------------- */

    ctx.inject(['tools'], (scope) => {
      scope.tools.register({
        name: 'auto_export_radar',
        description: TOOL_DESCRIPTION,
        timeoutMs: 180000,
        parameters: {
          type: 'object',
          additionalProperties: false,
          properties: {
            hours: {
              type: 'integer',
              description: 'Only keep items published within this many hours. Default 72. Use 24 for a daily digest, 168 for a weekly one.',
            },
            limit: {
              type: 'integer',
              description: 'Maximum number of items returned, default 40, capped at 200. Items are balanced across the requested languages.',
            },
            langs: {
              type: 'array',
              items: { type: 'string', enum: [...Object.keys(LOCALES), 'all'] },
              description: "Languages to query. Default ['zh','en','ar','es','ru']; 'all' queries every supported language and takes longer.",
            },
            query: {
              type: 'string',
              description: 'Extra free-text query, run once per requested language. Use it to narrow to a company, market or theme.',
            },
            mode: {
              type: 'string',
              enum: ['all', 'news', 'feeds'],
              description: "Channel set: 'all' (default) mixes localized news wires and industry feeds, 'news' uses only the localized news editions, 'feeds' uses only the curated industry feeds.",
            },
          },
        },
        output: {
          schema: {
            type: 'object',
            additionalProperties: false,
            properties: {
              generatedAt: { type: 'string', description: 'ISO timestamp of the run.' },
              windowHours: { type: 'number' },
              mode: { type: 'string' },
              langs: { type: 'array', items: { type: 'string' } },
              collected: { type: 'number', description: 'Items that passed filtering before the limit was applied.' },
              count: { type: 'number' },
              items: {
                type: 'array',
                items: {
                  type: 'object',
                  additionalProperties: false,
                  properties: {
                    title: { type: 'string' },
                    titleZh: { type: 'string', description: 'Simplified-Chinese title; empty when translation was unavailable.' },
                    source: { type: 'string' },
                    lang: { type: 'string' },
                    region: { type: 'string' },
                    publishedAt: {
                      oneOf: [{ type: 'string' }, { type: 'null' }],
                      description: 'ISO publish time, or null when the channel supplied none.',
                    },
                    link: { type: 'string' },
                    snippet: { type: 'string' },
                    via: { type: 'string', description: 'google-news or feed.' },
                    topics: { type: 'array', items: { type: 'string' } },
                  },
                  required: ['title', 'source', 'lang', 'link'],
                },
              },
              sources: {
                type: 'array',
                items: {
                  type: 'object',
                  additionalProperties: false,
                  properties: {
                    name: { type: 'string' },
                    ok: { type: 'boolean' },
                    items: { type: 'number' },
                    error: { oneOf: [{ type: 'string' }, { type: 'null' }] },
                    lang: { type: 'string' },
                  },
                  required: ['name', 'ok'],
                },
              },
            },
            required: ['generatedAt', 'windowHours', 'langs', 'collected', 'count', 'items', 'sources'],
          },
          render: (_args, value) => {
            const lines = value.items.map((item) => {
              const when = item.publishedAt ? item.publishedAt.slice(0, 16).replace('T', ' ') : '时间未知'
              const topics = item.topics?.length ? ` · ${item.topics.join('/')}` : ''
              const sig = item.signal > 0 ? ` · 信号:${(item.signalKinds || []).join('/')}` : ''
              const zh = item.titleZh && item.titleZh !== item.title ? `\n  中文：${item.titleZh}` : ''
              return `- [${item.lang}] ${item.title} — ${item.source} · ${when}${topics}${sig}${zh}\n  ${item.link}`
            })
            const failed = value.sources.filter((s) => !s.ok)
            const head = `${value.count} 条 / 窗口 ${value.windowHours}h / 语种 ${value.langs.join(',')} / 命中池 ${value.collected}`
            const tail = failed.length ? `\n\n异常渠道：${failed.map((s) => `${s.name}(${s.error})`).join('；')}` : ''
            return [{ type: 'text', text: `${head}\n${lines.join('\n')}${tail}` }]
          },
        },
        async execute(args, exec) {
          const result = await collect({
            hours: args.hours,
            limit: args.limit,
            langs: args.langs,
            query: args.query,
            mode: args.mode,
            signal: exec?.signal,
          })
          // 顺手补中文标题：给 agent 的条目也能直接用中文写简报。
          try {
            const target = result.items.slice(0, 60)
            const translated = await translateTitles(target.map((item) => item.title), { ctx, signal: exec?.signal, logger: ctx.logger })
            target.forEach((item, index) => {
              item.titleZh = translated[index]?.titleZh || ''
            })
            for (const item of result.items) if (typeof item.titleZh !== 'string') item.titleZh = ''
          } catch (error) {
            ctx.logger?.warn?.('auto-export-radar: 工具翻译失败：%s', error?.message ?? error)
            for (const item of result.items) if (typeof item.titleZh !== 'string') item.titleZh = ''
          }
          return result
        },
      })
    })

    /* ---------------- skill：简报写法与渠道口径 ---------------- */

    ctx.inject(['skills'], (scope) => {
      scope.skills.register({
        name: 'china-auto-overseas-radar',
        description:
          '中国汽车出海新闻雷达：多语种多渠道采集出海新闻，按主题整理成带来源链接的定期简报；也提供多渠道信息源清单与查漏方法。',
        whenToUse: '用户问中国汽车出海/出口/海外建厂/关税政策的最新动态，或需要出定期简报、找信息渠道、补查某个市场或品牌的本地报道时。',
        source: 'bundled',
        content: GUIDE,
      })
    })
  },
}
