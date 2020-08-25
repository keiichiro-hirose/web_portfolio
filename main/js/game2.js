'use strict';
// - global -------------------------------------------------------------------
const fps = 1000 / 60;
const mouse = new Point();
const enemyMaxCount = 200;
const enemyColor = 'blue';
const enemyShotColor = 'black';
const scoreTextColor = 'black';
const charaShotMaxCount = 10;
const enemyShotMaxCount = 200;
const backgraundImgPath = '../images/polandball/earth.jpg'
const backgraundEndImgPath = '../images/polandball/earth_reverse.jpg'
const charaImgPath = '../images/polandball/chara.png';
const charaShotImgPath = '../images/polandball/heart.png'
const enemyShotImgPath = '../images/polandball/heart_bw.png'
const enemyImgPathList = ['../images/polandball/enemy1.png',];//'../images/polandball/enemy2.png','../images/polandball/enemy3.png','../images/polandball/enemy4.png','../images/polandball/enemy5.png','../images/polandball/enemy6.png','../images/polandball/enemy7.png','../images/polandball/enemy8.png','../images/polandball/enemy9.png','../images/polandball/enemy10.png','../images/polandball/enemy11.png','../images/polandball/enemy12.png','../images/polandball/enemy13.png'];
const musicPath = '../data/Hey Jude.mp3';
const startMassage = 'CLICK TO START';
let screenCanvas, info, context, charaImg, charaShotImg, enemyShotImg, counter, enemyGenRate;
let enemyImgList = [];
let run = true;
let fire = false;
let state = 'start';
let score = 0;
let inputKeys = [];
let moveCount = 0;

let chara = new Character();
let charaShot = new Array(charaShotMaxCount);
let enemys = new Array(enemyMaxCount); 
let enemyShots = new Array(enemyShotMaxCount);
let music = new Audio(musicPath);
music.volume = 0.1;
music.loop = true;

let socket = io.connect();

