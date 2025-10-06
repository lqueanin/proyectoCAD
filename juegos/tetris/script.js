// Inicialización del juego
document.addEventListener('DOMContentLoaded', function() {
    createParticles();
    initGame();
});

// Sistema de partículas
function createParticles() {
    const particlesContainer = document.getElementById('particles');
    const particleCount = 25;
    
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
const nextCanvas = document.getElementById("nextPieceCanvas");
const nextCtx = nextCanvas.getContext("2d");

// Configuración del tablero
const COLUMNAS = 10;
const FILAS = 20;
const BLOQUE = 40;

canvas.width = COLUMNAS * BLOQUE;  
canvas.height = FILAS * BLOQUE;  

// Estado del juego
let tablero = Array.from({ length: FILAS }, () => Array(COLUMNAS).fill(0));
let score = 0;
let level = 1;
let lines = 0;
let gameActive = false;
let gamePaused = false;
let dropCounter = 0;
let dropInterval = 1000;
let lastTime = 0;

// Colores de las piezas
const colores = [
    '#000000', // Fondo
    '#00ffff', // I
    '#0000ff', // J 
    '#ff8000', // L 
    '#ffff00', // O 
    '#00ff00', // S 
    '#bf00ff', // T 
    '#ff0000'  // Z 
];

// Definición de piezas
const piezas = [
    [[1, 1, 1, 1]],               // I
    [[2, 0, 0], [2, 2, 2]],       // J
    [[0, 0, 3], [3, 3, 3]],       // L
    [[4, 4], [4, 4]],             // O
    [[0, 5, 5], [5, 5, 0]],       // S
    [[0, 6, 0], [6, 6, 6]],       // T
    [[7, 7, 0], [0, 7, 7]]        // Z
];

// Pieza actual y siguiente
let piezaActual = null;
let siguientePieza = null;

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
    document.getElementById("mainMenuBtn").addEventListener("click", () => {
        window.location.href = "../../index.html";
    });

    // Prevenir scroll con teclas
    document.addEventListener("keydown", e => {
        if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(e.key)) {
            e.preventDefault();
        }
    });
}

// Iniciar juego
function startGame() {
    tablero = Array.from({ length: FILAS }, () => Array(COLUMNAS).fill(0));
    score = 0;
    level = 1;
    lines = 0;
    dropInterval = 1000;
    gameActive = true;
    gamePaused = false;
    
    generarSiguientePieza();
    nuevaPieza();
    updateUI();
    gameLoop();
}

// Generar siguiente pieza
function generarSiguientePieza() {
    const id = Math.floor(Math.random() * piezas.length);
    const forma = piezas[id].map(f => f.slice());
    siguientePieza = { forma, id: id + 1 };
    dibujarSiguientePieza();
}

// Nueva pieza actual
function nuevaPieza() {
    if (siguientePieza) {
        piezaActual = {
            x: Math.floor(COLUMNAS / 2) - Math.ceil(siguientePieza.forma[0].length / 2),
            y: -siguientePieza.forma.length,
            forma: siguientePieza.forma,
            id: siguientePieza.id
        };
    }
    generarSiguientePieza();
    
    // Verificar game over
    if (hayColision(tablero, piezaActual)) {
        gameOver();
    }
}

