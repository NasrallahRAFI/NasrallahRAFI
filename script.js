// script.js
const usernameInput = document.getElementById('username');
const passwordInput = document.getElementById('password');
const connectBtn = document.getElementById('connect-btn');
const disconnectBtn = document.getElementById('disconnect-btn');
const status = document.getElementById('status');
const errorDiv = document.getElementById('error');
const messages = document.getElementById('messages');
let client = null;

// Hardcoded HiveMQ Cloud configuration
const brokerUrl = 'wss://508205b2e19c4a7fad9828d3961d6424.s1.eu.hivemq.cloud:8884/mqtt';
const topic = 'iot/data';

connectBtn.addEventListener('click', async () => {
  const username = usernameInput.value.trim();
  const password = passwordInput.value;

  // Clear previous error
  errorDiv.classList.add('hidden');
  errorDiv.textContent = '';

  if (!username || !password) {
    errorDiv.textContent = 'Please enter both username and password';
    errorDiv.classList.remove('hidden');
    return;
  }

  try {
    client = mqtt.connect(brokerUrl, {
      username: username,
      password: password,
      clientId: 'iotclient_' + Math.random().toString(16).slice(3),
    });

    client.on('connect', () => {
      status.textContent = 'Connected to IoT Server';
      connectBtn.classList.add('hidden');
      disconnectBtn.classList.remove('hidden');
      client.subscribe(topic, (err) => {
        if (!err) {
          messages.innerHTML += `<li>Subscribed to IoT data feed</li>`;
        } else {
          errorDiv.textContent = `Error subscribing: ${err.message}`;
          errorDiv.classList.remove('hidden');
        }
      });
    });

    client.on('message', (receivedTopic, message) => {
      const msg = message.toString();
      messages.innerHTML += `<li>${msg}</li>`;
      messages.scrollTop = messages.scrollHeight;
    });

    client.on('error', (err) => {
      let errorMessage = err.message;
      if (errorMessage.includes('Bad username or password') || errorMessage.includes('Connection refused')) {
        errorMessage = 'Invalid username or password';
      }
      errorDiv.textContent = `Connection failed: ${errorMessage}`;
      errorDiv.classList.remove('hidden');
      status.textContent = 'Disconnected';
      client.end();
    });

    client.on('close', () => {
      status.textContent = 'Disconnected';
      connectBtn.classList.remove('hidden');
      disconnectBtn.classList.add('hidden');
      errorDiv.classList.add('hidden');
      errorDiv.textContent = '';
    });
  } catch (err) {
    errorDiv.textContent = `Connection failed: ${err.message}`;
    errorDiv.classList.remove('hidden');
    status.textContent = 'Disconnected';
  }
});

disconnectBtn.addEventListener('click', () => {
  if (client) {
    client.end();
    status.textContent = 'Disconnected';
    connectBtn.classList.remove('hidden');
    disconnectBtn.classList.add('hidden');
    errorDiv.classList.add('hidden');
    errorDiv.textContent = '';
  }
});
