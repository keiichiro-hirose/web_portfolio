'use strict';

function Point(){
    this.x = 0;
    this.y = 0;
}
Point.prototype.distance = function(p){
    let d = new Point;
    d.x = p.x - this.x;
    d.y = p.y - this.y;
    return d;
}
Point.prototype.length = function(){
    return Math.sqrt(this.x * this.x + this.y * this.y)
}

Point.prototype.normalize = function(){
    let i = this.length();
    if (i > 0){
        this.y = this.y / i;
        this.x = this.x / i;
    }
}

function Character(){
    this.position = new Point();
    this.size = 0;
    this.life = 1;
}

Character.prototype.init = function(size, life){
    this.size = size;
    this.life = life;
};

Character.prototype.toJsonStyle = function(){
    return {pos: {x: this.position.x, y: this.position.y}, life: this.life};
}

function CharacterShot(){
    this.position = new Point();
    this.size = 0;
    this.speed = 0;
    this.alive = false;
}
CharacterShot.prototype.set = function(point, size, speed){
    this.position.x = point.x;
    this.position.y = point.y;
    this.size = size;
    this.speed = speed;
    this.alive = true;
}
CharacterShot.prototype.move = function(){
    this.position.y -= this.speed;
    if (this.position.y < this.size){
        this.alive = false;
    }
}
CharacterShot.prototype.toJsonStyle = function(){
    return {pos:{x : this.position.x, y: this.position.y}, alive:this.alive};
}

function Enemy(){
    this.position = new Point();
    this.img = null;
    this.size = 0;
    this.type = 0;
    this.param = 0;
    this.alive = false;
    this.life = 1;
    this.speed = 1;
}

Enemy.prototype.set = function(position, img, size, type,  life, speed){
    this.position.x = position.x;
    this.position.y = position.y;
    this.img = img;
    this.size = size;
    this.type = type;
    this.param = 0;
    this.alive = true;
    this.life = life;
    this.speed = speed;
}

Enemy.prototype.move = function(){
    this.param ++;
    this.position.y += this.speed;
    if(this.position.y >= this.size + screenCanvas.height){
        this.position.y = 0;
    }
}

function EnemyShot(){
    this.position = new Point();
    this.vector = new Point();
    this.size = 5;
    this.speed = 5;
    this.alive = false;
}

EnemyShot.prototype.set = function(position, vector, size, speed){
    this.position.x = position.x;
    this.position.y = position.y;
    this.vector.x = vector.x;
    this.vector.y = vector.y;
    this.size = size;
    this.speed = speed;
    this.alive = true;
}

EnemyShot.prototype.move = function(){
    this.position.x += this.vector.x * this.speed; 
    this.position.y += this.vector.y * this.speed;

    if( this.position.x < -this.size ||
        this.position.y < -this.size ||
        this.position.x > this.size + screenCanvas.width ||
        this.position.y > this.size + screenCanvas.height 
    ){this.alive = false;}
}