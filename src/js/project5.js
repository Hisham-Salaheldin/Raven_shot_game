// basic canvas
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;
const canvasPosition = canvas.getBoundingClientRect();
// cnavas collisions
const canvasCollision = document.getElementById('canvasCollision');
const canvasCollision_ctx = canvasCollision.getContext('2d',{willReadFrequently:true});
canvasCollision.width = window.innerWidth;
canvasCollision.height = window.innerHeight;

// score set
let score = 0;
ctx.font = '20px Impact';


// deltaTime
const timeInterval = 800;
let deltaTime = 0;
let lastTime = 0;
let timer = 0;


// explosions, ravens and particles
let raven = [];
let explosions = [];
let particles = [];

// game over
let gameOver = false;
let outFlow = 0;

// object class
class Raven {
    constructor(){
        // image src
        this.image = new Image();
        this.image.src = '/game-images/enemies/raven.png';
        // image sheet crope size for one frame
        this.spriteWidth = 271;
        this.spritHeight = 194;
        // image streching and magnifies
        this.spriteModefier = Math.random() * 0.6 + 0.4;
        this.width = this.spriteWidth * this.spriteModefier;
        this.height = this.spritHeight * this.spriteModefier;
        // raven start x,y location 
        this.x = canvas.width;
        this.y = Math.random() * (canvas.height - this.height);
        // raven moving x,y speed 
        this.directionX = Math.random() * 5 + 3;
        this.directionY = Math.random() * 5 - 2.5;
        // raven animation frames
        this.gameFrame = 0;
        this.frameStager = 5;
        this.frame = Math.floor(this.gameFrame / this.frameStager) % 6;
        this.TimeSinceLastFlap = 0;
        this.flapeInterval = Math.random() * 5 + 5;
        this.hasTrail = Math.random() > 0.5;
        // filtration of out scope raven
        this.markedForDeletion = false;
        // canvas collision data rgb
        this.randomColor = [Math.floor(Math.random()*255),
            Math.floor(Math.random()*255),
            Math.floor(Math.random()*255)];
        this.color = `rgb(${this.randomColor[0]},${this.randomColor[1]},${this.randomColor[2]})`;

    }
    update(time){
        // marked for filteration
        if(this.x < -this.width){
            this.markedForDeletion = true;
        }
        // updating x,y location
        this.x -= this.directionX;
        this.y += this.directionY;
        if(this.y <= 0 || this.y >= canvas.height - this.height){
            this.directionY = this.directionY * -1;
        }
        // animating ravens
        this.gameFrame ++;
        this.TimeSinceLastFlap = time;
        if(this.TimeSinceLastFlap > this.flapeInterval){
            this.frame = Math.floor(this.gameFrame / this.frameStager) % 6;
            this.TimeSinceLastFlap = 0;
            if(this.hasTrail){
                for(let i = 0; i < 5; i++){
                    particles.push(new Particle(this.x,this.y,this.width,this.color));
                }
            }
        }
        // game over
        if(this.x < 0 - this.width){
            outFlow ++;
            if(outFlow > 3){
                gameOver = true;
            }
        }
    }
    draw(){
        canvasCollision_ctx.fillStyle = this.color;
        canvasCollision_ctx.fillRect(this.x, this.y, this.width, this.height);
        ctx.drawImage(this.image,this.spriteWidth * this.frame,0,
            this.spriteWidth,this.spritHeight,
            this.x,this.y,this.width,this.height);
    }
}

class Explosion {
    constructor(x,y,size){
        this.image = new Image();
        this.image.src = '/game-images/effects/boom-1000.png';
        this.spriteWidth = 200;
        this.spritHeight = 179;
        this.size = size * 0.7;
        this.x = x - (this.size* 0.5);
        this.y = y - (this.size* 0.5);
        this.frame = 0;
        this.exploInterval = 200;
        this.exploTime = 0;
        this.angel = Math.random() * 6.2;
        this.sound = new Audio();
        this.sound.src = '/game-sound/Ice attack 2.wav';
        this.markedForDeletion = false;
        
    }
    update(time){
        if(this.frame === 0)this.sound.play();
        this.exploTime += time;
        if(this.exploTime > this.exploInterval){
            this.frame++;
            this.exploTime = 0;
        }
    }

