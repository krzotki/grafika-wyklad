
const canvas = document.getElementById('canvas');

const ctx = canvas.getContext("2d");

class Graphics {
    x = 0;
    y = 0;
    scaleX = 1;
    scaleY = 1;
    x0 = 0;
    y0 = 0;
    rotation = 0;
    anchorX = 0;
    anchorY = 0;

    children = [];

    setReferencePoint(x, y) {
        this.x0 = x;
        this.y0 = y;
    }
}

class Circle extends Graphics {

    radius = 1;

    constructor(color) {
        super();
        this.color = color;
    }

    draw() {
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2, true);
        ctx.closePath();
        ctx.fill();
    }

};

class Rect extends Graphics {
    w = 1;
    h = 1;

    constructor(color) {
        super();
        this.color = color;
    }

    draw() {
        ctx.fillStyle = this.color;
        ctx.fillRect(this.x, this.y, this.w, this.h);
    }
};

function getRandomInt(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

class CustomShape extends Graphics {
    points = [];

    constructor(color) {
        super();
        this.color = color;
    }

    draw() {
        const points = [...this.points];

        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.moveTo(points[0], points[1]);
        points.shift();
        points.shift();

        while(points.length > 0) {
            ctx.lineTo(points[0], points[1]);
            points.shift();
            points.shift();
        }

        ctx.fill();
    }
}

class Triangle extends Graphics {
    points = [0, 0, 0, 0, 0, 0];

    constructor(color) {
        super();
        this.color = color;
    }

    draw() {
        const points = this.points;

        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.moveTo(points[0], points[1]);
        ctx.lineTo(points[2], points[3]);
        ctx.lineTo(points[4], points[5]);
        ctx.fill();
    }
}

const ID = function () {
    return '_' + Math.random().toString(36).substr(2, 9);
};

class GraphicsObject extends Graphics {
    children = [];
    name = ID();
    type = 'object';

    constructor() {
        super();
    }

    draw() {
        this.update();

        this.children.forEach(child => {
            ctx.save();

            child.setReferencePoint(this.x + this.x0, this.y + this.y0);

            const childX = child.x0 + child.x * this.scaleX * child.scaleX;
            const childY = child.y0 + child.y * this.scaleY * child.scaleY;

            ctx.translate(childX + child.anchorX * this.scaleX, childY + child.anchorY * this.scaleY);
            ctx.rotate(child.rotation);
            ctx.translate(-childX - child.anchorX * this.scaleX, -childY - child.anchorY * this.scaleY);

            ctx.transform(this.scaleX * child.scaleX, 0, 0, this.scaleY * child.scaleY, childX, childY);
            child.draw();
            ctx.restore();
        });
    }
}


class Projectile extends GraphicsObject {
    constructor(x, y) {
        super();

        this.type = 'projectile';

        this.x = x;
        this.y = y;

        const hitbox = new Rect('#00000000');
        hitbox.w = 10;
        hitbox.h = 10;
        hitbox.x = -2.5;
        hitbox.y = -2.5;
        this.children.push(hitbox);
        this.hitbox = hitbox;

        const circle = new Circle('#ff3300');
        circle.radius = 5;

        this.children.push(circle);
    }

    update() {
        this.y -= 10;
        if (this.y < 0) {
            destroy(this);
        }
    };
}

class SpaceShip extends GraphicsObject {
    constructor() {
        super();

        const wingHolder = new Rect('#303030');
        {
            wingHolder.w = 400;
            wingHolder.h = 25;
            wingHolder.x = -100;
            wingHolder.y = 20;
            this.children.push(wingHolder);
        }

        const body = new Circle('#404040');
        {
            body.radius = 50;
            body.scaleY = 4;
            body.y = -10;
            this.children.push(body);
        }


        const leftWing = new Triangle('#505050');
        {
            leftWing.points = [0, 0, 100, -200, 100, 0];
            leftWing.x = -250;
            leftWing.y = 100;
            this.children.push(leftWing);
        }

        const rightWing = new Triangle('#505050');
        {
            rightWing.points = [0, 0, 0, -200, 100, 0];
            rightWing.x = 150;
            rightWing.y = 100;
            this.children.push(rightWing);
        }

    }

    update() {

    }
};

class Asteroid extends GraphicsObject {
    constructor() {
        super();

        this.maxHp = 5;
        this.hp = this.maxHp;
        this.rotationSpeed = getRandomInt(-5, 5) / 100;

        this.x = 0;
        this.y = 0;

        const hpBackground = new Rect('#808080');
        {
            hpBackground.w = 100;
            hpBackground.h = 10;
            hpBackground.y = -10;
            this.children.push(hpBackground);
        }

        const hpBar = new Rect('#ff0000');
        {
            hpBar.w = 100;
            hpBar.h = 10;
            hpBar.y = -10;
            this.children.push(hpBar);
            this.hpBar = hpBar;
        }

        const hitbox = new Rect('#60606000');
        {
            hitbox.w = 100;
            hitbox.h = 100;
            this.children.push(hitbox);
            this.hitbox = hitbox;
        }

        const shape = new CustomShape('#303030');
        const vertices = 100;

        for(let i = 0; i < vertices; i++) {
            const random = getRandomInt(0, 75);

            const randomX = 50 + random * Math.sin(i);
            const randomY = 50 - random * Math.cos(i);
            
            shape.points.push(randomX, randomY);
        }

        this.shape = shape;
        shape.anchorX = 50;
        shape.anchorY = 50;
        this.children.push(shape);
    }

    update() {
        this.shape.rotation += this.rotationSpeed;
        this.y += 5;

        if(this.y > canvas.height) destroy(this);

        const collision = objects.find(object => {
            if(object.type === 'projectile') {
                
                if(object.y + object.hitbox.y < this.y + this.hitbox.h * this.scaleY && object.y + object.hitbox.y + object.hitbox.h > this.y 
                && object.x + object.hitbox.x < this.x + this.hitbox.w * this.scaleX && object.x + object.hitbox.x + object.hitbox.w > this.x) {
                    return true;
                } 
            }
            return false;
        });
        
        if(collision) {
            destroy(collision);
            this.hp--;
            if(this.hp <= 0) destroy(this);
        }

        this.hpBar.w = 100 * (this.hp / this.maxHp);
    }
}


const objects = [];

const spaceShip = new SpaceShip();
spaceShip.x = 500;
spaceShip.y = 700;
spaceShip.scaleX = 0.25;
spaceShip.scaleY = 0.25;

objects.push(spaceShip);

let ticks = 0;

const draw = () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if(ticks === 100) {
        ticks = 0;
    }
  
    ticks++;  

    if(ticks % 5 === 0) {
        objects.push(new Projectile(spaceShip.x, spaceShip.y - 50));
    }

    if(ticks % 50 === 0) {
        const asteroid = new Asteroid();
        asteroid.x = getRandomInt(0, canvas.width - 200);
        asteroid.y = -200;
        
        const random = getRandomInt(5, 10) / 10;

        asteroid.scaleX = random;
        asteroid.scaleY = random;
        objects.push(asteroid);
    }

    for(let i = objects.length - 1; i >= 0; i--) {
        if(objects[i].destroyed) {

            while(objects[i].children.length > 0) {
                delete objects[i].children[0];
                objects[i].children.shift();
            } 

            delete objects[i];
            objects.splice(i, 1);
        }
    }

    objects.forEach(object => {
        object.draw();
    });

    requestAnimationFrame(draw);
};

canvas.onmousemove = (evt) => {
    spaceShip.x = evt.clientX;
};

requestAnimationFrame(draw);

const destroy = (destroyedObject) => {
    destroyedObject.destroyed = true;
};
