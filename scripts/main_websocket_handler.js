// main_websocket_handler.js (Include this on all moderator pages)

const GLOBAL_WS_URL = 'wss://www.arta-tsg.com:3001';
let globalWs = null;
let statusUpdateCallbacks = [];
const taskAssignedCallbacks = [];
const notificationCallbacks = [];
// 💡 NEW: Flag to stop reconnection attempts after a manual logout
let isExplicitlyLoggingOut = false;


// --- HEARTBEAT CONFIGURATION ---
let heartbeatInterval = null;
const HEARTBEAT_CLIENT_INTERVAL = 30000; // 30 seconds (Must be less than the server's 5-minute OFFLINE_TIMEOUT)

/**
 * Sends a 'heartbeat' message to the server to maintain online status.
 */
function startHeartbeat() {
    // 1. Clear any existing interval first
    if (heartbeatInterval) {
        clearInterval(heartbeatInterval);
    }

    heartbeatInterval = setInterval(() => {
        if (globalWs && globalWs.readyState === WebSocket.OPEN) {
            // Send the message the server's Watchdog is waiting for
            globalWs.send(JSON.stringify({ type: 'heartbeat' }));
            console.log('❤️ Heartbeat sent.'); // Uncomment for debugging
        } else {
            // If the connection is not open, stop trying to send heartbeats
            clearInterval(heartbeatInterval);
            heartbeatInterval = null;
            // Optionally: Attempt to re-setup the global WebSocket here
            // setupGlobalWebSocket(); 
        }
    }, HEARTBEAT_CLIENT_INTERVAL);
}

/**
 * Sends an explicit 'logout' message to the server for graceful disconnection.
 * This is used ONLY for manual logouts (e.g., clicking a sign-out button).
 */
function sendExplicitLogoutSignal() {
    if (globalWs && globalWs.readyState === WebSocket.OPEN) {
        // 🎯 CRITICAL: Send the new 'logout' message type
        globalWs.send(JSON.stringify({ type: 'logout' }));
        console.log('👋 Explicit logout signal sent.');
        // Set the flag to prevent the onclose handler from trying to reconnect
        isExplicitlyLoggingOut = true;
    }
}

// /**
//  * Subscribes other scripts (like management.js) to real-time status updates.
//  */
// window.subscribeToWsStatusUpdates = function(callback) {
//     if (typeof callback === 'function') {
//         statusUpdateCallbacks.push(callback);
//     }
// };

window.subscribeToNotifications = function (callback) {
    if (typeof callback === 'function') {
        notificationCallbacks.push(callback);
    }
};

window.subscribeToStatusUpdates = function (callback) {
    if (!statusUpdateCallbacks.includes(callback)) {
        statusUpdateCallbacks.push(callback);
    }
};

window.subscribeToTaskAssignments = cb => {
    taskAssignedCallbacks.push(cb);
};

// /**
//  * Send an explicit 'offline' message before closing the socket.
//  */
// function sendOfflineSignal() {
//     if (globalWs && globalWs.readyState === WebSocket.OPEN) {
//         const username = localStorage.getItem('username'); // Assuming you store username on login
//         if (username) {
//             // Server is now configured to handle status_change: Offline by logging them out
//             globalWs.send(JSON.stringify({ 
//                 type: 'status_change', 
//                 status: 'Offline',
//                 username: username
//             }));
//             // Stop the pinger immediately when sending a clean logout signal
//             if (heartbeatInterval) {
//                 clearInterval(heartbeatInterval);
//                 heartbeatInterval = null;
//             }
//         }
//     }
// }

/**
 * Establishes the centralized WebSocket connection.
 */
function setupGlobalWebSocket() {
    const token = localStorage.getItem('authToken');
    if (!token) return;

    if (globalWs && globalWs.readyState === WebSocket.OPEN) return;

    isExplicitlyLoggingOut = false;
    globalWs = new WebSocket(`${GLOBAL_WS_URL}/?token=${token}`);

    globalWs.onopen = () => {
        console.log('Global WebSocket connected. Online status initialized.');
        // 🎯 CRITICAL EDIT: START THE HEARTBEAT ON SUCCESSFUL CONNECTION
        startHeartbeat();
    };

    globalWs.onmessage = (event) => {
        let msg;
        try {
            msg = JSON.parse(event.data);

            if (msg.type === 'staff_status_update') {
                statusUpdateCallbacks.forEach(callback => callback(msg));



            }
            if (msg.type === 'task_assigned') {
                taskAssignedCallbacks.forEach(cb => cb(msg.task));
            }

            if (msg.type === 'new_notification') {
                notificationCallbacks.forEach(callback => callback(msg));
                return;
            }

        } catch (e) {
            console.error('Error parsing WebSocket message in global handler:', e);
        }
    };

    globalWs.onclose = () => {
        console.log('Global WebSocket disconnected.');
        // 🎯 CRITICAL EDIT: STOP HEARTBEAT ON DISCONNECT
        if (heartbeatInterval) {
            clearInterval(heartbeatInterval);
            heartbeatInterval = null;
        }
        // 🎯 FIX: Only reconnect if the user did NOT manually log out
        if (!isExplicitlyLoggingOut) {
            console.log('Attempting silent reconnection in 3 seconds (likely navigation)...');
            setTimeout(setupGlobalWebSocket, 3000);
        }
    };

    globalWs.onerror = (error) => {
        console.error('Global WebSocket Error:', error);
    };
}

// ------------------------------------------
// EVENT LISTENERS & INITIALIZATION
// ------------------------------------------
window.sendExplicitLogoutSignal = sendExplicitLogoutSignal;

// When the user explicitly logs out (assuming you have a logout button)
window.handleLogout = function () {
    sendExplicitLogoutSignal();
    // Proceed with standard logout (clear token, redirect)
    localStorage.removeItem('authToken');
    localStorage.removeItem('username');
    // window.location.href = '/login'; 
};

// When the user closes the browser or tab
window.addEventListener('beforeunload', () => {
    // Send explicit offline signal

    // 🎯 CRITICAL EDIT: Stop the heartbeat interval immediately
    if (heartbeatInterval) {
        clearInterval(heartbeatInterval);
        heartbeatInterval = null;
    }
});
window.subscribeToStatusUpdates = subscribeToStatusUpdates;
// Initialize the persistent connection when the DOM is ready
document.addEventListener('DOMContentLoaded', setupGlobalWebSocket);