'use strict';
{
  let words = ['hey hey',
    'Hey Jude, don\'t let me down',
    'You have found her, now go and get her',
    'Let it out and let it in',
    'Remember (Hey Jude) to let her into your heart',
    'Then you can start to make it better',]
  let word;
  let clearCount;
  const timeLimit = 5000;
  //let startTime;
  const wordEl = document.getElementById('word');
  const doneWord = '';
  const doneWordEl = document.getElementById('doneWord');
  doneWordEl.textContent = doneWord;
  const endWord = 'GAME END. PRESS SPACE TO RESTART';
  const endEl = document.getElementById('end');
  let score;
  const scoreEl = document.getElementById('score');
  let miss;
  const missEl = document.getElementById('miss');
  const timerEl = document.getElementById('timer');
  timerEl.textContent = (timeLimit / 1000).toFixed(2);

  function updateWord(x){
    wordEl.textContent = word.substring(x);
    doneWordEl.textContent = word.substring(0, x);
  }

  function updateTimer(st, nm){
    const timeLeft = st + timeLimit - Date.now();
    timerEl.textContent = (timeLeft / 1000).toFixed(2);

    const timeoutId = setTimeout(() => { updateTimer(st, nm); } , 10);
    if (nm != clearCount){
      clearTimeout(timeoutId);
    }
    if(timeLeft < 0){
      clearTimeout(timeoutId);
      state = 'end';
      endEl.textContent = endWord;
      wordEl.textContent = '';
      doneWordEl.textContent = '';
    }
  }

  let loc;
  let state = 'start';

  window.addEventListener('keydown', (k) => {
    switch (state) {
      case 'start':
        loc = 0;
        score = 0;
        scoreEl.textContent = score;
        miss = 0;
        missEl.textContent = miss;
        clearCount = 0;
        endEl.textContent = '';
        word = words[clearCount];

        updateTimer(Date.now(), clearCount);
        updateWord(loc);
        state='inGame';
      case 'inGame':
        if (k.key === word[loc]){
          loc ++;
          updateWord(loc)
          score ++;
          scoreEl.textContent = score;
          if(word[loc] === ' '){
            loc ++;
          }
        }else{
          miss ++;
          missEl.textContent = miss;
        }

        if(loc === word.length){
          clearCount++;
          word = words[clearCount];
          updateWord(0);
          loc = 0;
          updateTimer(Date.now(),clearCount);
        }
        break;
      case 'end':
        console.log(state);
        if(k.key === ' '){
          state = 'start';
        }
    }
  })

}
