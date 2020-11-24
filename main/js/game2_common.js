'use strict';

const Params = {
    canvasWidth: 1080,
    canvasheight: 810,
    enemyGenRate: 1,
    enemyVariationNum: 10,
    enemyMaxCount:100,
    enemyShotMaxCount:200,
    charaShotMaxCount: 20

}

class Point {
    constructor() {
        this.x = 0;
        this.y = 0;
    }
    distance(p) {
        let d = new Point;
        d.x = p.x - this.x;
        d.y = p.y - this.y;
        return d;
    }
    length() {
        return Math.sqrt(this.x * this.x + this.y * this.y);
    }
    normalize() {
        let i = this.length();
        if (i > 0) {
            this.y = this.y / i;
            this.x = this.x / i;
        }
    }
}


 class Character {
    constructor() {
        this.position = new Point();
        this.size = 20;
        this.life = 1;
        this.time = Date.now();
        this.name = "";
    }
    init(size, life) {
        this.size = size;
        this.life = life;
    }
    toJsonStyle() {
        return { pos: { x: this.position.x, y: this.position.y }, life: this.life, name: this.name};
    }
    fromJsonStyle(jsonStyle){
        let p = new Point();
        p.x = jsonStyle.pos.x;
        p.y = jsonStyle.pos.y;
        this.position = p;
        this.life = jsonStyle.life;
        this.name = jsonStyle.name;
    }
}



 class CharacterShot {
    constructor() {
        this.position = new Point();
        this.size = 0;
        this.speed = 0;
        this.alive = false;
    }
    set(point, size, speed) {
        this.position.x = point.x;
        this.position.y = point.y;
        this.size = size;
        this.speed = speed;
        this.alive = true;
    }
    move() {
        this.position.y -= this.speed;
        if (this.position.y < this.size) {
            this.alive = false;
        }
    }
    toJsonStyle() {
        return { pos: { x: this.position.x, y: this.position.y }, alive: this.alive };
    }
    fromJsonStyle(jsonStyle){
        let p = new Point();
        p.x = jsonStyle.position.x;
        p.y = jsonStyle.position.y;
        this.position = p;
        this.size = jsonStyle.size;
        this.speed = jsonStyle.speed;
        this.alive = jsonStyle.alive;
    }
}

 class Enemy {
    constructor() {
        this.position = new Point();
        this.img = null;
        this.size = 0;
        this.type = 0;
        this.param = 0;
        this.alive = false;
        this.life = 1;
        this.speed = 1;
    }
    set(position, img, size, type, life, speed) {
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
    move() {
        this.param++;
        this.position.y += this.speed;
        if (this.position.y >= this.size + Params.canvasheight) {
            this.position.y = 0;
        }
    }
};



class EnemyShot {
    constructor() {
        this.position = new Point();
        this.vector = new Point();
        this.size = 5;
        this.speed = 5;
        this.alive = false;
    }
    set(position, vector, size, speed) {
        this.position.x = position.x;
        this.position.y = position.y;
        this.vector.x = vector.x;
        this.vector.y = vector.y;
        this.size = size;
        this.speed = speed;
        this.alive = true;
    }
    move() {
        this.position.x += this.vector.x * this.speed;
        this.position.y += this.vector.y * this.speed;
        if (this.position.x < -this.size ||
            this.position.y < -this.size ||
            this.position.x > this.size + Params.canvasWidth ||
            this.position.y > this.size + Params.canvasheight) {
            this.alive = false;
        }
    }
}

try {  
    module.exports.Params = Params;
    module.exports.Point = Point;
    module.exports.Character = Character;
    module.exports.CharacterShot =  CharacterShot;
    module.exports.Enemy = Enemy;
    module.exports.EnemyShot = EnemyShot;
} catch (ReferenceError) {
    
}