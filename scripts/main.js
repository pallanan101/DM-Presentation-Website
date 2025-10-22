// main.js

// DOM element retrieval is safe here since the script is executed after the elements are defined in the HTML
const sidebar = document.getElementById('sidebar');
const themeToggle = document.getElementById('theme-toggle');
const sidebarToggle = document.getElementById('sidebar-toggle');
const body = document.body;

// --- NOTIFICATION DOM ELEMENTS ---
const notificationIcon = document.getElementById('notification-icon'); // The bell button
const notificationBadge = document.getElementById('notification-badge');
const notificationDropdown = document.getElementById('notification-dropdown'); // The dropdown container
const notificationList = document.getElementById('notification-list'); // The UL/DIV inside the dropdown
const notificationBellContainer = document.getElementById('notification-bell-container'); // The parent div for global click logic
const popupContainer = document.getElementById('popup-notification-container');


// --- NOTIFICATION STATE ---
let notificationCount = 0;
// Stores the history of all notifications (populated by API on click, and updated by WS)
let notifications = []; 
const MAX_LOCAL_NOTIFICATIONS = 15;


// --- THEME TOGGLE FUNCTIONS ---

function swapClasses(selector, lightClass, darkClass, isLight) {
    document.querySelectorAll(selector).forEach(el => {
        if (isLight) {
            el.classList.remove(darkClass);
            el.classList.add(lightClass);
        } else {
            el.classList.remove(lightClass);
            el.classList.add(darkClass);
        }
    });
}


function toggleStatusDropdown() {
    const dropdown = document.getElementById('status-dropdown');
    dropdown.classList.toggle('hidden');
}

function setStatus(label, color) {
    const trigger = document.getElementById('status-trigger');
    trigger.innerHTML = `
    <i class="fas fa-circle text-${color}-500"></i>
    <span class="sidebar-text ml-2">${label}</span>
  `;
    document.getElementById('status-dropdown').classList.add('hidden');
}
function updateThemeClasses(isDark) {
    const isLight = !isDark;

    // 1. Text Color Swap
    // text-gray-900 <-> text-gray-50 (For primary text)
    swapClasses('.text-gray-900, .text-gray-50', 'text-gray-900', 'text-gray-50', isLight);
    swapClasses('.text-gray-700, .text-gray-200', 'text-gray-700', 'text-gray-200', isLight);

    // 2. Background Swap 1 (User Request: Main Wrapper/Body)
    // bg-gray-100 <-> bg-gray-600
    swapClasses('.bg-gray-100, .bg-gray-600', 'bg-gray-100', 'bg-gray-600', isLight);

    // 3. Background Swap 2 (User Request: Secondary Backgrounds)
    // bg-gray-200 <-> bg-gray-500
    swapClasses('.bg-gray-200, .bg-gray-700', 'bg-gray-200', 'bg-gray-700', isLight);
    swapClasses('.bg-gray-300, .bg-gray-800', 'bg-gray-300', 'bg-gray-800', isLight);

    // 4. Background Swap 3 (Crucial Container Swap: Sidebar, Header, Cards)
    // bg-white <-> bg-gray-900 (Use a very dark color for high-contrast containers)
    swapClasses('.bg-white, .bg-gray-500', 'bg-white', 'bg-gray-500', isLight);

    // 5. Update icon and persist
    const newTheme = isDark ? 'dark' : 'light';
    localStorage.setItem('theme', newTheme);
    if (themeToggle) {
        themeToggle.querySelector('i').className = isDark ? 'fas fa-sun text-lg' : 'fas fa-moon text-lg';
    }
}

function initializeTheme() {
    const savedTheme = localStorage.getItem('theme') || 'light';
    const isDark = savedTheme === 'dark';
    updateThemeClasses(isDark);
}

function toggleTheme() {
    const currentTheme = localStorage.getItem('theme');
    const newThemeIsDark = currentTheme === 'light';
    updateThemeClasses(newThemeIsDark);
}

// --- SIDEBAR TOGGLE FUNCTIONALITY ---
function initializeSidebar() {
    const isCollapsed = localStorage.getItem('sidebarCollapsed') === 'true';
    if (sidebar && isCollapsed) {
        sidebar.classList.add('collapsed');
    }
}

function toggleSidebar() {
    const isCollapsed = sidebar.classList.toggle('collapsed');
    localStorage.setItem('sidebarCollapsed', isCollapsed);
}

// --- CONFIGURATION ---
const API_BASE_URL = 'https://www.arta-tsg.com:3001/api';

// --- DOM ELEMENTS ---
const contentContainer = document.getElementById('content-container');
const pageTitleElement = document.getElementById('page-title');
const usernameDisplay = document.getElementById('username-display');
const navLinks = document.querySelectorAll('#sidebar a:not(#sidebar-logout-btn)');

