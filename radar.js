/**
 * 中国汽车出海雷达 —— 纯数据层：多语种 / 多渠道新闻采集、过滤、去重、排序。
 * 不依赖任何 DSH 运行时，可单独用 node 跑通后再被插件 index.js 引用。
 */

const UA =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36';

const GOOGLE_NEWS = 'https://news.google.com/rss/search';
const CONCURRENCY = 6;
const PER_SOURCE_TIMEOUT_MS = 15000;

/** 语种 → 面板上的语言标签；真正的采集单元是下面的 EDITIONS。 */
export const LOCALES = {
  zh: { label: '中文', region: '中国' },
  en: { label: 'English', region: 'Global' },
  ja: { label: '日本語', region: '日本' },
  ko: { label: '한국어', region: '韩国' },
  de: { label: 'Deutsch', region: '德语区' },
  fr: { label: 'Français', region: '法语区' },
  ar: { label: 'العربية', region: '阿语区' },
  fa: { label: 'فارسی', region: '伊朗/波斯语区' },
  es: { label: 'Español', region: '西语区' },
  pt: { label: 'Português', region: '葡语区' },
  ru: { label: 'Русский', region: '俄语区' },
  th: { label: 'ไทย', region: '泰国' },
  vi: { label: 'Tiếng Việt', region: '越南' },
  id: { label: 'Indonesia', region: '印尼' },
  tr: { label: 'Türkçe', region: '土耳其' },
};

/**
 * Google News 本地版：一条 = 一个「市场 × 语言」。query 用该语言里中国车出海的说法，
 * 同一个语种在多个国家各跑一条（阿语 5、俄语 4、法语 3），因为各国关注的市场不同。
 */
export const EDITIONS = [
  { lang: 'zh', region: '中国', hl: 'zh-CN', gl: 'CN', ceid: 'CN:zh-Hans', queries: ['中国汽车 出口', '中国车企 海外 建厂', '自主品牌 出海 销量'] },
  { lang: 'en', region: 'Global', hl: 'en-US', gl: 'US', ceid: 'US:en', queries: ['Chinese car exports', 'Chinese EV plant overseas'] },
  { lang: 'ja', region: '日本', hl: 'ja', gl: 'JP', ceid: 'JP:ja', queries: ['中国車 輸出', '中国自動車 海外工場'] },
  { lang: 'ko', region: '韩国', hl: 'ko', gl: 'KR', ceid: 'KR:ko', queries: ['중국 자동차 수출', '중국 전기차 해외 공장'] },
  { lang: 'de', region: '德国', hl: 'de', gl: 'DE', ceid: 'DE:de', queries: ['chinesische Autos Export', 'China Auto Werk Europa'] },

  // 阿语：沙特 / 阿联酋 / 埃及 / 摩洛哥 / 科威特 分别看
  { lang: 'ar', region: '沙特', hl: 'ar', gl: 'SA', ceid: 'SA:ar', queries: ['السيارات الصينية'] },
  { lang: 'ar', region: '阿联酋', hl: 'ar', gl: 'AE', ceid: 'AE:ar', queries: ['سيارات صينية الإمارات'] },
  { lang: 'ar', region: '埃及', hl: 'ar', gl: 'EG', ceid: 'EG:ar', queries: ['تصدير السيارات الصينية'] },
  { lang: 'ar', region: '摩洛哥', hl: 'ar', gl: 'MA', ceid: 'MA:ar', queries: ['السيارات الصينية المغرب'] },
  { lang: 'ar', region: '科威特', hl: 'ar', gl: 'KW', ceid: 'KW:ar', queries: ['السيارات الصينية الكويت'] },

  // 波斯语：Google News 的波斯语覆盖很弱（实测个位数），伊朗本地的 RSS 才是主力，见 FEEDS
  { lang: 'fa', region: '伊朗', hl: 'fa', gl: 'IR', ceid: 'IR:fa', queries: ['خودرو چین'] },

  // 法语：法国本土 + 摩洛哥 + 科特迪瓦（西非法语区）
  { lang: 'fr', region: '法国', hl: 'fr', gl: 'FR', ceid: 'FR:fr', queries: ['voitures chinoises export'] },
  { lang: 'fr', region: '摩洛哥', hl: 'fr', gl: 'MA', ceid: 'MA:fr', queries: ['voitures chinoises Maroc'] },
  { lang: 'fr', region: '科特迪瓦', hl: 'fr', gl: 'CI', ceid: 'CI:fr', queries: ['voitures chinoises Côte d Ivoire'] },

  // 俄语：俄罗斯 + 哈萨克斯坦 + 乌兹别克斯坦 + 白俄罗斯（都是中国车的主销市场）
  { lang: 'ru', region: '俄罗斯', hl: 'ru', gl: 'RU', ceid: 'RU:ru', queries: ['китайские автомобили экспорт'] },
  { lang: 'ru', region: '哈萨克斯坦', hl: 'ru', gl: 'KZ', ceid: 'KZ:ru', queries: ['китайские автомобили Казахстан'] },
  { lang: 'ru', region: '乌兹别克斯坦', hl: 'ru', gl: 'UZ', ceid: 'UZ:ru', queries: ['китайские автомобили Узбекистан'] },
  { lang: 'ru', region: '白俄罗斯', hl: 'ru', gl: 'BY', ceid: 'BY:ru', queries: ['китайские автомобили Беларусь'] },

  { lang: 'es', region: '墨西哥', hl: 'es-419', gl: 'MX', ceid: 'MX:es-419', queries: ['autos chinos exportación'] },
  { lang: 'es', region: '西班牙', hl: 'es', gl: 'ES', ceid: 'ES:es', queries: ['coches chinos España'] },
  { lang: 'es', region: '智利', hl: 'es', gl: 'CL', ceid: 'CL:es', queries: ['autos chinos Chile'] },
  { lang: 'pt', region: '巴西', hl: 'pt-BR', gl: 'BR', ceid: 'BR:pt-419', queries: ['carros chineses exportação'] },
  { lang: 'th', region: '泰国', hl: 'th', gl: 'TH', ceid: 'TH:th', queries: ['รถยนต์จีน ส่งออก'] },
  { lang: 'vi', region: '越南', hl: 'vi', gl: 'VN', ceid: 'VN:vi', queries: ['xe Trung Quốc xuất khẩu'] },
  { lang: 'id', region: '印尼', hl: 'id', gl: 'ID', ceid: 'ID:id', queries: ['mobil China ekspor'] },
  { lang: 'tr', region: '土耳其', hl: 'tr', gl: 'TR', ceid: 'TR:tr', queries: ['Çin otomobil ihracat'] },
];

