// Inicialización del juego
document.addEventListener('DOMContentLoaded', function() {
    crearParticulas();
    inicializarJuego();
});

// =============================================
// FUNCIONES CLAVE PARA TRASLACIÓN (AGREGAR ESTO)
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

function aplicarTraslacionConPantallaEnvolvente(objeto, dx, dy, anchoPantalla, altoPantalla) {
    let nuevaPos = aplicarTraslacion(objeto, dx, dy);
    
    // Pantalla envolvente
    if (nuevaPos.x < 0) nuevaPos.x = anchoPantalla;
    if (nuevaPos.x > anchoPantalla) nuevaPos.x = 0;
    if (nuevaPos.y < 0) nuevaPos.y = altoPantalla;
    if (nuevaPos.y > altoPantalla) nuevaPos.y = 0;
    
    return nuevaPos;
}

// Sistema de partículas
function crearParticulas() {
    const contenedorParticulas = document.getElementById('particles');
    const cantidadParticulas = 50;
    
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
    asteroidesDestruidos: 0,
    puntuacionMaxima: localStorage.getItem('asteroidsHighScore') || 0,
    juegoTerminado: false
};

// Elementos del juego
let nave, balas, asteroides;
let juegoActivo = false;
let juegoPausado = false;

// Control de teclado
const teclas = {};
document.addEventListener("keydown", e => {
    teclas[e.key] = true;
    if (e.key === ' ') e.preventDefault();
});
document.addEventListener("keyup", e => teclas[e.key] = false);

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

    actualizarPuntuacionMaxima();
}

// Iniciar juego
function comenzarJuego() {
    estadoJuego = {
        puntuacion: 0,
        nivel: 1,
        asteroidesDestruidos: 0,
        puntuacionMaxima: localStorage.getItem('asteroidsHighScore') || 0,
        juegoTerminado: false
    };
    
    nave = {
        x: lienzo.width / 2,
        y: lienzo.height / 2,
        angulo: 0,
        vx: 0,
        vy: 0,
        radio: 15,
        propulsor: false
    };
    
    balas = [];
    asteroides = [];
    
    juegoActivo = true;
    juegoPausado = false;
    
    generarAsteroides(6);
    actualizarUI();
    bucleJuego();
}

// Generar asteroides
function generarAsteroides(n) {
    for (let i = 0; i < n; i++) {
        let x, y;
        if (Math.random() < 0.5) {
            x = Math.random() * lienzo.width;
            y = Math.random() < 0.5 ? 0 : lienzo.height;
        } else {
            x = Math.random() < 0.5 ? 0 : lienzo.width;
            y = Math.random() * lienzo.height;
        }
        const angulo = Math.random() * Math.PI * 2;
        asteroides.push({
            x, y,
            radio: 40 + Math.random() * 20,
            vx: Math.cos(angulo) * (0.5 + Math.random() * 1.5),
            vy: Math.sin(angulo) * (0.5 + Math.random() * 1.5),
            vertices: generarVerticesAsteroide()
        });
    }
}

// Generar vértices para asteroides irregulares
function generarVerticesAsteroide() {
    const vertices = [];
    const numVertices = 8 + Math.floor(Math.random() * 4);
    
    for (let i = 0; i < numVertices; i++) {
        const angulo = (i / numVertices) * Math.PI * 2;
        const distancia = 0.7 + Math.random() * 0.3;
        vertices.push({
            angulo,
            distancia
        });
    }
    
    return vertices;
}

// Dibujar nave
function dibujarNave() {
    contexto.save();
    contexto.translate(nave.x, nave.y);
    contexto.rotate(nave.angulo);
    
    // Nave principal con efecto neón
    contexto.strokeStyle = "#00ffff";
    contexto.lineWidth = 2;
    contexto.shadowBlur = 15;
    contexto.shadowColor = "#00ffff";
    
    contexto.beginPath();
    contexto.moveTo(20, 0);
    contexto.lineTo(-15, 10);
    contexto.lineTo(-15, -10);
    contexto.closePath();
    contexto.stroke();
    
    // Efecto de propulsión
    if (nave.propulsor) {
        contexto.strokeStyle = "#ff5500";
        contexto.shadowBlur = 20;
        contexto.shadowColor = "#ff5500";
        
        contexto.beginPath();
        contexto.moveTo(-15, 8);
        contexto.lineTo(-25 - Math.random() * 10, 0);
        contexto.lineTo(-15, -8);
        contexto.stroke();
    }
    
    contexto.shadowBlur = 0;
    contexto.restore();
}

