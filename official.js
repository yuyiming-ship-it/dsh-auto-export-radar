/**
 * 官方信源适配层：各部委 / 海关 / 公报的新闻与公告页。
 *
 * 这些站点几乎没有 RSS，所以这里用「列表页抓取」：取页面里的链接标题，
 * 按来源配置的关键词过滤（汽车、进口、关税…），只留标题像公告的条目。
 * 抓不到就明确报错，不伪装成"最近没有政策"。
 */

const UA =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36'

const MAX_BYTES = 3 * 1024 * 1024
const MAX_ITEMS = 24
/** 导航/静态页链接：FAQ、表单、关于我们这类不是公告，按 URL 和标题一起排掉。 */
const SKIP_LINK = /(\/faq|\/about|\/contact|\/privacy|\/terms|\/cookie|\/login|\/search|\/sitemap|\/glossary|\/subscribe|\/newsletter|\/forms?\/|\/download|\/tender|\/procurement|\/careers?|\/jobs?|\/accessibility|\/archive|faq\b|about us|contact us|privacy|terms of|glossary|cookie|sitemap|subscribe|newsletter|application forms?|tender|estimez|simulateur|calculateur|calculator|estimate your|simulator|duty calculator)/i
const MIN_TITLE = 14
const MAX_TITLE = 220

/** 官方信源清单：只放实测能打开、且关键词能筛出条目的站点。 */
export const OFFICIAL_SOURCES = [
  {
    id: 'eu-trade',
    name: 'EU 贸易总司',
    url: 'https://policy.trade.ec.europa.eu/news_en',
    lang: 'en',
    region: '欧盟',
    filter: 'vehicles?|automotive|electric vehicle|motor vehicle|car market|CO2|emissions',
  },
  {
    id: 'ustr',
    name: 'USTR 新闻稿',
    url: 'https://ustr.gov/about-us/policy-offices/press-office/press-releases',
    lang: 'en',
    region: '美国',
    filter: 'vehicles?|automotive|China.*(tariff|duties|Section 301)|Section 301',
  },
  {
    id: 'ru-minpromtorg',
    name: '俄工贸部',
    url: 'https://minpromtorg.gov.ru/',
    lang: 'ru',
    region: '俄罗斯',
    filter: 'авто|автомоб|утильсбор|транспортн',
  },
  {
    id: 'eec',
    name: '欧亚经济委员会',
    url: 'https://eec.eaeunion.org/',
    lang: 'ru',
    region: '欧亚联盟',
    filter: 'авто|автомоб|утильсбор|транспортн',
  },
  {
    id: 'kz-mti',
    name: '哈萨克斯坦工贸部',
    url: 'https://www.gov.kz/org/mti/press/news/1',
    lang: 'ru',
    region: '哈萨克斯坦',
    filter: 'авто|транспорт|импорт|экспорт|пошлин|квота|тариф',
  },
  {
    id: 'tr-trade',
    name: '土耳其贸易部',
    url: 'https://ticaret.gov.tr/',
    lang: 'tr',
    region: '土耳其',
    filter: 'otomobil|taşıt|otomotiv|ÖTV|ithal araç|araç ithal',
  },
  {
    id: 'br-mdic',
    name: '巴西 MDIC',
    url: 'https://www.gov.br/mdic/pt-br/assuntos/noticias',
    lang: 'pt',
    region: '巴西',
    filter: 'automóve|automove|veículo|carro|montadora|autopeça|pneu',
  },
  {
    id: 'ma-douane',
    name: '摩洛哥海关',
    url: 'https://www.douane.gov.ma/web/guest',
    lang: 'fr',
    region: '摩洛哥',
    filter: 'automobile|véhicule|importation|droit|taxe|tarif',
  },
  {
    id: 'eg-goeic',
    name: '埃及 GOEIC',
    url: 'https://www.goeic.gov.eg/',
    lang: 'ar',
    region: '埃及',
    filter: 'سيار|مركب|أوتو|جمارك السيارات',
  },
  {
    id: 'in-dgft',
    name: '印度 DGFT',
    url: 'https://www.dgft.gov.in/CP/',
    lang: 'en',
    region: '印度',
    filter: 'vehicle|automobile|motor vehicle|HS 8703',
  },
  {
    id: 'th-customs',
    name: '泰国海关',
    url: 'https://www.customs.go.th/',
    lang: 'th',
    region: '泰国',
    filter: 'รถยนต์|ยานยนต์|ภาษีรถ',
  },
  {
    id: 'jp-meti',
    name: '日本经济产业省',
    url: 'https://www.meti.go.jp/press/',
    lang: 'ja',
    region: '日本',
    filter: '自動車|輸出|輸入|関税|電気自動車|車',
  },
  {
    id: 'za-itac',
    name: '南非 ITAC',
    url: 'https://itac.org.za/',
    lang: 'en',
    region: '南非',
    filter: 'vehicle|automotive|motor|tariff|tyre|tyres',
  },
  {
    id: 'cn-mofcom',
    name: '中国商务部',
    url: 'http://www.mofcom.gov.cn/',
    lang: 'zh',
    region: '中国',
    filter: '汽车|整车|乘用车|汽车零部件|进口汽车|关税|反补贴|贸易救济',
  },
]

