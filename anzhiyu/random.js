var posts=["2026-01-01/experiencein2025/","2025-12-19/ksutomagisk/","2025-12-06/X/","2025-12-05/lsp/"];function toRandomPost(){
    pjax.loadUrl('/'+posts[Math.floor(Math.random() * posts.length)]);
  };