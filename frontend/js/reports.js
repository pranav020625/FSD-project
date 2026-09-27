/**
 * Hostel Management System - Reports & Analytics Controller
 */

let branchChartInstance = null;
let yearChartInstance = null;
let categoryChartInstance = null;

async function loadDetailedReports() {
  try {
    const res = await API.request('/reports/detailed');
    if (!res.success) throw new Error(res.message);

    const { branchBreakdown, yearBreakdown, blockBreakdown, complaintCategoryBreakdown } = res.data;

    renderBranchChart(branchBreakdown);
    renderYearChart(yearBreakdown);
    renderCategoryChart(complaintCategoryBreakdown);
    renderBlockTable(blockBreakdown);
  } catch (err) {
    showToast(err.message, 'error');
  }
}

function renderBranchChart(data) {
  const ctx = document.getElementById('branchChart');
  if (!ctx) return;

  if (branchChartInstance) branchChartInstance.destroy();

  branchChartInstance = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: data.map(d => d._id || 'Unknown'),
      datasets: [{
        label: 'Enrolled Students',
        data: data.map(d => d.count),
        backgroundColor: '#4361ee',
        borderRadius: 6
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        y: { beginAtZero: true, ticks: { stepSize: 1 } },
        x: { ticks: { autoSkip: false, maxRotation: 45, minRotation: 0 } }
      }
    }
  });
}

function renderYearChart(data) {
  const ctx = document.getElementById('yearChart');
  if (!ctx) return;

  if (yearChartInstance) yearChartInstance.destroy();

  yearChartInstance = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: data.map(d => d._id || 'Unknown'),
      datasets: [{
        data: data.map(d => d.count),
        backgroundColor: ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899']
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { position: 'bottom' }
      }
    }
  });
}

function renderCategoryChart(data) {
  const ctx = document.getElementById('categoryChart');
  if (!ctx) return;

  if (categoryChartInstance) categoryChartInstance.destroy();

  categoryChartInstance = new Chart(ctx, {
    type: 'pie',
    data: {
      labels: data.map(d => d._id || 'General'),
      datasets: [{
        data: data.map(d => d.count),
        backgroundColor: ['#ef4444', '#f97316', '#eab308', '#06b6d4', '#6366f1', '#a855f7', '#ec4899']
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { position: 'bottom' }
      }
    }
  });
}

function renderBlockTable(blocks) {
  const tbody = document.getElementById('block-reports-tbody');
  if (!tbody) return;

  if (!blocks || blocks.length === 0) {
    tbody.innerHTML = `<tr><td colspan="5" class="text-center">No block data available</td></tr>`;
    return;
  }

  tbody.innerHTML = blocks.map(b => {
    const occPct = b.totalCapacity > 0 ? Math.round((b.totalOccupied / b.totalCapacity) * 100) : 0;
    return `
      <tr>
        <td><strong>Block ${escapeHtml(b._id)}</strong></td>
        <td>${b.totalRooms} Rooms</td>
        <td>${b.totalCapacity} Beds</td>
        <td><strong>${b.totalOccupied}</strong> Beds</td>
        <td>
          <div style="display:flex; align-items:center; gap:0.5rem;">
            <div class="occupancy-bar" style="flex:1; margin:0;">
              <div class="occupancy-fill" style="width:${occPct}%;"></div>
            </div>
            <span style="font-size:0.75rem; font-weight:700;">${occPct}%</span>
          </div>
        </td>
      </tr>
    `;
  }).join('');
}

// Export Students to CSV
async function exportStudentsCSV() {
  try {
    const res = await API.request('/students?limit=1000');
    if (!res.success || res.data.length === 0) {
      showToast('No student data to export', 'warning');
      return;
    }

    let csvContent = 'data:text/csv;charset=utf-8,';
    csvContent += 'Student ID,Name,Email,Phone,Gender,Course,Branch,Year,Room,Block,Status\n';

    res.data.forEach(s => {
      const row = [
        `"${s.studentId}"`,
        `"${s.name}"`,
        `"${s.email}"`,
        `"${s.phone}"`,
        `"${s.gender}"`,
        `"${s.course}"`,
        `"${s.branch}"`,
        `"${s.year}"`,
        `"${s.room ? s.room.roomNumber : 'Unassigned'}"`,
        `"${s.room ? s.room.block : ''}"`,
        `"${s.status}"`
      ].join(',');
      csvContent += row + '\n';
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Hostel_Students_Report_${new Date().toISOString().substring(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    showToast('Students CSV report generated!', 'success');
  } catch (err) {
    showToast(err.message, 'error');
  }
}
