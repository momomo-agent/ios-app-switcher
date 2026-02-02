// App data
const apps = [
  { name: 'Safari', icon: '🧭', color: '#007AFF', content: 'Web browsing...' },
  { name: 'Messages', icon: '💬', color: '#34C759', content: 'Recent chats...' },
  { name: 'Photos', icon: '🌸', color: '#FF9500', content: 'Your memories...' },
  { name: 'Music', icon: '🎵', color: '#FF2D55', content: 'Now playing...' },
  { name: 'Notes', icon: '📝', color: '#FFCC00', content: 'Quick notes...' },
  { name: 'Maps', icon: '🗺️', color: '#5856D6', content: 'Navigation...' },
];

const container = document.getElementById('cardsContainer');
let currentIndex = 0;
let startX = 0;
let currentX = 0;
let isDragging = false;

// Create app cards
function createCards() {
  apps.forEach((app, index) => {
    const card = document.createElement('div');
    card.className = 'app-card';
    card.dataset.index = index;
    card.innerHTML = `
      <div class="app-card-header">
        <div class="app-icon" style="background:${app.color}">${app.icon}</div>
        <span class="app-name">${app.name}</span>
      </div>
      <div class="app-card-content">${app.content}</div>
    `;
    container.appendChild(card);
  });
  updateCards();
}

// Update card positions and transforms
function updateCards() {
  const cards = container.querySelectorAll('.app-card');
  cards.forEach((card, i) => {
    const offset = i - currentIndex;
    const scale = 1 - Math.abs(offset) * 0.08;
    const translateZ = -Math.abs(offset) * 50;
    card.style.transform = `scale(${scale}) translateZ(${translateZ}px)`;
    card.style.opacity = 1 - Math.abs(offset) * 0.2;
  });
}

// Swipe handling
function handleStart(e) {
  isDragging = true;
  startX = e.type.includes('mouse') ? e.clientX : e.touches[0].clientX;
  container.style.transition = 'none';
}

function handleMove(e) {
  if (!isDragging) return;
  currentX = e.type.includes('mouse') ? e.clientX : e.touches[0].clientX;
  const diff = currentX - startX;
  const baseOffset = -currentIndex * 300;
  container.style.transform = `translateX(${baseOffset + diff}px)`;
}

function handleEnd() {
  if (!isDragging) return;
  isDragging = false;
  const diff = currentX - startX;
  
  if (Math.abs(diff) > 80) {
    if (diff < 0 && currentIndex < apps.length - 1) {
      currentIndex++;
    } else if (diff > 0 && currentIndex > 0) {
      currentIndex--;
    }
  }
  
  container.style.transition = 'transform 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94)';
  container.style.transform = `translateX(${-currentIndex * 300}px)`;
  updateCards();
}

// Close card on swipe up
let cardStartY = 0;
let cardCurrentY = 0;
let activeCard = null;

function handleCardStart(e) {
  activeCard = e.target.closest('.app-card');
  if (!activeCard) return;
  cardStartY = e.type.includes('mouse') ? e.clientY : e.touches[0].clientY;
}

function handleCardMove(e) {
  if (!activeCard) return;
  cardCurrentY = e.type.includes('mouse') ? e.clientY : e.touches[0].clientY;
  const diffY = cardCurrentY - cardStartY;
  if (diffY < 0) {
    activeCard.style.transform += ` translateY(${diffY}px)`;
  }
}

function handleCardEnd() {
  if (!activeCard) return;
  const diffY = cardCurrentY - cardStartY;
  if (diffY < -100) {
    closeCard(activeCard);
  } else {
    updateCards();
  }
  activeCard = null;
}

function closeCard(card) {
  card.classList.add('closing');
  setTimeout(() => {
    const index = parseInt(card.dataset.index);
    card.remove();
    apps.splice(index, 1);
    if (currentIndex >= apps.length) {
      currentIndex = Math.max(0, apps.length - 1);
    }
    container.querySelectorAll('.app-card').forEach((c, i) => {
      c.dataset.index = i;
    });
    container.style.transform = `translateX(${-currentIndex * 300}px)`;
    updateCards();
  }, 400);
}

// Event listeners
container.addEventListener('mousedown', handleStart);
container.addEventListener('mousemove', handleMove);
container.addEventListener('mouseup', handleEnd);
container.addEventListener('mouseleave', handleEnd);

container.addEventListener('touchstart', handleStart);
container.addEventListener('touchmove', handleMove);
container.addEventListener('touchend', handleEnd);

// Init
createCards();
