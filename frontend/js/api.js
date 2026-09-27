/**
 * Hostel Management System - Central API Client & Utilities
 */

const API_BASE = '/api';

const API = {
  // Get stored auth token
  getToken() {
    return localStorage.getItem('hostel_token');
  },

  // Set auth token and user
  setAuth(token, user) {
    localStorage.setItem('hostel_token', token);
    localStorage.setItem('hostel_user', JSON.stringify(user));
  },

  // Get current user
  getUser() {
    try {
      const user = localStorage.getItem('hostel_user');
      return user ? JSON.parse(user) : null;
    } catch (e) {
      return null;
    }
  },

  // Clear auth session
  clearAuth() {
    localStorage.removeItem('hostel_token');
    localStorage.removeItem('hostel_user');
  },

  // Central fetch wrapper
  async request(endpoint, options = {}) {
    const url = `${API_BASE}${endpoint.startsWith('/') ? endpoint : '/' + endpoint}`;
    const token = this.getToken();

    const headers = {
      'Content-Type': 'application/json',
      ...(options.headers || {})
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const config = {
      method: options.method || 'GET',
      headers,
      ...options
    };

    if (options.body && typeof options.body === 'object') {
      config.body = JSON.stringify(options.body);
    }

    try {
      const response = await fetch(url, config);
      const data = await response.json();

      if (response.status === 401) {
        // Unauthorized or expired session
        this.clearAuth();
        if (!window.location.pathname.includes('login.html') && !window.location.pathname.endsWith('index.html')) {
          window.location.href = '/login.html?expired=true';
        }
        throw new Error(data.message || 'Session expired. Please login again.');
      }

      if (!response.ok) {
        throw new Error(data.message || 'An error occurred while processing your request.');
      }

      return data;
    } catch (err) {
      console.error(`API Error [${options.method || 'GET'} ${endpoint}]:`, err.message);
      throw err;
    }
  }
};

// UI Helper: Toast Notifications
function showToast(message, type = 'info', duration = 3500) {
  let container = document.getElementById('toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    document.body.appendChild(container);
  }

  const icons = {
    success: 'fa-check-circle',
    error: 'fa-exclamation-circle',
    warning: 'fa-triangle-exclamation',
    info: 'fa-circle-info'
  };

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.innerHTML = `
    <div style="display: flex; align-items: center; gap: 0.75rem;">
      <i class="fa-solid ${icons[type] || icons.info}" style="font-size: 1.1rem;"></i>
      <span>${escapeHtml(message)}</span>
    </div>
    <button style="background:none; border:none; color:inherit; cursor:pointer; opacity:0.6;" onclick="this.parentElement.remove()">
      <i class="fa-solid fa-xmark"></i>
    </button>
  `;

  container.appendChild(toast);

  setTimeout(() => {
    toast.style.animation = 'slideInRight 0.3s ease-out reverse forwards';
    setTimeout(() => toast.remove(), 300);
  }, duration);
}

// Modal Helpers
function openModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
  }
}

function closeModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.classList.remove('active');
    document.body.style.overflow = '';
  }
}

// Global click outside modal to close
document.addEventListener('click', (e) => {
  if (e.target.classList.contains('modal-overlay')) {
    e.target.classList.remove('active');
    document.body.style.overflow = '';
  }
});

// Format Indian Currency (INR)
function formatCurrency(amount) {
  if (amount === undefined || amount === null) return '₹0';
  return '₹' + Number(amount).toLocaleString('en-IN');
}

// Format Readable Date
function formatDate(dateString) {
  if (!dateString) return 'N/A';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return 'N/A';
  return date.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });
}

// XSS Sanitizer
function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
