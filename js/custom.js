/* ==========================================================================
 * Lumoes Blog - custom.js (AnZhiYu 主题适配版)
 * 1. THE END + CTA 按钮注入
 * 2. AI 摘要自动生成（接管主题 local 模式，调用 OpenAI 兼容 API）
 * ========================================================================== */

/* --------------------------------------------------------------------------
 * AI 摘要配置
 * 通过 Cloudflare Worker 代理，API Key 保存在 Worker 环境变量中，不暴露给前端
 * -------------------------------------------------------------------------- */
const AI_CONFIG = {
  baseURL: 'https://ai.646474.xyz',              // Cloudflare Worker 地址
  model: '@cf/zai-org/glm-4.7-flash',            // Workers AI 模型：GLM-4.7-Flash（免费额度内、快速、中文好、轻量）
  maxWords: 1300,                                // 截取文章前 1300 字发给 API
  systemPrompt: '你是一个博客文章摘要生成助手。请根据用户提供的文章内容，生成一段简洁、准确、有吸引力的中文摘要，字数在100-200字之间。只输出摘要正文，不要加"摘要："等前缀，不要使用 markdown 格式，不要换行。'
};

/* --------------------------------------------------------------------------
 * 1. 文章结尾 "THE END" 分割线注入（仅 post 页，不含 page）
 * -------------------------------------------------------------------------- */
function injectPostEnd() {
  // 仅在文章页注入（body data-type 为 post，或 URL 匹配 /post/ 或文章路径）
  const isPost = document.body.dataset.type === 'post'
    || document.querySelector('article.post-post, #post');
  if (!isPost) return;

  const article = document.querySelector('#article-container');
  if (!article) return;
  if (document.querySelector('.post-end-wrapper')) return;

  const wrapper = document.createElement('div');
  wrapper.className = 'post-end-wrapper';
  wrapper.innerHTML = `<div class="end-separator"><span>THE END</span></div>`;
  article.appendChild(wrapper);
}

/* --------------------------------------------------------------------------
 * 1.5 打赏按钮拦截：点击直接跳转 /donate/，不弹二维码
 * -------------------------------------------------------------------------- */
function hijackRewardButton() {
  const reward = document.querySelector('.post-reward');
  if (!reward || reward.dataset.hijacked === '1') return;
  reward.dataset.hijacked = '1';

  // 移除原始 onclick（弹出二维码遮罩）
  reward.removeAttribute('onclick');

  // 彻底移除二维码弹窗容器 DOM，防止 CSS hover 显示
  const rewardMain = reward.querySelector('.reward-main');
  if (rewardMain) rewardMain.remove();
  const quitBox = document.getElementById('quit-box');
  if (quitBox) quitBox.remove();

  // 点击整个 .post-reward 跳转到 /donate/
  reward.style.cursor = 'pointer';
  reward.addEventListener('click', function (e) {
    e.preventDefault();
    window.location.href = '/donate/';
  });
}

/* --------------------------------------------------------------------------
 * 2.5 ThinkingOrb 思考动画（AI 生成摘要时的加载动效）
 *     使用 thinking-orbs 引擎（/js/thinking-orbs.js 提供 window.mountThinkingOrb）
 *     等价于 <ThinkingOrb state="working" size={64} speed={1.5} />
 * -------------------------------------------------------------------------- */
let currentOrbCleanup = null; // 当前 orb 动画的清理函数

function stopThinkingOrb() {
  if (typeof currentOrbCleanup === 'function') {
    try { currentOrbCleanup(); } catch (e) {}
    currentOrbCleanup = null;
  }
}

function injectThinkingOrbStyle() {
  if (document.getElementById('ai-thinking-orb-style')) return;
  const style = document.createElement('style');
  style.id = 'ai-thinking-orb-style';
  style.textContent = `
    .ai-thinking-wrap {
      display: flex; flex-direction: column; align-items: center; justify-content: center;
      gap: 14px; padding: 22px 0; text-align: center;
    }
    .ai-thinking-text {
      font-size: 14px; color: var(--anzhiyu-secondtext, #999); letter-spacing: 0.5px;
    }
  `;
  document.head.appendChild(style);
}

