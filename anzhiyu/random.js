var posts=["talk-crush/","Talk-is-learning-useful/","Alienation-of-Learning/","talk-study/","Love-alienation/","9008/","howtousefb/","howtouseadb/","D-K-Effect/","experiencein2025/","ksutomagisk/","X/","lsp/"];function toRandomPost(){
    pjax.loadUrl('/'+posts[Math.floor(Math.random() * posts.length)]);
  };