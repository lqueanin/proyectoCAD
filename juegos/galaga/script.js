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

const WIDTH = canvas.width;
const HEIGHT = canvas.height;

// Estado del juego
let gameState = {
    level: 1,
    lives: 3,
    score: 0,
    gameOver: false,
    enemiesDestroyed: 0,
    highScore: localStorage.getItem('galagaHighScore') || 0
};

// Nave del jugador
const player = {
    x: WIDTH/2 - 20,
    y: HEIGHT - 60,
    w: 40,
    h: 40,
    speed: 5,
    minX: 10,
    maxX: WIDTH - 50,
    invulnerable: 0,
    blink: 0
};

// Disparos
let bullets = [];
let lastShotTime = 0;
const SHOT_DELAY = 200;

// Enemigos
let enemies = [];
let boss = null;
let gameTime = 0;
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
    document.getElementById("mainMenuBtn").addEventListener("click", () => {
        window.location.href = "../../index.html";
    });

    // Prevenir scroll con teclas
    document.addEventListener("keydown", e => {
        if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' ', 'a', 'd'].includes(e.key)) {
            e.preventDefault();
        }
    });

    // Actualizar high score
    updateHighScore();
}

// Iniciar juego
function startGame() {
    gameState = {
        level: 1,
        lives: 3,
        score: 0,
        gameOver: false,
        enemiesDestroyed: 0,
        highScore: localStorage.getItem('galagaHighScore') || 0
    };
    
    player.x = WIDTH/2 - 20;
    player.y = HEIGHT - 60;
    player.invulnerable = 0;
    
    bullets = [];
    enemies = [];
    boss = null;
    gameTime = 0;
    
    gameActive = true;
    gamePaused = false;
    
    spawnEnemies();
    updateUI();
    gameLoop();
}

// Generar enemigos
function spawnEnemies() {
    enemies = [];
    const enemyCount = 6 + gameState.level * 2;
    
    for (let i = 0; i < enemyCount; i++) {
        const startX = Math.random() * WIDTH;
        
        enemies.push({
            x: startX,
            y: -40,
            w: 30,
            h: 30,
            targetX: 50 + (i % 6) * 50,
            targetY: 50 + Math.floor(i / 6) * 40,
            state: 'entering',
            entryTime: 0,
            curveAmplitude: Math.random() * 30 + 20,
            curveFrequency: Math.random() * 0.05 + 0.02,
            diveCooldown: Math.random() * 200 + 100,
            hasDived: false,
            speed: 0.5 + gameState.level * 0.1
        });
    }
    
    // Crear jefe cada 2 niveles
    if (gameState.level % 2 === 0) {
        boss = {
            x: WIDTH / 2 - 25,
            y: -60,
            w: 50,
            h: 50,
            targetX: WIDTH / 2 - 25,
            targetY: 100,
            state: 'entering',
            health: 3,
            maxHealth: 3,
            tractorBeam: {
                active: false,
                x: 0,
                y: 0,
                width: 20,
                height: 0,
                targetPlayer: false
            },
            attackCooldown: 300
        };
    }
}

// Control de teclado
let keys = {};
document.addEventListener('keydown', e => {
    keys[e.key] = true;
    if (e.key === ' ') e.preventDefault();
});
document.addEventListener('keyup', e => keys[e.key] = false);

