/**
 * Hostel Management System - Room Management Controller
 */

let allRoomsList = [];
let currentAssignRoomId = null;

// Load Rooms with search & filters
async function loadRooms() {
  const container = document.getElementById('rooms-grid-container');
  if (!container) return;

  container.innerHTML = `<div class="loading-container" style="grid-column: 1/-1;"><span class="spinner"></span><span>Loading hostel rooms...</span></div>`;

  const search = document.getElementById('room-search') ? document.getElementById('room-search').value.trim() : '';
  const block = document.getElementById('filter-room-block') ? document.getElementById('filter-room-block').value : 'All';
  const status = document.getElementById('filter-room-status') ? document.getElementById('filter-room-status').value : 'All';
  const type = document.getElementById('filter-room-type') ? document.getElementById('filter-room-type').value : 'All';

  let query = '?';
  if (search) query += `&search=${encodeURIComponent(search)}`;
  if (block && block !== 'All') query += `&block=${encodeURIComponent(block)}`;
  if (status && status !== 'All') query += `&status=${encodeURIComponent(status)}`;
  if (type && type !== 'All') query += `&roomType=${encodeURIComponent(type)}`;

  try {
    const res = await API.request(`/rooms${query}`);
    if (!res.success) throw new Error(res.message);

    allRoomsList = res.data;
    renderRooms(res.data);
  } catch (err) {
    container.innerHTML = `<div class="empty-state" style="grid-column: 1/-1;"><div class="empty-state-icon"><i class="fa-solid fa-door-closed"></i></div><div class="empty-state-title">Failed to load rooms</div><p class="empty-state-text">${escapeHtml(err.message)}</p></div>`;
  }
}

// Render Room Cards
function renderRooms(rooms) {
  const container = document.getElementById('rooms-grid-container');
  const countEl = document.getElementById('total-rooms-count');
  if (countEl) countEl.textContent = `Total: ${rooms.length} Rooms`;

  if (!rooms || rooms.length === 0) {
    container.innerHTML = `
      <div class="empty-state" style="grid-column: 1/-1;">
        <div class="empty-state-icon"><i class="fa-solid fa-bed"></i></div>
        <div class="empty-state-title">No Rooms Found</div>
        <p class="empty-state-text">No hostel rooms match your search criteria. Add a new room to get started.</p>
      </div>
    `;
    return;
  }

  container.innerHTML = rooms.map(r => {
    const occPct = r.capacity > 0 ? Math.round((r.occupiedBeds / r.capacity) * 100) : 0;
    const isFull = r.occupiedBeds >= r.capacity;
    const statusClass = r.status.toLowerCase().replace(/\s+/g, '-');

    return `
      <div class="room-card">
        <div class="room-card-header">
          <div>
            <div class="room-number">Room ${escapeHtml(r.roomNumber)}</div>
            <div style="font-size:0.75rem; color:var(--text-light);">Block ${escapeHtml(r.block)} &bull; Floor ${r.floor}</div>
          </div>
          <span class="badge badge-${statusClass}">${r.status}</span>
        </div>

        <div style="font-size:0.8125rem; color:var(--text-muted); margin-bottom:0.5rem;">
          <div><strong>Type:</strong> ${escapeHtml(r.roomType)} (${escapeHtml(r.gender || 'Any')})</div>
        </div>

        <div class="occupancy-bar-container">
          <div class="occupancy-bar">
            <div class="occupancy-fill ${isFull ? 'full' : (occPct === 0 ? 'empty' : '')}" style="width: ${occPct}%;"></div>
          </div>
          <div class="occupancy-text">
            <span>Occupancy</span>
            <span><strong>${r.occupiedBeds}</strong> / ${r.capacity} Beds</span>
          </div>
        </div>

        <div style="margin-top:0.75rem; border-top:1px solid #f1f5f9; padding-top:0.75rem;">
          <div style="font-size:0.75rem; font-weight:700; color:var(--text-muted); margin-bottom:0.35rem;">
            ASSIGNED STUDENTS (${r.students.length})
          </div>
          ${r.students.length > 0 ? `
            <div style="display:flex; flex-direction:column; gap:0.35rem; max-height:100px; overflow-y:auto; margin-bottom:0.75rem;">
              ${r.students.map(s => `
                <div style="display:flex; align-items:center; justify-content:space-between; font-size:0.75rem; background:#f8fafc; padding:3px 6px; border-radius:4px;">
                  <span><i class="fa-solid fa-user" style="font-size:0.65rem; color:var(--text-light);"></i> ${escapeHtml(s.name)} (${escapeHtml(s.studentId)})</span>
                  <button style="border:none; background:none; color:#ef4444; cursor:pointer;" title="Remove from room" onclick="removeStudentFromRoom('${r._id}', '${s._id}', '${escapeHtml(s.name)}')">
                    <i class="fa-solid fa-xmark"></i>
                  </button>
                </div>
              `).join('')}
            </div>
          ` : `<div style="font-size:0.75rem; color:var(--text-light); margin-bottom:0.75rem;">No students assigned yet.</div>`}
        </div>

        <div style="display:flex; gap:0.5rem; justify-content:space-between; margin-top:0.5rem;">
          <button class="btn btn-outline-primary btn-sm" style="flex:1;" ${isFull ? 'disabled' : ''} onclick="openAssignModal('${r._id}', '${escapeHtml(r.roomNumber)}')">
            <i class="fa-solid fa-user-plus"></i> Assign
          </button>
          <button class="btn btn-secondary btn-sm" onclick="openEditRoomModal('${r._id}')" title="Edit Room">
            <i class="fa-solid fa-pen"></i>
          </button>
          <button class="btn btn-secondary btn-sm" style="color:#ef4444;" onclick="confirmDeleteRoom('${r._id}', '${escapeHtml(r.roomNumber)}')" title="Delete Room">
            <i class="fa-solid fa-trash"></i>
          </button>
        </div>
      </div>
    `;
  }).join('');
}

