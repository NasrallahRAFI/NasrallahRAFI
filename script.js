// HiveMQ connection details
const HIVEMQ_BROKER = "508205b2e19c4a7fad9828d3961d6424.s1.eu.hivemq.cloud";
const HIVEMQ_PORT = 8884;
const HIVEMQ_USERNAME = "YOUR_HIVEMQ_USERNAME"; // Replace with actual credentials
const HIVEMQ_PASSWORD = "YOUR_HIVEMQ_PASSWORD"; // Replace with actual credentials

// Topics to subscribe to
const TOPICS = {
    PUMP_STATE: "Pump/state",
    WATER_LEVEL: "WaterTank/level",
    INVERTER_STATE: "SolarInverter/state",
    POWER_SOURCE: "Power/source",
    INVERTER_TEMP: "SolarInverter/temperature"
};

let client = null;
let isConnected = false;

document.addEventListener('DOMContentLoaded', function() {
    const loginForm = document.getElementById('login-form');
    const loginContainer = document.getElementById('login-container');
    const dashboardContainer = document.getElementById('dashboard-container');
    const logoutBtn = document.getElementById('logout-btn');
    const errorMessage = document.getElementById('login-error');

    // Check if user is already logged in (for demo purposes)
    const isLoggedIn = localStorage.getItem('isLoggedIn');
    if (isLoggedIn) {
        loginContainer.style.display = 'none';
        dashboardContainer.style.display = 'block';
        initializeMQTTClient();
    }

    // Login form submission
    loginForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;
        
        // Basic authentication (in a real app, this would be server-side)
        if (username && password) {
            // For demo purposes, any non-empty credentials will work
            localStorage.setItem('isLoggedIn', 'true');
            loginContainer.style.display = 'none';
            dashboardContainer.style.display = 'block';
            errorMessage.textContent = '';
            
            // Initialize MQTT client after successful login
            initializeMQTTClient();
        } else {
            errorMessage.textContent = 'Invalid username or password';
        }
    });

    // Logout button
    logoutBtn.addEventListener('click', function() {
        localStorage.removeItem('isLoggedIn');
        if (client && isConnected) {
            client.disconnect();
        }
        dashboardContainer.style.display = 'none';
        loginContainer.style.display = 'block';
        document.getElementById('username').value = '';
        document.getElementById('password').value = '';
    });
});

function initializeMQTTClient() {
    // Create a client instance
    client = new Paho.MQTT.Client(HIVEMQ_BROKER, HIVEMQ_PORT, "clientId_" + Math.random().toString(16).substr(2, 8));

    // Set callback handlers
    client.onConnectionLost = onConnectionLost;
    client.onMessageArrived = onMessageArrived;

    // Connect the client
    const connectOptions = {
        useSSL: true,
        userName: HIVEMQ_USERNAME,
        password: HIVEMQ_PASSWORD,
        onSuccess: onConnect,
        onFailure: onConnectionFailure,
        reconnect: true
    };

    client.connect(connectOptions);
}

function onConnect() {
    console.log("Connected to HiveMQ");
    isConnected = true;
    updateConnectionStatus(true);
    
    // Subscribe to topics
    for (const topic in TOPICS) {
        client.subscribe(TOPICS[topic]);
        console.log("Subscribed to " + TOPICS[topic]);
    }
}

function onConnectionFailure(response) {
    console.error("Connection failed: " + response.errorMessage);
    isConnected = false;
    updateConnectionStatus(false);
    
    // Try to reconnect after 5 seconds
    setTimeout(initializeMQTTClient, 5000);
}

function onConnectionLost(responseObject) {
    if (responseObject.errorCode !== 0) {
        console.error("Connection lost: " + responseObject.errorMessage);
    }
    isConnected = false;
    updateConnectionStatus(false);
    
    // Try to reconnect
    setTimeout(initializeMQTTClient, 5000);
}

function onMessageArrived(message) {
    console.log("Message received: " + message.destinationName + " - " + message.payloadString);
    
    // Update UI based on the topic
    switch(message.destinationName) {
        case TOPICS.PUMP_STATE:
            updatePumpState(message.payloadString);
            break;
        case TOPICS.WATER_LEVEL:
            updateWaterLevel(message.payloadString);
            break;
        case TOPICS.INVERTER_STATE:
            updateInverterState(message.payloadString);
            break;
        case TOPICS.POWER_SOURCE:
            updatePowerSource(message.payloadString);
            break;
        case TOPICS.INVERTER_TEMP:
            updateInverterTemp(message.payloadString);
            break;
    }
}

function updatePumpState(state) {
    const element = document.getElementById('pump-state');
    element.textContent = state;
    
    // Add appropriate class based on state
    element.className = 'value';
    if (state.toLowerCase() === 'on') {
        element.classList.add('state-on');
    } else if (state.toLowerCase() === 'off') {
        element.classList.add('state-off');
    } else {
        element.classList.add('state-warning');
    }
}

function updateWaterLevel(level) {
    const element = document.getElementById('water-level');
    const bar = document.getElementById('water-level-bar');
    
    let numericLevel = parseInt(level);
    if (isNaN(numericLevel)) {
        numericLevel = 0;
    }
    
    element.textContent = numericLevel + '%';
    bar.style.width = numericLevel + '%';
    
    // Change color based on level
    if (numericLevel < 20) {
        bar.style.backgroundColor = '#e74c3c';
    } else if (numericLevel < 50) {
        bar.style.backgroundColor = '#f39c12';
    } else {
        bar.style.backgroundColor = '#27ae60';
    }
}

function updateInverterState(state) {
    const element = document.getElementById('inverter-state');
    element.textContent = state;
    
    // Add appropriate class based on state
    element.className = 'value';
    if (state.toLowerCase() === 'on') {
        element.classList.add('state-on');
    } else if (state.toLowerCase() === 'off') {
        element.classList.add('state-off');
    } else {
        element.classList.add('state-warning');
    }
}

function updatePowerSource(source) {
    const element = document.getElementById('power-source');
    element.textContent = source;
    
    // Add appropriate class based on source
    element.className = 'value';
    if (source.toLowerCase().includes('solar')) {
        element.classList.add('state-on');
    } else if (source.toLowerCase().includes('grid')) {
        element.classList.add('state-warning');
    } else {
        element.classList.add('state-off');
    }
}

function updateInverterTemp(temp) {
    const element = document.getElementById('inverter-temp');
    const bar = document.getElementById('temp-bar');
    
    let numericTemp = parseInt(temp);
    if (isNaN(numericTemp)) {
        numericTemp = 0;
    }
    
    element.textContent = numericTemp + ' °C';
    
    // Update progress bar (assuming max safe temp is 80°C)
    const percentage = Math.min(100, (numericTemp / 80) * 100);
    bar.style.width = percentage + '%';
    
    // Change color based on temperature
    if (numericTemp > 60) {
        bar.style.backgroundColor = '#e74c3c';
    } else if (numericTemp > 40) {
        bar.style.backgroundColor = '#f39c12';
    } else {
        bar.style.backgroundColor = '#27ae60';
    }
}

function updateConnectionStatus(connected) {
    const statusElement = document.getElementById('connection-status');
    statusElement.textContent = connected ? 'Connected to HiveMQ' : 'Disconnected - Trying to reconnect...';
    statusElement.className = connected ? 'connected' : 'disconnected';
}