// Dibujar siguiente pieza
function dibujarSiguientePieza() {
    nextCtx.clearRect(0, 0, nextCanvas.width, nextCanvas.height);
    
    if (!siguientePieza) return;
    
    const forma = siguientePieza.forma;
    const color = colores[siguientePieza.id];
    
    // Centrar la pieza con bloques más grandes
    const blockSize = 20; // Vista previa
    const offsetX = (nextCanvas.width - forma[0].length * blockSize) / 2;
    const offsetY = (nextCanvas.height - forma.length * blockSize) / 2;
    
    for (let fila = 0; fila < forma.length; fila++) {
        for (let col = 0; col < forma[fila].length; col++) {
            if (forma[fila][col]) {
                const x = offsetX + col * blockSize;
                const y = offsetY + fila * blockSize;
                
                // Bloque con efecto neón
                nextCtx.fillStyle = color;
                nextCtx.shadowBlur = 10;
                nextCtx.shadowColor = color + '80';
                nextCtx.fillRect(x, y, blockSize - 1, blockSize - 1);
                nextCtx.shadowBlur = 0;
                
                // Efecto de brillo interno
                nextCtx.fillStyle = '#ffffff40';
                nextCtx.fillRect(x + 2, y + 2, blockSize - 5, blockSize - 5);
            }
        }
    }
}

// Rotacion de las piezas
function rotar(matriz) {
    return matriz[0].map((_, i) => matriz.map(fila => fila[fila.length - 1 - i]));
}

// Detectar colisiones
function hayColision(tablero, pieza) {
    const { x, y, forma } = pieza;
    for (let fila = 0; fila < forma.length; fila++) {
        for (let col = 0; col < forma[fila].length; col++) {
            if (forma[fila][col]) {
                const posY = y + fila;
                const posX = x + col;
                if (posY >= FILAS || posX < 0 || posX >= COLUMNAS) return true;
                if (posY >= 0 && tablero[posY][posX]) return true;
            }
        }
    }
    return false;
}

// Fijar pieza en el tablero
function fijarPieza(tablero, pieza) {
    const { x, y, forma, id } = pieza;
    for (let fila = 0; fila < forma.length; fila++) {
        for (let col = 0; col < forma[fila].length; col++) {
            if (forma[fila][col]) {
                const posY = y + fila;
                const posX = x + col;
                if (posY >= 0) tablero[posY][posX] = id;
            }
        }
    }
}

// Limpiar líneas completas
function limpiarFilas() {
    let lineasCompletadas = 0;
    
    for (let fila = FILAS - 1; fila >= 0; fila--) {
        if (tablero[fila].every(valor => valor !== 0)) {
            tablero.splice(fila, 1);
            tablero.unshift(Array(COLUMNAS).fill(0));
            lineasCompletadas++;
            fila++;
        }
    }
    
    if (lineasCompletadas > 0) {
        // Calcular puntuación
        const puntos = [0, 40, 100, 300, 1200][lineasCompletadas] * level;
        score += puntos;
        lines += lineasCompletadas;
        
        // Subir nivel cada 10 líneas
        level = Math.floor(lines / 10) + 1;
        dropInterval = Math.max(100, 1000 - (level - 1) * 100);
        
        // Efecto visual tras línea completada
        crearEfectoLinea(lineasCompletadas);
    }
}

// Mover pieza
function moverPieza(dx, dy) {
    if (!gameActive || gamePaused || !piezaActual) return false;
    
    const anteriorX = piezaActual.x;
    const anteriorY = piezaActual.y;

    piezaActual.x += dx;
    piezaActual.y += dy;

    if (hayColision(tablero, piezaActual)) {
        piezaActual.x = anteriorX;
        piezaActual.y = anteriorY;
        
        // Si no se puede bajar, fijar la pieza
        if (dy > 0) {
            fijarPieza(tablero, piezaActual);
            limpiarFilas();
            nuevaPieza();
        }
        return false;
    }
    return true;
}

