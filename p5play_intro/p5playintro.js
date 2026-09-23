let ball;
let box;

function setup() {
  // Set up the canvas
  new Canvas(800, 500);
  background("pink");

  ball = new Sprite();
  ball.x = 100;
  ball.y = 200;
  ball.diameter = 40;
  ball.color = "hotpink"
  ball.vel.x = 10;
  ball.vel.y = 10;
  ball.bounciness = 2;
  ball.collider = "dynamic"
  
  box = new Sprite();
  box.x = 100;
  box.y = 100;
  box.w = 50;
  box.h = 50;
  box.color = "hotpink"

}

function draw() {
  background(240);

  fill(0);
  textSize(16);
  text("Ball: (" + int(ball.x) + "," + int(ball.y)  + ")");
  text("Mouse: (" + mouseX + "," + mouseY  + ")", 10, 40);
  if (ball.x < 0 + ball.diameter / 2 || ball.x > width - ball.diameter / 2) {
    ball.vel.x *= -1;
  }

    if (ball.y < 0 + ball.diameter / 2 || ball.y > height - ball.diameter / 2) {
    ball.vel.y *= -1;
  }

  box.x = mouseX
  box.y = mouseY

}
  