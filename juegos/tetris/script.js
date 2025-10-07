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
    crearParticulas();
    inicializarJuego();
});

// Sistema de partículas
function crearParticulas() {
    const contenedorParticulas = document.getElementById('particles');
    const cantidadParticulas = 25;
    for (let i = 0; i < cantidadParticulas; i++) {
        const particula = document.createElement('div');
        particula.classList.add('particle');
        const izquierda = Math.random() * 100;
        const retraso = Math.random() * 15;
        const duracion = 10 + Math.random() * 10;
        particula.style.left = `${izquierda}%`;
        particula.style.animationDelay = `${retraso}s`;
        particula.style.animationDuration = `${duracion}s`;
        const colores = ['var(--neon-pink)', 'var(--neon-blue)', 'var(--neon-green)', 'var(--neon-yellow)'];
        const colorAleatorio = colores[Math.floor(Math.random() * colores.length)];
        particula.style.backgroundColor = colorAleatorio;
        const tamaño = 1 + Math.random() * 2;
        particula.style.width = `${tamaño}px`;
        particula.style.height = `${tamaño}px`;
        contenedorParticulas.appendChild(particula);
    }
}

// Variables del juego
const lienzo = document.getElementById("lienzoJuego");
const contexto = lienzo.getContext("2d");
const lienzoSiguiente = document.getElementById("lienzoSiguientePieza");
const contextoSiguiente = lienzoSiguiente.getContext("2d");

// Configuración del tablero
const COLUMNAS = 10;
const FILAS = 20;
const BLOQUE = 40;

lienzo.width = COLUMNAS * BLOQUE;  
lienzo.height = FILAS * BLOQUE;  