// Actualizar juego
function update() {
    if (!gameActive || gamePaused || gameState.gameOver) return;
    
    gameTime++;
    
    // Actualizar invulnerabilidad
    if (player.invulnerable > 0) {
        player.invulnerable--;
        player.blink = (player.blink + 1) % 10;
    }
    
    // Movimiento del jugador
    if (keys['ArrowLeft'] || keys['a']) {
        player.x = Math.max(player.minX, player.x - player.speed);
    }
    if (keys['ArrowRight'] || keys['d']) {
        player.x = Math.min(player.maxX, player.x + player.speed);
    }
    
    // Disparos
    const currentTime = Date.now();
    if ((keys[' '] || keys['Spacebar']) && bullets.length < 5 && currentTime - lastShotTime > SHOT_DELAY) {
        bullets.push({
            x: player.x + player.w/2 - 2,
            y: player.y,
            w: 4,
            h: 10,
            speed: 7
        });
        lastShotTime = currentTime;
    }

    // Movimiento de disparos
    bullets.forEach(b => {
        b.y -= b.speed;
    });
    bullets = bullets.filter(b => b.y + b.h > 0);

    // Movimiento de enemigos
    enemies.forEach(e => {
        if (e.state === 'entering') {
            e.entryTime += 1;
            e.y = -40 + e.entryTime;
            
            const curveOffset = Math.sin(e.entryTime * e.curveFrequency) * e.curveAmplitude;
            e.x = e.targetX + curveOffset;
            
            if (e.y >= e.targetY) {
                e.y = e.targetY;
                e.state = 'formation';
            }
        } else if (e.state === 'formation') {
            e.x = e.targetX + Math.sin(gameTime * 0.05) * 10;
            
            if (!e.hasDived && e.diveCooldown <= 0 && Math.random() < 0.005) {
                e.state = 'diving';
                e.diveStartX = e.x;
                e.diveStartY = e.y;
                e.diveAngle = Math.atan2(player.y - e.y, player.x - e.x);
            } else {
                e.diveCooldown--;
            }
        } else if (e.state === 'diving') {
            e.x += Math.cos(e.diveAngle) * e.speed * 2;
            e.y += Math.sin(e.diveAngle) * e.speed * 2;
            
            if (player.invulnerable <= 0 && 
                e.x < player.x + player.w && e.x + e.w > player.x && 
                e.y < player.y + player.h && e.y + e.h > player.y) {
                loseLife();
                e.state = 'returning';
                e.hasDived = true;
            }
            
            if (e.y > HEIGHT || e.x < 0 || e.x > WIDTH) {
                e.state = 'returning';
                e.hasDived = true;
            }
        } else if (e.state === 'returning') {
            const dx = e.targetX - e.x;
            const dy = e.targetY - e.y;
            const distance = Math.sqrt(dx*dx + dy*dy);
            
            if (distance < 2) {
                e.x = e.targetX;
                e.y = e.targetY;
                e.state = 'formation';
            } else {
                e.x += (dx / distance) * e.speed;
                e.y += (dy / distance) * e.speed;
            }
        }
    });

    // Movimiento del jefe
    if (boss) {
        if (boss.state === 'entering') {
            boss.y += 1;
            if (boss.y >= boss.targetY) {
                boss.y = boss.targetY;
                boss.state = 'formation';
            }
        } else if (boss.state === 'formation') {
            boss.x = boss.targetX + Math.sin(gameTime * 0.03) * 30;
            
            boss.attackCooldown--;
            if (boss.attackCooldown <= 0) {
                boss.state = 'prepareTractor';
                boss.tractorBeam.active = false;
                boss.tractorBeam.height = 0;
            }
        } else if (boss.state === 'prepareTractor') {
            boss.y += 0.5;
            if (boss.y >= 150) {
                boss.state = 'tractorAttack';
                boss.tractorBeam.active = true;
                boss.tractorBeam.x = boss.x + boss.w/2 - boss.tractorBeam.width/2;
                boss.tractorBeam.y = boss.y + boss.h;
            }
        } else if (boss.state === 'tractorAttack') {
            if (boss.tractorBeam.height < HEIGHT - boss.y - boss.h) {
                boss.tractorBeam.height += 3;
            }
            
            const beamRight = boss.tractorBeam.x + boss.tractorBeam.width;
            const beamBottom = boss.tractorBeam.y + boss.tractorBeam.height;
            
            if (player.x < beamRight && 
                player.x + player.w > boss.tractorBeam.x && 
                player.y < beamBottom) {
                boss.tractorBeam.targetPlayer = true;
                
                const dx = (boss.x + boss.w/2) - (player.x + player.w/2);
                const dy = (boss.y + boss.h) - (player.y + player.h/2);
                
                player.x += dx * 0.05;
                player.y += dy * 0.05;
                
                if (Math.abs(dx) < 5 && Math.abs(dy) < 5) {
                    loseLife();
                    boss.state = 'returning';
                    boss.tractorBeam.active = false;
                    boss.tractorBeam.targetPlayer = false;
                    player.x = WIDTH/2 - 20;
                    player.y = HEIGHT - 60;
                }
            }
            
            if (gameTime % 400 === 0) {
                boss.state = 'returning';
                boss.tractorBeam.active = false;
                boss.tractorBeam.targetPlayer = false;
                player.x = WIDTH/2 - 20;
                player.y = HEIGHT - 60;
            }
        } else if (boss.state === 'returning') {
            boss.y -= 1.5;
            if (boss.y <= boss.targetY) {
                boss.y = boss.targetY;
                boss.state = 'formation';
                boss.attackCooldown = 300;
            }
        }
    }

    // Detección de colisiones
    bullets.forEach((b, bi) => {
        enemies.forEach((e, ei) => {
            if (b.x < e.x + e.w && b.x + b.w > e.x && 
                b.y < e.y + e.h && b.y + b.h > e.y) {
                gameState.score += 100;
                gameState.enemiesDestroyed++;
                enemies.splice(ei, 1);
                bullets.splice(bi, 1);
                updateUI();
            }
        });
        
        if (boss && b.x < boss.x + boss.w && b.x + b.w > boss.x && 
            b.y < boss.y + boss.h && b.y + b.h > boss.y) {
            boss.health--;
            bullets.splice(bi, 1);
            
            if (boss.health <= 0) {
                gameState.score += 500;
                boss = null;
                updateUI();
            }
        }
    });

    // Comprobar si se completó el nivel
    if (enemies.length === 0 && boss === null) {
        gameState.level++;
        updateUI();
        spawnEnemies();
    }
}

