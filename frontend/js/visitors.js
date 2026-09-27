/**
 * Hostel Management System - Visitor Management Controller
 */

let allVisitors = [];

// Load Visitors for Admin or Student
async function loadVisitors() {
  const tbody = document.getElementById('visitors-table-body');
  if (!tbody) return;

  tbody.innerHTML = `<tr><td colspan="8" class="loading-container"><span class="spinner"></span><span>Loading visitor log...</span></td></tr>`;

  const status = document.getElementById('filter-visitor-status') ? document.getElementById('filter-visitor-status').value : 'All';
  const search = document.getElementById('visitor-search') ? document.getElementById('visitor-search').value.trim() : '';

  let query = '?';
  if (status && status !== 'All') query += `&status=${encodeURIComponent(status)}`;
  if (search) query += `&search=${encodeURIComponent(search)}`;

  try {
    const res = await API.request(`/visitors${query}`);
    if (!res.success) throw new Error(res.message);

    allVisitors = res.data;
    renderVisitorsTable(res.data);
  } catch (err) {
    tbody.innerHTML = `<tr><td colspan="8" class="empty-state"><div class="empty-state-icon"><i class="fa-solid fa-triangle-exclamation"></i></div><div class="empty-state-title">Failed to load visitors</div><p class="empty-state-text">${escapeHtml(err.message)}</p></td></tr>`;
  }
}

