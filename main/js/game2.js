'use strict';


// setting values -------------------------------------------------------------------
const fps = 1000 / 60;
const mouse = new Point();
const enemyMaxCount = Params.enemyMaxCount;
const charaShotMaxCount = Params.charaShotMaxCount;
const enemyShotMaxCount = Params.enemyShotMaxCount;
const backgraundImgPath = '../images/game3/back.png'
const backgraundEndImgPath = '../images/game3/back.png'
const charaShotImgPath = '../images/game3/shoot1.png'
const enemyShotImgPath = '../images/game3/shoot2.png'
const enemyVariationNum = Params.enemyVariationNum;
const enemyImgPathList = ['../images/game3/enemy1.png','../images/game3/enemy2.png','../images/game3/enemy3.png','../images/game3/enemy4.png','../images/game3/enemy5.png','../images/game3/enemy6.png','../images/game3/enemy7.png','../images/game3/enemy8.png','../images/game3/enemy9.png','../images/game3/enemy10.png'];
const nameList = ['Alfa', 'Bravo', 'Charl', 'Delta', 'Echo', 'Fox', 'Golf'];
const charaImgPath = '../images/game3/chara.png';

//const musicPath = '../data/Hey Jude.mp3';
const startMassage = 'CLICK TO START';
// are
let screenCanvas, info, enterYourName, nameWarning, highScore,context, charaImg, charaShotImg, enemyShotImg, counter, enemyGenRate, recieveJSON, recieveData ,enemysFromServer,enemyShotsFromServer,mySocketId ,charaList, deadFlag;
let enemyImgList = [];
let enemyShots = new Array(enemyShotMaxCount);
let run = true;
let fire = false;
let state = 'start';
let serverState = 'endGame';
let score = 0;
let maxScore = 0;
let myName = '';
let inputKeys = [] ;
let moveCount = 0;
const canvasWidth = Params.canvasWidth;
const canvasheight = Params.canvasWidth;
let chara = new Character();
let charaShot = {};

