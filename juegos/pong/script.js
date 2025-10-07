document.addEventListener('DOMContentLoaded', function() {
    crearParticulas();
    inicializarJuego();
});

function aplicarTraslacion(objeto, dx, dy) {    
    return {
        x: objeto.x + dx,
        y: objeto.y + dy
    };
}

function aplicarTraslacionConLimites(objeto, dx, dy, minY, maxY) {
    const nuevaPos = aplicarTraslacion(objeto, dx, dy);
    nuevaPos.y = Math.max(minY, Math.min(maxY, nuevaPos.y));
    return nuevaPos;
}

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
        
        const tamaño = 1 + Math.random() * 3;
        particula.style.width = `${tamaño}px`;
        particula.style.height = `${tamaño}px`;
        
        contenedorParticulas.appendChild(particula);
    }
}

const lienzo = document.getElementById("lienzoJuego");
const contexto = lienzo.getContext("2d");

const ANCHO = lienzo.width;
const ALTO = lienzo.height;

const ALTURA_PALETA = 80;
const ANCHO_PALETA = 12;
const RADIO_PELOTA = 8;
const VELOCIDAD_INICIAL_PELOTA = 4;

const paletaIzquierda = { 
    x: 30, 
    y: ALTO/2 - ALTURA_PALETA/2, 
    w: ANCHO_PALETA, 
    h: ALTURA_PALETA, 
    velocidad: 6,
    color: '#00ffff'
};

const paletaDerecha = { 
    x: ANCHO - 30 - ANCHO_PALETA, 
    y: ALTO/2 - ALTURA_PALETA/2, 
    w: ANCHO_PALETA, 
    h: ALTURA_PALETA, 
    velocidad: 6,
    color: '#ff00ff'
};

const pelota = { 
    x: ANCHO/2, 
    y: ALTO/2, 
    r: RADIO_PELOTA, 
    dx: VELOCIDAD_INICIAL_PELOTA, 
    dy: VELOCIDAD_INICIAL_PELOTA * (Math.random() > 0.5 ? 1 : -1),
    color: '#39ff14'
};

let puntuacionIzquierda = 0;
let puntuacionDerecha = 0;
let multiplicadorVelocidad = 1.0;
let dificultadActual = 'NORMAL';
let juegoActivo = true;

const particulas = [];
const MAX_PARTICULAS = 50;

const coloresDificultad = {
    'NORMAL': { bg: '#111127', particle: '#333366', accent: '#00ffff' },
    'MEDIO': { bg: '#1a1a2e', particle: '#4a4a8a', accent: '#ff00ff' },
    'DIFÍCIL': { bg: '#2d1b2b', particle: '#8a4a7a', accent: '#39ff14' },
    'EXTREMO': { bg: '#3a1c1c', particle: '#ff5555', accent: '#ffff00' }
};

let teclas = {};
document.addEventListener("keydown", e => {
    if (['ArrowUp', 'ArrowDown', 'w', 'W', 's', 'S'].includes(e.key)) {
        e.preventDefault();
    }
    teclas[e.key] = true;
});
document.addEventListener("keyup", e => teclas[e.key] = false);

function inicializarParticulas() {
    particulas.length = 0;
    const cantidad = dificultadActual === 'NORMAL' ? 15 : 
                  dificultadActual === 'MEDIO' ? 25 :
                  dificultadActual === 'DIFÍCIL' ? 35 : 50;
    
    for (let i = 0; i < cantidad; i++) {
        particulas.push({
            x: Math.random() * ANCHO,
            y: Math.random() * ALTO,
            tamaño: Math.random() * 2 + 1,
            velocidad: Math.random() * 1.5 + 0.5,
            opacidad: Math.random() * 0.3 + 0.1,
            color: coloresDificultad[dificultadActual].particle
        });
    }
}

function inicializarJuego() {
    reiniciarPelota();
    inicializarParticulas();
    actualizarUI();
    const botonInicio = document.getElementById("botonInicio");
    const pantallaInicio = document.getElementById("pantallaInicio");
    pantallaInicio.style.display = "flex";
    botonInicio.addEventListener("click", function() {
        pantallaInicio.style.display = "none";
        juegoActivo = true;
        bucleJuego();
    });
}

