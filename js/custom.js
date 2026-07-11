/* ==========================================================================
 * Lumoes Blog - custom.js (AnZhiYu 主题适配版)
 * 1. THE END + CTA 按钮注入
 * 2. AI 摘要自动生成（接管主题 local 模式，调用 OpenAI 兼容 API）
 * ========================================================================== */

/* --------------------------------------------------------------------------
 * AI 摘要配置
 * 注意：API Key 会暴露在前端，请勿用于生产环境或使用有额度限制的 Key
 * -------------------------------------------------------------------------- */
const AI_CONFIG = {
  baseURL: 'https://api.iamhc.cn/v1',
  apiKey: 'sk-iQCthadul2uO6t2IBoYHiKqt4uv6W5oJs19J6gqN7ZHSlZad',
  model: 'Qwen3.6-35B-A3B',
  maxWords: 1500,                                // 截取文章前 1500 字发给 API
  systemPrompt: '你是一个博客文章摘要生成助手。请根据用户提供的文章内容，生成一段简洁、准确、有吸引力的中文摘要，字数在100-200字之间。只输出摘要正文，不要加"摘要："等前缀，不要使用 markdown 格式，不要换行。'
};

/* --------------------------------------------------------------------------
 * 1. 文章结尾 "THE END" + CTA 按钮注入
 * -------------------------------------------------------------------------- */
function injectPostEnd() {
  const article = document.querySelector('#article-container');
  if (!article) return;
  if (document.querySelector('.post-end-wrapper')) return;

  const wrapper = document.createElement('div');
  wrapper.className = 'post-end-wrapper';
  wrapper.style.marginTop = '1px';
  wrapper.innerHTML = `
      <div class="end-separator">
          <span>THE END</span>
      </div>
      <div align="center" class="sponsor-container">
          <p class="sponsor-desc">
              <i class="anzhiyufont anzhiyu-icon-quote-left" style="opacity: 0.3;"></i>
              感谢你能看到这里！如果这篇文章对你有帮助，欢迎评论留言、点赞转发，或赞助支持一下。
              <i class="anzhiyufont anzhiyu-icon-quote-right" style="opacity: 0.3;"></i>
          </p>
          <div class="cta-btn-group">
              <a href="/donate/" class="cta-btn cta-btn-donate">
                  <i class="anzhiyufont anzhiyu-icon-coffee"></i> 赞助支持
              </a>
              <a href="#post-comment" class="cta-btn cta-btn-comment" onclick="setTimeout(()=>{const c=document.getElementById('post-comment')||document.querySelector('.comment-container');if(c)c.scrollIntoView({behavior:'smooth'})},100)">
                  <i class="anzhiyufont anzhiyu-icon-message"></i> 评论留言
              </a>
              <a href="javascript:void(0)" class="cta-btn cta-btn-share" onclick="if(navigator.share){navigator.share({title:document.title,url:location.href})}else{navigator.clipboard.writeText(location.href);anzhiyu.snackbarShow('链接已复制，快去分享吧！')}">
                  <i class="anzhiyufont anzhiyu-icon-share"></i> 分享文章
              </a>
          </div>
          <p class="sponsor-thanks">
              这些是我继续创作的最大动力，请多多支持，谢谢大家！
          </p>
      </div>
  `;
  article.appendChild(wrapper);
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
      const response = await fetch(`${AI_CONFIG.baseURL}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${AI_CONFIG.apiKey}`
        },
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
 * 3. 侧边栏日历 + 进度条卡片注入
 *    AnZhiYu 主题没有自定义侧边栏机制，通过 JS 注入到 #aside-content
 * -------------------------------------------------------------------------- */
function injectCalendarCards() {
  const aside = document.getElementById('aside-content');
  if (!aside) return;
  if (document.getElementById('card-widget-calendar')) return;

  const calendarCard = document.createElement('div');
  calendarCard.className = 'card-widget card-widget-calendar-custom';
  calendarCard.id = 'card-widget-calendar';
  calendarCard.innerHTML = `
    <div class="item-headline">
      <i class="anzhiyufont anzhiyu-icon-calendar-day"></i>
      <span>今日日历</span>
    </div>
    <div class="item-content">
      <div id="calendar-area-left">
        <div id="calendar-week"></div>
        <div id="calendar-date" style="font-size: 48px;"></div>
        <div id="calendar-solar"></div>
        <div id="calendar-lunar"></div>
      </div>
      <div id="calendar-area-right">
        <div id="calendar-main"></div>
      </div>
    </div>
  `;

  const scheduleCard = document.createElement('div');
  scheduleCard.className = 'card-widget card-widget-schedule-custom';
  scheduleCard.id = 'card-widget-schedule';
  scheduleCard.innerHTML = `
    <div class="item-headline">
      <i class="anzhiyufont anzhiyu-icon-calendar-check"></i>
      <span>时光进度</span>
    </div>
    <div class="item-content">
      <div id="schedule-area-left">
        <div id="schedule-title">距离除夕</div>
        <div id="schedule-days"></div>
        <div id="schedule-date"></div>
      </div>
      <div id="schedule-area-right">
        <div class="schedule-r0">
          <div class="schedule-d0">本年</div>
          <div class="schedule-d1">
            <span id="p_span_year" class="aside-span1"></span>
            <span class="aside-span2">还剩<a></a>天</span>
            <progress max="365" id="pBar_year"></progress>
          </div>
        </div>
        <div class="schedule-r1">
          <div class="schedule-d0">本月</div>
          <div class="schedule-d1">
            <span id="p_span_month" class="aside-span1"></span>
            <span class="aside-span2">还剩<a></a>天</span>
            <progress max="30" id="pBar_month"></progress>
          </div>
        </div>
        <div class="schedule-r2">
          <div class="schedule-d0">本周</div>
          <div class="schedule-d1">
            <span id="p_span_week" class="aside-span1"></span>
            <span class="aside-span2">还剩<a></a>天</span>
            <progress max="7" id="pBar_week"></progress>
          </div>
        </div>
      </div>
    </div>
  `;

  // 插入到作者卡片下方（第一个子元素之后）
  const firstChild = aside.firstElementChild;
  if (firstChild) {
    aside.insertBefore(scheduleCard, firstChild.nextSibling);
    aside.insertBefore(calendarCard, scheduleCard);
  } else {
    aside.appendChild(calendarCard);
    aside.appendChild(scheduleCard);
  }

  // 等待 chinese-lunar 库加载完成后再初始化
  if (typeof chineseLunar !== 'undefined') {
    initializeCard();
  } else {
    // 轮询等待 chineseLunar 加载
    let attempts = 0;
    const checkLunar = setInterval(() => {
      attempts++;
      if (typeof chineseLunar !== 'undefined') {
        clearInterval(checkLunar);
        initializeCard();
      } else if (attempts > 20) {
        clearInterval(checkLunar);
        initializeCard(); // 仍然尝试初始化（会显示"农历加载失败"）
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
  initAISummary();
  injectCalendarCards();
  initMermaid();
});
document.addEventListener('pjax:success', () => {
  injectPostEnd();
  initAISummary();
  setTimeout(injectCalendarCards, 50);
  setTimeout(initMermaid, 100);
});
