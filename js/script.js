const pill = document.getElementById('pill-nav');
if (pill) {
  let dragging = false, ox = 0, oy = 0;

  pill.addEventListener('mousedown', e => {
    if (e.target.tagName === 'A' || e.target.tagName === 'BUTTON') return;
    dragging = true;
    const r = pill.getBoundingClientRect();
    ox = e.clientX - r.left;
    oy = e.clientY - r.top;
    pill.style.right  = 'auto';
    pill.style.bottom = 'auto';
    pill.style.transform = 'none';
    pill.style.left = r.left + 'px';
    pill.style.top  = r.top  + 'px';
    e.preventDefault();
  });

  document.addEventListener('mousemove', e => {
    if (!dragging) return;
    pill.style.left = (e.clientX - ox) + 'px';
    pill.style.top  = (e.clientY - oy) + 'px';
  });

  document.addEventListener('mouseup', () => {
    if (!dragging) return;
    dragging = false;
    snapToEdge();
  });

  function snapToEdge() {
    const r  = pill.getBoundingClientRect();
    const cx = r.left + r.width  / 2;
    const cy = r.top  + r.height / 2;
    const W  = window.innerWidth;
    const H  = window.innerHeight;

    const distances = { left: cx, right: W - cx, top: cy, bottom: H - cy };
    const nearest   = Object.keys(distances).reduce((a, b) => distances[a] < distances[b] ? a : b);

    // Set all sides to auto first so CSS defaults can't interfere
    pill.style.left      = 'auto';
    pill.style.top       = 'auto';
    pill.style.right     = 'auto';
    pill.style.bottom    = 'auto';
    pill.style.transform = 'none';
    pill.classList.remove('pill-horizontal');

    if (nearest === 'left') {
      pill.style.left      = '1.5rem';
      pill.style.top       = '50%';
      pill.style.transform = 'translateY(-50%)';
    } else if (nearest === 'right') {
      pill.style.right     = '1.5rem';
      pill.style.top       = '50%';
      pill.style.transform = 'translateY(-50%)';
    } else if (nearest === 'top') {
      pill.classList.add('pill-horizontal');
      pill.style.top       = '1.5rem';
      pill.style.left      = '50%';
      pill.style.transform = 'translateX(-50%)';
    } else {
      pill.classList.add('pill-horizontal');
      pill.style.bottom    = '1.5rem';
      pill.style.left      = '50%';
      pill.style.transform = 'translateX(-50%)';
    }
  }
}
