'use strict';

// usage
// $ sudo nohup node server.js &
// need user uid=1000

const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io').listen(http);
const fs = require('fs');
const path = require('path');
const port = 80;
const uid = 1000;
const auth = require('./auth');
const cm = require("../main/js/game2_common.js");
const sql = require("../main/js/sql.js")

// all exception
process.on('uncaughtException', function(err) {
    console.log(err);
});

// basic auth
app.use(auth);

// http something
http.listen(port, ()=> {
    process.setuid(uid);
    console.log(`Running at Port ${port}`);
    sql.selectHighScore();
} );

app.use(express.static(path.join(__dirname, '../main')));

app.use((req, res) => {
    console.log('404 occured');
    res.sendStatus(404);
});

//=========== game =======================================

// values
const Params = cm.Params;
let Point = cm.Point;
let Character = cm.Character;
let CharacterShot = cm.CharacterShot;
let Enemy = cm.Enemy;
let EnemyShot = cm.EnemyShot;

let score = 0;
let counter = 0;
let state = 'notStarted';
let charaShotsList = {};
let charas = {};
const enemyMaxCount = Params.enemyMaxCount;
const enemyShotMaxCount = Params.enemyShotMaxCount;
const enemyVariationNum = Params.enemyVariationNum;
let enemyGenRate = Params.enemyGenRate;
let enemys = new Array(enemyMaxCount); 
let canvasWidth = Params.canvasWidth;
let canvasheight = Params.canvasheight;
let enemyShots = new Array(enemyShotMaxCount);

// game init
reset_game();

// recieve from client
// 常に受け付ける
io.sockets.on('connection', (socket)  => {
    socket.on('emit_from_client', (data, ack) => {
        // クライアント側からのスタート要求
        if(data === 'startCall'){
            if (state=== 'notStarted'){
                state = 'inGame';
                console.log('GameStarted');
                reset_game();
                loop();    
            }else if(state === 'endGame'){
                state = 'inGame';
                console.log('GameRestarted');
            }else if(state === 'inGame'){
                // do nothing
            }
        // ハイスコアデータの要求
        }else if(data === 'highScore'){
            sql.selectHighScore().then( function(result) {
                ack(result);
            });
        //メインのループ処理
        }else{
            // unzip Chara
            let recieveJSON = JSON.parse(data);
            let tmpChara = new Character();
            tmpChara.fromJsonStyle(recieveJSON.myChara);
            if(charas[socket.id] === undefined){
                charas[socket.id] = tmpChara;
            }else if(charas[socket.id].life > 0){
                charas[socket.id] = tmpChara;
            }

            // unzip CharaShots
            //MyShot {SocketId：{ShotId：CharaShot型}
            //Server側では受取時SocketIdの新規Shotだけ追加
            //クライアント：自分のSocketIdを調べ、そこに新規Shotを追加 > すべてのSocketIdのShotを描画
            if(charaShotsList[socket.id] === undefined){
                charaShotsList[socket.id] = {};
            };
            if (recieveJSON.myShot[socket.id] != undefined){
                Object.keys(recieveJSON.myShot[socket.id]).forEach(shotId => {
                    if(charaShotsList[socket.id][shotId] === undefined){
                        let tmpShot = new CharacterShot();
                        tmpShot.fromJsonStyle(recieveJSON.myShot[socket.id][shotId]);
                        charaShotsList[socket.id][shotId] = tmpShot;
                    }
                });    
            }

        }
   })
})


// ==============main loop. =========================================================== 
// 1loop / 30ms
// process all and send to client

function loop(){
    setTimeout(loop, 1000/60);
    counter ++;

    // generate enemy
    if((counter % 600) === 0){
        enemyGenRate ++;
    }
    if(counter % Math.floor( 192 / enemyGenRate) === 0){
        for(var i = 0; i < enemys.length; i++){
            if (enemys[i].alive === false){
                var type = Math.floor(Math.random() * enemyVariationNum) ;
                var p = new Point();
                var bigness = Math.floor(Math.random() * 3) + 1;
                p.y = 0;
                p.x = (Math.floor(Math.random() * 7) + 1) * (canvasWidth / 8 )  ;
                enemys[i].set(p, null, bigness * 20 + 30, type,  bigness , 2 - bigness/ 3);
                break;
            }
        };
    }

    // enemy move and generate shot
    let emcounter = 0;
    enemys.forEach(em => {
        if(em.alive){
            emcounter++;
            em.move();
            // enemy shot
            if(counter % 96 === 0){
                for(var i = 0; i < enemyShots.length; i++){
                    if(enemyShots[i].alive === false){
                        let k = Object.keys(charas);
                        if (k.length > 0 ){
                            let target = charas[k[ Math.floor(Math.random() * (k.length))]];
                            let p = em.position.distance(target.position);
                            p.normalize();
                            enemyShots[i].set(em.position, p, 10, 3);     
                            break;
                        }
                    }
                }
            }
        }
    });

    // enemy shots move
    enemyShots.forEach(e => {
        if(e.alive){
            e.move();
        }
    });

    // enemyとcharashotの衝突判定
    Object.keys(charaShotsList).forEach(charakeys => {
        Object.keys(charaShotsList[charakeys]).forEach(shotId => {
            if (charaShotsList[charakeys][shotId].alive === true){
                //ついでにCharashotの移動
                charaShotsList[charakeys][shotId].move();

                enemys.forEach( em => {
                    if(em.alive === true){
                        let p = em.position.distance(charaShotsList[charakeys][shotId].position);
                        if(p.length() < em.size){
                            em.life --;
                            em.size = em.size - 5;
                            charaShotsList[charakeys][shotId].alive = false;
                            if(em.life <= 0){
                                em.alive = false;
                                score ++;
                            }
                        }
                    }
                })            
            }
        });
    });

    // charactor とenemyShotの衝突判定
    enemyShots.forEach( es => {
        if(es.alive === true){
            Object.keys(charas).forEach( key =>{
                let p = charas[key].position.distance(es.position);
                if (p.length() < charas[key].size){
                    charas[key].life -- ;
                    es.alive =false;
                }
            })
        }
    })

    // compose JSON to send 
    let composed_data = {'charas' : charas, 'charaShots' : charaShotsList,'enemys' : enemys, 'enemyShots': enemyShots, 'score':score, 'state':state};
    io.sockets.emit('emit_from_server', JSON.stringify(composed_data));

    // remove disconnected chara (5s)
    Object.keys(charas).forEach(e=> {
        if (charas[e].time <= (Date.now() - 5000)) {
            delete charas[e];
        }
    });

    // reset game if no chara remains
    if( Object.values(charas).filter( ch => ch.life > 0).length <= 0 && enemys.filter(e => e.alive).length > 0){
        state = 'endGame';
        reset_game();
    };
}



function reset_game(){
    if (score > 10 && Object.values(charas).length > 0){
        console.log('record highscore', score);
        let charasStr = '';
        Object.values(charas).forEach( ch => {
            charasStr = charasStr + ch.name + ', ';
        })
        charasStr = charasStr.slice(0, -2);
        sql.insertHighScore(charasStr, score);
    }
    charaShotsList = {};
    charas = {}
    enemys = [];
    for(var i = 0; i < enemyMaxCount; i++){
        enemys[i] =new Enemy();
    };
    enemyShots = [];
    for(var i = 0; i < enemyShotMaxCount; i++){
        enemyShots[i] = new EnemyShot();
    }
    enemyGenRate = 1;
    counter = 0;
    score = 0;
    io.sockets.emit('emit_from_server', 'resetCall');
}
