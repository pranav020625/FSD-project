/**
 * Hostel Management System - Dashboard Controller & Visualizations
 */

let roomChartInstance = null;
let feeChartInstance = null;
let complaintChartInstance = null;

// Initialize Admin Dashboard
async function loadAdminDashboard() {
  try {
    const res = await API.request('/reports/dashboard-stats');
    if (!res.success || !res.data) return;

    const { cards, charts, recent } = res.data;

    // Update Stat Cards
    setText('stat-total-students', cards.totalStudents);
    setText('stat-active-students', `${cards.activeStudents} Active`);
    
    setText('stat-total-rooms', cards.totalRooms);
    setText('stat-room-occupancy', `${cards.occupiedRooms} Occupied (${cards.occupiedBeds}/${cards.totalBeds} Beds)`);
    
    setText('stat-pending-fees', formatCurrency(cards.pendingFees));
    setText('stat-collected-fees', `Collected: ${formatCurrency(cards.collectedFees)}`);
    
    setText('stat-pending-complaints', cards.pendingComplaints);
    setText('stat-total-complaints', `${cards.totalComplaints} Total grievances`);
    
    setText('stat-pending-visitors', cards.pendingVisitors);
    setText('stat-total-visitors', `${cards.totalVisitors} Passes recorded`);

    setText('stat-active-notices', cards.activeNotices);

    // Render Charts
    renderRoomOccupancyChart(charts.roomStatus);
    renderFeeStatusChart(charts.feeStatus);
    renderComplaintChart(charts.complaintStatus);

    // Render Recent Tables
    renderRecentComplaints(recent.complaints);
    renderRecentVisitors(recent.visitors);
  } catch (err) {
    showToast(err.message, 'error');
  }
}

// Helper to set text content
function setText(id, text) {
  const el = document.getElementById(id);
  if (el) el.textContent = text;
}

// Chart 1: Room Occupancy Status (Doughnut)
function renderRoomOccupancyChart(data) {
  const ctx = document.getElementById('roomOccupancyChart');
  if (!ctx) return;

  if (roomChartInstance) roomChartInstance.destroy();

  roomChartInstance = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: Object.keys(data),
      datasets: [
        {
          data: Object.values(data),
          backgroundColor: ['#10b981', '#f59e0b', '#ef4444', '#94a3b8'],
          borderWidth: 2,
          borderColor: '#ffffff'
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'bottom',
          labels: { boxWidth: 12, padding: 12, font: { family: 'Plus Jakarta Sans', size: 12 } }
        }
      },
      cutout: '68%'
    }
  });
}

// Chart 2: Fee Status Distribution (Bar)
function renderFeeStatusChart(data) {
  const ctx = document.getElementById('feeStatusChart');
  if (!ctx) return;

  if (feeChartInstance) feeChartInstance.destroy();

  feeChartInstance = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: Object.keys(data),
      datasets: [
        {
          label: 'Invoices',
          data: Object.values(data),
          backgroundColor: ['#10b981', '#f59e0b', '#6366f1', '#ef4444'],
          borderRadius: 6
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        y: { beginAtZero: true, grid: { color: '#f1f5f9' }, ticks: { stepSize: 1 } },
        x: { grid: { display: false } }
      },
      plugins: {
        legend: { display: false }
      }
    }
  });
}

