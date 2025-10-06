// Inicialización del juego
document.addEventListener('DOMContentLoaded', function() {
    createParticles();
    initGame();
});

// Sistema de partículas
function createParticles() {
    const particlesContainer = document.getElementById('particles');
    const particleCount = 50;
    
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
    asteroidsDestroyed: 0,
    highScore: localStorage.getItem('asteroidsHighScore') || 0,
    gameOver: false
};

// Elementos del juego
let ship, bullets, asteroids;
let gameActive = false;
let gamePaused = false;

// Control de teclado
const keys = {};
document.addEventListener("keydown", e => {
    keys[e.key] = true;
    if (e.key === ' ') e.preventDefault();
});
document.addEventListener("keyup", e => keys[e.key] = false);

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
    document.getElementById("mainMenuBtn").addEventListener("click", () => {
        window.location.href = "../../index.html";
    });

    // Prevenir scroll con teclas
    document.addEventListener("keydown", e => {
        if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(e.key)) {
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
        asteroidsDestroyed: 0,
        highScore: localStorage.getItem('asteroidsHighScore') || 0,
        gameOver: false
    };
    
    ship = {
        x: canvas.width / 2,
        y: canvas.height / 2,
        angle: 0,
        vx: 0,
        vy: 0,
        radius: 15,
        thrust: false
    };
    
    bullets = [];
    asteroids = [];
    
    gameActive = true;
    gamePaused = false;
    
    spawnAsteroids(6);
    updateUI();
    gameLoop();
}

// Generar asteroides
function spawnAsteroids(n) {
    for (let i = 0; i < n; i++) {
        let x, y;
        if (Math.random() < 0.5) {
            x = Math.random() * canvas.width;
            y = Math.random() < 0.5 ? 0 : canvas.height;
        } else {
            x = Math.random() < 0.5 ? 0 : canvas.width;
            y = Math.random() * canvas.height;
        }
        const angle = Math.random() * Math.PI * 2;
        asteroids.push({
            x, y,
            radius: 40 + Math.random() * 20,
            vx: Math.cos(angle) * (0.5 + Math.random() * 1.5),
            vy: Math.sin(angle) * (0.5 + Math.random() * 1.5),
            vertices: generateAsteroidVertices()
        });
    }
}

// Generar vértices para asteroides irregulares
function generateAsteroidVertices() {
    const vertices = [];
    const numVertices = 8 + Math.floor(Math.random() * 4);
    
    for (let i = 0; i < numVertices; i++) {
        const angle = (i / numVertices) * Math.PI * 2;
        const distance = 0.7 + Math.random() * 0.3; // Variación de radio
        vertices.push({
            angle,
            distance
        });
    }
    
    return vertices;
}

// Dibujar nave
function drawShip() {
    ctx.save();
    ctx.translate(ship.x, ship.y);
    ctx.rotate(ship.angle);
    
    // Nave principal con efecto neón
    ctx.strokeStyle = "#00ffff";
    ctx.lineWidth = 2;
    ctx.shadowBlur = 15;
    ctx.shadowColor = "#00ffff";
    
    ctx.beginPath();
    ctx.moveTo(20, 0);
    ctx.lineTo(-15, 10);
    ctx.lineTo(-15, -10);
    ctx.closePath();
    ctx.stroke();
    
    // Efecto de propulsión
    if (ship.thrust) {
        ctx.strokeStyle = "#ff5500";
        ctx.shadowBlur = 20;
        ctx.shadowColor = "#ff5500";
        
        ctx.beginPath();
        ctx.moveTo(-15, 8);
        ctx.lineTo(-25 - Math.random() * 10, 0);
        ctx.lineTo(-15, -8);
        ctx.stroke();
    }
    
    ctx.shadowBlur = 0;
    ctx.restore();
}

// Dibujar asteroides
function drawAsteroids() {
    asteroids.forEach(asteroid => {
        ctx.save();
        ctx.translate(asteroid.x, asteroid.y);
        
        // Asteroide con efecto neón
        ctx.strokeStyle = "#39ff14";
        ctx.lineWidth = 2;
        ctx.shadowBlur = 10;
        ctx.shadowColor = "#39ff14";
        
        ctx.beginPath();
        asteroid.vertices.forEach((vertex, index) => {
            const x = Math.cos(vertex.angle) * asteroid.radius * vertex.distance;
            const y = Math.sin(vertex.angle) * asteroid.radius * vertex.distance;
            
            if (index === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }
        });
        ctx.closePath();
        ctx.stroke();
        
        ctx.shadowBlur = 0;
        ctx.restore();
    });
}

// Dibujar balas
function drawBullets() {
    ctx.fillStyle = "#ffff00";
    ctx.shadowBlur = 8;
    ctx.shadowColor = "#ffff00";
    
    bullets.forEach(bullet => {
        ctx.beginPath();
        ctx.arc(bullet.x, bullet.y, 3, 0, Math.PI * 2);
        ctx.fill();
    });
    
    ctx.shadowBlur = 0;
}

