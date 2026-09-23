// the final game
let bird, floor
let flapMidImg, bg, base
let pipe
let bottomPipe
let pipeGroup

function preload() {
    flapMidImg = loadImage('assets/yellowbird-midflap.png') 
    flapDownImg = loadImage('assets/yellowbird-downflap.png')
    flapUpImg = loadImage('assets/yellowbird-upflap.png')
    bg = loadImage('assets/background-day.png')
    base = loadImage('assets/base.png')
    pipe = loadImage('assets/pipe-green.png')
}
function setup(){
    new Canvas(400, 600)
    bird = new Sprite;
    bird.x = width/2;
    bird.y = 200;
    bird.width = 30;
    bird.height = 30;
    bird.img = flapMidImg;

    bird.collider = "dynamic"
    bird.mass = 2;
    bird.drag = 0.02;
    bird.bounciness = 0.5;
    world.gravity.y = 10;

    floor = new Sprite();
    floor.x = 200;
    floor.y = height - 20;
    floor.width = 400;
    floor.height = 125;
    floor.collider = "static";
    floor.img = base;

    pipeGroup = new Group();
}
function draw(){
    image(bg, 0, 0, width, height);

    if (kb.presses('space')){
        bird.vel.y = - 5;
        bird.sleeping = false;
    }
    if (bird.vel.y < 0){
        bird.img = flapDownImg;
        bird.rotation = -20;
    }
    if (bird.vel.y > 0) {
        bird.img = flapUpImg;
        bird.rotation = 20;
    }
    if (bird.vel.y == 0){
        bird.img = flapMidImg;
        bird.rotation = 0;
    }
    
    fill("blue");
    textSize(14);
    text('vel.y:' + bird.isMoving);
    text('sleeping' + bird.sleeping);
    
    if (frameCount === 1){
        spawnPipePair();
    }

    bird.x += 3;
    camera.x = bird.x;
    floor.x = bird.x;

    if (frameCount % 90 === 0){
        spawnPipePair();
    }
    for (let pipe of pipeGroup){
        if (pipe.x < -50){
            pipe.remove();
        }
    }
}
function spawnPipePair(){
    let gap = 50;
    let midY = random(250, height - 250);
    
    topPipe = new Sprite(bird.x + 400, midY - gap / 2 - 200, 52, 320, 'static')
    topPipe.img = pipe;
    topPipe.rotation = 180;

    bottomPipe = new Sprite(bird.x + 400, midY + gap / 2 + 200, 52, 320, 'static')
    bottomPipe.img = pipe;

    pipeGroup.add(topPipe)
    pipeGroup.add(bottomPipe)
    pipeGroup.layer = 0;


}
