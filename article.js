/**
 * 中国汽车出海雷达 —— 正文抽取。
 * 只做一件确定的事：把一个网页变成可读的段落数组，抓不到就明确报错，不编造正文。
 */

const DESKTOP_UA =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36'
const MOBILE_UA =
  'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1'

const FETCH_TIMEOUT_MS = 15000
const MAX_BYTES = 4 * 1024 * 1024
const MAX_PARAGRAPHS = 140
const MAX_CHARS = 24000

/** 这些站点要移动端 UA 才给正文（公众号最典型）。 */
const MOBILE_HOSTS = ['mp.weixin.qq.com', 'weixin.qq.com']

export class ArticleError extends Error {
  constructor(message, code = 'ARTICLE_ERROR') {
    super(message)
    this.code = code
  }
}

function decodeEntities(input) {
  return String(input)
    .replace(/&#(\d+);/g, (_, d) => String.fromCharCode(Number(d)))
    .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCharCode(parseInt(h, 16)))
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&nbsp;/g, ' ')
    .replace(/&hellip;/g, '…')
    .replace(/&mdash;/g, '—')
    .replace(/&ndash;/g, '–')
    .replace(/&rsquo;/g, '’')
    .replace(/&lsquo;/g, '‘')
    .replace(/&ldquo;/g, '“')
    .replace(/&rdquo;/g, '”')
    .replace(/&amp;/g, '&')
}

function inlineText(html) {
  return decodeEntities(
    String(html)
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<[^>]*>/g, ' '),
  )
    .replace(/[ \t\u00a0]+/g, ' ')
    .replace(/\s*\n\s*/g, '\n')
    .trim()
}

function metaContent(html, names) {
  for (const name of names) {
    const patterns = [
      new RegExp(`<meta[^>]+(?:property|name)=["']${name}["'][^>]*content=["']([^"']*)["']`, 'i'),
      new RegExp(`<meta[^>]+content=["']([^"']*)["'][^>]*(?:property|name)=["']${name}["']`, 'i'),
    ]
    for (const pattern of patterns) {
      const match = html.match(pattern)
      if (match?.[1]) return decodeEntities(match[1]).trim()
    }
  }
  return ''
}

function stripNoise(html) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, ' ')
    .replace(/<svg[\s\S]*?<\/svg>/gi, ' ')
    .replace(/<iframe[\s\S]*?<\/iframe>/gi, ' ')
    .replace(/<form[\s\S]*?<\/form>/gi, ' ')
    .replace(/<nav[\s\S]*?<\/nav>/gi, ' ')
    .replace(/<aside[\s\S]*?<\/aside>/gi, ' ')
    .replace(/<footer[\s\S]*?<\/footer>/gi, ' ')
    .replace(/<header[\s\S]*?<\/header>/gi, ' ')
    .replace(/<!--[\s\S]*?-->/g, ' ')
}

