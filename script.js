
const canvas = document.getElementById('canvas');
canvas.width = window.innerWidth - 2;
canvas.height = window.innerHeight - 2;
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
    zIndex = 0;

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

        const circle = new Circle('#ff5500');
        circle.radius = 3;
        circle.scaleY = 3;

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

        const thrusterGradient = ctx.createLinearGradient(0, 0, 0, 150);
        thrusterGradient.addColorStop(0, "rgba(255, 0, 0, 1)");
        thrusterGradient.addColorStop(1, "rgba(255, 255, 0, 0)");


        const leftWing = new Triangle('#505050');
        {
            leftWing.points = [0, 0, 100, -200, 100, 0];
            leftWing.x = -250;
            leftWing.y = 100;
            this.children.push(leftWing);

            const leftThruster = new Rect(thrusterGradient);
            {
                leftThruster.x = -120;
                leftThruster.y = 50;
                leftThruster.w = 80;
                leftThruster.h = 100;
                this.children.push(leftThruster);
            }
        }

        const rightWing = new Triangle('#505050');
        {
            rightWing.points = [0, 0, 0, -200, 100, 0];
            rightWing.x = 150;
            rightWing.y = 100;
            this.children.push(rightWing);

            const rightThruster = new Rect(thrusterGradient);
            {
                rightThruster.x = 80;
                rightThruster.y = 50;
                rightThruster.w = 80;
                rightThruster.h = 100;
                this.children.push(rightThruster);
            }
        }

    }

    update() {

    }
};

class Star extends GraphicsObject {
    constructor(x, y, alpha) {
        super();

        this.x = x;
        this.y = y;
        this.rotationSpeed = 0.1;
        this.zIndex = -1;
        this.alpha = alpha;

        const shape = new CustomShape(`rgba(255,250,134, ${this.alpha})`);
        
        const vertices = 5;
        const angle = (2 * Math.PI) / vertices;

        const random = getRandomInt(25, 50);

        for(let i = 0; i < vertices; i++) {
            const x1 = 100 * Math.sin(i * angle);
            const y1 = -100 * Math.cos(i * angle);
            shape.points.push(x1,y1);

            const x2 = random * Math.sin(i * angle + angle / 2);
            const y2 = -random * Math.cos(i * angle + angle / 2);
            shape.points.push(x2, y2)
        }

        shape.rotation = (2 * Math.PI) / getRandomInt(0, 12);
        this.shape = shape;

        this.children.push(shape);
    }

    update() {
        this.y += this.speed;

        if(this.y > canvas.height) destroy(this);
    };
}

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

        const shape = new CustomShape('#505050');
        const vertices = 50;

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

const spawnStars = () => {
    for(let i = 0; i < 50; i++) {
        let random = getRandomInt(50, 200) / 1000;
        const alpha = (random * 1000) / 300;
        const x = getRandomInt(0, canvas.width);
        const y = getRandomInt(0, canvas.height);
        const star = new Star(x, y, alpha);

        star.scaleX = random;
        star.scaleY = random;
        star.speed = random * 15; 

        objects.push(star);
    }
};

const objects = [];

const spaceShip = new SpaceShip();
spaceShip.x = 500;
spaceShip.y = canvas.height - 50;
spaceShip.scaleX = 0.25;
spaceShip.scaleY = 0.25;

objects.push(spaceShip);

let ticks = 0;

const draw = () => {
    objects.sort((elem1, elem2) => elem1.zIndex - elem2.zIndex);

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#000029';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    if(ticks === 100) {
        ticks = 0;
    }
  
    ticks++;  

    if(ticks % 5 === 0) {
        objects.push(new Projectile(spaceShip.x, spaceShip.y - 75));
        
    }

    if(ticks % 50 === 0) {
        const asteroid = new Asteroid();
        asteroid.x = getRandomInt(0, canvas.width - 200);
        asteroid.y = -200;
        
        let random = getRandomInt(5, 10) / 10;

        asteroid.scaleX = random;
        asteroid.scaleY = random;
        objects.push(asteroid);
    }

    if(ticks % 10 === 0) {

        let random = getRandomInt(50, 200) / 1000;
        const alpha = (random * 1000) / 300;
        const x = getRandomInt(0, canvas.width - 10);
        const y = -200;
        const star = new Star(x, y, alpha);

        star.scaleX = random;
        star.scaleY = random;
        star.speed = random * 15; 

        objects.push(star);
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
spawnStars();

requestAnimationFrame(draw);

const destroy = (destroyedObject) => {
    destroyedObject.destroyed = true;
};