    draw(){
        ctx.drawImage(this.image,this.spriteWidth * this.frame,0,
            this.spriteWidth,this.spritHeight,
            this.x,this.y,this.size,this.size);
    }
}

class Particle {
    constructor(x,y,size,color){
        this.size = size;
        this.x = x + this.size / 2;
        this.y = y + this.size / 3;
        this.speed = Math.random() * 1 + 0.5;
        this.radius = Math.random() * this.size/10;
        this.maxRadius = Math.random() * 20 + 35;
        this.color = color;
        this.markedForDeletion = false;
    }
    update(){
        this.x += this.speed;
        this.radius += 0.6;
        if(this.radius > this.maxRadius - 5) this.markedForDeletion = true;
        
    };
    draw(){
        ctx.save()
        ctx.globalAlpha = 1 - this.radius/this.maxRadius;
        ctx.beginPath();
        ctx.fillStyle = this.color;
        ctx.arc(this.x,this.y,this.radius,0,Math.PI * 2);
        ctx.fill();
        ctx.restore();
    };
}

// draw score and add score click event
canvas.addEventListener('click', addScore);
function addScore(e){
    const detectPixelColor = canvasCollision_ctx.getImageData(e.x,e.y,1,1);
    const pixColor = detectPixelColor.data;
    // cneter client position on click
    const pos = {
        x : e.x - canvasPosition.left,
        y : e.y - canvasPosition.top
    };
    // give each raven background color to use the background color on click to add score
    raven.forEach(object => {
        if(object.randomColor[0] === pixColor[0] &&
            object.randomColor[1] === pixColor[1]&&
            object.randomColor[2] === pixColor[2]){
                object.markedForDeletion = true;
                score++;
                explosions.push(new Explosion(pos.x,pos.y,object.width));
        }
    });
    // Explosions on click and sound track
    explosions.forEach(explo =>{
        if(explo.frame === 5){
            explo.markedForDeletion = true;
        }
    });
}

function drawScore(){
    ctx.fillStyle = 'black';
    ctx.fillText("Score: " + score, 48,69);
    ctx.fillStyle = 'white';
    ctx.fillText("Score: " + score, 50,70);
}

function drawGameOver(){
    ctx.textAlign = 'center';
    ctx.fillStyle = 'black';
    ctx.fillText("GAME OVER, your score is " + score, canvas.width * 0.5, canvas.height * 0.5);
    ctx.fillStyle = 'red';
    ctx.fillText("GAME OVER, your score is " + score, canvas.width * 0.5 + 2, canvas.height * 0.5 + 2);
}

// creating and animating ravens
function creatRaven (){
    if(timer > timeInterval){
        raven.push(new Raven());
        timer = 0;
        // sort the bigger ravens above the small ravens via width compare
        raven.sort(function(a,b){
            return a.width - b.width;
        } );
    }
}

function animate(timestamp){
    ctx.clearRect(0,0,canvas.width,canvas.height);
    canvasCollision_ctx.clearRect(0,0,canvasCollision.width,canvasCollision.height)
    drawScore();
    deltaTime = timestamp - lastTime;
    lastTime = timestamp;
    timer += deltaTime;
    creatRaven();
    [...particles, ...raven, ...explosions].forEach(object => object.update(deltaTime));
    [...particles, ...raven, ...explosions].forEach(object => object.draw());
    raven = raven.filter(object => !object.markedForDeletion);
    explosions = explosions.filter(object => !object.markedForDeletion);
    particles = particles.filter(object => !object.markedForDeletion);
    if(!gameOver){
        requestAnimationFrame(animate);
    }else{
        drawGameOver();
    }
}
animate(lastTime);