// Mover nave
function moveShip() {
    if (keys["ArrowLeft"]) ship.angle -= 0.07;
    if (keys["ArrowRight"]) ship.angle += 0.07;
    
    ship.thrust = false;
    if (keys["ArrowUp"]) {
        ship.vx += Math.cos(ship.angle) * 0.1;
        ship.vy += Math.sin(ship.angle) * 0.1;
        ship.thrust = true;
    }

    // Aplicar fricción
    ship.vx *= 0.98;
    ship.vy *= 0.98;

    ship.x += ship.vx;
    ship.y += ship.vy;

    // Pantalla envolvente
    if (ship.x < 0) ship.x = canvas.width;
    if (ship.x > canvas.width) ship.x = 0;
    if (ship.y < 0) ship.y = canvas.height;
    if (ship.y > canvas.height) ship.y = 0;
}

// Mover asteroides
function moveAsteroids() {
    asteroids.forEach(asteroid => {
        asteroid.x += asteroid.vx;
        asteroid.y += asteroid.vy;
        
        // Pantalla envolvente
        if (asteroid.x < 0) asteroid.x = canvas.width;
        if (asteroid.x > canvas.width) asteroid.x = 0;
        if (asteroid.y < 0) asteroid.y = canvas.height;
        if (asteroid.y > canvas.height) asteroid.y = 0;
    });
}

// Mover balas
function moveBullets() {
    bullets.forEach(bullet => {
        bullet.x += bullet.vx;
        bullet.y += bullet.vy;
    });
    
    // Eliminar balas fuera de pantalla
    bullets = bullets.filter(bullet =>
        bullet.x >= 0 && bullet.x <= canvas.width && bullet.y >= 0 && bullet.y <= canvas.height
    );
}

// Disparar
document.addEventListener("keydown", e => {
    if (e.code === "Space" && gameActive && !gamePaused) {
        bullets.push({
            x: ship.x + Math.cos(ship.angle) * 20,
            y: ship.y + Math.sin(ship.angle) * 20,
            vx: Math.cos(ship.angle) * 6,
            vy: Math.sin(ship.angle) * 6
        });
    }
});

// Dividir asteroide
function splitAsteroid(asteroid) {
    if (asteroid.radius > 15) {
        for (let i = 0; i < 2; i++) {
            const angle = Math.random() * Math.PI * 2;
            asteroids.push({
                x: asteroid.x,
                y: asteroid.y,
                radius: asteroid.radius / 2,
                vx: Math.cos(angle) * (1.5 + Math.random()),
                vy: Math.sin(angle) * (1.5 + Math.random()),
                vertices: generateAsteroidVertices()
            });
        }
    }
}

// Detectar colisiones
function detectCollisions() {
    // Balas - Asteroides
    for (let ai = asteroids.length - 1; ai >= 0; ai--) {
        for (let bi = bullets.length - 1; bi >= 0; bi--) {
            const asteroid = asteroids[ai];
            const bullet = bullets[bi];
            const dx = asteroid.x - bullet.x;
            const dy = asteroid.y - bullet.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            
            if (dist < asteroid.radius) {
                bullets.splice(bi, 1);
                asteroids.splice(ai, 1);
                splitAsteroid(asteroid);
                
                gameState.score += 10;
                gameState.asteroidsDestroyed++;
                updateUI();
                break;
            }
        }
    }

    // Nave - Asteroides
    if (!gameState.gameOver) {
        asteroids.forEach(asteroid => {
            const dx = asteroid.x - ship.x;
            const dy = asteroid.y - ship.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            
            if (dist < asteroid.radius + ship.radius) {
                gameOver();
            }
        });
    }
}

// Bucle principal del juego
function gameLoop() {
    if (!gameActive) return;
    
    // Fondo del espacio
    ctx.fillStyle = "#000011";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Estrellas de fondo
    drawStars();
    
    if (!gamePaused && !gameState.gameOver) {
        moveShip();
        moveAsteroids();
        moveBullets();
        detectCollisions();
        
        // Comprobar nivel completado
        if (asteroids.length === 0) {
            gameState.level++;
            spawnAsteroids(6 + gameState.level);
            updateUI();
        }
    }
    
    drawAsteroids();
    drawBullets();
    drawShip();
    
    updateUI();
    requestAnimationFrame(gameLoop);
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

// Actualizar interfaz
function updateUI() {
    document.getElementById("score").textContent = gameState.score;
    document.getElementById("level").textContent = gameState.level;
    document.getElementById("asteroidsCount").textContent = asteroids.length;
    document.getElementById("bulletsCount").textContent = bullets.length;
    document.getElementById("highScore").textContent = gameState.highScore;
    
    // Calcular velocidad de la nave
    const speed = Math.sqrt(ship.vx * ship.vx + ship.vy * ship.vy).toFixed(1);
    document.getElementById("speedValue").textContent = speed;
}

// Actualizar high score
function updateHighScore() {
    if (gameState.score > gameState.highScore) {
        gameState.highScore = gameState.score;
        localStorage.setItem('asteroidsHighScore', gameState.highScore);
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
    document.getElementById("pauseScreen").style.display = "none";
    startGame();
}

// Game over
function gameOver() {
    gameState.gameOver = true;
    gameActive = false;
    updateHighScore();
    
    const gameOverScreen = document.getElementById("gameOverScreen");
    const finalScore = document.getElementById("finalScore");
    const finalLevel = document.getElementById("finalLevel");
    const finalAsteroids = document.getElementById("finalAsteroids");
    
    finalScore.textContent = gameState.score;
    finalLevel.textContent = gameState.level;
    finalAsteroids.textContent = gameState.asteroidsDestroyed;
    
    setTimeout(() => {
        gameOverScreen.style.display = "flex";
    }, 500);
}