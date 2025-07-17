
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Sound system
let audioContext;
let sounds = {};

function initAudio() {
    try {
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
        createSounds();
    } catch (e) {
        console.log('Audio not supported');
    }
}

function createSounds() {
    // Paddle hit sound
    sounds.paddleHit = createTone(200, 0.1, 'sine');
    
    // Brick hit sound
    sounds.brickHit = createTone(400, 0.15, 'square');
    
    // Brick destroyed sound
    sounds.brickDestroyed = createTone(600, 0.2, 'sawtooth');
    
    // Wall hit sound
    sounds.wallHit = createTone(300, 0.1, 'triangle');
    
    // Life lost sound
    sounds.lifeLost = createTone(150, 0.3, 'sawtooth');
    
    // Power-up sound
    sounds.powerUp = createTone(600, 0.2, 'sine');
    
    // Game over sound
    sounds.gameOver = createTone(100, 0.5, 'sawtooth');
    
    // Win sound
    sounds.win = createTone(800, 0.3, 'sine');
}

function createTone(frequency, duration, type) {
    return function() {
        if (!audioContext) return;
        
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.frequency.setValueAtTime(frequency, audioContext.currentTime);
        oscillator.type = type;
        
        gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration);
        
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + duration);
    };
}

// Initialize audio when user interacts
document.addEventListener('click', () => {
    if (!audioContext) {
        initAudio();
    }
});

// Game variables
let score = 0;
let lives = 5;
let level = 1;
let gameOver = false;
let gameStarted = false;
let gamePaused = false;
let initialStart = true;

// Paddle
const paddle = {
    x: canvas.width / 2 - 50,
    y: canvas.height - 20,
    width: 100,
    height: 10,
    color: '#fff',
    dx: 0,
    acceleration: 0.5,
    maxSpeed: 10
};

const balls = [];

function createBall(isInitial) {
    const newBall = {
        x: isInitial ? paddle.x + paddle.width / 2 : canvas.width / 2,
        y: isInitial ? paddle.y - 10 : canvas.height - 30,
        radius: 10,
        speed: 4,
        dx: 4,
        dy: -4,
        color: '#fff'
    };
    balls.push(newBall);
}

// Bricks
const brickInfo = {
    width: 75,
    height: 20,
    padding: 10,
    offsetTop: 30,
    offsetLeft: 30,
    color: ['#f00', '#ff0', '#0f0'] // Red, Yellow, Green for different hit counts
};

let bricks = [];

function createBricks() {
    for (let c = 0; c < 8; c++) {
        bricks[c] = [];
        for (let r = 0; r < 3; r++) {
            const brickX = c * (brickInfo.width + brickInfo.padding) + brickInfo.offsetLeft;
            const brickY = r * (brickInfo.height + brickInfo.padding) + brickInfo.offsetTop;
            bricks[c][r] = { x: brickX, y: brickY, status: 1, hits: r + 1 }; // hits determine color and durability
        }
    }
}

createBricks();

// Create initial ball
createBall(true);

// Power-ups
const powerUps = [];
const powerUpTypes = [
    { name: 'fire', color: '#f5a623' },
    { name: 'sticky', color: '#4a90e2' },
    { name: 'extraBall', color: '#7ed321' },
    { name: 'slowDown', color: '#d0021b' }
];
const negativePowerUps = [
    { name: 'speedUp', color: '#bd10e0' },
    { name: 'clearGood', color: '#9013fe' }
];

// Game state
let stickyBall = false;
let fireBall = false;
let particles = [];

// --- DRAW FUNCTIONS ---

