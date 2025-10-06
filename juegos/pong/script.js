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
        
        const size = 1 + Math.random() * 3;
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

// Constantes del juego
const PADDLE_HEIGHT = 80;
const PADDLE_WIDTH = 12;
const BALL_RADIUS = 8;
const INITIAL_BALL_SPEED = 4;

// Objetos del juego
const leftPaddle = { 
    x: 30, 
    y: HEIGHT/2 - PADDLE_HEIGHT/2, 
    w: PADDLE_WIDTH, 
    h: PADDLE_HEIGHT, 
    speed: 6,
    color: '#00ffff'
};

const rightPaddle = { 
    x: WIDTH - 30 - PADDLE_WIDTH, 
    y: HEIGHT/2 - PADDLE_HEIGHT/2, 
    w: PADDLE_WIDTH, 
    h: PADDLE_HEIGHT, 
    speed: 6,
    color: '#ff00ff'
};

const ball = { 
    x: WIDTH/2, 
    y: HEIGHT/2, 
    r: BALL_RADIUS, 
    dx: INITIAL_BALL_SPEED, 
    dy: INITIAL_BALL_SPEED * (Math.random() > 0.5 ? 1 : -1),
    color: '#39ff14'
};

// Estado del juego
let leftScore = 0;
let rightScore = 0;
let speedMultiplier = 1.0;
let currentDifficulty = 'NORMAL';
let gameActive = true;

// Partículas para efectos visuales
const particles = [];
const MAX_PARTICLES = 50;

// Colores según dificultad
const difficultyColors = {
    'NORMAL': { bg: '#111127', particle: '#333366', accent: '#00ffff' },
    'MEDIO': { bg: '#1a1a2e', particle: '#4a4a8a', accent: '#ff00ff' },
    'DIFÍCIL': { bg: '#2d1b2b', particle: '#8a4a7a', accent: '#39ff14' },
    'EXTREMO': { bg: '#3a1c1c', particle: '#ff5555', accent: '#ffff00' }
};

// Control de teclado
let keys = {};
document.addEventListener("keydown", e => {
    if (['ArrowUp', 'ArrowDown', 'w', 'W', 's', 'S'].includes(e.key)) {
        e.preventDefault();
    }
    keys[e.key] = true;
});
document.addEventListener("keyup", e => keys[e.key] = false);

// Inicializar partículas del juego
function initParticles() {
    particles.length = 0;
    const count = currentDifficulty === 'NORMAL' ? 15 : 
                  currentDifficulty === 'MEDIO' ? 25 :
                  currentDifficulty === 'DIFÍCIL' ? 35 : 50;
    
    for (let i = 0; i < count; i++) {
        particles.push({
            x: Math.random() * WIDTH,
            y: Math.random() * HEIGHT,
            size: Math.random() * 2 + 1,
            speed: Math.random() * 1.5 + 0.5,
            opacity: Math.random() * 0.3 + 0.1,
            color: difficultyColors[currentDifficulty].particle
        });
    }
}

// Inicializar juego
function initGame() {
    resetBall();
    initParticles();
    updateUI();
    // Configurar botón de inicio
    const startBtn = document.getElementById("startBtn");
    const startScreen = document.getElementById("startScreen");
    
    // Mostrar pantalla de inicio solo al cargar
    startScreen.style.display = "flex";
    
    startBtn.addEventListener("click", function() {
        startScreen.style.display = "none";
        gameActive = true;
        gameLoop();
    });
}

// Actualizar interfaz de usuario
function updateUI() {
    document.getElementById("leftScore").textContent = leftScore;
    document.getElementById("rightScore").textContent = rightScore;
    document.getElementById("speedValue").textContent = speedMultiplier.toFixed(2) + 'x';
    document.getElementById("difficultyValue").textContent = currentDifficulty;
}

// Bucle principal del juego
function gameLoop() {
    if (gameActive) {
        update();
        draw();
        requestAnimationFrame(gameLoop);
    }
}

