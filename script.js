const form = document.getElementById('mqttForm');
const status = document.getElementById('status');
const messages = document.getElementById('messages');
let client = null;

form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const brokerUrl = document.getElementById('brokerUrl').value;
    const port = parseInt(document.getElementById('port').value);
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;

    try {
        status.textContent = 'Status: Connecting...';

        // Configure MQTT client
        client = mqtt.connect(brokerUrl, {
            port: port,
            username: username,
            password: password,
            clientId: 'web_client_' + Math.random().toString(16).slice(3),
            protocol: 'wss' // Use WebSocket Secure for browser compatibility
        });

        // Handle connection success
        client.on('connect', () => {
            status.textContent = 'Status: Connected to HiveMQ';
            messages.textContent = 'Connected successfully! Subscribing to test/topic...';
            client.subscribe('test/topic', (err) => {
                if (!err) {
                    messages.textContent += '\nSubscribed to test/topic';
                    // Publish a test message
                    client.publish('test/topic', 'Hello from the website!');
                } else {
                    messages.textContent += '\nError subscribing: ' + err;
                }
            });
        });

        // Handle incoming messages
        client.on('message', (topic, message) => {
            messages.textContent += `\nReceived on ${topic}: ${message.toString()}`;
        });

        // Handle errors
        client.on('error', (err) => {
            status.textContent = 'Status: Error - ' + err.message;
            client.end();
        });

        // Handle disconnection
        client.on('close', () => {
            status.textContent = 'Status: Disconnected';
        });

    } catch (err) {
        status.textContent = 'Status: Connection failed - ' + err.message;
    }
});