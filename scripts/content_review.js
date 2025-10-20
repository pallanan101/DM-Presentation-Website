// content_review.js (Finalized - Uses HTML Table Structure)

// --- CONFIGURATION ---


// --- GLOBAL FUNCTIONS (Called from HTML onclick) ---

/**
 * Handles switching from the queue list (table) to the specific task moderation list (page).
 */
const tableBody = document.getElementById('queue-list-body');
const manualRefreshTrigger = document.getElementById('manual-refresh-trigger');
const lastUpdated = document.getElementById('last-updated');
const queueNameSearch = document.getElementById('queue-name-search');

const queueTypeFilter = document.getElementById('queue-type-filter');


const tableHeaders = document.querySelectorAll('#c-table thead th');


function refreshData() {

  lastUpdated.textContent = new Date().toLocaleTimeString();
}







/**
         * Starts the auto-refresh timer.
         */
function startAutoRefresh() {
  refreshData();
  refreshIntervalId = setInterval(refreshData, 10000); // 10 seconds interval
}

/**
 * Triggers a manual refresh and resets the auto-refresh timer.
 */
function handleManualRefresh() {
  clearInterval(refreshIntervalId); // Stop the current timer
  refreshData();                  // Perform the refresh immediately
  startAutoRefresh();             // Restart the timer
}

// --- Event Listeners ---

manualRefreshTrigger.addEventListener('click', handleManualRefresh);

startAutoRefresh();

// --- Search/Filter Logic ---

function applyFilters() {
  const nameFilter = queueNameSearch.value.toUpperCase();
  const typeFilter = queueTypeFilter.value.toUpperCase();
  const rows = tableBody.querySelectorAll('tr');

  let activeSort = document.querySelector('#c-table thead th.sort-asc, #c-table thead th.sort-desc');

  rows.forEach(row => {
    const queueName = row.cells[0].textContent.toUpperCase();
    console.log(row.dataset.queueType);
    const queueType = row.dataset.queueType.toUpperCase();

    const matchesName = queueName.includes(nameFilter);
    const matchesType = (typeFilter === '' || queueType === typeFilter);

    if (matchesName && matchesType) {
      row.style.display = '';
    } else {
      row.style.display = 'none';
    }
  });

  if (activeSort) {
    const columnIndex = parseInt(activeSort.dataset.columnIndex);
    const sortDirection = activeSort.dataset.sort;
    sortTable(columnIndex, sortDirection, true);
  }
}

queueNameSearch.addEventListener('keyup', applyFilters);
queueTypeFilter.addEventListener('change', applyFilters);

// --- Column Sorting Logic ---

function sortTable(columnIndex, sortDirection, isRefresh = false) {
  const rowsArray = Array.from(tableBody.querySelectorAll('tr'))
    .filter(row => row.style.display !== 'none');

  const isNumeric = (columnIndex === 2 || columnIndex === 3);

  rowsArray.sort((a, b) => {
    let aValue, bValue;

    if (isNumeric) {
      if (columnIndex === 2) {
        aValue = parseInt(a.cells[columnIndex].textContent);
        bValue = parseInt(b.cells[columnIndex].textContent);
      } else if (columnIndex === 3) {
        aValue = parseFloat(a.dataset.latencyMs);
        bValue = parseFloat(b.dataset.latencyMs);
      }
    } else {
      aValue = a.cells[columnIndex].textContent.toLowerCase();
      bValue = b.cells[columnIndex].textContent.toLowerCase();
    }

    if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
    if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
    return 0;
  });

  rowsArray.forEach(row => tableBody.appendChild(row));

  Array.from(tableBody.querySelectorAll('tr'))
    .filter(row => row.style.display === 'none')
    .forEach(row => tableBody.appendChild(row));
}

