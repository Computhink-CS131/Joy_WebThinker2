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
    world.gravity
}

function draw () {

    image(bg, 0, 0, 400, 600);
    
    if (mouse.presses()) {
        //birdysprite.up
    }
}