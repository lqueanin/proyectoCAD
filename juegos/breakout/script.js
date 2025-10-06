// =============================================
// FUNCIONES CLAVE PARA TRASLACIÓN
// =============================================

function aplicarTraslacion(objeto, dx, dy) {    
    return {
        x: objeto.x + dx,
        y: objeto.y + dy
    };
}

function aplicarTraslacionConLimites(objeto, dx, dy, minX, maxX, minY, maxY) {
    const nuevaPos = aplicarTraslacion(objeto, dx, dy);
    nuevaPos.x = Math.max(minX, Math.min(maxX, nuevaPos.x));
    nuevaPos.y = Math.max(minY, Math.min(maxY, nuevaPos.y));
    return nuevaPos;
}

// Inicialización del juego
document.addEventListener('DOMContentLoaded', function() {
    createParticles();
    initGame();
});

// Sistema de partículas
function createParticles() {
    const particlesContainer = document.getElementById('particles');
    const particleCount = 30;
    
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

const WIDTH = canvas.width;
const HEIGHT = canvas.height;

// Estado del juego
let gameState = {
    score: 0,
    level: 1,
    lives: 3,
    blocksDestroyed: 0,
    highScore: localStorage.getItem('breakoutHighScore') || 0,
    gameOver: false,
    ballLaunched: false
};

// Elementos del juego
let paddle, ball, blocks;
let gameActive = false;
let gamePaused = false;

// Inicializar juego
function initGame() {
    // Botón de inicio
    const startBtn = document.getElementById("startBtn");
    const startScreen = document.getElementById("startScreen");
    const gameContent = document.querySelector(".game-content");
    
    startBtn.addEventListener("click", function() {
        startScreen.style.display = "none";
        gameContent.style.display = "block";
        startGame();
    });

    // Botones de control
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
        blocksDestroyed: 0,
        highScore: localStorage.getItem('breakoutHighScore') || 0,
        gameOver: false,
        ballLaunched: false
    };
    
    // Paleta
    paddle = { 
        x: WIDTH/2-40, 
        y: HEIGHT-30, 
        w: 80, 
        h: 12, 
        speed: 6, 
        minX: 0, 
        maxX: WIDTH-80 
    };
    
    // Pelota
    ball = { 
        x: WIDTH/2, 
        y: HEIGHT-50, 
        r: 8,
        vx: 0,
        vy: 0,
        baseSpeed: 3
    };
    
    gameActive = true;
    gamePaused = false;
    
    initBlocks();
    updateUI();
    gameLoop();
}

// Generar bloques
function initBlocks() {
    blocks = [];
    const colors = ['#ff0000', '#ffff00', '#00ff00', '#00ffff', '#ff00ff'];
    
    for (let row = 0; row < 5; row++) {
        for (let col = 0; col < 8; col++) {
            blocks.push({
                x: 15 + col * 47,
                y: 40 + row * 28,
                w: 42, 
                h: 22,
                color: colors[row],
                alive: true,
                hitPoints: row + 1 // Bloques más resistentes
            });
        }
    }
}

// Control de teclado
let keys = {};
document.addEventListener('keydown', e => {
    keys[e.key] = true;
    if (e.key === ' ') e.preventDefault();
});
document.addEventListener('keyup', e => keys[e.key] = false);

