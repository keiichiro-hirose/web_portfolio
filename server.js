'use strict';

const app = require('http').createServer(handler);
const io = require('socket.io').listen(app);
const fs = require('fs');

app.listen(1337);
function handler(req, res) {
    fs.readFile(__dirname + '/html/game/game2.html', function(err, data) {
        if (err) {
            res.writeHead(500);
            return res.end('Error');
        }
        res.writeHead(200);
        res.write(data);
        res.end();
    })
}
io.sockets.on('connection', function(socket) {
    socket.on('emit_from_client', function(data) {
        console.log(data);
    });
});