// Dibujos del juego
function dibujar() {
    // Fondo
    ctx.fillStyle = '#111127';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Cuadrícula
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.lineWidth = 0.5;
    for (let x = 0; x <= COLUMNAS; x++) {
        ctx.beginPath();
        ctx.moveTo(x * BLOQUE, 0);
        ctx.lineTo(x * BLOQUE, FILAS * BLOQUE);
        ctx.stroke();
    }
    for (let y = 0; y <= FILAS; y++) {
        ctx.beginPath();
        ctx.moveTo(0, y * BLOQUE);
        ctx.lineTo(COLUMNAS * BLOQUE, y * BLOQUE);
        ctx.stroke();
    }
    
    // Bloques del tablero
    for (let fila = 0; fila < FILAS; fila++) {
        for (let col = 0; col < COLUMNAS; col++) {
            if (tablero[fila][col]) {
                dibujarBloque(col * BLOQUE, fila * BLOQUE, colores[tablero[fila][col]]);
            }
        }
    }
    
    // Pieza actual
    if (piezaActual) {
        for (let fila = 0; fila < piezaActual.forma.length; fila++) {
            for (let col = 0; col < piezaActual.forma[fila].length; col++) {
                if (piezaActual.forma[fila][col]) {
                    const px = (piezaActual.x + col) * BLOQUE;
                    const py = (piezaActual.y + fila) * BLOQUE;
                    dibujarBloque(px, py, colores[piezaActual.id]);
                }
            }
        }
    }
}

// Dibujar bloque con efectos
function dibujarBloque(x, y, color) {
    // Sombra exterior
    ctx.shadowBlur = 15;
    ctx.shadowColor = color + '80';
    
    // Bloque principal
    ctx.fillStyle = color;
    ctx.fillRect(x + 1, y + 1, BLOQUE - 2, BLOQUE - 2);
    
    // Efecto de brillo interno
    const gradient = ctx.createRadialGradient(
        x + BLOQUE/2, y + BLOQUE/2, 0,
        x + BLOQUE/2, y + BLOQUE/2, BLOQUE/2
    );
    gradient.addColorStop(0, '#ffffff40');
    gradient.addColorStop(1, 'transparent');
    
    ctx.fillStyle = gradient;
    ctx.fillRect(x + 3, y + 3, BLOQUE - 6, BLOQUE - 6);
    
    // Borde brillante
    ctx.strokeStyle = '#ffffff60';
    ctx.lineWidth = 1;
    ctx.strokeRect(x + 1, y + 1, BLOQUE - 2, BLOQUE - 2);
    
    ctx.shadowBlur = 0;
}

// Bucle principal del juego
function gameLoop(time = 0) {
    if (!gameActive) return;
    
    const delta = time - lastTime;
    lastTime = time;
    
    if (!gamePaused) {
        dropCounter += delta;
        if (dropCounter > dropInterval) {
            moverPieza(0, 1);
            dropCounter = 0;
        }
    }
    
    dibujar();
    updateUI();
    requestAnimationFrame(gameLoop);
}

// Actualizar interfaz
function updateUI() {
    document.getElementById("score").textContent = score;
    document.getElementById("level").textContent = level;
    document.getElementById("lines").textContent = lines;
}

// Controles del teclado
document.addEventListener('keydown', evento => {
    if (!gameActive || gamePaused || !piezaActual) return;
    
    switch(evento.key) {
        case 'ArrowLeft':
            moverPieza(-1, 0);
            break;
        case 'ArrowRight':
            moverPieza(1, 0);
            break;
        case 'ArrowDown':
            moverPieza(0, 1);
            break;
        case ' ':
            const formaAnterior = piezaActual.forma;
            piezaActual.forma = rotar(piezaActual.forma);
            if (hayColision(tablero, piezaActual)) {
                piezaActual.forma = formaAnterior;
            }
            break;
    }
});

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
    
    const gameOverScreen = document.getElementById("gameOverScreen");
    const finalScore = document.getElementById("finalScore");
    const finalLines = document.getElementById("finalLines");
    const finalLevel = document.getElementById("finalLevel");
    
    finalScore.textContent = score;
    finalLines.textContent = lines;
    finalLevel.textContent = level;
    
    setTimeout(() => {
        gameOverScreen.style.display = "flex";
    }, 500);
}

// Efecto visual al completar línea
function crearEfectoLinea(lineasCompletadas) {
    console.log(`¡${lineasCompletadas} línea(s) completada(s)!`);
}