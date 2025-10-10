


async function loadContentReviewQueues() {
  const container = document.getElementById('content-review');
  container.innerHTML = ''; // Clear any existing content

  try {
    const token = localStorage.getItem('authToken');
    const res = await fetch('https://www.arta-tsg.com:3001/api/queues', {
      headers: { Authorization: `Bearer ${token}` }
    });

  const result = await res.json();
const queues = result.queues;
   console.log('📦 Raw response:', queues);
queues.forEach(queue => {
  const card = document.createElement('div');
  const isDark = (localStorage.getItem('theme') || 'dark') === 'dark';

card.classList.add(
  'dark-card',
  'nav-card',
  'p-6',
  'cursor-pointer',
  isDark ? 'bg-gray-700' : 'bg-gray-200',
  isDark ? 'text-gray-200' : 'text-gray-900'
);
  card.dataset.queueType = queue.queue_name;

  card.innerHTML = `
    <h3 class="text-xl font-semibold mb-2">${queue.queue_name}</h3>
    <p class="text-gray-500 mb-2">Pending tasks in this queue</p>
    <div class="flex justify-between items-center text-sm text-gray-500">
      <span>Tasks: <span class="font-medium">${queue.pending_count}</span></span>
      <span>Queue ID: ${queue.queue_id}</span>
    </div>
  `;

  card.addEventListener('click', () => {
showModerationTable(queue.queue_id, queue.queue_name);
  });

  container.appendChild(card);
});
  } catch (err) {
    console.error('Failed to load queues:', err);
    container.innerHTML = '<div class="text-red-500">Error loading moderation queues</div>';
  }
}







const violationOptions = {
  1: 'Spam',
  2: 'Harassment',
  3: 'Hate Speech',
  4: 'Misinformation',
  5: 'Offensive Content'
};
const lockedTasks = new Set();
    let socket;

function setupWebSocket() {
  const token = localStorage.getItem('authToken');
  if (!token) {
    console.warn('No auth token found. Skipping WebSocket connection.');
    return;
  }

  if (socket && socket.readyState === WebSocket.OPEN) return;

  socket = new WebSocket(`wss://www.arta-tsg.com:3001/?token=${token}`);

  socket.onmessage = (event) => {
    const msg = JSON.parse(event.data);
    if (msg.type === 'task_locked') {
      updateTaskHighlight(msg.task_id, true, msg.locked_by);
    } else if (msg.type === 'task_unlocked') {
      updateTaskHighlight(msg.task_id, false, 'Unassigned');
    }
  };

  socket.onopen = () => console.log('WebSocket connected');
  socket.onclose = () => console.warn('WebSocket disconnected');
}
  let currentQueueType = null;
  let pendingSortKey = 'task_id';
  let pendingSortDirection = 'asc';



document.addEventListener('DOMContentLoaded', () => {
  const token = localStorage.getItem('authToken');
  if (token) {
    setupWebSocket();
  }
});
document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('history-search-input').addEventListener('input', () => {
      loadModerationTasks();
    });

    document.getElementById('history-apply-filter-button').addEventListener('click', () => {
      loadModerationTasks();
    });

    document.querySelectorAll('.sortable-header').forEach(header => {
      header.addEventListener('click', () => {
        const key = header.dataset.sortKey;
        if (pendingSortKey === key) {
          pendingSortDirection = pendingSortDirection === 'asc' ? 'desc' : 'asc';
        } else {
          pendingSortKey = key;
          pendingSortDirection = 'asc';
        }
        loadModerationTasks();
      });
    });
    // setupWebSocket is now called after successful login in the script above
  });

  function showModerationTable(queueId, queueName) {
    currentQueueType = queueId;
    document.getElementById('content-review').style.display = 'none';
    document.getElementById('pending-moderation-list-page').classList.remove('hidden');
    document.getElementById('queue-title').textContent = `Tasks for ${queueName}`;
    loadModerationTasks();
  }

  function backToQueueList() {
    document.getElementById('pending-moderation-list-page').classList.add('hidden');
    document.getElementById('content-review').style.display = 'grid';
  }
// Inside the <script> tags in app3.1.html