function showThinkingOrb(el) {
  injectThinkingOrbStyle();
  stopThinkingOrb();
  el.innerHTML = `
    <div class="ai-thinking-wrap">
      <canvas></canvas>
      <span class="ai-thinking-text">AI 正在思考生成摘要…</span>
    </div>`;
  const canvas = el.querySelector('canvas');
  if (canvas && window.mountThinkingOrb) {
    currentOrbCleanup = window.mountThinkingOrb(canvas, {
      state: 'working',
      size: 64,
      speed: 1.5
    });
  }
}

/* --------------------------------------------------------------------------
 * 2. AI 摘要自动生成
 *    接管主题 local 模式，调用 OpenAI 兼容 API
 * -------------------------------------------------------------------------- */
function initAISummary() {
  const aiBox = document.querySelector('.post-ai-description');
  if (!aiBox) return;
  if (aiBox.dataset.aiInit === '1') return; // 防止重复初始化
  aiBox.dataset.aiInit = '1';

  const explanation = aiBox.querySelector('.ai-explanation');
  if (!explanation) return;

  const article = document.querySelector('#article-container');
  if (!article) return;

  const refreshBtn = aiBox.querySelector('.ai-title .anzhiyu-icon-arrow-rotate-right');
  let isGenerating = false;

  // 提取文章纯文本
  function extractArticleText() {
    const clone = article.cloneNode(true);
    // 移除不需要的内容
    clone.querySelectorAll(
      'script, style, .post-end-wrapper, .post-ai-description, .relatedPosts, ' +
      '.tag_share, .post-meta, .post-copyright, .post-tools, .advise, ' +
      '#pagination, .comment-container, #post-comment, figure.highlight, pre'
    ).forEach(el => el.remove());
    const title = document.querySelector('.post-title')?.textContent || document.title;
    let text = title + '\n' + clone.innerText;
    // 压缩空白
    text = text.replace(/\s+/g, ' ').trim();
    return text.substring(0, AI_CONFIG.maxWords);
  }

  // 打字机效果
  function typewriterEffect(el, text) {
    let i = 0;
    el.innerHTML = '<span class="ai-cursor"></span>';
    function type() {
      if (i < text.length) {
        el.innerHTML = text.substring(0, i + 1) + '<span class="ai-cursor"></span>';
        i++;
        // 标点符号处稍作停顿，增强阅读感
        const char = text.charAt(i - 1);
        const delay = /[，。！？、；：,.!?;:]/.test(char) ? 120 : 25;
        setTimeout(type, delay);
      } else {
        el.innerHTML = text;
      }
    }
    type();
  }

  // 生成摘要
  async function generateSummary() {
    if (isGenerating) return;
    isGenerating = true;

    // 显示 ThinkingOrb 思考动画
    showThinkingOrb(explanation);

    const text = extractArticleText();
    if (text.length < 50) {
      stopThinkingOrb();
      explanation.innerHTML = '文章内容过短，无需生成摘要。';
      isGenerating = false;
      return;
    }

    try {
      const response = await fetch(AI_CONFIG.baseURL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: AI_CONFIG.model,
          messages: [
            { role: 'system', content: AI_CONFIG.systemPrompt },
            { role: 'user', content: text }
          ],
          temperature: 0.7,
          max_tokens: 1200,
          thinking: { type: 'disabled' } // GLM 默认推理模式输出在 reasoning 字段，禁用后直接返回 content
        })
      });

      const respText = await response.text();

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${respText.substring(0, 150)}`);
      }

      // 检查是否为 HTML（Worker 域名未绑定 / 路径错误时 Cloudflare 会返回 HTML 错误页）
      if (respText.trimStart().startsWith('<')) {
        throw new Error('Worker 返回了 HTML 而非 JSON，请检查 Worker 是否部署成功、域名是否绑定、Origin 是否在白名单中');
      }

      let data;
      try {
        data = JSON.parse(respText);
      } catch (e) {
        throw new Error(`JSON 解析失败: ${respText.substring(0, 150)}`);
      }

      // 兼容 Worker 透传的上游错误
      if (data.error) {
        throw new Error(`上游错误: ${typeof data.error === 'string' ? data.error : JSON.stringify(data.error)}`);
      }

      const summary = (data.choices?.[0]?.message?.content || '').trim();

      stopThinkingOrb();

      if (summary) {
        typewriterEffect(explanation, summary);
      } else {
        explanation.innerHTML = '摘要生成失败：API 返回空内容。可点击刷新按钮重试。';
      }
    } catch (error) {
      stopThinkingOrb();
      explanation.innerHTML = `摘要生成失败：${error.message}<br>可点击右上角刷新按钮重试。`;
    } finally {
      isGenerating = false;
    }
  }

  // 延迟 1.2 秒启动，等主题 local 模式占位文字显示完毕后再接管
  setTimeout(generateSummary, 1200);

  // 拦截刷新按钮：克隆替换，清除主题绑定的事件
  if (refreshBtn) {
    const newBtn = refreshBtn.cloneNode(true);
    refreshBtn.parentNode.replaceChild(newBtn, refreshBtn);
    let rotateDeg = 0;
    newBtn.addEventListener('click', function () {
      rotateDeg += 360;
      this.style.transition = 'transform 0.5s ease';
      this.style.transform = `rotate(${rotateDeg}deg)`;
      generateSummary();
    });
  }
}

/* --------------------------------------------------------------------------
 * 3. 侧边栏日历卡片注入（单卡片垂直布局）
 *    AnZhiYu 主题没有自定义侧边栏机制，通过 JS 注入到 #aside-content
 * -------------------------------------------------------------------------- */
function injectCalendarCards() {
  const aside = document.getElementById('aside-content');
  if (!aside) return;
  if (document.getElementById('card-widget-calendar')) return;

  const card = document.createElement('div');
  card.className = 'card-widget card-widget-calendar-custom';
  card.id = 'card-widget-calendar';
  card.innerHTML = `
    <div class="item-headline">
      <i class="anzhiyufont anzhiyu-icon-calendar-day"></i>
      <span>今日日历</span>
    </div>
    <div id="calendar-header">
      <div class="cal-row">
        <div id="calendar-date"></div>
        <div class="cal-info">
          <div id="calendar-week"></div>
          <div id="calendar-solar"></div>
        </div>
      </div>
      <div id="calendar-lunar"></div>
      <div id="calendar-year-day"></div>
    </div>
    <div id="calendar-main"></div>
    <div id="schedule-countdown">
      <div class="countdown-label">距离除夕</div>
      <span class="countdown-days" id="schedule-days">-</span><span class="countdown-unit">天</span>
    </div>
    <div id="schedule-progress">
      <div class="schedule-row">
        <span class="schedule-label">本年</span>
        <div class="schedule-bar-wrap">
          <progress max="365" id="pBar_year"></progress>
        </div>
        <span class="schedule-percent" id="p_span_year">0%</span>
        <span class="schedule-remain" id="remain_year">-</span>
      </div>
      <div class="schedule-row">
        <span class="schedule-label">本月</span>
        <div class="schedule-bar-wrap">
          <progress max="30" id="pBar_month"></progress>
        </div>
        <span class="schedule-percent" id="p_span_month">0%</span>
        <span class="schedule-remain" id="remain_month">-</span>
      </div>
      <div class="schedule-row">
        <span class="schedule-label">本周</span>
        <div class="schedule-bar-wrap">
          <progress max="7" id="pBar_week"></progress>
        </div>
        <span class="schedule-percent" id="p_span_week">0%</span>
        <span class="schedule-remain" id="remain_week">-</span>
      </div>
    </div>
  `;

  // 插入到作者卡片下方
  const firstChild = aside.firstElementChild;
  if (firstChild) {
    aside.insertBefore(card, firstChild.nextSibling);
  } else {
    aside.appendChild(card);
  }

  // 等待 chinese-lunar 库加载完成后再初始化
  if (typeof chineseLunar !== 'undefined') {
    initializeCard();
  } else {
    let attempts = 0;
    const checkLunar = setInterval(() => {
      attempts++;
      if (typeof chineseLunar !== 'undefined') {
        clearInterval(checkLunar);
        initializeCard();
      } else if (attempts > 20) {
        clearInterval(checkLunar);
        initializeCard();
      }
    }, 200);
  }
}

/* --------------------------------------------------------------------------
 * 4. Mermaid 流程图渲染
 *    AnZhiYu 主题的 mermaid 只支持 {% mermaid %} 标签（.mermaid-wrap 结构）
 *    标准 markdown ```mermaid 代码块渲染为 <pre class="mermaid">，主题不处理
 *    这里通过 custom.js 动态加载 mermaid.js 并渲染标准代码块
 * -------------------------------------------------------------------------- */
