var posts=["test/","experiencein2025/","ksutomagisk/","X/","lsp/"];function toRandomPost(){
    pjax.loadUrl('/'+posts[Math.floor(Math.random() * posts.length)]);
  };