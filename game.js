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
const startButton = document.getElementById('startButton');

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

// Load audio files
const backgroundMusic = new Audio('Assets/Background.mp3');
const startSound = new Audio('Assets/Start.mp3');
const destroySound = new Audio('Assets/Destroy.mp3');
const gameOverSound = new Audio('Assets/GameOver.mp3');

// Loop background music
backgroundMusic.loop = true;
backgroundMusic.volume = 0.5; // Adjust volume if needed

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
        destroySound.play(); // Play destruction sound
        destroySound.volume = 0.5; // Lower volume
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
    backgroundMusic.pause(); // Stop background music
    gameOverSound.play(); // Play game over sound
    gameOverSound.volume = 0.5; //lower volume
    finalScoreElement.textContent = score;
    gameOverScreen.style.display = 'block';

    // Display game over screen
    document.getElementById('gameOverScreen').style.display = 'flex';

    if (score > highscore) {
        highscore = score;
        localStorage.setItem('highscore', highscore);
        highscoreElement.textContent = highscore;
    }
}

function resetGame() {
    gameOverSound.pause(); // Stop game over sound if it was playing
    gameOverSound.currentTime = 0; // Reset game over sound
    backgroundMusic.currentTime = 0; // Reset background music
    backgroundMusic.play(); // Play background music again
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
    backgroundMusic.play(); // Start background music
    initGame();
}

// Show the start screen and set up event listeners
function showStartScreen() {
    startSound.play();

    startScreen.style.display = 'flex';

    // Hide game elements
    document.querySelector('.overlay').style.display = 'none';

    startButton.addEventListener('click', startGameOnce);
}

function startGameOnce() {

    // Hide the start screen and show the game canvas
    startScreen.style.display = 'none';

    // Show game elements
    document.querySelector('.overlay').style.display = 'block';
    document.querySelector('#pause').style.display = 'block';


    // Render the game scene (background, Earth, hero, etc.) before the countdown
    drawInitialGameScreen();

    // Start the countdown before starting the game
    startCountdown(() => {
        backgroundMusic.play(); // Start background music after countdown
        updateGame(); // Now start the game loop
    });

    // Remove the event listeners to avoid triggering the game multiple times
    document.removeEventListener('keydown', startGameOnce);
    canvas.removeEventListener('touchstart', startGameOnce);
}

function drawInitialGameScreen() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw background, Earth, hero, and other game elements
    drawBackground();
    drawEarth();
    hero = new Hero(); // Initialize the hero character
    hero.draw(); // Draw the hero on screen

    // Optionally, draw any static meteors or initial game state here
    meteors.forEach((meteor) => meteor.draw());
}

function startCountdown(callback) {
    const countdownText = document.createElement('div');
    countdownText.style.position = 'absolute';
    countdownText.style.top = '50%';
    countdownText.style.left = '50%';
    countdownText.style.transform = 'translate(-50%, -50%)';
    countdownText.style.fontSize = '48px';
    countdownText.style.color = '#FFFFFF';
    countdownText.style.textAlign = 'center';
    countdownText.style.zIndex = '10'; // Ensure it's above the canvas
    document.body.appendChild(countdownText);

    // Countdown messages
    const messages = ['Are you ready?', '3', '2', '1', 'Protect the Earth!'];

    let index = 0;
    const countdownInterval = setInterval(() => {
        countdownText.textContent = messages[index];
        index++;

        if (index === messages.length) {
            setTimeout(() => { // Add a slight delay before clearing
                clearInterval(countdownInterval);
                document.body.removeChild(countdownText);
                callback(); // Start the game after countdown
            }, 500); // 0.5-second delay
        }
    }, 1000); // 1-second interval between each message
}

pauseButton.addEventListener('click', () => {
    gamePaused = !gamePaused;
    pauseButton.textContent = gamePaused ? 'Resume' : 'Pause';
    if (gamePaused) {
        backgroundMusic.pause(); // Pause music when the game is paused
    } else {
        backgroundMusic.play(); // Resume music when the game is resumed
        updateGame(); // Continue updating the game if not paused
    }
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
    // Adjust game elements if necessary
    drawInitialGameScreen();
});

showStartScreen();
