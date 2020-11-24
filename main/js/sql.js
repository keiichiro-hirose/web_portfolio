'use strict';
const mysql = require('mysql');
const util = require('util');
let connection;
let pool;
// create user 'webuser'@'localhost' identified by 'user1234';
// db : web
// table:highscore
// +-------+-----------+---------------------+
// | score | charas    | time                |
// +-------+-----------+---------------------+
// |   334 | testchara | 2000-01-01 00:00:00 |
// | int   | varchar(100)| datetime
// +-------+-----------+---------------------+

function connectDb() {
    pool = mysql.createPool({
        connectionLimit: 30,
        host: 'localhost',
        user: 'webuser',
        password: 'WebUser1234!',
         port: '3306',
        database: 'web'
      })
    pool.query = util.promisify(pool.query) 
    //同期処理するためにPromise(?)化している(?)らしい。深淵を覗くと発狂するので今は理解しないでおく

}
    
function endDb() {
    pool.end();
}

// Promiceオブジェクトを返す
async function selectHighScore(){
        let queryStr = 'SELECT MAX(score) as score, charas FROM highscore GROUP BY charas ORDER BY score DESC LIMIT 5;'
        connectDb();
        let result;
        try{
            result = await pool.query(queryStr);
        }catch{}
        endDb();
        return result;
}

function insertHighScore(charas, score){
    console.log('insertHighScore', charas, score);
    // let time = Date.now();
    let queryStrIns = `INSERT INTO highscore(score, charas) VALUES (${score}, '${charas}');`;
    (async () => {
        connectDb();
        await pool.query(queryStrIns);
        endDb();
    }) ()
}

try {  
    module.exports.selectHighScore = selectHighScore;
    module.exports.insertHighScore = insertHighScore;
} catch (ReferenceError) {
    
}