// Dibujar juego
function draw() {
    // Fondo
    ctx.fillStyle = "#000";
    ctx.fillRect(0, 0, WIDTH, HEIGHT);
    
    // Estrellas de fondo
    ctx.fillStyle = "white";
    for (let i = 0; i < 50; i++) {
        const x = (i * 31) % WIDTH;
        const y = (i * 17) % HEIGHT;
        const size = (i % 3) + 1;
        ctx.fillRect(x, y, size, size);
    }

    // Dibujar nave del jugador
    if (player.invulnerable <= 0 || player.blink < 5) {
        // Nave con efecto neón
        ctx.fillStyle = "#00ffff";
        ctx.shadowBlur = 15;
        ctx.shadowColor = "#00ffff";
        ctx.fillRect(player.x, player.y, player.w, player.h);
        ctx.shadowBlur = 0;
        
        // Detalles de la nave
        ctx.fillStyle = "white";
        ctx.fillRect(player.x + 15, player.y, 10, 10);
        ctx.fillRect(player.x + 5, player.y + 15, 30, 10);
    }

    // Dibujar disparos
    ctx.fillStyle = "yellow";
    bullets.forEach(b => {
        ctx.fillRect(b.x, b.y, b.w, b.h);
        // Efecto de luz
        ctx.fillStyle = "rgba(255, 255, 200, 0.5)";
        ctx.fillRect(b.x - 1, b.y - 1, b.w + 2, b.h + 2);
        ctx.fillStyle = "yellow";
    });

    // Dibujar enemigos
    ctx.fillStyle = "red";
    enemies.forEach(e => {
        ctx.fillRect(e.x, e.y, e.w, e.h);
        
        // Detalles según estado
        ctx.fillStyle = e.state === 'diving' ? "#ff4444" : "darkred";
        ctx.fillRect(e.x + 5, e.y + 5, e.w - 10, e.h - 10);
        ctx.fillStyle = "red";
    });

    // Dibujar jefe
    if (boss) {
        ctx.fillStyle = "magenta";
        ctx.shadowBlur = 20;
        ctx.shadowColor = "magenta";
        ctx.fillRect(boss.x, boss.y, boss.w, boss.h);
        ctx.shadowBlur = 0;
        
        // Detalles del jefe
        ctx.fillStyle = "purple";
        ctx.fillRect(boss.x + 10, boss.y + 10, boss.w - 20, boss.h - 20);
        
        // Barra de salud
        const healthWidth = (boss.w * boss.health) / boss.maxHealth;
        ctx.fillStyle = "red";
        ctx.fillRect(boss.x, boss.y - 10, boss.w, 5);
        ctx.fillStyle = "green";
        ctx.fillRect(boss.x, boss.y - 10, healthWidth, 5);
        
        // Dibujar haz tractor
        if (boss.tractorBeam.active) {
            const gradient = ctx.createLinearGradient(
                boss.tractorBeam.x, boss.tractorBeam.y, 
                boss.tractorBeam.x, boss.tractorBeam.y + boss.tractorBeam.height
            );
            gradient.addColorStop(0, "rgba(0, 255, 255, 0.8)");
            gradient.addColorStop(1, "rgba(0, 100, 255, 0.3)");
            
            ctx.fillStyle = gradient;
            ctx.fillRect(
                boss.tractorBeam.x, 
                boss.tractorBeam.y, 
                boss.tractorBeam.width, 
                boss.tractorBeam.height
            );
            
            // Efecto de partículas
            if (boss.tractorBeam.targetPlayer) {
                ctx.fillStyle = "rgba(255, 255, 255, 0.7)";
                for (let i = 0; i < 5; i++) {
                    const offsetX = Math.sin(gameTime * 0.1 + i) * 5;
                    const yPos = boss.tractorBeam.y + (gameTime + i * 20) % boss.tractorBeam.height;
                    ctx.fillRect(
                        boss.tractorBeam.x + boss.tractorBeam.width/2 - 1 + offsetX, 
                        yPos, 
                        2, 
                        2
                    );
                }
            }
        }
    }
    
    // Dibujar game over
    if (gameState.gameOver) {
        ctx.fillStyle = "rgba(0, 0, 0, 0.7)";
        ctx.fillRect(0, 0, WIDTH, HEIGHT);
        
        ctx.fillStyle = "red";
        ctx.font = "28px Arial";
        ctx.textAlign = "center";
        ctx.fillText("GAME OVER", WIDTH/2, HEIGHT/2 - 20);
        
        ctx.fillStyle = "white";
        ctx.font = "18px Arial";
        ctx.fillText(`Puntuación: ${gameState.score}`, WIDTH/2, HEIGHT/2 + 20);
        ctx.fillText("Presiona 'Jugar de Nuevo' para continuar", WIDTH/2, HEIGHT/2 + 50);
    }
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
function loseLife() {
    if (player.invulnerable > 0) return;
    
    gameState.lives--;
    updateUI();
    
    if (gameState.lives <= 0) {
        gameOver();
    } else {
        player.invulnerable = 180;
        player.x = WIDTH/2 - 20;
        player.y = HEIGHT - 60;
        
        if (boss && boss.tractorBeam) {
            boss.tractorBeam.active = false;
            boss.tractorBeam.targetPlayer = false;
        }
    }
}

function updateUI() {
    document.getElementById("lives").textContent = gameState.lives;
    document.getElementById("score").textContent = gameState.score;
    document.getElementById("level").textContent = gameState.level;
    document.getElementById("enemiesCount").textContent = enemies.length;
    document.getElementById("bossStatus").textContent = boss ? "Sí" : "No";
    document.getElementById("highScore").textContent = gameState.highScore;
}

function updateHighScore() {
    if (gameState.score > gameState.highScore) {
        gameState.highScore = gameState.score;
        localStorage.setItem('galagaHighScore', gameState.highScore);
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
    gameActive = false;
    updateHighScore();
    
    const gameOverScreen = document.getElementById("gameOverScreen");
    const finalScore = document.getElementById("finalScore");
    const finalLevel = document.getElementById("finalLevel");
    const finalEnemies = document.getElementById("finalEnemies");
    
    finalScore.textContent = gameState.score;
    finalLevel.textContent = gameState.level;
    finalEnemies.textContent = gameState.enemiesDestroyed;
    
    setTimeout(() => {
        gameOverScreen.style.display = "flex";
    }, 500);
}