function drawPaddle() {
    ctx.beginPath();
    
    // Create curved paddle with rounded corners
    const radius = paddle.height / 2;
    
    // Main paddle body with gradient
    const gradient = ctx.createLinearGradient(paddle.x, paddle.y, paddle.x, paddle.y + paddle.height);
    gradient.addColorStop(0, '#888');
    gradient.addColorStop(1, '#fff');
    ctx.fillStyle = gradient;
    
    // Draw rounded rectangle
    ctx.moveTo(paddle.x + radius, paddle.y);
    ctx.lineTo(paddle.x + paddle.width - radius, paddle.y);
    ctx.quadraticCurveTo(paddle.x + paddle.width, paddle.y, paddle.x + paddle.width, paddle.y + radius);
    ctx.lineTo(paddle.x + paddle.width, paddle.y + paddle.height - radius);
    ctx.quadraticCurveTo(paddle.x + paddle.width, paddle.y + paddle.height, paddle.x + paddle.width - radius, paddle.y + paddle.height);
    ctx.lineTo(paddle.x + radius, paddle.y + paddle.height);
    ctx.quadraticCurveTo(paddle.x, paddle.y + paddle.height, paddle.x, paddle.y + paddle.height - radius);
    ctx.lineTo(paddle.x, paddle.y + radius);
    ctx.quadraticCurveTo(paddle.x, paddle.y, paddle.x + radius, paddle.y);
    ctx.fill();
    ctx.closePath();
    
    // Add highlight for 3D effect
    ctx.beginPath();
    ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.moveTo(paddle.x + radius, paddle.y);
    ctx.lineTo(paddle.x + paddle.width - radius, paddle.y);
    ctx.quadraticCurveTo(paddle.x + paddle.width, paddle.y, paddle.x + paddle.width, paddle.y + radius);
    ctx.lineTo(paddle.x + paddle.width, paddle.y + paddle.height / 2);
    ctx.lineTo(paddle.x, paddle.y + paddle.height / 2);
    ctx.lineTo(paddle.x, paddle.y + radius);
    ctx.quadraticCurveTo(paddle.x, paddle.y, paddle.x + radius, paddle.y);
    ctx.fill();
    ctx.closePath();
}

function drawBalls() {
    for (const ball of balls) {
        // Main 3D sphere with enhanced gradient
        ctx.beginPath();
        const gradient = ctx.createRadialGradient(
            ball.x - ball.radius * 0.3, 
            ball.y - ball.radius * 0.3, 
            0, 
            ball.x, 
            ball.y, 
            ball.radius
        );
        
        const baseColor = fireBall ? '#f5a623' : ball.color;
        gradient.addColorStop(0, '#fff');
        gradient.addColorStop(0.4, baseColor);
        gradient.addColorStop(0.8, '#666');
        gradient.addColorStop(1, '#333');
        
        ctx.fillStyle = gradient;
        ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.closePath();
        
        // Add highlight for 3D effect
        ctx.beginPath();
        const highlightGradient = ctx.createRadialGradient(
            ball.x - ball.radius * 0.4,
            ball.y - ball.radius * 0.4,
            0,
            ball.x - ball.radius * 0.4,
            ball.y - ball.radius * 0.4,
            ball.radius * 0.6
        );
        highlightGradient.addColorStop(0, 'rgba(255, 255, 255, 0.8)');
        highlightGradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
        
        ctx.fillStyle = highlightGradient;
        ctx.arc(ball.x, ball.y, ball.radius * 0.6, 0, Math.PI * 2);
        ctx.fill();
        ctx.closePath();
        
        // Add shadow/reflection on bottom
        ctx.beginPath();
        const shadowGradient = ctx.createRadialGradient(
            ball.x + ball.radius * 0.2,
            ball.y + ball.radius * 0.2,
            0,
            ball.x + ball.radius * 0.2,
            ball.y + ball.radius * 0.2,
            ball.radius * 0.8
        );
        shadowGradient.addColorStop(0, 'rgba(0, 0, 0, 0.3)');
        shadowGradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
        
        ctx.fillStyle = shadowGradient;
        ctx.arc(ball.x, ball.y, ball.radius * 0.8, 0, Math.PI * 2);
        ctx.fill();
        ctx.closePath();
    }
}

