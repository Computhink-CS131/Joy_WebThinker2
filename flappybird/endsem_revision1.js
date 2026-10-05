let birdy;
let birdysprite;
let bg;

function preload() {
    birdy = loadImage("assets/bluebird-midflap.png")
    bg = loadImage("assets/background-night.png")
}

function setup () {
    createCanvas(400, 600);

    birdysprite = new Sprite(200, 200, 40)
    birdysprite.image = birdy
    world.gravity.y = 10;
}

function draw () {

    image(bg, 0, 0, 400, 600);
    
    if (mouse.presses()) {
        //birdysprite.up
        birdysprite.vel.y = - 5;
    }
}


///


_____ = new Sprite (x, y, size)
___ = load