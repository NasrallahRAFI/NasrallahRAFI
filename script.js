// HiveMQ Cloud connection details
const HIVEMQ_BROKER = "508205b2e19c4a7fad9828d3961d6424.s1.eu.hivemq.cloud";
const HIVEMQ_WS_PORT = 8884;
const HIVEMQ_PORT = 8883;

// Global MQTT client reference
let client = null;
let isConnected = false;

// DOM elements
const loginContainer = document.getElementById('login-container');
const supervisorContainer = document.getElementById('supervisor-container');
const usernameInput = document.getElementById('username');
const passwordInput = document.getElementById('password');
const connectBtn = document.getElementById('connect-btn');
const disconnectBtn = document.getElementById('disconnect-btn');
const loginError = document.getElementById('login-error');
const connectionStatus = document.getElementById('connection-status');
const topicsList = document.getElementById('topics-list');
const messagesContainer = document.getElementById('messages-container');
const newTopicInput = document.getElementById('new-topic');
const subscribeBtn = document.getElementById('subscribe-btn');
const publishTopicInput = document.getElementById('publish-topic');
const publishMessageInput = document.getElementById('publish-message');
const publishBtn = document.getElementById('publish-btn');

// Initialize the application
function init() {
    connectBtn.addEventListener('click', connectToHiveMQ);
    disconnectBtn.addEventListener('click', disconnectFromHiveMQ);
    subscribeBtn.addEventListener('click', subscribeToTopic);
    publishBtn.addEventListener('click', publishMessage);
    
    // Load any saved credentials
    const savedUsername = localStorage.getItem('mqtt_username');
    const savedPassword = localStorage.getItem('mqtt_password');
    
    if (savedUsername) usernameInput.value = savedUsername;
    if (savedPassword) passwordInput.value = savedPassword;
}

// Connect to HiveMQ
function connectToHiveMQ() {
    const username = usernameInput.value.trim();
    const password = passwordInput.value.trim();
    
    if (!username || !password) {
        showError("Please enter both username and password");
        return;
    }
    
    // Save credentials for next time
    localStorage.setItem('mqtt_username', username);
    localStorage.setItem('mqtt_password', password);
    
    // Create MQTT client
    const clientId = "webclient_" + Math.random().toString(16).substr(2, 8);
    const wsEndpoint = `wss://${HIVEMQ_BROKER}:${HIVEMQ_WS_PORT}/mqtt`;
    
    client = new Paho.MQTT.Client(wsEndpoint, clientId);
    
    // Set callback handlers
    client.onConnectionLost = onConnectionLost;
    client.onMessageArrived = onMessageArrived;
    
    // Connect options
    const connectOptions = {
        userName: username,
        password: password,
        useSSL: true,
        onSuccess: onConnect,
        onFailure: onConnectFailure,
        reconnect: true
    };
    
    // Show connecting state
    loginError.textContent = "";
    connectBtn.disabled = true;
    connectBtn.textContent = "Connecting...";
    
    // Connect the client
    client.connect(connectOptions);
}

function onConnect() {
    console.log("Connected to HiveMQ");
    isConnected = true;
    
    // Update UI
    loginContainer.classList.add('hidden');
    supervisorContainer.classList.remove('hidden');
    updateConnectionStatus(true);
    
    // Subscribe to default topics if needed
    // subscribeToTopic("pump/status");
}

function onConnectFailure(error) {
    console.error("Connection failed:", error);
    showError("Connection failed: " + error.errorMessage);
    connectBtn.disabled = false;
    connectBtn.textContent = "Connect";
}

function onConnectionLost(responseObject) {
    if (responseObject.errorCode !== 0) {
        console.error("Connection lost:", responseObject.errorMessage);
    }
    isConnected = false;
    updateConnectionStatus(false);
    
    // Show login screen if we were connected
    if (supervisorContainer.classList.contains('hidden') === false) {
        supervisorContainer.classList.add('hidden');
        loginContainer.classList.remove('hidden');
        showError("Connection lost. Please reconnect.");
    }
    
    connectBtn.disabled = false;
    connectBtn.textContent = "Connect";
}

function onMessageArrived(message) {
    console.log("Message received:", message.destinationName, message.payloadString);
    addMessageToUI(message.destinationName, message.payloadString);
}

function disconnectFromHiveMQ() {
    if (client && isConnected) {
        client.disconnect();
    }
    isConnected = false;
    updateConnectionStatus(false);
    supervisorContainer.classList.add('hidden');
    loginContainer.classList.remove('hidden');
}

function subscribeToTopic() {
    const topic = newTopicInput.value.trim();
    
    if (!topic) {
        showError("Please enter a topic to subscribe");
        return;
    }
    
    if (!client || !isConnected) {
        showError("Not connected to MQTT broker");
        return;
    }
    
    client.subscribe(topic, {
        onSuccess: () => {
            console.log("Subscribed to", topic);
            addTopicToUI(topic);
            newTopicInput.value = "";
        },
        onFailure: (error) => {
            console.error("Subscription failed:", error);
            showError("Failed to subscribe: " + error.errorMessage);
        }
    });
}

function publishMessage() {
    const topic = publishTopicInput.value.trim();
    const message = publishMessageInput.value.trim();
    
    if (!topic || !message) {
        showError("Please enter both topic and message");
        return;
    }
    
    if (!client || !isConnected) {
        showError("Not connected to MQTT broker");
        return;
    }
    
    const mqttMessage = new Paho.MQTT.Message(message);
    mqttMessage.destinationName = topic;
    
    client.send(mqttMessage);
    console.log("Message published to", topic);
    
    // Add to UI as outgoing message
    addMessageToUI(topic, message, true);
    
    // Clear inputs
    publishMessageInput.value = "";
}

// UI Helpers
function showError(message) {
    loginError.textContent = message;
    setTimeout(() => {
        loginError.textContent = "";
    }, 5000);
}

function updateConnectionStatus(connected) {
    if (connected) {
        connectionStatus.textContent = "Connected";
        connectionStatus.className = "status status-connected";
    } else {
        connectionStatus.textContent = "Disconnected";
        connectionStatus.className = "status status-disconnected";
    }
}

function addTopicToUI(topic) {
    const topicElement = document.createElement('div');
    topicElement.className = 'topic-item';
    topicElement.textContent = topic;
    topicElement.addEventListener('click', () => {
        // Highlight selected topic
        document.querySelectorAll('.topic-item').forEach(item => {
            item.classList.remove('active');
        });
        topicElement.classList.add('active');
    });
    topicsList.appendChild(topicElement);
}

function addMessageToUI(topic, message, isOutgoing = false) {
    const messageElement = document.createElement('div');
    messageElement.className = 'message-item';
    
    const timestamp = new Date().toLocaleTimeString();
    const direction = isOutgoing ? "OUT" : "IN";
    
    messageElement.innerHTML = `
        <div><strong>${timestamp} [${direction}] ${topic}</strong></div>
        <div>${message}</div>
    `;
    
    messagesContainer.appendChild(messageElement);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', init);
