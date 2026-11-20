window.__ModuleLoader__.load({
  id: 'dsh-auto-export-radar',
  factory(require) {
    const React = require('react')
    const el = React.createElement

    const PANEL_ID = 'auto-export-radar'
    const NS = 'auto-export-radar'
    const API = (path) => new URL(`/auto-export-radar${path}`, window.location.href).toString()

    const ZH = {
      panel: '中国汽车出海雷达',
      subtitle: '多语种多渠道采集 · 自动翻成中文 · 定时刷新',
      live: '实时流',
      favorites: '收藏',
      channels: '渠道',
      settings: '设置',
      refresh: '立即刷新',
      refreshing: '正在抓取…',
      auto: '自动刷新',
      updated: '更新于 {time}',
      next: '下次 {time}',
      waiting: '等待第一次抓取',
      w24: '24 小时',
      w72: '3 天',
      w168: '7 天',
      allLangs: '全部语种',
      allTopics: '全部主题',
      search: '搜标题、来源、市场',
      unreadOnly: '仅未读',
      watchOnly: '我的关注',
      empty: '这个筛选条件下还没有条目',
      emptyHint: '换个时间窗口、语种或关键词，或者点「立即刷新」再抓一轮。',
      emptyFav: '还没有收藏。点条目右侧的星标，就能把它收在这里。',
      loading: '正在抓取多语种新闻…',
      loadFail: '加载失败：{error}',
      retry: '重试',
      copyDigest: '复制中文简报',
      copied: '已复制到剪贴板',
      health: '渠道健康',
      healthOk: '{ok}/{total} 正常',
      healthFail: '{n} 个渠道本轮异常',
      langDist: '语种分布',
      open: '打开原文',
      read: '在面板里读',
      untranslated: '待翻译',
      original: '原文',
      chinese: '中文',
      pool: '条目池 {n}',
      count: '{n} 条',
      unread: '{n} 未读',
      more: '加载更多（还有 {n} 条）',
      markAllRead: '全部标为已读',
      readState: '阅读状态',
      channelsNews: '多语种新闻订阅（Google News 本地版）',
      channelsFeeds: '订阅源（内置 + 你自己加的）',
      socialSources: '社交源（X / Facebook / Threads）',
      socialNotReady: '还没连。这三个平台没有免登录的公开读取通道，需要二选一：自建 RSSHub 桥，或填 X 官方 API 令牌。',
      socialBridgeReady: '已接自建桥：{base}',
      socialXReady: '已接 X 官方 API（令牌末四位 {hint}）',
      socialAdd: '添加社交账号',
      socialHandlePlaceholder: '@句柄，或 q:关键词（只对 X 生效）',
      socialNamePlaceholder: '备注名（可空）',
      socialTemplate: '添加示例模板',
      socialStatusOk: '{n} 条',
      socialStatusSkip: '待连接',
      socialNoChannels: '还没有社交账号。可以先加示例模板，再逐条改成你关注的账号。',
      socialTokenHint: '令牌只存在本机插件数据里，不回传界面、不写日志。桥地址推荐用自建的 RSSHub，Facebook / Threads 只能走它。',
      socialBridgeLabel: 'RSSHub 桥地址',
      socialBridgePlaceholder: 'http://127.0.0.1:1200',
      socialBearerLabel: 'X API Bearer token',
      socialSave: '保存连接',
      socialStored: '已保存',
      socialBadge: '社交',
      socialOn: '已启用',
      socialOff: '已停用',
      channelsManual: '面板不抓、建议用助手补的渠道',
      manualNote: '官方统计与政策原文（中汽协 CAAM、海关总署、欧盟委员会、各国工贸部、MarkLines/JATO 研报）没有稳定的公开 RSS，用会话里的检索更可靠。',
      onlyTitles: '面板只收标题、来源和链接，细节请点开正文或原文核对。',
      err: '接口异常',
      addFeed: '添加 RSS / Atom 源',
      feedUrl: '订阅源地址',
      feedName: '名称（可空）',
      add: '添加',
      remove: '删除',
      enabled: '启用',
      custom: '自定义',
      opmlImport: '导入 OPML',
      opmlExport: '导出 OPML',
      settingsRefresh: '后台采集间隔',
      settingsTranslate: '自动把标题翻成中文',
      settingsWatch: '我的关注词',
      watchPlaceholder: '加一个词，例如 沙特、巴西、奇瑞',
      watchHint: '命中的条目会在列表里标出来，也可以用「我的关注」一键筛。',
      clearReads: '清空已读记录',
      cleared: '已清空',
      saved: '已保存',
      readerLoading: '正在取正文…',
      readerFail: '取不到正文：{error}',
      readerOpen: '用浏览器打开',
      readerGoogle: '这条来自 Google News 聚合页，正文需要打开原站。',
      translateBody: '译成中文',
      translating: '正在翻译…',
      back: '返回列表',
      minute: '{n} 分钟',
      startHint: '打开就会自动抓第一轮，大约 10–20 秒。',
    }

    const EN = {
      panel: 'China auto export radar',
      subtitle: 'Multi-language, multi-channel, auto-translated, refreshed on a timer',
      live: 'Live feed',
      favorites: 'Saved',
      channels: 'Channels',
      settings: 'Settings',
      refresh: 'Refresh now',
      refreshing: 'Fetching…',
      auto: 'Auto refresh',
      updated: 'Updated {time}',
      next: 'Next {time}',
      waiting: 'Waiting for the first run',
      w24: '24 hours',
      w72: '3 days',
      w168: '7 days',
      allLangs: 'All languages',
      allTopics: 'All topics',
      search: 'Search title, source, market',
      unreadOnly: 'Unread only',
      watchOnly: 'Watched',
      empty: 'Nothing matches these filters yet',
      emptyHint: 'Try another window or language, or press Refresh now.',
      emptyFav: 'Nothing saved yet. Use the star on a row to keep it here.',
      loading: 'Collecting multi-language coverage…',
      loadFail: 'Could not load: {error}',
      retry: 'Retry',
      copyDigest: 'Copy Chinese digest',
      copied: 'Copied to clipboard',
      health: 'Channel health',
      healthOk: '{ok}/{total} responding',
      healthFail: '{n} channels failed this round',
      langDist: 'By language',
      open: 'Open original',
      read: 'Read here',
      untranslated: 'Pending translation',
      original: 'Original',
      chinese: 'Chinese',
      pool: '{n} items pooled',
      count: '{n} items',
      unread: '{n} unread',
      more: 'Load more ({n} left)',
      markAllRead: 'Mark all read',
      readState: 'Read state',
      channelsNews: 'Localized news editions (Google News)',
      channelsFeeds: 'Feeds (built in + yours)',
      socialSources: 'Social sources (X / Facebook / Threads)',
      socialNotReady: 'Not connected yet. None of these platforms allows anonymous server-side reading: either point the plugin at your own RSSHub bridge, or add an X API bearer token.',
      socialBridgeReady: 'Self-hosted bridge: {base}',
      socialXReady: 'X API connected (token ending {hint})',
      socialAdd: 'Add a social account',
      socialHandlePlaceholder: '@handle, or q:query (X only)',
      socialNamePlaceholder: 'Label (optional)',
      socialTemplate: 'Add the sample set',
      socialStatusOk: '{n} items',
      socialStatusSkip: 'Not connected',
      socialNoChannels: 'No social accounts yet. Add the sample set, then edit each row to the accounts you follow.',
      socialTokenHint: 'The token stays in local plugin data; it is never returned to the UI or written to logs. A self-hosted RSSHub bridge is the only path for Facebook and Threads.',
      socialBridgeLabel: 'RSSHub bridge URL',
      socialBridgePlaceholder: 'http://127.0.0.1:1200',
      socialBearerLabel: 'X API bearer token',
      socialSave: 'Save connection',
      socialStored: 'Saved',
      socialBadge: 'Social',
      socialOn: 'On',
      socialOff: 'Off',
      channelsManual: 'Not crawled here — check with the assistant',
      manualNote: 'Official statistics and policy texts (CAAM, GACC customs, European Commission, national trade ministries, MarkLines/JATO) have no stable public RSS. Use search in a session instead.',
      onlyTitles: 'This panel carries titles, sources and links only. Open the article before citing details.',
      err: 'Request failed',
      addFeed: 'Add an RSS / Atom feed',
      feedUrl: 'Feed URL',
      feedName: 'Name (optional)',
      add: 'Add',
      remove: 'Remove',
      enabled: 'Enabled',
      custom: 'Custom',
      opmlImport: 'Import OPML',
      opmlExport: 'Export OPML',
      settingsRefresh: 'Background interval',
      settingsTranslate: 'Translate headlines to Chinese',
      settingsWatch: 'Watch words',
      watchPlaceholder: 'Add a word, e.g. Saudi, Brazil, Chery',
      watchHint: 'Matching rows are flagged, and the Watched filter shows only them.',
      clearReads: 'Clear read history',
      cleared: 'Cleared',
      saved: 'Saved',
      readerLoading: 'Loading the article…',
      readerFail: 'Could not load: {error}',
      readerOpen: 'Open in browser',
      readerGoogle: 'This item comes from a Google News aggregation page; the article opens on the publisher site.',
      translateBody: 'Translate to Chinese',
      translating: 'Translating…',
      back: 'Back to list',
      minute: '{n} min',
      startHint: 'The first run starts on open and takes about 10–20 seconds.',
    }

    const LANGS = {
      zh: '中文', en: 'EN', ja: '日本語', ko: '한국어', de: 'DE', fr: 'FR', ar: 'العربية', fa: 'فارسی',
      es: 'ES', pt: 'PT', ru: 'RU', th: 'ไทย', vi: 'VI', id: 'ID', tr: 'TR',
    }
    const CODES = Object.keys(LANGS)
    const WINDOWS = [
      { id: 24, key: 'w24' },
      { id: 72, key: 'w72' },
      { id: 168, key: 'w168' },
    ]
    const PAGE_SIZE = 40
    const MANUAL_CHANNELS = [
      ['中国官方口径', '中汽协 CAAM、乘联会 CPCA、海关总署月度汽车出口数据、商务部贸易救济'],
      ['政策原文', '欧盟委员会（反补贴/关税）、美国 USTR 与 IRA、土耳其、巴西、墨西哥、印度、东盟各国工贸部'],
      ['市场调研', 'MarkLines、JATO Dynamics、S&P Global Mobility、AlixPartners、中金/中信汽车组'],
      ['物流与运力', '滚装船班期、港口拥堵（可配合海运信息工作台）'],
      ['微信公众号', '行业自媒体深扒；网页抓取需要移动端 UA，面板可直接读正文'],
    ]

    /* ------------------------------ 工具函数 ------------------------------ */

    const pad = (n) => String(n).padStart(2, '0')
    const clock = (value) => {
      const date = new Date(value)
      if (!Number.isFinite(date.getTime())) return '—'
      return `${pad(date.getHours())}:${pad(date.getMinutes())}`
    }
    const dayTime = (value) => {
      const date = new Date(value)
      if (!Number.isFinite(date.getTime())) return ''
      return `${date.getMonth() + 1}/${date.getDate()} ${pad(date.getHours())}:${pad(date.getMinutes())}`
    }
    const relTime = (value) => {
      const stamp = Date.parse(value)
      if (!Number.isFinite(stamp)) return '时间未知'
      const diff = Date.now() - stamp
      if (diff < 0) return '刚发布'
      const minutes = Math.round(diff / 60000)
      if (minutes < 2) return '刚刚'
      if (minutes < 60) return `${minutes} 分钟前`
      const hours = Math.round(minutes / 60)
      if (hours < 24) return `${hours} 小时前`
      const days = Math.round(hours / 24)
      if (days < 8) return `${days} 天前`
      return dayTime(value)
    }
    const fill = (text, vars = {}) => String(text).replace(/\{(\w+)\}/g, (_, key) => (key in vars ? String(vars[key]) : `{${key}}`))
    const stampOf = (item) => Date.parse(item.publishedAt || item.addedAt || 0) || 0
    const stripSource = (text, source) => {
      const value = String(text || '').trim()
      if (!value || !source) return value
      const tail = new RegExp(`[\\s\\-–—|·:：]+${String(source).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*$`)
      return value.replace(tail, '').trim() || value
    }
    const isGoogleLink = (url) => /^https?:\/\/news\.google\.com\//i.test(String(url || ''))
    const matchesWatch = (item, watchlist) => {
      if (!watchlist?.length) return false
      const haystack = `${item.title} ${item.titleZh || ''} ${item.source} ${item.region || ''}`.toLowerCase()
      return watchlist.some((term) => haystack.includes(String(term).toLowerCase()))
    }

    function icon(name, size) {
      const common = {
        width: size, height: size, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor',
        strokeWidth: 1.7, strokeLinecap: 'round', strokeLinejoin: 'round', 'aria-hidden': true, focusable: 'false',
      }
      const paths = {
        radar: [
          el('circle', { key: 'a', cx: 12, cy: 12, r: 8.5 }),
          el('circle', { key: 'b', cx: 12, cy: 12, r: 4.4 }),
          el('path', { key: 'c', d: 'M12 12 L18.2 6.6' }),
          el('circle', { key: 'd', cx: 12, cy: 12, r: 1.1, fill: 'currentColor', stroke: 'none' }),
        ],
        refresh: el('path', { key: 'a', d: 'M20 11a8 8 0 1 0-2.3 6.2M20 5.5V11h-5.4' }),
        copy: [
          el('rect', { key: 'a', x: 9, y: 9, width: 11, height: 11, rx: 2.4 }),
          el('path', { key: 'b', d: 'M6.5 15H5.6A1.6 1.6 0 0 1 4 13.4V5.6A1.6 1.6 0 0 1 5.6 4h7.8A1.6 1.6 0 0 1 15 5.6v.9' }),
        ],
        external: [
          el('path', { key: 'a', d: 'M14 4h6v6' }),
          el('path', { key: 'b', d: 'M20 4 11 13' }),
          el('path', { key: 'c', d: 'M18 14v4.6A1.4 1.4 0 0 1 16.6 20H5.4A1.4 1.4 0 0 1 4 18.6V7.4A1.4 1.4 0 0 1 5.4 6H10' }),
        ],
        star: el('path', { key: 'a', d: 'm12 4.6 2.3 4.7 5.2.8-3.8 3.6.9 5.1-4.6-2.4-4.6 2.4.9-5.1L4.5 10l5.2-.8z' }),
        book: [
          el('path', { key: 'a', d: 'M4 5.5A2.5 2.5 0 0 1 6.5 3H19v15H6.5A2.5 2.5 0 0 0 4 20.5z' }),
          el('path', { key: 'b', d: 'M8 7h7M8 11h5' }),
        ],
        gear: [
          el('circle', { key: 'a', cx: 12, cy: 12, r: 3 }),
          el('path', { key: 'b', d: 'M19.4 14.5a7.6 7.6 0 0 0 0-5l1.6-1.2-1.9-3.3-1.9.8a7.7 7.7 0 0 0-4.3-2.5L12.6 1h-3.8l-.3 2.3A7.7 7.7 0 0 0 4.2 5.8l-1.9-.8L.4 8.3l1.6 1.2a7.6 7.6 0 0 0 0 5L.4 15.7l1.9 3.3 1.9-.8a7.7 7.7 0 0 0 4.3 2.5l.3 2.3h3.8l.3-2.3a7.7 7.7 0 0 0 4.3-2.5l1.9.8 1.9-3.3z' }),
        ],
        plus: el('path', { key: 'a', d: 'M12 5v14M5 12h14' }),
        trash: [
          el('path', { key: 'a', d: 'M4 7h16M9.5 7V5.4A1.4 1.4 0 0 1 10.9 4h2.2a1.4 1.4 0 0 1 1.4 1.4V7' }),
          el('path', { key: 'b', d: 'M6.5 7l.8 11.6A1.5 1.5 0 0 0 8.8 20h6.4a1.5 1.5 0 0 0 1.5-1.4L17.5 7' }),
        ],
        close: el('path', { key: 'a', d: 'm6 6 12 12M18 6 6 18' }),
        back: el('path', { key: 'a', d: 'M14.5 5 8 12l6.5 7' }),
        search: [
          el('circle', { key: 'a', cx: 11, cy: 11, r: 6.4 }),
          el('path', { key: 'b', d: 'm16 16 4.2 4.2' }),
        ],
        upload: [
          el('path', { key: 'a', d: 'M12 16V4m0 0L7.5 8.5M12 4l4.5 4.5' }),
          el('path', { key: 'b', d: 'M4.5 15v3.5A1.5 1.5 0 0 0 6 20h12a1.5 1.5 0 0 0 1.5-1.5V15' }),
        ],
        download: [
          el('path', { key: 'a', d: 'M12 4v12m0 0 4.5-4.5M12 16l-4.5-4.5' }),
          el('path', { key: 'b', d: 'M4.5 15v3.5A1.5 1.5 0 0 0 6 20h12a1.5 1.5 0 0 0 1.5-1.5V15' }),
        ],
        alert: [
          el('path', { key: 'a', d: 'M12 4.5 21 19.5H3z' }),
          el('path', { key: 'b', d: 'M12 10v4.2M12 17.2v.1' }),
        ],
      }
      return el('svg', common, paths[name] || paths.radar)
    }

    function useTranslate(ctx) {
      const subscribe = React.useCallback((fn) => ctx.locale.subscribe(fn), [ctx])
      const snapshot = React.useCallback(() => ctx.locale.getSnapshot(), [ctx])
      React.useSyncExternalStore(subscribe, snapshot, snapshot)
      return ctx.locale.bind(NS)
    }

    /* ------------------------------ 数据 ------------------------------ */

    async function readJsonResponse(response) {
      let body = null
      try {
        body = await response.json()
      } catch (_error) {
        body = null
      }
      if (!response.ok) {
        const message = body?.error || `HTTP ${response.status}`
        throw new Error(message)
      }
      return body
    }

    function useRadar() {
      const [data, setData] = React.useState(null)
      const [error, setError] = React.useState(null)
      const [auto, setAuto] = React.useState(true)
      const [manualBusy, setManualBusy] = React.useState(false)
      const alive = React.useRef(true)

      const load = React.useCallback(async () => {
        try {
          const res = await fetch(API('/feed?hours=168&limit=300'), { headers: { accept: 'application/json' }, credentials: 'same-origin' })
          const body = await readJsonResponse(res)
          if (!alive.current) return
          setData(body)
          setError(null)
        } catch (err) {
          if (alive.current) setError(String(err?.message || err))
        }
      }, [])

      React.useEffect(() => {
        alive.current = true
        void load()
        return () => { alive.current = false }
      }, [load])

      const refreshing = Boolean(data?.refreshing)
      const emptyPool = !data || !data.poolSize

      React.useEffect(() => {
        if (!auto) return undefined
        const delay = error ? 60000 : manualBusy || refreshing || emptyPool ? 4000 : 60000
        const id = setTimeout(() => { void load() }, delay)
        return () => clearTimeout(id)
      }, [auto, manualBusy, refreshing, emptyPool, error, data, load])

      React.useEffect(() => {
        if (!auto) return undefined
        const onVisible = () => { if (document.visibilityState === 'visible') void load() }
        document.addEventListener('visibilitychange', onVisible)
        return () => document.removeEventListener('visibilitychange', onVisible)
      }, [auto, load])

      const refreshNow = React.useCallback(async () => {
        setManualBusy(true)
        try {
          await fetch(API('/refresh'), { method: 'POST', credentials: 'same-origin', headers: { accept: 'application/json' } })
        } catch (_error) {
          /* 失败原因会回到 feed.lastError */
        }
        await load()
        setManualBusy(false)
      }, [load])

      const patchItems = React.useCallback((keys, patch) => {
        const set = new Set(keys)
        setData((current) => (current ? { ...current, items: current.items.map((item) => (set.has(item.id) ? { ...item, ...patch } : item)) } : current))
      }, [])

      const markRead = React.useCallback(async (keys, read = true) => {
        if (!keys.length) return
        patchItems(keys, { read })
        setData((current) => (current ? { ...current, unreadCount: Math.max(0, (current.unreadCount || 0) + (read ? -keys.length : keys.length)) } : current))
        try {
          await fetch(API('/read'), {
            method: 'POST', credentials: 'same-origin',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify({ keys, read }),
          })
        } catch (_error) { /* 下一次拉取会纠正 */ }
      }, [patchItems])

      const markAllRead = React.useCallback(async (keys) => {
        if (!keys.length) return
        patchItems(keys, { read: true })
        setData((current) => (current ? { ...current, unreadCount: 0 } : current))
        try {
          await fetch(API('/read'), {
            method: 'POST', credentials: 'same-origin',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify({ keys, read: true }),
          })
        } catch (_error) { /* 同上 */ }
      }, [patchItems])

      const toggleFavorite = React.useCallback(async (item) => {
        const next = !item.favorite
        patchItems([item.id], { favorite: next })
        setData((current) => (current ? { ...current, favoriteCount: Math.max(0, (current.favoriteCount || 0) + (next ? 1 : -1)) } : current))
        try {
          await fetch(API('/favorite'), {
            method: 'POST', credentials: 'same-origin',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify({ keys: [item.id], favorite: next }),
          })
        } catch (_error) { /* 同上 */ }
      }, [patchItems])

      const markAllUnread = React.useCallback(async () => {
        setData((current) => (current
          ? { ...current, items: current.items.map((item) => ({ ...item, read: false })), unreadCount: current.items.length }
          : current))
        try {
          await fetch(API('/read'), {
            method: 'POST', credentials: 'same-origin',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify({ keys: [], read: false }),
          })
        } catch (_error) { /* 下一次拉取会纠正 */ }
      }, [])

      const saveSettings = React.useCallback(async (patch) => {
        const res = await fetch(API('/settings'), {
          method: 'POST', credentials: 'same-origin',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify(patch),
        })
        const body = await readJsonResponse(res)
        setData((current) => (current ? { ...current, settings: body.settings, watchlist: body.settings?.watchlist ?? current.watchlist, intervalMinutes: body.settings?.refreshMinutes ?? current.intervalMinutes } : current))
        return body
      }, [])

      const saveFeeds = React.useCallback(async (feeds) => {
        const res = await fetch(API('/feeds'), {
          method: 'POST', credentials: 'same-origin',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ feeds }),
        })
        const body = await readJsonResponse(res)
        setData((current) => (current ? { ...current, customFeeds: body.customFeeds, refreshing: true } : current))
        return body
      }, [])

      const saveSocial = React.useCallback(async (channels) => {
        const res = await fetch(API('/social'), {
          method: 'POST', credentials: 'same-origin',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ channels }),
        })
        const body = await readJsonResponse(res)
        setData((current) => (current ? { ...current, social: { ...(current.social || {}), channels: body.socialChannels }, refreshing: true } : current))
        return body
      }, [])

      const saveSocialSettings = React.useCallback(async (patch) => {
        const res = await fetch(API('/social/settings'), {
          method: 'POST', credentials: 'same-origin',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify(patch),
        })
        const body = await readJsonResponse(res)
        setData((current) => (current?.social ? {
          ...current,
          social: { ...current.social, configured: body.configured, bridgeBase: body.bridgeBase, xBearerHint: body.xBearerHint },
          refreshing: true,
        } : current))
        return body
      }, [])

      return {
        data, setData, error, auto, setAuto, refreshNow, manualBusy, load,
        markRead, markAllRead, markAllUnread, toggleFavorite, saveSettings, saveFeeds,
        saveSocial, saveSocialSettings,
      }
    }

    /* ------------------------------ 组件 ------------------------------ */

    function Icon({ size = 16 }) {
      return icon('radar', size || 16)
    }

    function Tabs({ value, onChange, t, unread }) {
      const rows = [
        { id: 'feed', label: t('live') },
        { id: 'favorites', label: t('favorites') },
        { id: 'channels', label: t('channels') },
        { id: 'settings', label: t('settings') },
      ]
      return el('div', { className: 'aer-tabs', role: 'tablist', 'aria-label': t('panel') },
        rows.map((row) => el('button', {
          key: row.id, type: 'button', role: 'tab', 'aria-selected': value === row.id,
          className: value === row.id ? 'is-on' : '',
          onClick: () => onChange(row.id),
        }, row.label, row.id === 'feed' && unread ? el('span', { className: 'aer-tab-badge' }, unread > 99 ? '99+' : String(unread)) : null)))
    }

    function Chip({ active, onClick, children, title, className }) {
      return el('button', {
        type: 'button',
        className: [active ? 'aer-chip is-on' : 'aer-chip', className].filter(Boolean).join(' '),
        'aria-pressed': Boolean(active), title: title || undefined, onClick,
      }, children)
    }

    function IconButton({ name, label, onClick, className, disabled }) {
      return el('button', {
        type: 'button', className: ['aer-icon-btn', className].filter(Boolean).join(' '),
        title: label, 'aria-label': label, onClick, disabled,
      }, icon(name, 15))
    }

    function Header({ t, tabs, data, auto, setAuto, onRefresh, busy }) {
      const updated = data?.generatedAt ? clock(data.generatedAt) : null
      const next = data?.nextRefreshAt ? clock(data.nextRefreshAt) : null
      return el('header', { className: 'aer-head' },
        el('div', { className: 'aer-head-main' },
          el('span', { className: 'aer-mark' }, icon('radar', 20)),
          el('div', { className: 'aer-head-copy' },
            el('h1', null, t('panel')),
            el('p', null, t('subtitle')))),
        el('div', { className: 'aer-head-tools' },
          tabs,
          el('button', {
            type: 'button', className: busy ? 'aer-btn is-busy' : 'aer-btn', onClick: onRefresh,
            disabled: busy, title: t('refresh'),
          }, icon('refresh', 15), el('span', null, busy ? t('refreshing') : t('refresh'))),
          el('button', {
            type: 'button', className: auto ? 'aer-switch is-on' : 'aer-switch',
            role: 'switch', 'aria-checked': auto, title: t('auto'),
            onClick: () => setAuto(!auto),
          }, el('span', { className: 'aer-switch-dollar' }), el('span', null, t('auto')))),
        el('div', { className: 'aer-head-meta' },
          updated ? el('span', null, fill(t('updated'), { time: updated })) : el('span', null, t('waiting')),
          auto && next ? el('span', { className: 'aer-sep' }, '·') : null,
          auto && next ? el('span', null, fill(t('next'), { time: next })) : null,
          data ? el('span', { className: 'aer-sep' }, '·') : null,
          data ? el('span', null, fill(t('pool'), { n: data.poolSize })) : null,
          data ? el('span', { className: 'aer-sep' }, '·') : null,
          data ? el('span', { className: data.unreadCount ? 'is-ok' : '' }, fill(t('unread'), { n: data.unreadCount || 0 })) : null,
          data ? el('span', { className: 'aer-sep' }, '·') : null,
          data ? el('span', { className: data.channelHealth?.failed?.length ? 'is-warn' : 'is-ok' },
            data.channelHealth?.failed?.length
              ? fill(t('healthFail'), { n: data.channelHealth.failed.length })
              : fill(t('healthOk'), { ok: data.channelHealth?.ok ?? 0, total: data.channelHealth?.total ?? 0 })) : null))
    }

    function Toolbar({ t, hours, setHours, langs, setLangs, topic, setTopic, query, setQuery, data, unreadOnly, setUnreadOnly, watchOnly, setWatchOnly }) {
      const langChips = CODES.map((code) => {
        const count = data?.byLang?.[code] || 0
        const normal = langs.length === 0
        const active = normal || langs.includes(code)
        return el('button', {
          key: code, type: 'button', title: LANGS[code],
          className: active ? 'aer-chip is-on' : 'aer-chip',
          'aria-pressed': normal ? 'true' : String(active),
          onClick: () => {
            if (normal) return setLangs([code])
            const next = langs.includes(code) ? langs.filter((row) => row !== code) : [...langs, code]
            setLangs(next.length === CODES.length ? [] : next)
          },
        }, `${LANGS[code]}${count ? ` ${count}` : ''}`)
      })
      const topics = Object.entries(data?.byTopic || {})
        .sort((a, b) => b[1] - a[1])
        .slice(0, 6)
        .map(([name, count]) => el(Chip, {
          key: name, active: topic === name, title: name,
          onClick: () => setTopic(topic === name ? null : name),
        }, `${name} ${count}`))
      return el('div', { className: 'aer-toolbar' },
        el('div', { className: 'aer-tool-row' },
          el('div', { className: 'aer-seg', role: 'radiogroup', 'aria-label': t('live') },
            WINDOWS.map((row) => el('button', {
              key: row.id, type: 'button', role: 'radio', 'aria-checked': hours === row.id,
              className: hours === row.id ? 'is-on' : '', onClick: () => setHours(row.id),
            }, t(row.key)))),
          el('label', { className: 'aer-search' },
            icon('search', 14),
            el('input', {
              type: 'search', value: query, placeholder: t('search'),
              onChange: (event) => setQuery(event.target.value),
              'aria-label': t('search'),
            })),
          el(Chip, { active: unreadOnly, onClick: () => setUnreadOnly(!unreadOnly) }, t('unreadOnly')),
          data?.watchlist?.length ? el(Chip, { active: watchOnly, onClick: () => setWatchOnly(!watchOnly) }, t('watchOnly')) : null),
        el('div', { className: 'aer-tool-row is-wrap' },
          el(Chip, { active: langs.length === 0, onClick: () => setLangs([]) }, t('allLangs')),
          langChips),
        topics.length
          ? el('div', { className: 'aer-tool-row is-wrap' },
            el(Chip, { active: !topic, onClick: () => setTopic(null) }, t('allTopics')),
            topics)
          : null)
    }

    function Item({ item, t, onOpen, onFavorite, watched }) {
      const title = stripSource(item.titleZh || item.title, item.source)
      const original = stripSource(item.title, item.source)
      const showOriginal = Boolean(item.titleZh) && item.titleZh.trim() !== item.title.trim()
      return el('div', {
        className: `aer-item ${item.read ? 'is-read' : 'is-unread'}`,
        role: 'link', tabIndex: 0,
        'aria-label': `${t('read')}: ${title}`,
        onClick: () => onOpen(item),
        onKeyDown: (event) => {
          if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); onOpen(item) }
        },
      },
      el('div', { className: 'aer-item-top' },
        item.read ? el('span', { className: 'aer-unread is-read' }) : el('span', { className: 'aer-unread' }),
        el('span', { className: `aer-lang lang-${item.lang}` }, LANGS[item.lang] || item.lang),
        el('span', { className: 'aer-item-title' }, title),
        item.via === 'social' ? el('span', { className: 'aer-social-badge' }, t('socialBadge')) : null,
        watched ? el('span', { className: 'aer-watch' }, '★') : null,
        item.titleZh ? null : el('span', { className: 'aer-pending' }, t('untranslated')),
        el('button', {
          type: 'button', className: item.favorite ? 'aer-star is-on' : 'aer-star',
          title: item.favorite ? t('favorites') : t('favorites'),
          'aria-label': t('favorites'), 'aria-pressed': Boolean(item.favorite),
          onClick: (event) => { event.stopPropagation(); onFavorite(item) },
        }, icon('star', 15))),
      showOriginal ? el('p', { className: 'aer-item-orig' }, original) : null,
      el('div', { className: 'aer-item-meta' },
        el('span', { className: 'aer-src' }, item.source),
        item.region ? el('span', { className: 'aer-dot' }, '·') : null,
        item.region ? el('span', null, item.region) : null,
        el('span', { className: 'aer-dot' }, '·'),
        el('time', { dateTime: item.publishedAt || undefined }, relTime(item.publishedAt || item.addedAt)),
        (item.topics || []).slice(0, 2).map((tag) => el('span', { key: tag, className: 'aer-tag' }, tag)),
        el('a', {
          className: 'aer-open', href: item.link, target: '_blank', rel: 'noreferrer noopener',
          title: t('open'), 'aria-label': t('open'),
          onClick: (event) => event.stopPropagation(),
        }, icon(item.hasArticle === false ? 'external' : 'book', 13))))
    }

    function Reader({ t, state, onClose, onTranslate, onFavorite, translating }) {
      const item = state.item
      const article = state.article
      const paragraphs = article ? (state.view === 'zh' && article.zh?.paragraphs?.length ? article.zh.paragraphs : article.paragraphs) : []
      const canToggle = Boolean(article?.zh?.paragraphs?.length)
      const canTranslate = Boolean(article?.paragraphs?.length) && !article?.zh?.paragraphs?.length
      return el('aside', { className: 'aer-reader', 'aria-label': t('read') },
        el('header', { className: 'aer-reader-head' },
          el('button', { type: 'button', className: 'aer-icon-btn', onClick: onClose, title: t('back'), 'aria-label': t('back') }, icon('back', 16)),
          el('div', { className: 'aer-reader-titles' },
            el('h2', null, stripSource(item.titleZh || item.title, item.source)),
            item.titleZh && item.titleZh.trim() !== item.title.trim() ? el('p', null, stripSource(item.title, item.source)) : null),
          el('div', { className: 'aer-reader-tools' },
            canToggle
              ? el('div', { className: 'aer-seg is-small' },
                el('button', { type: 'button', className: state.view === 'zh' ? 'is-on' : '', onClick: () => onClose('view', 'zh') }, t('chinese')),
                el('button', { type: 'button', className: state.view === 'orig' ? 'is-on' : '', onClick: () => onClose('view', 'orig') }, t('original')))
              : null,
            el(IconButton, { name: 'star', label: t('favorites'), className: item.favorite ? 'is-on' : '', onClick: () => onFavorite(item) }),
            el('a', { className: 'aer-icon-btn', href: item.link, target: '_blank', rel: 'noreferrer noopener', title: t('open'), 'aria-label': t('open') }, icon('external', 15)))),
        el('div', { className: 'aer-reader-meta' },
          el('span', { className: `aer-lang lang-${item.lang}` }, LANGS[item.lang] || item.lang),
          el('span', null, article?.site || item.source),
          item.region ? el('span', { className: 'aer-dot' }, '·') : null,
          item.region ? el('span', null, item.region) : null,
          el('span', { className: 'aer-dot' }, '·'),
          el('span', null, relTime(item.publishedAt || item.addedAt)),
          article ? el('span', { className: 'aer-dot' }, '·') : null,
          article ? el('span', null, `${article.paragraphs.length} 段 · ${article.chars} 字符`) : null),
        canTranslate || state.translateError
          ? el('div', { className: 'aer-reader-actions' },
            canTranslate
              ? el('button', {
                type: 'button', className: 'aer-btn is-primary-outline', onClick: onTranslate, disabled: translating,
              }, icon('book', 14), el('span', null, translating ? t('translating') : t('translateBody')))
              : null,
            state.translateError ? el('span', { className: 'aer-translate-error' }, state.translateError) : null)
          : null,
        el('div', { className: 'aer-reader-body' },
          state.blocked
            ? el('div', { className: 'aer-state-block' },
              el('p', null, t('readerGoogle')),
              el('a', { className: 'aer-btn', href: item.link, target: '_blank', rel: 'noreferrer noopener' }, icon('external', 14), el('span', null, t('readerOpen'))))
            : state.error
            ? el('div', { className: 'aer-state-block is-error' },
              el('p', null, fill(t('readerFail'), { error: state.error })),
              item.hasArticle === false
                ? el('p', { className: 'aer-muted' }, t('readerGoogle'))
                : null,
              el('a', { className: 'aer-btn', href: item.link, target: '_blank', rel: 'noreferrer noopener' }, icon('external', 14), el('span', null, t('readerOpen'))))
            : state.loading
              ? el('div', { className: 'aer-state-block is-loading' },
                el('span', { className: 'aer-shimmer' }, t('readerLoading')),
                el('p', { className: 'aer-muted' }, t('onlyTitles')))
              : paragraphs.length
                ? el('div', { className: 'aer-article' },
                  paragraphs.map((text, index) => el('p', { key: index }, text)))
                : el('div', { className: 'aer-state-block' }, el('p', null, t('empty')))))
    }

    function SideRail({ t, data, visible, onCopy, copied, onMarkAll, hasUnread }) {
      if (!data) return null
      const langs = Object.entries(data.byLang || {}).sort((a, b) => b[1] - a[1])
      const total = langs.reduce((sum, row) => sum + row[1], 0) || 1
      const failed = data.channelHealth?.failed || []
      return el('aside', { className: 'aer-rail' },
        el('section', { className: 'aer-card' },
          el('h2', null, t('health')),
          el('p', { className: failed.length ? 'aer-health is-warn' : 'aer-health is-ok' },
            failed.length ? fill(t('healthFail'), { n: failed.length }) : fill(t('healthOk'), { ok: data.channelHealth?.ok ?? 0, total: data.channelHealth?.total ?? 0 })),
          failed.length
            ? el('ul', { className: 'aer-fails' }, failed.slice(0, 6).map((row) => el('li', { key: row.name },
              el('strong', null, row.name), row.error ? el('span', null, row.error) : null)))
            : null),
        el('section', { className: 'aer-card' },
          el('h2', null, t('langDist')),
          el('ul', { className: 'aer-bars' }, langs.map(([code, count]) => el('li', { key: code },
            el('span', { className: 'aer-bar-label' }, LANGS[code] || code),
            el('span', { className: 'aer-bar' }, el('i', { style: { width: `${Math.max(4, Math.round((count / total) * 100))}%` } })),
            el('span', { className: 'aer-bar-count' }, count))))),
        el('section', { className: 'aer-card' },
          el('div', { className: 'aer-card-head' },
            el('h2', null, t('live')),
            el('span', null, fill(t('count'), { n: visible }))),
          el('button', { type: 'button', className: 'aer-btn is-wide', onClick: onCopy }, icon('copy', 15), el('span', null, copied ? t('copied') : t('copyDigest'))),
          hasUnread ? el('button', { type: 'button', className: 'aer-btn is-wide is-quiet', onClick: onMarkAll }, t('markAllRead')) : null,
          el('p', { className: 'aer-note' }, t('onlyTitles'))))
    }

    function ChannelsView({ t, data, onSaveFeeds, onSaveSocial, onImport, importing, message }) {
      const news = data?.channels?.news || []
      const social = data?.social || {}
      const socialChannels = social.channels || []
      const [socialPlatform, setSocialPlatform] = React.useState('x')
      const [socialHandle, setSocialHandle] = React.useState('')
      const [socialName, setSocialName] = React.useState('')
      const [socialBusy, setSocialBusy] = React.useState(false)

      const saveSocialList = async (channels) => {
        setSocialBusy(true)
        try { await onSaveSocial(channels) } finally { setSocialBusy(false) }
      }
      const submitSocial = async (event) => {
        event.preventDefault()
        const handle = socialHandle.trim()
        if (!handle) return
        await saveSocialList([...socialChannels, { platform: socialPlatform, handle, name: socialName.trim(), lang: 'en', enabled: true }])
        setSocialHandle('')
        setSocialName('')
      }
      const feeds = data?.channels?.feeds || []
      const health = new Map((data?.sources || []).map((row) => [row.name, row]))
      const custom = data?.customFeeds || []
      const [url, setUrl] = React.useState('')
      const [name, setName] = React.useState('')
      const [lang, setLang] = React.useState('en')
      const [busy, setBusy] = React.useState(false)

      const submit = async (event) => {
        event.preventDefault()
        const value = url.trim()
        if (!value) return
        setBusy(true)
        try {
          await onSaveFeeds([...custom, { url: value, name: name.trim(), lang, enabled: true }])
          setUrl('')
          setName('')
        } finally {
          setBusy(false)
        }
      }

      const socialConnected = Boolean(social.configured?.bridge || social.configured?.x)
      return el('div', { className: 'aer-channels' },
        el('section', { className: 'aer-card' },
          el('h2', null, t('socialSources')),
          el('p', { className: socialConnected ? 'aer-health is-ok' : 'aer-health is-warn' },
            social.configured?.bridge
              ? fill(t('socialBridgeReady'), { base: social.bridgeBase || '—' })
              : social.configured?.x
                ? fill(t('socialXReady'), { hint: social.xBearerHint || '----' })
                : t('socialNotReady')),
          socialChannels.length
            ? el('ul', { className: 'aer-channel-list' }, socialChannels.map((channel) => el('li', { key: channel.id },
              el('span', { className: `aer-lang platform-${channel.platform}` }, String(channel.platform || '').toUpperCase()),
              el('strong', null, channel.name || `@${channel.handle}`),
              el('span', { className: 'aer-muted' }, `@${channel.handle}`),
              channel.status?.skipped
                ? el('span', { className: 'aer-state is-warn' }, t('socialStatusSkip'))
                : channel.status?.ok === false
                  ? el('span', { className: 'aer-state is-bad' }, channel.status.error || '×')
                  : channel.status?.items
                    ? el('span', { className: 'aer-state is-good' }, fill(t('socialStatusOk'), { n: channel.status.items }))
                    : null,
              el('button', {
                type: 'button',
                className: channel.enabled ? 'aer-chip is-on' : 'aer-chip',
                'aria-pressed': channel.enabled !== false,
                onClick: () => saveSocialList(socialChannels.map((row) => (row.id === channel.id ? { ...row, enabled: row.enabled === false } : row))),
              }, channel.enabled === false ? t('socialOff') : t('socialOn')),
              el(IconButton, {
                name: 'trash', label: t('remove'), className: 'is-quiet',
                onClick: () => saveSocialList(socialChannels.filter((row) => row.id !== channel.id)),
              }))) )
            : el('p', { className: 'aer-note' }, t('socialNoChannels')),
          el('form', { className: 'aer-feed-form', onSubmit: submitSocial },
            el('select', { value: socialPlatform, onChange: (event) => setSocialPlatform(event.target.value), 'aria-label': 'platform' },
              ['x', 'facebook', 'threads'].map((platform) => el('option', { key: platform, value: platform }, platform.toUpperCase()))),
            el('input', { value: socialHandle, placeholder: t('socialHandlePlaceholder'), onChange: (event) => setSocialHandle(event.target.value), 'aria-label': t('socialHandlePlaceholder'), required: true }),
            el('input', { value: socialName, placeholder: t('socialNamePlaceholder'), onChange: (event) => setSocialName(event.target.value), 'aria-label': t('socialNamePlaceholder') }),
            el('button', { type: 'submit', className: 'aer-btn', disabled: socialBusy || !socialHandle.trim() }, icon('plus', 14), el('span', null, t('socialAdd')))),
          el('div', { className: 'aer-feed-actions' },
            el('button', {
              type: 'button', className: 'aer-btn', disabled: socialBusy,
              onClick: () => saveSocialList([...socialChannels, ...(social.template || [])]),
            }, icon('star', 14), el('span', null, t('socialTemplate')))))
        ,
        el('section', { className: 'aer-card' },
          el('h2', null, t('channelsFeeds')),
          el('ul', { className: 'aer-channel-list' }, feeds.map((feed) => {
            const state = health.get(feed.name)
            const entry = custom.find((row) => row.name === feed.name && row.url === feed.url) || custom.find((row) => row.name === feed.name)
            return el('li', { key: feed.url || feed.name },
              el('span', { className: `aer-lang lang-${feed.lang}` }, LANGS[feed.lang] || feed.lang),
              el('strong', null, feed.name),
              el('span', { className: 'aer-muted' }, feed.region || ''),
              entry ? el('span', { className: 'aer-state is-custom' }, t('custom')) : null,
              state ? el('span', { className: state.ok === false ? 'aer-state is-bad' : 'aer-state is-good' },
                state.ok === false ? (state.error || '×') : `${state.items} 条`) : null,
              entry ? el(IconButton, {
                name: 'trash', label: t('remove'), className: 'is-quiet',
                onClick: () => onSaveFeeds(custom.filter((row) => row.url !== entry.url)),
              }) : null)
          })),
          el('form', { className: 'aer-feed-form', onSubmit: submit },
            el('input', { value: url, placeholder: t('feedUrl'), onChange: (event) => setUrl(event.target.value), 'aria-label': t('feedUrl'), type: 'url', required: true }),
            el('input', { value: name, placeholder: t('feedName'), onChange: (event) => setName(event.target.value), 'aria-label': t('feedName') }),
            el('select', { value: lang, onChange: (event) => setLang(event.target.value), 'aria-label': 'lang' },
              CODES.map((code) => el('option', { key: code, value: code }, LANGS[code]))),
            el('button', { type: 'submit', className: 'aer-btn', disabled: busy || !url.trim() }, icon('plus', 14), el('span', null, t('addFeed')))),
          message ? el('p', { className: 'aer-note' }, message) : null,
          el('div', { className: 'aer-feed-actions' },
            el('label', { className: 'aer-btn' },
              icon('upload', 14), el('span', null, importing ? '…' : t('opmlImport')),
              el('input', { type: 'file', accept: '.opml,.xml,text/xml', hidden: true, onChange: (event) => { const file = event.target.files?.[0]; if (file) onImport(file) } })),
            el('a', { className: 'aer-btn', href: API('/opml'), download: 'auto-export-radar-subscriptions.opml' },
              icon('download', 14), el('span', null, t('opmlExport'))))),
        el('section', { className: 'aer-card' },
          el('h2', null, t('channelsNews')),
          el('ul', { className: 'aer-channel-list' }, news.map((row) => el('li', { key: row.lang },
            LANGS[row.lang] && LANGS[row.lang] !== row.label ? el('span', { className: `aer-lang lang-${row.lang}` }, LANGS[row.lang]) : null,
            el('strong', null, row.label),
            el('span', { className: 'aer-muted' }, row.region))))),
        el('section', { className: 'aer-card' },
          el('h2', null, t('channelsManual')),
          el('ul', { className: 'aer-manual' }, MANUAL_CHANNELS.map(([label, detail]) => el('li', { key: label },
            el('strong', null, label), el('span', null, detail)))),
          el('p', { className: 'aer-note' }, t('manualNote'))))
    }

    function SettingsView({ t, data, onSaveSettings, onMarkAllRead, onClearReads, onSaveSocialSettings, saved }) {
      const settings = data?.settings || {}
      const social = data?.social || {}
      const [bridgeBase, setBridgeBase] = React.useState(social.bridgeBase || '')
      const [xBearer, setXBearer] = React.useState('')
      const [socialSaved, setSocialSaved] = React.useState(false)
      const [socialBusyState, setSocialBusyState] = React.useState(false)
      const [interval, setInterval] = React.useState(settings.refreshMinutes || 20)
      const [translate, setTranslate] = React.useState(settings.translate !== false)
      const [watch, setWatch] = React.useState((data?.watchlist || []).join('、'))
      const [busy, setBusy] = React.useState(false)

      const watchKey = (data?.watchlist || []).join('|')
      React.useEffect(() => { setInterval(settings.refreshMinutes || 20) }, [settings.refreshMinutes])
      React.useEffect(() => { setTranslate(settings.translate !== false) }, [settings.translate])
      React.useEffect(() => { setWatch((data?.watchlist || []).join('、')) }, [watchKey])

      const save = async (patch) => {
        setBusy(true)
        try { await onSaveSettings(patch) } finally { setBusy(false) }
      }

      const commitWatch = () => {
        const list = watch.split(/[、,，\n]/).map((row) => row.trim()).filter(Boolean)
        if (list.join('|') === (data?.watchlist || []).join('|')) return
        void save({ watchlist: list })
      }

      const saveConnection = async () => {
        setSocialBusyState(true)
        try {
          const patch = { bridgeBase }
          if (xBearer.trim()) patch.xBearer = xBearer.trim()
          await onSaveSocialSettings(patch)
          setXBearer('')
          setSocialSaved(true)
          setTimeout(() => setSocialSaved(false), 1800)
        } finally {
          setSocialBusyState(false)
        }
      }

      return el('div', { className: 'aer-settings' },
        el('section', { className: 'aer-card' },
          el('h2', null, t('socialSources')),
          el('p', { className: social.configured?.bridge || social.configured?.x ? 'aer-health is-ok' : 'aer-health is-warn' },
            social.configured?.bridge
              ? fill(t('socialBridgeReady'), { base: social.bridgeBase || '—' })
              : social.configured?.x
                ? fill(t('socialXReady'), { hint: social.xBearerHint || '----' })
                : t('socialNotReady')),
          el('label', { className: 'aer-field' },
            el('span', null, t('socialBridgeLabel')),
            el('input', {
              value: bridgeBase, placeholder: t('socialBridgePlaceholder'),
              onChange: (event) => setBridgeBase(event.target.value), 'aria-label': t('socialBridgeLabel'),
            })),
          el('label', { className: 'aer-field' },
            el('span', null, t('socialBearerLabel')),
            el('input', {
              type: 'password', value: xBearer, autoComplete: 'off',
              placeholder: social.configured?.x ? `••••${social.xBearerHint || ''}` : 'AAAAAAAA…',
              onChange: (event) => setXBearer(event.target.value), 'aria-label': t('socialBearerLabel'),
            })),
          el('div', { className: 'aer-setting-row' },
            el('button', { type: 'button', className: 'aer-btn', onClick: saveConnection, disabled: socialBusyState }, icon('gear', 14), el('span', null, t('socialSave'))),
            socialSaved ? el('span', { className: 'aer-muted' }, t('socialStored')) : null),
          el('p', { className: 'aer-note' }, t('socialTokenHint'))),
        el('section', { className: 'aer-card' },
          el('h2', null, t('settingsRefresh')),
          el('div', { className: 'aer-setting-row' },
            el('div', { className: 'aer-seg' }, [10, 20, 30, 60, 120].map((minutes) => el('button', {
              key: minutes, type: 'button', className: interval === minutes ? 'is-on' : '',
              onClick: () => { setInterval(minutes); void save({ refreshMinutes: minutes }) },
            }, fill(t('minute'), { n: minutes })))),
            data?.nextRefreshAt ? el('span', { className: 'aer-muted' }, fill(t('next'), { time: clock(data.nextRefreshAt) })) : null),
          el('div', { className: 'aer-setting-row' },
            el('button', {
              type: 'button', className: translate ? 'aer-switch is-on' : 'aer-switch',
              role: 'switch', 'aria-checked': translate,
              onClick: () => { const next = !translate; setTranslate(next); void save({ translate: next }) },
            }, el('span', { className: 'aer-switch-dollar' }), el('span', null, t('settingsTranslate'))),
            saved ? el('span', { className: 'aer-muted' }, t('saved')) : null)),
        el('section', { className: 'aer-card' },
          el('h2', null, t('settingsWatch')),
          el('textarea', {
            className: 'aer-textarea', rows: 3, value: watch,
            placeholder: t('watchPlaceholder'),
            onChange: (event) => setWatch(event.target.value),
            onBlur: commitWatch,
            'aria-label': t('settingsWatch'),
          }),
          el('p', { className: 'aer-note' }, t('watchHint')),
          data?.watchlist?.length
            ? el('div', { className: 'aer-tool-row is-wrap' }, data.watchlist.map((term) => el('span', { key: term, className: 'aer-chip is-on' }, term)))
            : null),
        el('section', { className: 'aer-card' },
          el('h2', null, t('readState')),
          el('div', { className: 'aer-setting-row' },
            el('button', { type: 'button', className: 'aer-btn', onClick: onMarkAllRead, disabled: busy }, t('markAllRead')),
            el('button', { type: 'button', className: 'aer-btn', onClick: onClearReads, disabled: busy }, t('clearReads'))),
          el('p', { className: 'aer-note' }, t('onlyTitles'))))
    }

    class PanelBoundary extends React.Component {
      constructor(props) {
        super(props)
        this.state = { error: null }
      }

      static getDerivedStateFromError(error) {
        return { error }
      }

      componentDidCatch(error, info) {
        console.error('[auto-export-radar] panel render failed', error, info)
      }

      render() {
        if (!this.state.error) return this.props.children
        return el('div', { className: 'aer-root' },
          el('style', null, CSS),
          el('div', { className: 'aer-state-block is-error' },
            el('p', null, `面板渲染失败：${String(this.state.error?.message || this.state.error)}`),
            el('button', { type: 'button', className: 'aer-btn', onClick: () => this.setState({ error: null }) }, '重试')))
      }
    }

    function Panel({ ctx }) {
      const t = useTranslate(ctx)
      const radar = useRadar()
      const [tab, setTab] = React.useState('feed')
      const [hours, setHours] = React.useState(72)
      const [langs, setLangs] = React.useState([])
      const [topic, setTopic] = React.useState(null)
      const [query, setQuery] = React.useState('')
      const [unreadOnly, setUnreadOnly] = React.useState(false)
      const [watchOnly, setWatchOnly] = React.useState(false)
      const [shown, setShown] = React.useState(PAGE_SIZE)
      const [copied, setCopied] = React.useState(false)
      const [saved, setSaved] = React.useState(false)
      const [importing, setImporting] = React.useState(false)
      const [feedMessage, setFeedMessage] = React.useState('')
      const [reader, setReader] = React.useState(null)
      const [translating, setTranslating] = React.useState(false)

      const data = radar.data
      const watchlist = data?.watchlist || []

      const filtered = React.useMemo(() => {
        const items = data?.items || []
        const cutoff = Date.now() - hours * 3600_000
        const needle = query.trim().toLowerCase()
        return items
          .filter((item) => {
            if (tab === 'favorites') {
              if (!item.favorite) return false
            } else if (stampOf(item) < cutoff) return false
            if (langs.length && !langs.includes(item.lang)) return false
            if (topic && !(item.topics || []).includes(topic)) return false
            if (unreadOnly && item.read) return false
            if (watchOnly && !matchesWatch(item, watchlist)) return false
            if (needle) {
              const hay = `${item.title} ${item.titleZh || ''} ${item.source} ${item.region || ''}`.toLowerCase()
              if (!hay.includes(needle)) return false
            }
            return true
          })
          .sort((a, b) => stampOf(b) - stampOf(a))
      }, [data, tab, hours, langs, topic, query, unreadOnly, watchOnly, watchlist])

      React.useEffect(() => { setShown(PAGE_SIZE) }, [tab, hours, langs, topic, query, unreadOnly, watchOnly])

      const visible = React.useMemo(() => filtered.slice(0, shown), [filtered, shown])

      const openItem = React.useCallback(async (item) => {
        setReader({ item, loading: true, error: null, translateError: null, article: null, view: 'zh' })
        void radar.markRead([item.id], true)
        if (item.hasArticle === false) {
          setReader({ item, loading: false, error: null, article: null, view: 'zh', blocked: true })
          return
        }
        try {
          const res = await fetch(API(`/article?url=${encodeURIComponent(item.link)}`), { credentials: 'same-origin', headers: { accept: 'application/json' } })
          const body = await readJsonResponse(res)
          setReader((current) => (current && current.item.id === item.id
            ? { ...current, loading: false, article: body.article, view: body.article?.zh?.paragraphs?.length ? 'zh' : 'orig' }
            : current))
        } catch (err) {
          setReader((current) => (current && current.item.id === item.id ? { ...current, loading: false, error: String(err?.message || err) } : current))
        }
      }, [radar])

      const translateReader = React.useCallback(async () => {
        if (!reader?.item) return
        setTranslating(true)
        try {
          const res = await fetch(API('/article/translate'), {
            method: 'POST', credentials: 'same-origin',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify({ url: reader.item.link }),
          })
          const body = await readJsonResponse(res)
          setReader((current) => (current ? { ...current, article: body.article, view: 'zh', translateError: null } : current))
        } catch (err) {
          setReader((current) => (current ? { ...current, translateError: String(err?.message || err) } : current))
        } finally {
          setTranslating(false)
        }
      }, [reader])

      const copyDigest = React.useCallback(async () => {
        const rows = filtered.slice(0, 30)
        if (!rows.length) return
        const head = `# 中国汽车出海雷达 · ${new Date().getFullYear()}-${pad(new Date().getMonth() + 1)}-${pad(new Date().getDate())} ${clock(Date.now())}\n\n共 ${filtered.length} 条，以下按时间倒序（标题已翻成中文，链接是原文）。\n`
        const body = rows.map((item, index) => {
          const when = item.publishedAt ? item.publishedAt.slice(0, 16).replace('T', ' ') : '时间未知'
          const topics = (item.topics || []).length ? ` · ${item.topics.join('/')}` : ''
          return `${index + 1}. **${item.titleZh || item.title}**${item.titleZh ? `（${item.title}）` : ''}\n   ${item.source} · ${when}${topics}\n   ${item.link}`
        }).join('\n')
        try {
          await navigator.clipboard.writeText(`${head}\n${body}`)
          setCopied(true)
          setTimeout(() => setCopied(false), 2200)
        } catch (_error) {
          setCopied(false)
        }
      }, [filtered])

      const importOpml = React.useCallback(async (file) => {
        setImporting(true)
        setFeedMessage('')
        try {
          const text = await file.text()
          const res = await fetch(API('/opml'), {
            method: 'POST', credentials: 'same-origin',
            headers: { 'content-type': 'text/xml' },
            body: text,
          })
          const body = await readJsonResponse(res)
          setFeedMessage(`OPML：读到 ${body.imported} 个源，新增 ${body.added} 个`)
          await radar.load()
        } catch (err) {
          setFeedMessage(`OPML 导入失败：${String(err?.message || err)}`)
        } finally {
          setImporting(false)
        }
      }, [radar])

      const markAllReadNow = React.useCallback(() => {
        void radar.markAllRead(filtered.map((item) => item.id))
      }, [radar, filtered])

      const clearReads = React.useCallback(() => {
        void radar.markAllUnread()
        setSaved(true)
        setTimeout(() => setSaved(false), 1600)
      }, [radar])

      const markAllUnread = React.useCallback(async () => {
        setData((current) => (current
          ? { ...current, items: current.items.map((item) => ({ ...item, read: false })), unreadCount: current.items.length }
          : current))
        try {
          await fetch(API('/read'), {
            method: 'POST', credentials: 'same-origin',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify({ keys: [], read: false }),
          })
        } catch (_error) { /* 下一次拉取会纠正 */ }
      }, [])

      const saveSettings = React.useCallback(async (patch) => {
        try {
          await radar.saveSettings(patch)
          setSaved(true)
          setTimeout(() => setSaved(false), 1600)
        } catch (_error) { /* 面板会在下次拉取时显示 */ }
      }, [radar])

      const busy = radar.manualBusy || Boolean(data?.refreshing)
      const showReader = reader && tab !== 'channels' && tab !== 'settings'

      const feedState = radar.error
        ? el('div', { className: 'aer-state-block is-error' },
          el('p', null, fill(t('loadFail'), { error: radar.error })),
          el('button', { type: 'button', className: 'aer-btn', onClick: () => radar.load() }, t('retry')))
        : !data || !data.poolSize
          ? el('div', { className: 'aer-state-block is-loading' },
            el('span', { className: 'aer-shimmer' }, t('loading')),
            el('p', { className: 'aer-muted' }, t('startHint')))
          : visible.length
            ? el('ul', { className: 'aer-list' },
              visible.map((item) => el('li', { key: item.id },
                el(Item, {
                  item, t,
                  onOpen: openItem,
                  onFavorite: radar.toggleFavorite,
                  watched: matchesWatch(item, watchlist),
                }))),
              filtered.length > visible.length
                ? el('li', null, el('button', {
                  type: 'button', className: 'aer-btn is-wide',
                  onClick: () => setShown((current) => current + PAGE_SIZE),
                }, fill(t('more'), { n: filtered.length - visible.length })))
                : null)
            : el('div', { className: 'aer-state-block' },
              el('p', null, tab === 'favorites' ? t('emptyFav') : t('empty')),
              el('p', { className: 'aer-muted' }, t('emptyHint')))

      const body = tab === 'channels'
        ? el('div', { className: 'aer-main' }, el(ChannelsView, {
          t, data, onSaveFeeds: radar.saveFeeds, onSaveSocial: radar.saveSocial, onImport: importOpml, importing,
          message: feedMessage,
        }))
        : tab === 'settings'
          ? el('div', { className: 'aer-main' }, el(SettingsView, {
            t, data, onSaveSettings: saveSettings, onMarkAllRead: markAllReadNow, onClearReads: clearReads,
            onSaveSocialSettings: radar.saveSocialSettings, saved,
          }))
          : el('div', { className: 'aer-main' },
            tab === 'feed' ? el(Toolbar, {
              t, hours, setHours, langs, setLangs, topic, setTopic, query, setQuery, data,
              unreadOnly, setUnreadOnly, watchOnly, setWatchOnly,
            }) : null,
            feedState,
            data && data.lastError
              ? el('p', { className: 'aer-foot-note is-warn' }, `${t('err')}: ${data.lastError}`)
              : null)

      const rail = tab === 'feed'
        ? el(SideRail, {
          t, data, visible: filtered.length, onCopy: copyDigest, copied,
          onMarkAll: markAllReadNow, hasUnread: Boolean(data?.unreadCount),
        })
        : null

      return el('div', { className: 'aer-root' },
        el('style', null, CSS),
        el(Header, {
          t,
          tabs: el(Tabs, { value: tab, onChange: setTab, t, unread: data?.unreadCount || 0 }),
          data,
          auto: radar.auto,
          setAuto: radar.setAuto,
          onRefresh: radar.refreshNow,
          busy,
        }),
        el('div', { className: `aer-body ${showReader ? 'has-reader' : ''}` },
          body,
          rail,
          showReader
            ? el(Reader, {
              t,
              state: reader,
              onClose: (key, value) => {
                if (key === 'view') setReader((current) => (current ? { ...current, view: value } : current))
                else setReader(null)
              },
              onTranslate: translateReader,
              onFavorite: radar.toggleFavorite,
              translating,
            })
            : null))
    }

    function apply(ctx) {
      const PanelWithContext = () => el(PanelBoundary, null, el(Panel, { ctx }))

      ctx.effect(() => {
        const removeZh = ctx.locale.register(NS, 'zh', ZH)
        const removeEn = ctx.locale.register(NS, 'en', EN)
        return () => { removeZh(); removeEn() }
      }, 'auto-export-radar: locale dictionaries')

      const t = () => ctx.locale.bind(NS)
      const panelLabel = () => {
        const text = t()('panel')
        return text && text !== 'panel' ? text : '中国汽车出海雷达'
      }

      ctx.effect(() => ctx.slots.inject('main', () => ctx.slots.register({
        name: 'main',
        key: PANEL_ID,
      }, PanelWithContext)), 'auto-export-radar: main panel')

      ctx.effect(() => ctx.slots.inject('sidebar.panellist', () => ctx.slots.register({
        name: 'sidebar.panellist',
        id: PANEL_ID,
        order: 8,
        label: panelLabel,
      }, Icon)), 'auto-export-radar: sidebar entry')
    }

    const CSS = `
.aer-root {
  --ink: var(--dsw-alias-label-primary);
  --ink2: var(--dsw-alias-label-secondary);
  --line: var(--dsw-alias-border-l1);
  --line2: var(--dsw-alias-border-l2);
  --card: var(--dsw-alias-bg-layer-1);
  --card2: var(--dsw-alias-bg-layer-2);
  --accent: var(--dsw-alias-brand-primary);
  --good: var(--dsw-alias-state-success-primary);
  --warn: var(--dsw-alias-state-warn-primary);
  --bad: var(--dsw-alias-state-error-primary);
  --hover: color-mix(in srgb, var(--dsw-alias-label-primary) 6%, transparent);
  --r-sm: var(--dsw-radius-sm, 8px);
  --r-md: var(--dsw-radius-md, 12px);
  --r-lg: var(--dsw-radius-lg, 16px);
  position: relative;
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
  min-height: 0;
  overflow: hidden;
  background: var(--dsw-alias-bg-base);
  color: var(--ink);
  font-family: inherit;
  font-size: 14px;
  line-height: 22px;
  -webkit-font-smoothing: antialiased;
}
.aer-root *, .aer-root *::before, .aer-root *::after { box-sizing: border-box; }
.aer-root :is(h1, h2, p, ul, li, textarea) { margin: 0; padding: 0; }
.aer-root :is(ul, li) { list-style: none; }
.aer-root :is(button, input, select, textarea) { font: inherit; color: inherit; }
.aer-root :is(button) { background: none; border: 0; padding: 0; cursor: pointer; }
.aer-root :focus-visible { outline: 2px solid var(--accent); outline-offset: 2px; border-radius: 4px; }
.aer-root a { color: inherit; text-decoration: none; }

.aer-head {
  flex: none;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 10px 18px;
  padding: 14px 24px 12px max(24px, var(--dsh-frame-leading-clearance, 0px));
  border-bottom: 1px solid var(--line);
  background: var(--dsw-specific-sidebar-fill, var(--card));
}
.aer-head-main { display: flex; align-items: center; gap: 11px; min-width: 0; flex: 1 1 260px; }
.aer-mark {
  display: inline-flex; align-items: center; justify-content: center;
  width: 34px; height: 34px; flex: none; border-radius: var(--r-md);
  color: var(--accent);
  background: color-mix(in srgb, var(--accent) 12%, transparent);
}
.aer-head-copy { min-width: 0; }
.aer-head-copy h1 { font-size: 15px; font-weight: 650; letter-spacing: .01em; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.aer-head-copy p { font-size: 12px; color: var(--ink2); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.aer-head-tools { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
.aer-head-meta { width: 100%; display: flex; flex-wrap: wrap; align-items: center; gap: 6px; font-size: 12px; color: var(--ink2); }
.aer-head-meta .aer-sep { opacity: .5; }
.aer-head-meta .is-ok { color: var(--good); }
.aer-head-meta .is-warn { color: var(--warn); }

.aer-tabs { display: flex; gap: 2px; padding: 3px; border-radius: var(--r-md); background: var(--card2); }
.aer-tabs button { height: 28px; padding: 0 12px; border-radius: calc(var(--r-md) - 3px); font-size: 13px; color: var(--ink2); transition: background .15s, color .15s; display: inline-flex; align-items: center; gap: 5px; }
.aer-tabs button:hover { color: var(--ink); }
.aer-tabs button.is-on { background: var(--dsw-alias-bg-base); color: var(--ink); box-shadow: 0 1px 2px color-mix(in srgb, var(--ink) 10%, transparent); }
.aer-tab-badge { font-size: 10.5px; line-height: 15px; min-width: 15px; padding: 0 4px; border-radius: 999px; background: color-mix(in srgb, var(--accent) 16%, transparent); color: var(--accent); }
.aer-btn {
  display: inline-flex; align-items: center; justify-content: center; gap: 6px;
  height: 32px; padding: 0 12px; border-radius: var(--r-md);
  border: 1px solid var(--line2); background: var(--card);
  font-size: 13px; white-space: nowrap; transition: background .15s, border-color .15s;
}
.aer-btn:hover:not(:disabled) { background: var(--hover); }
.aer-btn:disabled { opacity: .6; cursor: default; }
.aer-btn.is-busy svg { animation: aer-spin 1.1s linear infinite; }
.aer-btn.is-wide { width: 100%; margin-top: 8px; }
.aer-btn.is-quiet { border-color: transparent; background: transparent; color: var(--ink2); }
.aer-btn.is-quiet:hover:not(:disabled) { background: var(--hover); color: var(--ink); }
.aer-btn.is-primary-outline { margin-top: 0; border-color: color-mix(in srgb, var(--accent) 45%, transparent); color: var(--accent); background: color-mix(in srgb, var(--accent) 8%, transparent); }
.aer-icon-btn { display: inline-flex; align-items: center; justify-content: center; width: 30px; height: 30px; border-radius: var(--r-sm); color: var(--ink2); flex: none; }
.aer-icon-btn:hover { background: var(--hover); color: var(--ink); }
.aer-icon-btn.is-on { color: #d97706; }
.aer-icon-btn.is-quiet { width: 26px; height: 26px; }
@keyframes aer-spin { to { transform: rotate(360deg); } }
.aer-switch { display: inline-flex; align-items: center; gap: 7px; height: 32px; padding: 0 11px; border-radius: var(--r-md); border: 1px solid var(--line); font-size: 13px; color: var(--ink2); }
.aer-switch-dollar { position: relative; width: 28px; height: 16px; border-radius: 999px; background: color-mix(in srgb, var(--ink2) 35%, transparent); transition: background .18s; flex: none; }
.aer-switch-dollar::after { content: ''; position: absolute; top: 2px; left: 2px; width: 12px; height: 12px; border-radius: 50%; background: var(--dsw-alias-bg-base); transition: transform .18s; }
.aer-switch.is-on { color: var(--ink); }
.aer-switch.is-on .aer-switch-dollar { background: var(--accent); }
.aer-switch.is-on .aer-switch-dollar::after { transform: translateX(12px); }
.aer-chip {
  height: 26px; padding: 0 10px; border-radius: 999px;
  border: 1px solid var(--line); color: var(--ink2); font-size: 12px; white-space: nowrap;
  transition: background .15s, color .15s, border-color .15s;
}
.aer-chip:hover { background: var(--hover); color: var(--ink); }
.aer-chip.is-on { color: var(--accent); border-color: color-mix(in srgb, var(--accent) 45%, transparent); background: color-mix(in srgb, var(--accent) 10%, transparent); }

.aer-body { flex: 1; min-height: 0; display: flex; overflow: hidden; }
.aer-main { flex: 1; min-width: 0; display: flex; flex-direction: column; overflow: hidden; }
.aer-toolbar { flex: none; display: flex; flex-direction: column; gap: 8px; padding: 12px 24px; border-bottom: 1px solid var(--line); }
.aer-tool-row { display: flex; align-items: center; gap: 8px; }
.aer-tool-row.is-wrap { flex-wrap: wrap; }
.aer-seg { display: flex; gap: 2px; padding: 3px; border-radius: var(--r-md); background: var(--card2); flex: none; }
.aer-seg button { height: 26px; padding: 0 11px; border-radius: calc(var(--r-md) - 3px); font-size: 12px; color: var(--ink2); }
.aer-seg button.is-on { background: var(--dsw-alias-bg-base); color: var(--ink); }
.aer-seg.is-small { padding: 2px; }
.aer-seg.is-small button { height: 24px; padding: 0 9px; font-size: 11.5px; }
.aer-search { display: flex; align-items: center; gap: 7px; flex: 1; min-width: 140px; height: 32px; padding: 0 11px; border-radius: var(--r-md); border: 1px solid var(--line); background: var(--card); color: var(--ink2); }
.aer-search input { flex: 1; min-width: 0; height: 100%; border: 0; background: none; outline: none; font-size: 13px; }
.aer-search input::placeholder { color: var(--ink2); opacity: .8; }

.aer-list { flex: 1; min-height: 0; overflow-y: auto; overscroll-behavior: contain; padding: 6px 16px 24px; }
.aer-item { display: block; padding: 12px 14px; border-radius: var(--r-md); border: 1px solid transparent; transition: background .14s, border-color .14s; cursor: pointer; }
.aer-item:hover { background: var(--card); border-color: var(--line); }
.aer-item.is-read .aer-item-title { color: var(--ink2); font-weight: 500; }
.aer-item-top { display: flex; align-items: baseline; gap: 7px; }
.aer-unread { width: 6px; height: 6px; border-radius: 50%; background: var(--accent); flex: none; align-self: center; }
.aer-unread.is-read { background: transparent; box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--ink2) 45%, transparent); }
.aer-lang {
  flex: none; display: inline-flex; align-items: center; justify-content: center;
  min-width: 26px; height: 18px; padding: 0 5px; border-radius: 5px;
  font-size: 10.5px; font-weight: 600; letter-spacing: .02em;
  background: color-mix(in srgb, var(--ink2) 12%, transparent); color: var(--ink2);
}
.aer-lang.lang-zh { background: color-mix(in srgb, #c2410c 14%, transparent); color: #c2410c; }
.aer-item-title { font-size: 14.5px; font-weight: 560; line-height: 1.45; color: var(--ink); }
.aer-item-orig { margin-top: 3px; font-size: 12px; line-height: 1.5; color: var(--ink2); opacity: .9; }
.aer-pending { flex: none; font-size: 10.5px; color: var(--warn); border: 1px dashed color-mix(in srgb, var(--warn) 50%, transparent); border-radius: 5px; padding: 0 5px; }
.aer-watch { flex: none; color: #d97706; font-size: 11px; }
.aer-star { margin-left: auto; display: inline-flex; align-items: center; justify-content: center; width: 26px; height: 26px; border-radius: 6px; color: color-mix(in srgb, var(--ink2) 60%, transparent); flex: none; align-self: center; }
.aer-star:hover { background: var(--hover); color: var(--ink); }
.aer-star.is-on { color: #d97706; }
.aer-star.is-on svg { fill: currentColor; }
.aer-item-meta { display: flex; flex-wrap: wrap; align-items: center; gap: 5px; margin-top: 5px; font-size: 11.5px; color: var(--ink2); }
.aer-item-meta .aer-src { color: var(--ink2); font-weight: 500; }
.aer-social-badge { flex: none; font-size: 10px; padding: 0 5px; border-radius: 4px; background: color-mix(in srgb, #7c3aed 14%, transparent); color: #7c3aed; }
.aer-lang.platform-x { background: color-mix(in srgb, #111 12%, transparent); color: var(--ink); }
.aer-lang.platform-facebook { background: color-mix(in srgb, #1877f2 14%, transparent); color: #1877f2; }
.aer-lang.platform-threads { background: color-mix(in srgb, #000 12%, transparent); color: var(--ink2); }
.aer-state.is-warn { color: var(--warn); }
.aer-field { display: flex; flex-direction: column; gap: 4px; margin-top: 10px; }
.aer-field span { font-size: 12px; color: var(--ink2); }
.aer-field input { height: 30px; padding: 0 9px; border-radius: var(--r-sm); border: 1px solid var(--line); background: var(--dsw-alias-bg-base); font-size: 12.5px; min-width: 0; outline: none; }
.aer-field input:focus { border-color: color-mix(in srgb, var(--accent) 55%, transparent); }
.aer-item-meta .aer-dot { opacity: .45; }
.aer-tag { font-size: 10.5px; padding: 0 6px; border-radius: 4px; background: color-mix(in srgb, var(--accent) 9%, transparent); color: color-mix(in srgb, var(--accent) 80%, var(--ink)); }
.aer-open { margin-left: auto; display: inline-flex; align-items: center; justify-content: center; width: 24px; height: 24px; border-radius: 6px; color: var(--ink2); opacity: 0; transition: opacity .15s, background .15s; }
.aer-open:hover { background: var(--hover); color: var(--ink); }
.aer-item:hover .aer-open, .aer-item:focus-visible .aer-open { opacity: 1; }

.aer-rail { flex: none; width: 264px; overflow-y: auto; padding: 12px 18px 24px 0; display: flex; flex-direction: column; gap: 10px; }
.aer-card { background: var(--card); border: 1px solid var(--line); border-radius: var(--r-lg); padding: 12px 13px; }
.aer-card h2 { font-size: 11.5px; font-weight: 600; letter-spacing: .04em; text-transform: uppercase; color: var(--ink2); }
.aer-card-head { display: flex; align-items: baseline; justify-content: space-between; gap: 8px; }
.aer-card-head span { font-size: 11.5px; color: var(--ink2); }
.aer-health { margin-top: 6px; font-size: 13px; font-weight: 550; }
.aer-health.is-ok { color: var(--good); }
.aer-health.is-warn { color: var(--warn); }
.aer-fails { margin-top: 7px; display: flex; flex-direction: column; gap: 5px; }
.aer-fails li { font-size: 11.5px; line-height: 1.4; color: var(--ink2); }
.aer-fails strong { display: block; color: var(--ink); font-weight: 550; }
.aer-bars { margin-top: 8px; display: flex; flex-direction: column; gap: 5px; }
.aer-bars li { display: flex; align-items: center; gap: 7px; font-size: 11.5px; color: var(--ink2); }
.aer-bar-label { width: 46px; flex: none; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.aer-bar { flex: 1; height: 5px; border-radius: 999px; background: color-mix(in srgb, var(--ink2) 14%, transparent); overflow: hidden; }
.aer-bar i { display: block; height: 100%; border-radius: 999px; background: color-mix(in srgb, var(--accent) 70%, transparent); }
.aer-bar-count { width: 22px; text-align: right; flex: none; font-variant-numeric: tabular-nums; }
.aer-note { margin-top: 8px; font-size: 11.5px; line-height: 1.5; color: var(--ink2); }
.aer-setting-row { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; margin-top: 10px; }

.aer-channels, .aer-settings { flex: 1; min-height: 0; overflow-y: auto; padding: 14px 24px 28px 16px; display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 12px; align-content: start; }
.aer-settings { grid-template-columns: minmax(0, 620px); padding-left: 24px; }
.aer-channels .aer-card h2, .aer-settings .aer-card h2 { margin-bottom: 9px; }
.aer-channel-list { display: flex; flex-direction: column; gap: 6px; }
.aer-channel-list li { display: flex; align-items: center; gap: 8px; font-size: 12.5px; }
.aer-channel-list strong { font-weight: 550; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.aer-muted { color: var(--ink2); font-size: 11.5px; }
.aer-state { margin-left: auto; font-size: 11px; color: var(--ink2); }
.aer-state.is-good { color: var(--good); }
.aer-state.is-bad { color: var(--bad); max-width: 108px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.aer-state.is-custom { margin-left: 0; color: var(--accent); }
.aer-manual { display: flex; flex-direction: column; gap: 7px; }
.aer-manual li { font-size: 12px; line-height: 1.5; }
.aer-manual strong { display: block; font-weight: 550; }
.aer-manual span { color: var(--ink2); }
.aer-feed-form { display: flex; gap: 6px; margin-top: 10px; flex-wrap: wrap; }
.aer-feed-form input, .aer-feed-form select { height: 30px; padding: 0 8px; border-radius: var(--r-sm); border: 1px solid var(--line); background: var(--dsw-alias-bg-base); font-size: 12px; min-width: 0; }
.aer-feed-form input[type=url] { flex: 1 1 180px; }
.aer-feed-form input:not([type]) { flex: 0 1 120px; }
.aer-feed-actions { display: flex; gap: 8px; margin-top: 10px; flex-wrap: wrap; }
.aer-textarea { width: 100%; margin-top: 8px; padding: 8px 10px; border-radius: var(--r-sm); border: 1px solid var(--line); background: var(--dsw-alias-bg-base); font-size: 12.5px; line-height: 1.6; resize: vertical; outline: none; }
.aer-textarea:focus { border-color: color-mix(in srgb, var(--accent) 55%, transparent); }

.aer-reader { flex: none; width: min(46%, 560px); min-width: 360px; display: flex; flex-direction: column; border-left: 1px solid var(--line); background: var(--dsw-alias-bg-base); }
.aer-reader-head { flex: none; display: flex; align-items: flex-start; gap: 8px; padding: 12px 16px 8px; border-bottom: 1px solid var(--line); }
.aer-reader-titles { flex: 1; min-width: 0; }
.aer-reader-titles h2 { font-size: 15px; font-weight: 620; line-height: 1.45; }
.aer-reader-titles p { margin-top: 3px; font-size: 12px; line-height: 1.5; color: var(--ink2); }
.aer-reader-tools { display: flex; align-items: center; gap: 4px; flex: none; }
.aer-reader-meta { flex: none; display: flex; flex-wrap: wrap; align-items: center; gap: 6px; padding: 8px 16px; font-size: 11.5px; color: var(--ink2); border-bottom: 1px solid var(--line); }
.aer-reader-actions { flex: none; display: flex; align-items: center; gap: 10px; flex-wrap: wrap; padding: 8px 16px; border-bottom: 1px solid var(--line); }
.aer-reader-actions .aer-btn { height: 28px; padding: 0 11px; font-size: 12.5px; }
.aer-translate-error { font-size: 11.5px; color: var(--warn); }
.aer-reader-body { flex: 1; min-height: 0; overflow-y: auto; padding: 14px 18px 32px; }
.aer-article { max-width: 680px; margin: 0 auto; }
.aer-article p { font-size: 14px; line-height: 1.85; margin-bottom: 14px; color: var(--ink); }
.aer-article p:first-child { font-size: 14.5px; }

.aer-state-block { flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 8px; padding: 40px 24px; text-align: center; }
.aer-state-block p { font-size: 13px; color: var(--ink2); max-width: 420px; line-height: 1.6; }
.aer-state-block.is-error p { color: var(--bad); }
.aer-state-block .aer-btn { margin-top: 4px; }
.aer-shimmer { font-size: 14px; font-weight: 550; background: linear-gradient(100deg, var(--ink2) 30%, var(--ink) 50%, var(--ink2) 70%); background-size: 220% 100%; -webkit-background-clip: text; background-clip: text; color: transparent; animation: aer-shimmer 1.7s linear infinite; }
@keyframes aer-shimmer { to { background-position: -220% 0; } }
.aer-foot-note { flex: none; padding: 6px 24px 10px; font-size: 11.5px; color: var(--ink2); }
.aer-foot-note.is-warn { color: var(--warn); }

@media (max-width: 1180px) {
  .aer-rail { display: none; }
  .aer-channels { grid-template-columns: 1fr; padding-right: 16px; }
}
@media (max-width: 900px) {
  .aer-body.has-reader .aer-main { display: none; }
  .aer-reader { width: 100%; min-width: 0; border-left: 0; }
}
@media (max-width: 720px) {
  .aer-head { padding: 12px 14px; }
  .aer-toolbar { padding: 10px 14px; }
  .aer-list { padding: 4px 8px 20px; }
  .aer-channels, .aer-settings { padding: 12px 14px 22px; }
}
`

    return { inject: ['slots', 'locale'], apply }
  },
})