// Add event listeners to all sortable headers
tableHeaders.forEach(header => {
  if (header.classList.contains('sortable')) {
    header.addEventListener('click', function () {
      let currentSort = header.dataset.sort || 'none';
      let newSort = 'asc';

      if (currentSort === 'asc') newSort = 'desc';
      else if (currentSort === 'desc') newSort = 'asc';

      tableHeaders.forEach(h => {
        h.classList.remove('sort-asc', 'sort-desc');
        delete h.dataset.sort;
      });

      header.classList.add(`sort-${newSort}`);
      header.dataset.sort = newSort;

      const columnIndex = parseInt(header.dataset.columnIndex);
      sortTable(columnIndex, newSort);
    });
  }
});
























let currentQueueId = null;
let currentcat = null;
const API_BASE_URL2 = 'https://www.arta-tsg.com:3001/api';
function showModerationTable(queueId, queueName, category) {
  // 1. Hide the Queue List Table Area
  const queueListArea = document.getElementById('content-review');

  // 2. Show the Pending Moderation List Page
  const taskTableArea = document.getElementById('pending-moderation-list-page');

  if (queueListArea) queueListArea.classList.add('hidden');
  if (taskTableArea) taskTableArea.classList.remove('hidden');
  currentQueueId = queueId;
  currentcat = category;

  // This is where you would call the function to render the task list
  loadPendingTasks(queueId, queueName, category);

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
  currentcat = null;
}


function formatLatency(rawTime) {
  if (!rawTime) return '—';
  try {
    const date = new Date(rawTime);
    const hours = date.getUTCHours();
    const minutes = date.getUTCMinutes();

    const h = hours > 0 ? `${hours}h` : '';
    const m = minutes > 0 ? `${minutes}m` : '';
    return `${h} ${m}`.trim() || '0m';
  } catch {
    return 'Invalid time';
  }
}
function getLatencyColor(minutes) {


  const date = new Date(minutes);
  const hours = date.getUTCHours();
  const minute = date.getUTCMinutes();
  time = hours * 60 + minute;


  if (time < 5) return 'green';
  if (time <= 30) return 'yellow';
  if (time <= 60) return 'orange';
  if (time > 60) return 'red';
  return 'black';
}

// --- API & RENDERING FUNCTIONS ---

