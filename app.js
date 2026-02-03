// 应用数据
const apps = [
  { id: 1, name: 'Safari', icon: '🧭', color: '#007AFF', content: 'Web browsing experience' },
  { id: 2, name: 'Messages', icon: '💬', color: '#34C759', content: 'Recent conversations' },
  { id: 3, name: 'Photos', icon: '🌸', color: '#FF9500', content: 'Your photo library' },
  { id: 4, name: 'Music', icon: '🎵', color: '#FF2D55', content: 'Now playing...' },
  { id: 5, name: 'Notes', icon: '📝', color: '#FFCC00', content: 'Quick notes' },
  { id: 6, name: 'Maps', icon: '🗺️', color: '#5856D6', content: 'Navigation' },
  { id: 7, name: 'Calendar', icon: '📅', color: '#FF3B30', content: 'Your schedule' },
  { id: 8, name: 'Settings', icon: '⚙️', color: '#8E8E93', content: 'System settings' },
];

// 最近使用的应用（堆叠显示）
let recentApps = [apps[0], apps[1], apps[2], apps[3]];
let currentAppIndex = 0;

// 状态: 'home' | 'switcher' | 'app'
let currentState = 'home';
let currentApp = null;

// DOM 元素
const screen = document.getElementById('screen');
const homeScreen = document.getElementById('homeScreen');
const switcherView = document.getElementById('switcherView');
const appView = document.getElementById('appView');
const appGrid = document.getElementById('appGrid');
const dock = document.getElementById('dock');
const cardsStack = document.getElementById('cardsStack');
const appContent = document.getElementById('appContent');
const homeIndicator = document.getElementById('homeIndicator');

// 初始化桌面图标
function initHomeScreen() {
  // 主屏幕图标
  apps.slice(0, 8).forEach(app => {
    const wrapper = document.createElement('div');
    wrapper.className = 'app-icon-wrapper';
    wrapper.innerHTML = `
      <div class="grid-icon" style="background:${app.color}">${app.icon}</div>
      <span class="icon-label">${app.name}</span>
    `;
    wrapper.addEventListener('click', () => openApp(app));
    appGrid.appendChild(wrapper);
  });
  
  // Dock 图标
  apps.slice(0, 4).forEach(app => {
    const icon = document.createElement('div');
    icon.className = 'grid-icon';
    icon.style.background = app.color;
    icon.textContent = app.icon;
    icon.addEventListener('click', () => openApp(app));
    dock.appendChild(icon);
  });
}

// 渲染任务切换器的堆叠卡片
function renderSwitcherCards() {
  cardsStack.innerHTML = '';
  recentApps.forEach((app, i) => {
    const card = createStackCard(app, i);
    cardsStack.appendChild(card);
  });
  updateStackPositions();
}

// 创建堆叠卡片
function createStackCard(app, index) {
  const card = document.createElement('div');
  card.className = 'stack-card';
  card.dataset.index = index;
  card.innerHTML = `
    <div class="card-header">
      <div class="card-icon" style="background:${app.color}">${app.icon}</div>
      <span class="card-name">${app.name}</span>
    </div>
    <div class="card-content">${app.content}</div>
  `;
  
  // 点击打开应用
  card.addEventListener('click', (e) => {
    if (!card.classList.contains('closing')) {
      openApp(app);
    }
  });
  
  return card;
}

// 更新堆叠卡片位置
function updateStackPositions() {
  const cards = cardsStack.querySelectorAll('.stack-card');
  cards.forEach((card, i) => {
    const offset = i - currentAppIndex;
    const x = offset * 200;
    const z = -Math.abs(offset) * 80;
    const rotateY = offset * -15;
    const scale = 1 - Math.abs(offset) * 0.1;
    const opacity = 1 - Math.abs(offset) * 0.3;
    
    card.style.transform = `translateX(${x}px) translateZ(${z}px) rotateY(${rotateY}deg) scale(${scale})`;
    card.style.opacity = Math.max(0.3, opacity);
    card.style.zIndex = 10 - Math.abs(offset);
  });
}

// 状态切换函数
function goToHome() {
  currentState = 'home';
  homeScreen.classList.remove('hidden', 'scaled');
  switcherView.classList.remove('active');
  appView.classList.remove('active', 'scaled');
  currentApp = null;
}

function goToSwitcher() {
  currentState = 'switcher';
  homeScreen.classList.add('scaled');
  switcherView.classList.add('active');
  appView.classList.remove('active');
  appView.classList.add('scaled');
  renderSwitcherCards();
}

