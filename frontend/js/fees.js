/**
 * Hostel Management System - Fees Management Controller
 */

let allFeesList = [];

// Load Fees for Admin or Student
async function loadFees() {
  const tbody = document.getElementById('fees-table-body');
  if (!tbody) return;

  tbody.innerHTML = `<tr><td colspan="8" class="loading-container"><span class="spinner"></span><span>Loading fee invoices...</span></td></tr>`;

  const status = document.getElementById('filter-fee-status') ? document.getElementById('filter-fee-status').value : 'All';
  const search = document.getElementById('fee-search') ? document.getElementById('fee-search').value.trim() : '';

  let query = '?';
  if (status && status !== 'All') query += `&status=${encodeURIComponent(status)}`;
  if (search) query += `&search=${encodeURIComponent(search)}`;

  try {
    const res = await API.request(`/fees${query}`);
    if (!res.success) throw new Error(res.message);

    allFeesList = res.data;

    // Update Summary Banner
    if (res.summary) {
      const totInv = document.getElementById('total-invoiced-sum');
      const totPaid = document.getElementById('total-paid-sum');
      const totRem = document.getElementById('total-remaining-sum');

      if (totInv) totInv.textContent = formatCurrency(res.summary.totalAmount);
      if (totPaid) totPaid.textContent = formatCurrency(res.summary.totalPaid);
      if (totRem) totRem.textContent = formatCurrency(res.summary.remaining);
    }

    renderFeesTable(res.data);
  } catch (err) {
    tbody.innerHTML = `<tr><td colspan="8" class="empty-state"><div class="empty-state-icon"><i class="fa-solid fa-receipt"></i></div><div class="empty-state-title">Failed to load fees</div><p class="empty-state-text">${escapeHtml(err.message)}</p></td></tr>`;
  }
}