// =============================================
// ACTUALIZAR JUEGO CON TRASLACIONES GEOMÉTRICAS
// =============================================
function update() {
    if (!gameActive || gamePaused || gameState.gameOver) return;
    
    // =============================================
    // MOVIMIENTO DE LA PALETA CON TRASLACIÓN Y LÍMITES
    // =============================================
    if (keys['ArrowLeft']) {
        const nuevaPos = aplicarTraslacionConLimites(
            paddle,
            -paddle.speed,
            0,
            paddle.minX,
            paddle.maxX,
            0,
            HEIGHT
        );
        paddle.x = nuevaPos.x;
    }
    if (keys['ArrowRight']) {
        const nuevaPos = aplicarTraslacionConLimites(
            paddle,
            paddle.speed,
            0,
            paddle.minX,
            paddle.maxX,
            0,
            HEIGHT
        );
        paddle.x = nuevaPos.x;
    }
    
    // Lanzar pelota con espacio
    if (keys[' '] && !gameState.ballLaunched) {
        gameState.ballLaunched = true;
        ball.vx = (Math.random() - 0.5) * 2;
        ball.vy = -ball.baseSpeed;
    }
    
    // Si la pelota no ha sido lanzada, seguir a la paleta
    if (!gameState.ballLaunched) {
        // =============================================
        // TRASLACIÓN DE PELOTA A POSICIÓN DE PALETA
        // =============================================
        const posicionSobrePaleta = {
            x: paddle.x + paddle.w / 2,
            y: paddle.y - ball.r - 2
        };
        ball.x = posicionSobrePaleta.x;
        ball.y = posicionSobrePaleta.y;
        return;
    }
    
    // =============================================
    // MOVIMIENTO DE LA PELOTA CON TRASLACIÓN
    // =============================================
    const vectorTraslacion = { dx: ball.vx, dy: ball.vy };
    const nuevaPosPelota = aplicarTraslacion(ball, vectorTraslacion.dx, vectorTraslacion.dy);
    ball.x = nuevaPosPelota.x;
    ball.y = nuevaPosPelota.y;
    
    // Rebotes en paredes
    if (ball.x - ball.r <= 0 || ball.x + ball.r >= WIDTH) {
        ball.vx *= -1;
        createParticleEffect(ball.x, ball.y, 5);
    }
    
    // Rebote en techo
    if (ball.y - ball.r <= 0) {
        ball.vy *= -1;
        createParticleEffect(ball.x, ball.y, 5);
    }
    
    // Rebote en paleta
    if (ball.y + ball.r >= paddle.y && 
        ball.x >= paddle.x && ball.x <= paddle.x + paddle.w &&
        ball.vy > 0) {
        
        // Ángulo basado en dónde golpea la paleta
        const hitPos = (ball.x - paddle.x) / paddle.w;
        ball.vx = (hitPos - 0.5) * 8;
        ball.vy = -Math.abs(ball.vy);
        createParticleEffect(ball.x, ball.y, 8);
    }
    
    // Colisión con bloques
    let blockHit = false;
    blocks.forEach(block => {
        if (block.alive && 
            ball.x + ball.r > block.x && ball.x - ball.r < block.x + block.w &&
            ball.y + ball.r > block.y && ball.y - ball.r < block.y + block.h) {
            
            blockHit = true;
            block.hitPoints--;
            
            if (block.hitPoints <= 0) {
                block.alive = false;
                gameState.score += 10 * gameState.level;
                gameState.blocksDestroyed++;
                createParticleEffect(block.x + block.w/2, block.y + block.h/2, 15, block.color);
            } else {
                createParticleEffect(ball.x, ball.y, 5, block.color);
            }
            
            // Determinar dirección del rebote
            const ballLeft = ball.x - ball.r;
            const ballRight = ball.x + ball.r;
            const ballTop = ball.y - ball.r;
            const ballBottom = ball.y + ball.r;
            
            const blockLeft = block.x;
            const blockRight = block.x + block.w;
            const blockTop = block.y;
            const blockBottom = block.y + block.h;
            
            // Rebote horizontal
            if (ballRight > blockLeft && ballLeft < blockLeft && ball.vx > 0) {
                ball.vx *= -1;
            } else if (ballLeft < blockRight && ballRight > blockRight && ball.vx < 0) {
                ball.vx *= -1;
            }
            // Rebote vertical
            else if (ballBottom > blockTop && ballTop < blockTop && ball.vy > 0) {
                ball.vy *= -1;
            } else if (ballTop < blockBottom && ballBottom > blockBottom && ball.vy < 0) {
                ball.vy *= -1;
            }
        }
    });
    
    // Game Over o siguiente nivel
    if (ball.y > HEIGHT) {
        gameState.lives--;
        if (gameState.lives <= 0) {
            gameOver();
        } else {
            resetBall();
        }
    }
    
    // Verificar si se completó el nivel
    if (blocks.every(block => !block.alive)) {
        levelComplete();
    }
    
    updateUI();
}

