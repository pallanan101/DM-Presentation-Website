// management.js (Revised)

const API_URL = 'https://www.arta-tsg.com:3001/api';
// --- CONFIGURATION ---
const WS_URL = 'wss://www.arta-tsg.com:3001'; // Kept, but the connection is now handled globally

// Global state
let staffData = [];
let staffSortKey = 'username';
let staffSortDirection = 'asc';
let currentQID =null;
let currentQNAME = null;
// --- GLOBAL FUNCTIONS (Called from management.html's onclick) ---
function goBackToHome() {
    const managementHome = document.getElementById('management-home');
    const subViewContainer = document.getElementById('management-sub-view');
    const pageTitleElement = document.getElementById('page-title');

    if (managementHome && subViewContainer && pageTitleElement) {
        managementHome.classList.remove('hidden');
        subViewContainer.classList.add('hidden');
        pageTitleElement.textContent = 'Management Dashboard';
        
        const contentSections = document.querySelectorAll('#management-sub-view > div');
        contentSections.forEach(sec => {
            if (sec && sec.id !== 'back-button-container') {
                sec.classList.add('hidden');
            }
        });
    }
}











// function showManagementTasks(queueId, queueName) {
//     console.log(`Management: Showing all pending tasks for Queue ID: ${queueId}, Name: ${queueName}`);
//     alert(`Showing All Pending Tasks for ${queueName} (ID: ${queueId})`);
// }










function showUserTaskHistory(username) {
    console.log(`Management: Showing task history for User: ${username}`);
    alert(`Showing Task History for User: ${username}`);
}





function showManagementTasks(queueId, queueName) {
    // 1. Hide the Queue List Table Area
    const queueListArea = document.getElementById('all-queue-tbody'); 
    
    // 2. Show the Pending Moderation List Page
    const taskTableArea = document.getElementById('all-taskinqueue-tbody'); 
    
    if (queueListArea) queueListArea.classList.add('hidden');
    if (taskTableArea) taskTableArea.classList.remove('hidden');
    
    currentQID = queueId;
    currentQNAME = queueName;
    // This is where you would call the function to render the task list
    loadPendingTasks(queueId, queueName); 
    
    console.log(`Switched to task view for Queue ID: ${queueId}, Name: ${queueName}`);

}

function goBackToQueueList() {
    const queueListArea = document.getElementById('all-queue-tbody'); 
    const taskTableArea = document.getElementById('all-taskinqueue-tbody');
    
    if (queueListArea) queueListArea.classList.remove('hidden');
    if (taskTableArea) taskTableArea.classList.add('hidden');

    fetchQueueListSummary();
    currentQueueId = null;
    currentQNAME = null;
}