function drawBricks() {
    for (let c = 0; c < bricks.length; c++) {
        for (let r = 0; r < bricks[c].length; r++) {
            const brick = bricks[c][r];
            if (brick.status === 1) {
                ctx.beginPath();
                
                // Create more angled metallic gradient
                const startX = brick.x - brickInfo.width * 0.2;
                const startY = brick.y - brickInfo.height * 0.2;
                const endX = brick.x + brickInfo.width * 1.2;
                const endY = brick.y + brickInfo.height * 1.2;
                
                const gradient = ctx.createLinearGradient(startX, startY, endX, endY);
                
                // Simple metallic gradient with fewer stops
                const baseColor = brickInfo.color[brick.hits - 1];
                const darkColor = '#000';
                const lightColor = '#fff';
                
                gradient.addColorStop(0, darkColor);
                gradient.addColorStop(0.3, baseColor);
                gradient.addColorStop(0.7, lightColor);
                gradient.addColorStop(1, baseColor);
                
                ctx.fillStyle = gradient;
                ctx.rect(brick.x, brick.y, brickInfo.width, brickInfo.height);
                ctx.fill();
                ctx.closePath();
                
                // Add a subtle highlight line for extra metallic effect
                ctx.beginPath();
                ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
                ctx.lineWidth = 1;
                ctx.moveTo(brick.x, brick.y);
                ctx.lineTo(brick.x + brickInfo.width * 0.3, brick.y);
                ctx.stroke();
                ctx.closePath();
            }
        }
    }
}

function drawUI() {
    ctx.font = '16px "Press Start 2P"';
    ctx.fillStyle = '#fff';

    ctx.textAlign = 'left';
    ctx.fillText('Score: ' + score, 8, 20);

    ctx.textAlign = 'right';
    ctx.fillText('Lives: ' + lives, canvas.width - 8, 20);
}

function drawPowerUps() {
    for (const powerUp of powerUps) {
        ctx.beginPath();
        ctx.rect(powerUp.x, powerUp.y, 10, 10);
        ctx.fillStyle = powerUp.color;
        ctx.fill();
        ctx.closePath();
    }
}

function drawParticles() {
    for (let i = particles.length - 1; i >= 0; i--) {
        const particle = particles[i];
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2);
        ctx.fillStyle = particle.color;
        ctx.fill();
        ctx.closePath();
    }
}

// --- COLLISION DETECTION ---

let gameWon = false;

function collisionDetection() {
    // Ball and bricks
    for (let c = 0; c < bricks.length; c++) {
        for (let r = 0; r < bricks[c].length; r++) {
            const brick = bricks[c][r];
            if (brick.status === 1) {
                if (
                    balls[0].x + balls[0].radius > brick.x &&
                    balls[0].x - balls[0].radius < brick.x + brickInfo.width &&
                    balls[0].y + balls[0].radius > brick.y &&
                    balls[0].y - balls[0].radius < brick.y + brickInfo.height
                ) {
                    balls[0].dy = -balls[0].dy;
                    sounds.brickHit();
                    if (!fireBall) {
                        brick.hits--;
                        if (brick.hits === 0) {
                            brick.status = 0;
                            score++;
                            sounds.brickDestroyed();
                            // Create particles
                            for (let i = 0; i < 10; i++) {
                                particles.push({
                                    x: brick.x + brickInfo.width / 2,
                                    y: brick.y + brickInfo.height / 2,
                                    radius: Math.random() * 2 + 1,
                                    color: brickInfo.color[2],
                                    dx: (Math.random() - 0.5) * 4,
                                    dy: (Math.random() - 0.5) * 4,
                                    life: 30
                                });
                            }
                            // Chance to drop a power-up
                            if (Math.random() < 0.2) {
                                dropPowerUp(brick.x, brick.y);
                            }
                        }
                    } else {
                        brick.status = 0;
                        score++;
                    }

                    if (score === bricks.length * bricks[0].length) {
                        gameWon = true;
                        gameOver = true;
                        sounds.win();
                    }
                }
            }
        }
    }

    // Ball and paddle
    if (
        balls[0].x > paddle.x &&
        balls[0].x < paddle.x + paddle.width &&
        balls[0].y + balls[0].radius > paddle.y
    ) {
        sounds.paddleHit();
        let collidePoint = balls[0].x - (paddle.x + paddle.width / 2);
        collidePoint = collidePoint / (paddle.width / 2);
        let angle = collidePoint * (Math.PI / 3);
        balls[0].dx = balls[0].speed * Math.sin(angle);
        balls[0].dy = -balls[0].speed * Math.cos(angle);

        if (stickyBall) {
            gameStarted = false;
            balls[0].y = paddle.y - balls[0].radius;
        }
    }

    // Ball and walls
    if (balls[0].x + balls[0].dx > canvas.width - balls[0].radius || balls[0].x + balls[0].dx < balls[0].radius) {
        balls[0].dx = -balls[0].dx;
        sounds.wallHit();
    }
    if (balls[0].y + balls[0].dy < balls[0].radius) {
        balls[0].dy = -balls[0].dy;
        sounds.wallHit();
    } else if (balls[0].y + balls[0].dy > canvas.height - balls[0].radius) {
        lives--;
        sounds.lifeLost();
        if (!lives) {
            gameOver = true;
            sounds.gameOver();
        } else {
            resetBallAndPaddle();
        }
    }
}