const MERMAID_CDN = 'https://cdn.bootcdn.net/ajax/libs/mermaid/10.9.1/mermaid.min.js';

function initMermaid() {
  const mermaidBlocks = document.querySelectorAll('#article-container pre.mermaid, #article-container .mermaid');
  // 排除主题已处理的 .mermaid-wrap 内的元素
  const standalone = Array.from(mermaidBlocks).filter(el => !el.closest('.mermaid-wrap'));
  if (standalone.length === 0) return;

  // 防止重复加载
  if (typeof mermaid === 'undefined') {
    const script = document.createElement('script');
    script.src = MERMAID_CDN;
    script.onload = () => renderMermaid(standalone);
    document.head.appendChild(script);
  } else {
    renderMermaid(standalone);
  }
}

function renderMermaid(blocks) {
  if (typeof mermaid === 'undefined') return;

  const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
  mermaid.initialize({
    startOnLoad: false,
    theme: isDark ? 'dark' : 'default',
    securityLevel: 'loose',
    flowchart: { useMaxWidth: true, htmlLabels: true }
  });

  blocks.forEach((el, index) => {
    // 跳过已渲染的
    if (el.dataset.mermaidRendered === '1') return;
    el.dataset.mermaidRendered = '1';

    const code = el.textContent.trim();
    const id = `mermaid-svg-${index}`;

    try {
      mermaid.render(id, code).then(({ svg }) => {
        const wrapper = document.createElement('div');
        wrapper.className = 'mermaid-rendered';
        wrapper.innerHTML = svg;
        wrapper.style.textAlign = 'center';
        wrapper.style.margin = '16px 0';
        el.replaceWith(wrapper);
      }).catch(err => {
        el.innerHTML = `<code style="color:#e74c3c;">Mermaid 渲染失败: ${err.message}</code>`;
      });
    } catch (e) {
      el.innerHTML = `<code style="color:#e74c3c;">Mermaid 渲染失败: ${e.message}</code>`;
    }
  });
}