/** 正文容器候选，按可靠度排序；找不到就用 body。 */
const CONTAINER_PATTERNS = [
  /<div[^>]+id=["']js_content["'][^>]*>([\s\S]*?)<\/div>\s*(?:<\/div>|<script)/i,
  /<div[^>]+class=["'][^"']*rich_media_content[^"']*["'][^>]*>([\s\S]*?)<\/div>/i,
  /<article[^>]*>([\s\S]*?)<\/article>/i,
  /<div[^>]+class=["'][^"']*(?:article[-_]?body|article[-_]?content|entry[-_]?content|post[-_]?content|td-post-content|content[-_]?body|story[-_]?body|detail[-_]?content)[^"']*["'][^>]*>([\s\S]*?)<\/div>\s*(?:<\/div>|<footer|<aside)/i,
  /<main[^>]*>([\s\S]*?)<\/main>/i,
]

function pickContainer(html) {
  for (const pattern of CONTAINER_PATTERNS) {
    const match = html.match(pattern)
    if (match?.[1] && match[1].length > 400) return match[1]
  }
  return html
}

function collectParagraphs(block) {
  const out = []
  const push = (text) => {
    const value = String(text || '').replace(/\s+/g, ' ').trim()
    if (value.length < 25) return
    if (out[out.length - 1] === value) return
    out.push(value)
  }

  // 优先 <p>/<h2>/<li>，按文档顺序
  const blocks = [...block.matchAll(/<(p|h2|h3|li|blockquote)[^>]*>([\s\S]*?)<\/\1>/gi)]
  for (const match of blocks) push(inlineText(match[2]))

  if (out.length >= 3) return out

  // 兜底：整块按换行切分（公众号等用 <span>/<section> 排版的页面）
  const flat = inlineText(block)
  for (const line of flat.split('\n')) push(line)
  return out
}

function trimParagraphs(paragraphs) {
  const kept = []
  let chars = 0
  for (const paragraph of paragraphs) {
    if (kept.length >= MAX_PARAGRAPHS || chars >= MAX_CHARS) break
    kept.push(paragraph)
    chars += paragraph.length
  }
  return kept
}

async function fetchHtml(url, signal) {
  const host = (() => {
    try {
      return new URL(url).host.replace(/^www\./, '')
    } catch {
      return ''
    }
  })()
  const agents = MOBILE_HOSTS.includes(host) ? [MOBILE_UA, DESKTOP_UA] : [DESKTOP_UA, MOBILE_UA]
  let lastStatus = null
  for (const agent of agents) {
    const timeout = AbortSignal.timeout(FETCH_TIMEOUT_MS)
    const combined = signal ? AbortSignal.any([signal, timeout]) : timeout
    try {
      const response = await fetch(url, {
        headers: {
          'user-agent': agent,
          accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'accept-language': 'zh-CN,zh;q=0.9,en;q=0.8',
        },
        redirect: 'follow',
        signal: combined,
      })
      lastStatus = response.status
      if (!response.ok) continue
      const buffer = await response.arrayBuffer()
      if (buffer.byteLength > MAX_BYTES) throw new ArticleError('页面太大，放弃抽取', 'TOO_LARGE')
      const type = response.headers.get('content-type') || ''
      if (!/html|xml|text/i.test(type)) throw new ArticleError(`不是网页内容（${type || '未知类型'}）`, 'NOT_HTML')
      return { html: new TextDecoder('utf-8', { fatal: false }).decode(buffer), finalUrl: response.url || url }
    } catch (error) {
      if (error instanceof ArticleError) throw error
      if (error?.name === 'AbortError' || error?.name === 'TimeoutError') {
        lastStatus = lastStatus ?? 'timeout'
        continue
      }
      lastStatus = error?.message || lastStatus
    }
  }
  throw new ArticleError(`抓不到页面（${lastStatus ?? '网络失败'}）`, 'FETCH_FAILED')
}

/**
 * 抽取一篇正文。
 * @param {string} url 文章地址。
 * @param {{signal?: AbortSignal}} [options]
 * @returns {Promise<{url: string, finalUrl: string, title: string, site: string, byline: string, publishedAt: string|null, paragraphs: string[], chars: number, fetchedAt: string}>}
 */
export async function extractArticle(url, { signal } = {}) {
  let parsed
  try {
    parsed = new URL(url)
  } catch {
    throw new ArticleError('不是有效链接', 'BAD_URL')
  }
  if (!/^https?:$/.test(parsed.protocol)) throw new ArticleError('只支持 http/https 链接', 'BAD_SCHEME')
  if (/(^|\.)news\.google\.com$/i.test(parsed.host)) {
    throw new ArticleError('这条来自 Google News 聚合页，正文需要打开原文站', 'GOOGLE_NEWS')
  }

  const { html, finalUrl } = await fetchHtml(url, signal)
  const cleaned = stripNoise(html)
  const container = pickContainer(cleaned)
  const paragraphs = trimParagraphs(collectParagraphs(container))
  if (!paragraphs.length) throw new ArticleError('这个页面没有识别出正文，可能要靠浏览器打开', 'NO_CONTENT')

  const title =
    metaContent(html, ['og:title', 'twitter:title']) ||
    decodeEntities((html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1] || '').trim()).replace(/\s+/g, ' ') ||
    ''
  const site = metaContent(html, ['og:site_name', 'application-name']) || parsed.host.replace(/^www\./, '')
  const byline = metaContent(html, ['article:author', 'author', 'og:article:author'])
  const publishedRaw = metaContent(html, ['article:published_time', 'og:article:published_time', 'datePublished', 'pubdate'])
  const published = publishedRaw && Number.isFinite(Date.parse(publishedRaw)) ? new Date(publishedRaw).toISOString() : null

  return {
    url,
    finalUrl,
    title,
    site,
    byline,
    publishedAt: published,
    paragraphs,
    chars: paragraphs.reduce((sum, row) => sum + row.length, 0),
    fetchedAt: new Date().toISOString(),
  }
}

/** 把抽取结果拼成给模型的纯文本，用于按段翻中文。 */
export function articlePlainText(article) {
  return article.paragraphs.join('\n\n')
}
