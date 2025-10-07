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
    const cantidadParticulas = 40;
    
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

// Configuración del canvas
lienzo.width = 800;
lienzo.height = 600;

// Estado del juego
let estadoJuego = {
    puntuacion: 0,
    nivel: 1,
    vidas: 3,
    invasoresDestruidos: 0,
    puntuacionMaxima: localStorage.getItem('spaceInvadersHighScore') || 0,
    juegoTerminado: false
};

// Elementos del juego
let jugador, balas, invasores, explosiones;
let direccionEnemigo = 1;
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
        invasoresDestruidos: 0,
        puntuacionMaxima: localStorage.getItem('spaceInvadersHighScore') || 0,
        juegoTerminado: false
    };
    
    // Jugador
    jugador = {
        x: lienzo.width / 2,
        y: lienzo.height - 80,
        ancho: 60,
        alto: 25,
        velocidad: 6,
        color: "#00ccff",
        puedeDisparar: true,
        tiempoRecarga: 400
    };
    
    balas = [];
    invasores = [];
    explosiones = [];
    direccionEnemigo = 1;
    
    juegoActivo = true;
    juegoPausado = false;
    
    crearInvasores();
    actualizarUI();
    bucleJuego();
}

// Generar invasores
function crearInvasores() {
    invasores = [];
    const filas = 5, columnas = 9;
    const espaciadoX = 70, espaciadoY = 55;
    const desplazamientoX = (lienzo.width - columnas * espaciadoX) / 2;
    const colores = ["#ff4d4d", "#ff9933", "#ffff66", "#99ff33", "#66ccff"];
    
    for (let f = 0; f < filas; f++) {
        for (let c = 0; c < columnas; c++) {
            invasores.push({
                x: desplazamientoX + c * espaciadoX,
                y: 80 + f * espaciadoY,
                ancho: 40,
                alto: 25,
                color: colores[f % colores.length],
                vivo: true,
                velocidad: 1 + (estadoJuego.nivel * 0.5)
            });
        }
    }
}

// Control de teclado
const teclas = {};
document.addEventListener("keydown", e => {
    teclas[e.key] = true;
    if (e.key === ' ') e.preventDefault();
});
document.addEventListener("keyup", e => teclas[e.key] = false);

// Disparar
document.addEventListener("keydown", e => {
    if (e.code === "Space" && juegoActivo && !juegoPausado && jugador.puedeDisparar) {
        disparar();
    }
});

function disparar() {
    balas.push({
        x: jugador.x + jugador.ancho / 2 - 2,
        y: jugador.y,
        ancho: 4,
        alto: 10,
        velocidad: 8,
        color: "#00ffff"
    });
    jugador.puedeDisparar = false;
    setTimeout(() => jugador.puedeDisparar = true, jugador.tiempoRecarga);
}

// =============================================
// ACTUALIZAR JUEGO CON TRASLACIONES GEOMÉTRICAS
// =============================================
function actualizar() {
    if (!juegoActivo || juegoPausado || estadoJuego.juegoTerminado) return;
    
    // =============================================
    // MOVIMIENTO DEL JUGADOR CON TRASLACIÓN Y LÍMITES
    // =============================================
    if (teclas["ArrowLeft"]) {
        const nuevaPos = aplicarTraslacionConLimites(
            jugador,
            -jugador.velocidad,
            0,
            0,
            lienzo.width - jugador.ancho,
            0,
            lienzo.height
        );
        jugador.x = nuevaPos.x;
    }
    if (teclas["ArrowRight"]) {
        const nuevaPos = aplicarTraslacionConLimites(
            jugador,
            jugador.velocidad,
            0,
            0,
            lienzo.width - jugador.ancho,
            0,
            lienzo.height
        );
        jugador.x = nuevaPos.x;
    }
    
    // =============================================
    // MOVIMIENTO DE BALAS CON TRASLACIÓN VERTICAL
    // =============================================
    balas.forEach(bala => {
        const vectorTraslacion = { dx: 0, dy: -bala.velocidad }; // T = (0, -velocidad)
        const nuevaPos = aplicarTraslacion(bala, vectorTraslacion.dx, vectorTraslacion.dy);
        bala.x = nuevaPos.x;
        bala.y = nuevaPos.y;
    });
    balas = balas.filter(bala => bala.y + bala.alto > 0);
    
    // =============================================
    // MOVIMIENTO DE INVASORES CON TRASLACIÓN HORIZONTAL
    // =============================================
    let tocoBorde = false;
    invasores.forEach(invasor => {
        if (invasor.vivo) {
            const vectorTraslacion = { 
                dx: direccionEnemigo * invasor.velocidad, 
                dy: 0 
            };
            const nuevaPos = aplicarTraslacion(invasor, vectorTraslacion.dx, vectorTraslacion.dy);
            invasor.x = nuevaPos.x;
            
            if (invasor.x <= 0 || invasor.x + invasor.ancho >= lienzo.width) {
                tocoBorde = true;
            }
        }
    });
    
    if (tocoBorde) {
        direccionEnemigo *= -1;
        invasores.forEach(invasor => {
            if (invasor.vivo) {
                // =============================================
                // TRASLACIÓN VERTICAL HACIA ABAJO AL LLEGAR AL BORDE
                // =============================================
                const vectorDescenso = { dx: 0, dy: 20 };
                const nuevaPos = aplicarTraslacion(invasor, vectorDescenso.dx, vectorDescenso.dy);
                invasor.y = nuevaPos.y;
            }
        });
    }
    
    // Detección de colisiones de la bala del invasor
    balas.forEach((bala, indiceBala) => {
        invasores.forEach((invasor, indiceInvasor) => {
            if (invasor.vivo &&
                bala.x < invasor.x + invasor.ancho && 
                bala.x + bala.ancho > invasor.x &&
                bala.y < invasor.y + invasor.alto && 
                bala.y + bala.alto > invasor.y) {
                
                // Destruir invasor
                invasor.vivo = false;
                balas.splice(indiceBala, 1);
                
                // Crear explosión
                explosiones.push({
                    x: invasor.x + invasor.ancho / 2,
                    y: invasor.y + invasor.alto / 2,
                    radio: 0,
                    radioMaximo: 20,
                    color: invasor.color
                });
                
                // Actualizar puntuación
                estadoJuego.puntuacion += 10;
                estadoJuego.invasoresDestruidos++;
                actualizarUI();
            }
        });
    });
    
    // Actualizar explosiones
    explosiones.forEach(explosion => {
        explosion.radio += 1;
    });
    explosiones = explosiones.filter(explosion => explosion.radio < explosion.radioMaximo);
    
    // Verificar si invasores llegaron al fondo
    invasores.forEach(invasor => {
        if (invasor.vivo && invasor.y + invasor.alto >= jugador.y) {
            juegoTerminado();
        }
    });
    
    // Verificar si se completó el nivel
    if (invasores.every(invasor => !invasor.vivo)) {
        nivelCompletado();
    }
}