/* --------------------------------------------------------------------------
 * 5. category-bar 逐级展开交互
 *    - 鼠标进入某分类项 → 标记激活链路（该项+所有祖先），向右逐级展开子菜单
 *    - 鼠标在 #catalog-list 内移动 → 保持展开，不收缩（修复鬼畜）
 *    - 鼠标离开 #catalog-list → 全部收回
 *    - 展开后若横条溢出 → 从非激活的顶级项开始隐藏让位
 * -------------------------------------------------------------------------- */
function initCatalogBar() {
  const list = document.getElementById('catalog-list');
  if (!list) return;
  if (list.dataset.catalogInit === '1') return;
  list.dataset.catalogInit = '1';

  const bar = document.getElementById('catalog-bar');

  // 清除全部状态
  function clearAll() {
    list.querySelectorAll('.is-active, .is-collapsed').forEach(el => {
      el.classList.remove('is-active', 'is-collapsed');
    });
    if (bar) bar.classList.remove('catalog-bar-active');
  }

  // 设置激活链路：当前项 + 所有祖先 catalog-list-item
  function setActive(item) {
    if (!item || !item.classList || !item.classList.contains('catalog-list-item')) return;
    clearAll();
    let node = item;
    while (node && node !== list) {
      if (node.classList && node.classList.contains('catalog-list-item')) {
        node.classList.add('is-active');
      }
      node = node.parentElement;
    }
    // 标记整个 bar 为激活状态（隐藏"更多"按钮，避免遮挡 flyout）
    if (bar) bar.classList.add('catalog-bar-active');
    // 找到激活链路的顶级项，隐藏其右侧所有顶级项，避免遮挡 flyout
    const topItems = Array.from(list.querySelectorAll(':scope > .catalog-list-item'));
    const activeTopIndex = topItems.findIndex(it => it.classList.contains('is-active'));
    if (activeTopIndex !== -1) {
      for (let i = activeTopIndex + 1; i < topItems.length; i++) {
        topItems[i].classList.add('is-collapsed');
      }
    }
    // 补充溢出检测：若仍溢出，继续折叠非激活的左侧顶级项
    requestAnimationFrame(checkOverflow);
  }

  // 溢出处理：若 #catalog-list 内容仍超出可视宽度，折叠剩余非激活顶级项
  function checkOverflow() {
    const topItems = list.querySelectorAll(':scope > .catalog-list-item');
    if (list.scrollWidth <= list.clientWidth) return;

    for (const it of topItems) {
      if (it.classList.contains('is-active') || it.classList.contains('is-collapsed')) continue;
      it.classList.add('is-collapsed');
      if (list.scrollWidth <= list.clientWidth) return;
    }
  }

  // mouseover 冒泡：进入任意分类项（含子级）即切换激活链路
  list.addEventListener('mouseover', (e) => {
    const item = e.target.closest('.catalog-list-item');
    if (!item || !list.contains(item)) return;
    setActive(item);
  });

  // 鼠标离开整个横条 → 收回
  list.addEventListener('mouseleave', clearAll);
}

