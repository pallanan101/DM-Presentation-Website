// content_review.js (Finalized - Uses HTML Table Structure)

// --- CONFIGURATION ---


// --- GLOBAL FUNCTIONS (Called from HTML onclick) ---

/**
 * Handles switching from the queue list (table) to the specific task moderation list (page).
 */
let currentQueueId = null;

 const API_BASE_URL2 = 'https://www.arta-tsg.com:3001/api';
function showModerationTable(queueId, queueName) {
    // 1. Hide the Queue List Table Area
    const queueListArea = document.getElementById('content-review'); 
    
    // 2. Show the Pending Moderation List Page
    const taskTableArea = document.getElementById('pending-moderation-list-page'); 
    
    if (queueListArea) queueListArea.classList.add('hidden');
    if (taskTableArea) taskTableArea.classList.remove('hidden');
    currentQueueId = queueId;

    // This is where you would call the function to render the task list
    loadPendingTasks(queueId, queueName); 
    
    console.log(`Switched to task view for Queue ID: ${queueId}, Name: ${queueName}`);

}

/**
 * Handles navigation back from the task page to the main queue list table.
 */
function goBackToQueueList() {
    const queueListArea = document.getElementById('content-review'); 
    const taskTableArea = document.getElementById('pending-moderation-list-page');
    
    if (queueListArea) queueListArea.classList.remove('hidden');
    if (taskTableArea) taskTableArea.classList.add('hidden');

    loadContentReviewQueues();
    currentQueueId = null;
}


// --- API & RENDERING FUNCTIONS ---

async function loadContentReviewQueues() {
    // 🎯 FIX: Use the correct ID for the table body from your HTML
    const queueListBody = document.getElementById('queue-list-body');
    if (!queueListBody) {
        console.error("DOM Error: #queue-list-body not found. Queue list cannot load.");
        return;
    }
    
    queueListBody.innerHTML = '<tr><td colspan="4" class="px-6 py-4 text-sm text-gray-500 text-center">Loading queues...</td></tr>';

    try {
        const token = localStorage.getItem('authToken');
        const res = await fetch(`${API_BASE_URL2}/queues`, { 
            headers: { Authorization: `Bearer ${token}` }
        });
        
        const result = await res.json();
        const queues = result.queues || [];
        
        queueListBody.innerHTML = '';
        
        if (queues.length === 0) {
            queueListBody.innerHTML = '<tr><td colspan="4" class="px-6 py-4 text-sm text-gray-500 text-center">No moderation queues found.</td></tr>';
            return;
        }

        queues.forEach(queue => {
            const row = document.createElement('tr');
            row.className = 'hover:bg-gray-50 transition duration-150';
            
            const totalPending = queue.total_pending_count || 0;
            // Assuming the server returns assigned_count for the logged-in user
            const assignedToMe = queue.assigned_count || 0; 
            
            row.innerHTML = `
                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">${queue.queue_name} (${queue.queue_type})</td>
                <td class="px-6 py-4 whitespace-nowrap text-base font-semibold text-center text-red-600">${totalPending}</td>
                <td id="assigned-count-${queue.queue_id}" class="px-6 py-4 whitespace-nowrap text-base font-semibold text-center text-green-600">${assignedToMe}</td>
                <td class="px-6 py-4 whitespace-nowrap text-center text-sm font-medium">
                    <button class="text-indigo-600 hover:text-indigo-900 focus:outline-none" 
                            onclick="showModerationTable(${queue.queue_id}, '${queue.queue_name}')">
                        View My Tasks
                    </button>
                </td>
            `;
            queueListBody.appendChild(row);
        });

    } catch (err) {
        console.error('Failed to load queues:', err);
        queueListBody.innerHTML = '<tr><td colspan="4" class="px-6 py-4 text-sm text-red-500 text-center">Error loading queues. Please check the API status.</td></tr>';
    }
}

let violationOptions = [];