let enemys = new Array(enemyMaxCount);
// let music = new Audio(musicPath);
// music.volume = 0.1;
// music.loop = true;

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
        if(data === 'resetCall'){
            initialize();
        }else{
            recieveData = data;
            recieveJSON = JSON.parse(recieveData);
            serverState = recieveJSON.state;
            info.innerHTML = 'MAX SCORE : ' + maxScore;
            mySocketId = socket.id;

            // unzip chara
            charaList = recieveJSON.charas;

            // am i dead?
            if(charaList[mySocketId] != undefined){
                if(charaList[mySocketId].life <= 0){
                    state = 'endGame';
                    resetHighScore();
                }
            }

            // unzip data from server

            // unzip enemys (and insert img)
            enemysFromServer = recieveJSON.enemys;
            for (let i = 0; i < enemys.length; i++) {
                enemysFromServer[i].img = enemyImgList[enemysFromServer[i].type];
                enemys[i] = enemysFromServer[i];
            }
            enemyShotsFromServer = recieveJSON.enemyShots;
            for (let i = 0; i < enemyShots.length; i++) {
                enemyShots[i] = enemyShotsFromServer[i];
            }

            // unzip charaShots
            charaShot = recieveJSON.charaShots;

            score = recieveJSON.score;
            maxScore = Math.max(score, maxScore);

        }
    });


    // initialize screen
    screenCanvas = document.getElementById('screen');
    screenCanvas.width = 1080;
    screenCanvas.height = 810;
    context = screenCanvas.getContext('2d');
    info = document.getElementById('info');
    nameWarning = document.getElementById('nameWarning');
    highScore = document.getElementById('highScore')
    enterYourName = document.getElementById('enterYourName')
    let backgraundImg = document.createElement('img');
    backgraundImg.src = backgraundImgPath;
    let backgraundEndImg = document.createElement('img');
    backgraundEndImg.src = backgraundEndImgPath;

    // eventListener
    screenCanvas.addEventListener('mousemove', mouseMove, true);
    screenCanvas.addEventListener('mousedown', mouseDown, true);
    window.addEventListener('keydown', keyDown);
    window.addEventListener('keyup', keyUp);

    initialize();

   // loop
   (function loop(){
        // next loop
        if(run){
            setTimeout(loop, fps);
        };
        switch(state){
            case 'start':
                context.drawImage(backgraundImg,0,0,screenCanvas.width, screenCanvas.height);
                context.fillStyle = "rgba(100,100,100,0.8)"; 
                context.font = 'bold 64px sans-serif';
                context.fillText(startMassage, 250,200);
                if(fire === true){
                    // initialize game
                    socket.emit('emit_from_client', 'startCall');
                    initialize();
                    state = 'inGame';
                    // music.currentTime = 0;
                    // music.playbackRate = 1;
                    // music.play(); 
                }
                break;

            case 'inGame':

                //screen refresh
                context.clearRect(0, 0, screenCanvas.width, screenCanvas.height);
                context.drawImage(backgraundImg,0,0,screenCanvas.width, screenCanvas.height);

                //counter
                counter++;

                // move chara
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

                    // generate shot
                if(fire){
                    // ランダムな数字をShotごとのID（Key）とする
                    let shotId = Math.floor(Math.random() * 32000);
                    let tmpShot = new CharacterShot();
                    tmpShot.set(chara.position, 10, 5);

                    if(charaShot[mySocketId] === undefined){
                        charaShot[mySocketId] = {};
                    };
                    charaShot[mySocketId][shotId] = tmpShot

                    fire = false;
                }

                sendToServer();

                //表示
                draw();

            break;
        case 'endGame':
            context.drawImage(backgraundEndImg,0,0,screenCanvas.width, screenCanvas.height);
            draw();
            context.fillStyle = "rgba(100,100,100,0.8)"; 
            context.font = 'bold 64px sans-serif';
            context.fillText('GAME OVER', 250,200);
            context.fillText('CLICK TO RESTART', 250,400);
        //    // music.playbackRate = 0.1;
             if(fire === true){
                // music.pause();
                 state = 'start';
                fire = false;
             }
            break;
        }
    })();

    function initialize(){
        deadFlag = false;
        counter = 0;
        enemyGenRate = Params.enemyGenRate;
        chara.init(30, 1);
        chara.position.x = 540;
        chara.position.y = 600;
        charaImg = document.createElement('img');
        charaImg.src = charaImgPath;
        charaShotImg = document.createElement('img');
        charaShotImg.src = charaShotImgPath;
        if (myName === ''){
            myName = nameList[Math.floor(Math.random() * nameList.length)] + '_' + Math.random().toString().slice(2,4);
        }
        chara.name = myName;

        enemyShotImg = document.createElement('img');
        enemyShotImg.src = enemyShotImgPath;
        enemyImgPathList.forEach(e => {
            var enemyImg = document.createElement('img');
            enemyImg.src = e;
            enemyImgList.push(enemyImg);
        });

        inputKeys = [];
        charaShot = {};
        charaList = {};
        for(var i = 0; i < enemyMaxCount; i++){
            enemys[i] =new Enemy();
        };
        for(var i = 0; i < enemyShotMaxCount; i++){
            enemyShots[i] = new EnemyShot();
        }
        score = 0;
        resetHighScore();
    }

};


function sendToServer(){
    // socket.io 送信
    // {'myChara': {pos:{x:*, y:*}, life:* },
    //  'myShot': [{x:*, y:*, alive:* }, {} ...] }
    // make json
    let charaJSON = chara.toJsonStyle();
    let sendJSON = JSON.stringify({'myChara':charaJSON, 'myShot':charaShot});

    socket.emit('emit_from_client', sendJSON);
}