/* --------------------------------------------------------------------------
 * 2.6 加载遮罩提前隐藏
 *     主题的 #loading-box 默认等 window.load（含所有图片）才消失，
 *     这里在 DOM 就绪时立即隐藏，让用户先看到正文。
 * -------------------------------------------------------------------------- */
function hidePreloaderOverlay() {
  const box = document.getElementById('loading-box');
  if (box && !box.classList.contains('loaded')) box.classList.add('loaded');
}

/* --------------------------------------------------------------------------
 * 2.7 图片懒加载 Shimmer 流光占位动画
 *     图床不稳定时图片加载慢，shimmer 流光占位提示用户"图片正在加载"。
 *     覆盖文章封面、正文图片、缩略图等所有懒加载图片。
 *     纯 CSS 动画（渐变位移），GPU 加速，零 JS 动画开销。
 * -------------------------------------------------------------------------- */
function initImageShimmer() {
  document.querySelectorAll('img[data-lazy-src]').forEach(attachShimmer);
}

function attachShimmer(img) {
  if (img.dataset.shimmer === '1') return;
  if (img.classList.contains('loaded')) return; // 已加载完成跳过
  img.dataset.shimmer = '1';

  // 跳过绝对/固定定位的图片：包裹层 position:relative 会成为新包含块，
  // 破坏其定位（如顶部 banner todayCard-cover、侧栏头像等）
  const imgPos = getComputedStyle(img).position;
  if (imgPos === 'absolute' || imgPos === 'fixed') return;

  // 若图片已被主题包进 fancybox 链接，则包住链接本身，不破坏结构
  let target = img;
  const parent = img.parentNode;
  if (parent && parent.tagName === 'A' && parent.hasAttribute('data-fancybox')) {
    target = parent;
  }
  if (target.parentNode && target.parentNode.classList.contains('lum-img-shimmer')) return;

  // 创建包裹层
  const wrap = document.createElement('span');
  wrap.className = 'lum-img-shimmer';
  target.parentNode.insertBefore(wrap, target);
  wrap.appendChild(target);

  // 添加 shimmer 覆盖层
  const overlay = document.createElement('span');
  overlay.className = 'lum-shimmer-overlay';
  wrap.appendChild(overlay);

  const removeShimmer = () => {
    if (overlay && overlay.parentNode) overlay.remove();
    // 延迟移除包裹层 class，让图片过渡自然
    setTimeout(() => {
      if (wrap && wrap.classList) wrap.classList.add('lum-shimmer-done');
    }, 100);
  };

  // 图片加载成功/失败后移除 shimmer
  img.addEventListener('load', removeShimmer, { once: true });
  img.addEventListener('error', removeShimmer, { once: true });

  // 兜底：vanilla-lazyload 加载后会给 img 加 .loaded
  const poll = setInterval(() => {
    if (img.classList.contains('loaded')) {
      clearInterval(poll);
      removeShimmer();
    }
  }, 200);

  // 最久 15s 强制移除，避免 shimmer 常驻
  setTimeout(() => { clearInterval(poll); removeShimmer(); }, 15000);
}