// --- AUTH/USER LOGIC ---
async function fetchMeAndRoute() {
    const token = localStorage.getItem('authToken');
    try {
        const response = await fetch(`${API_BASE_URL}/me`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await response.json();

        if (response.ok && data.success) {
            currentUsername = data.user
            usernameDisplay.textContent = data.user;

        } else {
            console.error('Token verification failed. Redirecting to login.');
            logout(true);
        }
    } catch (error) {
        console.error('Failed to verify token (Network error):', error);
        contentContainer.innerHTML = `<div class="p-4 rounded-lg bg-red-600 text-white">
                    <h2 class="text-xl font-bold">Connection Error</h2>
                    <p>Could not connect to the API server at ${API_BASE_URL}/me to verify your session.</p>
                </div>`;
    }
}

function logout(force = false) {
    // Assuming sendExplicitLogoutSignal is defined in main_websocket_handler.js
    if (window.sendExplicitLogoutSignal) {
        sendExplicitLogoutSignal(); 
    }
    localStorage.removeItem('username');
    localStorage.removeItem('authToken');
    window.location.replace('login_page.html');
}

// --- NOTIFICATION UTILITIES ---

function updateBadge(count) {
    notificationCount = Math.max(0, count); // Ensure count is never negative
    if (notificationBadge) {
        notificationBadge.textContent = notificationCount;
        if (notificationCount > 0) {
            notificationBadge.classList.remove('hidden');
        } else {
            notificationBadge.classList.add('hidden');
        }
    }
}

function showPopupNotification(message, type,sender) {
    if (!popupContainer) return;

    let bgColor = 'bg-blue-600'; // Default: info
    if (type === 'warning') bgColor = 'bg-yellow-600';
    if (type === 'error') bgColor = 'bg-red-700';
    if (type === 'system') bgColor = 'bg-green-600';

    const popup = document.createElement('div');
    // Styling for the vanishing/sliding effect
    popup.className = `p-4 text-white rounded-lg shadow-xl max-w-sm transform transition duration-500 opacity-0 translate-x-full ${bgColor}`;
    popup.style.width = '300px';
    popup.innerHTML = `
        <div class="font-bold capitalize">${type}</div>
        <div class="text-sm text-gray-300">${sender}</div>
        <div class="text-sm">${message}</div>
    `;

    popupContainer.prepend(popup);

    // 1. Show: Slide in and fade up slightly after a moment
    setTimeout(() => {
        popup.classList.remove('opacity-0', 'translate-x-full');
        popup.classList.add('opacity-100', 'translate-x-0');
    }, 10);

    // 2. Auto-Vanish: Remove after 5 seconds
    setTimeout(() => {
        // Slide out and fade away
        popup.classList.remove('opacity-100', 'translate-x-0');
        popup.classList.add('opacity-0', 'translate-x-full');

        // Remove element from DOM after transition
        popup.addEventListener('transitionend', () => popup.remove());

    }, 5000);
}


function getNotificationIcon(type) {
    switch (type) {
        case 'error': return { icon: 'fa-times-circle', color: 'text-red-500' };
        case 'warning': return { icon: 'fa-exclamation-triangle', color: 'text-yellow-500' };
        case 'info':
        case 'system':
        default: return { icon: 'fa-info-circle', color: 'text-blue-500' };
    }
}

/**
 * Fetches the 10 most recent global notifications from the server and updates the UI.
 */
async function fetchRecentNotificationsAndRender() {
    const token = localStorage.getItem('authToken');
    
    notificationList.innerHTML = '<div class="p-4 text-center text-gray-500 text-sm">Fetching notifications...</div>';

    try {
        const response = await fetch(`${API_BASE_URL}/notifications/recent`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const { success, notifications: fetchedNotifications } = await response.json();

        if (success) {
            // Update local state with fetched data, ensuring timestamps are Date objects
            notifications = fetchedNotifications.map(n => ({
                ...n,
                timestamp: new Date(n.created_at || n.timestamp),
                // Treat fetched notifications as read by default, unless it was broadcasted as new
                unread: false 
            })); 
            // The unread count is only maintained by the badge, not the DB records.
            renderNotificationList();
        } else {
            notificationList.innerHTML = '<div class="p-4 text-center text-red-500 text-sm">Failed to load notifications.</div>';
        }
    } catch (error) {
        console.error('Error fetching recent notifications:', error);
        notificationList.innerHTML = '<div class="p-4 text-center text-red-500 text-sm">Network error.</div>';
    }
}


/**
 * Renders the local 'notifications' array into the dropdown list.
 */
function renderNotificationList() {
    // Apply theme colors to dropdown itself
    const isDark = localStorage.getItem('theme') === 'dark';

    if (isDark) {
        notificationDropdown.classList.remove('bg-white', 'border-gray-200');
        notificationDropdown.classList.add('bg-gray-500', 'border-gray-700'); // Note: Used bg-gray-500 for consistency with the dark theme
    } else {
        notificationDropdown.classList.remove('bg-gray-500', 'border-gray-700');
        notificationDropdown.classList.add('bg-white', 'border-gray-200');
    }

    // Filter to show the latest entries
    const recentNotifications = notifications.slice(0, MAX_LOCAL_NOTIFICATIONS);

    notificationList.innerHTML = ''; // Clear previous list

    if (recentNotifications.length === 0) {
        notificationList.innerHTML = '<div class="p-4 text-gray-500 text-sm italic text-center">No recent notifications.</div>';
        return;
    }

    recentNotifications.forEach((n) => {
        const isUnread = n.unread;
        const { icon, color } = getNotificationIcon(n.type);

        const item = document.createElement('div');
        // Apply conditional dark mode classes on the list item
        const unreadBg = isDark ? 'bg-gray-700' : 'bg-green-50/50';
        const defaultBg = isDark ? 'bg-gray-500' : 'bg-white';
        const hoverBg = isDark ? 'hover:bg-gray-600' : 'hover:bg-gray-100';
        const itemTextColor = isDark ? 'text-gray-200' : 'text-gray-800';
        const sender = n.sender_username || 'System';

        item.className = `p-3 flex items-start space-x-3 cursor-pointer border-b border-gray-100 dark:border-gray-700 last:border-b-0 ${isUnread ? unreadBg : defaultBg} ${hoverBg} transition duration-100`;

        item.innerHTML = `
                    <i class="fas ${icon} ${color} mt-0.5 w-5 min-w-[20px]"></i>
                    <div class="flex-grow">
                        <p class="${itemTextColor} text-sm ${isUnread ? 'font-semibold' : ''}">${n.title}</p>
                        <p class="text-gray-400 text-xs mt-1">From ${sender} • ${n.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                    </div>
                `;

        item.addEventListener('click', (e) => {
            e.stopPropagation(); // Keep the dropdown open, but mark as read
            if (n.unread) {
                n.unread = false;
                updateBadge(notificationCount - 1);
                renderNotificationList(); // Re-render to update item style
            }
        });

        notificationList.appendChild(item);
    });
}


/**
 * Handles a received notification from the WebSocket (real-time).
 */
function handleWebSocketNotification(msg) {
    const newNotification = {
        message: msg.title,
        // Convert ISO string from server to Date object
        timestamp: new Date(msg.timestamp || Date.now()), 
        type: msg.notification_type || 'info',
        sender_username: msg.sender || 'System',
        unread: true // Newly received messages are always unread
    };

    // Prepend the new notification to the local list
    notifications.unshift(newNotification);
    
    // Keep the list size constrained 
    if (notifications.length > MAX_LOCAL_NOTIFICATIONS) { 
        notifications.pop(); 
    }
    
    updateBadge(notificationCount + 1); 
    showPopupNotification(newNotification.message, newNotification.type, newNotification.sender_username);

    // If the dropdown is currently visible, re-render it
    if (notificationDropdown && !notificationDropdown.classList.contains('hidden')) {
        renderNotificationList();
    }
}


function initializeRealTimeNotifications() {
    // Subscribe to the global update stream (defined in main_websocket_handler.js)
    if (window.subscribeToNotifications) {
        window.subscribeToNotifications(handleWebSocketNotification);
        console.log('✅ Subscribed to global real-time notifications.');
    } else {
        console.error('❌ subscribeToNotifications not found.');
    }
    
    // Start with 0 unread notifications
    updateBadge(0); 
}


document.addEventListener('DOMContentLoaded', () => {
    // --- UI INITIALIZATION & EVENT LISTENERS (Theme & Sidebar) ---
    initializeTheme();
    initializeSidebar();

    if (themeToggle) themeToggle.addEventListener('click', toggleTheme);
    if (sidebarToggle) sidebarToggle.addEventListener('click', toggleSidebar);


    // --- NOTIFICATION HANDLER SETUP (Dynamic API/WS Logic) ---
    if (notificationIcon && notificationDropdown) {
        notificationIcon.addEventListener('click', (e) => {
            e.stopPropagation(); 
            
            const isHidden = notificationDropdown.classList.contains('hidden');

            if (isHidden) {
                // OPEN DROPDOWN: 1. Fetch, 2. Render, 3. Clear Badge
                notificationDropdown.classList.remove('hidden');
                
                // Fetch latest data from API
                fetchRecentNotificationsAndRender();

                // Clear the badge count (mark all currently seen notifications as read)
                updateBadge(0); 
            } else {
                // CLOSE DROPDOWN
                notificationDropdown.classList.add('hidden');
            }
        });
        
        // Global click handler to close the dropdown when clicking outside
        document.addEventListener('click', (e) => {
            if (notificationDropdown && !notificationDropdown.classList.contains('hidden')) {
                // Check if the click was outside the icon and the dropdown itself
                if (notificationBellContainer && !notificationBellContainer.contains(e.target)) {
                    notificationDropdown.classList.add('hidden');
                }
            }
        });
    }


    // --- AUTH/ROUTING LOGIC ---
    document.getElementById('sidebar-logout-btn').addEventListener('click', () => logout());

    const token = localStorage.getItem('authToken');
    if (!token) {
        window.location.replace('login_page.html');
        return;
    }

    fetchMeAndRoute();

    window.addEventListener('hashchange', () => {
        const viewName = window.location.hash.substring(1);
        if (viewName) {
            routeTo(viewName, false);
        }
    });

    // 🎯 INITIALIZATION: Start the real-time subscription
    initializeRealTimeNotifications();
});


