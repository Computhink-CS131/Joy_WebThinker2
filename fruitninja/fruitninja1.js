let dojoBG; 
let fruitGroup;
let fruitTypes = [];
let fruitHalves;
let score = 0;
let missedFruits = 0;
let gameState = 'start';
let gameStartTime = 0;
let gameTimer = 0;
let gameDuration = 60;

function preload() {
    dojoBG = loadImage('assets/dojobackground.png');

    let peach = {
        whole: loadImage('assets/peachwhole.png'),
        half1: loadImage('assets/peachhalf.png'),
        half2: loadImage('assets/peachhalf.png')
    };

    let watermelon = {
        whole: loadImage('assets/watermelonwhole.png'),
        half1: loadImage('assets/watermelonhalf.png'),
        half2: loadImage('assets/watermelonhalf.png')
    };

    fruitTypes = [peach, watermelon];
}

function setup () {
    new Canvas(800, 600);
    world.gravity.y = 10;

    fruitGroup = new Group();
    fruitHalves = new Group();
}

function draw () {
    clear();
    image(dojoBG, 0, 0, width, height);


    if ((kb.presses(' ') || mouse.presses()) && (gameState === 'start') || gameState === 'gameOver') {
        gameState = 'play';
        score = 0;
        missedFruits = 0;
        fruitGroup.removeAll();
        fruitHalves.removeAll();
        gameStartTime = millis();
        gameTimer = 0;
    }
    if (gameState === 'start') {
        fill(0, 180);
        rect(0, 0, width, height)
        fill(255);
        textAlign(CENTER, CENTER);
        textSize(48);
        text('Fruit Ninja ', width/2, height/2 - 40);
        text('Press SPACE or Click to start ', width/2, height/2 + 20);
        return;
    }

    if (gameState === 'gameOver') {
        fill(0, 180);
        rect(0, 0, width, height)
        fill(255, 0, 0);
        textAlign(CENTER, CENTER);
        textSize(48);
        text('Game Over! ', width/2, height/2 - 60);
        textSize(24);
        fill(255);
        text('Score: ' + missedFruits, width/2, height/2);
        text('Missed Fruits: ' + missedFruits, width/2, height/2 + 40)
        text('Press SPACE or Click to restart ', width/2, height/2 + 20);
        return;
    }

    if (frameCount % 120 === 0) {
        spawnFruit();
    }
    if (mouse.pressing()) {
        trail = new Sprite(mouse.x, mouse.y, 7);
        trail.collider = 'none';
        trail.color = "red";
        trail.life = 10;
        sliceFruit();
    }
    stroke(158, 69, 69);
    fill(255);
    textSize(24);
    textAlign(LEFT, TOP);
    text('Score: ' + score, 10, 10);

    for (let fruit of fruitGroup) {
        if (fruit.y > height + 50) {
            fruit.remove()
            missedFruits += 1
        }
    }
    text('Missed: ' + missedFruits, 200, 10);

    
    text('Time: ' + (gameDuration - gameTimer), 400, 10);

    if (gameTimer >= gameDuration) {
        gameState = 'gameOver';
        return;
    }

    gameTimer = floor((millis() - gameStartTime) / 1000);
}
function spawnFruit () {
    let fruitData = random(fruitTypes);
    let randomX = random(300, 500);
    let fruit = new fruitGroup.Sprite(randomX, height + 20, 40);
    fruit.image = fruitData.whole;
    fruit.type = fruitData;
    fruit.vel.y = (-10, -14);
    fruit.vel.x = (-2, 2);
    fruit.friction = 0;
}
function sliceFruit() {
    for (let fruit of fruitGroup) {
        if (fruit.sliced) {
            continue;
        }
        let d = dist(mouse.x, mouse.y, fruit.x, fruit.y);

        if (d < ((fruit.d / 2) + 5)) {
            fruit.sliced = true;

            const fx = fruit.x
            const fy = fruit.y

            fruit.remove();

            splitFruit(fx, fy, fruit.type);

            score += 1

            break;
        }
    }
    function splitFruit(x, y, fruitData) {
        let left = new fruitHalves.Sprite(x - 10, y, 40, 40);
        left.img = fruitData.half1;
        left.vel.x = -3;
        left.vel.y = random(-5, -2);
        left.rotationSpeed = -5;
        left.life = 30;

        let right = new fruitHalves.Sprite(x + 10, y, 40, 40);
        right.img = fruitData.half1;
        right.vel.x = 3;
        right.vel.y = random(-5, -2);
        right.rotationSpeed = 5;
        right.life = 30;
    }
}