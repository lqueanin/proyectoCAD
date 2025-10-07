// Inicialización del juego
document.addEventListener('DOMContentLoaded', function() {
    crearParticulas();
    inicializarJuego();
});

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

function aplicarTraslacionConAngulo(objeto, velocidad, angulo) {
    const dx = Math.cos(angulo) * velocidad;
    const dy = Math.sin(angulo) * velocidad;
    return aplicarTraslacion(objeto, dx, dy);
}

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

const ANCHO = lienzo.width;
const ALTO = lienzo.height;

// Estado del juego
let estadoJuego = {
    nivel: 1,
    vidas: 3,
    puntuacion: 0,
    juegoTerminado: false,
    enemigosDestruidos: 0,
    puntuacionMaxima: localStorage.getItem('galagaHighScore') || 0
};

// Nave del jugador
const jugador = {
    x: ANCHO/2 - 20,
    y: ALTO - 60,
    w: 40,
    h: 40,
    velocidad: 5,
    minX: 10,
    maxX: ANCHO - 50,
    invulnerable: 0,
    parpadeo: 0
};

// Disparos
let balas = [];
let ultimoDisparo = 0;
const RETRASO_DISPARO = 200;

// Enemigos
let enemigos = [];
let jefe = null;
let tiempoJuego = 0;
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
    document.getElementById("botonMenuPrincipal").addEventListener("click", () => {
        window.location.href = "../../index.html";
    });

    // Prevenir scroll con teclas
    document.addEventListener("keydown", e => {
        if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' ', 'a', 'd'].includes(e.key)) {
            e.preventDefault();
        }
    });

    // Actualizar puntuación máxima
    actualizarPuntuacionMaxima();
}

// Iniciar juego
function comenzarJuego() {
    estadoJuego = {
        nivel: 1,
        vidas: 3,
        puntuacion: 0,
        juegoTerminado: false,
        enemigosDestruidos: 0,
        puntuacionMaxima: localStorage.getItem('galagaHighScore') || 0
    };
    
    jugador.x = ANCHO/2 - 20;
    jugador.y = ALTO - 60;
    jugador.invulnerable = 0;
    
    balas = [];
    enemigos = [];
    jefe = null;
    tiempoJuego = 0;
    
    juegoActivo = true;
    juegoPausado = false;
    
    generarEnemigos();
    actualizarUI();
    bucleJuego();
}

// Generar enemigos
function generarEnemigos() {
    enemigos = [];
    const cantidadEnemigos = 6 + estadoJuego.nivel * 2;
    
    for (let i = 0; i < cantidadEnemigos; i++) {
        const inicioX = Math.random() * ANCHO;
        
        enemigos.push({
            x: inicioX,
            y: -40,
            w: 30,
            h: 30,
            objetivoX: 50 + (i % 6) * 50,
            objetivoY: 50 + Math.floor(i / 6) * 40,
            estado: 'entrando',
            tiempoEntrada: 0,
            amplitudCurva: Math.random() * 30 + 20,
            frecuenciaCurva: Math.random() * 0.05 + 0.02,
            tiempoRecargaPicada: Math.random() * 200 + 100,
            haPicado: false,
            velocidad: 0.5 + estadoJuego.nivel * 0.1
        });
    }
    
    // Crear jefe cada 2 niveles
    if (estadoJuego.nivel % 2 === 0) {
        jefe = {
            x: ANCHO / 2 - 25,
            y: -60,
            w: 50,
            h: 50,
            objetivoX: ANCHO / 2 - 25,
            objetivoY: 100,
            estado: 'entrando',
            salud: 3,
            saludMaxima: 3,
            hazTractor: {
                activo: false,
                x: 0,
                y: 0,
                ancho: 20,
                alto: 0,
                objetivoJugador: false
            },
            tiempoRecargaAtaque: 300
        };
    }
}

// Control de teclado
let teclas = {};
document.addEventListener('keydown', e => {
    teclas[e.key] = true;
    if (e.key === ' ') e.preventDefault();
});
document.addEventListener('keyup', e => teclas[e.key] = false);

