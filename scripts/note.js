/**
 * note.js | 移植自 NexT 主题的 note 标签
 * 用法:
 *   {% note [info|warning|success|default|primary|danger|no-icon] %} ... {% endnote %}
 *   {% note "标题" [info|warning|...] %} ... {% endnote %}
 */

'use strict';

function noteTag(args, content) {
  const keywords = ['default', 'primary', 'info', 'success', 'warning', 'danger', 'no-icon'];
  const className = [];
  for (let i = 0; i < 2; i++) {
    if (keywords.includes(args[0])) {
      className.push(args.shift());
    } else {
      break;
    }
  }

  content = hexo.render.renderSync({ text: content, engine: 'markdown' });
  if (args.length === 0) {
    return `<div class="note ${className.join(' ')}">${content}</div>`;
  }
  return `<details class="note ${className.join(' ')}"><summary>${hexo.render.renderSync({ text: args.join(' '), engine: 'markdown' })}</summary>
${content}
</details>`;
}

hexo.extend.tag.register('note', noteTag, { ends: true });
