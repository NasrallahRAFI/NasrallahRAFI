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
const subscribedTopicsDiv = document.getElementById('subscribed-topics');
let client = null;
let subscribedTopics = [];

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

// Update subscribed topics display
function updateSubscribedTopics() {
  subscribedTopicsDiv.innerHTML = subscribedTopics.length
    ? `<p>Subscribed to: ${subscribedTopics.map(t => sanitizeHTML(t)).join(', ')}</p>`
    : '<p>No active subscriptions</p>';
}

// Debounce function for filtering
function debounce(fn, ms) {
  let timeout;
  return (...args) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => fn(...args), ms);
  };
}

// Validate MQTT topic
function isValidTopic(topic) {
  return /^[a-zA-Z0-9\/#+]+$/.test(topic) && !/\s/.test(topic);
}

// Connect to MQTT broker
function connectToBroker() {
  const username = usernameInput.value.trim();
  const password = passwordInput.value;
  const brokerUrl = brokerInput.value.trim();
  const topics = topicInput.value.trim().split(',').map(t => t.trim()).filter(t => t && isValidTopic(t));

  errorDiv.classList.add('hidden');
  errorDiv.textContent = '';

  if (!username || !password || !brokerUrl) {
    showError('Please enter all required fields');
    return;
  }

  if (!topics.length) {
    showError('Please enter at least one valid topic (e.g., iot/data or iot/#)');
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
      reconnectPeriod: 1000,
      keepalive: 60,
    });

    client.on('connect', () => {
      updateStatus('Connected to IoT Server', true);
      connectBtn.classList.add('hidden');
      disconnectBtn.classList.remove('hidden');
      
      subscribedTopics = topics;
      topics.forEach(topic => {
        client.subscribe(topic, (err) => {
          if (!err) {
            messages.innerHTML += `<li>Subscribed to ${sanitizeHTML(topic)}</li>`;
          } else {
            showError(`Error subscribing to ${sanitizeHTML(topic)}: ${err.message}`);
          }
        });
      });
      updateSubscribedTopics();
    });

    client.on('reconnect', () => {
      updateStatus('Reconnecting...', false);
    });

    client.on('message', (receivedTopic, message) => {
      const msg = sanitizeHTML(message.toString());
      messages.innerHTML += `<li><strong>${sanitizeHTML(receivedTopic)}</strong>: ${msg}</li>`;
      const storedMessages = JSON.parse(localStorage.getItem('iotMessages') || '[]');
      storedMessages.push({ topic: receivedTopic, message: msg });
      if (storedMessages.length > 100) storedMessages.shift(); // Limit to 100 messages
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
      subscribedTopics = [];
      updateSubscribedTopics();
    });
  } catch (err) {
    showError(`Connection failed: ${err.message}`);
    updateStatus('Disconnected', false);
  }
}

// Load stored messages
window.addEventListener('load', () => {
  const storedMessages = JSON.parse(localStorage.getItem('iotMessages') || '[]');
  storedMessages.forEach(({ topic, message }) => {
    messages.innerHTML += `<li><strong>${sanitizeHTML(topic)}</strong>: ${sanitizeHTML(message)}</li>`;
  });
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
    subscribedTopics = [];
    updateSubscribedTopics();
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