async function loadModerationTasks() {
    const container = document.getElementById('pending-list-container');
    const searchTerm = document.getElementById('history-search-input').value.toLowerCase();
    const startDate = document.getElementById('history-start-date').value;
    const endDate = document.getElementById('history-end-date').value;

    // Define the temporary placeholder image URL
    const PLACEHOLDER_IMAGE_URL = 'https://i.pinimg.com/originals/19/51/dc/1951dc32a49c80597fa73876a70e9e1b.jpg'; // A simple "Play" icon placeholder

    try {
        const token = localStorage.getItem('authToken');
        const res = await fetch(`https://www.arta-tsg.com:3001/api/queues/${currentQueueType}/tasks`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        let result = await res.json();
        let tasks = Array.isArray(result) ? result : result.tasks || [];

        // ... (Filtering and Sorting logic remains the same)

        // Filter by date range
        if (startDate && endDate) {
            const start = new Date(startDate);
            const end = new Date(endDate);
            tasks = tasks.filter(task => {
                const taskDate = new Date(task.created_at);
                const inclusiveEnd = new Date(end);
                inclusiveEnd.setDate(inclusiveEnd.getDate() + 1); 
                return taskDate >= start && taskDate < inclusiveEnd;
            });
        }
        // Filter by search
        if (searchTerm) {
            tasks = tasks.filter(task =>
                task.task_id?.toString().toLowerCase().includes(searchTerm) ||
                task.content?.toLowerCase().includes(searchTerm) ||
                task.assigned_to?.toLowerCase().includes(searchTerm)
            );
        }

        // Sort
        tasks.sort((a, b) => {
            const aVal = (a[pendingSortKey] || '').toString().toLowerCase();
            const bVal = (b[pendingSortKey] || '').toString().toLowerCase();
            return pendingSortDirection === 'asc'
                ? aVal.localeCompare(bVal)
                : bVal.localeCompare(aVal);
        });

        // Render
        container.innerHTML = '';
        tasks.forEach(task => {
            const row = document.createElement('div');
            row.classList.add('pending-list-row');
            row.style.display = 'grid';
            row.style.gridTemplateColumns = '100px 400px 100px 120px 80px 150px 150px 300px';
            row.style.gap = '0.75rem';
            row.style.padding = '0.75rem 1rem';
            row.style.border = '1px solid #d1d5db'; 
            row.style.borderRadius = '0.5rem'; 
            row.style.marginBottom = '0.75rem'; 
            row.style.alignItems = 'center';
            row.dataset.taskId = task.task_id;

            const content = task.content || '';
            const queueId = currentQueueType;
            const assignedUser = task.assigned_to || 'Unassigned'; 

            if (assignedUser !== 'Unassigned') {
                lockedTasks.add(task.task_id);
            }

            let contentCellInnerHtml = `<span class="text-sm truncate">${([1, 2, 3, 6, 7].includes(queueId)) ? content : ''}</span>`;
             console.log('✅ queue id is : ', queueId);
            const baseRowContent = `
                <div style="display:flex;align-items:center;" class="text-xs">${task.task_id}</div>
                <div style="display:flex;align-items:center;" class="text-sm truncate content-cell">${contentCellInnerHtml}</div>
                <div style="display:flex;align-items:center;" class="text-sm">${task.source}</div>
                <div style="display:flex;align-items:center;" class="text-xs">${task.created_at}</div>
                <div style="display:flex;align-items:center;" class="text-sm">${task.status}</div>
                <select id="violation-${task.task_id}" class="text-sm px-2 py-1 rounded border bg-orange-400 ">
                    <option disabled value="0" ${!task.violation_id ? 'selected' : ''}>Select violation</option>
                    ${Object.entries(violationOptions).map(([val, label]) =>
                        `<option value="${val}" ${parseInt(val) === task.violation_id ? 'selected' : ''}>${label}</option>`).join('')}
                </select>
                <div style="display:flex;align-items:center;" class=" text-sm assigned-to-cell">${assignedUser}</div> 
                <div style="display:flex;align-items:center;" class="action-cell">
                    <button id="claimbutton-${task.task_id}" onclick="claimTask(${task.task_id})" class="bg-blue-600 hover:bg-blue-700 text-white text-xs px-3 py-1 rounded-full">Claim</button>
                    <button id="approve-${task.task_id}" onclick="resolveTask(${task.task_id}, 'Approved')" class="bg-gray-400 text-white text-xs px-3 py-1 rounded-full ml-2" disabled>Approve</button>
                    <button id="reject-${task.task_id}" onclick="resolveTask(${task.task_id}, 'Rejected')" class="bg-gray-400 text-white text-xs px-3 py-1 rounded-full ml-2" disabled>Reject</button>
                </div>
            `;

            if ([8, 9].includes(queueId)) {
                // Video Logic: 
                const videoId = content.includes('youtube.com') 
                    ? content.split('v=')[1]?.split('&')[0]
                    : content.match(/(youtu\.be\/|v=)([^&]+)/i)?.[2];
                
                const thumbnailURL = videoId ? `https://img.youtube.com/vi/${videoId}/0.jpg` : null;
                const embedUrl = videoId ? `https://www.youtube.com/embed/${videoId}` : content;


                // 🎯 FORCE TEMPORARY IMAGE: Use the placeholder image regardless of thumbnail success
                const mediaElement = `
                    <img 
                        src="${PLACEHOLDER_IMAGE_URL}" 
                        alt="Video Placeholder" 
                        class="cursor-pointer" 
                        style="width:100px;height:100px;object-fit:cover;border-radius:6px; border: 2px solid #ef4444;" 
                        onclick="event.stopPropagation(); openMediaModal('video', '${embedUrl}')">
                `;
                
                row.innerHTML = baseRowContent.replace(
                    `<div style="display:flex;align-items:center;" class="text-sm truncate content-cell">${contentCellInnerHtml}</div>`,
                    `<div style="display:flex;align-items:center;" class="content-cell">${mediaElement}</div>`
                );

            } else if ([4, 5].includes(queueId)) {
                // Image Logic (Existing logic)
                const isImage = content.match(/\.(jpg|jpeg|png|gif)$/i);
                const mediaElement = isImage 
                    ? `<img src="${content}" alt="Image" class="cursor-pointer" style="width:100px;height:100px;object-fit:cover;border-radius:6px;" onclick="event.stopPropagation(); openMediaModal('image', '${content}')">` 
                    : `<span class="text-gray-800 text-sm truncate">${content}</span>`;
                
                row.innerHTML = baseRowContent.replace(
                    `<div style="display:flex;align-items:center;" class="text-sm truncate content-cell">${contentCellInnerHtml}</div>`,
                    `<div style="display:flex;align-items:center;" class="content-cell">${mediaElement}</div>`
                );
            } else {
                 row.innerHTML = baseRowContent;
            }

            container.appendChild(row);

            if (assignedUser !== 'Unassigned') {
                updateTaskHighlight(task.task_id, true, assignedUser);
            } else {
                updateTaskHighlight(task.task_id, false, 'Unassigned'); 
            }
        });
    } catch (err) {
        console.error('Failed to load moderation tasks:', err);
        container.innerHTML = '<div class="text-red-500">Error loading tasks</div>';
    }
    await syncLockedTasks();
}

  async function syncLockedTasks() {
  const token = localStorage.getItem('authToken');
  try {
    const res = await fetch('https://www.arta-tsg.com:3001/api/task-locks', {
      headers: { Authorization: `Bearer ${token}` }
    });
    const result = await res.json();
    if (result.success) {
      result.locks.forEach(lock => {
        updateTaskHighlight(lock.task_id, true, lock.locked_by);
      });
    }
  } catch (err) {
    console.error('Failed to sync locked tasks:', err);
  }
}

function isDarkTheme() {
  return (localStorage.getItem('theme') || 'dark') === 'dark';
}
function updateRowStyle(row, isLocked) {
  const dark = isDarkTheme();

  // Clear all possible background/text classes first
  row.classList.remove('bg-gray-200', 'bg-gray-700', 'bg-gray-100', 'bg-red-100');
  row.classList.remove('text-gray-200', 'text-gray-700', 'text-gray-800');

  if (isLocked) {
    row.classList.add('bg-red-100', 'text-gray-700');
  } else {
    if (!dark) {
      row.classList.add('bg-gray-200', 'text-gray-900');
    } else {
      row.classList.add('bg-gray-700', 'text-gray-200');
    }
  }
}

  function updateTaskHighlight(taskId, isLocked, locked_by = null) {
    const row = document.querySelector(`.pending-list-row[data-task-id="${taskId}"]`);
    if (!row) return;

    const claimButton = document.getElementById(`claimbutton-${taskId}`);
    const approveButton = document.getElementById(`approve-${taskId}`);
    const rejectButton = document.getElementById(`reject-${taskId}`);
    const assignedCell = row.querySelector('.assigned-to-cell'); 

    if (isLocked) {
        lockedTasks.add(taskId);
        if (assignedCell) assignedCell.textContent = locked_by;
    } else {
        lockedTasks.delete(taskId);
        if (assignedCell) assignedCell.textContent = 'Unassigned';
    }

    const isClaimedByMe = isLocked && locked_by === currentUsername;

    // Visual highlight for *any* lock
    row.style.border = isLocked ? '2px solid #f87171' : '1px solid #d1d5db';
    
    updateRowStyle(row, isLocked);

    if (claimButton) {
        // Claim button is hidden if claimed by anyone (including self)
        claimButton.style.display = isLocked ? 'none' : 'block'; 
        claimButton.disabled = isLocked;
    }
    
    // Enable resolve buttons ONLY if claimed by current user
    if (approveButton && rejectButton) {
        const isReadyToResolve = isClaimedByMe;

        approveButton.disabled = !isReadyToResolve;
        rejectButton.disabled = !isReadyToResolve;

        // Change button visibility and color
        approveButton.style.display = isReadyToResolve ? 'inline-block' : 'none';
        rejectButton.style.display = isReadyToResolve ? 'inline-block' : 'none';
        
        approveButton.classList.toggle('bg-green-600', isReadyToResolve);
        approveButton.classList.toggle('bg-gray-400', !isReadyToResolve);
        rejectButton.classList.toggle('bg-red-600', isReadyToResolve);
        rejectButton.classList.toggle('bg-gray-400', !isReadyToResolve);
    }
}


async function resolveTask(taskId, action) {
    const token = localStorage.getItem('authToken');
    const violationSelect = document.getElementById(`violation-${taskId}`);
    
    // 🎯 FIX: Set violation_id to 0 for Approved action
    let violation_id = 0; 

    // Require a violation_id (1-5) only if the action is 'Rejected'
    if (action === 'Rejected') {
        violation_id = violationSelect?.value || null;
        if (!violation_id || violation_id === '0') {
             alert('Please select a violation before rejecting the task.');
             return;
        }
    } 
    if (action === 'Approved') {
        violation_id = null;
    }


  const res = await fetch(`https://www.arta-tsg.com:3001/api/tasks/${taskId}/resolve`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ action, violation_id })
  });

  const result = await res.json();
  if (result.success) {
    // Task is resolved, remove it from the view
    const row = document.querySelector(`.pending-list-row[data-task-id="${taskId}"]`);
    if (row) {
        row.remove();
    }
    const message = action === 'Approved' 
        ? `Task ${taskId} approved (Violation ID set to 0)!` 
        : `Task ${taskId} rejected! Violation ID: ${violation_id}`;
    alert(message);
    // loadModerationTasks(); // No need to reload, just remove the row
  } else {
    alert(result.message || 'Failed to resolve task');
  }
}


  async function claimTask(taskId) {
    const token = localStorage.getItem('authToken');
    const res = await fetch(`https://www.arta-tsg.com:3001/api/tasks/${taskId}/claim`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    const result = await res.json();
    if (result.success) {
        updateTaskHighlight(taskId, true, currentUsername);
    } else {
      alert(result.message || 'Failed to claim task');
    }
  }

// --- New Modal Functions ---

function openMediaModal(mediaType, url) {
    const modal = document.getElementById('media-modal');
    const contentArea = document.getElementById('modal-content-area');
    contentArea.innerHTML = ''; // Clear previous content

    if (mediaType === 'image') {
        contentArea.innerHTML = `<img src="${url}" alt="Full Image Preview" style="max-width: 100%; max-height: 80vh;">`;
    } else if (mediaType === 'video') {
        contentArea.innerHTML = `
            <iframe 
                width="800" 
                height="450" 
                src="${url}?autoplay=1" 
                frameborder="0" 
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                allowfullscreen>
            </iframe>
        `;
    }
    
    // Set display to flex to show the modal
    modal.style.display = 'flex';
}

function closeMediaModal(event) {
    // Check if the click was directly on the modal background. 
    // If event is not provided (clicked the X button) or the click target is the modal background, close it.
    if (event && event.target.id !== 'media-modal') {
        return; // Clicked inside the modal content, do nothing
    }

    const modal = document.getElementById('media-modal');
    const contentArea = document.getElementById('modal-content-area');
    
    // Stop video playback by clearing the content
    contentArea.innerHTML = '';
    
    // Hide the modal
    modal.style.display = 'none';
}
loadContentReviewQueues();