// Render Visitors Table
function renderVisitorsTable(visitors) {
  const tbody = document.getElementById('visitors-table-body');
  const user = API.getUser();
  const isAdmin = user && user.role === 'admin';

  if (!visitors || visitors.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="8" class="empty-state">
          <div class="empty-state-icon"><i class="fa-solid fa-id-badge"></i></div>
          <div class="empty-state-title">No Visitor Logs Found</div>
          <p class="empty-state-text">No guest entry records match current filters.</p>
        </td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = visitors.map(v => {
    const statusClass = v.status.toLowerCase();

    return `
      <tr>
        <td>
          <div style="font-weight:600;">${escapeHtml(v.visitorName)}</div>
          <div style="font-size:0.75rem; color:var(--text-light);">${escapeHtml(v.phone)}</div>
        </td>
        <td>
          <span class="badge badge-partial">${escapeHtml(v.relation)}</span>
        </td>
        ${isAdmin ? `
          <td>
            <div>${v.student ? escapeHtml(v.student.name) : 'Student'}</div>
            <div style="font-size:0.75rem; color:var(--text-light);">${v.student ? escapeHtml(v.student.studentId) : ''}</div>
          </td>
        ` : ''}
        <td>${formatDate(v.visitDate)}</td>
        <td>
          <div style="font-size:0.8125rem;">
            ${v.inTime ? `In: ${escapeHtml(v.inTime)}` : '--'} ${v.outTime ? `| Out: ${escapeHtml(v.outTime)}` : ''}
          </div>
        </td>
        <td style="font-size:0.8125rem;">${escapeHtml(v.purpose)}</td>
        <td>
          <span class="badge badge-${statusClass}">${v.status}</span>
        </td>
        <td>
          <div style="display:flex; gap:0.35rem;">
            ${isAdmin ? `
              ${v.status === 'Pending' ? `
                <button class="btn btn-success btn-sm" title="Approve Pass" onclick="updateVisitorStatus('${v._id}', 'Approved')">
                  <i class="fa-solid fa-check"></i>
                </button>
                <button class="btn btn-danger btn-sm" title="Reject Pass" onclick="updateVisitorStatus('${v._id}', 'Rejected')">
                  <i class="fa-solid fa-xmark"></i>
                </button>
              ` : ''}
              ${v.status === 'Approved' ? `
                <button class="btn btn-secondary btn-sm" title="Mark Completed / Exit" onclick="openLogTimeModal('${v._id}')">
                  <i class="fa-solid fa-clock"></i> Log Times
                </button>
              ` : ''}
              <button class="btn-icon" style="color:#ef4444;" onclick="confirmDeleteVisitor('${v._id}')" title="Delete">
                <i class="fa-solid fa-trash"></i>
              </button>
            ` : `
              ${v.status === 'Pending' ? `
                <button class="btn-icon" style="color:#ef4444;" onclick="confirmDeleteVisitor('${v._id}')" title="Cancel Request">
                  <i class="fa-solid fa-trash"></i>
                </button>
              ` : `<span style="font-size:0.75rem; color:var(--text-light);">Processed</span>`}
            `}
          </div>
        </td>
      </tr>
    `;
  }).join('');
}

// Open Request Visitor Pass Modal (Student)
function openRequestVisitorModal() {
  const form = document.getElementById('visitor-form');
  if (form) form.reset();
  const dateInput = document.getElementById('visitor-date');
  if (dateInput) dateInput.value = new Date().toISOString().substring(0, 10);
  openModal('visitor-modal');
}

// Submit Visitor Request (Student)
async function handleSubmitVisitor(e) {
  e.preventDefault();
  const submitBtn = document.getElementById('submit-visitor-btn');

  const payload = {
    visitorName: document.getElementById('visitor-name').value.trim(),
    relation: document.getElementById('visitor-relation').value.trim(),
    phone: document.getElementById('visitor-phone').value.trim(),
    visitDate: document.getElementById('visitor-date').value,
    inTime: document.getElementById('visitor-intime').value.trim(),
    outTime: document.getElementById('visitor-outtime').value.trim(),
    purpose: document.getElementById('visitor-purpose').value.trim()
  };

  try {
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<span class="spinner" style="width:1rem;height:1rem;border-width:2px;"></span> Submitting...';

    const res = await API.request('/visitors', {
      method: 'POST',
      body: payload
    });

    showToast(res.message, 'success');
    closeModal('visitor-modal');
    loadVisitors();
  } catch (err) {
    showToast(err.message, 'error');
  } finally {
    submitBtn.disabled = false;
    submitBtn.innerHTML = '<i class="fa-solid fa-paper-plane"></i> Submit Request';
  }
}

// Quick Status Update (Admin)
async function updateVisitorStatus(id, status) {
  try {
    const res = await API.request(`/visitors/${id}`, {
      method: 'PUT',
      body: { status }
    });
    showToast(`Visitor pass marked as ${status}`, 'success');
    loadVisitors();
  } catch (err) {
    showToast(err.message, 'error');
  }
}

// Open Log Time Modal (Admin)
async function openLogTimeModal(id) {
  try {
    const res = await API.request(`/visitors/${id}`);
    if (!res.success) return;
    const v = res.data;

    document.getElementById('log-visitor-id').value = v._id;
    document.getElementById('log-visitor-name').textContent = v.visitorName;
    document.getElementById('log-in-time').value = v.inTime || '';
    document.getElementById('log-out-time').value = v.outTime || '';
    document.getElementById('log-status').value = v.status;

    openModal('log-time-modal');
  } catch (err) {
    showToast(err.message, 'error');
  }
}

// Save Log Time
async function handleSaveLogTime(e) {
  e.preventDefault();
  const id = document.getElementById('log-visitor-id').value;
  const inTime = document.getElementById('log-in-time').value.trim();
  const outTime = document.getElementById('log-out-time').value.trim();
  const status = document.getElementById('log-status').value;

  try {
    const res = await API.request(`/visitors/${id}`, {
      method: 'PUT',
      body: { inTime, outTime, status }
    });

    showToast('Visitor pass times updated successfully', 'success');
    closeModal('log-time-modal');
    loadVisitors();
  } catch (err) {
    showToast(err.message, 'error');
  }
}

// Delete Visitor Pass
async function confirmDeleteVisitor(id) {
  if (confirm('Are you sure you want to delete this visitor pass record?')) {
    try {
      const res = await API.request(`/visitors/${id}`, { method: 'DELETE' });
      showToast(res.message, 'success');
      loadVisitors();
    } catch (err) {
      showToast(err.message, 'error');
    }
  }
}
