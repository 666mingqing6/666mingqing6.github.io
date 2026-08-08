var posts=["consciousness-China/","consciousness/","Farewell/","Talk-is-learning-useful/","Alienation-of-Learning/","talk-study/","Love-alienation/","talk-crush/","gfw/","howtousefb/","howtouseadb/","D-K-Effect/","experiencein2025/","ksutomagisk/","X/","lsp/"];function toRandomPost(){
    pjax.loadUrl('/'+posts[Math.floor(Math.random() * posts.length)]);
  };