/** 已实测可用的行业垂类 RSS：补充深度稿与一手信源（Google News 之外的第二层渠道）。 */
export const FEEDS = [
  // 英文 / 全球
  { name: 'CarNewsChina', url: 'https://carnewschina.com/feed/', lang: 'en', region: 'Global' },
  { name: 'CnEVPost', url: 'https://cnevpost.com/feed/', lang: 'en', region: 'Global' },
  { name: 'Automotive World', url: 'https://www.automotiveworld.com/feed/', lang: 'en', region: 'Global' },
  { name: 'electric-vehicles.com', url: 'https://eletric-vehicles.com/feed/', lang: 'en', region: 'Global' },
  { name: 'InsideEVs', url: 'https://insideevs.com/rss/articles/all/', lang: 'en', region: 'Global' },
  { name: 'Electrek', url: 'https://electrek.co/feed/', lang: 'en', region: 'Global' },
  { name: 'Electrive', url: 'https://www.electrive.com/feed/', lang: 'en', region: '德国/欧洲' },
  { name: 'Nikkei Asia', url: 'https://asia.nikkei.com/rss/feed/nar', lang: 'en', region: '亚洲' },
  { name: 'Paultan.org', url: 'https://www.paultan.org/feed/', lang: 'en', region: '东南亚' },
  // 阿语：垂直门户 + 埃及 / 沙特 / 海湾
  { name: 'ArabGT', url: 'https://arabgt.com/feed/', lang: 'ar', region: '中东' },
  { name: 'Assayyarat', url: 'https://www.assayyarat.com/rss', lang: 'ar', region: '阿语区' },
  { name: 'Almuraba', url: 'https://www.almuraba.net/feed', lang: 'ar', region: '沙特' },
  { name: 'Cairo24 汽车', url: 'https://www.cairo24.com/rss.aspx?section=14', lang: 'ar', region: '埃及' },
  { name: 'Sky News عربية', url: 'https://www.skynewsarabia.com/rss', lang: 'ar', region: '海湾' },
  { name: 'الجزيرة اقتصاد', url: 'https://www.aljazeera.net/aljazeerarss/a7c186be-1baa-4bd4-9d80-a84db769f779', lang: 'ar', region: '阿语区' },
  { name: 'CNN عربية', url: 'https://arabic.cnn.com/rss', lang: 'ar', region: '阿语区' },
  { name: 'Arab News', url: 'https://www.arabnews.com/rss.xml', lang: 'en', region: '沙特' },
  // 俄语：汽车垂直 + 商业日报汽车版 + 快讯
  { name: 'Kolesa.ru', url: 'https://www.kolesa.ru/rss', lang: 'ru', region: '俄罗斯' },
  { name: '5 колесо', url: 'https://5koleso.ru/feed/', lang: 'ru', region: '俄罗斯' },
  { name: 'Ведомости · авто', url: 'https://www.vedomosti.ru/rss/rubric/auto', lang: 'ru', region: '俄罗斯' },
  { name: 'Lenta.ru', url: 'https://lenta.ru/rss/news', lang: 'ru', region: '俄罗斯' },
  { name: 'NaAvtotrasse', url: 'https://naavtotrasse.ru/rss', lang: 'ru', region: '俄罗斯' },
  { name: 'Zamin.uz', url: 'https://zamin.uz/rss', lang: 'ru', region: '乌兹别克斯坦' },
  // 波斯语：伊朗本地汽车/科技/经济媒体（Google News 波斯语覆盖极弱，这里是主力）
  { name: 'Pedal.ir', url: 'https://www.pedal.ir/feed', lang: 'fa', region: '伊朗' },
  { name: 'Zoomit', url: 'https://www.zoomit.ir/feed/', lang: 'fa', region: '伊朗' },
  { name: 'Digiato', url: 'https://digiato.com/feed', lang: 'fa', region: '伊朗' },
  { name: 'دنیای اقتصاد', url: 'https://donya-e-eqtesad.com/feed', lang: 'fa', region: '伊朗' },
  { name: 'ایسنا', url: 'https://www.isna.ir/rss', lang: 'fa', region: '伊朗' },
  { name: 'عصر خودرو', url: 'https://www.asrekhodro.com/feed', lang: 'fa', region: '伊朗' },
  { name: 'اقتصاد آنلاین', url: 'https://www.eghtesadonline.com/rss', lang: 'fa', region: '伊朗' },
  { name: 'خبرآنلاین', url: 'https://www.khabaronline.ir/rss', lang: 'fa', region: '伊朗' },
  { name: 'همشهری', url: 'https://www.hamshahrionline.ir/rss', lang: 'fa', region: '伊朗' },
  { name: 'مهر', url: 'https://www.mehrnews.com/rss', lang: 'fa', region: '伊朗' },
  // 法语：电动车垂直 + 门户 + 行业 B2B + 北非/西非
  { name: 'Automobile Propre', url: 'https://www.automobile-propre.com/feed/', lang: 'fr', region: '法国' },
  { name: 'Le Blog Auto', url: 'https://www.leblogauto.com/feed/', lang: 'fr', region: '法国' },
  { name: 'Auto Plus', url: 'https://www.autoplus.fr/feed/', lang: 'fr', region: '法国' },
  { name: 'Auto Moto', url: 'https://www.auto-moto.com/feed/', lang: 'fr', region: '法国' },
  { name: 'Journal Auto', url: 'https://www.journalauto.com/rss', lang: 'fr', region: '法国' },
  { name: 'Motors Actu', url: 'https://www.motorsactu.com/feed/', lang: 'fr', region: '摩洛哥/北非' },
  { name: 'FrAndroid', url: 'https://www.frandroid.com/feed', lang: 'fr', region: '法国' },
  // 西语 / 葡语 / 东南亚
  { name: 'Motor.es', url: 'https://www.motor.es/feed/', lang: 'es', region: '西班牙' },
  { name: 'Quatro Rodas', url: 'https://quatrorodas.abril.com.br/feed/', lang: 'pt', region: '巴西' },
  { name: 'Headlight Mag', url: 'https://www.headlightmag.com/feed/', lang: 'th', region: '泰国' },
  { name: 'Autonetmagz', url: 'https://autonetmagz.com/feed/', lang: 'id', region: '印尼' },
  { name: 'Detik Oto', url: 'https://oto.detik.com/rss', lang: 'id', region: '印尼' },
  { name: 'VnExpress 汽车', url: 'https://vnexpress.net/rss/oto-xe-may.rss', lang: 'vi', region: '越南' },
  { name: 'Thanh Nien 汽车', url: 'https://thanhnien.vn/rss/xe.rss', lang: 'vi', region: '越南' },
  { name: 'Yonhap 产业', url: 'https://www.yna.co.kr/rss/industry.xml', lang: 'ko', region: '韩国' },
];

