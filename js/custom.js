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
  baseURL: 'https://ai.646474.xyz',  // Cloudflare Worker 地址（部署后替换为实际地址）
  model: 'kat-coder-pro-v2.5',
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

    // 显示加载动画
    let dotCount = 0;
    explanation.innerHTML = 'AI 正在生成摘要<span class="ai-cursor"></span>';
    const loadingTimer = setInterval(() => {
      dotCount = (dotCount % 3) + 1;
      explanation.innerHTML = 'AI 正在生成摘要' + '.'.repeat(dotCount) + '<span class="ai-cursor"></span>';
    }, 500);

    const text = extractArticleText();
    if (text.length < 50) {
      clearInterval(loadingTimer);
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
          max_tokens: 300
        })
      });

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(`API ${response.status}: ${errText.substring(0, 100)}`);
      }

      const data = await response.json();
      const summary = (data.choices?.[0]?.message?.content || '').trim();

      clearInterval(loadingTimer);

      if (summary) {
        typewriterEffect(explanation, summary);
      } else {
        explanation.innerHTML = '摘要生成失败：API 返回空内容。可点击刷新按钮重试。';
      }
    } catch (error) {
      clearInterval(loadingTimer);
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
 * 初始化
 * -------------------------------------------------------------------------- */
document.addEventListener('DOMContentLoaded', () => {
  injectPostEnd();
  hijackRewardButton();
  initAISummary();
  injectCalendarCards();
  initMermaid();
});
document.addEventListener('pjax:success', () => {
  injectPostEnd();
  hijackRewardButton();
  initAISummary();
  setTimeout(injectCalendarCards, 50);
  setTimeout(initMermaid, 100);
});