// Actualizar juego
function actualizar() {
    if (!juegoActivo || juegoPausado || estadoJuego.juegoTerminado) return;
    
    tiempoJuego++;
    
    // Actualizar invulnerabilidad
    if (jugador.invulnerable > 0) {
        jugador.invulnerable--;
        jugador.parpadeo = (jugador.parpadeo + 1) % 10;
    }
    
    // =============================================
    // TRASLACIÓN DEL JUGADOR USANDO P' = P + T
    // =============================================
    
    if (teclas['ArrowLeft'] || teclas['a']) {
        const nuevaPos = aplicarTraslacionConLimites(
            jugador, 
            -jugador.velocidad,  // T = (-velocidad, 0)
            0,
            jugador.minX, 
            jugador.maxX,
            0,
            ALTO
        );
        jugador.x = nuevaPos.x;
        jugador.y = nuevaPos.y;
    }
    
    if (teclas['ArrowRight'] || teclas['d']) {
        const nuevaPos = aplicarTraslacionConLimites(
            jugador, 
            jugador.velocidad,   // T = (+velocidad, 0)
            0,
            jugador.minX, 
            jugador.maxX,
            0,
            ALTO
        );
        jugador.x = nuevaPos.x;
        jugador.y = nuevaPos.y;
    }
    
    // Disparos
    const tiempoActual = Date.now();
    if ((teclas[' '] || teclas['Spacebar']) && balas.length < 5 && tiempoActual - ultimoDisparo > RETRASO_DISPARO) {
        balas.push({
            x: jugador.x + jugador.w/2 - 2,
            y: jugador.y,
            w: 4,
            h: 10,
            velocidad: 7
        });
        ultimoDisparo = tiempoActual;
    }

    // =============================================
    // TRASLACIÓN DE DISPAROS USANDO P' = P + T
    // =============================================
    
    balas.forEach(b => {
        const vectorTraslacion = { dx: 0, dy: -b.velocidad }; // T = (0, -velocidad)
        const nuevaPos = aplicarTraslacion(b, vectorTraslacion.dx, vectorTraslacion.dy);
        b.x = nuevaPos.x;
        b.y = nuevaPos.y;
    });
    balas = balas.filter(b => b.y + b.h > 0);

    // =============================================
    // TRASLACIÓN DE ENEMIGOS USANDO DIFERENTES TIPOS DE MOVIMIENTO
    // =============================================
    
    enemigos.forEach(e => {
        if (e.estado === 'entrando') {
            e.tiempoEntrada += 1;
            
            // Traslación vertical simple
            const vectorEntrada = { dx: 0, dy: 1 }; // T = (0, 1)
            const nuevaPos = aplicarTraslacion(e, vectorEntrada.dx, vectorEntrada.dy);
            e.y = nuevaPos.y;
            
            // Movimiento curvo con función seno
            const desplazamientoCurva = Math.sin(e.tiempoEntrada * e.frecuenciaCurva) * e.amplitudCurva;
            e.x = e.objetivoX + desplazamientoCurva;
            
            if (e.y >= e.objetivoY) {
                e.y = e.objetivoY;
                e.estado = 'formacion';
            }
        } else if (e.estado === 'formacion') {
            // Movimiento oscilatorio en formación
            const oscilacion = Math.sin(tiempoJuego * 0.05) * 10;
            e.x = e.objetivoX + oscilacion;
            
            if (!e.haPicado && e.tiempoRecargaPicada <= 0 && Math.random() < 0.005) {
                e.estado = 'picada';
                e.inicioPicadaX = e.x;
                e.inicioPicadaY = e.y;
                e.anguloPicada = Math.atan2(jugador.y - e.y, jugador.x - e.x);
            } else {
                e.tiempoRecargaPicada--;
            }
        } else if (e.estado === 'picada') {
            // =============================================
            // TRASLACIÓN CON ÁNGULO: P' = P + (velocidad * cos(θ), velocidad * sin(θ))
            // =============================================
            
            const nuevaPos = aplicarTraslacionConAngulo(e, e.velocidad * 2, e.anguloPicada);
            e.x = nuevaPos.x;
            e.y = nuevaPos.y;
            
            if (jugador.invulnerable <= 0 && 
                e.x < jugador.x + jugador.w && e.x + e.w > jugador.x && 
                e.y < jugador.y + jugador.h && e.y + e.h > jugador.y) {
                perderVida();
                e.estado = 'regresando';
                e.haPicado = true;
            }
            
            if (e.y > ALTO || e.x < 0 || e.x > ANCHO) {
                e.estado = 'regresando';
                e.haPicado = true;
            }
        } else if (e.estado === 'regresando') {
            // =============================================
            // TRASLACIÓN HACIA OBJETIVO: P' = P + vector_normalizado * velocidad
            // =============================================
            
            const dx = e.objetivoX - e.x;
            const dy = e.objetivoY - e.y;
            const distancia = Math.sqrt(dx*dx + dy*dy);
            
            if (distancia < 2) {
                e.x = e.objetivoX;
                e.y = e.objetivoY;
                e.estado = 'formacion';
            } else {
                const vectorNormalizado = {
                    dx: dx / distancia,
                    dy: dy / distancia
                };
                const nuevaPos = aplicarTraslacion(e, vectorNormalizado.dx * e.velocidad, vectorNormalizado.dy * e.velocidad);
                e.x = nuevaPos.x;
                e.y = nuevaPos.y;
            }
        }
    });

    // =============================================
    // TRASLACIÓN DEL JEFE USANDO P' = P + T
    // =============================================
    
    if (jefe) {
        if (jefe.estado === 'entrando') {
            // Traslación vertical hacia posición objetivo
            const vectorEntrada = { dx: 0, dy: 1 }; // T = (0, 1)
            const nuevaPos = aplicarTraslacion(jefe, vectorEntrada.dx, vectorEntrada.dy);
            jefe.y = nuevaPos.y;
            
            if (jefe.y >= jefe.objetivoY) {
                jefe.y = jefe.objetivoY;
                jefe.estado = 'formacion';
            }
        } else if (jefe.estado === 'formacion') {
            // Movimiento oscilatorio horizontal
            const oscilacion = Math.sin(tiempoJuego * 0.03) * 30;
            jefe.x = jefe.objetivoX + oscilacion;
            
            jefe.tiempoRecargaAtaque--;
            if (jefe.tiempoRecargaAtaque <= 0) {
                jefe.estado = 'prepararTractor';
                jefe.hazTractor.activo = false;
                jefe.hazTractor.alto = 0;
            }
        } else if (jefe.estado === 'prepararTractor') {
            // Traslación vertical hacia abajo
            const vectorDescenso = { dx: 0, dy: 0.5 }; // T = (0, 0.5)
            const nuevaPos = aplicarTraslacion(jefe, vectorDescenso.dx, vectorDescenso.dy);
            jefe.y = nuevaPos.y;
            
            if (jefe.y >= 150) {
                jefe.estado = 'ataqueTractor';
                jefe.hazTractor.activo = true;
                jefe.hazTractor.x = jefe.x + jefe.w/2 - jefe.hazTractor.ancho/2;
                jefe.hazTractor.y = jefe.y + jefe.h;
            }
        } else if (jefe.estado === 'ataqueTractor') {
            if (jefe.hazTractor.alto < ALTO - jefe.y - jefe.h) {
                jefe.hazTractor.alto += 3;
            }
            
            const derechaHaz = jefe.hazTractor.x + jefe.hazTractor.ancho;
            const fondoHaz = jefe.hazTractor.y + jefe.hazTractor.alto;
            
            if (jugador.x < derechaHaz && 
                jugador.x + jugador.w > jefe.hazTractor.x && 
                jugador.y < fondoHaz) {
                jefe.hazTractor.objetivoJugador = true;
                
                // =============================================
                // TRASLACIÓN DEL JUGADOR HACIA EL JEFE (HAZ TRACTOR)
                // =============================================
                
                const dx = (jefe.x + jefe.w/2) - (jugador.x + jugador.w/2);
                const dy = (jefe.y + jefe.h) - (jugador.y + jugador.h/2);
                
                const vectorAtraccion = {
                    dx: dx * 0.05,
                    dy: dy * 0.05
                };
                const nuevaPosJugador = aplicarTraslacion(jugador, vectorAtraccion.dx, vectorAtraccion.dy);
                jugador.x = nuevaPosJugador.x;
                jugador.y = nuevaPosJugador.y;
                
                if (Math.abs(dx) < 5 && Math.abs(dy) < 5) {
                    perderVida();
                    jefe.estado = 'regresando';
                    jefe.hazTractor.activo = false;
                    jefe.hazTractor.objetivoJugador = false;
                    jugador.x = ANCHO/2 - 20;
                    jugador.y = ALTO - 60;
                }
            }
            
            if (tiempoJuego % 400 === 0) {
                jefe.estado = 'regresando';
                jefe.hazTractor.activo = false;
                jefe.hazTractor.objetivoJugador = false;
                jugador.x = ANCHO/2 - 20;
                jugador.y = ALTO - 60;
            }
        } else if (jefe.estado === 'regresando') {
            // Traslación vertical hacia arriba
            const vectorRetorno = { dx: 0, dy: -1.5 }; // T = (0, -1.5)
            const nuevaPos = aplicarTraslacion(jefe, vectorRetorno.dx, vectorRetorno.dy);
            jefe.y = nuevaPos.y;
            
            if (jefe.y <= jefe.objetivoY) {
                jefe.y = jefe.objetivoY;
                jefe.estado = 'formacion';
                jefe.tiempoRecargaAtaque = 300;
            }
        }
    }

    // Detección de colisiones
    balas.forEach((b, indiceBala) => {
        enemigos.forEach((e, indiceEnemigo) => {
            if (b.x < e.x + e.w && b.x + b.w > e.x && 
                b.y < e.y + e.h && b.y + b.h > e.y) {
                estadoJuego.puntuacion += 100;
                estadoJuego.enemigosDestruidos++;
                enemigos.splice(indiceEnemigo, 1);
                balas.splice(indiceBala, 1);
                actualizarUI();
            }
        });
        
        if (jefe && b.x < jefe.x + jefe.w && b.x + b.w > jefe.x && 
            b.y < jefe.y + jefe.h && b.y + b.h > jefe.y) {
            jefe.salud--;
            balas.splice(indiceBala, 1);
            
            if (jefe.salud <= 0) {
                estadoJuego.puntuacion += 500;
                jefe = null;
                actualizarUI();
            }
        }
    });

    // Comprobar si se completó el nivel
    if (enemigos.length === 0 && jefe === null) {
        estadoJuego.nivel++;
        actualizarUI();
        generarEnemigos();
    }
}

