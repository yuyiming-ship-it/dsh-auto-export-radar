/**
 * 社交渠道适配层：X / Facebook / Threads。
 *
 * 这三个平台都没有免登录的公开读取通道（实测：16 个 Nitter 实例、9 个 RSSHub 公共实例、
 * Threads / Facebook 页面 HTML 全部拿不到内容）。所以这里只接两条真实可用的路：
 *
 * 1) 自建桥（推荐 RSSHub）：把 bridgeBase 指向你自己的实例，插件按平台路由取 RSS。
 * 2) X 官方 API v2 的 recent search：填 bearer token 即可按账号或关键词抓推文。
 *
 * 两者都没配置时不发任何请求，面板显示「待配置」，不会伪装成"没有新闻"。
 */
import { parseFeedItems, detectTopics } from './radar.js'

export const PLATFORMS = {
  x: { label: 'X', route: (handle) => `/twitter/user/${handle}` },
  facebook: { label: 'Facebook', route: (handle) => `/facebook/page/${handle}` },
  threads: { label: 'Threads', route: (handle) => `/threads/user/${handle}` },
}

/** 句柄清洗：去掉 @、链接前缀、尾部斜杠。 */
export function normalizeHandle(raw) {
  const value = String(raw || '').trim()
  if (!value) return ''
  const fromUrl = value.match(/(?:x|twitter|facebook|threads)\.(?:com|net)\/(?:@)?([A-Za-z0-9._-]{2,60})/i)
  const handle = fromUrl ? fromUrl[1] : value.replace(/^@+/, '')
  return handle.replace(/[/?#].*$/, '').slice(0, 60)
}

/**
 * 示例清单：一键添加后可以逐条改。句柄无法在离线状态下逐个核验，
 * 配置好桥/令牌后哪个取不到会直接显示在「渠道」页，按需删掉换掉即可。
 */
export const SOCIAL_TEMPLATE = [
  { platform: 'x', handle: 'BYDCompany', name: 'BYD 官方', lang: 'en', region: '全球' },
  { platform: 'x', handle: 'CnEVPost', name: 'CnEVPost', lang: 'en', region: '全球' },
  { platform: 'x', handle: 'XPengMotors', name: '小鹏官方', lang: 'en', region: '全球' },
  { platform: 'x', handle: 'NIOGlobal', name: '蔚来全球', lang: 'en', region: '全球' },
  { platform: 'x', handle: 'CheryGlobal', name: '奇瑞全球', lang: 'en', region: '全球' },
  { platform: 'x', handle: 'GWMGlobal', name: '长城全球', lang: 'en', region: '全球' },
  { platform: 'facebook', handle: 'BYD', name: 'BYD Facebook', lang: 'en', region: '全球' },
  { platform: 'facebook', handle: 'Chery', name: 'Chery Facebook', lang: 'en', region: '全球' },
  { platform: 'facebook', handle: 'GWMGlobal', name: 'GWM Facebook', lang: 'en', region: '全球' },
  { platform: 'threads', handle: 'bydcompany', name: 'BYD Threads', lang: 'en', region: '全球' },
]

const UA =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36'

function withTimeout(signal, ms) {
  const timeout = AbortSignal.timeout(ms)
  return signal ? AbortSignal.any([signal, timeout]) : timeout
}

/**
 * 通过自建桥取一个账号的 RSS。
 * @param {{base: string, platform: 'x'|'facebook'|'threads', handle: string, signal?: AbortSignal, timeoutMs?: number}} request
 * @returns {Promise<Array<object>>}
 */
export async function fetchBridgeFeed({ base, platform, handle, signal, timeoutMs = 15000 }) {
  const platformMeta = PLATFORMS[platform]
  if (!platformMeta) throw new Error(`不支持的平台：${platform}`)
  const cleanHandle = normalizeHandle(handle)
  if (!cleanHandle) throw new Error('句柄为空')
  const root = String(base || '').trim().replace(/\/+$/, '')
  if (!/^https?:\/\//i.test(root)) throw new Error('桥接地址必须是 http(s) 链接')
  const url = `${root}${platformMeta.route(cleanHandle)}`
  const response = await fetch(url, {
    headers: {
      'user-agent': UA,
      accept: 'application/rss+xml, application/atom+xml, application/xml, text/xml, */*',
    },
    redirect: 'follow',
    signal: withTimeout(signal, timeoutMs),
  })
  if (!response.ok) throw new Error(`HTTP ${response.status}`)
  const xml = await response.text()
  const items = parseFeedItems(xml, {
    name: `${platformMeta.label} · ${cleanHandle}`,
    lang: 'en',
    region: '',
  })
  return items
}

/**
 * X 官方 API v2：recent search。支持两种用法：
 * - 账号：handle 直接给用户名 → `from:xxx -is:retweet`
 * - 关键词：handle 写成 `q:BYD Brazil` → 原样作为查询
 * @param {{bearer: string, handle: string, maxResults?: number, signal?: AbortSignal, timeoutMs?: number}} request
 */
export async function fetchXRecent({ bearer, handle, maxResults = 25, signal, timeoutMs = 15000 }) {
  const token = String(bearer || '').trim()
  if (!token) throw new Error('缺少 X Bearer token')
  const raw = String(handle || '').trim()
  const query = raw.startsWith('q:')
    ? `${raw.slice(2).trim()} -is:retweet`
    : `from:${normalizeHandle(raw)} -is:retweet`
  if (!query || query.length < 4) throw new Error('查询为空')

  const url = new URL('https://api.twitter.com/2/tweets/search/recent')
  url.searchParams.set('query', query)
  url.searchParams.set('max_results', String(Math.max(10, Math.min(100, maxResults))))
  url.searchParams.set('tweet.fields', 'created_at,lang,author_id')
  url.searchParams.set('expansions', 'author_id')
  url.searchParams.set('user.fields', 'username,name')

  const response = await fetch(url, {
    headers: { authorization: `Bearer ${token}`, 'user-agent': UA },
    signal: withTimeout(signal, timeoutMs),
  })
  if (response.status === 401 || response.status === 403) throw new Error('X 令牌无效或无权限（HTTP ' + response.status + '）')
  if (response.status === 429) throw new Error('X 接口限流（HTTP 429），稍后重试')
  if (!response.ok) throw new Error(`HTTP ${response.status}`)
  const body = await response.json()
  const users = new Map((body?.includes?.users || []).map((user) => [user.id, user]))
  return (body?.data || []).map((tweet) => {
    const user = users.get(tweet.author_id)
    const username = user?.username || 'i'
    return {
      title: String(tweet.text || '').replace(/\s+/g, ' ').trim().slice(0, 160),
      link: `https://x.com/${username}/status/${tweet.id}`,
      source: `X · ${user?.name || username}`,
      lang: tweet.lang || 'en',
      publishedAt: tweet.created_at || null,
      publishedIso: tweet.created_at || null,
      snippet: String(tweet.text || '').replace(/\s+/g, ' ').trim().slice(0, 400),
      via: 'social',
      query,
    }
  })
}

// 车相关 + 出海业务语境（经销商、上市、价格、出口、工厂…）：品牌号发的业务贴也算数。
const AUTO_POST = /(\bcar\b|\bcars\b|\bauto\b|\bautos\b|\bvehicle|\bsuv|\bEV\b|\bBEV\b|\bPHEV\b|\btruck|\bsedan|\bmpv|\bpickup\b|\bcrossover\b|\bdealer|\bdealership|\bshowroom|\bmarket\b|\bexport|\bplant\b|\bfactory\b|\blaunch|\bpriced?\b|汽车|车型|新能源|电动车|整车|车企|上市|交付|出口|建厂|经销|门店|خودرو|خودروساز|سيارة|سيارات|وكيل|автомобил|машин|дилер|voiture|véhicule|concessionnaire|coche|concesionario|carro|concessionária|otomobil|bayi|รถ|ô tô|mobil|자동차|自動車)/i

/** 社交帖文里没有"车"的（节日祝福、招聘、抽奖）不进雷达。 */
export function isAutoPost(text) {
  return AUTO_POST.test(String(text || ''))
}

/** 把社交条目规整成雷达条目的形状。 */
export function normalizeSocialItem(item, channel) {
  const text = String(item.title || item.snippet || '').replace(/\s+/g, ' ').trim()
  if (!text) return null
  const published = item.publishedIso || item.publishedAt
  const stamp = published && Number.isFinite(Date.parse(published)) ? new Date(published).toISOString() : null
  const platformLabel = PLATFORMS[channel.platform]?.label || channel.platform
  return {
    title: text.slice(0, 180),
    titleZh: '',
    source: item.source || `${platformLabel} · ${channel.handle}`,
    lang: channel.lang || item.lang || 'en',
    region: channel.region || '',
    publishedAt: stamp,
    link: item.link,
    snippet: String(item.snippet || text).slice(0, 400),
    via: 'social',
    topics: detectTopics(`${text} ${item.snippet || ''}`),
  }
}
