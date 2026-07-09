// 自定义标签：支持黑暗模式下显示不同的图片
// 使用方式：{% darkimg light-image-url dark-image-url alt-text %}

hexo.extend.tag.register('darkimg', function(args) {
  const lightImg = args[0];
  const darkImg = args[1];
  const alt = args[2] || 'Image';
  const randomId = 'darkimg-' + Math.random().toString(36).substring(7);

  let html = '<img id="' + randomId + '" src="' + lightImg + '" alt="' + alt + '" style="max-width: 100%; height: auto; border-radius: 8px;" data-light="' + lightImg + '" data-dark="' + darkImg + '">';
  html += '<script>';
  html += '(function() {';
  html += '  const img = document.getElementById("' + randomId + '");';
  html += '  if (!img) return;';
  html += '  function updateImage() {';
  html += '    const isDark = window.matchMedia("(prefers-color-scheme: dark)").matches;';
  html += '    img.src = isDark ? img.dataset.dark : img.dataset.light;';
  html += '  }';
  html += '  updateImage();';
  html += '  window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", updateImage);';
  html += '})();';
  html += '</script>';

  return html;
});