/* --------------------------------------------------------------------------
 * 6. 访客 IP 归属地展示卡片
 *    使用 ip.sb JSONP API 获取访客 IP 和地理位置信息
 *    注入到侧边栏，显示 IP 地址（模糊）+ 归属地 + 距离 + 时段问候
 * -------------------------------------------------------------------------- */
const IP_CACHE_KEY = 'lum_ip_info_cache';
const IP_CACHE_DURATION = 1000 * 60 * 30; // 30 分钟缓存

function injectVisitorCard() {
  const aside = document.getElementById('aside-content');
  if (!aside) return;
  if (document.getElementById('card-widget-visitor')) return;

  const card = document.createElement('div');
  card.className = 'card-widget card-widget-visitor';
  card.id = 'card-widget-visitor';
  card.innerHTML = `
    <div class="item-headline">
      <i class="anzhiyufont anzhiyu-icon-location-dot"></i>
      <span>访客信息</span>
    </div>
    <div id="visitor-info">
      <div class="visitor-loading">
        <div class="visitor-spinner"></div>
        <span>正在获取访客信息...</span>
      </div>
    </div>
  `;

  // 插入到日历卡片下方（如果日历卡片存在）
  const calendarCard = document.getElementById('card-widget-calendar');
  if (calendarCard) {
    calendarCard.parentNode.insertBefore(card, calendarCard.nextSibling);
  } else {
    const firstChild = aside.firstElementChild;
    if (firstChild) aside.insertBefore(card, firstChild.nextSibling);
    else aside.appendChild(card);
  }

  fetchVisitorInfo();
}

function fetchVisitorInfo() {
  // 检查缓存
  const cached = localStorage.getItem(IP_CACHE_KEY);
  if (cached) {
    try {
      const { data, timestamp } = JSON.parse(cached);
      if (Date.now() - timestamp < IP_CACHE_DURATION) {
        showVisitorInfo(data);
        return;
      }
    } catch (e) {}
  }

  // JSONP 调用 ip.sb geoip API
  const callbackName = 'lum_geoip_cb_' + Date.now();
  window[callbackName] = function(data) {
    delete window[callbackName];
    document.getElementById('lum-ip-script')?.remove();
    if (data) {
      const info = {
        ip: data.ip || '未知',
        country: data.country || '',
        countryCode: data.country_code || '',
        city: data.city || '',
        region: data.region || '',
        isp: data.isp || data.organization || ''
      };
      localStorage.setItem(IP_CACHE_KEY, JSON.stringify({ data: info, timestamp: Date.now() }));
      showVisitorInfo(info);
    } else {
      showVisitorError();
    }
  };

  const script = document.createElement('script');
  script.id = 'lum-ip-script';
  script.src = `https://api.ip.sb/geoip?callback=${callbackName}`;
  script.onerror = () => {
    delete window[callbackName];
    document.getElementById('lum-ip-script')?.remove();
    showVisitorError();
  };
  document.head.appendChild(script);
}

