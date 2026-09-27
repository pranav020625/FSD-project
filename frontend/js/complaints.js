/**
 * Hostel Management System - Complaint Management Controller
 */

let allComplaints = [];

// Load Complaints for Admin or Student
async function loadComplaints() {
  const tbody = document.getElementById('complaints-table-body');
  if (!tbody) return;

  tbody.innerHTML = `<tr><td colspan="7" class="loading-container"><span class="spinner"></span><span>Loading complaints...</span></td></tr>`;

  const status = document.getElementById('filter-complaint-status') ? document.getElementById('filter-complaint-status').value : 'All';
  const category = document.getElementById('filter-complaint-category') ? document.getElementById('filter-complaint-category').value : 'All';
  const search = document.getElementById('complaint-search') ? document.getElementById('complaint-search').value.trim() : '';

  let query = '?';
  if (status && status !== 'All') query += `&status=${encodeURIComponent(status)}`;
  if (category && category !== 'All') query += `&category=${encodeURIComponent(category)}`;
  if (search) query += `&search=${encodeURIComponent(search)}`;

  try {
    const res = await API.request(`/complaints${query}`);
    if (!res.success) throw new Error(res.message);

    allComplaints = res.data;
    renderComplaintsTable(res.data);
  } catch (err) {
    tbody.innerHTML = `<tr><td colspan="7" class="empty-state"><div class="empty-state-icon"><i class="fa-solid fa-triangle-exclamation"></i></div><div class="empty-state-title">Failed to load complaints</div><p class="empty-state-text">${escapeHtml(err.message)}</p></td></tr>`;
  }
}

