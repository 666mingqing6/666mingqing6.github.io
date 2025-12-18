var posts=["2025-12-05/lsp","2025-12-18/proxyip","2025-12-06/X"];function toRandomPost(){
    pjax.loadUrl('/'+posts[Math.floor(Math.random() * posts.length)]);
  };