// Open Create Room Modal
function openCreateRoomModal() {
  const form = document.getElementById('room-form');
  if (form) form.reset();
  document.getElementById('room-modal-title').textContent = 'Add New Hostel Room';
  document.getElementById('room-id-field').value = '';
  openModal('room-modal');
}

// Open Edit Room Modal
async function openEditRoomModal(id) {
  try {
    const res = await API.request(`/rooms/${id}`);
    if (!res.success) return;
    const r = res.data;

    document.getElementById('room-modal-title').textContent = 'Edit Room Details';
    document.getElementById('room-id-field').value = r._id;
    document.getElementById('modal-room-number').value = r.roomNumber;
    document.getElementById('modal-room-block').value = r.block;
    document.getElementById('modal-room-floor').value = r.floor;
    document.getElementById('modal-room-capacity').value = r.capacity;
    document.getElementById('modal-room-type').value = r.roomType;
    document.getElementById('modal-room-gender').value = r.gender || 'Any';
    document.getElementById('modal-room-status').value = r.status;

    openModal('room-modal');
  } catch (err) {
    showToast(err.message, 'error');
  }
}

// Save Room (Create/Update)
async function handleSaveRoom(e) {
  e.preventDefault();
  const id = document.getElementById('room-id-field').value;
  const submitBtn = document.getElementById('save-room-btn');

  const payload = {
    roomNumber: document.getElementById('modal-room-number').value.trim(),
    block: document.getElementById('modal-room-block').value.trim(),
    floor: Number(document.getElementById('modal-room-floor').value),
    capacity: Number(document.getElementById('modal-room-capacity').value),
    roomType: document.getElementById('modal-room-type').value,
    gender: document.getElementById('modal-room-gender').value,
    status: document.getElementById('modal-room-status').value
  };

  try {
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<span class="spinner" style="width:1rem;height:1rem;border-width:2px;"></span> Saving...';

    if (id) {
      const res = await API.request(`/rooms/${id}`, {
        method: 'PUT',
        body: payload
      });
      showToast(res.message, 'success');
    } else {
      const res = await API.request('/rooms', {
        method: 'POST',
        body: payload
      });
      showToast(res.message, 'success');
    }

    closeModal('room-modal');
    loadRooms();
  } catch (err) {
    showToast(err.message, 'error');
  } finally {
    submitBtn.disabled = false;
    submitBtn.innerHTML = '<i class="fa-solid fa-check"></i> Save Room';
  }
}

// Open Assign Student Modal
async function openAssignModal(roomId, roomNumber) {
  currentAssignRoomId = roomId;
  document.getElementById('assign-room-name').textContent = roomNumber;
  
  // Populate unassigned or all students dropdown
  const select = document.getElementById('assign-student-select');
  select.innerHTML = `<option value="">Loading students...</option>`;

  try {
    const res = await API.request('/students?limit=200');
    if (res.success) {
      select.innerHTML = `<option value="">-- Choose Student --</option>` +
        res.data.map(s => {
          const currentRoom = s.room ? ` (Currently in Room ${s.room.roomNumber})` : ' (Unassigned)';
          return `<option value="${s._id}">${escapeHtml(s.name)} - ${escapeHtml(s.studentId)}${currentRoom}</option>`;
        }).join('');
    }
    openModal('assign-student-modal');
  } catch (err) {
    showToast(err.message, 'error');
  }
}

// Submit Student Assignment
async function handleAssignStudent(e) {
  e.preventDefault();
  const studentId = document.getElementById('assign-student-select').value;
  if (!studentId || !currentAssignRoomId) {
    showToast('Please select a student', 'warning');
    return;
  }

  try {
    const res = await API.request(`/rooms/${currentAssignRoomId}/assign`, {
      method: 'POST',
      body: { studentId }
    });
    showToast(res.message, 'success');
    closeModal('assign-student-modal');
    loadRooms();
  } catch (err) {
    showToast(err.message, 'error');
  }
}

// Remove Student from Room
async function removeStudentFromRoom(roomId, studentId, studentName) {
  if (confirm(`Remove student ${studentName} from this room?`)) {
    try {
      const res = await API.request(`/rooms/${roomId}/remove`, {
        method: 'POST',
        body: { studentId }
      });
      showToast(res.message, 'success');
      loadRooms();
    } catch (err) {
      showToast(err.message, 'error');
    }
  }
}

// Confirm Delete Room
function confirmDeleteRoom(id, roomNumber) {
  if (confirm(`Are you sure you want to delete Room ${roomNumber}? Any allocated students will be unassigned.`)) {
    deleteRoom(id);
  }
}

async function deleteRoom(id) {
  try {
    const res = await API.request(`/rooms/${id}`, { method: 'DELETE' });
    showToast(res.message, 'success');
    loadRooms();
  } catch (err) {
    showToast(err.message, 'error');
  }
}
