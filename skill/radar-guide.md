---
name: china-auto-overseas-radar
description: 中国汽车出海新闻雷达：多语种多渠道采集出海新闻，按主题整理成带来源链接的定期简报；也提供信息源清单与查漏方法。
---

# 中国汽车出海雷达

用 `auto_export_radar` 拿到多语种、多渠道的原始条目，再做归类、核对、写简报。工具只负责“捞全 + 去重 + 均衡语种 + 补中文标题”，判断和成稿是你的工作。

左侧栏的「中国汽车出海雷达」面板跑的是同一套采集逻辑（后台每 20 分钟一轮，标题已翻成中文）。面板还能在侧边直接读正文、标已读/收藏、加自己的 RSS 源（支持 OPML）。用户问“最近有什么”时可以直接读面板语气给结论，需要更细的核对再用工具抓一轮原文。

## 1. 先抓一轮

```
auto_export_radar({ hours: 72, limit: 40 })
auto_export_radar({ hours: 24, langs: ['zh','en','ar'], query: '沙特' })
auto_export_radar({ mode: 'feeds', hours: 168, limit: 25 })
auto_export_radar({ langs: ['ja','ko'], query: '中国車 輸出' })
```

- 日常简报：`hours: 24`；周报：`hours: 168`；某个市场专查：加 `query`（英文关键词更通用，如 `Saudi Arabia`、`Brazil plant`、`KD assembly`）。
- 返回里 `sources` 标了每个渠道的健康状态。`ok:false` 的渠道要在简报里说明“该渠道本期不可用”，不要当成“没有新闻”。
- `items[].titleZh` 是自动翻译的中文标题（缺失时为空字符串），写简报可以直接用；对外引用品牌、车型、数字时以 `title` 原文为准。
- 只有标题和链接，没有正文。需要细节时按链接用 `web_fetch` 打开原文；打开失败（付费墙/反爬）就换同题的其他语种条目交叉验证。

## 2. 渠道分层（工具已覆盖的 + 必须手工补的）

**面板还有 14 个官方信源**（欧盟、USTR、俄工贸部、欧亚经济委员会、哈萨克斯坦工贸部、土耳其贸易部、巴西 MDIC、摩洛哥海关、埃及 GOEIC、印度 DGFT、泰国海关、日本经产省、南非 ITAC、中国商务部），按列表页 + 关键词抓公告。这些只进面板、不进 `auto_export_radar` 工具；需要官方原文时用 `web_fetch` 打开面板里的链接。伊朗官方站点（irica.ir / mimt.gov.ir / rrk.ir）从常见海外网络连不上，伊朗政策暂时靠 IRNA / ISNA / Mehr / Donya 覆盖，或让用户在面板里自填可访问的官方地址。

**工具内已接**：15 个语种 / 26 个 Google News 本地版（中文、英/全球、日、韩、德、阿语 5 个市场：沙特/阿联酋/埃及/摩洛哥/科威特、波斯语、法语 3 个：法国/摩洛哥/科特迪瓦、俄语 4 个：俄罗斯/哈萨克斯坦/乌兹别克斯坦/白俄罗斯、西语 3 个：墨西哥/西班牙/智利、葡语、泰语、越南语、印尼语、土耳其语）+ 56 个 RSS（英文垂类 CarNewsChina/CnEVPost/Electrek/InsideEVs/Electrive/Nikkei/Paultan；阿语 ArabGT/Assayyarat/Almuraba/Cairo24/Sky News عربية/الجزيرة/CNN عربية；俄语 Kolesa/5 колесо/Ведомости·авто/Lenta/NaAvtotrasse/Zamin.uz；波斯语 Pedal/Zoomit/Digiato/دنیای اقتصاد/ایسنا/عصر خودرو/اقتصاد آنلاین/خبرآنلاین/همشهری/مهر/ایرنا/ایلنا/عصر ایران/تابناک/مشرق/تجارت نیوز/گجت نیوز/تک رسا；法语 Automobile Propre/Le Blog Auto/Auto Plus/Auto Moto/Journal Auto/Motors Actu/FrAndroid；另有 Motor.es、Quatro Rodas、Headlight Mag、Autonetmagz、Detik、VnExpress、Thanh Nien、Yonhap、Arab News）。

