var posts=["experiencein2025/","Talk-is-learning-useful/","Alienation-of-Learning/","talk-study/","Love-alienation/","talk-crush/","9008/","howtousefb/","howtouseadb/","D-K-Effect/","ksutomagisk/","X/","lsp/"];function toRandomPost(){
    pjax.loadUrl('/'+posts[Math.floor(Math.random() * posts.length)]);
  };