// --- POWER-UP LOGIC ---

function dropPowerUp(x, y) {
    const type = Math.random() < 0.7 ? powerUpTypes[Math.floor(Math.random() * powerUpTypes.length)] : negativePowerUps[Math.floor(Math.random() * negativePowerUps.length)];
    powerUps.push({ x, y, type: type.name, color: type.color, dy: 2 });
}

function updatePowerUps() {
    for (let i = powerUps.length - 1; i >= 0; i--) {
        const powerUp = powerUps[i];
        powerUp.y += powerUp.dy;

        // Check for collision with paddle
        if (
            powerUp.y > paddle.y &&
            powerUp.x > paddle.x &&
            powerUp.x < paddle.x + paddle.width
        ) {
            sounds.powerUp();
            activatePowerUp(powerUp.type);
            powerUps.splice(i, 1);
        }

        // Remove if it goes off-screen
        if (powerUp.y > canvas.height) {
            powerUps.splice(i, 1);
        }
    }
}

let notifications = [];

function drawNotifications() {
    ctx.font = '16px "Press Start 2P"';
    ctx.fillStyle = '#fff';
    ctx.textAlign = 'center';
    for (let i = 0; i < notifications.length; i++) {
        ctx.fillText(notifications[i].text, canvas.width / 2, 60 + i * 20);
    }
}

function activatePowerUp(type) {
    notifications.push({ text: type.toUpperCase() + '!', time: 120 });
    switch (type) {
        case 'fire':
            fireBall = true;
            setTimeout(() => fireBall = false, 10000);
            break;
        case 'sticky':
            stickyBall = true;
            setTimeout(() => stickyBall = false, 10000);
            break;
        case 'extraBall':
            // This is more complex, for now, we'll just give an extra life
            lives++;
            break;
        case 'slowDown':
            balls[0].dx /= 2;
            balls[0].dy /= 2;
            setTimeout(() => {
                balls[0].dx *= 2;
                balls[0].dy *= 2;
            }, 10000);
            break;
        case 'speedUp':
            balls[0].dx *= 2;
            balls[0].dy *= 2;
            setTimeout(() => {
                balls[0].dx /= 2;
                balls[0].dy /= 2;
            }, 10000);
            break;
        case 'clearGood':
            fireBall = false;
            stickyBall = false;
            break;
    }
}

// --- GAME LOOP ---