// Chart 3: Complaints Resolution Status (Polar / Pie)
function renderComplaintChart(data) {
  const ctx = document.getElementById('complaintChart');
  if (!ctx) return;

  if (complaintChartInstance) complaintChartInstance.destroy();

  complaintChartInstance = new Chart(ctx, {
    type: 'pie',
    data: {
      labels: Object.keys(data),
      datasets: [
        {
          data: Object.values(data),
          backgroundColor: ['#f59e0b', '#3b82f6', '#10b981', '#ef4444']
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { position: 'bottom', labels: { boxWidth: 12, padding: 10, font: { family: 'Plus Jakarta Sans', size: 12 } } }
      }
    }
  });
}

// Render Recent Complaints in Admin Dashboard
function renderRecentComplaints(complaints) {
  const tbody = document.getElementById('recent-complaints-tbody');
  if (!tbody) return;

  if (!complaints || complaints.length === 0) {
    tbody.innerHTML = `<tr><td colspan="4" class="text-center" style="color:var(--text-muted); padding:1.5rem;">No recent complaints logged</td></tr>`;
    return;
  }

  tbody.innerHTML = complaints.map(c => `
    <tr>
      <td>
        <div style="font-weight:600;">${escapeHtml(c.title)}</div>
        <div style="font-size:0.75rem; color:var(--text-light);">${escapeHtml(c.category)}</div>
      </td>
      <td>${c.student ? escapeHtml(c.student.name) : 'Student'}</td>
      <td>
        <span class="badge badge-${c.priority.toLowerCase()}">${c.priority}</span>
      </td>
      <td>
        <span class="badge badge-${c.status.toLowerCase().replace(/\s+/g, '-')}">${c.status}</span>
      </td>
    </tr>
  `).join('');
}

// Render Recent Visitors in Admin Dashboard
function renderRecentVisitors(visitors) {
  const tbody = document.getElementById('recent-visitors-tbody');
  if (!tbody) return;

  if (!visitors || visitors.length === 0) {
    tbody.innerHTML = `<tr><td colspan="4" class="text-center" style="color:var(--text-muted); padding:1.5rem;">No recent visitor logs</td></tr>`;
    return;
  }

  tbody.innerHTML = visitors.map(v => `
    <tr>
      <td>
        <div style="font-weight:600;">${escapeHtml(v.visitorName)}</div>
        <div style="font-size:0.75rem; color:var(--text-light);">${escapeHtml(v.relation)}</div>
      </td>
      <td>${v.student ? escapeHtml(v.student.name) : 'Student'}</td>
      <td>${formatDate(v.visitDate)}</td>
      <td>
        <span class="badge badge-${v.status.toLowerCase()}">${v.status}</span>
      </td>
    </tr>
  `).join('');
}

// Initialize Student Dashboard Overview
async function loadStudentDashboard() {
  try {
    const user = await API.request('/auth/me');
    const profile = user.data.user.studentProfile;

    // Set Welcome Header
    setText('student-welcome-name', user.data.user.name);
    setText('student-id-badge', user.data.user.studentId || 'STUDENT');

    // Room Info
    if (profile && profile.room) {
      setText('my-room-number', profile.room.roomNumber);
      setText('my-room-block', `Block ${profile.room.block}, Floor ${profile.room.floor}`);
      setText('my-room-type', profile.room.roomType);
      setText('my-room-capacity', `${profile.room.occupiedBeds} / ${profile.room.capacity} Beds Occupied`);
    } else {
      setText('my-room-number', 'Unassigned');
      setText('my-room-block', 'Contact warden for room allocation');
    }

    // Load Student Fees
    const feeRes = await API.request('/fees');
    if (feeRes.success) {
      setText('student-fee-due', formatCurrency(feeRes.summary.remaining));
      setText('student-fee-paid', `Paid: ${formatCurrency(feeRes.summary.totalPaid)}`);
    }

    // Load Student Complaints
    const compRes = await API.request('/complaints');
    if (compRes.success) {
      const activeCount = compRes.data.filter(c => c.status !== 'Resolved' && c.status !== 'Rejected').length;
      setText('student-active-complaints', activeCount);
      renderStudentRecentComplaints(compRes.data.slice(0, 3));
    }

    // Load Active Notices
    const notRes = await API.request('/notices');
    if (notRes.success) {
      renderStudentDashboardNotices(notRes.data.slice(0, 4));
    }
  } catch (err) {
    showToast(err.message, 'error');
  }
}

function renderStudentRecentComplaints(complaints) {
  const container = document.getElementById('student-dashboard-complaints');
  if (!container) return;

  if (complaints.length === 0) {
    container.innerHTML = `<p style="color:var(--text-muted); font-size:0.875rem;">No active complaints registered.</p>`;
    return;
  }

  container.innerHTML = complaints.map(c => `
    <div style="padding:0.75rem; border:1px solid var(--border-color); border-radius:var(--radius-md); margin-bottom:0.75rem; background:#ffffff;">
      <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:0.35rem;">
        <span style="font-weight:600; font-size:0.875rem;">${escapeHtml(c.title)}</span>
        <span class="badge badge-${c.status.toLowerCase().replace(/\s+/g, '-')}">${c.status}</span>
      </div>
      <p style="font-size:0.8rem; color:var(--text-muted); margin:0;">${escapeHtml(c.description.substring(0, 80))}...</p>
      ${c.adminResponse ? `<div style="margin-top:0.35rem; font-size:0.75rem; color:#15803d; background:#dcfce7; padding:4px 8px; border-radius:4px;"><strong>Warden Response:</strong> ${escapeHtml(c.adminResponse)}</div>` : ''}
    </div>
  `).join('');
}

function renderStudentDashboardNotices(notices) {
  const container = document.getElementById('student-dashboard-notices');
  if (!container) return;

  if (notices.length === 0) {
    container.innerHTML = `<p style="color:var(--text-muted); font-size:0.875rem;">No active notices right now.</p>`;
    return;
  }

  container.innerHTML = notices.map(n => `
    <div style="padding:0.875rem; border-left:3px solid var(--primary); background:#ffffff; border-radius:0 var(--radius-md) var(--radius-md) 0; box-shadow:var(--shadow-sm); margin-bottom:0.75rem;">
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.25rem;">
        <h5 style="margin:0; font-size:0.9rem; font-weight:700;">${escapeHtml(n.title)}</h5>
        <span class="badge badge-${n.priority.toLowerCase()}">${n.priority}</span>
      </div>
      <p style="font-size:0.8rem; color:var(--text-muted); margin:0 0 0.5rem 0;">${escapeHtml(n.description)}</p>
      <div style="font-size:0.7rem; color:var(--text-light);"><i class="fa-regular fa-calendar"></i> ${formatDate(n.publishDate)}</div>
    </div>
  `).join('');
}