function actualizarUI() {
    document.getElementById("puntuacionIzquierda").textContent = puntuacionIzquierda;
    document.getElementById("puntuacionDerecha").textContent = puntuacionDerecha;
    document.getElementById("valorVelocidad").textContent = multiplicadorVelocidad.toFixed(2) + 'x';
    document.getElementById("valorDificultad").textContent = dificultadActual;
}

function bucleJuego() {
    if (juegoActivo) {
        actualizar();
        dibujar();
        requestAnimationFrame(bucleJuego);
    }
}

//Funciones de actualización y dibujo
function actualizar() {
    if (teclas["w"] || teclas["W"]) {
        const nuevaPos = aplicarTraslacionConLimites(
            paletaIzquierda, 
            0, 
            -paletaIzquierda.velocidad,
            0,
            ALTO - paletaIzquierda.h
        );
        paletaIzquierda.y = nuevaPos.y;
    }
    if (teclas["s"] || teclas["S"]) {
        const nuevaPos = aplicarTraslacionConLimites(
            paletaIzquierda, 
            0, 
            paletaIzquierda.velocidad,
            0, 
            ALTO - paletaIzquierda.h
        );
        paletaIzquierda.y = nuevaPos.y;
    }

    if (teclas["ArrowUp"]) {
        const nuevaPos = aplicarTraslacionConLimites(
            paletaDerecha, 
            0, 
            -paletaDerecha.velocidad,
            0, 
            ALTO - paletaDerecha.h
        );
        paletaDerecha.y = nuevaPos.y;
    }
    if (teclas["ArrowDown"]) {
        const nuevaPos = aplicarTraslacionConLimites(
            paletaDerecha, 
            0, 
            paletaDerecha.velocidad,
            0, 
            ALTO - paletaDerecha.h
        );
        paletaDerecha.y = nuevaPos.y;
    }

    const vectorTraslacion = {
        dx: pelota.dx * multiplicadorVelocidad,
        dy: pelota.dy * multiplicadorVelocidad
    };
    
    // Movimiento de la pelota

    const nuevaPosPelota = aplicarTraslacion(pelota, vectorTraslacion.dx, vectorTraslacion.dy);
    pelota.x = nuevaPosPelota.x;
    pelota.y = nuevaPosPelota.y;

    actualizarParticulas();
    actualizarDificultad();

    // Colisión con paredes superior e inferior

    if (pelota.y - pelota.r < 0 || pelota.y + pelota.r > ALTO) {
        pelota.dy *= -1;
        crearEfectoGolpe(pelota.x, pelota.y);
    }

    // Colisión con paleta izquierda

    if (pelota.x - pelota.r < paletaIzquierda.x + paletaIzquierda.w &&
        pelota.y > paletaIzquierda.y &&
        pelota.y < paletaIzquierda.y + paletaIzquierda.h) {
        
        pelota.dx = Math.abs(pelota.dx);
        pelota.x = paletaIzquierda.x + paletaIzquierda.w + pelota.r;
        aumentarVelocidad();
        crearEfectoGolpe(pelota.x, pelota.y);
        efectoFlashPaleta(paletaIzquierda);
    }

    // Colisión con paleta derecha

    if (pelota.x + pelota.r > paletaDerecha.x &&
        pelota.y > paletaDerecha.y &&
        pelota.y < paletaDerecha.y + paletaDerecha.h) {
        
        pelota.dx = -Math.abs(pelota.dx);
        pelota.x = paletaDerecha.x - pelota.r;
        aumentarVelocidad();
        crearEfectoGolpe(pelota.x, pelota.y);
        efectoFlashPaleta(paletaDerecha);
    }

    if (pelota.x < 0) {
        puntuacionDerecha++;
        mostrarMensajeVictoria("PUNTO PARA\nJUGADOR 2!", "#ff00ff");
        reiniciarPelota();
        verificarFinJuego();
    } else if (pelota.x > ANCHO) {
        puntuacionIzquierda++;
        mostrarMensajeVictoria("PUNTO PARA\nJUGADOR 1!", "#00ffff");
        reiniciarPelota();
        verificarFinJuego();
    }
}

