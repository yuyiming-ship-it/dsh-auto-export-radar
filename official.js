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
const MAX_TITLE = 400
const DISPLAY_TITLE = 180

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

/**
 * 进口规则入口：用户给的各国海关 / 法规 / 公报 / 申报页面。
 * 这些页面是查询与办事入口，没有 RSS，也没有"新闻列表"可抓，所以只作为一键入口展示，不进信息流。
 * 想盯某一页的更新，用面板里的「添加官方页面」把它加成采集源。
 */
export const OFFICIAL_REFS = [
  // 伊朗
  { id: 'ir-qavanin', name: '伊朗法规库', region: '伊朗', kind: '法规', url: 'https://qavanin.ir/' },
  { id: 'ir-dotic', name: '伊朗工矿贸易部', region: '伊朗', kind: '规则', url: 'https://dotic.ir/' },
  { id: 'ir-rrk', name: '伊朗官方公报', region: '伊朗', kind: '公报', url: 'https://rrk.ir/' },
  { id: 'ir-ntsw', name: '伊朗综合贸易系统', region: '伊朗', kind: '申报', url: 'https://www.ntsw.ir/' },
  { id: 'ir-saleauto', name: '伊朗 Saleauto 车源', region: '伊朗', kind: '行情', url: 'https://janbazan.saleauto.ir/cars', note: '在售车源与价格，不是政策源' },
  // 中亚 / 欧亚
  { id: 'kz-kgd', name: '哈萨克斯坦国家收入委员会', region: '哈萨克斯坦', kind: '清关', url: 'https://kgd.gov.kz/' },
  { id: 'kg-customs', name: '吉尔吉斯海关', region: '吉尔吉斯斯坦', kind: '清关', url: 'https://customs.gov.kg/' },
  { id: 'eaeu-docs', name: '欧亚经济联盟文件库', region: '欧亚联盟', kind: '法规', url: 'https://docs.eaeunion.org/' },
  { id: 'uz-lex', name: '乌兹别克法规库', region: '乌兹别克斯坦', kind: '法规', url: 'https://lex.uz/' },
  { id: 'uz-customs', name: '乌兹别克海关申报', region: '乌兹别克斯坦', kind: '申报', url: 'https://sw2.customs.uz/' },
  // 高加索
  { id: 'ge-carclearance', name: '格鲁吉亚车辆清关计算', region: '格鲁吉亚', kind: '税费', url: 'https://www.rs.ge/CarClearance?tab=1' },
  { id: 'ge-matsne', name: '格鲁吉亚立法公报', region: '格鲁吉亚', kind: '法规', url: 'https://matsne.gov.ge/' },
  { id: 'az-customs', name: '阿塞拜疆海关 · 车辆进口', region: '阿塞拜疆', kind: '清关', url: 'https://customs.gov.az/az/ferdler-ucun/avtomobillerin-getirilmesi/' },
  { id: 'am-exim', name: '亚美尼亚进出口平台 · 运输', region: '亚美尼亚', kind: '清关', url: 'https://exim.src.am/transport' },
  // 俄罗斯
  { id: 'ru-pravo', name: '俄联邦法令公布', region: '俄罗斯', kind: '公报', url: 'https://publication.pravo.gov.ru/' },
  { id: 'ru-customs', name: '俄联邦海关', region: '俄罗斯', kind: '清关', url: 'https://customs.gov.ru/' },
  // 中东
  { id: 'sa-zatca-vehicle', name: '沙特海关 · 个人进口车辆', region: '沙特', kind: '清关', url: 'https://zatca.gov.sa/en/RulesRegulations/Taxes/Pages/customs-individual/import-vehicles.aspx' },
  { id: 'ae-dubai-customs', name: '迪拜海关', region: '阿联酋', kind: '清关', url: 'https://www.dubaicustoms.gov.ae/' },
  { id: 'ae-moiat-used', name: '阿联酋 MOIAT · 二手进口车状态证明', region: '阿联酋', kind: '认证', url: 'https://www.moiat.gov.ae/en/services/issue-product-status-statement-for-used-imported-vehicles' },
  { id: 'tr-import-regime', name: '土耳其进口制度 FAQ', region: '土耳其', kind: '规则', url: 'https://www.trade.gov.tr/customs-formalities/frequently-asked-questions/import-regime' },
  // 北非
  { id: 'dz-joradp', name: '阿尔及利亚官方公报', region: '阿尔及利亚', kind: '公报', url: 'https://www.joradp.dz/' },
  { id: 'dz-douane', name: '阿尔及利亚海关', region: '阿尔及利亚', kind: '清关', url: 'https://www.douane.gov.dz/' },
  { id: 'ma-adil', name: '摩洛哥海关 ADIL 关税计算', region: '摩洛哥', kind: '税费', url: 'https://www.douane.gov.ma/adil/' },
  { id: 'ma-mcv', name: '摩洛哥海关 MCV 车辆税则', region: '摩洛哥', kind: '税费', url: 'https://www.douane.gov.ma/mcv/' },
  // 非洲其他
  { id: 'ke-kra', name: '肯尼亚税务局', region: '肯尼亚', kind: '清关', url: 'https://www.kra.go.ke/' },
  { id: 'ke-kebs', name: '肯尼亚标准局 KEBS', region: '肯尼亚', kind: '认证', url: 'https://www.kebs.org/' },
  { id: 'za-used-vehicle', name: '南非 · 二手车进口', region: '南非', kind: '规则', url: 'https://www.gov.za/services/services-organisations/import/importing-second-hand-or-used-vehicle' },
  // 拉美
  { id: 'br-siscomex', name: '巴西 Siscomex 进口', region: '巴西', kind: '申报', url: 'https://www.gov.br/siscomex/pt-br/informacoes/importacao' },
  { id: 'ar-importar', name: '阿根廷 · 进口', region: '阿根廷', kind: '规则', url: 'https://www.argentina.gob.ar/node/471857' },
  { id: 'ar-boletin', name: '阿根廷官方公报', region: '阿根廷', kind: '公报', url: 'https://www.boletinoficial.gob.ar/' },
  { id: 'pe-sunat-vehicles', name: '秘鲁 SUNAT · 车辆进口', region: '秘鲁', kind: '清关', url: 'https://www.sunat.gob.pe/customsinformation/importofvehicles/index.html' },
  { id: 'pe-sunat-used', name: '秘鲁 SUNAT · 二手车进口规范', region: '秘鲁', kind: '规则', url: 'https://www.gob.pe/institucion/sunat/colecciones/678-normas-para-la-importacion-de-vehiculos-usados' },
  { id: 'co-dian', name: '哥伦比亚 DIAN 海关手续', region: '哥伦比亚', kind: '清关', url: 'https://www.dian.gov.co/tramitesservicios/tramites-y-servicios/Paginas/tramites-aduaneros.aspx' },
  { id: 'ec-aduana', name: '厄瓜多尔海关 · 进口指引', region: '厄瓜多尔', kind: '清关', url: 'https://www.aduana.gob.ec/servicio-al-ciudadano/para-importar/' },
]

