// Load events from JSON
let eventsData = null;
let currentDay = 1;

// Initialize immediately
init();

function init() {
  console.log('Initializing...');
  
  // Wait for DOM
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', startApp);
  } else {
    startApp();
  }
}

function startApp() {
  console.log('Starting app...');
  
  // First update time
  updateCurrentTime();
  setInterval(updateCurrentTime, 1000);
  
  // Load events
  fetch('events.json')
    .then(response => {
      console.log('Response:', response.status);
      return response.json();
    })
    .then(data => {
      console.log('Data loaded:', data);
      eventsData = data;
      setupTabs();
      renderEvents(currentDay);
      startCountdown();
      setInterval(updateEventStatus, 60000);
    })
    .catch(error => {
      console.error('Error:', error);
      document.getElementById('timeline').innerHTML = `
        <div style="text-align:center;padding:40px;color:#ef4444;">
          <h2>❌ Fehler</h2>
          <p>${error.message}</p>
        </div>
      `;
    });
}

// Setup tab navigation
function setupTabs() {
  const tabs = document.querySelectorAll('.tab');
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      currentDay = parseInt(tab.dataset.day);
      renderEvents(currentDay);
    });
  });
}

// Render events for specific day
function renderEvents(day) {
  const timeline = document.getElementById('timeline');
  
  if (!eventsData || !eventsData.events) {
    console.error('No events data available');
    return;
  }
  
  const dayEvents = eventsData.events.filter(e => e.day === day);
  
  if (dayEvents.length === 0) {
    timeline.innerHTML = '<div style="text-align:center;padding:40px;color:#B0BEC5;">Keine Events für diesen Tag</div>';
    return;
  }
  
  timeline.innerHTML = dayEvents.map(event => {
    const isCurrent = isCurrentEvent(event);
    const isPast = isEventPast(event);
    const icon = event.icon || getDefaultIcon(event.type);
    
    return `
      <div class="event-card ${isCurrent ? 'current' : ''} ${isPast ? 'past' : ''} ${event.isImportant ? 'important' : ''}" data-day="${day}">
        <div class="event-time">
          <div class="time-badge">${event.time}</div>
        </div>
        <div class="timeline-dot"></div>
        <div class="event-content">
          <div class="event-header">
            <span class="event-icon">${icon}</span>
            <h3 class="event-title">${event.title}</h3>
            ${event.type ? `<span class="event-type-badge type-${event.type}">${event.type}</span>` : ''}
          </div>
          <div class="event-location">
            📍 ${event.location}
          </div>
          <div class="event-description">
            ${event.description}
          </div>
          ${event.duration || event.mapsLink ? `
            <div class="event-meta">
              ${event.duration ? `<span class="meta-item">⏱️ ${event.duration}</span>` : ''}
              ${event.mapsLink ? `<a href="${event.mapsLink}" target="_blank" class="maps-link meta-item">🗺️ Maps öffnen</a>` : ''}
            </div>
          ` : ''}
        </div>
      </div>
    `;
  }).join('');
}

// Get default icon based on event type
function getDefaultIcon(type) {
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

// Update current time display
function updateCurrentTime() {
  const now = new Date();
  const options = { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  };
  const timeString = now.toLocaleDateString('de-DE', options);
  document.getElementById('currentTime').textContent = timeString;
}

// Check if event is current
function isCurrentEvent(event) {
  const now = new Date();
  const eventDateTime = new Date(`${event.date}T${event.time}:00`);
  const nextEvent = getNextEvent(event);
  
  if (!nextEvent) return false;
  
  const nextEventDateTime = new Date(`${nextEvent.date}T${nextEvent.time}:00`);
  
  return now >= eventDateTime && now < nextEventDateTime;
}

// Check if event is past
function isEventPast(event) {
  const now = new Date();
  const eventDateTime = new Date(`${event.date}T${event.time}:00`);
  return now > eventDateTime;
}

// Get next event after current
function getNextEvent(currentEvent) {
  const currentIndex = eventsData.events.findIndex(e => e.id === currentEvent.id);
  return eventsData.events[currentIndex + 1] || null;
}

// Start countdown to first important event
function startCountdown() {
  if (!eventsData || !eventsData.events) {
    console.warn('No events data for countdown');
    document.getElementById('mainCountdown').classList.add('hidden');
    return;
  }
  
  const countdownEvents = eventsData.events.filter(e => e.isCountdown);
  
  if (countdownEvents.length === 0) {
    document.getElementById('mainCountdown').classList.add('hidden');
    return;
  }
  
  let currentCountdownIndex = 0;
  
  function updateCountdown() {
    const now = new Date();
    const targetEvent = countdownEvents[currentCountdownIndex];
    
    if (!targetEvent) {
      document.getElementById('mainCountdown').classList.add('hidden');
      return;
    }
    
    const targetDate = new Date(`${targetEvent.date}T${targetEvent.time}:00`);
    const diff = targetDate - now;
    
    // If this countdown is over, move to next
    if (diff <= 0) {
      currentCountdownIndex++;
      if (currentCountdownIndex >= countdownEvents.length) {
        document.getElementById('mainCountdown').classList.add('hidden');
        return;
      }
      return updateCountdown();
    }
    
    // Calculate time components
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);
    
    // Update display
    document.getElementById('days').textContent = String(days).padStart(2, '0');
    document.getElementById('hours').textContent = String(hours).padStart(2, '0');
    document.getElementById('minutes').textContent = String(minutes).padStart(2, '0');
    document.getElementById('seconds').textContent = String(seconds).padStart(2, '0');
    
    // Update subtitle
    const subtitle = document.getElementById('countdownSubtitle');
    subtitle.textContent = `${targetEvent.title} - ${targetEvent.location}`;
    
    // Show countdown
    document.getElementById('mainCountdown').classList.remove('hidden');
  }
  
  // Update every second
  updateCountdown();
  setInterval(updateCountdown, 1000);
}

// Update event status
function updateEventStatus() {
  if (eventsData) {
    renderEvents(currentDay);
  }
}