async function loadPendingTasks(queueId, queueName) {
  const container = document.getElementById('all-taskinqueue-tbody');
  if (!container) return;

  container.innerHTML = `
    <div class="mb-6">
      <button onclick="goBackToQueueList()" class="text-gray-600 hover:text-gray-900 font-medium flex items-center">
        ← Back to Queues
      </button>
    </div>
    <h2 class="text-2xl font-bold mb-6">${queueName} – Tasks </h2>
    <div class="overflow-x-auto border rounded-lg bg-white shadow">
      <table class="min-w-full divide-y divide-gray-200">
        <thead class="bg-gray-50">
          <tr>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Content ID</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Content</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Submitted At</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Source</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Assign To</th>    
            <th class="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Action</th>
          </tr>
        </thead>
        <tbody id="task-list-body" class="bg-white divide-y divide-gray-200">
          <tr>
            <td colspan="5" class="px-6 py-4 text-center text-gray-500">Fetching tasks…</td>
          </tr>
        </tbody>
      </table>
    </div>
  `;

  const body = document.getElementById('task-list-body');
  const token = localStorage.getItem('authToken');

 
    const resp = await fetch(`${API_URL}/queues/${queueId}/alltasks`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const { success, tasks, message } = await resp.json();

    if (!success) {
      body.innerHTML = `
        <tr><td colspan="5" class="px-6 py-4 text-center text-red-500">
          Error: ${message || 'Could not load tasks'}
        </td></tr>`;
      return;
    }
    if (tasks.length === 0) {
      body.innerHTML = `
        <tr><td colspan="5" class="px-6 py-4 text-center text-gray-500">
          No pending tasks 
        </td></tr>`;
      return;
    }
console.log(tasks);

    // Render rows
   body.innerHTML = '';
  tasks.forEach(task => addOrUpdateTaskRow(task));


  
}


function addOrUpdateTaskRow(task) {
  const tbody = document.getElementById('task-list-body');
  const rowId = `task-${task.content_id}`;
  const existing = document.getElementById(rowId);

  const rowHTML = `
    <tr id="${rowId}">
      <td class="px-6 py-4">${task.content_id}</td>
      <td class="px-6 py-4">${task.content}</td>
      <td class="px-6 py-4">${new Date(task.created_at).toLocaleString()}</td>

    <td class="px-6 py-4">${task.source}</td>
    <td class="px-6 py-4">${task.assigned_to}</td>
      <td class="px-6 py-4 text-center space-x-2">
        <button
          class="px-3 py-1 bg-green-100 text-green-800 rounded"
          onclick="
            openAssignModal('${task.content_id}')
          ">
          Assign
        </button>
      </td>
    </tr>
  `;

  if (existing) {
    existing.outerHTML = rowHTML;
  } else {
    tbody.insertAdjacentHTML('afterbegin', rowHTML);
  }
}








function openAssignModal( contentId) {
  // Build the modal’s HTML
  const modalHtml = `
    <div id="assign-modal" 
         style="
           position: fixed; inset: 0; 
           background: rgba(0,0,0,0.5); 
           display: flex; align-items: center; justify-content: center;
         ">
      <div style="
           background: white; 
           padding: 1.5rem; 
           border-radius: 0.5rem; 
           max-width: 400px; width: 100%;
           box-shadow: 0 2px 10px rgba(0,0,0,0.2);
         ">
        <h3 style="margin-bottom: 1rem; font-size: 1.25rem;">
          Assign Task ${contentId}
        </h3>
        <div style="max-height: 300px; overflow-y: auto; margin-bottom: 1rem;">
          <table style="width: 100%; border-collapse: collapse;">
            <thead>
              <tr>
                <th style="text-align: left; padding: 0.25rem;">User</th>
                <th style="text-align: left; padding: 0.25rem;">Status</th>
                <th style="padding: 0.25rem;"></th>
              </tr>
            </thead>
            <tbody>
              ${staffData.map(s => `
                <tr>
                  <td style="padding: 0.25rem;">${s.username}</td>
                  <td style="padding: 0.25rem;">
                    ${s.status === 'Online' 
                       ? '<span style="color:green">Online</span>' 
                       : '<span style="color:gray">Offline</span>'}
                  </td>
                  <td style="padding: 0.25rem; text-align: right;">
                    <button 
                      style="
                        padding: 0.25rem 0.5rem; 
                        background: #3b82f6; color: white; 
                        border: none; border-radius: 0.25rem;
                      "
                      onclick="assignToStaff('${currentQID}', '${contentId}', '${s.username}')">
                      Assign
                    </button>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
        <div style="text-align: right;">
          <button 
            style="
              padding: 0.25rem 0.5rem; 
              background: transparent; color: #555; 
              border: 1px solid #ccc; border-radius: 0.25rem;
            "
            onclick="closeAssignModal()">
            Cancel
          </button>
        </div>
      </div>
    </div>
  `;

  // Inject it
  document.body.insertAdjacentHTML('beforeend', modalHtml);
}

// --------------------------------------------------
// 2) Close the modal
// --------------------------------------------------
function closeAssignModal() {
  const modal = document.getElementById('assign-modal');
  if (modal) modal.remove();
}

// --------------------------------------------------
// 3) Perform the assignment & close the modal
// --------------------------------------------------
async function assignToStaff(queueId, contentId, assignee) {
  const token = localStorage.getItem('authToken');
  try {
    const resp = await fetch(
      `${API_URL}/queues/${queueId}/assign`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ contentId, assignee })
      }
    );
    const { success, task, message } = await resp.json();

    if (!success) {
      return alert('Assign failed: ' + (message || 'Unknown error'));
    }

    // Update your table immediately, if you’re on that queue
    if (typeof addOrUpdateTaskRow === 'function') {
      addOrUpdateTaskRow(task);
    }

    closeAssignModal();
    loadPendingTasks(queueId,currentQNAME);
  } catch (err) {
    console.error('Assign error:', err);
    alert('Network error while assigning');
  }
}











// --- API & RENDERING FUNCTIONS ---

async function fetchStaffDataAndRender() {
    const body = document.getElementById('staff-list-body');
    if (!body) return;

    // Use a safety check for the static table structure (assuming HTML is updated)
    const actualBody = document.getElementById('staff-list-body');
    if(actualBody) {
        actualBody.innerHTML = '<tr><td colspan="6" class="px-6 py-4 text-sm text-gray-500 text-center">Loading staff data...</td></tr>';
    }


    try {
        const token = localStorage.getItem('authToken');
        const res = await fetch(`${API_URL}/staff`, { // Now uses the defined API_URL
            headers: { Authorization: `Bearer ${token}` }
        });
        const result = await res.json();
        staffData = result.staff || [];
        
        renderStaffTable();
        setupStaffSorting();
        
        // 💡 NEW: Subscribe to the global WebSocket handler after initial fetch
        subscribeToGlobalStatusUpdates(); 

    } catch (err) {
        console.error('Failed to load staff data:', err);
        if (actualBody) {
            actualBody.innerHTML = '<tr><td colspan="6" class="px-6 py-4 text-sm text-red-500 text-center">Error loading staff data.</td></tr>';
        }
    }
}

function setupStaffSorting() {
    document.querySelectorAll('[id^="staff-sort-"]').forEach(header => {
        header.removeEventListener('click', handleStaffSort); 
        header.addEventListener('click', handleStaffSort);
    });
}

function handleStaffSort(e) {
    const key = e.currentTarget.dataset.sortKey;
    if (staffSortKey === key) {
        staffSortDirection = staffSortDirection === 'asc' ? 'desc' : 'asc';
    } else {
        staffSortKey = key;
        staffSortDirection = 'asc';
    }
    renderStaffTable();
}

function renderStaffTable() {
    const body = document.getElementById('staff-list-body');
    if (!body) return;
    body.innerHTML = '';

    // Sort logic
    staffData.sort((a, b) => {
        const aVal = (a[staffSortKey] || '').toString().toLowerCase();
        const bVal = (b[staffSortKey] || '').toString().toLowerCase();

        let comparison = 0;
        if (aVal > bVal) comparison = 1;
        else if (aVal < bVal) comparison = -1;

        return staffSortDirection === 'asc' ? comparison : comparison * -1;
    });

    if (staffData.length === 0) {
        body.innerHTML = '<tr><td colspan="6" class="px-6 py-4 text-sm text-gray-500 text-center">No staff members found.</td></tr>';
        return;
    }

    staffData.forEach(staff => {
        const isOnline = staff.status === 'Online';
        const statusClass = isOnline ? 'text-green-600' : 'text-gray-500';
        const iconClass = isOnline ? 'fas fa-circle' : 'far fa-circle';

        const row = document.createElement('tr');
        row.className = 'hover:bg-gray-50 transition duration-150';
        row.dataset.username = staff.username;

        const lastActive = staff.last_active ? new Date(staff.last_active).toLocaleString() : 'N/A';

        row.innerHTML = `
            <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">${staff.user_id || 'N/A'}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">${staff.username}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm ${statusClass} font-semibold">
                <i class="${iconClass} text-xs mr-2"></i> ${staff.status}
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${staff.role || 'Moderator'}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${lastActive}</td>
            <td class="px-6 py-4 whitespace-nowrap text-center text-sm font-medium">
                <button class="text-blue-600 hover:text-blue-900 focus:outline-none"
                        onclick="showUserTaskHistory('${staff.username}')">
                    View History
                </button>
            </td>
        `;
        body.appendChild(row);
    });
}



function switchNotificationTab(tabName) {
    // 1. Deactivate all tabs and hide all content
    document.querySelectorAll('.tab-link-notification').forEach(tab => {
        tab.classList.remove('border-blue-500', 'text-blue-600', 'font-semibold');
        tab.classList.add('border-transparent', 'text-gray-500', 'hover:border-gray-300', 'hover:text-gray-700');
    });
    document.querySelectorAll('.tab-content-notification').forEach(content => {
        content.classList.add('hidden');
    });

    // 2. Activate the selected tab
    let tabLink, tabContent;
    
    if (tabName === 'history') {
        tabLink = document.getElementById('tab-list-history');
        tabContent = document.getElementById('notification-history-tab');
        fetchNotificationsAndRender(); // Fetch data when switching to history
    } else if (tabName === 'send') {
        tabLink = document.getElementById('tab-send-new');
        tabContent = document.getElementById('notification-send-tab');
    } else if (tabName === 'system') {
        tabLink = document.getElementById('tab-system-config');
        tabContent = document.getElementById('notification-system-tab');
    }


    if (tabLink && tabContent) {
        tabLink.classList.add('border-blue-500', 'text-blue-600', 'font-semibold');
        tabLink.classList.remove('border-transparent', 'text-gray-500', 'hover:border-gray-300', 'hover:text-gray-700');
        tabContent.classList.remove('hidden');
    }
}

switchNotificationTab('history')

async function fetchQueueListSummary() {
    const body = document.getElementById('management-queue-list-body');
    
    if (!body) {
        console.error("DOM Error: #management-queue-list-body not found. Check management.html.");
        return;
    }

    body.innerHTML = '<tr><td colspan="3" class="px-6 py-4 text-sm text-gray-500 text-center">Loading all queues...</td></tr>';
    
    try {
        const token = localStorage.getItem('authToken');
        const res = await fetch(`${API_URL}/queues`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        
        const result = await res.json();
        const queues = result.queues || [];
        
        body.innerHTML = ''; 

        if (queues.length === 0) {
            body.innerHTML = '<tr><td colspan="3" class="px-6 py-4 text-sm text-gray-500 text-center">No active moderation queues found.</td></tr>';
            return;
        }

        queues.forEach(queue => {
            const row = document.createElement('tr');
            row.className = 'hover:bg-gray-50 transition duration-150';
            
            row.innerHTML = `
                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">${queue.queue_name} (${queue.queue_type})</td>
                <td class="px-6 py-4 whitespace-nowrap text-base font-semibold text-center text-red-600">${queue.total_pending_count}</td>
                <td class="px-6 py-4 whitespace-nowrap text-center text-sm font-medium">
                    <button class="text-blue-600 hover:text-blue-900 focus:outline-none" 
                            onclick="showManagementTasks(${queue.queue_id}, '${queue.queue_name}')">
                        View All Pending
                    </button>
                </td>
            `;
            body.appendChild(row);
        });
        
    } catch (err) {
        console.error('Failed to load management queues:', err);
        body.innerHTML = '<tr><td colspan="3" class="px-6 py-4 text-sm text-red-500 text-center">Error loading queues for management.</td></tr>';
    }
}


// --- MAIN VIEW LOGIC ---

function renderSubView(viewId) {
    // Existing Views
    const staffManagementMainView = document.getElementById('staff-management-main-view');
    const sensitiveWordsView = document.getElementById('sensitive-words-view');
    const notificationCenterView = document.getElementById('notification-center-view');

    // NEW Views
    const feedManagementView = document.getElementById('feed-management-view');
    const groupChatManagementView = document.getElementById('group-chat-management-view');


    // 1. Hide ALL views
    [staffManagementMainView, sensitiveWordsView, notificationCenterView, feedManagementView, groupChatManagementView].forEach(view => {
        if(view) view.classList.add('hidden');
    });

    // 2. Show the requested view
    if (viewId === 'card-staff-management') {
        if(staffManagementMainView) staffManagementMainView.classList.remove('hidden');
        // Assuming renderStaffManagement is your function to fetch/display staff data
        renderStaffManagement(); 
    } else if (viewId === 'card-sensitive-words') {
        if(sensitiveWordsView) sensitiveWordsView.classList.remove('hidden');
    } else if (viewId === 'card-notification-center') {
        if(notificationCenterView) notificationCenterView.classList.remove('hidden');
        // Assuming renderNotificationCenter initializes the notification tabs
        renderNotificationCenter(); 
    } 
    // NEW Views
    else if (viewId === 'card-feed-management') {
        if(feedManagementView) feedManagementView.classList.remove('hidden');
        console.log('Front Page Management View initialized.');
    } else if (viewId === 'card-gc-management') {
        if(groupChatManagementView) groupChatManagementView.classList.remove('hidden');
        console.log('Group Chat Management View initialized.');
    }
}

function renderNotificationCenter() {
    const notificationView = document.getElementById('notification-center-view');
    if (!notificationView) return;

    // 1. Show the view
    notificationView.classList.remove('hidden');

    // 2. Initialize Tab: Default to the 'history' tab
    switchNotificationTab('history');
}

function renderStaffManagement() { 
    const staffStatusContent = document.getElementById('staff-status-content-wrapper');
    const staffQueuesContent = document.getElementById('staff-queues-content');
    const staffTabStatus = document.getElementById('staff-tab-status');
    const staffTabQueues = document.getElementById('staff-tab-queues');
    
    if (!staffStatusContent || !staffQueuesContent || !staffTabStatus || !staffTabQueues) {
        console.error('CRITICAL: Missing static elements in staff management view. Check management.html');
        return;
    }

    fetchStaffDataAndRender();
    staffTabStatus.onclick = () => {
        staffTabQueues.classList.remove('active');
        staffTabStatus.classList.add('active');
        staffQueuesContent.classList.add('hidden');
        staffStatusContent.classList.remove('hidden');
        renderStaffTable(); 
    };
    
    staffTabQueues.onclick = () => {
        staffTabStatus.classList.remove('active');
        staffTabQueues.classList.add('active');
        staffStatusContent.classList.add('hidden');
        staffQueuesContent.classList.remove('hidden');
        
        fetchQueueListSummary(); 
    };
}




const textarea = document.getElementById('notification-recipient');
const suggestionBox = document.getElementById('recipient-suggestions');

textarea.addEventListener('input', () => {
  const value = textarea.value.trim();
  if (value.length > 0) {
    suggestionBox.classList.remove('hidden');
  } else {
    suggestionBox.classList.add('hidden');
  }
});

document.addEventListener('click', (e) => {
  if (!suggestionBox.contains(e.target) && e.target !== textarea) {
    suggestionBox.classList.add('hidden');
  }
});

function handleRecipientClick(selected) {
  const current = textarea.value.trim();

  if (selected === 'Everyone') {
    textarea.value = 'Everyone';
  } else {
    if (current === 'Everyone') {
      textarea.value = selected;
    } else {
      const recipients = current.split(',').map(r => r.trim()).filter(Boolean);
      if (!recipients.includes(selected)) {
        recipients.push(selected);
        textarea.value = recipients.join(', ');
      }
    }
  }

  suggestionBox.classList.add('hidden');
}

async function loadRecipientSuggestions() {
  try {
     const token = localStorage.getItem('authToken');
    const res = await fetch(`${API_URL}/users/list`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
    const data = await res.json();
    if (!data.success) return;
        
    suggestionBox.innerHTML = '';
    data.users.forEach(username => {
      const btn = document.createElement('button');
      btn.textContent = username;
      btn.className = 'block w-full text-left px-3 py-2 hover:bg-gray-100';
      btn.addEventListener('click', () => handleRecipientClick(username));
      suggestionBox.appendChild(btn);
    });
  } catch (err) {
    console.error('Failed to load suggestions:', err);
  }
}

loadRecipientSuggestions();


function processrecipients(recipient) {
  if (!recipient) return [];

  // Split by comma, trim each entry, and filter out empty strings
  const rawList = recipient
    .split(',')
    .map(r => r.trim())
    .filter(Boolean);

  // If 'Everyone' is present, return only that
  if (rawList.includes('Everyone')) {
    return ['Everyone'];
  }

  // Deduplicate and return
  return [...new Set(rawList)];
}

async function sendNotification(sender) {

    const title = document.getElementById('notification-title').value;
    const message = document.getElementById('notification-message').value.trim();
    const type = document.getElementById('notification-type').value;
    const recipient = document.getElementById('notification-recipient').value;


    const recipientList = processrecipients(recipient);// <----process recipient here  

    if (!message || !recipientList || !title) {
        alert('Missing Field! Need a Title, a message and a Recipient!.');
        return;
    }

    const originalBtnText = sender.textContent;
    sender.textContent = 'Sending...';
    sender.disabled = true;

    const token = localStorage.getItem('authToken');
    console.log('TItle : ', title);
console.log('message : ', message);
console.log('type: ', type);
console.log('recip : ', recipientList);
    try {
        const response = await fetch(`${API_URL}/notifications/send`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({title, message, type ,recipients: recipientList})
        });

        const data = await response.json();

        if (data.success) {
            alert('Notification sent and broadcasted successfully!');
            document.getElementById('notification-message').value = ''; // Clear message field
            title.value ='';
            recipient.value = '';
            // Switch to history tab to show the new notification immediately
            
        } else {
            alert(`Failed to send notification2: ${data.message || 'Server error'}`);
        }

    } catch (error) {
        console.error('Error sending notification:', error);
        alert('An unexpected error occurred while sending the notification. Check console for details.');
    } finally {
        sender.textContent = originalBtnText;
        sender.disabled = false;
    }
}

async function shownotifmessage(id) {
  try {
    const token = localStorage.getItem('authToken');
    const res = await fetch(`${API_URL}/notifications/${id}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    const data = await res.json();
    if (!data.success) {
      alert('Failed to load notification details.');
      return;
    }

    const notif = data.notification;

    // Populate modal content
    document.getElementById('notif-modal-title').textContent = notif.title;
    document.getElementById('notif-modal-sender').textContent = `From: ${notif.sender_username}`;
    document.getElementById('notif-modal-type').textContent = `Type: ${notif.type}`;
    document.getElementById('notif-modal-message').textContent = notif.message;

    // Show modal
    document.getElementById('notif-modal').classList.remove('hidden');
  } catch (err) {
    console.error('Error fetching notification:', err);
    alert('An error occurred while loading the notification.');
  }
}