// Dibujar asteroides
function dibujarAsteroides() {
    asteroides.forEach(asteroide => {
        contexto.save();
        contexto.translate(asteroide.x, asteroide.y);
        
        // Asteroide con efecto neón
        contexto.strokeStyle = "#39ff14";
        contexto.lineWidth = 2;
        contexto.shadowBlur = 10;
        contexto.shadowColor = "#39ff14";
        
        contexto.beginPath();
        asteroide.vertices.forEach((vertice, indice) => {
            const x = Math.cos(vertice.angulo) * asteroide.radio * vertice.distancia;
            const y = Math.sin(vertice.angulo) * asteroide.radio * vertice.distancia;
            
            if (indice === 0) {
                contexto.moveTo(x, y);
            } else {
                contexto.lineTo(x, y);
            }
        });
        contexto.closePath();
        contexto.stroke();
        
        contexto.shadowBlur = 0;
        contexto.restore();
    });
}

// Dibujar balas
function dibujarBalas() {
    contexto.fillStyle = "#ffff00";
    contexto.shadowBlur = 8;
    contexto.shadowColor = "#ffff00";
    
    balas.forEach(bala => {
        contexto.beginPath();
        contexto.arc(bala.x, bala.y, 3, 0, Math.PI * 2);
        contexto.fill();
    });
    
    contexto.shadowBlur = 0;
}

// =============================================
// MOVER NAVE CON TRASLACIONES GEOMÉTRICAS
// =============================================
function moverNave() {
    if (teclas["ArrowLeft"]) nave.angulo -= 0.07;
    if (teclas["ArrowRight"]) nave.angulo += 0.07;
    
    nave.propulsor = false;
    if (teclas["ArrowUp"]) {
        // =============================================
        // TRASLACIÓN CON ACELERACIÓN: P' = P + (aceleración * cos(θ), aceleración * sin(θ))
        // =============================================
        const aceleracion = 0.1;
        const vectorAceleracion = {
            dx: Math.cos(nave.angulo) * aceleracion,
            dy: Math.sin(nave.angulo) * aceleracion
        };
        
        nave.vx += vectorAceleracion.dx;
        nave.vy += vectorAceleracion.dy;
        nave.propulsor = true;
    }

    // Aplicar fricción
    nave.vx *= 0.98;
    nave.vy *= 0.98;

    // =============================================
    // TRASLACIÓN CON PANTALLA ENVOLVENTE: P' = P + (vx, vy) con wraparound
    // =============================================
    const nuevaPos = aplicarTraslacionConPantallaEnvolvente(
        nave, 
        nave.vx, 
        nave.vy, 
        lienzo.width, 
        lienzo.height
    );
    nave.x = nuevaPos.x;
    nave.y = nuevaPos.y;
}

// =============================================
// MOVER ASTEROIDES CON TRASLACIONES GEOMÉTRICAS
// =============================================
function moverAsteroides() {
    asteroides.forEach(asteroide => {
        // =============================================
        // TRASLACIÓN LINEAL CON PANTALLA ENVOLVENTE
        // =============================================
        const nuevaPos = aplicarTraslacionConPantallaEnvolvente(
            asteroide,
            asteroide.vx,
            asteroide.vy,
            lienzo.width,
            lienzo.height
        );
        asteroide.x = nuevaPos.x;
        asteroide.y = nuevaPos.y;
    });
}

// =============================================
// MOVER BALAS CON TRASLACIONES GEOMÉTRICAS
// =============================================
function moverBalas() {
    balas.forEach(bala => {
        // =============================================
        // TRASLACIÓN LINEAL DE BALAS: P' = P + (vx, vy)
        // =============================================
        const nuevaPos = aplicarTraslacion(bala, bala.vx, bala.vy);
        bala.x = nuevaPos.x;
        bala.y = nuevaPos.y;
    });
    
    // Eliminar balas fuera de pantalla
    balas = balas.filter(bala =>
        bala.x >= 0 && bala.x <= lienzo.width && bala.y >= 0 && bala.y <= lienzo.height
    );
}

// =============================================
// DISPARAR CON TRASLACIÓN INICIAL
// =============================================
document.addEventListener("keydown", e => {
    if (e.code === "Space" && juegoActivo && !juegoPausado) {
        // =============================================
        // POSICIÓN INICIAL DE BALA: P' = P_nave + (20 * cos(θ), 20 * sin(θ))
        // =============================================
        const posicionInicial = aplicarTraslacionConAngulo(
            nave,
            20, // distancia desde la nave
            nave.angulo
        );
        
        balas.push({
            x: posicionInicial.x,
            y: posicionInicial.y,
            vx: Math.cos(nave.angulo) * 6,
            vy: Math.sin(nave.angulo) * 6
        });
    }
});

