// Inicialización del juego
document.addEventListener('DOMContentLoaded', function() {
    createParticles();
    initGame();
});

// Sistema de partículas
function createParticles() {
    const particlesContainer = document.getElementById('particles');
    const particleCount = 40;
    
    for (let i = 0; i < particleCount; i++) {
        const particle = document.createElement('div');
        particle.classList.add('particle');
        
        const left = Math.random() * 100;
        const delay = Math.random() * 15;
        const duration = 10 + Math.random() * 10;
        
        particle.style.left = `${left}%`;
        particle.style.animationDelay = `${delay}s`;
        particle.style.animationDuration = `${duration}s`;
        
        const colors = ['var(--neon-pink)', 'var(--neon-blue)', 'var(--neon-green)', 'var(--neon-yellow)'];
        const randomColor = colors[Math.floor(Math.random() * colors.length)];
        particle.style.backgroundColor = randomColor;
        
        const size = 1 + Math.random() * 2;
        particle.style.width = `${size}px`;
        particle.style.height = `${size}px`;
        
        particlesContainer.appendChild(particle);
    }
}

// Variables del juego
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

// Configuración del canvas
canvas.width = 800;
canvas.height = 600;

// Estado del juego
let gameState = {
    score: 0,
    level: 1,
    lives: 3,
    invadersDestroyed: 0,
    highScore: localStorage.getItem('spaceInvadersHighScore') || 0,
    gameOver: false
};

// Elementos del juego
let player, bullets, invaders, explosions;
let enemyDirection = 1;
let gameActive = false;
let gamePaused = false;

// Inicializar juego
function initGame() {
    // Configurar botón de inicio
    const startBtn = document.getElementById("startBtn");
    const startScreen = document.getElementById("startScreen");
    const gameContent = document.querySelector(".game-content");
    
    startBtn.addEventListener("click", function() {
        startScreen.style.display = "none";
        gameContent.style.display = "block";
        startGame();
    });

    // Configurar botones de control
    document.getElementById("pauseBtn").addEventListener("click", togglePause);
    document.getElementById("restartBtn").addEventListener("click", restartGame);
    document.getElementById("resumeBtn").addEventListener("click", togglePause);
    document.getElementById("playAgainBtn").addEventListener("click", restartGame);
    document.getElementById("nextLevelBtn").addEventListener("click", nextLevel);
    document.getElementById("mainMenuBtn").addEventListener("click", () => {
        window.location.href = "../../index.html";
    });

    // Prevenir scroll con teclas
    document.addEventListener("keydown", e => {
        if (['ArrowLeft', 'ArrowRight', ' '].includes(e.key)) {
            e.preventDefault();
        }
    });

    updateHighScore();
}

// Iniciar juego
function startGame() {
    gameState = {
        score: 0,
        level: 1,
        lives: 3,
        invadersDestroyed: 0,
        highScore: localStorage.getItem('spaceInvadersHighScore') || 0,
        gameOver: false
    };
    
    // Jugador
    player = {
        x: canvas.width / 2,
        y: canvas.height - 80,
        width: 60,
        height: 25,
        speed: 6,
        color: "#00ccff",
        canShoot: true,
        shootCooldown: 400
    };
    
    bullets = [];
    invaders = [];
    explosions = [];
    enemyDirection = 1;
    
    gameActive = true;
    gamePaused = false;
    
    createInvaders();
    updateUI();
    gameLoop();
}

// Generar invasores
function createInvaders() {
    invaders = [];
    const rows = 5, cols = 9;
    const spacingX = 70, spacingY = 55;
    const offsetX = (canvas.width - cols * spacingX) / 2;
    const colors = ["#ff4d4d", "#ff9933", "#ffff66", "#99ff33", "#66ccff"];
    
    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
            invaders.push({
                x: offsetX + c * spacingX,
                y: 80 + r * spacingY,
                width: 40,
                height: 25,
                color: colors[r % colors.length],
                alive: true,
                speed: 1 + (gameState.level * 0.5)
            });
        }
    }
}

// Control de teclado
const keys = {};
document.addEventListener("keydown", e => {
    keys[e.key] = true;
    if (e.key === ' ') e.preventDefault();
});
document.addEventListener("keyup", e => keys[e.key] = false);

