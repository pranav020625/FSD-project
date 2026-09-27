/**
 * Hostel Management System - Authentication & Route Guards
 */

// Route Guard - Check user session & role
function checkAuth(requiredRole = null) {
  const token = API.getToken();
  const user = API.getUser();

  if (!token || !user) {
    window.location.href = '/login.html';
    return null;
  }

  if (requiredRole && user.role !== requiredRole) {
    // Redirect to respective dashboard if trying to access wrong role page
    if (user.role === 'admin') {
      window.location.href = '/admin/dashboard.html';
    } else {
      window.location.href = '/student/dashboard.html';
    }
    return null;
  }

  // Populate sidebar user details if elements exist
  populateUserInfo(user);
  return user;
}

// Redirect logged-in users away from login/register pages
function redirectIfLoggedIn() {
  const token = API.getToken();
  const user = API.getUser();

  if (token && user) {
    if (user.role === 'admin') {
      window.location.href = '/admin/dashboard.html';
    } else {
      window.location.href = '/student/dashboard.html';
    }
  }
}

// Populate user details in sidebar/topbar
function populateUserInfo(user) {
  const nameEl = document.getElementById('sidebar-user-name');
  const roleEl = document.getElementById('sidebar-user-role');
  const avatarEl = document.getElementById('sidebar-user-avatar');

  if (nameEl && user.name) nameEl.textContent = user.name;
  if (roleEl && user.role) roleEl.textContent = user.role.toUpperCase();
  if (avatarEl && user.name) {
    avatarEl.textContent = user.name.charAt(0).toUpperCase();
  }
}

// Handle Login Form Submission
async function handleLogin(e) {
  e.preventDefault();
  const emailInput = document.getElementById('login-email');
  const passwordInput = document.getElementById('login-password');
  const submitBtn = document.getElementById('login-btn');

  const email = emailInput.value.trim();
  const password = passwordInput.value;

  if (!email || !password) {
    showToast('Please enter both email and password', 'warning');
    return;
  }

  try {
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<span class="spinner" style="width:1rem;height:1rem;border-width:2px;"></span> Authenticating...';

    const res = await API.request('/auth/login', {
      method: 'POST',
      body: { email, password }
    });

    if (res.success && res.data.token) {
      API.setAuth(res.data.token, res.data.user);
      showToast(`Welcome back, ${res.data.user.name}!`, 'success');

      setTimeout(() => {
        if (res.data.user.role === 'admin') {
          window.location.href = '/admin/dashboard.html';
        } else {
          window.location.href = '/student/dashboard.html';
        }
      }, 800);
    }
  } catch (err) {
    showToast(err.message, 'error');
  } finally {
    submitBtn.disabled = false;
    submitBtn.innerHTML = '<i class="fa-solid fa-arrow-right-to-bracket"></i> Sign In to Portal';
  }
}

// Handle Student Registration
async function handleRegister(e) {
  e.preventDefault();
  const form = document.getElementById('register-form');
  const submitBtn = document.getElementById('register-btn');

  const formData = new FormData(form);
  const data = Object.fromEntries(formData.entries());

  if (!data.name || !data.email || !data.password || !data.studentId) {
    showToast('Please fill all required fields', 'warning');
    return;
  }

  if (data.password.length < 6) {
    showToast('Password must be at least 6 characters long', 'warning');
    return;
  }

  try {
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<span class="spinner" style="width:1rem;height:1rem;border-width:2px;"></span> Registering...';

    const res = await API.request('/auth/register', {
      method: 'POST',
      body: data
    });

    if (res.success) {
      API.setAuth(res.data.token, res.data.user);
      showToast('Registration successful! Redirecting...', 'success');
      setTimeout(() => {
        window.location.href = '/student/dashboard.html';
      }, 1000);
    }
  } catch (err) {
    showToast(err.message, 'error');
  } finally {
    submitBtn.disabled = false;
    submitBtn.innerHTML = '<i class="fa-solid fa-user-plus"></i> Create Account';
  }
}

// Handle User Logout
function logoutUser() {
  API.clearAuth();
  showToast('Logged out successfully', 'info');
  setTimeout(() => {
    window.location.href = '/login.html';
  }, 500);
}

// Toggle Mobile Sidebar Drawer
function toggleMobileSidebar() {
  const sidebar = document.querySelector('.sidebar');
  let backdrop = document.querySelector('.sidebar-backdrop');

  if (!backdrop) {
    backdrop = document.createElement('div');
    backdrop.className = 'sidebar-backdrop';
    backdrop.onclick = toggleMobileSidebar;
    document.body.appendChild(backdrop);
  }

  sidebar.classList.toggle('mobile-open');
  backdrop.classList.toggle('active');
}
