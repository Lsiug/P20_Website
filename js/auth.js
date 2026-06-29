async function p20Login(username, password) {
  const res = await fetch('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: username.trim(), password })
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Login failed');
  }
  const user = await res.json();
  sessionStorage.setItem('p20_user', JSON.stringify(user));
  return user;
}

async function p20Logout() {
  await fetch('/api/auth/logout', { method: 'POST' }).catch(() => {});
  sessionStorage.removeItem('p20_user');
  window.location.href = 'login.html';
}

function p20GetUser() {
  const d = sessionStorage.getItem('p20_user');
  return d ? JSON.parse(d) : null;
}

async function p20RequireLogin() {
  try {
    const res = await fetch('/api/auth/me');
    if (!res.ok) throw new Error('unauthenticated');
    const user = await res.json();
    sessionStorage.setItem('p20_user', JSON.stringify(user));
    const page = location.pathname.split('/').pop();
    if (user.role === 'ambassador' && !user.onboarding_complete && page !== 'onboarding.html') {
      window.location.href = 'onboarding.html';
      return null;
    }
    return user;
  } catch {
    sessionStorage.removeItem('p20_user');
    window.location.href = 'login.html';
    return null;
  }
}

function p20IsStaff() {
  const u = p20GetUser();
  return u && u.role === 'staff';
}

function p20InitHeader() {
  const user = p20GetUser();
  const el = document.getElementById('nav-user');
  if (!el || !user) return;
  if (user.role === 'staff') {
    el.innerHTML = `
      <span class="nav-username">&#128100; Staff</span>
      <a href="admin.html" class="nav-admin-link">Admin Dashboard</a>
      <button class="btn-logout" onclick="p20Logout()">Log out</button>
    `;
  } else {
    el.innerHTML = `
      <span class="nav-username">&#128100; Ambassador</span>
      <a href="profile.html" class="nav-profile-link">My Profile</a>
      <button class="btn-logout" onclick="p20Logout()">Log out</button>
    `;
  }
}