// Disparar
document.addEventListener("keydown", e => {
    if (e.code === "Space" && gameActive && !gamePaused && player.canShoot) {
        shoot();
    }
});

function shoot() {
    bullets.push({
        x: player.x + player.width / 2 - 2,
        y: player.y,
        width: 4,
        height: 10,
        speed: 8,
        color: "#00ffff"
    });
    player.canShoot = false;
    setTimeout(() => player.canShoot = true, player.shootCooldown);
}

// Actualizar juego
function update() {
    if (!gameActive || gamePaused || gameState.gameOver) return;
    
    // Movimiento del jugador
    if (keys["ArrowLeft"]) {
        player.x -= player.speed;
    }
    if (keys["ArrowRight"]) {
        player.x += player.speed;
    }
    player.x = Math.max(0, Math.min(canvas.width - player.width, player.x));
    
    // Movimiento de balas
    bullets.forEach(bullet => bullet.y -= bullet.speed);
    bullets = bullets.filter(bullet => bullet.y + bullet.height > 0);
    
    // Movimiento de invasores
    let hitEdge = false;
    invaders.forEach(invader => {
        if (invader.alive) {
            invader.x += enemyDirection * invader.speed;
            if (invader.x <= 0 || invader.x + invader.width >= canvas.width) {
                hitEdge = true;
            }
        }
    });
    
    if (hitEdge) {
        enemyDirection *= -1;
        invaders.forEach(invader => {
            if (invader.alive) {
                invader.y += 20;
            }
        });
    }
    
    // Detección de colisiones bala-invasor
    bullets.forEach((bullet, bulletIndex) => {
        invaders.forEach((invader, invaderIndex) => {
            if (invader.alive &&
                bullet.x < invader.x + invader.width && 
                bullet.x + bullet.width > invader.x &&
                bullet.y < invader.y + invader.height && 
                bullet.y + bullet.height > invader.y) {
                
                // Destruir invasor
                invader.alive = false;
                bullets.splice(bulletIndex, 1);
                
                // Crear explosión
                explosions.push({
                    x: invader.x + invader.width / 2,
                    y: invader.y + invader.height / 2,
                    radius: 0,
                    maxRadius: 20,
                    color: invader.color
                });
                
                // Actualizar puntuación
                gameState.score += 10;
                gameState.invadersDestroyed++;
                updateUI();
            }
        });
    });
    
    // Actualizar explosiones
    explosions.forEach(explosion => {
        explosion.radius += 1;
    });
    explosions = explosions.filter(explosion => explosion.radius < explosion.maxRadius);
    
    // Verificar si invasores llegaron al fondo
    invaders.forEach(invader => {
        if (invader.alive && invader.y + invader.height >= player.y) {
            gameOver();
        }
    });
    
    // Verificar si se completó el nivel
    if (invaders.every(invader => !invader.alive)) {
        levelComplete();
    }
}

// Dibujar juego
function draw() {
    // Fondo del espacio
    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    gradient.addColorStop(0, "#000011");
    gradient.addColorStop(1, "#000033");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Estrellas de fondo
    drawStars();
    
    // Jugador con efecto neón
    ctx.fillStyle = player.color;
    ctx.shadowBlur = 15;
    ctx.shadowColor = player.color;
    ctx.fillRect(player.x, player.y, player.width, player.height);
    ctx.shadowBlur = 0;
    
    // Balas con efecto neón
    bullets.forEach(bullet => {
        ctx.fillStyle = bullet.color;
        ctx.shadowBlur = 8;
        ctx.shadowColor = bullet.color;
        ctx.fillRect(bullet.x, bullet.y, bullet.width, bullet.height);
        ctx.shadowBlur = 0;
    });
    
    // Invasores con efecto neón
    invaders.forEach(invader => {
        if (invader.alive) {
            ctx.fillStyle = invader.color;
            ctx.shadowBlur = 10;
            ctx.shadowColor = invader.color;
            ctx.fillRect(invader.x, invader.y, invader.width, invader.height);
            ctx.shadowBlur = 0;
            
            // Detalles del invasor
            ctx.fillStyle = "#000000";
            ctx.fillRect(invader.x + 5, invader.y + 5, 10, 5);
            ctx.fillRect(invader.x + 25, invader.y + 5, 10, 5);
            ctx.fillRect(invader.x + 10, invader.y + 15, 20, 5);
        }
    });
    
    // Explosiones
    explosions.forEach(explosion => {
        ctx.beginPath();
        ctx.arc(explosion.x, explosion.y, explosion.radius, 0, Math.PI * 2);
        ctx.strokeStyle = explosion.color;
        ctx.lineWidth = 2;
        ctx.shadowBlur = 10;
        ctx.shadowColor = explosion.color;
        ctx.stroke();
        ctx.shadowBlur = 0;
    });
}

