/**
 * ============================================================
 *  blog-counter 前端脚本 — 替代不蒜子
 * ============================================================
 *
 *  为什么需要它：
 *    主题原生的不蒜子（busuanzi.ibruce.info）服务端已长期不可用，
 *    而主题加载的 JS 因 CDN 缓存仍能成功，导致「脚本加载成功但数字一直转圈」。
 *    本脚本对接自建 Worker（Cloudflare Workers + D1），并做了超时降级：
 *    请求失败时把转圈图标替换为占位符，绝不会无限转圈。
 *
 *  对接的后端：
 *    POST {API}/hit  { path } → { site_pv, site_uv, page_pv, today_pv, today_uv }
 *
 *  填充的元素（主题原生 ID，无需改动主题模板）：
 *    #busuanzi_value_site_pv   站点总访问量
 *    #busuanzi_value_site_uv   站点总访客数
 *    #busuanzi_value_page_pv   本页阅读量
 *
 *  加载方式：在 _config.anzhiyu.yml 中设置
 *    asset.busuanzi: /js/blog-counter.js
 *  主题会在 busuanzi 开关打开时引入该脚本（带 data-pjax，pjax 跳转后重新执行）。
 * ============================================================
 */

(function () {
  'use strict';

  // ----------------------------------------------------------
  // 配置
  // ----------------------------------------------------------

  /** 统计 API 地址（自定义域名，workers.dev 默认域名已停用） */
  var API = window.LUM_COUNTER_API || 'https://blog-counter.646474.xyz';

  /** 请求超时（毫秒）。超过即视为失败并走降级，避免一直转圈 */
  var TIMEOUT_MS = 6000;

  /** 失败时显示的占位符 */
  var FALLBACK_TEXT = '—';

  /** 同一路径在此时间窗内重复触发视为同一次访问（防止脚本重执行导致重复计数） */
  var DEDUP_WINDOW_MS = 1500;

  /** API 字段 → 页面元素 ID */
  var FIELDS = [
    ['site_pv', 'busuanzi_value_site_pv'],
    ['site_uv', 'busuanzi_value_site_uv'],
    ['page_pv', 'busuanzi_value_page_pv'],
  ];

  // ----------------------------------------------------------
  // 内部状态
  // ----------------------------------------------------------

  var lastPath = null;
  var lastAt = 0;
  var inFlight = false;

  // ----------------------------------------------------------
  // 工具
  // ----------------------------------------------------------

  /** 页面路径（不含域名与查询串），与后端 normalizePath 保持一致 */
  function currentPath() {
    var p = location.pathname || '/';
    if (p.length > 200) p = p.slice(0, 200);
    return p || '/';
  }

  /** 找出当前页面上真实存在的目标元素 */
  function targetElements() {
    var found = [];
    for (var i = 0; i < FIELDS.length; i++) {
      var el = document.getElementById(FIELDS[i][1]);
      if (el) found.push({ field: FIELDS[i][0], el: el });
    }
    return found;
  }

  /**
   * 写入数值。
   * 用 textContent 而非 innerText：会整体替换掉里面的转圈图标 <i>，
   * 这正是我们想要的（加载完成后不应该再留 spinner）。
   */
  function render(el, value) {
    if (!el) return;
    el.textContent = String(value);
    el.classList.add('lum-counter-done');
  }

  /** 失败降级：显示占位符并标注原因，绝不留下转圈 */
  function renderFallback(el, reason) {
    if (!el) return;
    el.textContent = FALLBACK_TEXT;
    el.classList.add('lum-counter-failed');
    el.setAttribute('title', '访问统计暂不可用（' + reason + '）');
  }

  // ----------------------------------------------------------
  // 主流程
  // ----------------------------------------------------------

  function collectAndRender(data) {
    var targets = targetElements();
    if (!targets.length) return false;
    for (var i = 0; i < targets.length; i++) {
      var t = targets[i];
      var v = data ? data[t.field] : null;
      if (typeof v === 'number' && isFinite(v)) {
        render(t.el, v);
      } else if (data) {
        // 接口成功但缺少该字段（例如文章页没有 page_pv），不显示占位符，保持原样
        continue;
      } else {
        renderFallback(t.el, '请求失败');
      }
    }
    return true;
  }

  function fallbackAll(reason) {
    var targets = targetElements();
    for (var i = 0; i < targets.length; i++) renderFallback(targets[i].el, reason);
  }

  function count() {
    var targets = targetElements();
    // 页面上没有统计元素（例如没开启该项）就不发请求
    if (!targets.length) return;

    // 预渲染 / 后台标签页不计入
    if (document.prerendering || document.visibilityState === 'hidden') {
      fallbackAll('页面未激活');
      return;
    }

    var path = currentPath();
    var now = Date.now();
    // 防重复：pjax 跳转与脚本重执行可能同时触发同一路径
    if (path === lastPath && now - lastAt < DEDUP_WINDOW_MS) return;
    if (inFlight) return;
    lastPath = path;
    lastAt = now;
    inFlight = true;

    // AbortController 做硬超时 —— 这是「不再无限转圈」的关键
    var controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
    var timer = setTimeout(function () {
      if (controller) controller.abort();
    }, TIMEOUT_MS);

    fetch(API + '/hit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ path: path }),
      signal: controller ? controller.signal : undefined,
    })
      .then(function (res) {
        if (!res.ok) throw new Error('HTTP ' + res.status);
        return res.json();
      })
      .then(function (data) {
        clearTimeout(timer);
        inFlight = false;
        collectAndRender(data);
      })
      .catch(function (err) {
        clearTimeout(timer);
        inFlight = false;
        var reason = err && err.name === 'AbortError' ? '请求超时' : '网络错误';
        console.warn('[blog-counter]', reason, err && err.message ? err.message : '');
        fallbackAll(reason);
      });
  }

  // ----------------------------------------------------------
  // 启动与 pjax 支持
  // ----------------------------------------------------------

  // 首屏
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', count);
  } else {
    count();
  }

  // pjax 跳转后重新计数并填充新 DOM 里的元素。
  // 脚本本身带 data-pjax 也会被重新执行，靠上面的 DEDUP_WINDOW_MS 防重复。
  document.addEventListener('pjax:complete', function () {
    count();
  });
})();