// main ---------------------------------------------------------------------
window.onload = function main(){

    // testing socket.io
    // send to server

    // 受信待受。敵の場所、自分を含めた味方の場所
    // {'enemy':[ {x:* , y:* , size:*, life:*, alive} , ... ], 
    //  'enemyShot':[{x:**, y:**,alive: ,} , ... ], 
    //  'chara':[{pos{x:* , y:*}, size:*, life:*, alive, }, {}... ],
    //  'charaShot' :[{x:*, y:*, alive}, {}...]}
    socket.on('emit_from_server', function(data){
        console.log(data);
    });


    // initialize screen
    screenCanvas = document.getElementById('screen');
    screenCanvas.width = 1080;
    screenCanvas.height = 810;
    context = screenCanvas.getContext('2d');
    info = document.getElementById('info');
    context.font = 'bold 64px sans-serif';
    let backgraundImg = document.createElement('img');
    backgraundImg.src = backgraundImgPath;
    let backgraundEndImg = document.createElement('img');
    backgraundEndImg.src = backgraundEndImgPath;

    // eventListener
    screenCanvas.addEventListener('mousemove', mouseMove, true);
    screenCanvas.addEventListener('mousedown', mouseDown, true);
    window.addEventListener('keydown', keyDown);
    window.addEventListener('keyup', keyUp);


   // loop
   (function loop(){
        switch(state){
            case 'start':
                context.drawImage(backgraundImg,0,0,screenCanvas.width, screenCanvas.height);
                context.fillText(startMassage, 250,200);

                if(fire === true){
                    // initialize game
                    socket.emit('emit_from_client', 'startCall');
                    
                    music.currentTime = 0;
                    music.playbackRate = 1;
                    music.play();

                    counter = 0;
                    enemyGenRate = 1;
                    chara.init(30, 1);
                    chara.position.x = 540;
                    chara.position.y = 600;
                    charaImg = document.createElement('img');
                    charaImg.src = charaImgPath;
                    charaShotImg = document.createElement('img');
                    charaShotImg.src = charaShotImgPath;
                    enemyShotImg = document.createElement('img');
                    enemyShotImg.src = enemyShotImgPath;
                    enemyImgPathList.forEach(e => {
                        var enemyImg = document.createElement('img');
                        enemyImg.src = e;
                        enemyImgList.push(enemyImg);
                    });

                    inputKeys = [];
                    for(var i = 0; i < charaShotMaxCount; i++){
                        charaShot[i] = new CharacterShot();
                    }
                    for(var i = 0; i < enemyMaxCount; i++){
                        enemys[i] =new Enemy();
                    };
                    for(var i = 0; i < enemyShotMaxCount; i++){
                        enemyShots[i] = new EnemyShot();
                    }
                    score = 0;
                    state = 'inGame';
                }
                break;

            case 'inGame':

                //mouse xy
                info.innerHTML = mouse.x + ' : ' + mouse.y;
                //screen refresh
                context.clearRect(0, 0, screenCanvas.width, screenCanvas.height);
                context.drawImage(backgraundImg,0,0,screenCanvas.width, screenCanvas.height);

                //counter
                counter++;

                switch (inputKeys[0]) {
                    case 'up':
                        if(chara.position.y >= 0){
                            chara.position.y = chara.position.y - 5;
                        }
                        break;
                    case 'down':
                        if(chara.position.y <= screenCanvas.height){
                             chara.position.y = chara.position.y + 5;
                        }
                        break;
                    case 'left':
                        if(chara.position.x >= 0){
                             chara.position.x = chara.position.x - 5;
                        }
                        break;
                    case 'right':
                        if(chara.position.x <= screenCanvas.width){
                            chara.position.x = chara.position.x + 5;
                        }
                        break;
                    default:
                        break;
                }

                // shot
                if(fire){
                    for(var i = 0; i < charaShot.length; i++){
                    if (charaShot[i].alive === false){
                        charaShot[i].set(chara.position, 10, 5);
                        break;
                    }
                    };
                    fire = false;
                }
                
                // shot move
                charaShot.forEach(e => {
                    if(e.alive){
                        e.move();
                    }
                });

                // generate enemy
                if((counter % 600) === 0){
                    enemyGenRate ++;
                }
                if(counter % Math.floor( 192 / enemyGenRate) === 0){
                    for(var i = 0; i < enemys.length; i++){
                        if (enemys[i].alive === false){
                            var type = Math.floor(Math.random() * enemyImgPathList.length) ;
                            var p = new Point();
                            var bigness = Math.floor(Math.random() * 3) + 1;
                            p.y = 0;
                            p.x = (Math.floor(Math.random() * 6) + 1) * (screenCanvas.width / 8 )  ;
                            enemys[i].set(p, enemyImgList[type], bigness * 20 + 30, type,  bigness , 2 - bigness/ 3);
                            break;
                        }
                    };
                 }


                 //enemy move and generate shot
                let emcounter = 0;
                enemys.forEach(em => {
                    if(em.alive){
                        emcounter++;
                        em.move();
                        // enemy shot
                        if(counter % 96 === 0){
                            for(var i = 0; i < enemyShots.length; i++){
                                if(enemyShots[i].alive === false){
                                    var p = em.position.distance(chara.position);
                                    p.normalize();
                                    enemyShots[i].set(em.position, p, 10, 3);
                                    break;
                                }
                            }
                        }
                    }
                });

                // enemy shot move
                enemyShots.forEach(e => {
                    if(e.alive){
                        e.move();
                    }
                });
                // enemy 衝突判定
                charaShot.forEach(cs => {
                    if(cs.alive === true){
                        enemys.forEach( em => {
                            if(em.alive === true){
                                p = em.position.distance(cs.position);
                                if(p.length() < em.size){
                                    em.life --;
                                    em.size = em.size - 5;
                                    cs.alive = false;
                                    if(em.life <= 0){
                                        em.alive = false;
                                        score ++;
                                    }
                                }
                            }
                        })
                    }
                })
                // chara 衝突判定
                enemyShots.forEach(es => {
                    if(es.alive === true){
                        p = chara.position.distance(es.position);
                        if(p.length() < chara.size){
                                    chara.life --;
                                    if (chara.life <= 0) {
                                        chara.alive = false;
                                        es.alive = false;
                                        sendToServer();
                                        state = 'endGame';
                                    }

                        }
                    }
                })

                sendToServer();

                //表示
                draw();

            break;
        case 'endGame':
            context.drawImage(backgraundEndImg,0,0,screenCanvas.width, screenCanvas.height);
            draw();
            context.fillText('GAME OVER', 250,200);
            context.fillText('CLICK TO RESTART', 250,400);
            music.playbackRate = 0.1;
            if(fire === true){
                music.pause();
                state = 'start';
                fire = false;
            }
            break;
        }
     // next loop
        if(run){setTimeout(loop, fps);
        };
    })();

};