async function loadViolationOptions() {
  const token = localStorage.getItem('authToken');
  const resp = await fetch(`${API_BASE_URL2}/violations`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  const { success, violations } = await resp.json();
  if (success) {
    violationOptions = violations; 
  } else {
    console.error('Failed to load violations');
  }
}

// Call it when your app initializes
loadViolationOptions();

function renderViolationDropdown(selectedId, contentId) {
  return `
    <select id="violation-select-${contentId}" class="violation-select px-2 py-1 border rounded">
      
      ${violationOptions.map(v => `
        <option value="${v.violation_id}"
          ${v.violation_id === selectedId ? 'selected' : ''}>
          ${v.violation_name}
        </option>`).join('')}
    </select>`;
}



async function loadPendingTasks(queueId, queueName) {
  const container = document.getElementById('pending-moderation-list-page');
  if (!container) return;

  container.innerHTML = `
    <div class="mb-6">
      <button onclick="goBackToQueueList()" class="text-gray-600 hover:text-gray-900 font-medium flex items-center">
        ← Back to Queues
      </button>
    </div>
    <h2 class="text-2xl font-bold mb-6">${queueName} – Tasks Assigned to Me</h2>
    <div class="overflow-x-auto border rounded-lg bg-white shadow">
      <table class="min-w-full divide-y divide-gray-200">
        <thead class="bg-gray-50">
          <tr>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Content ID</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Content</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Submitted At</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Violation</th>
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

 
    const resp = await fetch(`${API_BASE_URL}/queues/${queueId}/tasks`, {
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
          No pending tasks assigned
        </td></tr>`;
      return;
    }

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
      <td class="px-6 py-4">
        ${renderViolationDropdown(task.violation_id, task.content_id)}
      </td>
      <td class="px-6 py-4 text-center space-x-2">
        <button
          class="px-3 py-1 bg-green-100 text-green-800 rounded"
          onclick="
            approve('${task.content_id}')
          ">
          Approve
        </button>
        <button
          class="px-3 py-1 bg-red-100 text-red-800 rounded"
          onclick="
            reject('${task.content_id}')
          ">
          Reject
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



async function approve(contentId) {
    
  console.log("to task :",contentId);
  const token = localStorage.getItem('authToken');
  const dropdown = document.getElementById(`violation-select-${contentId}`);
  const newViolationId = dropdown.value;

  try {
    const resp = await fetch(`${API_BASE_URL}/tasks/${contentId}/approve`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ violation_id: newViolationId })
    });
    const { success, message } = await resp.json();
    if (success) {
      document.getElementById(`task-${contentId}`).remove();
    } else {
      alert('Approve failed: ' + (message || 'Unknown error'));
    }
  } catch (err) {
    console.error(err);
    alert('Network error, try again');
  }
}

async function reject( contentId) {
  const token = localStorage.getItem('authToken');
  const dropdown = document.getElementById(`violation-select-${contentId}`);
  const newViolationId = dropdown.value;

  try {
    const resp = await fetch(`${API_BASE_URL}/tasks/${contentId}/reject`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ violation_id: newViolationId })
    });
    const { success, message } = await resp.json();
    if (success) {
      document.getElementById(`task-${contentId}`).remove();
    } else {
      alert('Reject failed: ' + (message || 'Unknown error'));
    }
  } catch (err) {
    console.error(err);
    alert('Network error, try again');
  }
}


// Placeholder functions (Ensure they are defined elsewhere or remain in this file)
function openMediaModal(url, mediaType) {
    // ... modal display logic ...
}
function closeMediaModal() {
    // ... modal hide logic ...
}


// --- GLOBAL WS INTEGRATION ---

/**
 * Subscribes to the global status updates handler to get real-time task count updates.
 */
function subscribeToGlobalUpdates() {
  if (typeof window.subscribeToTaskAssignments !== 'function') return;

  window.subscribeToTaskAssignments(task => {
    // Safety check
    if (!task) return;

    // Determine which view is visible
    const queueListArea  = document.getElementById('content-review');
    const taskTableArea  = document.getElementById('pending-moderation-list-page');
    const isQueueList    = queueListArea && !queueListArea.classList.contains('hidden');
    const isTaskTable    = taskTableArea && !taskTableArea.classList.contains('hidden');

    // A) If we’re on the queue-list page, refresh counts
    if (isQueueList) {
      loadContentReviewQueues();
    }

    // B) If we’re on the task table AND this assignment matches the open queue
    if (isTaskTable && currentQueueId !== null && task.queue_id === currentQueueId) {
      addOrUpdateTaskRow(task);
    }
  });
}


// // --- INITIALIZATION ---
//     // content_review.js
// document.addEventListener('task_assigned', e => {
//   const task = e.detail;               // { queue_id, content_id, … }
//   if (task.queue_id !== currentQueueId) {
//     return;                            // ignore other queues
//   }
//   addOrUpdateTaskRow(task);            // inject into the table
// });



document.addEventListener('DOMContentLoaded', () => {
    // The main function that loads and renders the queues into #queue-list-body
    loadContentReviewQueues();
    
    // Start listening for real-time updates without managing the socket connection itself
    subscribeToGlobalUpdates();
});