// Dibujar juego
function draw() {
    // Fondo
    ctx.fillStyle = '#001122';
    ctx.fillRect(0, 0, WIDTH, HEIGHT);
    
    // Paleta con efecto neón
    ctx.fillStyle = '#00ffff';
    ctx.shadowBlur = 15;
    ctx.shadowColor = '#00ffff';
    ctx.fillRect(paddle.x, paddle.y, paddle.w, paddle.h);
    ctx.shadowBlur = 0;
    
    // Pelota con efecto neón
    ctx.fillStyle = '#ffffff';
    ctx.shadowBlur = 10;
    ctx.shadowColor = '#ffffff';
    ctx.beginPath();
    ctx.arc(ball.x, ball.y, ball.r, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
    
    // Bloques
    blocks.forEach(block => {
        if (block.alive) {
            ctx.fillStyle = block.color;
            ctx.shadowBlur = 8;
            ctx.shadowColor = block.color;
            ctx.fillRect(block.x, block.y, block.w, block.h);
            ctx.shadowBlur = 0;
            
            // Borde
            ctx.strokeStyle = '#000000';
            ctx.lineWidth = 1;
            ctx.strokeRect(block.x, block.y, block.w, block.h);
            
            // Mostrar puntos de vida si es mayor a 1
            if (block.hitPoints > 1) {
                ctx.fillStyle = '#ffffff';
                ctx.font = '10px Arial';
                ctx.textAlign = 'center';
                ctx.fillText(block.hitPoints, block.x + block.w/2, block.y + block.h/2 + 3);
            }
        }
    });
    
    // Efectos de partículas
    drawParticles();
}

// Sistema de partículas para efectos
let particles = [];
function createParticleEffect(x, y, count, color = '#ffffff') {
    for (let i = 0; i < count; i++) {
        particles.push({
            x: x,
            y: y,
            vx: (Math.random() - 0.5) * 4,
            vy: (Math.random() - 0.5) * 4,
            life: 30,
            color: color
        });
    }
}

function drawParticles() {
    particles.forEach((particle, index) => {
        // =============================================
        // MOVIMIENTO DE PARTÍCULAS CON TRASLACIÓN
        // =============================================
        const vectorTraslacion = { dx: particle.vx, dy: particle.vy };
        const nuevaPos = aplicarTraslacion(particle, vectorTraslacion.dx, vectorTraslacion.dy);
        particle.x = nuevaPos.x;
        particle.y = nuevaPos.y;
        
        particle.life--;
        
        if (particle.life <= 0) {
            particles.splice(index, 1);
            return;
        }
        
        const alpha = particle.life / 30;
        ctx.fillStyle = particle.color.replace(')', `,${alpha})`).replace('rgb', 'rgba');
        ctx.fillRect(particle.x, particle.y, 2, 2);
    });
}

// Bucle principal del juego
function gameLoop() {
    if (gameActive) {
        update();
        draw();
        requestAnimationFrame(gameLoop);
    }
}

// Funciones auxiliares
function resetBall() {
    gameState.ballLaunched = false;
    // =============================================
    // RESET DE PELOTA A POSICIÓN SOBRE PALETA
    // =============================================
    const posicionReset = {
        x: paddle.x + paddle.w / 2,
        y: paddle.y - ball.r - 2
    };
    ball.x = posicionReset.x;
    ball.y = posicionReset.y;
    ball.vx = 0;
    ball.vy = 0;
}

function updateUI() {
    document.getElementById("score").textContent = gameState.score;
    document.getElementById("level").textContent = gameState.level;
    document.getElementById("blocksCount").textContent = blocks.filter(b => b.alive).length;
    document.getElementById("livesCount").textContent = gameState.lives;
    document.getElementById("highScore").textContent = gameState.highScore;
    
    const speed = Math.sqrt(ball.vx * ball.vx + ball.vy * ball.vy).toFixed(1);
    document.getElementById("speedValue").textContent = speed;
}

function updateHighScore() {
    if (gameState.score > gameState.highScore) {
        gameState.highScore = gameState.score;
        localStorage.setItem('breakoutHighScore', gameState.highScore);
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
    gameState.ballLaunched = false;
    gameActive = true;
    
    document.getElementById("levelCompleteScreen").style.display = "none";
    
    // Aumentar dificultad
    ball.baseSpeed += 0.5;
    paddle.w = Math.max(40, paddle.w - 5); // Hacer la paleta más pequeña
    
    initBlocks();
    resetBall();
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
    const finalBlocks = document.getElementById("finalBlocks");
    
    finalScore.textContent = gameState.score;
    finalLevel.textContent = gameState.level;
    finalBlocks.textContent = gameState.blocksDestroyed;
    
    setTimeout(() => {
        gameOverScreen.style.display = "flex";
    }, 500);
}