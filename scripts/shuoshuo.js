'use strict';

/**
 * Shuoshuo Tag Plugin (V3)
 * Usage: {% shuoshuo "date" "mood" "weather" "title" %} Content... {% endshuoshuo %}
 */

const weatherIcons = {
  '晴': 'fa-sun',
  '云': 'fa-cloud-sun',
  '多云': 'fa-cloud-sun',
  '阴': 'fa-cloud',
  '雨': 'fa-cloud-showers-heavy',
  '雪': 'fa-snowflake',
  '风': 'fa-wind',
  '雷': 'fa-bolt',
  '雾': 'fa-smog'
};

function getWeatherIcon(weather) {
  if (!weather) return 'fa-cloud-sun'; // 默认图标
  for (let key in weatherIcons) {
    if (weather.includes(key)) {
      return weatherIcons[key];
    }
  }
  return 'fa-cloud-sun'; // 匹配不到时返回默认
}

hexo.extend.tag.register('shuoshuo', function(args, content) {
  const date = args[0] || '';
  const mood = args[1] || '';
  const weather = args[2] || '';
  const title = args[3] || '';
  
  const weatherIcon = getWeatherIcon(weather);
  
  // 使用 hexo 的渲染引擎处理 markdown 内容
  const renderedContent = hexo.render.renderSync({ text: content, engine: 'markdown' });
  
  let headerHtml = '';
  if (date || mood || weather) {
    headerHtml = `
      <div class="shuoshuo-meta">
        ${date ? `<span class="shuoshuo-date"><i class="fa fa-calendar-alt"></i> ${date}</span>` : ''}
        ${mood ? `<span class="shuoshuo-mood">${mood}</span>` : ''}
        ${weather ? `<span class="shuoshuo-weather"><i class="fa ${weatherIcon}"></i> ${weather}</span>` : ''}
      </div>
    `;
  }

  const titleHtml = title ? `<div class="shuoshuo-title">${title}</div>` : '';
  
  return `
    <div class="shuoshuo-item">
      <div class="shuoshuo-header">
        ${headerHtml}
        ${titleHtml}
      </div>
      <div class="shuoshuo-body">
        <div class="shuoshuo-content">
          ${renderedContent}
        </div>
        <div class="shuoshuo-expand-btn">展开阅读全文 <i class="fa fa-angle-down"></i></div>
      </div>
    </div>
  `;
}, { ends: true });
