import { DEFAULT_CONFIG } from './config.js';

const usernameInput = document.getElementById('username');
const passwordInput = document.getElementById('password');
const brokerInput = document.getElementById('broker');
const topicInput = document.getElementById('topic');
const connectBtn = document.getElementById('connect-btn');
const disconnectBtn = document.getElementById('disconnect-btn');
const clearBtn = document.getElementById('clear-btn');
const status = document.getElementById('status');
const errorDiv = document.getElementById('error');
const messages = document.getElementById('messages');
const filterInput = document.getElementById('filter');
let client = null;

// Set default values
brokerInput.value = DEFAULT_CONFIG.brokerUrl;
topicInput.value = DEFAULT_CONFIG.defaultTopic;

// Sanitize HTML to prevent XSS
function sanitizeHTML(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

// Show error message
function showError(message) {
  errorDiv.textContent = message;
  errorDiv.classList.remove('hidden');
}

// Update connection status
function updateStatus(text, isConnected) {
  status.textContent = text;
  status.classList.toggle('connected', isConnected);
  status.classList.toggle('disconnected', !isConnected);
}

// Debounce function for filtering
function debounce(fn, ms) {
  let timeout;
  return (...args) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => fn(...args), ms);
  };
}

// Connect to MQTT broker
function connectToBroker() {
  const username = usernameInput.value.trim();
  const password = passwordInput.value;
  const brokerUrl = brokerInput.value.trim();
  const topic = topicInput.value.trim() || DEFAULT_CONFIG.defaultTopic;

  // Clear previous error
  errorDiv.classList.add('hidden');
  errorDiv.textContent = '';

  if (!username || !password || !brokerUrl) {
    showError('Please enter all required fields');
    return;
  }

  try {
    if (typeof mqtt === 'undefined') {
      showError('MQTT library not loaded');
      return;
    }

    client = mqtt.connect(brokerUrl, {
      username,
      password,
      clientId: 'iotclient_' + Math.random().toString(16).slice(3),
      reconnectPeriod: 1000, // Auto-reconnect
      keepalive: 60,
    });

    client.on('connect', () => {
      updateStatus('Connected to IoT Server', true);
      connectBtn.classList.add('hidden');
      disconnectBtn.classList.remove('hidden');
      client.subscribe(topic, (err) => {
        if (!err) {
          messages.innerHTML += `<li>Subscribed to ${sanitizeHTML(topic)}</li>`;
        } else {
          showError(`Error subscribing: ${err.message}`);
        }
      });
    });

    client.on('reconnect', () => {
      updateStatus('Reconnecting...', false);
    });

    client.on('message', (receivedTopic, message) => {
      const msg = sanitizeHTML(message.toString());
      messages.innerHTML += `<li>${msg}</li>`;
      const storedMessages = JSON.parse(localStorage.getItem('iotMessages') || '[]');
      storedMessages.push(msg);
      localStorage.setItem('iotMessages', JSON.stringify(storedMessages));
      messages.scrollTop = messages.scrollHeight;
    });

    client.on('error', (err) => {
      let errorMessage = err.message;
      if (errorMessage.includes('Bad username or password') || errorMessage.includes('Connection refused')) {
        errorMessage = 'Invalid username or password';
      }
      showError(`Connection failed: ${errorMessage}`);
      updateStatus('Disconnected', false);
      client.end();
    });

    client.on('close', () => {
      updateStatus('Disconnected', false);
      connectBtn.classList.remove('hidden');
      disconnectBtn.classList.add('hidden');
      errorDiv.classList.add('hidden');
    });
  } catch (err) {
    showError(`Connection failed: ${err.message}`);
    updateStatus('Disconnected', false);
  }
}

// Load stored messages
window.addEventListener('load', () => {
  const storedMessages = JSON.parse(localStorage.getItem('iotMessages') || '[]');
  storedMessages.forEach(msg => messages.innerHTML += `<li>${sanitizeHTML(msg)}</li>`);
});

// Event Listeners
document.getElementById('connect-form').addEventListener('submit', (e) => {
  e.preventDefault();
  connectToBroker();
});

disconnectBtn.addEventListener('click', () => {
  if (client) {
    client.end();
    updateStatus('Disconnected', false);
    connectBtn.classList.remove('hidden');
    disconnectBtn.classList.add('hidden');
    errorDiv.classList.add('hidden');
  }
});

clearBtn.addEventListener('click', () => {
  messages.innerHTML = '';
  localStorage.removeItem('iotMessages');
});

filterInput.addEventListener('input', debounce((e) => {
  const filter = e.target.value.toLowerCase();
  Array.from(messages.children).forEach((li) => {
    li.style.display = li.textContent.toLowerCase().includes(filter) ? '' : 'none';
  });
}, 300));