function openApp(app) {
  currentState = 'app';
  currentApp = app;
  
  // 添加到最近应用
  recentApps = recentApps.filter(a => a.id !== app.id);
  recentApps.unshift(app);
  if (recentApps.length > 6) recentApps.pop();
  currentAppIndex = 0;
  
  homeScreen.classList.add('hidden');
  switcherView.classList.remove('active');
  appView.classList.add('active');
  appView.classList.remove('scaled');
  
  appContent.innerHTML = `
    <div class="app-header">
      <span style="font-size:36px">${app.icon}</span>
      ${app.name}
    </div>
    <div class="app-body">${app.content}</div>
  `;
}

// 关闭应用
function closeApp(index) {
  const card = cardsStack.querySelector(`[data-index="${index}"]`);
  if (!card) return;
  
  card.classList.add('closing');
  setTimeout(() => {
    recentApps.splice(index, 1);
    if (currentAppIndex >= recentApps.length) {
      currentAppIndex = Math.max(0, recentApps.length - 1);
    }
    if (recentApps.length === 0) {
      goToHome();
    } else {
      renderSwitcherCards();
    }
  }, 400);
}

// 手势状态
let gesture = {
  startX: 0, startY: 0,
  currentX: 0, currentY: 0,
  isDragging: false,
  target: null,
  type: null // 'swipe-up' | 'swipe-horizontal' | 'card-close'
};

function getPos(e) {
  const touch = e.touches ? e.touches[0] : e;
  return { x: touch.clientX, y: touch.clientY };
}

function handleStart(e) {
  const pos = getPos(e);
  gesture.startX = pos.x;
  gesture.startY = pos.y;
  gesture.isDragging = true;
  gesture.type = null;
  gesture.target = e.target.closest('.stack-card');
}

function handleMove(e) {
  if (!gesture.isDragging) return;
  const pos = getPos(e);
  gesture.currentX = pos.x;
  gesture.currentY = pos.y;
  
  const dx = gesture.currentX - gesture.startX;
  const dy = gesture.currentY - gesture.startY;
  
  // 判断手势类型
  if (!gesture.type && (Math.abs(dx) > 10 || Math.abs(dy) > 10)) {
    if (Math.abs(dy) > Math.abs(dx) && dy < 0) {
      gesture.type = gesture.target ? 'card-close' : 'swipe-up';
    } else if (Math.abs(dx) > Math.abs(dy)) {
      gesture.type = 'swipe-horizontal';
    }
  }
  
  // 应用手势效果
  if (gesture.type === 'card-close' && gesture.target) {
    gesture.target.style.transform += ` translateY(${dy}px)`;
    gesture.target.style.opacity = 1 + dy / 200;
  }
}

function handleEnd(e) {
  if (!gesture.isDragging) return;
  gesture.isDragging = false;
  
  const dx = gesture.currentX - gesture.startX;
  const dy = gesture.currentY - gesture.startY;
  
  if (gesture.type === 'card-close' && dy < -100) {
    const idx = parseInt(gesture.target.dataset.index);
    closeApp(idx);
  } else if (gesture.type === 'swipe-horizontal') {
    if (dx < -60 && currentAppIndex < recentApps.length - 1) {
      currentAppIndex++;
    } else if (dx > 60 && currentAppIndex > 0) {
      currentAppIndex--;
    }
    updateStackPositions();
  } else if (gesture.type === 'swipe-up') {
    handleSwipeUp(dy);
  }
  
  if (gesture.target) {
    updateStackPositions();
  }
  gesture.target = null;
}

function handleSwipeUp(dy) {
  if (dy > -50) return;
  
  if (currentState === 'app') {
    if (dy < -150) {
      goToHome();
    } else {
      goToSwitcher();
    }
  } else if (currentState === 'switcher') {
    goToHome();
  }
}

// Home indicator 手势
homeIndicator.addEventListener('mousedown', handleStart);
homeIndicator.addEventListener('touchstart', handleStart);

// 全局手势
screen.addEventListener('mousemove', handleMove);
screen.addEventListener('touchmove', handleMove);
screen.addEventListener('mouseup', handleEnd);
screen.addEventListener('touchend', handleEnd);
screen.addEventListener('mouseleave', handleEnd);

// Switcher 手势
switcherView.addEventListener('mousedown', handleStart);
switcherView.addEventListener('touchstart', handleStart);

// 初始化
initHomeScreen();