function update() {
    if (gameOver) {
        return;
    }

    if (!gameStarted) {
        balls[0].x = paddle.x + paddle.width / 2;
        balls[0].y = paddle.y - balls[0].radius;
    }

    if (gamePaused) {
        return;
    }

    if (rightPressed) {
        paddle.dx += paddle.acceleration;
        if (paddle.dx > paddle.maxSpeed) {
            paddle.dx = paddle.maxSpeed;
        }
    } else if (leftPressed) {
        paddle.dx -= paddle.acceleration;
        if (paddle.dx < -paddle.maxSpeed) {
            paddle.dx = -paddle.maxSpeed;
        }
    } else {
        paddle.dx *= 0.9; // friction
    }

    paddle.x += paddle.dx;

    if (paddle.x < 0) {
        paddle.x = 0;
        paddle.dx = 0;
    } else if (paddle.x + paddle.width > canvas.width) {
        paddle.x = canvas.width - paddle.width;
        paddle.dx = 0;
    }

    // Move ball
    if (gameStarted) {
        balls[0].x += balls[0].dx;
        balls[0].y += balls[0].dy;
    }

    collisionDetection();
    updatePowerUps();

    // Update particles
    for (let i = particles.length - 1; i >= 0; i--) {
        const particle = particles[i];
        particle.x += particle.dx;
        particle.y += particle.dy;
        particle.life--;
        if (particle.life === 0) {
            particles.splice(i, 1);
        }
    }

    // Update notifications
    for (let i = notifications.length - 1; i >= 0; i--) {
        notifications[i].time--;
        if (notifications[i].time === 0) {
            notifications.splice(i, 1);
        }
    }
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawBricks();
    drawPaddle();
    drawBalls();
    drawPowerUps();
    drawParticles();

    if (gameOver) {
        ctx.font = '48px "Press Start 2P"';
        ctx.fillStyle = '#fff';
        ctx.textAlign = 'center';
        if (gameWon) {
            ctx.fillText('YOU WIN!', canvas.width / 2, canvas.height / 2);
            ctx.font = '24px "Press Start 2P"';
            ctx.fillText('Score: ' + score, canvas.width / 2, canvas.height / 2 + 50);
            ctx.font = '16px "Press Start 2P"';
            ctx.fillText('Click to Restart', canvas.width / 2, canvas.height / 2 + 80);
        } else {
            ctx.fillText('GAME OVER', canvas.width / 2, canvas.height / 2);
        }
    } else if (initialStart) {
        ctx.font = '24px "Press Start 2P"';
        ctx.fillStyle = '#fff';
        ctx.textAlign = 'center';
        ctx.fillText('Click or Space to Start', canvas.width / 2, canvas.height / 2);
    }

    drawNotifications();
    drawUI();
}

function gameLoop() {
    update();
    draw();
    requestAnimationFrame(gameLoop);
}

// --- CONTROLS ---

let rightPressed = false;
let leftPressed = false;
let cheatCode = '';
const WIN_CHEAT = 'I WIN!';

document.addEventListener('keydown', (e) => {
    if (e.key === 'Right' || e.key === 'ArrowRight') {
        rightPressed = true;
    } else if (e.key === 'Left' || e.key === 'ArrowLeft') {
        leftPressed = true;
    } else if (e.code === 'Space' && !gameStarted) {
        gameStarted = true;
        initialStart = false;
    }
    
    // Handle cheat code
    if (e.key.length === 1) {
        cheatCode += e.key;
        if (cheatCode.length > WIN_CHEAT.length) {
            cheatCode = cheatCode.slice(-WIN_CHEAT.length);
        }
        if (cheatCode === WIN_CHEAT) {
            gameWon = true;
            gameOver = true;
            cheatCode = ''; // Reset cheat code
        }
    }
});

document.addEventListener('keyup', (e) => {
    if (e.key === 'Right' || e.key === 'ArrowRight') {
        rightPressed = false;
    } else if (e.key === 'Left' || e.key === 'ArrowLeft') {
        leftPressed = false;
    }
});

document.addEventListener('mousemove', (e) => {
    const rect = canvas.getBoundingClientRect();
    const relativeX = e.clientX - rect.left;
    if (relativeX > 0 && relativeX < canvas.width) {
        paddle.x = relativeX - paddle.width / 2;
    }
});

document.addEventListener('click', () => {
    if (gameOver && gameWon) {
        restartGame();
    } else if (!gameStarted) {
        gameStarted = true;
        initialStart = false;
    }
});


function resetBallAndPaddle() {
    gameStarted = false;
    balls[0].x = canvas.width / 2;
    balls[0].y = canvas.height - 30;
    balls[0].dx = 4;
    balls[0].dy = -4;
    paddle.x = (canvas.width - paddle.width) / 2;
}

function restartGame() {
    // Reset game state
    score = 0;
    lives = 5;
    level = 1;
    gameOver = false;
    gameStarted = false;
    gamePaused = false;
    initialStart = true;
    gameWon = false;
    
    // Reset paddle
    paddle.x = canvas.width / 2 - 50;
    paddle.dx = 0;
    
    // Clear balls and create new one
    balls.length = 0;
    createBall(true);
    
    // Reset power-ups
    powerUps.length = 0;
    particles.length = 0;
    notifications.length = 0;
    stickyBall = false;
    fireBall = false;
    
    // Recreate bricks
    createBricks();
}


gameLoop();
