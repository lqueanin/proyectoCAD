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
    const cantidadParticulas = 30;
    
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

const ANCHO = lienzo.width;
const ALTO = lienzo.height;

// Estado del juego
let estadoJuego = {
    puntuacion: 0,
    nivel: 1,
    vidas: 3,
    bloquesDestruidos: 0,
    puntuacionMaxima: localStorage.getItem('breakoutHighScore') || 0,
    juegoTerminado: false,
    pelotaLanzada: false
};

// Elementos del juego
let paleta, pelota, bloques;
let juegoActivo = false;
let juegoPausado = false;

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
    document.getElementById("botonSiguienteNivel").addEventListener("click", siguienteNivel);
    document.getElementById("botonMenuPrincipal").addEventListener("click", () => {
        window.location.href = "../../index.html";
    });

    // Prevenir scroll con teclas
    document.addEventListener("keydown", e => {
        if (['ArrowLeft', 'ArrowRight', ' '].includes(e.key)) {
            e.preventDefault();
        }
    });

    actualizarPuntuacionMaxima();
}

// Iniciar juego
function comenzarJuego() {
    estadoJuego = {
        puntuacion: 0,
        nivel: 1,
        vidas: 3,
        bloquesDestruidos: 0,
        puntuacionMaxima: localStorage.getItem('breakoutHighScore') || 0,
        juegoTerminado: false,
        pelotaLanzada: false
    };
    
    // Paleta
    paleta = { 
        x: ANCHO/2-40, 
        y: ALTO-30, 
        w: 80, 
        h: 12, 
        velocidad: 6, 
        minX: 0, 
        maxX: ANCHO-80 
    };
    
    // Pelota
    pelota = { 
        x: ANCHO/2, 
        y: ALTO-50, 
        r: 8,
        vx: 0,
        vy: 0,
        velocidadBase: 3
    };
    
    juegoActivo = true;
    juegoPausado = false;
    
    inicializarBloques();
    actualizarUI();
    bucleJuego();
}

// Generar bloques
function inicializarBloques() {
    bloques = [];
    const colores = ['#ff0000', '#ffff00', '#00ff00', '#00ffff', '#ff00ff'];
    
    for (let fila = 0; fila < 5; fila++) {
        for (let columna = 0; columna < 8; columna++) {
            bloques.push({
                x: 15 + columna * 47,
                y: 40 + fila * 28,
                w: 42, 
                h: 22,
                color: colores[fila],
                vivo: true,
                puntosVida: fila + 1 // Bloques más resistentes
            });
        }
    }
}

// Control de teclado
let teclas = {};
document.addEventListener('keydown', e => {
    teclas[e.key] = true;
    if (e.key === ' ') e.preventDefault();
});
document.addEventListener('keyup', e => teclas[e.key] = false);