function decodeEntities(input) {
  return String(input)
    .replace(/&#(\d+);/g, (_, d) => String.fromCharCode(Number(d)))
    .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCharCode(parseInt(h, 16)))
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
}

function plainText(html) {
  return decodeEntities(String(html || '').replace(/<[^>]*>/g, ' '))
    .replace(/\s+/g, ' ')
    .trim()
}

function stripNoise(html) {
  return String(html)
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, ' ')
    .replace(/<svg[\s\S]*?<\/svg>/gi, ' ')
    .replace(/<nav[\s\S]*?<\/nav>/gi, ' ')
    .replace(/<header[\s\S]*?<\/header>/gi, ' ')
    .replace(/<footer[\s\S]*?<\/footer>/gi, ' ')
    .replace(/<aside[\s\S]*?<\/aside>/gi, ' ')
    .replace(/<!--[\s\S]*?-->/g, ' ')
}

function resolveLink(href, base) {
  try {
    const url = new URL(decodeEntities(href.trim()), base)
    if (!/^https?:$/.test(url.protocol)) return null
    url.hash = ''
    return url.toString()
  } catch {
    return null
  }
}

/**
 * 抓一个官方列表页，抽出标题像公告的链接。
 * @param {{url: string, filter?: string, name: string, lang: string, region?: string, signal?: AbortSignal, timeoutMs?: number}} source
 * @returns {Promise<Array<{title: string, link: string, source: string, lang: string, region: string, via: 'official'}>>}
 */
export async function fetchOfficialList(source, { signal, timeoutMs = 18000 } = {}) {
  const timeout = AbortSignal.timeout(timeoutMs)
  const combined = signal ? AbortSignal.any([signal, timeout]) : timeout
  const response = await fetch(source.url, {
    headers: {
      'user-agent': UA,
      accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      'accept-language': 'en-US,en;q=0.9,zh-CN;q=0.8,ru;q=0.7,ar;q=0.6,fa;q=0.6',
    },
    redirect: 'follow',
    signal: combined,
  })
  if (!response.ok) throw new Error(`HTTP ${response.status}`)
  const buffer = await response.arrayBuffer()
  if (buffer.byteLength > MAX_BYTES) throw new Error('页面太大，跳过')
  const html = new TextDecoder('utf-8', { fatal: false }).decode(buffer)
  const base = response.url || source.url
  const cleaned = stripNoise(html)
  let filter = null
  if (source.filter) {
    try {
      filter = new RegExp(source.filter, 'i')
    } catch {
      filter = null
    }
  }

  const seen = new Set()
  const items = []
  for (const match of cleaned.matchAll(/<a\s[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi)) {
    const link = resolveLink(match[1], base)
    if (!link || seen.has(link)) continue
    const title = plainText(match[2])
    if (title.length < MIN_TITLE || title.length > MAX_TITLE) continue
    if (SKIP_LINK.test(link) || SKIP_LINK.test(title)) continue
    if (filter && !filter.test(title)) continue
    seen.add(link)
    items.push({
      title,
      link,
      source: source.name,
      lang: source.lang || 'en',
      region: source.region || '',
      publishedAt: null,
      publishedIso: null,
      snippet: '',
      via: 'official',
    })
    if (items.length >= MAX_ITEMS) break
  }
  return items
}
