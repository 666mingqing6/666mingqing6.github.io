/* ==========================================================================
 * Lumoes Blog - custom.js
 * 合并自原 NexT 主题的自定义 JS：
 *   - custom.js: Pjax 切换时销毁 APlayer
 *   - head.njk:   文章页 JSON-LD (BlogPosting) 动态生成
 *   - body-end.njk: 朋友圈 (shuoshuo) 展开/收起
 *   - post-body-end.njk: 文章结尾 "THE END" 分割线与赞助按钮注入
 *
 * Solitude 已通过 _config.solitude.yml 的 extends 引入本文件
 * ========================================================================== */

/* --------------------------------------------------------------------------
 * 1. Pjax 切换时销毁 APlayer
 * -------------------------------------------------------------------------- */
document.addEventListener('pjax:start', function () {
    if (window.aplayers) {
        for (let i = 0; i < window.aplayers.length; i++) {
            window.aplayers[i].destroy();
        }
        window.aplayers = [];
    }
});

/* --------------------------------------------------------------------------
 * 2. 朋友圈 / 碎碎念 展开-收起（来自原 body-end.njk）
 * -------------------------------------------------------------------------- */
function initShuoshuo() {
    // 如果是 life 页面，强制收起 TOC
    if (document.querySelector('.shuoshuo-item')) {
        document.querySelectorAll('.sidebar-nav-toc, .post-toc-wrap').forEach(el => {
            el.style.display = 'none';
        });
        const overviewTab = document.querySelector('.sidebar-nav-overview');
        if (overviewTab) {
            overviewTab.click();
            overviewTab.style.width = '100%';
            overviewTab.style.borderRight = 'none';
        }
    }

    const checkHeight = (item, content, btn) => {
        if (content.scrollHeight > 305) {
            item.classList.add('is-long');
            btn.style.display = 'block';
            btn.onclick = (e) => {
                e.preventDefault();
                if (item.classList.contains('expanded')) {
                    item.classList.remove('expanded');
                    btn.innerHTML = '展开阅读全文 <i class="fa fa-angle-down"></i>';
                    const rect = item.getBoundingClientRect();
                    if (rect.top < 0) {
                        item.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    }
                } else {
                    item.classList.add('expanded');
                    btn.innerHTML = '收起全文 <i class="fa fa-angle-up"></i>';
                }
            };
        } else {
            item.classList.remove('is-long');
            btn.style.display = 'none';
        }
    };

    const items = document.querySelectorAll('.shuoshuo-item');
    items.forEach(item => {
        const content = item.querySelector('.shuoshuo-content');
        const btn = item.querySelector('.shuoshuo-expand-btn');
        if (!content || !btn) return;

        checkHeight(item, content, btn);

        content.querySelectorAll('img').forEach(img => {
            if (img.complete) {
                checkHeight(item, content, btn);
            } else {
                img.addEventListener('load', () => checkHeight(item, content, btn));
            }
        });

        if (window.ResizeObserver) {
            const ro = new ResizeObserver(() => checkHeight(item, content, btn));
            ro.observe(content);
        }
    });
}

document.addEventListener('DOMContentLoaded', initShuoshuo);
document.addEventListener('pjax:success', initShuoshuo);

/* --------------------------------------------------------------------------
 * 3. 文章页 JSON-LD 动态生成（来自原 head.njk）
 * -------------------------------------------------------------------------- */
(function injectBlogPostingJSONLD() {
    const isPost = document.body && (document.body.dataset.type === 'post'
        || document.querySelector('article.article'))
        || /^\/post\//.test(location.pathname)
        || document.querySelector('meta[property="og:type"][content="article"]');
    if (!isPost) return;

    const ld = {
        "@context": "https://schema.org",
        "@type": "BlogPosting",
        "headline": (document.querySelector('meta[property="og:title"]') || {}).content
            || document.title,
        "image": (document.querySelector('meta[property="og:image"]') || {}).content
            || (location.origin + '/images/avatar.png'),
        "author": {
            "@type": "Person",
            "name": "Re.Lumoes"
        },
        "publisher": {
            "@type": "Organization",
            "name": "Lumoes Blog",
            "logo": {
                "@type": "ImageObject",
                "url": location.origin + "/images/avatar.png"
            }
        },
        "datePublished": (document.querySelector('meta[property="article:published_time"]') || {}).content
            || (document.querySelector('time') || {}).dateTime
    };

    const s = document.createElement('script');
    s.type = 'application/ld+json';
    s.textContent = JSON.stringify(ld, null, 2);
    document.head.appendChild(s);
})();

/* --------------------------------------------------------------------------
 * 4. 文章结尾 "THE END" + 赞助按钮 注入（来自原 post-body-end.njk）
 * -------------------------------------------------------------------------- */
(function injectPostEnd() {
    const article = document.querySelector('.article-container, .post-content, article.article');
    if (!article) return;

    // 防止重复注入
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
                <i class="fa fa-quote-left" style="opacity: 0.3;"></i>
                感谢你能看到这里，如果你觉得我的博文写的还不错，请评论、转发或者赞助支持一下。
                <i class="fa fa-quote-right" style="opacity: 0.3;"></i>
            </p>
            <a href="/donate/" class="donate-btn">
                <i class="fa fa-coffee"></i> 前往赞助页面
            </a>
            <p class="sponsor-thanks">
                这些是我继续创作的最大动力，请多多支持，谢谢大家！
            </p>
        </div>
    `;
    article.appendChild(wrapper);
})();

/* --------------------------------------------------------------------------
 * 5. Pjax 后重新执行 post-end 注入
 * -------------------------------------------------------------------------- */
document.addEventListener('pjax:success', () => {
    const fn = arguments.callee;
    // 直接重跑一次即可（内部有防重复判断）
    const article = document.querySelector('.article-container, .post-content, article.article');
    if (!article || document.querySelector('.post-end-wrapper')) return;
    const wrapper = document.createElement('div');
    wrapper.className = 'post-end-wrapper';
    wrapper.style.marginTop = '1px';
    wrapper.innerHTML = `
        <div class="end-separator">
            <span>THE END</span>
        </div>
        <div align="center" class="sponsor-container">
            <p class="sponsor-desc">
                <i class="fa fa-quote-left" style="opacity: 0.3;"></i>
                感谢你能看到这里，如果你觉得我的博文写的还不错，请评论、转发或者赞助支持一下。
                <i class="fa fa-quote-right" style="opacity: 0.3;"></i>
            </p>
            <a href="/donate/" class="donate-btn">
                <i class="fa fa-coffee"></i> 前往赞助页面
            </a>
            <p class="sponsor-thanks">
                这些是我继续创作的最大动力，请多多支持，谢谢大家！
            </p>
        </div>
    `;
    article.appendChild(wrapper);
});
