'use strict';
const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io').listen(http);
const fs = require('fs');
const path = require('path');
const port = 1337;
let charaKeyList = [];
let state = 'endGame';
let charaShots = [];
let charas = {};

http.listen(port, ()=> {
    console.log(`Running at Port ${port}`);
} );

app.use(express.static(path.join(__dirname, '../main')));

app.use((req, res) => {
    console.log('aiee');
    res.sendStatus(404);
});

// recieve from client
// 常に受け付ける
io.sockets.on('connection', function(socket) {
    socket.on('emit_from_client', function(data){
        if(data === 'startCall'){
            if (state === 'endGame' ){
                state = 'inGame';
                console.log('GameStarted');
                loop();    
            }
        }else{
            let recieveJSON = JSON.parse(data);
            let chara = recieveJSON.myChara;
            chara['time'] = Date.now();
            charas[socket.id] = recieveJSON.myChara;
        }
   })
})
// main loop. 1loop / 30ms
// process all and send to client
// TODO
// Enemyの生成処理をこちらに作成
// EnemyShotの生成処理をこちらに作成
// Enemyの情報を送信
// Enemyの情報をモトにむこうで描画するように
// EnemyとCharaの衝突判定をこちらに作成
// 
// 
function loop(){
    setTimeout(loop, 1000);

    Object.keys(charas).forEach(e=> {
        if (charas[e]['time'] <= (Date.now() - 5000)) {
            delete charas[e];
            console.log(charas);
        }
    });
 

    io.sockets.emit('emit_from_server', JSON.stringify(charas));
    
}

// function handler(req, res) {
//     fs.readFile(__dirname + '/maingame2.html', function(err, data) {
//         if (err) {
//             res.writeHead(500);
//             return res.end('Error');
//         }
//         res.writeHead(200);
//         res.write(data);
//         res.end();
//     })
// }
// io.sockets.on('connection', function(socket) {
//     socket.on('emit_from_client', function(data) {
//         console.log(data);
//     });
// });