function dibujar() {
    const colorFondo = coloresDificultad[dificultadActual].bg;
    contexto.fillStyle = colorFondo;
    contexto.fillRect(0, 0, ANCHO, ALTO);

    dibujarParticulas();

    contexto.setLineDash([10, 15]);
    contexto.beginPath();
    contexto.moveTo(ANCHO/2, 0);
    contexto.lineTo(ANCHO/2, ALTO);
    contexto.strokeStyle = "rgba(255,255,255,0.2)";
    contexto.lineWidth = 3;
    contexto.stroke();
    contexto.setLineDash([]);

    dibujarPaleta(paletaIzquierda);
    dibujarPaleta(paletaDerecha);

    dibujarPelota();

    dibujarEstelaVelocidad();
}

function dibujarPaleta(paleta) {
    contexto.fillStyle = paleta.color + '40';
    contexto.fillRect(paleta.x - 2, paleta.y - 2, paleta.w + 4, paleta.h + 4);
    
    contexto.fillStyle = paleta.color;
    contexto.fillRect(paleta.x, paleta.y, paleta.w, paleta.h);
    
    const gradiente = contexto.createLinearGradient(paleta.x, paleta.y, paleta.x + paleta.w, paleta.y);
    gradiente.addColorStop(0, paleta.color + '80');
    gradiente.addColorStop(1, paleta.color);
    contexto.fillStyle = gradiente;
    contexto.fillRect(paleta.x, paleta.y, paleta.w / 2, paleta.h);
}

function dibujarPelota() {
    const gradienteEstela = contexto.createRadialGradient(
        pelota.x, pelota.y, 0,
        pelota.x, pelota.y, pelota.r * 3
    );
    gradienteEstela.addColorStop(0, pelota.color + '80');
    gradienteEstela.addColorStop(1, pelota.color + '00');
    
    contexto.beginPath();
    contexto.arc(pelota.x, pelota.y, pelota.r * 3, 0, Math.PI * 2);
    contexto.fillStyle = gradienteEstela;
    contexto.fill();

    contexto.beginPath();
    contexto.arc(pelota.x, pelota.y, pelota.r, 0, Math.PI * 2);
    contexto.fillStyle = pelota.color;
    contexto.fill();

    contexto.beginPath();
    contexto.arc(pelota.x - pelota.r/3, pelota.y - pelota.r/3, pelota.r/3, 0, Math.PI * 2);
    contexto.fillStyle = '#ffffff80';
    contexto.fill();
}

function dibujarEstelaVelocidad() {
    if (multiplicadorVelocidad > 1.2) {
        for (let i = 0; i < 3; i++) {
            const estelaX = pelota.x - pelota.dx * i * 2;
            const estelaY = pelota.y - pelota.dy * i * 2;
            const opacidad = 0.3 - (i * 0.1);
            
            contexto.beginPath();
            contexto.arc(estelaX, estelaY, pelota.r * (1 - i * 0.2), 0, Math.PI * 2);
            contexto.fillStyle = pelota.color.replace(')', `,${opacidad})`).replace('rgb', 'rgba');
            contexto.fill();
        }
    }
}

function dibujarParticulas() {
    particulas.forEach(particula => {
        contexto.beginPath();
        contexto.arc(particula.x, particula.y, particula.tamaño, 0, Math.PI * 2);
        contexto.fillStyle = particula.color.replace(')', `,${particula.opacidad})`).replace('rgb', 'rgba');
        contexto.fill();
    });
}

function actualizarParticulas() {
    particulas.forEach(particula => {
        particula.y += particula.velocidad * (multiplicadorVelocidad * 0.3);
        if (particula.y > ALTO) {
            particula.y = 0;
            particula.x = Math.random() * ANCHO;
        }
        particula.opacidad = 0.1 + Math.sin(Date.now() * 0.001 + particula.x) * 0.2;
    });
}