// =============================================
// ACTUALIZAR JUEGO CON TRASLACIONES GEOMÉTRICAS
// =============================================
function actualizar() {
    if (!juegoActivo || juegoPausado || estadoJuego.juegoTerminado) return;
    
    // =============================================
    // MOVIMIENTO DE LA PALETA CON TRASLACIÓN Y LÍMITES
    // =============================================
    if (teclas['ArrowLeft']) {
        const nuevaPos = aplicarTraslacionConLimites(
            paleta,
            -paleta.velocidad,
            0,
            paleta.minX,
            paleta.maxX,
            0,
            ALTO
        );
        paleta.x = nuevaPos.x;
    }
    if (teclas['ArrowRight']) {
        const nuevaPos = aplicarTraslacionConLimites(
            paleta,
            paleta.velocidad,
            0,
            paleta.minX,
            paleta.maxX,
            0,
            ALTO
        );
        paleta.x = nuevaPos.x;
    }
    
    // Lanzar pelota con espacio
    if (teclas[' '] && !estadoJuego.pelotaLanzada) {
        estadoJuego.pelotaLanzada = true;
        pelota.vx = (Math.random() - 0.5) * 2;
        pelota.vy = -pelota.velocidadBase;
    }
    
    // Si la pelota no ha sido lanzada, seguir a la paleta
    if (!estadoJuego.pelotaLanzada) {
        // =============================================
        // TRASLACIÓN DE PELOTA A POSICIÓN DE PALETA
        // =============================================
        const posicionSobrePaleta = {
            x: paleta.x + paleta.w / 2,
            y: paleta.y - pelota.r - 2
        };
        pelota.x = posicionSobrePaleta.x;
        pelota.y = posicionSobrePaleta.y;
        return;
    }
    
    // =============================================
    // MOVIMIENTO DE LA PELOTA CON TRASLACIÓN
    // =============================================
    const vectorTraslacion = { dx: pelota.vx, dy: pelota.vy };
    const nuevaPosPelota = aplicarTraslacion(pelota, vectorTraslacion.dx, vectorTraslacion.dy);
    pelota.x = nuevaPosPelota.x;
    pelota.y = nuevaPosPelota.y;
    
    // Rebotes en paredes
    if (pelota.x - pelota.r <= 0 || pelota.x + pelota.r >= ANCHO) {
        pelota.vx *= -1;
        crearEfectoParticulas(pelota.x, pelota.y, 5);
    }
    
    // Rebote en techo
    if (pelota.y - pelota.r <= 0) {
        pelota.vy *= -1;
        crearEfectoParticulas(pelota.x, pelota.y, 5);
    }
    
    // Rebote en paleta
    if (pelota.y + pelota.r >= paleta.y && 
        pelota.x >= paleta.x && pelota.x <= paleta.x + paleta.w &&
        pelota.vy > 0) {
        
        // Ángulo basado en dónde golpea la paleta
        const posicionGolpe = (pelota.x - paleta.x) / paleta.w;
        pelota.vx = (posicionGolpe - 0.5) * 8;
        pelota.vy = -Math.abs(pelota.vy);
        crearEfectoParticulas(pelota.x, pelota.y, 8);
    }
    
    // Colisión con bloques
    let bloqueGolpeado = false;
    bloques.forEach(bloque => {
        if (bloque.vivo && 
            pelota.x + pelota.r > bloque.x && pelota.x - pelota.r < bloque.x + bloque.w &&
            pelota.y + pelota.r > bloque.y && pelota.y - pelota.r < bloque.y + bloque.h) {
            
            bloqueGolpeado = true;
            bloque.puntosVida--;
            
            if (bloque.puntosVida <= 0) {
                bloque.vivo = false;
                estadoJuego.puntuacion += 10 * estadoJuego.nivel;
                estadoJuego.bloquesDestruidos++;
                crearEfectoParticulas(bloque.x + bloque.w/2, bloque.y + bloque.h/2, 15, bloque.color);
            } else {
                crearEfectoParticulas(pelota.x, pelota.y, 5, bloque.color);
            }
            
            // Determinar dirección del rebote
            const pelotaIzquierda = pelota.x - pelota.r;
            const pelotaDerecha = pelota.x + pelota.r;
            const pelotaArriba = pelota.y - pelota.r;
            const pelotaAbajo = pelota.y + pelota.r;
            
            const bloqueIzquierda = bloque.x;
            const bloqueDerecha = bloque.x + bloque.w;
            const bloqueArriba = bloque.y;
            const bloqueAbajo = bloque.y + bloque.h;
            
            // Rebote horizontal
            if (pelotaDerecha > bloqueIzquierda && pelotaIzquierda < bloqueIzquierda && pelota.vx > 0) {
                pelota.vx *= -1;
            } else if (pelotaIzquierda < bloqueDerecha && pelotaDerecha > bloqueDerecha && pelota.vx < 0) {
                pelota.vx *= -1;
            }
            // Rebote vertical
            else if (pelotaAbajo > bloqueArriba && pelotaArriba < bloqueArriba && pelota.vy > 0) {
                pelota.vy *= -1;
            } else if (pelotaArriba < bloqueAbajo && pelotaAbajo > bloqueAbajo && pelota.vy < 0) {
                pelota.vy *= -1;
            }
        }
    });
    
    // Game Over o siguiente nivel
    if (pelota.y > ALTO) {
        estadoJuego.vidas--;
        if (estadoJuego.vidas <= 0) {
            juegoTerminado();
        } else {
            reiniciarPelota();
        }
    }
    
    // Verificar si se completó el nivel
    if (bloques.every(bloque => !bloque.vivo)) {
        nivelCompletado();
    }
    
    actualizarUI();
}

// Dibujar juego
function dibujar() {
    // Fondo
    contexto.fillStyle = '#001122';
    contexto.fillRect(0, 0, ANCHO, ALTO);
    
    // Paleta con efecto neón
    contexto.fillStyle = '#00ffff';
    contexto.shadowBlur = 15;
    contexto.shadowColor = '#00ffff';
    contexto.fillRect(paleta.x, paleta.y, paleta.w, paleta.h);
    contexto.shadowBlur = 0;
    
    // Pelota con efecto neón
    contexto.fillStyle = '#ffffff';
    contexto.shadowBlur = 10;
    contexto.shadowColor = '#ffffff';
    contexto.beginPath();
    contexto.arc(pelota.x, pelota.y, pelota.r, 0, Math.PI * 2);
    contexto.fill();
    contexto.shadowBlur = 0;
    
    // Bloques
    bloques.forEach(bloque => {
        if (bloque.vivo) {
            contexto.fillStyle = bloque.color;
            contexto.shadowBlur = 8;
            contexto.shadowColor = bloque.color;
            contexto.fillRect(bloque.x, bloque.y, bloque.w, bloque.h);
            contexto.shadowBlur = 0;
            
            // Borde
            contexto.strokeStyle = '#000000';
            contexto.lineWidth = 1;
            contexto.strokeRect(bloque.x, bloque.y, bloque.w, bloque.h);
            
            // Mostrar puntos de vida si es mayor a 1
            if (bloque.puntosVida > 1) {
                contexto.fillStyle = '#ffffff';
                contexto.font = '10px Arial';
                contexto.textAlign = 'center';
                contexto.fillText(bloque.puntosVida, bloque.x + bloque.w/2, bloque.y + bloque.h/2 + 3);
            }
        }
    });
    
    // Efectos de partículas
    dibujarParticulas();
}