// Estado del juego
let tablero = Array.from({ length: FILAS }, () => Array(COLUMNAS).fill(0));
let puntuacion = 0;
let nivel = 1;
let lineas = 0;
let juegoActivo = false;
let juegoPausado = false;
let contadorCaida = 0;
let intervaloCaida = 1000;
let ultimoTiempo = 0;

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
function inicializarJuego() {
    // Botón de inicio
    const botonInicio = document.getElementById("botonInicio");
    const pantallaInicio = document.getElementById("pantallaInicio");
    const contenidoJuego = document.querySelector(".contenidoJuego");
    
    botonInicio.addEventListener("click", function() {
        pantallaInicio.style.display = "none";
        contenidoJuego.style.display = "block";
        comenzarJuego();
    });

    // Botones de control
    document.getElementById("botonPausa").addEventListener("click", alternarPausa);
    document.getElementById("botonReiniciar").addEventListener("click", reiniciarJuego);
    document.getElementById("botonReanudar").addEventListener("click", alternarPausa);
    document.getElementById("botonJugarOtraVez").addEventListener("click", reiniciarJuego);
    document.getElementById("botonMenuPrincipal").addEventListener("click", () => {
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
function comenzarJuego() {
    tablero = Array.from({ length: FILAS }, () => Array(COLUMNAS).fill(0));
    puntuacion = 0;
    nivel = 1;
    lineas = 0;
    intervaloCaida = 1000;
    juegoActivo = true;
    juegoPausado = false;
    
    generarSiguientePieza();
    nuevaPieza();
    actualizarUI();
    bucleJuego();
}

// Generar siguiente pieza
function generarSiguientePieza() {
    const id = Math.floor(Math.random() * piezas.length);
    const forma = piezas[id].map(f => f.slice());
    siguientePieza = { forma, id: id + 1 };
    dibujarSiguientePieza();
}

// =============================================
// NUEVA PIEZA CON TRASLACIÓN INICIAL
// =============================================
function nuevaPieza() {
    if (siguientePieza) {
        // Posición inicial usando traslación desde fuera del tablero
        const posicionInicial = {
            x: Math.floor(COLUMNAS / 2) - Math.ceil(siguientePieza.forma[0].length / 2),
            y: -siguientePieza.forma.length
        };
        
        piezaActual = {
            x: posicionInicial.x,
            y: posicionInicial.y,
            forma: siguientePieza.forma,
            id: siguientePieza.id
        };
    }
    generarSiguientePieza();
    
    // Verificar game over - más estricto ahora
    if (hayColision(tablero, piezaActual) || tableroLleno()) {
        // Pequeño delay para que sea más justo
        setTimeout(() => {
            juegoTerminado();
        }, 100);
        return;
    }
}

// Dibujar siguiente pieza
function dibujarSiguientePieza() {
    contextoSiguiente.clearRect(0, 0, lienzoSiguiente.width, lienzoSiguiente.height);
    
    if (!siguientePieza) return;
    
    const forma = siguientePieza.forma;
    const color = colores[siguientePieza.id];
    
    // Centrar la pieza con bloques más grandes
    const tamañoBloque = 20; // Vista previa
    const desplazamientoX = (lienzoSiguiente.width - forma[0].length * tamañoBloque) / 2;
    const desplazamientoY = (lienzoSiguiente.height - forma.length * tamañoBloque) / 2;
    
    for (let fila = 0; fila < forma.length; fila++) {
        for (let col = 0; col < forma[fila].length; col++) {
            if (forma[fila][col]) {
                const x = desplazamientoX + col * tamañoBloque;
                const y = desplazamientoY + fila * tamañoBloque;
                
                // Bloque con efecto neón
                contextoSiguiente.fillStyle = color;
                contextoSiguiente.shadowBlur = 10;
                contextoSiguiente.shadowColor = color + '80';
                contextoSiguiente.fillRect(x, y, tamañoBloque - 1, tamañoBloque - 1);
                contextoSiguiente.shadowBlur = 0;
                
                // Efecto de brillo interno
                contextoSiguiente.fillStyle = '#ffffff40';
                contextoSiguiente.fillRect(x + 2, y + 2, tamañoBloque - 5, tamañoBloque - 5);
            }
        }
    }
}

// Rotacion de las piezas
function rotar(matriz) {
    return matriz[0].map((_, i) => matriz.map(fila => fila[fila.length - 1 - i]));
}

function tableroLleno() {
    // Verificar si alguna columna ha llegado hasta la parte superior
    for (let col = 0; col < COLUMNAS; col++) {
        if (tablero[0][col] !== 0) {
            return true;
        }
    }
    return false;
}

// Detectar colisiones
function hayColision(tablero, pieza) {
    const { x, y, forma } = pieza;
    
    // Verificar si el tablero ya está lleno hasta arriba
    if (tableroLleno() && y < 0) {
        return true;
    }
    
    for (let fila = 0; fila < forma.length; fila++) {
        for (let col = 0; col < forma[fila].length; col++) {
            if (forma[fila][col]) {
                const posY = y + fila;
                const posX = x + col;
                
                // Si está fuera de los límites verticales u horizontales
                if (posY >= FILAS || posX < 0 || posX >= COLUMNAS) return true;
                
                // Si colisiona con un bloque existente (solo si está dentro del tablero)
                if (posY >= 0 && tablero[posY][posX]) return true;
            }
        }
    }
    return false;
}

// Fijar pieza en el tablero
function fijarPieza(tablero, pieza) {
    const { x, y, forma, id } = pieza;
    let piezaFijadaEnParteSuperior = false;
    
    for (let fila = 0; fila < forma.length; fila++) {
        for (let col = 0; col < forma[fila].length; col++) {
            if (forma[fila][col]) {
                const posY = y + fila;
                const posX = x + col;
                if (posY >= 0) {
                    tablero[posY][posX] = id;
                    // Si la pieza se fija en la fila 0 o 1, marcamos que está en parte superior
                    if (posY <= 1) {
                        piezaFijadaEnParteSuperior = true;
                    }
                }
            }
        }
    }
    
    // Verificar game over después de fijar la pieza
    if (piezaFijadaEnParteSuperior || tableroLleno()) {
        // Pequeño delay para que el jugador vea la última pieza antes del game over
        setTimeout(() => {
            if (tableroLleno()) {
                juegoTerminado();
            }
        }, 100);
    }
}

// Limpiar líneas completadas
function limpiarFilas() {
    let lineasCompletadas = 0;
    
    for (let fila = FILAS - 1; fila >= 0; fila--) {
        if (tablero[fila].every(valor => valor !== 0)) {
            tablero.splice(fila, 1);
            tablero.unshift(Array(COLUMNAS).fill(0));
            lineasCompletadas++;
            fila++; // Revisar la misma fila again ya que se movieron todas hacia abajo
        }
    }
    
    if (lineasCompletadas > 0) {
        // Calcular puntuación
        const puntos = [0, 40, 100, 300, 1200][lineasCompletadas] * nivel;
        puntuacion += puntos;
        lineas += lineasCompletadas;
        
        // Subir nivel cada 10 líneas
        nivel = Math.floor(lineas / 10) + 1;
        intervaloCaida = Math.max(100, 1000 - (nivel - 1) * 100);
        
        // Efecto visual tras línea completada
        crearEfectoLinea(lineasCompletadas);
        
        // Verificar si después de limpiar líneas el tablero sigue lleno
        if (tableroLleno()) {
            setTimeout(() => {
                juegoTerminado();
            }, 300);
        }
    }
    
    // Actualizar UI después de limpiar filas
    actualizarUI();
}

// =============================================
// MOVER PIEZA CON TRASLACIONES GEOMÉTRICAS
// =============================================
function moverPieza(dx, dy) {
    if (!juegoActivo || juegoPausado || !piezaActual) return false;
    
    const anteriorX = piezaActual.x;
    const anteriorY = piezaActual.y;

    // =============================================
    // APLICAR TRASLACIÓN: P' = P + T
    // =============================================
    const nuevaPos = aplicarTraslacion(piezaActual, dx, dy);
    piezaActual.x = nuevaPos.x;
    piezaActual.y = nuevaPos.y;

    if (hayColision(tablero, piezaActual)) {
        // Revertir traslación si hay colisión
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

// =============================================
// MOVIMIENTO AUTOMÁTICO (CAÍDA) CON TRASLACIÓN
// =============================================
function moverPiezaAbajo() {
    if (!juegoActivo || juegoPausado || !piezaActual) return false;
    
    const anteriorY = piezaActual.y;

    // TRASLACIÓN VERTICAL: P' = P + (0, 1)
    const nuevaPos = aplicarTraslacion(piezaActual, 0, 1);
    piezaActual.y = nuevaPos.y;

    if (hayColision(tablero, piezaActual)) {
        piezaActual.y = anteriorY;
        fijarPieza(tablero, piezaActual);
        limpiarFilas();
        
        // Solo crear nueva pieza si el juego no terminó
        if (juegoActivo) {
            nuevaPieza();
        }
        return false;
    }
    return true;
}

// Dibujos del juego
function dibujar() {
    // Fondo
    contexto.fillStyle = '#111127';
    contexto.fillRect(0, 0, lienzo.width, lienzo.height);
    
    // Cuadrícula
    contexto.strokeStyle = 'rgba(255, 255, 255, 0.1)';
    contexto.lineWidth = 0.5;
    for (let x = 0; x <= COLUMNAS; x++) {
        contexto.beginPath();
        contexto.moveTo(x * BLOQUE, 0);
        contexto.lineTo(x * BLOQUE, FILAS * BLOQUE);
        contexto.stroke();
    }
    for (let y = 0; y <= FILAS; y++) {
        contexto.beginPath();
        contexto.moveTo(0, y * BLOQUE);
        contexto.lineTo(COLUMNAS * BLOQUE, y * BLOQUE);
        contexto.stroke();
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
    contexto.shadowBlur = 15;
    contexto.shadowColor = color + '80';
    
    // Bloque principal
    contexto.fillStyle = color;
    contexto.fillRect(x + 1, y + 1, BLOQUE - 2, BLOQUE - 2);
    
    // Efecto de brillo interno
    const gradiente = contexto.createRadialGradient(
        x + BLOQUE/2, y + BLOQUE/2, 0,
        x + BLOQUE/2, y + BLOQUE/2, BLOQUE/2
    );
    gradiente.addColorStop(0, '#ffffff40');
    gradiente.addColorStop(1, 'transparent');
    
    contexto.fillStyle = gradiente;
    contexto.fillRect(x + 3, y + 3, BLOQUE - 6, BLOQUE - 6);
    
    // Borde brillante
    contexto.strokeStyle = '#ffffff60';
    contexto.lineWidth = 1;
    contexto.strokeRect(x + 1, y + 1, BLOQUE - 2, BLOQUE - 2);
    
    contexto.shadowBlur = 0;
}

// =============================================
// BUCLE PRINCIPAL CON TRASLACIÓN AUTOMÁTICA
// =============================================
function bucleJuego(tiempo = 0) {
    if (!juegoActivo) return;
    
    const delta = tiempo - ultimoTiempo;
    ultimoTiempo = tiempo;
    
    if (!juegoPausado) {
        contadorCaida += delta;
        if (contadorCaida > intervaloCaida) {
            // =============================================
            // TRASLACIÓN AUTOMÁTICA HACIA ABAJO
            // =============================================
            moverPiezaAbajo();
            contadorCaida = 0;
        }
    }
    
    dibujar();
    actualizarUI();
    requestAnimationFrame(bucleJuego);
}

// Actualizar interfaz
function actualizarUI() {
    document.getElementById("puntuacion").textContent = puntuacion;
    document.getElementById("nivel").textContent = nivel;
    document.getElementById("lineas").textContent = lineas;
}

// =============================================
// CONTROLES CON TRASLACIONES GEOMÉTRICAS
// =============================================
document.addEventListener('keydown', evento => {
    if (!juegoActivo || juegoPausado || !piezaActual) return;
    
    switch(evento.key) {
        case 'ArrowLeft':
            // =============================================
            // TRASLACIÓN IZQUIERDA: P' = P + (-1, 0)
            // =============================================
            moverPieza(-1, 0);
            break;
        case 'ArrowRight':
            // =============================================
            // TRASLACIÓN DERECHA: P' = P + (1, 0)
            // =============================================
            moverPieza(1, 0);
            break;
        case 'ArrowDown':
            // =============================================
            // TRASLACIÓN ABAJO ACELERADA: P' = P + (0, 1)
            // =============================================
            moverPieza(0, 1);
            break;
        case ' ':
            const formaAnterior = piezaActual.forma;
            piezaActual.forma = rotar(piezaActual.forma);
            if (hayColision(tablero, piezaActual) || tableroLleno()) {
                piezaActual.forma = formaAnterior;
            }
            break;
    }
});

function mostrarAdvertenciaTableroLleno() {
    const mensaje = document.createElement('div');
    mensaje.style.cssText = `
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: rgba(255, 0, 0, 0.8);
        color: white;
        padding: 10px 20px;
        border-radius: 5px;
        font-family: Arial;
        z-index: 1000;
    `;
    mensaje.textContent = '¡TABLERO LLENO!';
    document.querySelector('.contenidoJuego').appendChild(mensaje);
    
    setTimeout(() => {
        mensaje.remove();
    }, 1000);
}

// Pausar/reanudar juego
function alternarPausa() {
    if (!juegoActivo) return;
    
    juegoPausado = !juegoPausado;
    const pantallaPausa = document.getElementById("pantallaPausa");
    const botonPausa = document.getElementById("botonPausa");
    
    if (juegoPausado) {
        pantallaPausa.style.display = "flex";
        botonPausa.textContent = "REANUDAR";
    } else {
        pantallaPausa.style.display = "none";
        botonPausa.textContent = "PAUSAR";
    }
}

// Reiniciar juego
function reiniciarJuego() {
    document.getElementById("pantallaGameOver").style.display = "none";
    document.getElementById("pantallaPausa").style.display = "none";
    comenzarJuego();
}

// Game over
function juegoTerminado() {
    juegoActivo = false;
    
    const pantallaGameOver = document.getElementById("pantallaGameOver");
    const puntuacionFinal = document.getElementById("puntuacionFinal");
    const lineasFinales = document.getElementById("lineasFinales");
    const nivelFinal = document.getElementById("nivelFinal");
    
    puntuacionFinal.textContent = puntuacion;
    lineasFinales.textContent = lineas;
    nivelFinal.textContent = nivel;
    
    setTimeout(() => {
        pantallaGameOver.style.display = "flex";
    }, 500);
}

// Efecto visual al completar línea
function crearEfectoLinea(lineasCompletadas) {
    console.log(`¡${lineasCompletadas} línea(s) completada(s)!`);
}