function showVisitorInfo(info) {
  const container = document.getElementById('visitor-info');
  if (!container) return;

  // 判断是否中国用户
  const isCN = info.countryCode === 'CN' || info.country === 'China' || info.country === '中国';

  // 时段问候
  const hour = new Date().getHours();
  let greeting;
  if (hour < 6) greeting = '凌晨好，还在修仙吗？';
  else if (hour < 9) greeting = '早上好，一日之计在于晨';
  else if (hour < 12) greeting = '上午好，工作顺利嘛？';
  else if (hour < 14) greeting = '中午好，午休时间到啦';
  else if (hour < 17) greeting = '下午好，饮茶先啦';
  else if (hour < 19) greeting = '傍晚好，记得按时吃饭';
  else if (hour < 22) greeting = '晚上好，放松一下吧';
  else greeting = '夜深了，早点休息';

  const location = [info.country, info.region, info.city].filter(Boolean).join(' · ') || '未知地区';

  container.innerHTML = `
    <div class="visitor-info-content">
      <div class="visitor-row">
        <span class="visitor-label">归属地</span>
        <span class="visitor-value">${location}</span>
      </div>
      <div class="visitor-row">
        <span class="visitor-label">IP 地址</span>
        <span class="visitor-value ip-address">${escapeHTML(info.ip)}</span>
      </div>
      ${info.isp ? `<div class="visitor-row"><span class="visitor-label">运营商</span><span class="visitor-value">${escapeHTML(info.isp)}</span></div>` : ''}
      <div class="visitor-greeting">${greeting}</div>
      ${isCN ? '<div class="visitor-note">你来自中国大陆，部分外源内容可能受网络影响</div>' : ''}
    </div>
  `;
}

function showVisitorError() {
  const container = document.getElementById('visitor-info');
  if (!container) return;
  container.innerHTML = `
    <div class="visitor-error">
      <div class="visitor-error-icon">📡</div>
      <p>获取访客信息失败</p>
      <p class="visitor-retry">点击<span class="visitor-retry-btn">重试</span></p>
    </div>
  `;
  const retryBtn = container.querySelector('.visitor-retry-btn');
  if (retryBtn) {
    retryBtn.onclick = () => {
      container.innerHTML = '<div class="visitor-loading"><div class="visitor-spinner"></div><span>正在获取...</span></div>';
      localStorage.removeItem(IP_CACHE_KEY);
      fetchVisitorInfo();
    };
  }
}

function escapeHTML(str) {
  if (!str) return '';
  return str.replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}

/* --------------------------------------------------------------------------
 * 7. YouTube 视频智能降级提示
 *    检测 YouTube iframe 加载失败，根据用户所在地区显示不同提示。
 *    中国用户：提示 GFW 网络原因
 *    国外用户：提示检查网络或视频可能下架
 *    加载失败时显示 YouTube logo + 友好提示替代 404 页面
 * -------------------------------------------------------------------------- */