// Dibujar juego
function dibujar() {
    // Fondo
    contexto.fillStyle = "#000";
    contexto.fillRect(0, 0, ANCHO, ALTO);
    
    // Estrellas de fondo
    contexto.fillStyle = "white";
    for (let i = 0; i < 50; i++) {
        const x = (i * 31) % ANCHO;
        const y = (i * 17) % ALTO;
        const tamaño = (i % 3) + 1;
        contexto.fillRect(x, y, tamaño, tamaño);
    }

    // Dibujar nave del jugador
    if (jugador.invulnerable <= 0 || jugador.parpadeo < 5) {
        // Nave con efecto neón
        contexto.fillStyle = "#00ffff";
        contexto.shadowBlur = 15;
        contexto.shadowColor = "#00ffff";
        contexto.fillRect(jugador.x, jugador.y, jugador.w, jugador.h);
        contexto.shadowBlur = 0;
        
        // Detalles de la nave
        contexto.fillStyle = "white";
        contexto.fillRect(jugador.x + 15, jugador.y, 10, 10);
        contexto.fillRect(jugador.x + 5, jugador.y + 15, 30, 10);
    }

    // Dibujar disparos
    contexto.fillStyle = "yellow";
    balas.forEach(b => {
        contexto.fillRect(b.x, b.y, b.w, b.h);
        // Efecto de luz
        contexto.fillStyle = "rgba(255, 255, 200, 0.5)";
        contexto.fillRect(b.x - 1, b.y - 1, b.w + 2, b.h + 2);
        contexto.fillStyle = "yellow";
    });

    // Dibujar enemigos
    contexto.fillStyle = "red";
    enemigos.forEach(e => {
        contexto.fillRect(e.x, e.y, e.w, e.h);
        
        // Detalles según estado
        contexto.fillStyle = e.estado === 'picada' ? "#ff4444" : "darkred";
        contexto.fillRect(e.x + 5, e.y + 5, e.w - 10, e.h - 10);
        contexto.fillStyle = "red";
    });

    // Dibujar jefe
    if (jefe) {
        contexto.fillStyle = "magenta";
        contexto.shadowBlur = 20;
        contexto.shadowColor = "magenta";
        contexto.fillRect(jefe.x, jefe.y, jefe.w, jefe.h);
        contexto.shadowBlur = 0;
        
        // Detalles del jefe
        contexto.fillStyle = "purple";
        contexto.fillRect(jefe.x + 10, jefe.y + 10, jefe.w - 20, jefe.h - 20);
        
        // Barra de salud
        const anchoSalud = (jefe.w * jefe.salud) / jefe.saludMaxima;
        contexto.fillStyle = "red";
        contexto.fillRect(jefe.x, jefe.y - 10, jefe.w, 5);
        contexto.fillStyle = "green";
        contexto.fillRect(jefe.x, jefe.y - 10, anchoSalud, 5);
        
        // Dibujar haz tractor
        if (jefe.hazTractor.activo) {
            const gradiente = contexto.createLinearGradient(
                jefe.hazTractor.x, jefe.hazTractor.y, 
                jefe.hazTractor.x, jefe.hazTractor.y + jefe.hazTractor.alto
            );
            gradiente.addColorStop(0, "rgba(0, 255, 255, 0.8)");
            gradiente.addColorStop(1, "rgba(0, 100, 255, 0.3)");
            
            contexto.fillStyle = gradiente;
            contexto.fillRect(
                jefe.hazTractor.x, 
                jefe.hazTractor.y, 
                jefe.hazTractor.ancho, 
                jefe.hazTractor.alto
            );
            
            // Efecto de partículas
            if (jefe.hazTractor.objetivoJugador) {
                contexto.fillStyle = "rgba(255, 255, 255, 0.7)";
                for (let i = 0; i < 5; i++) {
                    const desplazamientoX = Math.sin(tiempoJuego * 0.1 + i) * 5;
                    const posY = jefe.hazTractor.y + (tiempoJuego + i * 20) % jefe.hazTractor.alto;
                    contexto.fillRect(
                        jefe.hazTractor.x + jefe.hazTractor.ancho/2 - 1 + desplazamientoX, 
                        posY, 
                        2, 
                        2
                    );
                }
            }
        }
    }
    
    // Dibujar game over
    if (estadoJuego.juegoTerminado) {
        contexto.fillStyle = "rgba(0, 0, 0, 0.7)";
        contexto.fillRect(0, 0, ANCHO, ALTO);
        
        contexto.fillStyle = "red";
        contexto.font = "28px Arial";
        contexto.textAlign = "center";
        contexto.fillText("GAME OVER", ANCHO/2, ALTO/2 - 20);
        
        contexto.fillStyle = "white";
        contexto.font = "18px Arial";
        contexto.fillText(`Puntuación: ${estadoJuego.puntuacion}`, ANCHO/2, ALTO/2 + 20);
        contexto.fillText("Presiona 'Jugar de Nuevo' para continuar", ANCHO/2, ALTO/2 + 50);
    }
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
function perderVida() {
    if (jugador.invulnerable > 0) return;
    
    estadoJuego.vidas--;
    actualizarUI();
    
    if (estadoJuego.vidas <= 0) {
        juegoTerminado();
    } else {
        jugador.invulnerable = 180;
        jugador.x = ANCHO/2 - 20;
        jugador.y = ALTO - 60;
        
        if (jefe && jefe.hazTractor) {
            jefe.hazTractor.activo = false;
            jefe.hazTractor.objetivoJugador = false;
        }
    }
}

function actualizarUI() {
    document.getElementById("vidas").textContent = estadoJuego.vidas;
    document.getElementById("puntuacion").textContent = estadoJuego.puntuacion;
    document.getElementById("nivel").textContent = estadoJuego.nivel;
    document.getElementById("contadorEnemigos").textContent = enemigos.length;
    document.getElementById("estadoJefe").textContent = jefe ? "Sí" : "No";
    document.getElementById("puntuacionMaxima").textContent = estadoJuego.puntuacionMaxima;
}

function actualizarPuntuacionMaxima() {
    if (estadoJuego.puntuacion > estadoJuego.puntuacionMaxima) {
        estadoJuego.puntuacionMaxima = estadoJuego.puntuacion;
        localStorage.setItem('galagaHighScore', estadoJuego.puntuacionMaxima);
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
    document.getElementById("pantallaPausa").style.display = "none";
    comenzarJuego();
}

// Game over
function juegoTerminado() {
    juegoActivo = false;
    actualizarPuntuacionMaxima();
    
    const pantallaGameOver = document.getElementById("pantallaGameOver");
    const puntuacionFinal = document.getElementById("puntuacionFinal");
    const nivelFinal = document.getElementById("nivelFinal");
    const enemigosFinales = document.getElementById("enemigosFinales");
    
    puntuacionFinal.textContent = estadoJuego.puntuacion;
    nivelFinal.textContent = estadoJuego.nivel;
    enemigosFinales.textContent = estadoJuego.enemigosDestruidos;
    
    setTimeout(() => {
        pantallaGameOver.style.display = "flex";
    }, 500);
}