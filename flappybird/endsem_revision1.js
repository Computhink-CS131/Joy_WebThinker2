let birdy;
let birdysprite;
let bg;

function preload() {
    birdy = loadImage("assets/bluebird-midflap.png")
    bg = loadImage("assets/background-night.png")
}

function setup () {
    createCanvas(600, 400);
}

function draw () {
    if (mouse.presses()) {
        birdy.up
    }
}