/** 中国品牌 / 中国车相关词：多语种写法，用于判定“这条是不是中国车出海相关”。 */
export const BRAND_TERMS = [
  'byd', 'chery', 'chirey', 'omoda', 'jaecoo', 'exeed', 'jetour', 'geely', 'zeekr', 'lynk', 'great wall', 'gwm',
  'haval', 'tank', 'ora', 'wey', 'changan', 'deepal', 'avatr', 'saic', 'mg motor', 'rowe', 'maxus',
  'nio', 'xpeng', 'leapmotor', 'li auto', 'hongqi', 'dongfeng', 'voyah', 'gac', 'aion', 'aito', 'seres',
  'wuling', 'baojun', 'xiaomi', 'yangwang', 'denza', 'faw', 'jac', 'skywell',
  '比亚迪', '奇瑞', '欧萌达', '捷途', '星途', '吉利', '极氪', '领克', '长城', '哈弗', '坦克', '欧拉',
  '长安', '深蓝', '阿维塔', '上汽', '名爵', '荣威', '大通', '蔚来', '小鹏', '理想', '零跑', '红旗',
  '东风', '岚图', '广汽', '埃安', '问界', '赛力斯', '五菱', '宝骏', '小米', '腾势', '一汽', '江淮',
  // 阿语（含常见拼写变体）
  'بي واي دي', 'تشيري', 'شيري', 'جيلي', 'تشانغآن', 'إم جي', 'هافال', 'دونغ فينغ', 'جيتور', 'أومودا',
  'جايكو', 'چيري', 'شانجان', 'جي إم سي',
  // 波斯语
  'بی وای دی', 'چری', 'شری', 'جیلی', 'ام جی', 'هاوال', 'جیتور', 'اومودا', 'جایکو', 'چانگان', 'دانگ فنگ',
  'تیگو', 'فونیکس', 'لایو', 'امویام', 'هایما', 'کیامسی', 'ریوس',
  // 俄语
  'черри', 'чери', 'джили', 'хавал', 'чанъань', 'бид', 'джетур', 'омода', 'джайку', 'эксид', 'чанган',
];

