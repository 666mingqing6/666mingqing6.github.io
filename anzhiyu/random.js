var posts=["post/experiencein2025/","post/ksutomagisk/","post/X/","post/lsp/"];function toRandomPost(){
    pjax.loadUrl('/'+posts[Math.floor(Math.random() * posts.length)]);
  };