波斯语提醒：Google News 的波斯语索引很弱，伊朗本地 RSS 才是主力；伊朗媒体关于中国车的日更量本身不大（10–30 条属正常）。俄语要看的不止俄罗斯——哈萨克斯坦/乌兹别克斯坦/白俄罗斯的本地报道往往比俄本土更早披露建厂与 KD 项目。

**工具外需要手工补的口径**（`web_search` 或 `web_fetch` 直取）：

| 需要什么 | 去哪儿 |
|---|---|
| 中国官方口径 | 商务部（出口管制/贸易救济）、海关总署月度汽车出口数据、中汽协 CAAM、乘联会 CPCA |
| 政策原文 | 欧盟委员会（反补贴调查、关税）、美国 USTR/IRA、土耳其、巴西、墨西哥、印度、东盟各国工贸部 |
| 目标市场一手媒体 | 阿语：ArabGT、Masrawy、Al Arabiya；俄语：Kolesa、Autonews、Autoreview；西语：Motor.es、Autocosmos、El Economista Motor；葡语：Quatro Rodas、AutoIndústria；泰语：Headlight Mag、Bangkok Post Motoring；印尼：Autonetmagz、Oto.detik；越南：VnExpress 汽车频道 |
| 经销商与终端动向 | 当地品牌官网新闻页、经销商集团公告、车展官方新闻稿 |
| 航运与物流 | 滚装船运力、港口拥堵（配合海运信息工作台 skill） |
| 同行与研报 | MarkLines、JATO Dynamics、S&P Global Mobility、AlixPartners、中金/中信汽车组 |

**社交平台（X / Facebook / Threads）**：面板可以接，但需要用户在「设置 → 社交源」配自建 RSSHub 桥或 X API 令牌；没配置时这些渠道不产出内容。写简报前先看面板「渠道 → 社交源」是不是「已接」，不要默认社交口径已覆盖。

**微信公众号文章**：`web_fetch` 常常只拿到“环境异常”验证页。改用带移动端 UA 的 curl 落盘再解析正文（已验证可用）：

```sh
curl -sSL -m 30 -A "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1" "<链接>" -o /tmp/wx.html
```
标题在 `<h1 id="activity-name">`，正文在 `<div id="js_content">`，公众号名在 `var nickname`，发布时间是 `var ct`（Unix 秒）。

## 3. 归类口径

每条落进一个主题，报告按主题分组：

- **对外投资/建厂**：整车厂、KD/CKD/SKD 组装线、合资、工业区落地
- **贸易政策**：关税、反补贴、配额、认证壁垒、原产地规则
- **出口与物流**：出口量、滚装船、口岸、专列
- **销量与份额**：目标市场上牌量、市占、增速
- **渠道与经销**：总代签约、门店、售后网络
- **产品与认证**：新车型投放、碰撞测试、法规认证
- **供应链**：电池、零部件本地化、配套产业园

## 4. 简报模板

先一句话结论，再分组列出，最后给待跟踪清单。每条必须有：日期、来源、原文链接；二手转述要标注“转述”。

```
# 中国汽车出海日报 YYYY-MM-DD

**一句话**：<本期最值得注意的一件事>

## 本期要点（3–5 条）
- **<主题>**：<事实 + 数字 + 影响判断>（来源，日期，链接）

## 分主题动态
### 对外投资 / 建厂
- …
### 贸易政策
- …

## 待跟踪
- <需要下一步确认的事，写清找谁确认>

## 渠道健康
- 异常：<渠道>(<错误>)；未覆盖：<说明>
```

## 5. 红线

- 数字必须能指回链接；查不到就写“未查到”，并说明查过哪些渠道。
- 区分**官宣 / 媒体报道 / 行业传闻**，传闻不得写成事实。
- 同一事件多语种报道冲突时，以目标市场本地官方或一手信源为准，并在简报里写明冲突。
- 不要把中国媒体对海外市场的转述，当成海外市场的一手信息。
