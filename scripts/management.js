// management.js

document.addEventListener('DOMContentLoaded', () => {
    // 1. Initial DOM element references
    const managementHome = document.getElementById('management-home');
    const subViewContainer = document.getElementById('management-sub-view');
    const pageTitleElement = document.getElementById('page-title');
    const navLinks = document.querySelectorAll('#nav-links a');
    
    // --- CONFIGURATION ---
    const API_BASE_URL = 'https://www.arta-tsg.com:3001/api'; 
    const WS_URL = 'wss://www.arta-tsg.com:3001'; 

    // Simulated moderator data for status display (Used for Staff Status Tab)
    let allModerators = [
        { username: 'admin', status: 'Online' },
        { username: 'moderator_a', status: 'Online' },
        { username: 'moderator_b', status: 'Offline' },
        { username: 'moderator_c', status: 'Offline' },
        { username: 'moderator_d', status: 'Online' },
        { username: 'moderator_e', status: 'Online' },
        { username: 'super_mod_1', status: 'Online' },
        { username: 'super_mod_2', status: 'Online' },
        { username: 'trainee_mod_1', status: 'Online' },
    ];
    let managementWs = null;
    let availableModerators = []; 
    let currentTaskToAssign = null; // Stores the task_id when the modal is open

    // --- View Management Functions ---

    /**
     * Resets the view to the initial three-card management home.
     */
    function goBackToHome() {
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
     */
    function renderSubView(viewId) {
        subViewContainer.innerHTML = '';

        const backButton = document.createElement('button');
        backButton.className = 'flex items-center text-green-600 hover:text-green-700 mb-6 font-medium transition duration-150';
        backButton.innerHTML = '<i class="fas fa-arrow-left mr-2"></i> Back to Management Home';
        backButton.addEventListener('click', goBackToHome);
        subViewContainer.appendChild(backButton);

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
                renderStaffManagement(contentDiv); 
                break;
        }
        
        subViewContainer.appendChild(contentDiv);
    }
    
    // --- NOTIFICATION CENTER (Unchanged) ---
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

    // --- STAFF MANAGEMENT IMPLEMENTATION ---

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
                    <div id="queue-list-view">
                        <h3 class="text-xl font-semibold mb-3 text-blue-600">Moderation Queues</h3>
                        <div class="overflow-x-auto">
                            <table class="min-w-full divide-y divide-gray-200">
                                <thead class="bg-gray-50">
                                    <tr>
                                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Queue Name</th>
                                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Pending Tasks</th>
                                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                                    </tr>
                                </thead>
                                <tbody id="queue-summary-body" class="bg-white divide-y divide-gray-200">
                                    <tr><td colspan="3" class="px-6 py-4 text-sm text-gray-500 text-center">Loading queues...</td></tr>
                                </tbody>
                            </table>
                        </div>
                    </div>

                    <div id="pending-tasks-view" class="hidden mt-6">
                        <button id="task-view-back" class="text-sm text-red-500 hover:text-red-700 mb-4">← Back to Queue Summary</button>
                        <h4 id="task-view-title" class="text-lg font-bold mb-3">Pending Tasks in: [Queue Name]</h4>
                        <div class="overflow-x-auto border rounded-lg">
                            <table class="min-w-full divide-y divide-gray-200">
                                <thead class="bg-gray-50">
                                    <tr>
                                        <th class="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Task ID</th>
                                        <th class="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Content Snippet</th>
                                        <th class="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Assigned To</th>
                                        <th class="px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Assign</th>
                                    </tr>
                                </thead>
                                <tbody id="pending-tasks-body" class="bg-white divide-y divide-gray-200">
                                    <tr><td colspan="4" class="px-4 py-3 text-sm text-gray-500 text-center">Select a queue to view tasks.</td></tr>
                                </tbody>
                            </table>
                        </div>
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
            
            <div id="assign-mod-modal" class="modal-backdrop hidden fixed inset-0 bg-gray-600 bg-opacity-75 flex items-center justify-center z-50">
                <div class="modal-content bg-white p-6 rounded-lg shadow-xl w-11/12 max-w-lg">
                    <div class="flex justify-between items-center mb-4 border-b pb-2">
                        <h3 class="text-xl font-bold">Assign Task <span id="assign-task-id-display"></span></h3>
                        <button class="text-gray-500 hover:text-gray-800 modal-close-btn-assign"><i class="fas fa-times"></i></button>
                    </div>
                    <div class="mb-4">
                        <input type="text" id="mod-search-input" placeholder="Search Online Moderators..." 
                               class="w-full p-2 border border-gray-300 rounded-lg focus:ring-green-500 focus:border-green-500">
                    </div>
                    <div id="available-mods-list" class="max-h-60 overflow-y-auto space-y-2">
                        </div>
                </div>
            </div>
            
        `;

        // Update available moderators list
        availableModerators = allModerators.filter(mod => mod.status === 'Online');

        // Initialize tabs and data
        setupStaffTabs(container);
        updateStaffStatusUI();
        fetchQueueListSummary(container); 
        setupStaffWebSocket();
        setupAssignModalHandlers(container);
    }
    
    // --- MODAL HANDLERS (ASSIGN) ---
    function setupAssignModalHandlers(container) {
        const modal = container.querySelector('#assign-mod-modal');
        const searchInput = container.querySelector('#mod-search-input');

        // Close button handler (for X and backdrop click)
        container.querySelectorAll('.modal-close-btn-assign, #assign-mod-modal.modal-backdrop').forEach(el => {
            el.addEventListener('click', (e) => {
                if (e.target.classList.contains('modal-backdrop') || e.target.closest('.modal-close-btn-assign')) {
                    modal.classList.add('hidden');
                    searchInput.value = ''; 
                }
            });
        });

        // Search input handler
        searchInput.addEventListener('input', (e) => {
            filterModeratorList(e.target.value, container);
        });

        // Assignment button delegation (listening on the list container)
        container.querySelector('#available-mods-list').addEventListener('click', (e) => {
            const modButton = e.target.closest('.assign-mod-item-btn');
            if (modButton && currentTaskToAssign) {
                const moderator = modButton.dataset.moderator;
                modal.classList.add('hidden'); 
                assignTaskToModerator(currentTaskToAssign, moderator, container);
            }
        });
        
        // Dark mode modal content fix (same as history modal fix)
        const modalContent = modal.querySelector('.modal-content');
        const isDark = localStorage.getItem('theme') === 'dark';
        if (isDark) {
            modalContent.classList.remove('bg-white');
            modalContent.classList.add('bg-gray-700');
            modalContent.querySelector('input').classList.remove('bg-white');
            modalContent.querySelector('input').classList.add('bg-gray-800', 'text-gray-50');
        } else {
            modalContent.classList.remove('bg-gray-700');
            modalContent.classList.add('bg-white');
            modalContent.querySelector('input').classList.remove('bg-gray-800', 'text-gray-50');
            modalContent.querySelector('input').classList.add('bg-white');
        }
    }

    /**
     * Opens the assignment modal and populates the list of available moderators.
     */
    function openAssignModal(taskId, container) {
        currentTaskToAssign = taskId;
        const modal = container.querySelector('#assign-mod-modal');
        container.querySelector('#assign-task-id-display').textContent = taskId;
        
        // Clear search and show all available mods initially
        container.querySelector('#mod-search-input').value = ''; 
        filterModeratorList('', container); 

        modal.classList.remove('hidden');
    }
    
    /**
     * Filters and renders the list of online moderators inside the modal.
     */
    function filterModeratorList(query, container) {
        const modListDiv = container.querySelector('#available-mods-list');
        const lowerCaseQuery = query.toLowerCase();
        
        const filteredMods = availableModerators.filter(mod => 
            mod.username.toLowerCase().includes(lowerCaseQuery)
        );

        if (filteredMods.length === 0) {
            modListDiv.innerHTML = `<p class="text-gray-500 p-2">No online moderators match "${query}".</p>`;
            return;
        }

        modListDiv.innerHTML = filteredMods.map(mod => `
            <button class="assign-mod-item-btn flex items-center justify-between w-full p-2 text-sm text-gray-700 bg-gray-50 rounded-lg hover:bg-green-100 transition duration-150"
                    data-moderator="${mod.username}">
                <span class="font-medium">${mod.username}</span>
                <span class="text-xs text-green-500">Online</span>
            </button>
        `).join('');
    }

    // --- TASK/QUEUE FUNCTIONS ---
    
    /**
     * Calls the API to assign (lock) a task to a specific moderator.
     */
    async function assignTaskToModerator(taskId, moderator, container) {
        const token = localStorage.getItem('authToken');
        
        // Find the specific button to update its text
        const assignButton = container.querySelector(`.assign-task-btn[data-task-id="${taskId}"]`);
        if (assignButton) {
            assignButton.innerHTML = `<i class="fas fa-spinner fa-spin"></i>`;
            assignButton.disabled = true;
        }

        try {
            const response = await fetch(`${API_BASE_URL}/tasks/lock`, {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}` 
                },
                body: JSON.stringify({ 
                    task_id: taskId, 
                    moderator: moderator 
                })
            });
            const data = await response.json();

            if (response.ok && data.success) {
                // Update UI visually 
                const taskRow = assignButton.closest('tr');
                if (taskRow) {
                     // Update Assigned To column
                    taskRow.children[2].textContent = moderator;
                    taskRow.children[2].classList.remove('text-red-500');
                    taskRow.children[2].classList.add('text-green-600');
                    
                    // Replace Assign button with 'Locked' status
                    taskRow.children[3].innerHTML = `<span class="text-xs text-gray-500 italic">Locked</span>`;
                }

                alert(`Successfully assigned Task ${taskId} to ${moderator}.`);

            } else {
                alert(`Assignment failed for Task ${taskId}: ${data.message || response.statusText || 'API error'}`);
                // Restore button on failure
                if (assignButton) {
                    assignButton.innerHTML = `Assign`;
                    assignButton.disabled = false;
                }
            }
        } catch (error) {
            console.error('Task assignment error:', error);
            alert('Network error during task assignment.');
            // Restore button on failure
            if (assignButton) {
                assignButton.innerHTML = `Assign`;
                assignButton.disabled = false;
            }
        }
    }
    
    /**
     * Fetches the list of moderation queues from the API.
     */
    async function fetchQueueListSummary(container) {
        const queueSummaryBody = container.querySelector('#queue-summary-body');
        if (!queueSummaryBody) return;

        const token = localStorage.getItem('authToken');
        queueSummaryBody.innerHTML = '<tr><td colspan="3" class="px-6 py-4 text-sm text-blue-500 text-center"><i class="fas fa-spinner fa-spin mr-2"></i> Fetching active queues from API...</td></tr>';
        
        try {
            const response = await fetch(`${API_BASE_URL}/queues`, { 
                headers: { 
                    'Authorization': `Bearer ${token}` 
                }
            });
            const data = await response.json();
            
            if (response.ok && data.success) {
                renderQueueSummaryTable(data.queues, container);
            } else {
                queueSummaryBody.innerHTML = `<tr><td colspan="3" class="px-6 py-4 text-sm text-red-500 text-center">Failed to load queues: ${data.message || response.statusText || 'API error'}</td></tr>`;
            }
        } catch (error) {
            console.error('Queue list fetch error:', error);
            queueSummaryBody.innerHTML = '<tr><td colspan="3" class="px-6 py-4 text-sm text-red-500 text-center">Network error while fetching queues. Check API server status.</td></tr>';
        }
    }

    /**
     * Renders the queue summary table and attaches event listeners.
     */
    function renderQueueSummaryTable(queues, container) {
        const queueSummaryBody = container.querySelector('#queue-summary-body');
        const taskViewBack = container.querySelector('#task-view-back');
        queueSummaryBody.innerHTML = ''; 

        if (queues.length === 0) {
            queueSummaryBody.innerHTML = '<tr><td colspan="3" class="px-6 py-4 text-sm text-gray-500 text-center">No active queues found.</td></tr>';
            return;
        }
        
        queues.forEach(queue => {
            const row = document.createElement('tr');
            row.className = 'queue-summary-row hover:bg-gray-50 transition duration-150';
            row.innerHTML = `
                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">${queue.queue_name}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${queue.pending_count}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-blue-500">
                    <button class="view-tasks-btn text-xs px-2 py-1 bg-blue-100 text-blue-800 rounded-full hover:bg-blue-200"
                            data-queue-id="${queue.queue_id}" 
                            data-queue-name="${queue.queue_name}">
                        View Tasks
                    </button>
                </td>
            `;
            queueSummaryBody.appendChild(row);
        });

        // Attach click listener for "View Tasks" buttons
        container.querySelectorAll('.view-tasks-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const queueId = e.target.dataset.queueId;
                const queueName = e.target.dataset.queueName;
                fetchPendingTasksByQueue(queueId, queueName, container);
            });
        });
        
        // Attach click listener for "Back" button on task view
        taskViewBack.addEventListener('click', () => {
            container.querySelector('#queue-list-view').classList.remove('hidden');
            container.querySelector('#pending-tasks-view').classList.add('hidden');
        });
    }

    /**
     * Fetches pending tasks for a specific queue.
     * **FIXED: Corrected API route to match backend: /api/queues/:id/tasks**
     */
    async function fetchPendingTasksByQueue(queueId, queueName, container) {
        const token = localStorage.getItem('authToken');
        const tasksBody = container.querySelector('#pending-tasks-body');
        const taskViewTitle = container.querySelector('#task-view-title');
        const taskListView = container.querySelector('#queue-list-view');
        const pendingTasksView = container.querySelector('#pending-tasks-view');

        taskListView.classList.add('hidden');
        pendingTasksView.classList.remove('hidden');
        taskViewTitle.textContent = `Pending Tasks in: ${queueName}`;
        tasksBody.innerHTML = '<tr><td colspan="4" class="px-4 py-3 text-sm text-blue-500 text-center"><i class="fas fa-spinner fa-spin mr-2"></i> Fetching tasks from API...</td></tr>';
        
        try {
            // Corrected route: removed '/pending'
            const response = await fetch(`${API_BASE_URL}/queues/${queueId}/tasks`, {
                headers: { 
                    'Authorization': `Bearer ${token}` 
                }
            });

            // 1. Check for non-OK status (4xx or 5xx)
            if (!response.ok) {
                const contentType = response.headers.get("content-type");
                const isJson = contentType && contentType.includes("application/json");

                if (!isJson) {
                    const errorText = await response.text();
                    console.error('API Error Response Text:', errorText);
                    tasksBody.innerHTML = `<tr><td colspan="4" class="px-4 py-3 text-sm text-red-500 text-center">API Error (${response.status} ${response.statusText}): Server returned **HTML** instead of JSON. Check the server logs or confirm the API route: **${API_BASE_URL}/queues/${queueId}/tasks**</td></tr>`;
                    return;
                }
            }

            // 2. Parse JSON
            const data = await response.json();
            
            if (response.ok && data.success) {
                 if (data.tasks.length === 0) {
                    tasksBody.innerHTML = `<tr><td colspan="4" class="px-4 py-3 text-sm text-gray-500 text-center">No pending tasks currently available for this queue.</td></tr>`;
                    return;
                }
                renderPendingTasks(data.tasks, container);
            } else {
                tasksBody.innerHTML = `<tr><td colspan="4" class="px-4 py-3 text-sm text-red-500 text-center">Failed to load tasks: ${data.message || response.statusText || 'API error'}</td></tr>`;
            }

        } catch (error) {
            console.error('Pending tasks fetch error:', error);
            tasksBody.innerHTML = '<tr><td colspan="4" class="px-4 py-3 text-sm text-red-500 text-center">Network or JSON Parsing Error. The server likely returned a non-JSON response (e.g., a login page or 404 HTML). Please check the API server logs.</td></tr>';
        }
    }

    /**
     * Renders the list of pending tasks and sets up the Assign buttons to open the modal.
     */
    function renderPendingTasks(tasks, container) {
        const tasksBody = container.querySelector('#pending-tasks-body');
        tasksBody.innerHTML = '';
        
        tasks.forEach(task => {
            const isAssigned = !!task.assigned_to;
            
            const row = document.createElement('tr');
            row.className = 'hover:bg-gray-50 transition duration-150';
            row.innerHTML = `
                <td class="px-4 py-2 whitespace-nowrap text-sm font-medium text-gray-900">${task.task_id}</td>
                <td class="px-4 py-2 text-sm text-gray-500 max-w-xs truncate">${task.content}</td>
                <td class="px-4 py-2 whitespace-nowrap text-sm ${isAssigned ? 'text-green-600' : 'text-red-500'}">
                    ${isAssigned ? task.assigned_to : 'Unassigned'}
                </td>
                <td class="px-4 py-2 whitespace-nowrap text-center">
                    ${isAssigned 
                        ? `<span class="text-xs text-gray-500 italic">Locked</span>`
                        : `<button class="assign-task-btn text-xs px-2 py-1 bg-green-500 text-white rounded-md hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
                                data-task-id="${task.task_id}">
                            Assign
                        </button>`
                    }
                </td>
            `;
            tasksBody.appendChild(row);
        });

        // Attach event listeners for the new Assign buttons
        container.querySelectorAll('.assign-task-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const taskId = e.target.dataset.taskId;
                openAssignModal(taskId, container); // Open the new modal
            });
        });
    }

    // --- STAFF STATUS & HISTORY MODAL FUNCTIONS (Unchanged) ---
    
    function setupStaffTabs(container) {
        const tabs = container.querySelectorAll('.staff-tabs button');
        const statusContent = container.querySelector('#staff-status-content');
        const queuesContent = container.querySelector('#staff-queues-content');
        const staffArea = container.querySelector('#staff-content-area');

        tabs.forEach(tab => {
            tab.addEventListener('click', (e) => {
                tabs.forEach(t => t.classList.remove('active'));
                e.target.classList.add('active');
                
                if (e.target.id === 'staff-tab-status') {
                    statusContent.classList.remove('hidden');
                    queuesContent.classList.add('hidden');
                    updateStaffStatusUI(); 
                } else {
                    statusContent.classList.add('hidden');
                    queuesContent.classList.remove('hidden');
                    fetchQueueListSummary(container); 
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

    function updateStaffStatusUI() {
        const onlineList = document.getElementById('online-list');
        const offlineList = document.getElementById('offline-list');
        const onlineCount = document.getElementById('online-count');
        const offlineCount = document.getElementById('offline-count');

        if (!onlineList || !offlineList) return; 

        onlineList.innerHTML = '';
        offlineList.innerHTML = '';
        
        availableModerators = allModerators.filter(mod => mod.status === 'Online');

        const onlineMods = availableModerators.sort((a,b) => a.username.localeCompare(b.username));
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
    
    function showTaskHistoryModal(username, container) {
        const modal = container.querySelector('#user-task-history-modal');
        const title = container.querySelector('#history-modal-title');
        const body = container.querySelector('#history-modal-body');
        
        title.textContent = `Task History for ${username}`;
        
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

        const modalContent = modal.querySelector('.modal-content');
        const isDark = localStorage.getItem('theme') === 'dark';
        if (isDark) {
            modalContent.classList.remove('bg-white');
            modalContent.classList.add('bg-gray-700');
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

    // --- WEBSOCKETS (Unchanged) ---
    function setupStaffWebSocket() {
        if (managementWs && managementWs.readyState === WebSocket.OPEN) {
            managementWs.close();
        }
        
        const token = localStorage.getItem('authToken');
        managementWs = new WebSocket(`${WS_URL}?token=${token}`);

        managementWs.onopen = () => {
            console.log('Staff Management WebSocket connected.');
        };

        managementWs.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                
                if (data.type === 'user_online' || data.type === 'user_offline') {
                    const mod = allModerators.find(m => m.username === data.username);
                    if (mod) {
                        mod.status = data.type === 'user_online' ? 'Online' : 'Offline';
                        updateStaffStatusUI(); 
                    }
                } 
                
                if (data.type === 'task_unlocked' || data.type === 'task_locked' || data.type === 'task_completed') {
                    const staffQueuesContent = document.getElementById('staff-queues-content');
                    if (staffQueuesContent && !staffQueuesContent.classList.contains('hidden')) {
                        // Pass the container element to the fetch function
                        fetchQueueListSummary(document.getElementById('staff-content-area').closest('div'));
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

    const managementLink = Array.from(navLinks).find(link => link.getAttribute('href') === 'management.html');
    if (managementLink && managementLink.classList.contains('active')) {
        pageTitleElement.textContent = 'Management';
    }
});