// Crear partículas
document.addEventListener('DOMContentLoaded', function() {
  createParticles();
  addGameCardListeners();
  initScrollEffects();
});

// Función para crear partículas flotantes
function createParticles() {
  const particlesContainer = document.getElementById('particles');
  const particleCount = 50;
  
  for (let i = 0; i < particleCount; i++) {
    const particle = document.createElement('div');
    particle.classList.add('particle');
    
    // Posición aleatoria
    const left = Math.random() * 100;
    const delay = Math.random() * 15;
    const duration = 10 + Math.random() * 10;
    
    particle.style.left = `${left}%`;
    particle.style.animationDelay = `${delay}s`;
    particle.style.animationDuration = `${duration}s`;
    
    // Color aleatorio
    const colors = [
      'var(--neon-pink)', 
      'var(--neon-blue)', 
      'var(--neon-green)', 
      'var(--neon-yellow)'
    ];
    const randomColor = colors[Math.floor(Math.random() * colors.length)];
    particle.style.backgroundColor = randomColor;
    
    // Tamaño aleatorio
    const size = 1 + Math.random() * 3;
    particle.style.width = `${size}px`;
    particle.style.height = `${size}px`;
    
    particlesContainer.appendChild(particle);
  }
}

// Función para agregar efectos interactivos a las tarjetas de juego
function addGameCardListeners() {
  const gameCards = document.querySelectorAll('.game-card');
  
  gameCards.forEach((card, index) => {
    card.addEventListener('mouseenter', function() {
      this.style.zIndex = '10';
    });
    
    card.addEventListener('mouseleave', function() {
      this.style.zIndex = '1';
    });
    
    // Efecto de sonido al hacer hover (simulado)
    card.addEventListener('mouseenter', function() {
      playHoverSound(index);
    });
  });
}

// Función para simular sonidos de hover
function playHoverSound(index) {
  // En una implementación real, aquí cargarías y reproducirías sonidos
  console.log(`Sonido hover para juego ${index + 1}`);
}

// Función para efectos de scroll
function initScrollEffects() {
  const navbar = document.querySelector('.navbar');
  const heroSection = document.querySelector('.hero-section');
  
  window.addEventListener('scroll', function() {
    const scrollPosition = window.scrollY;
    
    // Efecto de opacidad en el navbar
    if (scrollPosition > 100) {
      navbar.style.backgroundColor = 'rgba(5, 5, 16, 0.95)';
    } else {
      navbar.style.backgroundColor = 'var(--darker-bg)';
    }
    
    // Efecto parallax en el hero section
    if (heroSection) {
      const scrolled = window.pageYOffset;
      const parallaxSpeed = 0.5;
      heroSection.style.backgroundPositionY = `${scrolled * parallaxSpeed}px`;
    }
  });
}

// Función para animar botones al hacer clic
document.addEventListener('DOMContentLoaded', function() {
  const buttons = document.querySelectorAll('.btn-neon, .btn-game');
  
  buttons.forEach(button => {
    button.addEventListener('click', function(e) {
      // Crear efecto de onda
      const wave = document.createElement('span');
      const rect = this.getBoundingClientRect();
      const size = Math.max(rect.width, rect.height);
      const x = e.clientX - rect.left - size / 2;
      const y = e.clientY - rect.top - size / 2;
      
      wave.style.cssText = `
        position: absolute;
        width: ${size}px;
        height: ${size}px;
        background: rgba(255, 255, 255, 0.3);
        border-radius: 50%;
        left: ${x}px;
        top: ${y}px;
        transform: scale(0);
        animation: wave 0.6s linear;
        pointer-events: none;
      `;
      
      this.appendChild(wave);
      
      // Remover el elemento después de la animación
      setTimeout(() => {
        wave.remove();
      }, 600);
    });
  });
});

// Añadir keyframes para la onda dinámicamente
const style = document.createElement('style');
style.textContent = `
  @keyframes wave {
    to {
      transform: scale(2);
      opacity: 0;
    }
  }
`;
document.head.appendChild(style);

// Función para simular carga de juegos
function simulateGameLoad(gameName, gameUrl) {
  console.log(`Cargando juego: ${gameName}`);
  showLoadingScreen(gameName);
  
  // Después de 2 segundos, redirige a la URL del juego
  setTimeout(() => {
    window.location.href = gameUrl; // ← ESTA ES LA LÍNEA CLAVE
  }, 2000);
}

// Función para mostrar pantalla de carga
function showLoadingScreen(gameName) {
  const loadingScreen = document.createElement('div');
  loadingScreen.innerHTML = `
    <div style="
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: var(--darker-bg);
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      z-index: 9999;
      color: var(--neon-green);
      font-family: 'Courier New', monospace;
    ">
      <h2 style="text-shadow: 0 0 10px var(--neon-green); margin-bottom: 2rem;">CARGANDO ${gameName}</h2>
      <div style="
        width: 200px;
        height: 20px;
        border: 2px solid var(--neon-blue);
        background: transparent;
        position: relative;
        overflow: hidden;
      ">
        <div style="
          position: absolute;
          top: 0;
          left: 0;
          height: 100%;
          width: 0%;
          background: var(--neon-blue);
          animation: loading 2s infinite;
        "></div>
      </div>
    </div>
  `;
  
  document.body.appendChild(loadingScreen);
  
  // Simular tiempo de carga y luego remover
  setTimeout(() => {
    loadingScreen.remove();
    console.log(`Juego ${gameName} cargado`);
  }, 2000);
}

// Añadir event listeners a los botones de juego
document.addEventListener('DOMContentLoaded', function() {
  const gameButtons = document.querySelectorAll('.btn-game');
  
  gameButtons.forEach(button => {
  button.addEventListener('click', function(e) {
    e.preventDefault();
    const gameUrl = this.getAttribute('href'); // Obtiene la URL del enlace
    const gameName = this.closest('.game-card').querySelector('.card-title').textContent;
    simulateGameLoad(gameName, gameUrl);
  });
  });
});