const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

const scoreElement = document.getElementById('score');
const highscoreElement = document.getElementById('highscore');
const gameOverScreen = document.getElementById('gameOverScreen');
const finalScoreElement = document.getElementById('finalScore');
const pauseButton = document.getElementById('pause');
const restartButton = document.getElementById('restart');
const startScreen = document.getElementById('startScreen');

let score = 0;
let highscore = localStorage.getItem('highscore') || 0;
let gamePaused = false;
let gameOver = false;
let hero;
let meteors = [];
const earthRadius = 75;

// Load images
const backgroundImage = new Image();
backgroundImage.src = 'Assets/Background.png'; // Path to your background image
const earthImage = new Image();
earthImage.src = 'Assets/Earth.png';
const heroImage = new Image();
heroImage.src = 'Assets/Character.png';
const meteorImage = new Image();
meteorImage.src = 'Assets/Meteor.png';

// Set initial highscore
highscoreElement.textContent = highscore;

class Hero {
    constructor() {
        this.width = 200;
        this.height = 200;
        this.x = canvas.width / 2 - this.width / 2;
        this.y = canvas.height - this.height - 200; // Moved higher up
        this.speed = 30;
        this.dx = 0;
        this.image = heroImage; // Use the preloaded hero image
    }

    draw() {
        ctx.drawImage(this.image, this.x, this.y, this.width, this.height);
    }

    update() {
        this.x += this.dx;

        // Check wall collisions
        if (this.x < 0) {
            this.x = 0;
        }
        if (this.x + this.width > canvas.width) {
            this.x = canvas.width - this.width;
        }
    }

    move(direction) {
        this.dx = direction === 'left' ? -this.speed : this.speed;
    }

    stop() {
        this.dx = 0;
    }
}

class Meteor {
    constructor() {
        this.image = meteorImage; // Use the preloaded meteor image
        this.width = 150; // Adjust to the size of your meteor image
        this.height = 150;
        this.x = Math.random() * (canvas.width - this.width);
        this.y = -this.height;
        this.dy = Math.random() * 3 + 2;
    }

    draw() {
        ctx.drawImage(this.image, this.x, this.y, this.width, this.height);
    }

    update() {
        this.y += this.dy;
    }
}

function drawBackground() {
    // Draw the background image to cover the entire canvas
    ctx.drawImage(backgroundImage, 0, 0, canvas.width, canvas.height);
}

function drawEarth() {
    const earthWidth = canvas.width; // Set the Earth to span the full width of the canvas
    const earthHeight = 216; // Adjust the height of the Earth image
    const offsetY = 10; // Move the Earth up by 20 pixels (adjust as needed)

    // Draw the Earth image at the bottom of the canvas
    ctx.drawImage(
        earthImage, 
        0, // X-coordinate (left side of the canvas)
        canvas.height - earthHeight - offsetY, // Y-coordinate (adjusted to move the Earth up)
        earthWidth, // Width of the Earth (full width of the canvas)
        earthHeight // Height of the Earth image
    );
}

function detectCollision(meteor) {
    // Hero collision
    if (
        meteor.y + meteor.height > hero.y &&
        meteor.x + meteor.width > hero.x &&
        meteor.x < hero.x + hero.width
    ) {
        return true;
    }

    // Earth collision
    if (meteor.y + meteor.height > canvas.height - earthRadius) {
        gameOver = true;
    }

    return false;
}

function updateGame() {
    if (gamePaused || gameOver) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw background
    drawBackground();

    // Draw and update hero
    hero.draw();
    hero.update();

    // Draw and update meteors
    meteors.forEach((meteor, index) => {
        meteor.draw();
        meteor.update();

        if (detectCollision(meteor)) {
            meteors.splice(index, 1);
            score++;
            scoreElement.textContent = score;
        }
    });

    // Add new meteors
    if (meteors.length < 5 && Math.random() < 0.01) { // Adjusted spawn rate and limit
        meteors.push(new Meteor());
    }

    // Draw Earth
    drawEarth();

    if (gameOver) {
        handleGameOver();
    } else {
        requestAnimationFrame(updateGame);
    }
}

function handleGameOver() {
    finalScoreElement.textContent = score;
    gameOverScreen.style.display = 'block';

    if (score > highscore) {
        highscore = score;
        localStorage.setItem('highscore', highscore);
        highscoreElement.textContent = highscore;
    }
}

function resetGame() {
    score = 0;
    scoreElement.textContent = score;
    meteors = [];
    gameOver = false;
    gameOverScreen.style.display = 'none';
    updateGame();
}

function initGame() {
    hero = new Hero();
    resetGame();
}

function startGame() {
    startScreen.style.display = 'none';
    initGame();
}

// Show the start screen and set up event listeners
function showStartScreen() {
    startScreen.style.display = 'flex';
    document.addEventListener('keydown', startGameOnce, { once: true });
    canvas.addEventListener('touchstart', startGameOnce, { once: true });
}

function startGameOnce() {
    document.removeEventListener('keydown', startGameOnce);
    canvas.removeEventListener('touchstart', startGameOnce);
    startGame();
}

pauseButton.addEventListener('click', () => {
    gamePaused = !gamePaused;
    pauseButton.textContent = gamePaused ? 'Resume' : 'Pause';
    if (!gamePaused) updateGame();
});

restartButton.addEventListener('click', resetGame);

document.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft') {
        hero.move('left');
    } else if (e.key === 'ArrowRight') {
        hero.move('right');
    }
});

document.addEventListener('keyup', () => {
    hero.stop();
});

// For touch controls on mobile
canvas.addEventListener('touchstart', (e) => {
    const touchX = e.touches[0].clientX;
    if (touchX < canvas.width / 2) {
        hero.move('left');
    } else {
        hero.move('right');
    }
});

canvas.addEventListener('touchend', () => {
    hero.stop();
});

window.addEventListener('resize', () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    // Optionally, you might want to reset or reinitialize game elements
    // resetGame();
});

showStartScreen();