// Dibujar estrellas de fondo
function drawStars() {
    ctx.fillStyle = "white";
    for (let i = 0; i < 100; i++) {
        const x = (i * 127) % canvas.width;
        const y = (i * 251) % canvas.height;
        const size = (i % 3) + 1;
        const opacity = 0.3 + Math.random() * 0.7;
        
        ctx.globalAlpha = opacity;
        ctx.fillRect(x, y, size, size);
    }
    ctx.globalAlpha = 1;
}

// Bucle principal del juego
function gameLoop() {
    if (gameActive) {
        update();
        draw();
        requestAnimationFrame(gameLoop);
    }
}

// Actualizar interfaz
function updateUI() {
    document.getElementById("score").textContent = gameState.score;
    document.getElementById("level").textContent = gameState.level;
    document.getElementById("invadersCount").textContent = invaders.filter(i => i.alive).length;
    document.getElementById("livesCount").textContent = gameState.lives;
    document.getElementById("highScore").textContent = gameState.highScore;
    document.getElementById("speedValue").textContent = (1 + (gameState.level * 0.5)).toFixed(1);
}

// Actualizar high score
function updateHighScore() {
    if (gameState.score > gameState.highScore) {
        gameState.highScore = gameState.score;
        localStorage.setItem('spaceInvadersHighScore', gameState.highScore);
    }
}

// Pausar/reanudar juego
function togglePause() {
    if (!gameActive) return;
    
    gamePaused = !gamePaused;
    const pauseScreen = document.getElementById("pauseScreen");
    const pauseBtn = document.getElementById("pauseBtn");
    
    if (gamePaused) {
        pauseScreen.style.display = "flex";
        pauseBtn.textContent = "REANUDAR";
    } else {
        pauseScreen.style.display = "none";
        pauseBtn.textContent = "PAUSAR";
    }
}

// Reiniciar juego
function restartGame() {
    document.getElementById("gameOverScreen").style.display = "none";
    document.getElementById("levelCompleteScreen").style.display = "none";
    document.getElementById("pauseScreen").style.display = "none";
    startGame();
}

// Nivel completado
function levelComplete() {
    gameActive = false;
    
    const levelCompleteScreen = document.getElementById("levelCompleteScreen");
    const levelScore = document.getElementById("levelScore");
    const nextLevel = document.getElementById("nextLevel");
    
    levelScore.textContent = gameState.score;
    nextLevel.textContent = gameState.level + 1;
    
    setTimeout(() => {
        levelCompleteScreen.style.display = "flex";
    }, 500);
}

function nextLevel() {
    gameState.level++;
    gameActive = true;
    
    document.getElementById("levelCompleteScreen").style.display = "none";
    
    createInvaders();
    updateUI();
    gameLoop();
}

// Game over
function gameOver() {
    gameState.gameOver = true;
    gameActive = false;
    updateHighScore();
    
    const gameOverScreen = document.getElementById("gameOverScreen");
    const finalScore = document.getElementById("finalScore");
    const finalLevel = document.getElementById("finalLevel");
    const finalInvaders = document.getElementById("finalInvaders");
    
    finalScore.textContent = gameState.score;
    finalLevel.textContent = gameState.level;
    finalInvaders.textContent = gameState.invadersDestroyed;
    
    setTimeout(() => {
        gameOverScreen.style.display = "flex";
    }, 500);
}