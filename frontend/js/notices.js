/**
 * Hostel Management System - Notices Controller
 */

let allNotices = [];

// Load Notices for Admin or Student
async function loadNotices() {
  const container = document.getElementById('notices-list-container');
  if (!container) return;

  container.innerHTML = `<div class="loading-container" style="grid-column: 1/-1;"><span class="spinner"></span><span>Loading notice bulletin board...</span></div>`;

  const category = document.getElementById('filter-notice-category') ? document.getElementById('filter-notice-category').value : 'All';
  const priority = document.getElementById('filter-notice-priority') ? document.getElementById('filter-notice-priority').value : 'All';
  const search = document.getElementById('notice-search') ? document.getElementById('notice-search').value.trim() : '';

  let query = '?';
  if (category && category !== 'All') query += `&category=${encodeURIComponent(category)}`;
  if (priority && priority !== 'All') query += `&priority=${encodeURIComponent(priority)}`;
  if (search) query += `&search=${encodeURIComponent(search)}`;

  try {
    const res = await API.request(`/notices${query}`);
    if (!res.success) throw new Error(res.message);

    allNotices = res.data;
    renderNotices(res.data);
  } catch (err) {
    container.innerHTML = `<div class="empty-state" style="grid-column: 1/-1;"><div class="empty-state-icon"><i class="fa-solid fa-bullhorn"></i></div><div class="empty-state-title">Failed to load notices</div><p class="empty-state-text">${escapeHtml(err.message)}</p></div>`;
  }
}

// Render Notices
function renderNotices(notices) {
  const container = document.getElementById('notices-list-container');
  const user = API.getUser();
  const isAdmin = user && user.role === 'admin';

  if (!notices || notices.length === 0) {
    container.innerHTML = `
      <div class="empty-state" style="grid-column: 1/-1;">
        <div class="empty-state-icon"><i class="fa-solid fa-clipboard-list"></i></div>
        <div class="empty-state-title">No Notices Available</div>
        <p class="empty-state-text">No announcements posted for this category.</p>
      </div>
    `;
    return;
  }

  container.innerHTML = notices.map(n => {
    const isUrgent = n.priority === 'Urgent';

    return `
      <div class="notice-card priority-${escapeHtml(n.priority)}">
        <div class="notice-header">
          <div>
            <h4 class="notice-title">${escapeHtml(n.title)}</h4>
            <span style="font-size:0.75rem; color:var(--primary); font-weight:600;">${escapeHtml(n.category)}</span>
          </div>
          <span class="badge badge-${n.priority.toLowerCase()}">${n.priority}</span>
        </div>

        <div class="notice-body">
          <p style="margin:0; white-space:pre-wrap;">${escapeHtml(n.description)}</p>
        </div>

        <div class="notice-footer">
          <div>
            <i class="fa-regular fa-calendar-days"></i> Published: ${formatDate(n.publishDate || n.createdAt)}
            ${n.expiryDate ? `<div style="font-size:0.7rem; color:var(--text-muted); margin-top:2px;">Expires: ${formatDate(n.expiryDate)}</div>` : ''}
          </div>
          ${isAdmin ? `
            <div style="display:flex; gap:0.35rem;">
              <button class="btn-icon" title="Edit Notice" onclick="openEditNoticeModal('${n._id}')">
                <i class="fa-solid fa-pen"></i>
              </button>
              <button class="btn-icon" style="color:#ef4444;" title="Delete Notice" onclick="confirmDeleteNotice('${n._id}')">
                <i class="fa-solid fa-trash"></i>
              </button>
            </div>
          ` : ''}
        </div>
      </div>
    `;
  }).join('');
}

// Open Create Notice Modal (Admin)
function openCreateNoticeModal() {
  const form = document.getElementById('notice-form');
  if (form) form.reset();
  document.getElementById('notice-modal-title').textContent = 'Broadcast New Notice';
  document.getElementById('notice-id-field').value = '';
  openModal('notice-modal');
}

// Open Edit Notice Modal
async function openEditNoticeModal(id) {
  try {
    const res = await API.request(`/notices/${id}`);
    if (!res.success) return;
    const n = res.data;

    document.getElementById('notice-modal-title').textContent = 'Edit Notice';
    document.getElementById('notice-id-field').value = n._id;
    document.getElementById('modal-notice-title').value = n.title;
    document.getElementById('modal-notice-category').value = n.category;
    document.getElementById('modal-notice-priority').value = n.priority;
    document.getElementById('modal-notice-desc').value = n.description;
    document.getElementById('modal-notice-expiry').value = n.expiryDate ? n.expiryDate.substring(0, 10) : '';

    openModal('notice-modal');
  } catch (err) {
    showToast(err.message, 'error');
  }
}

// Save Notice (Create/Update)
async function handleSaveNotice(e) {
  e.preventDefault();
  const id = document.getElementById('notice-id-field').value;
  const submitBtn = document.getElementById('save-notice-btn');

  const payload = {
    title: document.getElementById('modal-notice-title').value.trim(),
    category: document.getElementById('modal-notice-category').value,
    priority: document.getElementById('modal-notice-priority').value,
    description: document.getElementById('modal-notice-desc').value.trim(),
    expiryDate: document.getElementById('modal-notice-expiry').value || null
  };

  try {
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<span class="spinner" style="width:1rem;height:1rem;border-width:2px;"></span> Publishing...';

    if (id) {
      const res = await API.request(`/notices/${id}`, {
        method: 'PUT',
        body: payload
      });
      showToast(res.message, 'success');
    } else {
      const res = await API.request('/notices', {
        method: 'POST',
        body: payload
      });
      showToast(res.message, 'success');
    }

    closeModal('notice-modal');
    loadNotices();
  } catch (err) {
    showToast(err.message, 'error');
  } finally {
    submitBtn.disabled = false;
    submitBtn.innerHTML = '<i class="fa-solid fa-bullhorn"></i> Broadcast Notice';
  }
}

// Delete Notice
async function confirmDeleteNotice(id) {
  if (confirm('Are you sure you want to delete this notice?')) {
    try {
      const res = await API.request(`/notices/${id}`, { method: 'DELETE' });
      showToast(res.message, 'success');
      loadNotices();
    } catch (err) {
      showToast(err.message, 'error');
    }
  }
}