/** 机动车语境词：标题和摘要里没有任何“车”的条目（芯片管制、能源存储、别国出口统计）不算这个雷达的内容。 */
export const AUTO_TERMS = [
  'car', 'cars', 'auto', 'autos', 'automotive', 'automaker', 'vehicle', 'vehicles', 'suv', 'pickup', 'truck',
  'ev', 'evs', 'bev', 'phev', 'suv', 'suvs', 'sedan', 'sedans', 'mpv', 'crossover',
  '汽车', '车企', '乘用车', '商用车', '新能源车', '电动车', '整车', '车型', '轿车',
  '自動車', '車', '자동차', '자동차', 'auto', 'fahrzeug', 'voiture', 'automobile', 'véhicule',
  'سيارة', 'سيارات', 'coche', 'automóvil', 'vehículo', 'carro', 'automóvel', 'veículo',
  'автомобил', 'машин', 'รถ', 'ô tô', 'xe hơi', 'mobil', 'otomobil', 'araç',
  'خودرو', 'ماشین', 'خودروساز', 'مركبة', 'سيارات كهربائية',
  'verkauf', 'händler',
];

/** 出海主题词（分语种），用于判定“这条属于出海叙事”并打主题标签。 */
const TOPIC_TERMS = {
  zh: ['出口', '出海', '海外', '建厂', '工厂', '组装', '关税', '反补贴', '销量', '市占', '经销', '渠道', '认证', '本地化', '国产车', '乘用车', '零部件', '滚装船', '海外市场'],
  en: ['export', 'overseas', 'plant', 'factory', 'assembly', 'assemble', 'tariff', 'duty', 'sales', 'market share', 'dealer', 'distributor', 'localis', 'localiz', 'homologation', 'shipping', 'ro-ro', 'foreign market'],
  ar: ['تصدير', 'مصنع', 'تجميع', 'رسوم', 'مبيعات', 'السوق', 'وكيل', 'استيراد'],
  es: ['exportación', 'exportaciones', 'planta', 'ensamblaje', 'ensambladora', 'arancel', 'ventas', 'mercado', 'concesionario', 'importación'],
  pt: ['exportação', 'fábrica', 'montagem', 'tarifa', 'imposto', 'vendas', 'mercado', 'concessionária', 'importação'],
  ru: ['экспорт', 'завод', 'сборка', 'пошлина', 'продажи', 'рынок', 'дилер', 'импорт'],
  th: ['ส่งออก', 'โรงงาน', 'ประกอบ', 'ภาษี', 'ยอดขาย', 'ตลาด', 'นำเข้า'],
  vi: ['xuất khẩu', 'nhà máy', 'lắp ráp', 'thuế', 'doanh số', 'thị trường', 'nhập khẩu'],
  id: ['ekspor', 'pabrik', 'perakitan', 'tarif', 'penjualan', 'pasar', 'impor'],
  tr: ['ihracat', 'fabrika', 'montaj', 'gümrük', 'satış', 'pazar', 'ithalat'],
  fr: ['exportation', 'usine', 'assemblage', 'droits de douane', 'tarif', 'ventes', 'marché', 'concessionnaire', 'importation', 'localisation', 'homologation', 'livraisons'],
  fa: ['صادرات', 'واردات', 'کارخانه', 'مونتاژ', 'تعرفه', 'گمرک', 'فروش', 'بازار', 'نمایندگی', 'قیمت', 'عرضه', 'تولید'],
  ja: ['輸出', '工場', '現地生産', '組立', '関税', '販売', '市場', 'ディーラー', '認証', '輸入', '出荷'],
  ko: ['수출', '공장', '현지생산', '조립', '관세', '판매', '시장', '딜러', '인증', '수입', '출하'],
  de: ['export', 'werk', 'montage', 'zoll', 'verkauf', 'markt', 'händler', 'zulassung', 'import', 'auslieferung'],
};

