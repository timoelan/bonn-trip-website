// Global state
let events = [];
let currentDay = 1;

// Start app when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}

function init() {
  console.log('App starting...');
  updateClock();
  setInterval(updateClock, 1000);
  loadEvents();
}

// Load events from JSON
function loadEvents() {
  fetch('events.json')
    .then(res => res.json())
    .then(data => {
      events = data.events || [];
      console.log('Loaded', events.length, 'events');
      renderDay(currentDay);
      startCountdown();
    })
    .catch(err => {
      console.error('Error loading events:', err);
      document.getElementById('timeline').innerHTML = 
        '<div class="loading" style="color:#ef4444;">Fehler beim Laden der Events</div>';
    });
}

// Update clock
function updateClock() {
  const now = new Date();
  const opts = { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  };
  document.getElementById('currentTime').textContent = now.toLocaleDateString('de-DE', opts);
}

// Switch day tab
function switchDay(day) {
  currentDay = day;
  document.querySelectorAll('.tab-btn').forEach((btn, i) => {
    btn.classList.toggle('active', i + 1 === day);
  });
  renderDay(day);
}

// Render events for day
function renderDay(day) {
  const timeline = document.getElementById('timeline');
  const dayEvents = events.filter(e => e.day === day);
  
  if (dayEvents.length === 0) {
    timeline.innerHTML = '<div class="loading">Keine Events für diesen Tag</div>';
    return;
  }
  
  timeline.innerHTML = dayEvents.map(e => createEventHTML(e)).join('');
}

// Create event HTML
function createEventHTML(e) {
  const isPast = isPastEvent(e);
  const isImportant = e.isImportant || false;
  
  return `
    <div class="event ${isPast ? 'past' : ''} ${isImportant ? 'important' : ''}">
      <div class="event-time">
        <div class="time-tag">${e.time}</div>
      </div>
      <div class="event-card">
        <div class="event-header">
          <h3 class="event-title">${e.title}</h3>
        </div>
        <div class="event-location">${e.location}</div>
        <div class="event-desc">${e.description}</div>
        ${e.duration || e.mapsLink ? `
          <div class="event-meta">
            ${e.duration ? `<span class="meta-tag">Dauer: ${e.duration}</span>` : ''}
            ${e.mapsLink ? `<a href="${e.mapsLink}" target="_blank" class="map-link meta-tag">Karte öffnen</a>` : ''}
          </div>
        ` : ''}
      </div>
    </div>
  `;
}

// Get icon for event type
function getIcon(type) {
  const icons = {
    travel: '🚂',
    arrival: '🎉',
    transfer: '🚊',
    accommodation: '🏠',
    preparation: '👔',
    food: '🍽️',
    free: '⭐',
    activity: '🎨',
    meeting: '👥'
  };
  return icons[type] || '📌';
}

// Check if event is past
function isPastEvent(event) {
  const now = new Date();
  const eventTime = new Date(`${event.date}T${event.time}:00`);
  return now > eventTime;
}

// Countdown timer
function startCountdown() {
  const countdownEvents = events.filter(e => e.isCountdown);
  if (countdownEvents.length === 0) {
    document.getElementById('countdown').classList.add('hidden');
    return;
  }
  
  let currentIndex = 0;
  
  function update() {
    if (currentIndex >= countdownEvents.length) {
      document.getElementById('countdown').classList.add('hidden');
      return;
    }
    
    const target = countdownEvents[currentIndex];
    const targetTime = new Date(`${target.date}T${target.time}:00`);
    const now = new Date();
    const diff = targetTime - now;
    
    if (diff <= 0) {
      currentIndex++;
      return update();
    }
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);
    
    document.getElementById('days').textContent = pad(days);
    document.getElementById('hours').textContent = pad(hours);
    document.getElementById('minutes').textContent = pad(minutes);
    document.getElementById('seconds').textContent = pad(seconds);
    document.getElementById('countdownInfo').textContent = `${target.title} - ${target.location}`;
  }
  
  update();
  setInterval(update, 1000);
}

function pad(n) {
  return String(n).padStart(2, '0');
}
