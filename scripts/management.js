// management.js

document.addEventListener('DOMContentLoaded', () => {
    const managementHome = document.getElementById('management-home');
    const subViewContainer = document.getElementById('management-sub-view');
    const pageTitleElement = document.getElementById('page-title');
    const navLinks = document.querySelectorAll('#nav-links a');
    
    // --- CONFIGURATION ---
    const API_BASE_URL = 'https://www.arta-tsg.com:3001/api'; // From main.js
    const WS_URL = 'wss://www.arta-tsg.com:3001'; // Based on server.js HTTPS/WS setup

    // Simulated moderator data for status display (since server.js only tracks task locks)
    let allModerators = [
        { username: 'admin', status: 'Online' },
        { username: 'moderator_a', status: 'Online' },
        { username: 'moderator_b', status: 'Offline' },
        { username: 'moderator_c', status: 'Offline' },
        { username: 'moderator_d', status: 'Online' },
    ];
    let managementWs = null;

    // --- View Management Functions ---

    /**
     * Resets the view to the initial three-card management home.
     */
    function goBackToHome() {
        // IMPORTANT: Close the WebSocket connection when leaving the view to clean up
        if (managementWs) {
            managementWs.close();
            managementWs = null;
        }
        
        subViewContainer.classList.add('hidden');
        managementHome.classList.remove('hidden');
        pageTitleElement.textContent = 'Management';
    }

    /**
     * Renders the content for the selected management sub-view.
     * Uses appendChild to avoid destroying event listeners (fixes the back button issue).
     */
    function renderSubView(viewId) {
        // 1. Clear previous content completely.
        subViewContainer.innerHTML = '';

        // 2. Create the back button, attach the listener, and append it.
        const backButton = document.createElement('button');
        backButton.className = 'flex items-center text-green-600 hover:text-green-700 mb-6 font-medium transition duration-150';
        backButton.innerHTML = '<i class="fas fa-arrow-left mr-2"></i> Back to Management Home';
        backButton.addEventListener('click', goBackToHome);
        subViewContainer.appendChild(backButton);

        // 3. Create a new container for view-specific content and append it.
        const contentDiv = document.createElement('div');
        
        switch (viewId) {
            case 'card-notification-center':
                renderNotificationCenter(contentDiv);
                break;
            case 'card-sensitive-words':
                contentDiv.innerHTML = `
                    <h2 class="text-2xl font-bold mb-4">Sensitive Words Configuration</h2>
                    <div class="p-6 bg-white rounded-lg shadow">
                        <p class="text-gray-500">Sensitive Words management UI coming soon. This is where you would edit the content filter.</p>
                    </div>
                `;
                break;
            case 'card-staff-management':
                // Call the new dedicated function
                renderStaffManagement(contentDiv); 
                break;
        }
        
        subViewContainer.appendChild(contentDiv);
    }
    
    // --- NOTIFICATION CENTER (Unchanged from previous successful response) ---
    function renderNotificationCenter(container) {
        container.innerHTML = `
            <h2 class="text-2xl font-bold mb-6">Notification Center</h2>
            
            <div class="flex">
                <div class="sub-view-tabs flex flex-col space-y-2 mr-6 min-w-[150px]">
                    <button id="noti-tab-create-new" class="active">Create New</button>
                    <button id="noti-tab-drafts">Drafts</button>
                    <button id="noti-tab-history">Notifications History</button>
                </div>
                
                <div id="noti-content-area" class="flex-grow">
                    <div class="notification-area border border-gray-200">
                        <div id="noti-create-new-content">
                            <input type="text" id="noti-title" placeholder="Title" class="w-full p-3 border border-gray-300 rounded-lg mb-4 focus:ring-green-500 focus:border-green-500">
                            <textarea id="noti-content" placeholder="Content" rows="15" class="w-full p-3 border border-gray-300 rounded-lg mb-6 focus:ring-green-500 focus:border-green-500 resize-none"></textarea>
                            <div class="flex justify-end space-x-3">
                                <button class="px-4 py-2 bg-gray-300 text-gray-800 font-semibold rounded-lg hover:bg-gray-400 transition duration-150">Save as Draft</button>
                                <button class="px-4 py-2 bg-green-500 text-white font-semibold rounded-lg hover:bg-green-600 transition duration-150">Submit</button>
                            </div>
                        </div>
                        <div id="noti-drafts-content" class="hidden p-4 text-gray-500">Drafts content coming soon...</div>
                        <div id="noti-history-content" class="hidden p-4 text-gray-500">Notifications History content coming soon...</div>
                    </div>
                </div>
            </div>
        `;
        
        // Setup Tab switching functionality
        const tabs = container.querySelectorAll('.sub-view-tabs button');
        const contentAreas = [
            container.querySelector('#noti-create-new-content'),
            container.querySelector('#noti-drafts-content'),
            container.querySelector('#noti-history-content')
        ];

        tabs.forEach(tab => {
            tab.addEventListener('click', (e) => {
                const targetId = e.target.id;
                tabs.forEach(t => t.classList.remove('active'));
                contentAreas.forEach(c => c.classList.add('hidden'));
                e.target.classList.add('active');
                if (targetId === 'noti-tab-create-new') contentAreas[0].classList.remove('hidden');
                else if (targetId === 'noti-tab-drafts') contentAreas[1].classList.remove('hidden');
                else if (targetId === 'noti-tab-history') contentAreas[2].classList.remove('hidden');
            });
        });
    }

    // --- STAFF MANAGEMENT IMPLEMENTATION (NEW) ---

    function renderStaffManagement(container) {
        container.innerHTML = `
            <h2 class="text-2xl font-bold mb-6">Staff Management Portal</h2>
            
            <div class="staff-tabs flex space-x-1 border-b border-gray-200">
                <button id="staff-tab-status" class="px-4 py-2 text-sm font-medium border-t border-r border-l active">Staff Status</button>
                <button id="staff-tab-queues" class="px-4 py-2 text-sm font-medium">Queue List</button>
            </div>

            <div id="staff-content-area" class="staff-area p-4 bg-white border border-t-0 rounded-b-lg shadow">
                <div id="staff-status-content">
                    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <div id="online-moderators-card" class="bg-gray-50 p-4 rounded-lg shadow-inner">
                            <h3 class="text-xl font-semibold mb-3 text-green-600 flex items-center"><i class="fas fa-circle text-xs mr-2"></i> Online Staff (<span id="online-count">0</span>)</h3>
                            <div id="online-list" class="space-y-2 max-h-96 overflow-y-auto">
                                <p class="text-gray-500">Loading online staff...</p>
                            </div>
                        </div>
                        <div id="offline-moderators-card" class="bg-gray-50 p-4 rounded-lg shadow-inner">
                            <h3 class="text-xl font-semibold mb-3 text-gray-500 flex items-center"><i class="far fa-circle text-xs mr-2"></i> Offline Staff (<span id="offline-count">0</span>)</h3>
                            <div id="offline-list" class="space-y-2 max-h-96 overflow-y-auto">
                                <p class="text-gray-500">Loading offline staff...</p>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div id="staff-queues-content" class="hidden">
                    <div id="queue-list-table-container">
                        <h3 class="text-xl font-semibold mb-3 text-blue-600">Active Moderation Queues</h3>
                        <div class="overflow-x-auto">
                            <table class="min-w-full divide-y divide-gray-200">
                                <thead class="bg-gray-50">
                                    <tr>
                                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Queue Name</th>
                                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Pending Tasks</th>
                                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Active Mods</th>
                                    </tr>
                                </thead>
                                <tbody id="queue-list-body" class="bg-white divide-y divide-gray-200">
                                    <tr><td colspan="3" class="px-6 py-4 text-sm text-gray-500 text-center">Loading queues...</td></tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                    <div id="queue-detail-view" class="hidden mt-6 p-4 border rounded-lg bg-gray-50">
                        <h4 id="queue-detail-title" class="text-lg font-bold mb-3">Moderators in Queue: [Queue Name]</h4>
                        <div id="queue-mod-list" class="space-y-2"></div>
                        <button id="queue-detail-back" class="mt-4 text-sm text-red-500 hover:text-red-700">← Back to Queue List</button>
                    </div>
                </div>

                <div id="user-task-history-modal" class="modal-backdrop hidden fixed inset-0 bg-gray-600 bg-opacity-75 flex items-center justify-center z-50">
                    <div class="modal-content bg-white p-6 rounded-lg shadow-xl w-11/12 max-w-2xl">
                        <div class="flex justify-between items-center mb-4 border-b pb-2">
                            <h3 id="history-modal-title" class="text-xl font-bold">Task History for [User]</h3>
                            <button class="text-gray-500 hover:text-gray-800 modal-close-btn"><i class="fas fa-times"></i></button>
                        </div>
                        <div id="history-modal-body" class="max-h-96 overflow-y-auto">
                            <p class="text-gray-500">Simulating task history data...</p>
                        </div>
                    </div>
                </div>
            </div>
        `;

        // Initialize tabs and data
        setupStaffTabs(container);
        updateStaffStatusUI();
        fetchQueueList(container);
        setupStaffWebSocket();
    }

    /**
     * Sets up tab switching for Staff Management and attaches click handlers for staff/modal.
     */
    function setupStaffTabs(container) {
        const tabs = container.querySelectorAll('.staff-tabs button');
        const statusContent = container.querySelector('#staff-status-content');
        const queuesContent = container.querySelector('#staff-queues-content');
        const staffArea = container.querySelector('#staff-content-area'); // Needed for child element lookups

        tabs.forEach(tab => {
            tab.addEventListener('click', (e) => {
                tabs.forEach(t => t.classList.remove('active'));
                e.target.classList.add('active');
                
                if (e.target.id === 'staff-tab-status') {
                    statusContent.classList.remove('hidden');
                    queuesContent.classList.add('hidden');
                } else {
                    statusContent.classList.add('hidden');
                    queuesContent.classList.remove('hidden');
                    // Ensure queue list refreshes when tab is clicked
                    fetchQueueList(container); 
                }
            });
        });

        // Attach click handlers for simulated task history modal and closing
        staffArea.addEventListener('click', (e) => {
            if (e.target.closest('.user-card-link')) {
                const username = e.target.closest('.user-card-link').dataset.username;
                showTaskHistoryModal(username, staffArea);
            }
            if (e.target.classList.contains('modal-close-btn') || e.target.closest('.modal-close-btn') || e.target.classList.contains('modal-backdrop')) {
                staffArea.querySelector('#user-task-history-modal').classList.add('hidden');
            }
        });
    }

    /**
     * Renders the online/offline staff lists based on current 'allModerators' data.
     */
    function updateStaffStatusUI() {
        // Need to use document.getElementById as the content is now rendered
        const onlineList = document.getElementById('online-list');
        const offlineList = document.getElementById('offline-list');
        const onlineCount = document.getElementById('online-count');
        const offlineCount = document.getElementById('offline-count');

        if (!onlineList || !offlineList) return; 

        onlineList.innerHTML = '';
        offlineList.innerHTML = '';
        
        const onlineMods = allModerators.filter(mod => mod.status === 'Online').sort((a,b) => a.username.localeCompare(b.username));
        const offlineMods = allModerators.filter(mod => mod.status === 'Offline').sort((a,b) => a.username.localeCompare(b.username));

        onlineCount.textContent = onlineMods.length;
        offlineCount.textContent = offlineMods.length;
        
        const isDark = localStorage.getItem('theme') === 'dark';
        
        const renderList = (mods, listElement, isOnline) => {
            if (mods.length === 0) {
                listElement.innerHTML = `<p class="text-gray-500 text-sm italic p-2">${isOnline ? 'No staff currently online.' : 'All registered staff are online!'}</p>`;
                return;
            }

            mods.forEach(mod => {
                const statusColor = isOnline ? 'text-green-500' : 'text-gray-400';
                const bgColor = isDark ? 'bg-gray-800' : 'bg-white';
                const hoverBg = isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-100';

                const item = document.createElement('div');
                item.className = `user-card-link flex items-center justify-between p-2 rounded-lg cursor-pointer transition duration-150 ${bgColor} ${hoverBg}`;
                item.dataset.username = mod.username;
                item.innerHTML = `
                    <div class="flex items-center space-x-3">
                        <i class="fas fa-user-circle text-2xl ${statusColor}"></i>
                        <span class="font-medium">${mod.username}</span>
                    </div>
                    <span class="text-xs ${isOnline ? 'text-green-500' : 'text-gray-500'}">${isOnline ? 'Active' : 'Offline'}</span>
                `;
                listElement.appendChild(item);
            });
        };
        
        renderList(onlineMods, onlineList, true);
        renderList(offlineMods, offlineList, false);
    }

    /**
     * Simulates showing a modal with user task history.
     */
    function showTaskHistoryModal(username, container) {
        const modal = container.querySelector('#user-task-history-modal');
        const title = container.querySelector('#history-modal-title');
        const body = container.querySelector('#history-modal-body');
        
        title.textContent = `Task History for ${username}`;
        
        // Simulated content for task history
        const historyData = [
            { task: 'T-1001', action: 'Approved', queue: 'Video Review', time: '2 mins ago' },
            { task: 'T-0995', action: 'Rejected', queue: 'Comment Filter', time: '1 hour ago' },
            { task: 'T-0988', action: 'Locked (Timeout)', queue: 'Image Mod', time: '3 hours ago' },
            { task: 'T-0980', action: 'Approved', queue: 'Video Review', time: 'Yesterday' },
        ];
        
        const tableRows = historyData.map(item => `
            <tr class="hover:bg-gray-100">
                <td class="px-4 py-2 whitespace-nowrap text-sm font-medium text-gray-900">${item.task}</td>
                <td class="px-4 py-2 whitespace-nowrap text-sm text-gray-500">
                    <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${item.action.includes('Approved') ? 'bg-green-100 text-green-800' : item.action.includes('Rejected') ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'}">
                        ${item.action}
                    </span>
                </td>
                <td class="px-4 py-2 whitespace-nowrap text-sm text-gray-500">${item.queue}</td>
                <td class="px-4 py-2 whitespace-nowrap text-sm text-gray-500">${item.time}</td>
            </tr>
        `).join('');
        
        body.innerHTML = `
            <div class="overflow-x-auto">
                <table class="min-w-full divide-y divide-gray-200">
                    <thead class="bg-gray-50">
                        <tr>
                            <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Task ID</th>
                            <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                            <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Queue</th>
                            <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Time</th>
                        </tr>
                    </thead>
                    <tbody class="bg-white divide-y divide-gray-200">${tableRows}</tbody>
                </table>
            </div>
        `;

        // Apply dark mode theme to modal
        const modalContent = modal.querySelector('.modal-content');
        const isDark = localStorage.getItem('theme') === 'dark';
        if (isDark) {
            modalContent.classList.remove('bg-white');
            modalContent.classList.add('bg-gray-700');
            // This is handled by management.css for general theme, but specific overrides might be needed
            // For tables inside:
            modalContent.querySelector('tbody').classList.remove('bg-white');
            modalContent.querySelector('tbody').classList.add('bg-gray-700');
            modalContent.querySelector('thead').classList.remove('bg-gray-50');
            modalContent.querySelector('thead').classList.add('bg-gray-800');
        } else {
            modalContent.classList.remove('bg-gray-700');
            modalContent.classList.add('bg-white');
            modalContent.querySelector('tbody').classList.remove('bg-gray-700');
            modalContent.querySelector('tbody').classList.add('bg-white');
            modalContent.querySelector('thead').classList.remove('bg-gray-800');
            modalContent.querySelector('thead').classList.add('bg-gray-50');
        }

        modal.classList.remove('hidden');
    }

    /**
     * Fetches the list of moderation queues from the API.
     */
    async function fetchQueueList(container) {
        const queueListBody = container.querySelector('#queue-list-body');
        if (!queueListBody) return;

        const token = localStorage.getItem('authToken');
        queueListBody.innerHTML = '<tr><td colspan="3" class="px-6 py-4 text-sm text-blue-500 text-center"><i class="fas fa-spinner fa-spin mr-2"></i> Fetching queues...</td></tr>';
        
        try {
            const response = await fetch(`${API_BASE_URL}/queues`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await response.json();
            
            if (response.ok && data.success) {
                renderQueueTable(data.queues, container);
            } else {
                queueListBody.innerHTML = `<tr><td colspan="3" class="px-6 py-4 text-sm text-red-500 text-center">Failed to load queues: ${data.message || 'API error'}</td></tr>`;
            }
        } catch (error) {
            console.error('Queue list fetch error:', error);
            queueListBody.innerHTML = '<tr><td colspan="3" class="px-6 py-4 text-sm text-red-500 text-center">Network error while fetching queues.</td></tr>';
        }
    }

    /**
     * Renders the queue table and attaches event listeners.
     */
    function renderQueueTable(queues, container) {
        const queueListBody = container.querySelector('#queue-list-body');
        const queueDetailBack = container.querySelector('#queue-detail-back');
        queueListBody.innerHTML = ''; 

        if (queues.length === 0) {
            queueListBody.innerHTML = '<tr><td colspan="3" class="px-6 py-4 text-sm text-gray-500 text-center">No active queues found.</td></tr>';
            return;
        }
        
        queues.forEach(queue => {
            const row = document.createElement('tr');
            row.className = 'queue-row hover:bg-gray-50 cursor-pointer transition duration-150';
            row.dataset.queueId = queue.queue_id;
            row.dataset.queueName = queue.queue_name;
            row.innerHTML = `
                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">${queue.queue_name}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${queue.pending_count}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-blue-500 hover:text-blue-700">Click to View Mods</td>
            `;

            row.addEventListener('click', () => {
                fetchQueueModerators(queue.queue_id, queue.queue_name, container);
            });
            queueListBody.appendChild(row);
        });
        
        queueDetailBack.addEventListener('click', () => {
            container.querySelector('#queue-list-table-container').classList.remove('hidden');
            container.querySelector('#queue-detail-view').classList.add('hidden');
        });
    }

    /**
     * Fetches moderators assigned to a specific queue.
     */
    async function fetchQueueModerators(queueId, queueName, container) {
        const token = localStorage.getItem('authToken');
        const modListView = container.querySelector('#queue-mod-list');
        const detailTitle = container.querySelector('#queue-detail-title');
        const detailView = container.querySelector('#queue-detail-view');
        const tableView = container.querySelector('#queue-list-table-container');

        tableView.classList.add('hidden');
        detailView.classList.remove('hidden');
        detailTitle.textContent = `Active Moderators in: ${queueName}`;
        modListView.innerHTML = '<p class="text-blue-500"><i class="fas fa-spinner fa-spin mr-2"></i> Fetching active moderators...</p>';

        try {
            // Use the existing /api/queues/:id/mods endpoint
            const response = await fetch(`${API_BASE_URL}/queues/${queueId}/mods`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await response.json();

            if (response.ok && data.success) {
                if (data.mods.length === 0) {
                    modListView.innerHTML = '<p class="text-gray-500">No moderators are currently assigned tasks in this queue.</p>';
                    return;
                }
                
                modListView.innerHTML = data.mods.map(mod => `
                    <div class="flex items-center space-x-3 p-2 border rounded-lg bg-white shadow-sm user-card-link" data-username="${mod.assigned_to}">
                        <i class="fas fa-user-tag text-green-500"></i>
                        <span class="font-medium cursor-pointer hover:text-green-600">${mod.assigned_to}</span>
                    </div>
                `).join('');

            } else {
                modListView.innerHTML = `<p class="text-red-500">Failed to load moderators: ${data.message || 'API error'}</p>`;
            }
        } catch (error) {
            console.error('Queue mods fetch error:', error);
            modListView.innerHTML = '<p class="text-red-500">Network error while fetching moderators.</p>';
        }
    }


    /**
     * Sets up a WebSocket connection for live staff status updates.
     * This simulates user_online/offline messages and also handles task updates.
     */
    function setupStaffWebSocket() {
        if (managementWs && managementWs.readyState === WebSocket.OPEN) {
            managementWs.close();
        }
        
        const token = localStorage.getItem('authToken');
        managementWs = new WebSocket(`${WS_URL}?token=${token}`);

        managementWs.onopen = () => {
            console.log('Staff Management WebSocket connected.');
            // Simulate an online/offline switch for a moderator for testing
            // setTimeout(() => {
            //     managementWs.send(JSON.stringify({ type: 'user_offline', username: 'moderator_a' }));
            // }, 5000);
        };

        managementWs.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                
                // Handle simulated presence updates
                if (data.type === 'user_online' || data.type === 'user_offline') {
                    const mod = allModerators.find(m => m.username === data.username);
                    if (mod) {
                        mod.status = data.type === 'user_online' ? 'Online' : 'Offline';
                        updateStaffStatusUI(); // Refresh the UI
                    }
                } 
                
                // Handle task lock/unlock messages (which affect queue count indirectly)
                if (data.type === 'task_locked' || data.type === 'task_unlocked') {
                    // Refresh the queue list only if the Queue List tab is currently visible
                    const staffQueuesContent = document.getElementById('staff-queues-content');
                    if (staffQueuesContent && !staffQueuesContent.classList.contains('hidden')) {
                        // The container for the main view must be passed here (subViewContainer's first child)
                        fetchQueueList(subViewContainer.firstElementChild.nextElementSibling); 
                    }
                }
                
            } catch (e) {
                console.error('Error parsing WebSocket message in management.js:', e);
            }
        };

        managementWs.onerror = (error) => {
            console.error('Staff Management WebSocket Error:', error);
        };

        managementWs.onclose = () => {
            console.log('Staff Management WebSocket disconnected.');
        };
    }

    // --- INITIALIZATION AND EVENT HANDLERS ---

    // Attach event listeners to the three cards
    document.querySelectorAll('.management-card').forEach(card => {
        card.addEventListener('click', (e) => {
            const cardId = e.currentTarget.id;
            const viewName = e.currentTarget.querySelector('h3').textContent;
            
            managementHome.classList.add('hidden');
            subViewContainer.classList.remove('hidden');
            pageTitleElement.textContent = viewName;

            renderSubView(cardId);
        });
    });

    // Initial check for the management link to set the title correctly on page load
    const managementLink = Array.from(navLinks).find(link => link.getAttribute('href') === 'management.html');
    if (managementLink && managementLink.classList.contains('active')) {
        pageTitleElement.textContent = 'Management';
    }
});