/** 主题分类（用于给每条新闻打标签，报告里按主题聚合）。 */
const TOPIC_RULES = [
  { topic: '关税与政策', re: /tariff|duty|anti-?subsid|probe|investigation|regulation|ban|quota|关税|反补贴|调查|政策|禁令|配额|пошлин|arancel|tarifa|رسوم|تعرفه|گمرک|douane|droits de|zoll|관세|関税|ภาษี|thuế|tarif/i },
  { topic: '海外建厂/KD', re: /plant|factory|assembly|assemble|CKD|SKD|manufactur|建厂|工厂|组装|散件|本地化生产|生产基地|завод|сборк|planta|fábrica|montagem|مصنع|تجميع|کارخانه|مونتاژ|usine|montage|werk|공장|工場|โรงงาน|nhà máy|pabrik|fabrika/i },
  { topic: '销量与份额', re: /sales|deliveries|market share|registrations|销量|交付|市占|份额|продаж|ventas|vendas|فروش|verkauf|판매|販売|ยอดขาย|doanh số|penjualan|satış|مبيعات/i },
  { topic: '渠道与经销', re: /dealer|distributor|showroom|retail|network|经销|渠道|门店|代理|дилер|concesionario|concessionária|وكيل|نمایندگی|concessionnaire|händler|딜러|販売店/i },
  { topic: '出口与物流', re: /export|shipment|ro-?ro|vessel|port|出口|出海|滚装|港口|航运|экспорт|exportación|exportação|صادرات|exportation|ausfuhr|ส่งออก|xuất khẩu|ekspor|ihracat|تصدير/i },
  { topic: '产品与认证', re: /launch|unveil|model|homologation|certification|crash test|发布|上市|认证|碰撞|新车|нулев|modelo|lançamento|طراز|طراز|عرضه|homologu|zulassung|인증|認証|เปิดตัว|ra mắt/i },
];

/* ------------------------------------------------------------------ */
/* 工具函数                                                            */
/* ------------------------------------------------------------------ */

function decodeEntities(s) {
  return s
    .replace(/&#(\d+);/g, (_, d) => String.fromCharCode(Number(d)))
    .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCharCode(parseInt(h, 16)))
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&');
}

function stripTags(s) {
  return decodeEntities(String(s || '').replace(/<[^>]*>/g, ' ')).replace(/\s+/g, ' ').trim();
}