// Sistema de partículas para efectos
let particulas = [];
function crearEfectoParticulas(x, y, cantidad, color = '#ffffff') {
    for (let i = 0; i < cantidad; i++) {
        particulas.push({
            x: x,
            y: y,
            vx: (Math.random() - 0.5) * 4,
            vy: (Math.random() - 0.5) * 4,
            vida: 30,
            color: color
        });
    }
}

function dibujarParticulas() {
    particulas.forEach((particula, indice) => {
        // =============================================
        // MOVIMIENTO DE PARTÍCULAS CON TRASLACIÓN
        // =============================================
        const vectorTraslacion = { dx: particula.vx, dy: particula.vy };
        const nuevaPos = aplicarTraslacion(particula, vectorTraslacion.dx, vectorTraslacion.dy);
        particula.x = nuevaPos.x;
        particula.y = nuevaPos.y;
        
        particula.vida--;
        
        if (particula.vida <= 0) {
            particulas.splice(indice, 1);
            return;
        }
        
        const alpha = particula.vida / 30;
        contexto.fillStyle = particula.color.replace(')', `,${alpha})`).replace('rgb', 'rgba');
        contexto.fillRect(particula.x, particula.y, 2, 2);
    });
}

// Bucle principal del juego
function bucleJuego() {
    if (juegoActivo) {
        actualizar();
        dibujar();
        requestAnimationFrame(bucleJuego);
    }
}

// Funciones auxiliares
function reiniciarPelota() {
    estadoJuego.pelotaLanzada = false;
    // =============================================
    // RESET DE PELOTA A POSICIÓN SOBRE PALETA
    // =============================================
    const posicionReset = {
        x: paleta.x + paleta.w / 2,
        y: paleta.y - pelota.r - 2
    };
    pelota.x = posicionReset.x;
    pelota.y = posicionReset.y;
    pelota.vx = 0;
    pelota.vy = 0;
}

function actualizarUI() {
    document.getElementById("puntuacion").textContent = estadoJuego.puntuacion;
    document.getElementById("nivel").textContent = estadoJuego.nivel;
    document.getElementById("contadorBloques").textContent = bloques.filter(b => b.vivo).length;
    document.getElementById("contadorVidas").textContent = estadoJuego.vidas;
    document.getElementById("puntuacionMaxima").textContent = estadoJuego.puntuacionMaxima;
    
    const velocidad = Math.sqrt(pelota.vx * pelota.vx + pelota.vy * pelota.vy).toFixed(1);
    document.getElementById("valorVelocidad").textContent = velocidad;
}

function actualizarPuntuacionMaxima() {
    if (estadoJuego.puntuacion > estadoJuego.puntuacionMaxima) {
        estadoJuego.puntuacionMaxima = estadoJuego.puntuacion;
        localStorage.setItem('breakoutHighScore', estadoJuego.puntuacionMaxima);
    }
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
    document.getElementById("pantallaNivelCompletado").style.display = "none";
    document.getElementById("pantallaPausa").style.display = "none";
    comenzarJuego();
}

// Nivel completado
function nivelCompletado() {
    juegoActivo = false;
    
    const pantallaNivelCompletado = document.getElementById("pantallaNivelCompletado");
    const puntuacionNivel = document.getElementById("puntuacionNivel");
    const siguienteNivel = document.getElementById("siguienteNivel");
    
    puntuacionNivel.textContent = estadoJuego.puntuacion;
    siguienteNivel.textContent = estadoJuego.nivel + 1;
    
    setTimeout(() => {
        pantallaNivelCompletado.style.display = "flex";
    }, 500);
}

function siguienteNivel() {
    estadoJuego.nivel++;
    estadoJuego.pelotaLanzada = false;
    juegoActivo = true;
    
    document.getElementById("pantallaNivelCompletado").style.display = "none";
    
    // Aumentar dificultad
    pelota.velocidadBase += 0.5;
    paleta.w = Math.max(40, paleta.w - 5); // Hacer la paleta más pequeña
    
    inicializarBloques();
    reiniciarPelota();
    actualizarUI();
    bucleJuego();
}

// Game over
function juegoTerminado() {
    estadoJuego.juegoTerminado = true;
    juegoActivo = false;
    actualizarPuntuacionMaxima();
    
    const pantallaGameOver = document.getElementById("pantallaGameOver");
    const puntuacionFinal = document.getElementById("puntuacionFinal");
    const nivelFinal = document.getElementById("nivelFinal");
    const bloquesFinales = document.getElementById("bloquesFinales");
    
    puntuacionFinal.textContent = estadoJuego.puntuacion;
    nivelFinal.textContent = estadoJuego.nivel;
    bloquesFinales.textContent = estadoJuego.bloquesDestruidos;
    
    setTimeout(() => {
        pantallaGameOver.style.display = "flex";
    }, 500);
}