/**
 * Fetches the list of past notifications and renders them.
 */
async function fetchNotificationsAndRender() {
    const body = document.getElementById('notification-list-body');
    if (!body) return;

    body.innerHTML = '<tr><td colspan="4" class="px-6 py-4 text-center text-gray-500">Fetching notifications...</td></tr>';

    const token = localStorage.getItem('authToken');
    

    try {
        const response = await fetch(`${API_URL}/notifications`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const { success, notifications, message } = await response.json();

        if (!success) {
            body.innerHTML = `<tr><td colspan="4" class="px-6 py-4 text-center text-red-500">Error: ${message || 'Could not load notifications'}</td></tr>`;
            return;
        }

        if (notifications.length === 0) {
            body.innerHTML = `<tr><td colspan="4" class="px-6 py-4 text-center text-gray-500">No past notifications found.</td></tr>`;
            return;
        }

        // Render rows
        body.innerHTML = notifications.map(n => {
            const date = new Date(n.created_at).toLocaleString();

            let typeColor = 'text-gray-600';
            if (n.type === 'info') typeColor = 'text-blue-600';
            if (n.type === 'warning') typeColor = 'text-yellow-600';
            if (n.type === 'error') typeColor = 'text-red-600';

            return `
                <tr onclick="shownotifmessage(${n.id})" class="cursor-pointer hover:bg-gray-400 transition">
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${date}</td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${n.sender_username}</td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm font-medium ${typeColor}">${n.type.toUpperCase()}</td>
                    <td class="px-6 py-4 text-sm text-gray-900 max-w-lg overflow-hidden text-ellipsis">${n.title}</td>
                </tr>
            `;
        }).join('');

    } catch (error) {
        console.error('Error fetching notifications:', error);
        body.innerHTML = `<tr><td colspan="4" class="px-6 py-4 text-center text-red-500">An error occurred while fetching data.</td></tr>`;
    }
}

// --- GLOBAL WS INTEGRATION ---

/**
 * Subscribes to the global status updates handler.
 * Only re-renders the table if the Staff Management tab is currently visible.
 */
function subscribeToGlobalStatusUpdates() {
    // Check if the global subscription function is available
    if (typeof window.subscribeToStatusUpdates === 'function') {
        window.subscribeToStatusUpdates((msg) => {
            if (msg.type !== 'staff_status_update') return;

            const staffManagementMainView = document.getElementById('staff-management-main-view');
            const staffStatusWrapper = document.getElementById('staff-status-content-wrapper');
            
            // Only update if we are viewing the staff status table
            if (staffManagementMainView && !staffManagementMainView.classList.contains('hidden') && 
                staffStatusWrapper && !staffStatusWrapper.classList.contains('hidden')) {

                const { username, status, last_active } = msg;
                
                // Update the local staffData array
                const staffIndex = staffData.findIndex(s => s.username === username);
                if (staffIndex !== -1) {
                    staffData[staffIndex].status = status;
                    staffData[staffIndex].last_active = last_active;
                    renderStaffTable();
                } else {
                    // Refetch all data if a new staff member appeared or was updated
                    fetchStaffDataAndRender();
                }
            }
        });
    }
}


// --- INITIALIZATION ---

document.addEventListener('DOMContentLoaded', () => {
    const managementHome = document.getElementById('management-home');
    const subViewContainer = document.getElementById('management-sub-view');
    const pageTitleElement = document.getElementById('page-title');

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
});