function pick(block, tag) {
  const m = block.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`, 'i'));
  if (!m) return '';
  const raw = m[1].trim();
  const cdata = raw.match(/^<!\[CDATA\[([\s\S]*?)\]\]>$/);
  return cdata ? cdata[1].trim() : raw;
}

function normTitle(s) {
  return s.toLowerCase().replace(/[^\p{L}\p{N}]+/gu, ' ').trim();
}

function parseDate(s) {
  if (!s) return null;
  const t = Date.parse(s);
  return Number.isFinite(t) ? t : null;
}

export function detectTopics(text) {
  const hits = [];
  for (const rule of TOPIC_RULES) if (rule.re.test(text)) hits.push(rule.topic);
  return hits;
}

const isLatinTerm = (term) => /^[\x00-\x7F]+$/.test(term);
const escapeTerm = (term) => term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const AUTO_LATIN = AUTO_TERMS.filter(isLatinTerm).map((term) => (
  term.length <= 3
    // car / ev / suv：必须整词，避免命中 cargo、every
    ? new RegExp(`(^|[^a-z0-9])${escapeTerm(term)}([^a-z0-9]|$)`, 'i')
    // voiture / vehicle：允许单复数等后缀
    : new RegExp(`(^|[^a-z0-9])${escapeTerm(term)}[a-z0-9]*`, 'i')
));
const AUTO_OTHER = AUTO_TERMS.filter((term) => !isLatinTerm(term));

/** 拉丁词按词边界判，避免 car 命中 cargo、ev 命中 every；其他文字直接包含判断。 */
function hasAutoWord(text) {
  if (AUTO_OTHER.some((term) => text.includes(term))) return true;
  return AUTO_LATIN.some((re) => re.test(text));
}

function countMatches(text, terms) {
  let n = 0;
  for (const term of terms) if (text.includes(term)) n += 1;
  return n;
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/** 一次性抓取文本；429/5xx 时退避重试，新闻订阅偶发限流不该被记成渠道故障。 */
async function fetchText(url, timeoutMs, attempts = 1) {
  let lastError;
  for (let attempt = 0; attempt < attempts; attempt += 1) {
    try {
      const res = await fetch(url, {
        headers: { 'user-agent': UA, accept: 'application/rss+xml, application/xml, text/xml, */*' },
        redirect: 'follow',
        signal: AbortSignal.timeout(timeoutMs),
      });
      if (res.ok) return await res.text();
      lastError = new Error(`HTTP ${res.status}`);
      if (res.status !== 429 && res.status < 500) throw lastError;
    } catch (error) {
      lastError = error;
      if (attempt === attempts - 1) throw error;
    }
    await sleep(900 + attempt * 1200);
  }
  throw lastError ?? new Error('fetch failed');
}

async function mapLimit(items, limit, worker) {
  const out = new Array(items.length);
  let cursor = 0;
  const runners = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (cursor < items.length) {
      const index = cursor;
      cursor += 1;
      out[index] = await worker(items[index], index);
    }
  });
  await Promise.all(runners);
  return out;
}

/* ------------------------------------------------------------------ */
/* 采集                                                                */
/* ------------------------------------------------------------------ */

function googleNewsUrl(locale, query) {
  const u = new URL(GOOGLE_NEWS);
  u.searchParams.set('q', query);
  u.searchParams.set('hl', locale.hl);
  u.searchParams.set('gl', locale.gl);
  u.searchParams.set('ceid', locale.ceid);
  return u.toString();
}

function parseGoogleItems(xml, lang, query) {
  const items = [];
  for (const chunk of xml.split(/<item>/i).slice(1)) {
    const title = stripTags(pick(chunk, 'title'));
    const link = pick(chunk, 'link');
    if (!title || !link) continue;
    const sourceName = stripTags(pick(chunk, 'source')) || 'Google News';
    const published = parseDate(pick(chunk, 'pubDate'));
    items.push({
      title,
      link,
      source: sourceName,
      lang,
      publishedAt: published,
      publishedIso: published ? new Date(published).toISOString() : null,
      via: 'google-news',
      query,
    });
  }
  return items;
}

export function parseFeedItems(xml, feed) {
  const items = [];
  const isAtom = /<entry[\s>]/i.test(xml);
  const chunks = isAtom ? xml.split(/<entry[\s>]/i).slice(1) : xml.split(/<item[\s>]/i).slice(1);
  for (const chunk of chunks) {
    const title = stripTags(pick(chunk, 'title'));
    if (!title) continue;
    let link = pick(chunk, 'link');
    if (!link) {
      const m = chunk.match(/<link[^>]*href="([^"]+)"/i);
      if (m) link = m[1];
    }
    if (!link) continue;
    const published =
      parseDate(pick(chunk, 'pubDate')) ||
      parseDate(pick(chunk, 'published')) ||
      parseDate(pick(chunk, 'updated')) ||
      parseDate(pick(chunk, 'dc:date'));
    const desc = stripTags(pick(chunk, 'description') || pick(chunk, 'summary')).slice(0, 240);
    items.push({
      title,
      link,
      source: feed.name,
      lang: feed.lang,
      publishedAt: published,
      publishedIso: published ? new Date(published).toISOString() : null,
      via: 'feed',
      snippet: desc,
    });
  }
  return items;
}

/**
 * 采集并整理新闻。
 * @param {object} options
 * @param {number} [options.hours] 时间窗口（小时），默认 72
 * @param {number} [options.limit] 返回条数上限，默认 40
 * @param {string[]} [options.langs] 语种，默认 ['zh','en','ar','es','ru']；传 ['all'] 表示全部
 * @param {string} [options.query] 追加的自定义查询（会用每个语种分别跑一遍）
 * @param {string[]} [options.sources] 指定只跑某些来源名（与 FEEDS 名称匹配），默认全部
 * @param {Array<{name:string,url:string,lang:string,region?:string}>} [options.feeds] 额外/替换的 RSS 源（自定义订阅）
 * @param {'all'|'news'|'feeds'} [options.mode] 渠道模式，默认 'all'
 * @param {AbortSignal} [options.signal]
 */
export async function collect(options = {}) {
  const hours = Number.isFinite(options.hours) ? Math.max(0, options.hours) : 72;
  const limit = Number.isFinite(options.limit) ? Math.max(1, Math.min(200, options.limit)) : 40;
  const mode = options.mode === 'news' || options.mode === 'feeds' ? options.mode : 'all';
  const signal = options.signal;

  let langs = Array.isArray(options.langs) && options.langs.length ? options.langs : ['zh', 'en', 'ar', 'es', 'ru'];
  if (langs.includes('all')) langs = Object.keys(LOCALES);
  langs = langs.filter((l) => LOCALES[l]);
  if (!langs.length) langs = ['zh', 'en'];

  const extraQuery = typeof options.query === 'string' ? options.query.trim() : '';
  const requestedSources = Array.isArray(options.sources) && options.sources.length
    ? options.sources.map((s) => String(s).toLowerCase())
    : null;

  const jobs = [];

  if (mode !== 'feeds') {
    for (const edition of EDITIONS) {
      if (!langs.includes(edition.lang)) continue;
      const label = LOCALES[edition.lang]?.label ?? edition.lang;
      const queries = [...edition.queries, ...(extraQuery ? [extraQuery] : [])];
      for (const query of queries) {
        jobs.push({
          kind: 'google',
          lang: edition.lang,
          query,
          name: `Google News · ${label} · ${edition.region}`,
          run: async () => {
            const xml = await fetchText(googleNewsUrl(edition, query), PER_SOURCE_TIMEOUT_MS, 2);
            return parseGoogleItems(xml, edition.lang, query).map((it) => ({ ...it, region: edition.region }));
          },
        });
      }
    }
  }

  const feedList = Array.isArray(options.feeds) && options.feeds.length
    ? options.feeds.filter((feed) => feed && typeof feed.url === 'string' && /^https?:\/\//i.test(feed.url))
    : FEEDS;

  if (mode !== 'news') {
    for (const feed of feedList) {
      if (requestedSources && !requestedSources.some((s) => feed.name.toLowerCase().includes(s))) continue;
      if (!langs.includes(feed.lang) && !requestedSources) continue;
      jobs.push({
        kind: 'feed',
        lang: feed.lang,
        name: feed.name,
        run: async () => {
          const xml = await fetchText(feed.url, PER_SOURCE_TIMEOUT_MS);
          return parseFeedItems(xml, feed).map((it) => ({ ...it, region: feed.region }));
        },
      });
    }
  }

  const statuses = new Map();
  const runJob = async (job) => {
    if (signal?.aborted) return [];
    const key = job.name;
    if (!statuses.has(key)) statuses.set(key, { name: key, ok: true, items: 0, error: null, lang: job.lang });
    const status = statuses.get(key);
    try {
      const items = await job.run();
      status.items += items.length;
      return items;
    } catch (error) {
      status.ok = false;
      status.error = error?.message ? String(error.message) : String(error);
      return [];
    }
  };

  // Google News 单独一波、并发更低：一次并发 20+ 个本地版会触发 429。
  const googleRaw = await mapLimit(jobs.filter((job) => job.kind === 'google'), 4, runJob);
  const feedRaw = await mapLimit(jobs.filter((job) => job.kind !== 'google'), CONCURRENCY, runJob);
  const raw = [...googleRaw, ...feedRaw];

  const now = Date.now();
  const cutoff = hours > 0 ? now - hours * 3600 * 1000 : 0;
  const topicTermsFor = (lang) => TOPIC_TERMS[lang] || TOPIC_TERMS.en;
  const seenTitles = new Set();
  const seenLinks = new Set();
  const merged = [];

  for (const item of raw.flat()) {
    const haystack = `${item.title} ${item.snippet || ''}`.toLowerCase();
    const brandHits = countMatches(haystack, BRAND_TERMS);
    const topicHits = countMatches(haystack, topicTermsFor(item.lang));
    const isChinaSignal = /china|chinese|中国|중국|китай|chino|chinês|الصين|چین|چینی|จีน|trung quốc|cina|çin/i.test(haystack);

    // 必须确实是机动车话题；然后二选一：
    // ① 标题/摘要里出现中国品牌（品牌新闻本身就是有效信号）；
    // ② 有「中国」信号 + 出海主题词（关税、建厂、出口、销量…）。
    // 这样既能收到「奇瑞在约旦组装」这类一手报道，也不会把芯片管制、能源存储混进来。
    const autoHit = hasAutoWord(haystack);
    const keep = autoHit && (brandHits > 0 || (isChinaSignal && topicHits > 0));
    if (!keep) continue;

    if (item.publishedAt && item.publishedAt < cutoff) continue;

    const keyTitle = normTitle(item.title).slice(0, 90);
    if (keyTitle && seenTitles.has(keyTitle)) continue;
    const keyLink = String(item.link).split('?')[0];
    if (seenLinks.has(keyLink)) continue;
    seenTitles.add(keyTitle);
    seenLinks.add(keyLink);

    const score =
      brandHits * 3 +
      Math.min(topicHits, 4) +
      (item.via === 'feed' ? 1.5 : 0) +
      (item.publishedAt ? Math.max(0, 2 - (now - item.publishedAt) / (72 * 3600 * 1000)) : 0);

    merged.push({
      title: item.title,
      source: item.source,
      lang: item.lang,
      region: item.region || '',
      publishedAt: item.publishedIso,
      link: item.link,
      snippet: item.snippet || '',
      via: item.via,
      topics: detectTopics(haystack),
      score,
    });
  }

  merged.sort((a, b) => {
    const ta = a.publishedAt ? Date.parse(a.publishedAt) : 0;
    const tb = b.publishedAt ? Date.parse(b.publishedAt) : 0;
    return b.score - a.score || tb - ta;
  });

  // 多语种均衡：按各语种最高分排序后轮转取件，避免某一语种的垂类源把结果刷满。
  const byLang = new Map();
  for (const item of merged) {
    if (!byLang.has(item.lang)) byLang.set(item.lang, []);
    byLang.get(item.lang).push(item);
  }
  const langOrder = [...byLang.keys()].sort((a, b) => byLang.get(b)[0].score - byLang.get(a)[0].score);
  const picked = [];
  let added = true;
  while (picked.length < limit && added) {
    added = false;
    for (const lang of langOrder) {
      const bucket = byLang.get(lang);
      if (bucket.length && picked.length < limit) {
        picked.push(bucket.shift());
        added = true;
      }
    }
  }

  const items = picked.map(({ score, ...rest }) => rest);

  return {
    generatedAt: new Date(now).toISOString(),
    windowHours: hours,
    langs,
    mode,
    collected: merged.length,
    count: items.length,
    items,
    sources: [...statuses.values()].sort((a, b) => Number(b.ok) - Number(a.ok) || b.items - a.items),
  };
}