// Actualizar lógica del juego
function update() {
    // Movimiento de paletas
    if (keys["w"] || keys["W"]) {
        leftPaddle.y -= leftPaddle.speed;
    }
    if (keys["s"] || keys["S"]) {
        leftPaddle.y += leftPaddle.speed;
    }
    if (keys["ArrowUp"]) {
        rightPaddle.y -= rightPaddle.speed;
    }
    if (keys["ArrowDown"]) {
        rightPaddle.y += rightPaddle.speed;
    }

    // Limitar paletas dentro del canvas
    leftPaddle.y = Math.max(0, Math.min(HEIGHT - leftPaddle.h, leftPaddle.y));
    rightPaddle.y = Math.max(0, Math.min(HEIGHT - rightPaddle.h, rightPaddle.y));

    // Movimiento de la pelota
    ball.x += ball.dx * speedMultiplier;
    ball.y += ball.dy * speedMultiplier;

    // Actualizar partículas
    updateParticles();

    // Actualizar dificultad
    updateDifficulty();

    // Rebote en paredes superior e inferior
    if (ball.y - ball.r < 0 || ball.y + ball.r > HEIGHT) {
        ball.dy *= -1;
        createHitEffect(ball.x, ball.y);
    }

    // Colisión con paleta izquierda
    if (ball.x - ball.r < leftPaddle.x + leftPaddle.w &&
        ball.y > leftPaddle.y &&
        ball.y < leftPaddle.y + leftPaddle.h) {
        
        ball.dx = Math.abs(ball.dx);
        ball.x = leftPaddle.x + leftPaddle.w + ball.r;
        increaseSpeed();
        createHitEffect(ball.x, ball.y);
        paddleFlash(leftPaddle);
    }

    // Colisión con paleta derecha
    if (ball.x + ball.r > rightPaddle.x &&
        ball.y > rightPaddle.y &&
        ball.y < rightPaddle.y + rightPaddle.h) {
        
        ball.dx = -Math.abs(ball.dx);
        ball.x = rightPaddle.x - ball.r;
        increaseSpeed();
        createHitEffect(ball.x, ball.y);
        paddleFlash(rightPaddle);
    }

    // Puntos para jugadores
    if (ball.x < 0) {
        rightScore++;
        showVictoryMessage("PUNTO PARA\nJUGADOR 2!", "#ff00ff");
        resetBall();
        checkGameEnd();
    } else if (ball.x > WIDTH) {
        leftScore++;
        showVictoryMessage("PUNTO PARA\nJUGADOR 1!", "#00ffff");
        resetBall();
        checkGameEnd();
    }
}

// Dibujos del juego
function draw() {
    // Fondo
    const bgColor = difficultyColors[currentDifficulty].bg;
    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, WIDTH, HEIGHT);

    // Partículas de fondo
    drawParticles();

    // Línea central punteada
    ctx.setLineDash([10, 15]);
    ctx.beginPath();
    ctx.moveTo(WIDTH/2, 0);
    ctx.lineTo(WIDTH/2, HEIGHT);
    ctx.strokeStyle = "rgba(255,255,255,0.2)";
    ctx.lineWidth = 3;
    ctx.stroke();
    ctx.setLineDash([]);

    // Paletas con efecto de brillo
    drawPaddle(leftPaddle);
    drawPaddle(rightPaddle);

    // Pelota con efectos
    drawBall();

    // Estela de velocidad
    drawSpeedTrail();
}

// Dibujar paleta con efectos
function drawPaddle(paddle) {
    // Sombra de la paleta
    ctx.fillStyle = paddle.color + '40';
    ctx.fillRect(paddle.x - 2, paddle.y - 2, paddle.w + 4, paddle.h + 4);
    
    // Paleta principal
    ctx.fillStyle = paddle.color;
    ctx.fillRect(paddle.x, paddle.y, paddle.w, paddle.h);
    
    // Efecto de brillo interno
    const gradient = ctx.createLinearGradient(paddle.x, paddle.y, paddle.x + paddle.w, paddle.y);
    gradient.addColorStop(0, paddle.color + '80');
    gradient.addColorStop(1, paddle.color);
    ctx.fillStyle = gradient;
    ctx.fillRect(paddle.x, paddle.y, paddle.w / 2, paddle.h);
}

// Dibujar pelota con efectos
function drawBall() {
    // Estela de la pelota
    const trailGradient = ctx.createRadialGradient(
        ball.x, ball.y, 0,
        ball.x, ball.y, ball.r * 3
    );
    trailGradient.addColorStop(0, ball.color + '80');
    trailGradient.addColorStop(1, ball.color + '00');
    
    ctx.beginPath();
    ctx.arc(ball.x, ball.y, ball.r * 3, 0, Math.PI * 2);
    ctx.fillStyle = trailGradient;
    ctx.fill();

    // Pelota principal
    ctx.beginPath();
    ctx.arc(ball.x, ball.y, ball.r, 0, Math.PI * 2);
    ctx.fillStyle = ball.color;
    ctx.fill();

    // Reflejo de la pelota
    ctx.beginPath();
    ctx.arc(ball.x - ball.r/3, ball.y - ball.r/3, ball.r/3, 0, Math.PI * 2);
    ctx.fillStyle = '#ffffff80';
    ctx.fill();
}

// Dibujar estela de velocidad
function drawSpeedTrail() {
    if (speedMultiplier > 1.2) {
        for (let i = 0; i < 3; i++) {
            const trailX = ball.x - ball.dx * i * 2;
            const trailY = ball.y - ball.dy * i * 2;
            const opacity = 0.3 - (i * 0.1);
            
            ctx.beginPath();
            ctx.arc(trailX, trailY, ball.r * (1 - i * 0.2), 0, Math.PI * 2);
            ctx.fillStyle = ball.color.replace(')', `,${opacity})`).replace('rgb', 'rgba');
            ctx.fill();
        }
    }
}

