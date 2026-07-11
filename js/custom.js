/* ==========================================================================
 * Lumoes Blog - custom.js (AnZhiYu 主题适配版)
 * 仅保留 THE END + CTA 按钮注入（波浪/JSON-LD/shuoshuo AnZhiYu 已内置）
 * ========================================================================== */

/* --------------------------------------------------------------------------
 * 文章结尾 "THE END" + CTA 按钮注入
 * AnZhiYu 文章容器: #article-container
 * -------------------------------------------------------------------------- */
function injectPostEnd() {
    const article = document.querySelector('#article-container');
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

document.addEventListener('DOMContentLoaded', injectPostEnd);
document.addEventListener('pjax:success', injectPostEnd);
