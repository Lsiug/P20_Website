const P20_USERS = {
  ambassador: { password: 'p20amb', role: 'ambassador', name: 'Ambassador' },
  staff:      { password: 'p20staff', role: 'staff', name: 'Staff' }
};

function p20Login(username, password) {
  const user = P20_USERS[username.toLowerCase().trim()];
  if (user && user.password === password) {
    sessionStorage.setItem('p20_user', JSON.stringify({
      username: username.toLowerCase().trim(),
      role: user.role,
      name: user.name
    }));
    return true;
  }
  return false;
}

function p20Logout() {
  sessionStorage.removeItem('p20_user');
  window.location.href = 'login.html';
}

function p20GetUser() {
  const d = sessionStorage.getItem('p20_user');
  return d ? JSON.parse(d) : null;
}

function p20RequireLogin() {
  if (!p20GetUser()) {
    window.location.href = 'login.html';
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
  const roleLabel = user.role === 'staff' ? 'Staff' : 'Ambassador';
  el.innerHTML = `
    <span class="nav-username">&#128100; ${roleLabel}</span>
    <button class="btn-logout" onclick="p20Logout()">Log out</button>
  `;
}