/**
 * 增量监控源：公报站每天出新的法律文本，按「列表页 → 新链接」做增量。
 * 首次抓取只收 baseline 条（倒序最新），其余先记为已见，避免一上来刷屏。
 */
export const WATCH_SOURCES = [
  {
    id: 'ru-gov-acts',
    name: '俄罗斯政府法令',
    url: 'http://publication.pravo.gov.ru/documents/block/government',
    lang: 'ru',
    region: '俄罗斯',
    filter: 'авто|автомоб|транспорт|таможен|пошлин|утильсбор|ввоз',
    watch: true,
    baseline: 6,
    note: '该站 https 不可达，走 http；新增法令按标题关键词筛',
  },
  {
    id: 'ru-fts-acts',
    name: '俄罗斯部门法令（含海关）',
    url: 'http://publication.pravo.gov.ru/documents/block/federal_authorities',
    lang: 'ru',
    region: '俄罗斯',
    filter: 'авто|автомоб|транспорт|таможен|пошлин|утильсбор|ввоз',
    watch: true,
    baseline: 6,
    note: '海关署、工贸部等部门的命令与细则',
  },
  {
    id: 'ir-rrk',
    name: '伊朗官方公报',
    url: 'https://www.rrk.ir/',
    lang: 'fa',
    region: '伊朗',
    filter: 'خودرو|واردات|صادرات|تعرفه|گمرک|آیین',
    watch: true,
    baseline: 6,
    enabledByDefault: false,
    note: '本机网络连不上 rrk.ir（TCP 超时），到能访问伊朗站点的网络再启用',
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
    .replace(/<(nav|header|footer|aside)\b[\s\S]{0,4000}?<\/\1>/gi, ' ')
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
      title: title.length > DISPLAY_TITLE ? `${title.slice(0, DISPLAY_TITLE - 1)}…` : title,
      fullTitle: title,
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
