const HIVEMQ_BROKER = "508205b2e19c4a7fad9828d3961d6424.s1.eu.hivemq.cloud";
const HIVEMQ_PORT = 8884;
const TOPIC = "Test";
let client = null;

document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('login-form');
    const loginContainer = document.getElementById('login-container');
    const mainContainer = document.getElementById('main-container');
    const errorMessage = document.getElementById('error-message');
    const logoutBtn = document.getElementById('logout-btn');
    const messagesDiv = document.getElementById('messages');

    loginForm.addEventListener('submit', function(e) {
        e.preventDefault();
        errorMessage.textContent = "";
        const username = document.getElementById('username').value.trim();
        const password = document.getElementById('password').value;

        if (!username || !password) {
            errorMessage.textContent = "Please enter both username and password.";
            return;
        }

        // Connect MQTT
        const clientId = "clientId_" + Math.random().toString(16).substr(2, 8);
        client = new Paho.MQTT.Client(HIVEMQ_BROKER, Number(HIVEMQ_PORT), clientId);

        client.onConnectionLost = function(responseObject) {
            if (responseObject.errorCode !== 0) {
                showError("Connection lost: " + responseObject.errorMessage);
                showLogin();
            }
        };

        client.onMessageArrived = function(message) {
            messagesDiv.textContent += `[${message.destinationName}] ${message.payloadString}\n`;
        };

        client.connect({
            useSSL: true,
            userName: username,
            password: password,
            timeout: 5,
            onSuccess: function() {
                showMain();
                messagesDiv.textContent = "";
                client.subscribe(TOPIC, {qos: 0});
            },
            onFailure: function(err) {
                showError("Login failed: " + (err.errorMessage || "Invalid credentials or network error."));
            }
        });
    });

    logoutBtn.addEventListener('click', () => {
        if (client && client.isConnected()) {
            client.disconnect();
        }
        showLogin();
    });

    function showError(msg) {
        errorMessage.textContent = msg;
    }

    function showMain() {
        loginContainer.style.display = "none";
        mainContainer.style.display = "block";
    }

    function showLogin() {
        loginContainer.style.display = "block";
        mainContainer.style.display = "none";
        errorMessage.textContent = "";
        document.getElementById('username').value = '';
        document.getElementById('password').value = '';
    }
});
        