function efectoFlashPaleta(paleta) {
    const colorOriginal = paleta.color;
    paleta.color = '#ffffff';
    setTimeout(() => {
        paleta.color = colorOriginal;
    }, 100);
}

function crearEfectoGolpe(x, y) {
    for (let i = 0; i < 5; i++) {
        particulas.push({
            x: x,
            y: y,
            tamaño: Math.random() * 3 + 1,
            velocidad: Math.random() * 3 - 1.5,
            opacidad: 1,
            color: pelota.color
        });
    }
}

function aumentarVelocidad() {
    multiplicadorVelocidad += 0.03;
    if (multiplicadorVelocidad > 2.5) {
        multiplicadorVelocidad = 2.5;
    }
}

function actualizarDificultad() {
    let nuevaDificultad;
    if (multiplicadorVelocidad < 1.3) {
        nuevaDificultad = 'NORMAL';
    } else if (multiplicadorVelocidad < 1.7) {
        nuevaDificultad = 'MEDIO';
    } else if (multiplicadorVelocidad < 2.1) {
        nuevaDificultad = 'DIFÍCIL';
    } else {
        nuevaDificultad = 'EXTREMO';
    }
    
    if (nuevaDificultad !== dificultadActual) {
        dificultadActual = nuevaDificultad;
        pelota.color = coloresDificultad[dificultadActual].accent;
        inicializarParticulas();
        actualizarUI();
    }
}

function mostrarMensajeVictoria(mensaje, color) {
    const mensajeVictoria = document.getElementById("mensajeVictoria");
    mensajeVictoria.textContent = mensaje;
    mensajeVictoria.style.color = color;
    mensajeVictoria.style.textShadow = `0 0 20px ${color}, 0 0 40px ${color}`;
    mensajeVictoria.classList.add("show");
    
    setTimeout(() => {
        mensajeVictoria.classList.remove("show");
    }, 1500);
}

function reiniciarPelota() {
    document.getElementById("pantallaGameOver").style.display = "none";
    pelota.x = ANCHO/2;
    pelota.y = ALTO/2;
    pelota.dx = VELOCIDAD_INICIAL_PELOTA * (Math.random() > 0.5 ? 1 : -1);
    pelota.dy = VELOCIDAD_INICIAL_PELOTA * (Math.random() > 0.5 ? 1 : -1);
    multiplicadorVelocidad = 1.0;
    dificultadActual = 'NORMAL';
    pelota.color = coloresDificultad[dificultadActual].accent;
    inicializarParticulas();
    actualizarUI();
}

function verificarFinJuego() {
    if (puntuacionIzquierda >= 5 || puntuacionDerecha >= 5) {
        juegoActivo = false;
        const ganador = puntuacionIzquierda >= 5 ? "JUGADOR 1" : "JUGADOR 2";
        const color = puntuacionIzquierda >= 5 ? "#00ffff" : "#ff00ff";
        
        setTimeout(() => {
            mostrarPantallaGameOver(ganador, color);
        }, 1000);
    }
}

function mostrarPantallaGameOver(ganador, color) {
    const pantallaGameOver = document.getElementById("pantallaGameOver");
    const textoGanador = document.getElementById("textoGanador");
    const botonJugarOtraVez = document.getElementById("botonJugarOtraVez");
    const botonMenuPrincipal = document.getElementById("botonMenuPrincipal");
    
    textoGanador.textContent = `¡${ganador} GANA!`;
    textoGanador.style.color = color;
    textoGanador.style.textShadow = `0 0 20px ${color}, 0 0 40px ${color}`;
    
    pantallaGameOver.style.display = "flex";
    
    botonJugarOtraVez.onclick = function() {
        puntuacionIzquierda = 0;
        puntuacionDerecha = 0;
        juegoActivo = true;
        pantallaGameOver.style.display = "none";
        reiniciarPelota();
        actualizarUI();
        bucleJuego();
    };
    
    botonMenuPrincipal.onclick = function() {
        window.location.href = "../../index.html";
    };
}