function draw(){
// 表示
    // draw chara
    Object.values(charaList).forEach(ch => {
        context.drawImage(charaImg, ch.position.x - (ch.size), ch.position.y - (ch.size), ch.size * 2, ch.size * 2);
        context.font = 'bold 16px sans-serif';
        context.fillStyle = "rgba(50,50,50,0.8)"; 
        context.fillText(`${ch.name}`,ch.position.x - 35,ch.position.y + 40);
    })


    // draw shot
    Object.keys(charaShot).forEach(charaId => {
        Object.keys(charaShot[charaId]).forEach(shotId => {
            if(charaShot[charaId][shotId].alive){
                context.drawImage(charaShotImg, charaShot[charaId][shotId].position.x - (charaShot[charaId][shotId].size), charaShot[charaId][shotId].position.y - (charaShot[charaId][shotId].size), charaShot[charaId][shotId].size * 2, charaShot[charaId][shotId].size * 2);
            }
        })
    });


    // draw enemy
    enemys.forEach(em => {
        if(em.alive){

            //当たり判定の円を書く
            context.arc(em.position.x, em.position.y, em.size, 0 * Math.PI / 180, 360 * Math.PI / 180);
            context.fillStyle = "rgba(200,200,200,0.5)";
            context.fill();
            context.strokeStyle = 'rgba(100,100,100,0.5)' ;
            context.lineWidth = 5 ;
            context.stroke() ;
            //画像配置
            context.drawImage(em.img , em.position.x - (em.size * 0.75), em.position.y - (em.size* 0.75), em.size * 1.5, em.size * 1.5);
            context.beginPath();
        }
    });
    // draw enemy shot
    for(var i = 0; i < enemyShotMaxCount; i++){
        if(enemyShots[i].alive){
            context.drawImage(enemyShotImg, enemyShots[i].position.x - (enemyShots[i].size), enemyShots[i].position.y - (enemyShots[i].size), enemyShots[i].size * 2, enemyShots[i].size * 2);
        }

    }

    context.font = 'bold 32px sans-serif';
    context.fillStyle = "rgba(100,100,100,0.8)"; 
    context.fillText(`SCORE ${score}`,0,32);
}

// form --------------------------------------------------------------------
// スクリーンネーム入力用
function sendName(){
    let inputName = document.getElementById("name").value;
    let re = new RegExp("[a-zA-Z]{1,10}");
    let reResult = re.exec(inputName);
    if(reResult != null){
        myName = reResult[0];
        chara.name = myName;
        enterYourName.innerHTML = `your name is \" ${myName} \" `
        nameWarning.innerHTML = '';
    }else{
        nameWarning.innerHTML = 'invalid name';
    }
    resetHighScore();
}

// db---------------------------------------------------------------
// ハイスコア表示
function resetHighScore(){
    socket.emit('emit_from_client', 'highScore', (res) => {
        console.log(res);
        let highScoreHtml = '<th>Name</th><th>Score</th>';
        res.forEach( r => {
            highScoreHtml = highScoreHtml + '<tr><td>' + r.charas + '</td><td>' + r.score + '</td></tr>';
        })
        highScore.innerHTML = highScoreHtml;
    })
}

// event --------------------------------------------------------------------
// キー入力関連

function mouseMove(event){
    // mouse move
    mouse.x = event.clientX - screenCanvas.offsetLeft;
    mouse.y = event.clientY - screenCanvas.offsetTop;
}

function mouseDown(){
    fire = true;
}

// KeyDownした方向KeyをArrayに貯めておき、KeyUpしたKeyを削除する。
//Arrayの中の最新のものを使用する
// 同時押し対応、チャタリング？（Keyを離してもずっと移動し続ける現象）対策のため
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
        case "KeyW" :
        case "ArrowUp" :
            return 'up';
            break;
        case "KeyS" :
        case "ArrowDown" :
            return 'down';
            break;
        case "KeyA" :
        case "ArrowLeft" :
            return'left';
            break;
        case "KeyD" :
        case "ArrowRight":
            return 'right';
            break;
        // escape
        case "Escape" :
            return "escape";
            break;
        //enter, space
        case "Enter" :
        case "Space" :
            return "fire";
            break;
        default:
            return "";
            break;
    }
}