// Render Complaints Table
function renderComplaintsTable(complaints) {
  const tbody = document.getElementById('complaints-table-body');
  const user = API.getUser();
  const isAdmin = user && user.role === 'admin';

  if (!complaints || complaints.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="7" class="empty-state">
          <div class="empty-state-icon"><i class="fa-solid fa-clipboard-check"></i></div>
          <div class="empty-state-title">No Complaints Found</div>
          <p class="empty-state-text">Everything looks in order. No grievances match your current filters.</p>
        </td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = complaints.map(c => {
    const statusClass = c.status.toLowerCase().replace(/\s+/g, '-');
    const priorityClass = c.priority.toLowerCase();

    return `
      <tr>
        <td>
          <div style="font-weight:600;">${escapeHtml(c.title)}</div>
          <div style="font-size:0.75rem; color:var(--text-muted);">${escapeHtml(c.description.substring(0, 70))}...</div>
        </td>
        <td>
          <span style="font-size:0.8125rem; font-weight:600; color:var(--primary);">${escapeHtml(c.category)}</span>
        </td>
        ${isAdmin ? `
          <td>
            <div>${c.student ? escapeHtml(c.student.name) : 'Student'}</div>
            <div style="font-size:0.75rem; color:var(--text-light);">${c.student ? escapeHtml(c.student.studentId) : ''}</div>
          </td>
        ` : ''}
        <td>
          <span class="badge badge-${priorityClass}">${c.priority}</span>
        </td>
        <td>
          <span class="badge badge-${statusClass}">${c.status}</span>
        </td>
        <td>${formatDate(c.createdAt)}</td>
        <td>
          <div style="display:flex; gap:0.35rem;">
            ${isAdmin ? `
              <button class="btn btn-outline-primary btn-sm" onclick="openRespondComplaintModal('${c._id}')">
                <i class="fa-solid fa-reply"></i> Respond
              </button>
              <button class="btn-icon" style="color:#ef4444;" onclick="confirmDeleteComplaint('${c._id}')" title="Delete">
                <i class="fa-solid fa-trash"></i>
              </button>
            ` : `
              <button class="btn btn-secondary btn-sm" onclick="viewComplaintDetails('${c._id}')">
                <i class="fa-solid fa-eye"></i> View
              </button>
              ${c.status === 'Pending' ? `
                <button class="btn-icon" style="color:#ef4444;" onclick="confirmDeleteComplaint('${c._id}')" title="Cancel">
                  <i class="fa-solid fa-trash"></i>
                </button>
              ` : ''}
            `}
          </div>
        </td>
      </tr>
    `;
  }).join('');
}

// Open Submit Complaint Modal (Student)
function openSubmitComplaintModal() {
  const form = document.getElementById('complaint-form');
  if (form) form.reset();
  openModal('complaint-modal');
}

// Handle Submit Complaint (Student)
async function handleSubmitComplaint(e) {
  e.preventDefault();
  const submitBtn = document.getElementById('submit-complaint-btn');

  const payload = {
    title: document.getElementById('complaint-title').value.trim(),
    category: document.getElementById('complaint-category').value,
    priority: document.getElementById('complaint-priority').value,
    description: document.getElementById('complaint-desc').value.trim()
  };

  try {
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<span class="spinner" style="width:1rem;height:1rem;border-width:2px;"></span> Submitting...';

    const res = await API.request('/complaints', {
      method: 'POST',
      body: payload
    });

    showToast(res.message, 'success');
    closeModal('complaint-modal');
    loadComplaints();
  } catch (err) {
    showToast(err.message, 'error');
  } finally {
    submitBtn.disabled = false;
    submitBtn.innerHTML = '<i class="fa-solid fa-paper-plane"></i> Submit Grievance';
  }
}

// Open Admin Respond Modal
async function openRespondComplaintModal(id) {
  try {
    const res = await API.request(`/complaints/${id}`);
    if (!res.success) return;
    const c = res.data;

    document.getElementById('respond-complaint-id').value = c._id;
    document.getElementById('respond-title').textContent = c.title;
    document.getElementById('respond-desc').textContent = c.description;
    document.getElementById('respond-student').textContent = c.student ? `${c.student.name} (${c.student.studentId})` : 'Student';
    document.getElementById('respond-status').value = c.status;
    document.getElementById('respond-text').value = c.adminResponse || '';

    openModal('respond-modal');
  } catch (err) {
    showToast(err.message, 'error');
  }
}

// Submit Admin Response & Status Change
async function handleSaveComplaintResponse(e) {
  e.preventDefault();
  const id = document.getElementById('respond-complaint-id').value;
  const status = document.getElementById('respond-status').value;
  const adminResponse = document.getElementById('respond-text').value.trim();

  try {
    const res = await API.request(`/complaints/${id}`, {
      method: 'PUT',
      body: { status, adminResponse }
    });

    showToast(res.message, 'success');
    closeModal('respond-modal');
    loadComplaints();
  } catch (err) {
    showToast(err.message, 'error');
  }
}

// View Complaint Details Modal (Student)
async function viewComplaintDetails(id) {
  try {
    const res = await API.request(`/complaints/${id}`);
    if (!res.success) return;
    const c = res.data;

    const content = document.getElementById('view-complaint-content');
    if (!content) return;

    content.innerHTML = `
      <div style="margin-bottom:1rem;">
        <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:0.5rem;">
          <h3 style="margin:0; font-size:1.15rem;">${escapeHtml(c.title)}</h3>
          <span class="badge badge-${c.status.toLowerCase().replace(/\s+/g, '-')}">${c.status}</span>
        </div>
        <div style="font-size:0.8rem; color:var(--text-light); margin-bottom:1rem;">
          Category: <strong>${escapeHtml(c.category)}</strong> &bull; Priority: <strong>${c.priority}</strong> &bull; Filed on: ${formatDate(c.createdAt)}
        </div>
        <div style="background:#f8fafc; padding:1rem; border-radius:var(--radius-md); font-size:0.875rem; color:var(--text-main); margin-bottom:1.25rem;">
          <strong>Description:</strong>
          <p style="margin-top:0.25rem; white-space:pre-wrap;">${escapeHtml(c.description)}</p>
        </div>

        <div style="border-top:1px solid var(--border-color); padding-top:1rem;">
          <h4 style="font-size:0.95rem; margin-bottom:0.35rem;"><i class="fa-solid fa-user-shield"></i> Warden / Admin Response</h4>
          ${c.adminResponse ? `
            <div style="background:#ecfdf5; border-left:4px solid #10b981; padding:0.875rem; border-radius:0 var(--radius-md) var(--radius-md) 0; font-size:0.875rem; color:#065f46;">
              ${escapeHtml(c.adminResponse)}
              ${c.resolvedAt ? `<div style="font-size:0.75rem; color:#047857; margin-top:0.35rem;">Resolved on: ${formatDate(c.resolvedAt)}</div>` : ''}
            </div>
          ` : `<p style="font-size:0.875rem; color:var(--text-muted);">Your grievance is currently under review by the hostel warden.</p>`}
        </div>
      </div>
    `;

    openModal('view-complaint-modal');
  } catch (err) {
    showToast(err.message, 'error');
  }
}

// Delete Complaint
async function confirmDeleteComplaint(id) {
  if (confirm('Are you sure you want to delete this complaint?')) {
    try {
      const res = await API.request(`/complaints/${id}`, { method: 'DELETE' });
      showToast(res.message, 'success');
      loadComplaints();
    } catch (err) {
      showToast(err.message, 'error');
    }
  }
}
