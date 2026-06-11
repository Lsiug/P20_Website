const sidebar = document.getElementById('sidebar');
const overlay = document.getElementById('sidebar-overlay');
const toggleBtn = document.getElementById('sidebar-toggle');
const closeBtn = document.getElementById('sidebar-close');

function openSidebar() {
  sidebar.classList.add('open');
  overlay.classList.add('open');
}

function closeSidebar() {
  sidebar.classList.remove('open');
  overlay.classList.remove('open');
}

if (toggleBtn) toggleBtn.addEventListener('click', openSidebar);
if (closeBtn)  closeBtn.addEventListener('click', closeSidebar);
if (overlay)   overlay.addEventListener('click', closeSidebar);
