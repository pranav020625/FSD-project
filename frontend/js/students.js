/**
 * Hostel Management System - Student Management Controller
 */

let currentStudentPage = 1;
let totalStudentPages = 1;
let availableRoomsList = [];

// Load Students with Search, Filters, and Pagination
async function loadStudents(page = 1) {
  currentStudentPage = page;
  const tbody = document.getElementById('students-table-body');
  if (!tbody) return;

  tbody.innerHTML = `<tr><td colspan="9" class="loading-container"><span class="spinner"></span><span>Loading student directory...</span></td></tr>`;

  const search = document.getElementById('student-search') ? document.getElementById('student-search').value.trim() : '';
  const year = document.getElementById('filter-year') ? document.getElementById('filter-year').value : 'All';
  const branch = document.getElementById('filter-branch') ? document.getElementById('filter-branch').value : 'All';
  const status = document.getElementById('filter-status') ? document.getElementById('filter-status').value : 'All';

  let query = `?page=${page}&limit=10`;
  if (search) query += `&search=${encodeURIComponent(search)}`;
  if (year && year !== 'All') query += `&year=${encodeURIComponent(year)}`;
  if (branch && branch !== 'All') query += `&branch=${encodeURIComponent(branch)}`;
  if (status && status !== 'All') query += `&status=${encodeURIComponent(status)}`;

  try {
    const res = await API.request(`/students${query}`);
    if (!res.success) throw new Error(res.message);

    totalStudentPages = res.totalPages || 1;
    renderStudentsTable(res.data, res.total, res.currentPage);
    renderPagination(res.currentPage, res.totalPages);
  } catch (err) {
    tbody.innerHTML = `<tr><td colspan="9" class="empty-state"><div class="empty-state-icon"><i class="fa-solid fa-triangle-exclamation"></i></div><div class="empty-state-title">Failed to load students</div><p class="empty-state-text">${escapeHtml(err.message)}</p></td></tr>`;
  }
}