async function loadContentReviewQueues() {
  currentQueueId = null;
  currentcat = null;
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
    console.log("Queues Data Recieved : ", queues);
    queues.forEach(queue => {
      const row = document.createElement('tr');
      row.className = 'hover:bg-gray-50 transition duration-150';
      row.setAttribute('data-queue-type', queue.category);

      // Assuming the server returns assigned_count for the logged-in user
      const assignedToMe = queue.assigned_to_me_count || 0;


      const textColor = getLatencyColor(queue.latency);


      row.innerHTML = `
                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">${queue.queue_name} (${queue.queue_type})</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">${queue.category}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-${textColor}-700">${formatLatency(queue.latency)}</td>
                
                <td id="assigned-count-${queue.queue_id}" class="px-6 py-4 whitespace-nowrap text-base font-semibold text-center text-green-600">${assignedToMe}</td>
                <td class="px-6 py-4 whitespace-nowrap text-center text-sm font-medium">
                    <button class="text-indigo-600 hover:text-indigo-900 focus:outline-none" 
                            onclick="showModerationTable(${queue.queue_id}, '${queue.queue_name}','${queue.category}')">
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



async function loadPendingTasks(queueId, queueName, category) {
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


  const resp = await fetch(`${API_BASE_URL2}/queues/${queueId}/tasks`, {
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
  tasks.forEach(task => addOrUpdateTaskRow(task, category));



}
function openModal(contentType, contentUrl) {
  const modal = document.getElementById('content-modal');
  const mediaContainer = document.getElementById('modal-media');
  mediaContainer.innerHTML = '';

  if (contentType === 'Image') {
    mediaContainer.innerHTML = `<img src="${contentUrl}" alt="Preview" class="max-h-[400px] w-auto rounded">`;
  } else if (contentType === 'Video') {
    mediaContainer.innerHTML = `
      <video controls class="max-h-[400px] w-auto rounded">
        <source src="${contentUrl}" type="video/mp4">
        Your browser does not support the video tag.
      </video>
    `;
  }

  modal.classList.remove('hidden');
}

function closeModal() {
  document.getElementById('content-modal').classList.add('hidden');
}

// Optional: wire modal buttons to task actions
function approveModal() { /* logic */ }
function rejectModal() { /* logic */ }
function submitOnly() { /* logic */ }
function submitAndNext() { /* logic */ }

function addOrUpdateTaskRow(task, category) {
  const tbody = document.getElementById('task-list-body');
  const rowId = `task-${task.content_id}`;
  const existing = document.getElementById(rowId);

  let contentHTML = '';

  if (category === 'Image') {
    contentHTML = `
      <img src="${task.content}" alt="Image" class="h-16 cursor-pointer rounded"
        onclick="openModal('Image', '${task.content}')">
    `;
  } else if (category === 'Video') {
    contentHTML = `
      <img src="assets/play-thumbnail.png" alt="Video" class="h-16 cursor-pointer rounded"
        onclick="openModal('Video', '${task.content}')">
    `;
  } else {
    contentHTML = `<span>${task.content}</span>`;
  }

  const rowHTML = `
    <tr id="${rowId}">
      <td class="px-6 py-4">${task.content_id}</td>
      <td class="px-6 py-4">${contentHTML}</td>
      <td class="px-6 py-4">${new Date(task.created_at).toLocaleString()}</td>
      <td class="px-6 py-4">
        ${renderViolationDropdown(task.violation_id, task.content_id)}
      </td>
      <td class="px-6 py-4 text-center space-x-2">
        <button class="px-3 py-1 bg-green-100 text-green-800 rounded" onclick="approve('${task.content_id}')">Approve</button>
        <button class="px-3 py-1 bg-red-100 text-red-800 rounded" onclick="reject('${task.content_id}')">Reject</button>
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

  console.log("to task :", contentId);
  const token = localStorage.getItem('authToken');
  const dropdown = document.getElementById(`violation-select-${contentId}`);
  const newViolationId = dropdown.value;

  try {
    const resp = await fetch(`${API_BASE_URL2}/tasks/${contentId}/approve`, {
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

async function reject(contentId) {
  const token = localStorage.getItem('authToken');
  const dropdown = document.getElementById(`violation-select-${contentId}`);
  const newViolationId = dropdown.value;

  try {
    const resp = await fetch(`${API_BASE_URL2}/tasks/${contentId}/reject`, {
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




// --- GLOBAL WS INTEGRATION ---

/**
 * Subscribes to the global status updates handler to get real-time task count updates.
 */
function subscribeToGlobalUpdates() {
  if (typeof window.subscribeToTaskAssignments !== 'function') return;

  window.subscribeToTaskAssignments(payload => {
    const task = payload?.task;


    // Safety check
    console.log("recieved a task : ", task)
    if (!task) {
      console.log("task has no value")
      return;
    }

    // Determine which view is visible
    const queueListArea = document.getElementById('content-review');
    const taskTableArea = document.getElementById('pending-moderation-list-page');
    const isQueueList = queueListArea && !queueListArea.classList.contains('hidden');
    const isTaskTable = taskTableArea && !taskTableArea.classList.contains('hidden');
    const isSameQueue = String(task.queue_id) === String(currentQueueId);
    console.log("queueListArea : ", queueListArea);
    console.log("taskTableArea : ", taskTableArea);
    console.log("isQueueList : ", isQueueList);
    console.log("isTaskTable : ", isTaskTable);
    console.log("String(currentQueueId) : ", String(currentQueueId));
    console.log("String(task.queue_id) : ", String(task.queue_id));
    console.log("isSameQueue : ", isSameQueue);
    // A) If we’re on the queue-list page, refresh counts
    if (isQueueList) {
      loadContentReviewQueues();
    }

    // B) If we’re on the task table AND this assignment matches the open queue
    if (isTaskTable && isSameQueue) {
      addOrUpdateTaskRow(task, currentcat);

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