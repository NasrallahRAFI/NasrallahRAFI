```javascript
// MQTT client configuration
const options = {
    host: '508205b2e19c4a7fad9828d3961d6424.s1.eu.hivemq.cloud',
    port: 8884,
    protocol: 'wss',
    clientId: 'mqttjs_' + Math.random().toString(16).substr(2, 8),
    username: 'Nasrallah', // Replace with your HiveMQ Cloud username
    password: 'Nasrollah2003*'  // Replace with your HiveMQ Cloud password
};

// Initialize MQTT client
const client = mqtt.connect(options);

// DOM elements
const statusDiv = document.getElementById('status');
const messagesDiv = document.getElementById('messages');

// Handle connection success
client.on('connect', () => {
    statusDiv.textContent = 'Connected to HiveMQ Cloud';
    statusDiv.style.color = 'green';
    // Subscribe to a topic (replace 'test/topic' with your topic)
    client.subscribe('test/topic', (err) => {
        if (!err) {
            appendMessage('Subscribed to test/topic');
        } else {
            appendMessage('Subscription error: ' + err, true);
        }
    });
});

// Handle incoming messages
client.on('message', (topic, message) => {
    const msg = `Topic: ${topic} | Message: ${message.toString()}`;
    appendMessage(msg);
});

// Handle errors
client.on('error', (err) => {
    statusDiv.textContent = 'Connection error: ' + err;
    statusDiv.style.color = 'red';
});

// Handle connection close
client.on('close', () => {
    statusDiv.textContent = 'Disconnected from HiveMQ Cloud';
    statusDiv.style.color = 'orange';
});

// Function to append messages to the UI
function appendMessage(text, isError = false) {
    const msgDiv = document.createElement('div');
    msgDiv.className = 'message';
    if (isError) msgDiv.className += ' error';
    msgDiv.textContent = `[${new Date().toLocaleTimeString()}] ${text}`;
    messagesDiv.appendChild(msgDiv);
    messagesDiv.scrollTop = messagesDiv.scrollHeight;
}
```