// Render Table Rows
function renderStudentsTable(students, total, currentPage) {
  const tbody = document.getElementById('students-table-body');
  const totalCountEl = document.getElementById('total-student-count');
  if (totalCountEl) totalCountEl.textContent = `Total: ${total} Students`;

  if (!students || students.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="9" class="empty-state">
          <div class="empty-state-icon"><i class="fa-solid fa-user-graduate"></i></div>
          <div class="empty-state-title">No Students Found</div>
          <p class="empty-state-text">Try adjusting your search criteria or register a new student.</p>
        </td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = students.map(s => `
    <tr>
      <td><span style="font-weight:700; color:var(--primary);">${escapeHtml(s.studentId)}</span></td>
      <td>
        <div style="font-weight:600;">${escapeHtml(s.name)}</div>
        <div style="font-size:0.75rem; color:var(--text-light);">${escapeHtml(s.gender)}</div>
      </td>
      <td>
        <div>${escapeHtml(s.email)}</div>
        <div style="font-size:0.75rem; color:var(--text-light);">${escapeHtml(s.phone)}</div>
      </td>
      <td>${escapeHtml(s.course)}</td>
      <td>
        <div>${escapeHtml(s.branch)}</div>
        <div style="font-size:0.75rem; color:var(--text-light);">${escapeHtml(s.year)}</div>
      </td>
      <td>
        ${s.room ? `<span class="badge badge-partial"><i class="fa-solid fa-door-closed"></i> ${escapeHtml(s.room.roomNumber)} (${escapeHtml(s.room.block)})</span>` : `<span class="badge badge-maintenance">Unassigned</span>`}
      </td>
      <td>
        <span class="badge badge-${s.status.toLowerCase()}">${s.status}</span>
      </td>
      <td>
        <div style="display:flex; gap:0.35rem;">
          <button class="btn-icon" title="View Details" onclick="viewStudentDetails('${s._id}')">
            <i class="fa-solid fa-eye"></i>
          </button>
          <button class="btn-icon" title="Edit Student" onclick="openEditStudentModal('${s._id}')">
            <i class="fa-solid fa-pen-to-square"></i>
          </button>
          <button class="btn-icon" title="Delete Student" style="color:#ef4444;" onclick="confirmDeleteStudent('${s._id}', '${escapeHtml(s.name)}')">
            <i class="fa-solid fa-trash"></i>
          </button>
        </div>
      </td>
    </tr>
  `).join('');
}

// Render Pagination Controls
function renderPagination(currentPage, totalPages) {
  const container = document.getElementById('students-pagination');
  if (!container) return;

  if (totalPages <= 1) {
    container.innerHTML = '';
    return;
  }

  container.innerHTML = `
    <span>Showing page ${currentPage} of ${totalPages}</span>
    <div class="pagination-controls">
      <button class="btn btn-secondary btn-sm" ${currentPage <= 1 ? 'disabled' : ''} onclick="loadStudents(${currentPage - 1})">
        <i class="fa-solid fa-chevron-left"></i> Prev
      </button>
      <button class="btn btn-secondary btn-sm" ${currentPage >= totalPages ? 'disabled' : ''} onclick="loadStudents(${currentPage + 1})">
        Next <i class="fa-solid fa-chevron-right"></i>
      </button>
    </div>
  `;
}

// Fetch available rooms for modal dropdown
async function loadAvailableRooms(selectElementId, selectedRoomId = null) {
  try {
    const res = await API.request('/rooms');
    if (!res.success) return;

    availableRoomsList = res.data;
    const select = document.getElementById(selectElementId);
    if (!select) return;

    select.innerHTML = `<option value="">-- Select Room (Optional) --</option>` +
      res.data.map(r => {
        const isSelected = selectedRoomId && selectedRoomId.toString() === r._id.toString() ? 'selected' : '';
        const isFull = r.occupiedBeds >= r.capacity && (!selectedRoomId || selectedRoomId.toString() !== r._id.toString());
        return `<option value="${r._id}" ${isSelected} ${isFull ? 'disabled' : ''}>
          Room ${r.roomNumber} (Block ${r.block} - ${r.occupiedBeds}/${r.capacity} Beds - ${r.roomType}) ${isFull ? '[FULL]' : ''}
        </option>`;
      }).join('');
  } catch (err) {
    console.error('Error fetching rooms for dropdown:', err);
  }
}

// Open Create Student Modal
function openCreateStudentModal() {
  const form = document.getElementById('student-form');
  if (form) form.reset();
  document.getElementById('student-modal-title').textContent = 'Add New Student';
  document.getElementById('student-id-field').value = '';
  loadAvailableRooms('student-room-select');
  openModal('student-modal');
}

// Open Edit Student Modal
async function openEditStudentModal(id) {
  try {
    const res = await API.request(`/students/${id}`);
    if (!res.success) return;
    const s = res.data;

    document.getElementById('student-modal-title').textContent = 'Edit Student Details';
    document.getElementById('student-id-field').value = s._id;
    document.getElementById('modal-student-roll').value = s.studentId;
    document.getElementById('modal-student-name').value = s.name;
    document.getElementById('modal-student-email').value = s.email;
    document.getElementById('modal-student-phone').value = s.phone;
    document.getElementById('modal-student-gender').value = s.gender;
    document.getElementById('modal-student-course').value = s.course;
    document.getElementById('modal-student-branch').value = s.branch;
    document.getElementById('modal-student-year').value = s.year;
    document.getElementById('modal-student-address').value = s.address || '';
    document.getElementById('modal-student-parent-name').value = s.parentName || '';
    document.getElementById('modal-student-parent-phone').value = s.parentPhone || '';
    document.getElementById('modal-student-status').value = s.status;

    await loadAvailableRooms('student-room-select', s.room ? s.room._id : null);
    openModal('student-modal');
  } catch (err) {
    showToast(err.message, 'error');
  }
}

// Save Student (Create or Update)
async function handleSaveStudent(e) {
  e.preventDefault();
  const id = document.getElementById('student-id-field').value;
  const submitBtn = document.getElementById('save-student-btn');

  const payload = {
    studentId: document.getElementById('modal-student-roll').value.trim(),
    name: document.getElementById('modal-student-name').value.trim(),
    email: document.getElementById('modal-student-email').value.trim(),
    phone: document.getElementById('modal-student-phone').value.trim(),
    gender: document.getElementById('modal-student-gender').value,
    course: document.getElementById('modal-student-course').value.trim(),
    branch: document.getElementById('modal-student-branch').value.trim(),
    year: document.getElementById('modal-student-year').value,
    address: document.getElementById('modal-student-address').value.trim(),
    parentName: document.getElementById('modal-student-parent-name').value.trim(),
    parentPhone: document.getElementById('modal-student-parent-phone').value.trim(),
    status: document.getElementById('modal-student-status').value,
    room: document.getElementById('student-room-select').value || null
  };

  try {
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<span class="spinner" style="width:1rem;height:1rem;border-width:2px;"></span> Saving...';

    if (id) {
      // Update
      const res = await API.request(`/students/${id}`, {
        method: 'PUT',
        body: payload
      });
      showToast(res.message, 'success');
    } else {
      // Create
      const res = await API.request('/students', {
        method: 'POST',
        body: payload
      });
      showToast(res.message, 'success');
    }

    closeModal('student-modal');
    loadStudents(currentStudentPage);
  } catch (err) {
    showToast(err.message, 'error');
  } finally {
    submitBtn.disabled = false;
    submitBtn.innerHTML = '<i class="fa-solid fa-check"></i> Save Student Record';
  }
}

// View Student Details in Modal
async function viewStudentDetails(id) {
  try {
    const res = await API.request(`/students/${id}`);
    if (!res.success) return;
    const s = res.data;

    const content = document.getElementById('student-details-content');
    if (!content) return;

    content.innerHTML = `
      <div style="display:flex; align-items:center; gap:1.25rem; margin-bottom:1.5rem; border-bottom:1px solid var(--border-color); padding-bottom:1rem;">
        <div class="user-avatar" style="width:56px; height:56px; font-size:1.5rem;">${s.name.charAt(0)}</div>
        <div>
          <h3 style="margin:0; font-size:1.25rem;">${escapeHtml(s.name)}</h3>
          <p style="color:var(--primary); font-weight:700; margin:0.15rem 0;">${escapeHtml(s.studentId)} &bull; ${escapeHtml(s.course)} (${escapeHtml(s.branch)})</p>
          <span class="badge badge-${s.status.toLowerCase()}">${s.status}</span>
        </div>
      </div>

      <div class="form-row" style="margin-bottom:1.25rem;">
        <div><strong>Email:</strong> ${escapeHtml(s.email)}</div>
        <div><strong>Phone:</strong> ${escapeHtml(s.phone)}</div>
        <div><strong>Gender:</strong> ${escapeHtml(s.gender)}</div>
        <div><strong>Year:</strong> ${escapeHtml(s.year)}</div>
      </div>

      <div style="background:#f8fafc; padding:1rem; border-radius:var(--radius-md); margin-bottom:1.25rem;">
        <h4 style="font-size:0.95rem; margin-bottom:0.5rem;"><i class="fa-solid fa-bed"></i> Room Allocation</h4>
        ${s.room ? `
          <p style="margin:0;"><strong>Room ${escapeHtml(s.room.roomNumber)}</strong> &bull; Block ${escapeHtml(s.room.block)}, Floor ${s.room.floor} (${s.room.roomType} Room)</p>
        ` : `<p style="color:var(--text-muted); margin:0;">No hostel room assigned currently.</p>`}
      </div>

      <div style="background:#f8fafc; padding:1rem; border-radius:var(--radius-md);">
        <h4 style="font-size:0.95rem; margin-bottom:0.5rem;"><i class="fa-solid fa-house-user"></i> Guardian Details & Address</h4>
        <p style="margin:0 0 0.35rem 0;"><strong>Parent/Guardian:</strong> ${escapeHtml(s.parentName || 'N/A')} (${escapeHtml(s.parentPhone || 'N/A')})</p>
        <p style="margin:0;"><strong>Permanent Address:</strong> ${escapeHtml(s.address || 'N/A')}</p>
      </div>
    `;

    openModal('view-student-modal');
  } catch (err) {
    showToast(err.message, 'error');
  }
}

// Delete Confirmation
function confirmDeleteStudent(id, name) {
  if (confirm(`Are you sure you want to delete student "${name}"? This will unassign their room and remove their login account.`)) {
    deleteStudent(id);
  }
}

async function deleteStudent(id) {
  try {
    const res = await API.request(`/students/${id}`, { method: 'DELETE' });
    showToast(res.message, 'success');
    loadStudents(currentStudentPage);
  } catch (err) {
    showToast(err.message, 'error');
  }
}