function sendToServer(){
    // socket.io 送信。自分の場所、自分の射撃
    // {'myChara': {pos:{x:*, y:*}, life:* }, 
    //  'myShot': [{x:*, y:*, alive:* }, {} ...] }
    // make json
    let charaJSON = chara.toJsonStyle();
    let charaShotJsonList = [];
    charaShot.forEach(e => {
        charaShotJsonList.push(e.toJsonStyle());
    });
    let sendJSON = JSON.stringify({'myChara':charaJSON, 'myShot':charaShotJsonList});

    socket.emit('emit_from_client', sendJSON);
}


//
function draw(){
    context.drawImage(charaImg, chara.position.x - (chara.size), chara.position.y - (chara.size), chara.size * 2, chara.size * 2);

    // draw shot
    charaShot.forEach(e => {
        if(e.alive){
            context.drawImage(charaShotImg, e.position.x - (e.size), e.position.y - (e.size), e.size * 2, e.size * 2);
            // context.beginPath();
            // context.arc(e.position.x, e.position.y, e.size, 0, Math.PI*2, false);
            // context.closePath();
            // context.fillStyle = chara.shotColor;
            // context.fill();
        }
    });


    // draw enemy
    enemys.forEach(em => {
        if(em.alive){
            context.drawImage(em.img , em.position.x - (em.size), em.position.y - (em.size), em.size * 2, em.size * 2);
        }
    });
    // draw enemy shot
    for(var i = 0; i < enemyShotMaxCount; i++){
        if(enemyShots[i].alive){
            context.drawImage(enemyShotImg, enemyShots[i].position.x - (enemyShots[i].size), enemyShots[i].position.y - (enemyShots[i].size), enemyShots[i].size * 2, enemyShots[i].size * 2);
            // context.beginPath();
            // context.arc(
            //     enemyShots[i].position.x,
            //     enemyShots[i].position.y,
            //     enemyShots[i].size,
            //     0, Math.PI * 2, false
            // );
            // context.closePath();
            // context.fillStyle = enemyShotColor;
            // context.fill();
        }
    }
    
    context.fillStyle = scoreTextColor;
    context.fillText(`SCORE ${score}`,0,100);
}


// event --------------------------------------------------------------------
function mouseMove(event){
    // mouse move
    mouse.x = event.clientX - screenCanvas.offsetLeft;
    mouse.y = event.clientY - screenCanvas.offsetTop;
}

function mouseDown(){
    fire = true;
}
function keyDown(event){
    // keycode
    let keyStr = keyCodeConverter(event.code);
    switch (keyStr) {
        case "up": case "down": case "left": case "right":
            if (inputKeys[0] != keyStr){
                inputKeys.unshift(keyStr);
            }
            break;
        // escape
        case "escape":
            run = false;
            state = 'start';
            break;
        //enter, space
        case "fire":
            fire = true;
            break;
        default:
            break;
    }
}
function keyUp(event){
    inputKeys.forEach( k => {
        if(k === keyCodeConverter(event.code)){
            inputKeys.splice(inputKeys.indexOf(k), 1);
        }
    } );

}

function keyCodeConverter(keyCode){
    switch (keyCode) {
        case "KeyW" || "ArrowUp":
            return 'up';
            break;
        case "KeyS" || "ArrowDown":
            return 'down';
            break;
        case "KeyA" || "ArrowLeft":
            return'left';
            break;
        case "KeyD" || "ArrowRight":
            return 'right';
            break;
        // escape
        case "Escape":
            return "escape";
            break;
        //enter, space
        case "Enter" || "Space":
            return "fire";
            break;
        default:
            return "";
            break;
    }
}