// Dibujar partículas
function drawParticles() {
    particles.forEach(particle => {
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
        ctx.fillStyle = particle.color.replace(')', `,${particle.opacity})`).replace('rgb', 'rgba');
        ctx.fill();
    });
}

// Actualizar partículas
function updateParticles() {
    particles.forEach(particle => {
        particle.y += particle.speed * (speedMultiplier * 0.3);
        if (particle.y > HEIGHT) {
            particle.y = 0;
            particle.x = Math.random() * WIDTH;
        }
        // Variar opacidad para efecto de parpadeo
        particle.opacity = 0.1 + Math.sin(Date.now() * 0.001 + particle.x) * 0.2;
    });
}

// Efecto de flash en paleta al golpear
function paddleFlash(paddle) {
    const originalColor = paddle.color;
    paddle.color = '#ffffff';
    setTimeout(() => {
        paddle.color = originalColor;
    }, 100);
}

// Crear efecto de partículas al golpear
function createHitEffect(x, y) {
    for (let i = 0; i < 5; i++) {
        particles.push({
            x: x,
            y: y,
            size: Math.random() * 3 + 1,
            speed: Math.random() * 3 - 1.5,
            opacity: 1,
            color: ball.color
        });
    }
}

// Aumentar velocidad
function increaseSpeed() {
    speedMultiplier += 0.03;
    if (speedMultiplier > 2.5) {
        speedMultiplier = 2.5;
    }
}

// Actualizar dificultad
function updateDifficulty() {
    let newDifficulty;
    if (speedMultiplier < 1.3) {
        newDifficulty = 'NORMAL';
    } else if (speedMultiplier < 1.7) {
        newDifficulty = 'MEDIO';
    } else if (speedMultiplier < 2.1) {
        newDifficulty = 'DIFÍCIL';
    } else {
        newDifficulty = 'EXTREMO';
    }
    
    if (newDifficulty !== currentDifficulty) {
        currentDifficulty = newDifficulty;
        ball.color = difficultyColors[currentDifficulty].accent;
        initParticles();
        updateUI();
    }
}

// Mostrar mensaje de victoria
function showVictoryMessage(message, color) {
    const victoryMessage = document.getElementById("victoryMessage");
    victoryMessage.textContent = message;
    victoryMessage.style.color = color;
    victoryMessage.style.textShadow = `0 0 20px ${color}, 0 0 40px ${color}`;
    victoryMessage.classList.add("show");
    
    setTimeout(() => {
        victoryMessage.classList.remove("show");
    }, 1500);
}

// Reiniciar pelota
function resetBall() {
    document.getElementById("gameOverScreen").style.display = "none";
    ball.x = WIDTH/2;
    ball.y = HEIGHT/2;
    ball.dx = INITIAL_BALL_SPEED * (Math.random() > 0.5 ? 1 : -1);
    ball.dy = INITIAL_BALL_SPEED * (Math.random() > 0.5 ? 1 : -1);
    speedMultiplier = 1.0;
    currentDifficulty = 'NORMAL';
    ball.color = difficultyColors[currentDifficulty].accent;
    initParticles();
    updateUI();
}

// Verificar fin del juego
function checkGameEnd() {
    if (leftScore >= 5 || rightScore >= 5) {
        gameActive = false;
        const winner = leftScore >= 5 ? "JUGADOR 1" : "JUGADOR 2";
        const color = leftScore >= 5 ? "#00ffff" : "#ff00ff";
        
        setTimeout(() => {
            showGameOverScreen(winner, color);
        }, 1000);
    }
}

// Mostrar pantalla de game over
function showGameOverScreen(winner, color) {
    const gameOverScreen = document.getElementById("gameOverScreen");
    const winnerText = document.getElementById("winnerText");
    const playAgainBtn = document.getElementById("playAgainBtn");
    const mainMenuBtn = document.getElementById("mainMenuBtn");
    
    winnerText.textContent = `¡${winner} GANA!`;
    winnerText.style.color = color;
    winnerText.style.textShadow = `0 0 20px ${color}, 0 0 40px ${color}`;
    
    gameOverScreen.style.display = "flex";
    
    // Botón para jugar de nuevo
    playAgainBtn.onclick = function() {
        leftScore = 0;
        rightScore = 0;
        gameActive = true;
        gameOverScreen.style.display = "none";
        resetBall();
        updateUI();
        gameLoop();
    };
    
    // Botón para volver al inicio
    mainMenuBtn.onclick = function() {
        window.location.href = "../../index.html";
    };
}