// Dibujos del juego
function dibujar() {
    // Fondo del espacio
    const gradiente = contexto.createLinearGradient(0, 0, 0, lienzo.height);
    gradiente.addColorStop(0, "#000011");
    gradiente.addColorStop(1, "#000033");
    contexto.fillStyle = gradiente;
    contexto.fillRect(0, 0, lienzo.width, lienzo.height);
    
    // Estrellas de fondo
    dibujarEstrellas();
    
    // Jugador con efecto neón
    contexto.fillStyle = jugador.color;
    contexto.shadowBlur = 15;
    contexto.shadowColor = jugador.color;
    contexto.fillRect(jugador.x, jugador.y, jugador.ancho, jugador.alto);
    contexto.shadowBlur = 0;
    
    // Balas con efecto neón
    balas.forEach(bala => {
        contexto.fillStyle = bala.color;
        contexto.shadowBlur = 8;
        contexto.shadowColor = bala.color;
        contexto.fillRect(bala.x, bala.y, bala.ancho, bala.alto);
        contexto.shadowBlur = 0;
    });
    
    // Invasores con efecto neón
    invasores.forEach(invasor => {
        if (invasor.vivo) {
            contexto.fillStyle = invasor.color;
            contexto.shadowBlur = 10;
            contexto.shadowColor = invasor.color;
            contexto.fillRect(invasor.x, invasor.y, invasor.ancho, invasor.alto);
            contexto.shadowBlur = 0;
            
            // Detalles del invasor
            contexto.fillStyle = "#000000";
            contexto.fillRect(invasor.x + 5, invasor.y + 5, 10, 5);
            contexto.fillRect(invasor.x + 25, invasor.y + 5, 10, 5);
            contexto.fillRect(invasor.x + 10, invasor.y + 15, 20, 5);
        }
    });
    
    // Explosiones
    explosiones.forEach(explosion => {
        contexto.beginPath();
        contexto.arc(explosion.x, explosion.y, explosion.radio, 0, Math.PI * 2);
        contexto.strokeStyle = explosion.color;
        contexto.lineWidth = 2;
        contexto.shadowBlur = 10;
        contexto.shadowColor = explosion.color;
        contexto.stroke();
        contexto.shadowBlur = 0;
    });
}

// Dibujar estrellas de fondo
function dibujarEstrellas() {
    contexto.fillStyle = "white";
    for (let i = 0; i < 100; i++) {
        const x = (i * 127) % lienzo.width;
        const y = (i * 251) % lienzo.height;
        const tamaño = (i % 3) + 1;
        const opacidad = 0.3 + Math.random() * 0.7;
        
        contexto.globalAlpha = opacidad;
        contexto.fillRect(x, y, tamaño, tamaño);
    }
    contexto.globalAlpha = 1;
}

// Bucle principal del juego
function bucleJuego() {
    if (juegoActivo) {
        actualizar();
        dibujar();
        requestAnimationFrame(bucleJuego);
    }
}

// Actualizar interfaz
function actualizarUI() {
    document.getElementById("puntuacion").textContent = estadoJuego.puntuacion;
    document.getElementById("nivel").textContent = estadoJuego.nivel;
    document.getElementById("contadorInvasores").textContent = invasores.filter(i => i.vivo).length;
    document.getElementById("contadorVidas").textContent = estadoJuego.vidas;
    document.getElementById("puntuacionMaxima").textContent = estadoJuego.puntuacionMaxima;
    document.getElementById("valorVelocidad").textContent = (1 + (estadoJuego.nivel * 0.5)).toFixed(1);
}

// Actualizar puntuación máxima
function actualizarPuntuacionMaxima() {
    if (estadoJuego.puntuacion > estadoJuego.puntuacionMaxima) {
        estadoJuego.puntuacionMaxima = estadoJuego.puntuacion;
        localStorage.setItem('spaceInvadersHighScore', estadoJuego.puntuacionMaxima);
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
    juegoActivo = true;
    
    document.getElementById("pantallaNivelCompletado").style.display = "none";
    
    crearInvasores();
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
    const invasoresFinales = document.getElementById("invasoresFinales");
    
    puntuacionFinal.textContent = estadoJuego.puntuacion;
    nivelFinal.textContent = estadoJuego.nivel;
    invasoresFinales.textContent = estadoJuego.invasoresDestruidos;
    
    setTimeout(() => {
        pantallaGameOver.style.display = "flex";
    }, 500);
}