// Render Fees Table
function renderFeesTable(fees) {
  const tbody = document.getElementById('fees-table-body');
  const user = API.getUser();
  const isAdmin = user && user.role === 'admin';

  if (!fees || fees.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="8" class="empty-state">
          <div class="empty-state-icon"><i class="fa-solid fa-file-invoice-dollar"></i></div>
          <div class="empty-state-title">No Fee Records Found</div>
          <p class="empty-state-text">No invoices matching current filter criteria.</p>
        </td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = fees.map(f => {
    const remaining = (f.amount || 0) - (f.paidAmount || 0);
    const statusClass = f.status.toLowerCase().replace(/\s+/g, '-');

    return `
      <tr>
        <td>
          <div style="font-weight:600;">${f.student ? escapeHtml(f.student.name) : 'Student'}</div>
          <div style="font-size:0.75rem; color:var(--text-light);">${f.student ? escapeHtml(f.student.studentId) : 'N/A'}</div>
        </td>
        <td>
          <div style="font-size:0.8125rem;">${escapeHtml(f.description || 'Hostel Fee')}</div>
          <div style="font-size:0.75rem; color:var(--text-light);">${f.transactionId ? `Txn: ${escapeHtml(f.transactionId)}` : 'No Txn ID'}</div>
        </td>
        <td style="font-weight:700;">${formatCurrency(f.amount)}</td>
        <td style="color:#16a34a; font-weight:600;">${formatCurrency(f.paidAmount)}</td>
        <td style="color:${remaining > 0 ? '#ef4444' : '#16a34a'}; font-weight:700;">${formatCurrency(remaining)}</td>
        <td>${formatDate(f.dueDate)}</td>
        <td>
          <span class="badge badge-${statusClass}">${f.status}</span>
        </td>
        <td>
          <div style="display:flex; gap:0.35rem;">
            ${isAdmin ? `
              <button class="btn btn-outline-primary btn-sm" title="Record Payment" onclick="openPaymentModal('${f._id}')">
                <i class="fa-solid fa-credit-card"></i> Pay
              </button>
              <button class="btn-icon" title="Edit Invoice" onclick="openEditFeeModal('${f._id}')">
                <i class="fa-solid fa-pen"></i>
              </button>
              <button class="btn-icon" title="Delete Fee" style="color:#ef4444;" onclick="confirmDeleteFee('${f._id}')">
                <i class="fa-solid fa-trash"></i>
              </button>
            ` : `
              <button class="btn btn-secondary btn-sm" onclick="viewFeeReceipt('${f._id}')">
                <i class="fa-solid fa-file-invoice"></i> Receipt
              </button>
            `}
          </div>
        </td>
      </tr>
    `;
  }).join('');
}

// Open Create Fee Modal (Admin)
async function openCreateFeeModal() {
  const form = document.getElementById('fee-form');
  if (form) form.reset();
  document.getElementById('fee-modal-title').textContent = 'Generate Fee Invoice';
  document.getElementById('fee-id-field').value = '';

  const select = document.getElementById('fee-student-select');
  select.innerHTML = '<option value="">Loading students...</option>';

  try {
    const res = await API.request('/students?limit=200');
    if (res.success) {
      select.innerHTML = '<option value="">-- Select Student --</option>' +
        res.data.map(s => `<option value="${s._id}">${escapeHtml(s.name)} (${escapeHtml(s.studentId)})</option>`).join('');
    }
    openModal('fee-modal');
  } catch (err) {
    showToast(err.message, 'error');
  }
}

// Open Edit Fee Modal
async function openEditFeeModal(id) {
  try {
    const res = await API.request(`/fees/${id}`);
    if (!res.success) return;
    const f = res.data;

    document.getElementById('fee-modal-title').textContent = 'Edit Fee Invoice';
    document.getElementById('fee-id-field').value = f._id;
    document.getElementById('modal-fee-amount').value = f.amount;
    document.getElementById('modal-fee-paid').value = f.paidAmount;
    document.getElementById('modal-fee-due-date').value = f.dueDate ? f.dueDate.substring(0, 10) : '';
    document.getElementById('modal-fee-method').value = f.paymentMethod || 'UPI';
    document.getElementById('modal-fee-txn').value = f.transactionId || '';
    document.getElementById('modal-fee-desc').value = f.description || '';

    const select = document.getElementById('fee-student-select');
    select.innerHTML = `<option value="${f.student._id}" selected>${escapeHtml(f.student.name)} (${escapeHtml(f.student.studentId)})</option>`;

    openModal('fee-modal');
  } catch (err) {
    showToast(err.message, 'error');
  }
}

// Save Fee (Create / Update)
async function handleSaveFee(e) {
  e.preventDefault();
  const id = document.getElementById('fee-id-field').value;
  const submitBtn = document.getElementById('save-fee-btn');

  const payload = {
    studentId: document.getElementById('fee-student-select').value,
    amount: Number(document.getElementById('modal-fee-amount').value),
    paidAmount: Number(document.getElementById('modal-fee-paid').value || 0),
    dueDate: document.getElementById('modal-fee-due-date').value,
    paymentMethod: document.getElementById('modal-fee-method').value,
    transactionId: document.getElementById('modal-fee-txn').value.trim(),
    description: document.getElementById('modal-fee-desc').value.trim()
  };

  try {
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<span class="spinner" style="width:1rem;height:1rem;border-width:2px;"></span> Processing...';

    if (id) {
      const res = await API.request(`/fees/${id}`, {
        method: 'PUT',
        body: payload
      });
      showToast(res.message, 'success');
    } else {
      const res = await API.request('/fees', {
        method: 'POST',
        body: payload
      });
      showToast(res.message, 'success');
    }

    closeModal('fee-modal');
    loadFees();
  } catch (err) {
    showToast(err.message, 'error');
  } finally {
    submitBtn.disabled = false;
    submitBtn.innerHTML = '<i class="fa-solid fa-check"></i> Save Invoice';
  }
}

// Open Record Payment Modal
async function openPaymentModal(feeId) {
  try {
    const res = await API.request(`/fees/${feeId}`);
    if (!res.success) return;
    const f = res.data;
    const remaining = (f.amount || 0) - (f.paidAmount || 0);

    document.getElementById('pay-fee-id').value = f._id;
    document.getElementById('pay-student-name').textContent = f.student.name;
    document.getElementById('pay-total-amount').textContent = formatCurrency(f.amount);
    document.getElementById('pay-already-paid').textContent = formatCurrency(f.paidAmount);
    document.getElementById('pay-remaining').textContent = formatCurrency(remaining);

    document.getElementById('pay-add-amount').value = remaining > 0 ? remaining : 0;
    document.getElementById('pay-txn-id').value = '';

    openModal('payment-modal');
  } catch (err) {
    showToast(err.message, 'error');
  }
}

// Submit Payment Update
async function handleRecordPayment(e) {
  e.preventDefault();
  const feeId = document.getElementById('pay-fee-id').value;
  const addAmount = Number(document.getElementById('pay-add-amount').value);
  const method = document.getElementById('pay-method').value;
  const txnId = document.getElementById('pay-txn-id').value.trim();

  if (addAmount <= 0) {
    showToast('Payment amount must be greater than zero', 'warning');
    return;
  }

  try {
    // Get existing fee to add up
    const feeRes = await API.request(`/fees/${feeId}`);
    const newPaidTotal = (feeRes.data.paidAmount || 0) + addAmount;

    const res = await API.request(`/fees/${feeId}`, {
      method: 'PUT',
      body: {
        paidAmount: newPaidTotal,
        paymentMethod: method,
        transactionId: txnId,
        paymentDate: new Date().toISOString()
      }
    });

    showToast('Payment recorded successfully!', 'success');
    closeModal('payment-modal');
    loadFees();
  } catch (err) {
    showToast(err.message, 'error');
  }
}

// View Fee Receipt for Student
async function viewFeeReceipt(id) {
  try {
    const res = await API.request(`/fees/${id}`);
    if (!res.success) return;
    const f = res.data;

    const content = document.getElementById('receipt-modal-content');
    if (!content) return;

    const remaining = (f.amount || 0) - (f.paidAmount || 0);

    content.innerHTML = `
      <div style="border: 2px dashed var(--border-color); padding: 1.5rem; border-radius: var(--radius-md); background: #ffffff;">
        <div style="text-align: center; border-bottom: 1px solid var(--border-color); padding-bottom: 1rem; margin-bottom: 1rem;">
          <h3 style="margin: 0; color: var(--primary);">HOSTEL FEE RECEIPT</h3>
          <p style="font-size: 0.8rem; color: var(--text-muted); margin: 0.25rem 0;">Official Payment Voucher</p>
        </div>

        <div style="display: flex; justify-content: space-between; font-size: 0.875rem; margin-bottom: 0.75rem;">
          <span><strong>Student:</strong> ${escapeHtml(f.student.name)} (${escapeHtml(f.student.studentId)})</span>
          <span><strong>Date:</strong> ${formatDate(f.paymentDate || f.createdAt)}</span>
        </div>

        <div style="display: flex; justify-content: space-between; font-size: 0.875rem; margin-bottom: 0.75rem;">
          <span><strong>Description:</strong> ${escapeHtml(f.description)}</span>
          <span><strong>Txn ID:</strong> ${escapeHtml(f.transactionId || 'N/A')}</span>
        </div>

        <div style="background: #f8fafc; padding: 1rem; border-radius: var(--radius-sm); margin: 1rem 0;">
          <div style="display:flex; justify-content:space-between; margin-bottom:0.35rem;">
            <span>Total Invoiced:</span>
            <strong>${formatCurrency(f.amount)}</strong>
          </div>
          <div style="display:flex; justify-content:space-between; margin-bottom:0.35rem; color:#16a34a;">
            <span>Amount Paid:</span>
            <strong>${formatCurrency(f.paidAmount)}</strong>
          </div>
          <div style="display:flex; justify-content:space-between; border-top:1px solid #e2e8f0; padding-top:0.35rem; font-weight:700;">
            <span>Outstanding Balance:</span>
            <span style="color:${remaining > 0 ? '#ef4444' : '#16a34a'};">${formatCurrency(remaining)}</span>
          </div>
        </div>

        <div style="text-align:center;">
          <span class="badge badge-${f.status.toLowerCase().replace(/\s+/g, '-')}" style="font-size:0.875rem; padding:0.35rem 1rem;">
            STATUS: ${f.status.toUpperCase()}
          </span>
        </div>
      </div>
    `;

    openModal('receipt-modal');
  } catch (err) {
    showToast(err.message, 'error');
  }
}

// Delete Fee
async function confirmDeleteFee(id) {
  if (confirm('Are you sure you want to delete this fee invoice?')) {
    try {
      const res = await API.request(`/fees/${id}`, { method: 'DELETE' });
      showToast(res.message, 'success');
      loadFees();
    } catch (err) {
      showToast(err.message, 'error');
    }
  }
}