function initYouTubeFallback() {
  const iframes = document.querySelectorAll('iframe[src*="youtube.com/embed"]');
  iframes.forEach(iframe => {
    if (iframe.dataset.ytFallback === '1') return;
    iframe.dataset.ytFallback = '1';

    // 判断是否中国用户（用 IP 缓存）
    let isCN = false;
    try {
      const cached = JSON.parse(localStorage.getItem(IP_CACHE_KEY) || '{}');
      if (cached.data && (cached.data.countryCode === 'CN' || cached.data.country === 'China')) isCN = true;
    } catch (e) {}

    const videoId = extractYouTubeId(iframe.src || '');
    let resolved = false;      // 是否已做出最终判断（避免重复降级）

    // iframe 自身 error 事件（直接降级，不依赖 load 事件避免错过 pjax 后的 load）
    iframe.addEventListener('error', () => {
      if (!resolved) { resolved = true; showYouTubeFallback(iframe, isCN, videoId); }
    });

    // 主检测：主动探测 youtube 域名可达性
    // GFW 封锁 youtube 整个域名，用 Image 加载 favicon 可可靠判断
    // 不依赖 iframe 的 load 事件（被墙时浏览器可能触发 load 加载错误页，导致漏判）
    const probe = new Image();
    probe.onload = () => {
      if (resolved) return;
      resolved = true;
      // YouTube 可达（国外正常网络），正常显示 iframe
    };
    probe.onerror = () => {
      if (resolved) return;
      resolved = true;
      showYouTubeFallback(iframe, isCN, videoId); // GFW 不可达，立即降级
    };

    // 探测 4s 超时 → 视为不可达（GFW DNS 失败很快，4s 足够兜底）
    setTimeout(() => {
      if (!resolved) {
        resolved = true;
        showYouTubeFallback(iframe, isCN, videoId);
      }
    }, 4000);

    // 加时间戳防止缓存
    probe.src = 'https://www.youtube.com/favicon.ico?v=' + Date.now();
  });
}

function showYouTubeFallback(iframe, isCN, videoId) {
  const container = iframe.closest('.video-container') || iframe.parentElement;
  if (!container || container.dataset.ytReplaced === '1') return;
  container.dataset.ytReplaced = '1';

  const originalSrc = iframe.src || '';
  const vid = videoId || extractYouTubeId(originalSrc);

  const fallback = document.createElement('div');
  fallback.className = 'yt-fallback';
  fallback.innerHTML = `
    <div class="yt-fallback-logo">
      <svg width="48" height="34" viewBox="0 0 28 20" xmlns="http://www.w3.org/2000/svg">
        <path d="M27.4 3.1c-.3-1.2-1.3-2.2-2.5-2.5C22.8 0 14 0 14 0S5.2 0 3.1.6C1.9.9.9 1.9.6 3.1 0 5.2 0 10 0 10s0 4.8.6 6.9c.3 1.2 1.3 2.2 2.5 2.5C5.2 20 14 20 14 20s8.8 0 10.9-.6c1.2-.3 2.2-1.3 2.5-2.5.6-2.1.6-6.9.6-6.9s0-4.8-.6-6.9z" fill="#FF0000"/>
        <path d="M11.2 14.3L18.5 10l-7.3-4.3v8.6z" fill="#fff"/>
      </svg>
    </div>
    <div class="yt-fallback-text">
      ${isCN
        ? '<strong>该视频来自 YouTube</strong><br>当前网络环境下可能无法正常访问 YouTube，请检查网络代理设置或使用科学上网工具后刷新页面。'
        : '<strong>该视频来自 YouTube</strong><br>视频加载失败，请检查网络连接是否正常，或该视频可能已被下架。'
      }
    </div>
    ${vid ? `<a class="yt-fallback-link" href="https://www.youtube.com/watch?v=${vid}" target="_blank" rel="noopener">在 YouTube 上观看</a>` : ''}
  `;

  iframe.style.display = 'none';
  container.appendChild(fallback);
}

function extractYouTubeId(url) {
  const match = url.match(/\/embed\/([^?]+)/);
  return match ? match[1] : '';
}

/* --------------------------------------------------------------------------
 * 初始化
 * -------------------------------------------------------------------------- */
document.addEventListener('DOMContentLoaded', () => {
  hidePreloaderOverlay();
  injectPostEnd();
  hijackRewardButton();
  initAISummary();
  injectCalendarCards();
  initMermaid();
  initCatalogBar();
  initImageShimmer();
  injectVisitorCard();
  initYouTubeFallback();
});
document.addEventListener('pjax:success', () => {
  hidePreloaderOverlay();
  injectPostEnd();
  hijackRewardButton();
  initAISummary();
  setTimeout(injectCalendarCards, 50);
  setTimeout(initMermaid, 100);
  initCatalogBar();
  setTimeout(initImageShimmer, 50);
  setTimeout(injectVisitorCard, 100);
  setTimeout(initYouTubeFallback, 100);
});