function dividirAsteroide(asteroide) {
    if (asteroide.radio > 15) {
        for (let i = 0; i < 2; i++) {
            const angulo = Math.random() * Math.PI * 2;
            const velocidadFragmento = 1.5 + Math.random();
            const fragmento = {
                x: asteroide.x,
                y: asteroide.y,
                radio: asteroide.radio / 2,
                vx: Math.cos(angulo) * velocidadFragmento,
                vy: Math.sin(angulo) * velocidadFragmento,
                vertices: generarVerticesAsteroide()
            };
            
            asteroides.push(fragmento);
        }
    }
}

// Detectar colisiones
function detectarColisiones() {
    // Balas -> Asteroides
    for (let ai = asteroides.length - 1; ai >= 0; ai--) {
        for (let bi = balas.length - 1; bi >= 0; bi--) {
            const asteroide = asteroides[ai];
            const bala = balas[bi];
            const dx = asteroide.x - bala.x;
            const dy = asteroide.y - bala.y;
            const distancia = Math.sqrt(dx * dx + dy * dy);
            
            if (distancia < asteroide.radio) {
                balas.splice(bi, 1);
                asteroides.splice(ai, 1);
                dividirAsteroide(asteroide);
                
                estadoJuego.puntuacion += 10;
                estadoJuego.asteroidesDestruidos++;
                actualizarUI();
                break;
            }
        }
    }

    // Nave -> Asteroides
    if (!estadoJuego.juegoTerminado) {
        asteroides.forEach(asteroide => {
            const dx = asteroide.x - nave.x;
            const dy = asteroide.y - nave.y;
            const distancia = Math.sqrt(dx * dx + dy * dy);
            
            if (distancia < asteroide.radio + nave.radio) {
                juegoTerminado();
            }
        });
    }
}

// Bucle principal del juego
function bucleJuego() {
    if (!juegoActivo) return;
    
    // Fondo del espacio
    contexto.fillStyle = "#000011";
    contexto.fillRect(0, 0, lienzo.width, lienzo.height);
    
    // Estrellas de fondo
    dibujarEstrellas();
    
    if (!juegoPausado && !estadoJuego.juegoTerminado) {
        moverNave();
        moverAsteroides();
        moverBalas();
        detectarColisiones();
        
        // Comprobar nivel completado
        if (asteroides.length === 0) {
            estadoJuego.nivel++;
            generarAsteroides(6 + estadoJuego.nivel);
            actualizarUI();
        }
    }
    
    dibujarAsteroides();
    dibujarBalas();
    dibujarNave();
    
    actualizarUI();
    requestAnimationFrame(bucleJuego);
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

// Actualizar interfaz
function actualizarUI() {
    document.getElementById("puntuacion").textContent = estadoJuego.puntuacion;
    document.getElementById("nivel").textContent = estadoJuego.nivel;
    document.getElementById("contadorAsteroides").textContent = asteroides.length;
    document.getElementById("contadorBalas").textContent = balas.length;
    document.getElementById("puntuacionMaxima").textContent = estadoJuego.puntuacionMaxima;
    
    // Calcular velocidad de la nave
    const velocidad = Math.sqrt(nave.vx * nave.vx + nave.vy * nave.vy).toFixed(1);
    document.getElementById("valorVelocidad").textContent = velocidad;
}

// Actualizar puntuación máxima
function actualizarPuntuacionMaxima() {
    if (estadoJuego.puntuacion > estadoJuego.puntuacionMaxima) {
        estadoJuego.puntuacionMaxima = estadoJuego.puntuacion;
        localStorage.setItem('asteroidsHighScore', estadoJuego.puntuacionMaxima);
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
    estadoJuego.juegoTerminado = true;
    juegoActivo = false;
    actualizarPuntuacionMaxima();
    
    const pantallaGameOver = document.getElementById("pantallaGameOver");
    const puntuacionFinal = document.getElementById("puntuacionFinal");
    const nivelFinal = document.getElementById("nivelFinal");
    const asteroidesFinales = document.getElementById("asteroidesFinales");
    
    puntuacionFinal.textContent = estadoJuego.puntuacion;
    nivelFinal.textContent = estadoJuego.nivel;
    asteroidesFinales.textContent = estadoJuego.asteroidesDestruidos;
    
    setTimeout(() => {
        pantallaGameOver.style.display = "flex";
    }, 500);
}