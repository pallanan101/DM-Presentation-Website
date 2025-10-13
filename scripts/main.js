
    

        // DOM element retrieval is safe here since the script is executed after the elements are defined in the HTML
        const sidebar = document.getElementById('sidebar');
        const themeToggle = document.getElementById('theme-toggle');
        const sidebarToggle = document.getElementById('sidebar-toggle');
        const body = document.body;

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
            const savedTheme = localStorage.getItem('theme') || 'dark'; 
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
                    currentUsername=data.user
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
            sendExplicitLogoutSignal(); 
 localStorage.removeItem('username');

            localStorage.removeItem('authToken'); 
            window.location.replace('login_page.html');
        }

 










  
        document.addEventListener('DOMContentLoaded', () => {
            // --- UI INITIALIZATION & EVENT LISTENERS (Theme & Sidebar) ---
            initializeTheme();
            initializeSidebar();
            
            themeToggle.addEventListener('click', toggleTheme);
            sidebarToggle.addEventListener('click', toggleSidebar);

            // --- NOTIFICATION HANDLER SETUP (The FIX) ---
            notificationButton.addEventListener('click', (event) => {
                event.stopPropagation(); // Stop event from propagating to document click
                if (notificationDropdown.classList.contains('hidden')) {
                    // OPEN DROPDOWN
                    renderNotificationList();
                    notificationDropdown.classList.remove('hidden');

                    // Mark as read and reset the badge
                    notifications.forEach(n => n.unread = false);
                    updateBadge(0);
                    renderNotificationList(); // Re-render to update the item style

                } else {
                    // CLOSE DROPDOWN
                    notificationDropdown.classList.add('hidden');
                }
            });

            // Close dropdown when clicking anywhere else on the document
            document.addEventListener('click', (event) => {
                if (!notificationDropdown.classList.contains('hidden') && !notificationButton.contains(event.target) && !notificationDropdown.contains(event.target)) {
                    notificationDropdown.classList.add('hidden');
                }
            });

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

            // 🎯 FIX: Start notification simulation after everything is loaded
            startSimulation();
        });
    
    














        // DOM element retrieval is safe here since the script is defined after the elements
        const notificationButton = document.getElementById('notification-button');
        const notificationBadge = document.getElementById('notification-badge');
        const notificationDropdown = document.getElementById('notification-dropdown');
        const notificationList = document.getElementById('notification-list');

        let notificationCount = 0;
        let notifications = []; // Stores the history of all received notifications

        // --- NOTIFICATION UTILITIES ---

        function updateBadge(count) {
            notificationCount = count;
            if (notificationCount > 0) {
                notificationBadge.textContent = notificationCount;
                notificationBadge.classList.remove('hidden');
            } else {
                notificationBadge.textContent = '';
                notificationBadge.classList.add('hidden');
            }
        }
        
        function getNotificationIcon(type) {
            switch (type) {
                case 'error': return { icon: 'fa-times-circle', color: 'text-red-500' };
                case 'warning': return { icon: 'fa-exclamation-triangle', color: 'text-yellow-500' };
                case 'info':
                default: return { icon: 'fa-info-circle', color: 'text-blue-500' };
            }
        }

        function renderNotificationList() {
            // Apply theme colors to dropdown itself
            const isDark = localStorage.getItem('theme') === 'dark';
            
            if (isDark) {
                notificationDropdown.classList.remove('bg-white', 'border-gray-200');
                notificationDropdown.classList.add('bg-gray-900', 'border-gray-700');
            } else {
                notificationDropdown.classList.remove('bg-gray-900', 'border-gray-700');
                notificationDropdown.classList.add('bg-white', 'border-gray-200');
            }
            
            // Filter to show only the last 10 (or a manageable number)
            const recentNotifications = notifications.slice(-10).reverse(); 
            
            notificationList.innerHTML = ''; // Clear previous list

            if (recentNotifications.length === 0) {
                notificationList.innerHTML = '<li class="p-4 text-gray-500 text-sm italic text-center">No recent notifications.</li>';
                return;
            }

            recentNotifications.forEach((n, index) => {
                const isUnread = n.unread;
                const { icon, color } = getNotificationIcon(n.type);
                
                const item = document.createElement('li');
                // Apply conditional dark mode classes on the list item
                const unreadBg = isDark ? 'bg-gray-800' : 'bg-green-50/50';
                const defaultBg = isDark ? 'bg-gray-900' : 'bg-white';
                const hoverBg = isDark ? 'hover:bg-gray-800' : 'hover:bg-gray-100';
                const itemTextColor = isDark ? 'text-gray-200' : 'text-gray-800';
                
                item.className = `p-3 flex items-start space-x-3 cursor-pointer border-b last:border-b-0 ${isUnread ? unreadBg : defaultBg} ${hoverBg} transition duration-100`;
                
                item.innerHTML = `
                    <i class="fas ${icon} ${color} mt-0.5"></i>
                    <div class="flex-grow">
                        <p class="${itemTextColor} text-sm ${isUnread ? 'font-semibold' : ''}">${n.message}</p>
                        <p class="text-gray-400 text-xs mt-1">${n.timestamp.toLocaleTimeString()}</p>
                    </div>
                `;
                
                item.addEventListener('click', (e) => {
                    // Prevent the click from bubbling up to the document click handler that closes the dropdown
                    e.stopPropagation(); 
                    if (n.unread) {
                        n.unread = false;
                        updateBadge(notificationCount > 0 ? notificationCount - 1 : 0);
                        renderNotificationList();
                    }
                });

                notificationList.appendChild(item);
            });
        }

        function handleNotificationReceived(message, type) {
            const newNotification = { 
                message, 
                timestamp: new Date(), 
                type, 
                unread: true 
            };
            
            notifications.push(newNotification);
            updateBadge(notificationCount + 1);
        }

        // --- SIMULATED REAL-TIME FEED ---
        const sampleNotifications = [
            { msg: "Task A-501 was automatically unlocked.", type: "warning" },
            { msg: "New high-priority task assigned: B-993.", type: "info" },
            { msg: "System maintenance starting in 5 min.", type: "info" },
            { msg: "Critical queue depth reached.", type: "error" },
            { msg: "User JohnDoe has locked Task C-202.", type: "info" }
        ];
        
        let simIndex = 0;
        function startSimulation() {
            // Trigger 3 initial notifications on load
            for (let i = 0; i < 3; i++) {
                 handleNotificationReceived(sampleNotifications[simIndex % sampleNotifications.length].msg, sampleNotifications[simIndex % sampleNotifications.length].type);
                 simIndex++;
            }
            
            // Continue simulation every 15 seconds
            setInterval(() => {
                const alert = sampleNotifications[simIndex % sampleNotifications.length];
                handleNotificationReceived(alert.msg, alert.type);
                simIndex++;
            }, 15000); 
        }

        